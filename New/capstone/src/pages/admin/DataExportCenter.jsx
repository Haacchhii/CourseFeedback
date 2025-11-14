import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DataExportCenter() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const [activeTab, setActiveTab] = useState('quick')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const [dateRange, setDateRange] = useState('all')
  const [includeFilters, setIncludeFilters] = useState({
    users: true,
    courses: true,
    evaluations: true,
    analytics: true,
    auditLogs: false
  })

  const [scheduleSettings, setScheduleSettings] = useState({
    frequency: 'weekly',
    dayOfWeek: 'Monday',
    time: '02:00',
    format: 'csv',
    recipients: currentUser?.email || ''
  })
  
  // API State
  const [exportHistory, setExportHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    courses: { total: 0 },
    evaluations: { total: 0 }
  })

  // Redirect if not system admin
  useEffect(() => {
    if (!currentUser || !isSystemAdmin(currentUser)) {
      navigate('/admin/dashboard')
    }
  }, [currentUser, navigate])
  
  // Fetch export history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const response = await adminAPI.getExportHistory()
        const data = response?.data || response
        // Extract exports array if it exists, otherwise use empty array
        setExportHistory(data?.exports || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  // Fetch dashboard stats for real-time counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats()
        const data = response.data || response // Handle both {data: {...}} and direct response
        setStats({
          users: { total: data.totalUsers || 0, active: data.activeUsers || 0 },
          courses: { total: data.totalCourses || 0 },
          evaluations: { total: data.totalEvaluations || 0 }
        })
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      }
    }
    fetchStats()
  }, [])

  const handleQuickExport = async (type) => {
    try {
      setExporting(true)
      let data
      const timestamp = new Date().toISOString().split('T')[0]
      
      // Convert frontend formats to backend-compatible formats
      // Backend only supports 'json' and 'csv'
      const backendFormat = (exportFormat === 'excel' || exportFormat === 'pdf') 
        ? (exportFormat === 'excel' ? 'csv' : 'json') 
        : exportFormat
      
      if (type === 'All Users') {
        data = await adminAPI.exportUsers({ format: backendFormat })
        downloadData(data, `users_export_${timestamp}.${exportFormat}`, exportFormat)
      } else if (type === 'All Evaluations') {
        data = await adminAPI.exportEvaluations({ format: backendFormat, dateRange })
        downloadData(data, `evaluations_export_${timestamp}.${exportFormat}`, exportFormat)
      } else if (type === 'All Courses') {
        data = await adminAPI.exportCourses({ format: backendFormat })
        downloadData(data, `courses_export_${timestamp}.${exportFormat}`, exportFormat)
      } else if (type === 'Analytics Report') {
        data = await adminAPI.exportAnalytics({ format: backendFormat, dateRange })
        downloadData(data, `analytics_export_${timestamp}.${exportFormat}`, exportFormat)
      }
      
      // Refresh history
      try {
        const updatedHistory = await adminAPI.getExportHistory()
        const historyData = updatedHistory?.data || updatedHistory
        setExportHistory(historyData?.exports || [])
      } catch (historyErr) {
        console.log('Could not refresh export history:', historyErr)
      }
      
      alert(`${type} exported successfully!`)
    } catch (err) {
      console.error('Export error:', err)
      // Extract meaningful error message
      let errorMessage = 'Unknown error occurred'
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err?.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err?.detail) {
        errorMessage = err.detail
      }
      alert(`Export failed: ${errorMessage}`)
    } finally {
      setExporting(false)
    }
  }
  
  const downloadData = (responseData, filename, format) => {
    let blob
    
    // Extract the actual data from response
    const data = responseData?.data || responseData
    
    console.log('downloadData called with format:', format)
    console.log('Data structure:', Array.isArray(data) ? `Array with ${data.length} items` : typeof data)
    
    // Handle different formats
    if (format === 'json') {
      // Convert JSON to string and create blob
      const jsonString = JSON.stringify(data, null, 2)
      blob = new Blob([jsonString], { type: 'application/json' })
    } else if (format === 'csv') {
      // Convert JSON to CSV
      const csvContent = convertToCSV(data)
      blob = new Blob([csvContent], { type: 'text/csv' })
    } else if (format === 'excel') {
      // Excel format - export as CSV (Excel can open CSV)
      const csvContent = convertToCSV(data)
      blob = new Blob([csvContent], { type: 'text/csv' })
      // Update filename to .csv
      filename = filename.replace('.excel', '.csv')
      console.log('Note: Exporting as CSV format (Excel compatible)')
    } else if (format === 'pdf') {
      // Generate actual PDF
      generatePDF(data, filename)
      return // PDF generation handles download internally
    } else {
      // Fallback to JSON
      const jsonString = JSON.stringify(data, null, 2)
      blob = new Blob([jsonString], { type: 'application/json' })
    }
    
    // Download the blob
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data) => {
    // Handle custom export format (object with multiple arrays)
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
      // Check if this is a custom export with multiple tables
      const hasArrayValues = Object.values(data).some(val => Array.isArray(val))
      if (hasArrayValues) {
        // Combine all arrays into CSV sections
        let csvOutput = ''
        Object.entries(data).forEach(([tableName, tableData]) => {
          if (Array.isArray(tableData) && tableData.length > 0) {
            csvOutput += `\n${tableName.toUpperCase()}\n`
            const headers = Object.keys(tableData[0])
            csvOutput += headers.join(',') + '\n'
            tableData.forEach(row => {
              const csvRow = headers.map(header => {
                const value = row[header]
                if (value === null || value === undefined) return ''
                const stringValue = String(value)
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                  return `"${stringValue.replace(/"/g, '""')}"`
                }
                return stringValue
              }).join(',')
              csvOutput += csvRow + '\n'
            })
          }
        })
        return csvOutput
      }
    }
    
    // Standard array handling
    if (!Array.isArray(data) || data.length === 0) {
      return ''
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    // Convert each row to CSV
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in values
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    })
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  const generatePDF = (data, filename) => {
    console.log('generatePDF called with filename:', filename)
    console.log('Data type:', Array.isArray(data) ? 'Array' : typeof data)
    console.log('Data length:', Array.isArray(data) ? data.length : 'N/A')
    
    try {
      const doc = new jsPDF()
      
      // Add title
      const title = filename.replace('.pdf', '').replace(/_/g, ' ').toUpperCase()
      doc.setFontSize(16)
      doc.text(title, 14, 20)
      
      // Add metadata
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      
      // Check if this is custom export format (object with multiple tables)
      const isCustomExport = typeof data === 'object' && !Array.isArray(data) && data !== null &&
                             Object.values(data).some(val => Array.isArray(val))
      
      if (isCustomExport) {
        // Handle custom export with multiple tables
        let currentY = 40
        let totalRecords = 0
        
        Object.entries(data).forEach(([tableName, tableData]) => {
          if (Array.isArray(tableData) && tableData.length > 0) {
            totalRecords += tableData.length
            
            // Add section title
            if (currentY > 250) {
              doc.addPage()
              currentY = 20
            }
            
            doc.setFontSize(12)
            doc.setFont(undefined, 'bold')
            doc.text(tableName.toUpperCase(), 14, currentY)
            doc.setFont(undefined, 'normal')
            currentY += 10
            
            // Get headers and prepare data
            const headers = Object.keys(tableData[0])
            const tableRows = tableData.map(row => 
              headers.map(header => {
                const value = row[header]
                if (value === null || value === undefined) return ''
                if (typeof value === 'object') return JSON.stringify(value)
                return String(value)
              })
            )
            
            // Add table
            autoTable(doc, {
              head: [headers],
              body: tableRows,
              startY: currentY,
              styles: { fontSize: 8, cellPadding: 2 },
              headStyles: { fillColor: [41, 128, 185], textColor: 255 },
              alternateRowStyles: { fillColor: [245, 245, 245] },
              margin: { top: 10 },
            })
            
            currentY = doc.lastAutoTable.finalY + 15
          }
        })
        
        // Update total records in header
        doc.setFontSize(10)
        doc.text(`Total Records: ${totalRecords}`, 14, 34)
        
      } else if (Array.isArray(data) && data.length > 0) {
        // Standard array export
        doc.text(`Total Records: ${data.length}`, 14, 34)
        
        // Get headers from first object
        const headers = Object.keys(data[0])
        
        // Prepare table data
        const tableData = data.map(row => 
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            if (typeof value === 'object') return JSON.stringify(value)
            return String(value)
          })
        )
        
        // Add table using autoTable
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: 40,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: 40 },
        })
      } else if (typeof data === 'object' && data !== null) {
        // For non-array data (like analytics), display as key-value pairs
        let yPosition = 40
        doc.setFontSize(10)
        
        const displayObject = (obj, indent = 0) => {
          Object.entries(obj).forEach(([key, value]) => {
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }
            
            const xPosition = 14 + (indent * 10)
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              doc.setFont(undefined, 'bold')
              doc.text(`${key}:`, xPosition, yPosition)
              doc.setFont(undefined, 'normal')
              yPosition += 6
              displayObject(value, indent + 1)
            } else {
              doc.text(`${key}: ${String(value)}`, xPosition, yPosition)
              yPosition += 6
            }
          })
        }
        
        displayObject(data)
      } else {
        doc.text('No data available', 14, 40)
      }
      
      // Save the PDF
      doc.save(filename)
      console.log('PDF generated successfully')
    } catch (err) {
      console.error('Error generating PDF:', err)
      // Fallback to JSON export
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename.replace('.pdf', '.json')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      alert('PDF generation failed. Downloaded as JSON instead.')
    }
  }

  const handleCustomExport = async () => {
    try {
      setExporting(true)
      const selected = Object.entries(includeFilters).filter(([_, v]) => v).map(([k, _]) => k)
      
      // Convert frontend formats to backend-compatible formats
      // Backend only supports 'json' and 'csv'
      const backendFormat = (exportFormat === 'excel' || exportFormat === 'pdf') 
        ? (exportFormat === 'excel' ? 'csv' : 'json') 
        : exportFormat
      
      const data = await adminAPI.exportCustom({ 
        tables: selected,
        format: backendFormat,
        dateRange 
      })
      const timestamp = new Date().toISOString().split('T')[0]
      downloadData(data, `custom_export_${timestamp}.${exportFormat}`, exportFormat)
      
      // Refresh history
      try {
        const updatedHistory = await adminAPI.getExportHistory()
        const historyData = updatedHistory?.data || updatedHistory
        setExportHistory(historyData?.exports || [])
      } catch (historyErr) {
        console.log('Could not refresh export history:', historyErr)
      }
      
      alert(`Custom data exported successfully!`)
    } catch (err) {
      console.error('Export error:', err)
      // Extract meaningful error message
      let errorMessage = 'Unknown error occurred'
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err?.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err?.detail) {
        errorMessage = err.detail
      }
      alert(`Export failed: ${errorMessage}`)
    } finally {
      setExporting(false)
    }
  }

  const handleScheduleExport = (e) => {
    e.preventDefault()
    alert(`Scheduled ${scheduleSettings.frequency} exports to ${scheduleSettings.recipients}`)
    setShowScheduleModal(false)
  }

  const handleDownload = (file) => {
    alert(`Downloading ${file.filename}...`)
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading export center...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-bold mb-2">Error Loading Export Center</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 shadow-xl border-b-4 border-green-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Data Export Center</h1>
                <p className="text-green-100 text-sm mt-1">Export system data in multiple formats</p>
              </div>
            </div>
            <button onClick={() => setShowScheduleModal(true)} className="bg-white hover:bg-green-50 text-green-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Schedule Export</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'quick'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚡ Quick Export
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 Custom Export
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📜 Export History
          </button>
        </div>

        {/* Quick Export Tab */}
        {activeTab === 'quick' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-900 font-semibold mb-1">⚡ Quick Export Options</p>
              <p className="text-sm text-blue-700">Export commonly requested data sets with one click.</p>
            </div>

            {/* Format Selector */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Select Export Format</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {['csv', 'excel', 'pdf', 'json'].map(format => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      exportFormat === format
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">
                      {format === 'csv' && '📊'}
                      {format === 'excel' && '📈'}
                      {format === 'pdf' && '📄'}
                      {format === 'json' && '🔧'}
                    </div>
                    <p className="font-bold text-gray-900">{format.toUpperCase()}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Export Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">All Users</h3>
                    <p className="text-sm text-gray-600">{stats.users.total} total users</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Export complete user database including students, heads, and administrators.</p>
                <button
                  onClick={() => handleQuickExport('All Users')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <span>Export Users →</span>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">All Courses</h3>
                    <p className="text-sm text-gray-600">{stats.courses.total} courses</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Export all course data including instructors, programs, and enrollment info.</p>
                <button
                  onClick={() => handleQuickExport('All Courses')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Export Courses →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">All Evaluations</h3>
                    <p className="text-sm text-gray-600">{stats.evaluations.total} evaluations</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Export all evaluation responses with ratings and comments.</p>
                <button
                  onClick={() => handleQuickExport('All Evaluations')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Export Evaluations →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Analytics Report</h3>
                    <p className="text-sm text-gray-600">Comprehensive insights</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Export complete analytics including sentiment, trends, and statistics.</p>
                <button
                  onClick={() => handleQuickExport('Analytics Report')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Export Analytics →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-red-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Audit Logs</h3>
                    <p className="text-sm text-gray-600">Security & activity logs</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Export system audit logs for compliance and security review.</p>
                <button
                  onClick={() => handleQuickExport('Audit Logs')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Export Logs →
                </button>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all text-white">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Full System Export</h3>
                    <p className="text-sm text-indigo-100">Complete backup</p>
                  </div>
                </div>
                <p className="text-sm text-indigo-100 mb-4">Export all system data including users, courses, evaluations, and settings.</p>
                <button
                  onClick={() => handleQuickExport('Full System')}
                  className="w-full bg-white hover:bg-indigo-50 text-indigo-600 font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  Export Everything →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Custom Export Tab */}
        {activeTab === 'custom' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Custom Export Configuration</h2>
            
            <div className="space-y-6">
              {/* What to Include */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Data to Export</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.users}
                      onChange={(e) => setIncludeFilters({...includeFilters, users: e.target.checked})}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">User Data</span>
                      <p className="text-xs text-gray-600">All user accounts, roles, and permissions</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.courses}
                      onChange={(e) => setIncludeFilters({...includeFilters, courses: e.target.checked})}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Course Data</span>
                      <p className="text-xs text-gray-600">All courses, instructors, and schedules</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.evaluations}
                      onChange={(e) => setIncludeFilters({...includeFilters, evaluations: e.target.checked})}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Evaluation Data</span>
                      <p className="text-xs text-gray-600">All evaluation responses and ratings</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.analytics}
                      onChange={(e) => setIncludeFilters({...includeFilters, analytics: e.target.checked})}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Analytics Data</span>
                      <p className="text-xs text-gray-600">Sentiment analysis, trends, and statistics</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.auditLogs}
                      onChange={(e) => setIncludeFilters({...includeFilters, auditLogs: e.target.checked})}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Audit Logs</span>
                      <p className="text-xs text-gray-600">System activity and security logs</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Date Range</h3>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="semester">Current Semester</option>
                  <option value="year">Academic Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Export Format</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {['csv', 'excel', 'pdf', 'json'].map(format => (
                    <button
                      key={format}
                      onClick={() => setExportFormat(format)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        exportFormat === format
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className="font-bold text-gray-900">{format.toUpperCase()}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCustomExport}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all"
              >
                📥 Export Custom Data
              </button>
            </div>
          </div>
        )}

        {/* Export History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">📜 Export History</h2>
              <p className="text-sm text-gray-600 mt-1">View and download previous exports</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Filename</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Format</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Size</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exportHistory.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{file.filename}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.type}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                          {file.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(file.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {file.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-all"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Export Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 border-b-4 border-green-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">⏰ Schedule Automatic Export</h2>
                <button onClick={() => setShowScheduleModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleScheduleExport} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                <select
                  value={scheduleSettings.frequency}
                  onChange={(e) => setScheduleSettings({...scheduleSettings, frequency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {scheduleSettings.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Week</label>
                  <select
                    value={scheduleSettings.dayOfWeek}
                    onChange={(e) => setScheduleSettings({...scheduleSettings, dayOfWeek: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleSettings.time}
                  onChange={(e) => setScheduleSettings({...scheduleSettings, time: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Format</label>
                <select
                  value={scheduleSettings.format}
                  onChange={(e) => setScheduleSettings({...scheduleSettings, format: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Recipients</label>
                <input
                  type="email"
                  value={scheduleSettings.recipients}
                  onChange={(e) => setScheduleSettings({...scheduleSettings, recipients: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                >
                  Schedule Export
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
