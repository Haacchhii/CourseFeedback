import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AlertModal } from '../../components/Modal'
import CustomDropdown from '../../components/CustomDropdown'

export default function DataExportCenter() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const [activeTab, setActiveTab] = useState('quick')
  const [exportFormat, setExportFormat] = useState('csv')
  const [dateRange, setDateRange] = useState('all')
  const [includeFilters, setIncludeFilters] = useState({
    users: true,
    courses: true,
    evaluations: true,
    analytics: true,
    auditLogs: false
  })
  
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedExportType, setSelectedExportType] = useState('')
  const [modalFormat, setModalFormat] = useState('csv')
  const [exportFilters, setExportFilters] = useState({
    // User filters
    userRole: 'all',
    userProgram: 'all',
    userStatus: 'all',
    // Evaluation filters
    evalDateRange: 'all',
    evalProgram: 'all',
    evalSemester: 'all',
    evalInstructor: 'all',
    // Course filters
    courseProgram: 'all',
    courseStatus: 'all',
    courseYearLevel: 'all',
    // Analytics filters
    analyticsReportType: 'summary',
    analyticsDateRange: 'semester',
    // Audit log filters
    auditDateRange: 'all',
    auditAction: 'all',
    auditUser: 'all',
    auditCategory: 'all',
    auditSeverity: 'all'
  })

  // Modal State
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' })

  // Modal Helper Function
  const showAlert = (message, title = 'Notification', type = 'info') => {
    setAlertConfig({ title, message, type })
    setShowAlertModal(true)
  }
  
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
  const [programs, setPrograms] = useState([])
  const [evaluationPeriods, setEvaluationPeriods] = useState([])

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

  // Fetch programs for filter dropdowns
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await adminAPI.getPrograms()
        setPrograms(response?.data || [])
      } catch (err) {
        console.error('Failed to fetch programs:', err)
      }
    }
    fetchPrograms()
  }, [])

  // Fetch evaluation periods for filter dropdowns
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const response = await adminAPI.getPeriods()
        setEvaluationPeriods(response?.data || [])
      } catch (err) {
        console.error('Failed to fetch evaluation periods:', err)
      }
    }
    fetchPeriods()
  }, [])

  const handleQuickExport = (type) => {
    // Open export modal with selected type
    setSelectedExportType(type)
    setModalFormat('csv') // Reset to default
    // Reset filters to defaults
    setExportFilters({
      userRole: 'all',
      userProgram: 'all',
      userStatus: 'all',
      evalDateRange: 'all',
      evalProgram: 'all',
      evalPeriod: 'all',
      courseProgram: 'all',
      courseYearLevel: 'all',
      analyticsReportType: 'summary',
      analyticsDateRange: 'semester',
      auditDateRange: 'all',
      auditAction: 'all',
      auditUser: 'all',
      auditCategory: 'all',
      auditSeverity: 'all'
    })
    setShowExportModal(true)
  }

  const handleConfirmExport = async () => {
    try {
      setExporting(true)
      let data
      const timestamp = new Date().toISOString().split('T')[0]
      
      // Convert frontend formats to backend-compatible formats
      const backendFormat = (modalFormat === 'excel' || modalFormat === 'pdf') 
        ? (modalFormat === 'excel' ? 'csv' : 'json') 
        : modalFormat
      
      // Build options object with filters
      const options = { format: backendFormat }
      
      if (selectedExportType === 'All Users') {
        if (exportFilters.userRole !== 'all') options.role = exportFilters.userRole
        if (exportFilters.userProgram !== 'all') options.program = exportFilters.userProgram
        if (exportFilters.userStatus !== 'all') options.status = exportFilters.userStatus
        data = await adminAPI.exportUsers(options)
        downloadData(data, `users_export_${timestamp}.${modalFormat}`, modalFormat)
      } else if (selectedExportType === 'All Evaluations') {
        if (exportFilters.evalDateRange !== 'all') options.dateRange = exportFilters.evalDateRange
        if (exportFilters.evalProgram !== 'all') options.program = exportFilters.evalProgram
        if (exportFilters.evalPeriod !== 'all') options.period_id = exportFilters.evalPeriod
        data = await adminAPI.exportEvaluations(options)
        downloadData(data, `evaluations_export_${timestamp}.${modalFormat}`, modalFormat)
      } else if (selectedExportType === 'All Courses') {
        if (exportFilters.courseProgram !== 'all') options.program = exportFilters.courseProgram
        if (exportFilters.courseStatus !== 'all') options.status = exportFilters.courseStatus
        if (exportFilters.courseYearLevel !== 'all') options.year_level = exportFilters.courseYearLevel
        data = await adminAPI.exportCourses(options)
        downloadData(data, `courses_export_${timestamp}.${modalFormat}`, modalFormat)
      } else if (selectedExportType === 'Audit Logs') {
        if (exportFilters.auditDateRange !== 'all') options.dateRange = exportFilters.auditDateRange
        if (exportFilters.auditAction !== 'all') options.action = exportFilters.auditAction
        if (exportFilters.auditUser !== 'all') options.user = exportFilters.auditUser
        if (exportFilters.auditCategory !== 'all') options.category = exportFilters.auditCategory
        if (exportFilters.auditSeverity !== 'all') options.severity = exportFilters.auditSeverity
        data = await adminAPI.exportAuditLogs(options)
        downloadData(data, `audit_logs_export_${timestamp}.${modalFormat}`, modalFormat)
      } else if (selectedExportType === 'Full System') {
        data = await adminAPI.exportFullSystem(options)
        downloadData(data, `full_system_export_${timestamp}.${modalFormat}`, modalFormat)
      }
      
      // Close modal first
      setShowExportModal(false)
      
      // Show success message
      showAlert(`${selectedExportType} exported successfully!`, 'Export Complete', 'success')
      
      // Force refresh history after a short delay to allow backend to save export record
      setTimeout(async () => {
        try {
          const updatedHistory = await adminAPI.getExportHistory()
          const historyData = updatedHistory?.data || updatedHistory
          setExportHistory(historyData?.exports || [])
        } catch (historyErr) {
          console.error('Could not refresh export history:', historyErr)
        }
      }, 500)
    } catch (err) {
      console.error('Export error:', err)
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
      showAlert(errorMessage, 'Export Failed', 'error')
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
    
    // Check if data is empty
    if (Array.isArray(data) && data.length === 0) {
      showAlert('No data found matching the selected filters. Please adjust your filters and try again.', 'No Data Found', 'warning')
      return
    }
    
    // Check for null/undefined data
    if (!data) {
      showAlert('No data received from server.', 'Export Failed', 'error')
      return
    }
    
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
      showAlert('PDF generation failed. Downloaded as JSON instead.', 'PDF Generation Failed', 'warning')
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
      
      showAlert('Custom data exported successfully!', 'Export Complete', 'success')
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
      showAlert(errorMessage, 'Export Failed', 'error')
    } finally {
      setExporting(false)
    }
  }



  const handleDownload = (file) => {
    showAlert(`Downloading ${file.filename}...`, 'Download Started', 'info')
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
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
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
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
      <header className="lpu-header">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl">Data Export Center</h1>
                <p className="lpu-header-subtitle text-lg">Export system data in multiple formats</p>
              </div>
            </div>

          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Tabs */}
        <div className="bg-white rounded-card shadow-card mb-12 p-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'quick'
                ? 'bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚡ Quick Export
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📜 Export History
          </button>
        </div>

        {/* Quick Export Tab */}
        {activeTab === 'quick' && (
          <>
            <div className="bg-red-50 border border-yellow-200 rounded-card p-4 mb-12">
              <p className="text-sm text-red-900 font-semibold mb-1">⚡ Quick Export Options</p>
              <p className="text-sm text-red-700">Export commonly requested data sets with one click.</p>
            </div>

            {/* Format Selector - REMOVED: Will be replaced with modal in Phase 4 */}
            {/* Format selection will be per-export via modal pop-up */}

            {/* Quick Export Cards */}
            <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-5 rounded-button transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full bg-yellow-600 hover:bg-amber-700 text-white font-semibold py-3 px-5 rounded-button transition-all duration-250"
                >
                  Export Courses →
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-500">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full bg-yellow-600 hover:bg-amber-700 text-white font-semibold py-3 px-5 rounded-button transition-all duration-250"
                >
                  Export Evaluations →
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-5 rounded-button transition-all duration-250"
                >
                  Export Logs →
                </button>
              </div>

            </div>
          </>
        )}

        {/* Custom Export Tab - REMOVED */}
        {false && activeTab === 'custom' && (
          <div className="bg-white rounded-card shadow-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Custom Export Configuration</h2>
            
            <div className="space-y-6">
              {/* What to Include */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Data to Export</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.users}
                      onChange={(e) => setIncludeFilters({...includeFilters, users: e.target.checked})}
                      className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">User Data</span>
                      <p className="text-xs text-gray-600">All user accounts, roles, and permissions</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.courses}
                      onChange={(e) => setIncludeFilters({...includeFilters, courses: e.target.checked})}
                      className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Course Data</span>
                      <p className="text-xs text-gray-600">All courses, instructors, and schedules</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.evaluations}
                      onChange={(e) => setIncludeFilters({...includeFilters, evaluations: e.target.checked})}
                      className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Evaluation Data</span>
                      <p className="text-xs text-gray-600">All evaluation responses and ratings</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.analytics}
                      onChange={(e) => setIncludeFilters({...includeFilters, analytics: e.target.checked})}
                      className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">Analytics Data</span>
                      <p className="text-xs text-gray-600">Sentiment analysis, trends, and statistics</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFilters.auditLogs}
                      onChange={(e) => setIncludeFilters({...includeFilters, auditLogs: e.target.checked})}
                      className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
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
                <CustomDropdown
                  value={dateRange}
                  onChange={(val) => setDateRange(val)}
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'Last 7 Days' },
                    { value: 'month', label: 'Last 30 Days' },
                    { value: 'semester', label: 'Current Semester' },
                    { value: 'year', label: 'Academic Year' },
                    { value: 'custom', label: 'Custom Range' }
                  ]}
                />
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
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <p className="font-bold text-gray-900">{format.toUpperCase()}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCustomExport}
                className="w-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-700 hover:to-red-900 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all"
              >
                📥 Export Custom Data
              </button>
            </div>
          </div>
        )}

        {/* Export History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">📜 Export History</h2>
              <p className="text-sm text-gray-600 mt-1">View and download previous exports</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Filename</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Format</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exportHistory.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{file.filename}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.type}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                          {file.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(file.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {file.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-2 bg-yellow-100 hover:bg-amber-200 text-yellow-600 rounded-lg transition-all"
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

      {/* Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-red-800 to-red-900 p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">📥 Configure Export: {selectedExportType}</h2>
                  <p className="text-red-100 mt-1">Select format and apply filters</p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Export Format *</label>
                <div className="grid grid-cols-4 gap-3">
                  {['csv', 'excel', 'json', 'pdf'].map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setModalFormat(format)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        modalFormat === format
                          ? 'border-yellow-600 bg-red-50 shadow-md'
                          : 'border-gray-300 hover:border-yellow-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className={`w-8 h-8 ${modalFormat === format ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className={`text-sm font-semibold uppercase ${modalFormat === format ? 'text-red-600' : 'text-gray-600'}`}>
                          {format}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category-Specific Filters */}
              {selectedExportType === 'All Users' && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    User Filters
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <CustomDropdown
                      label="Role"
                      value={exportFilters.userRole}
                      onChange={(val) => setExportFilters({...exportFilters, userRole: val})}
                      options={[
                        { value: 'all', label: 'All Roles' },
                        { value: 'student', label: 'Students' },
                        { value: 'secretary', label: 'Secretaries' },
                        { value: 'department_head', label: 'Department Heads' },
                        { value: 'admin', label: 'Admins' }
                      ]}
                    />
                    <CustomDropdown
                      label="Program"
                      value={exportFilters.userProgram}
                      onChange={(val) => setExportFilters({...exportFilters, userProgram: val})}
                      searchable={programs.length > 5}
                      options={[
                        { value: 'all', label: 'All Programs' },
                        ...programs.map(prog => ({ value: prog.code, label: `${prog.code} - ${prog.name}` }))
                      ]}
                    />
                    <CustomDropdown
                      label="Status"
                      value={exportFilters.userStatus}
                      onChange={(val) => setExportFilters({...exportFilters, userStatus: val})}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                      ]}
                    />
                  </div>
                </div>
              )}

              {selectedExportType === 'All Evaluations' && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    Evaluation Filters
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <CustomDropdown
                      label="Date Range"
                      value={exportFilters.evalDateRange}
                      onChange={(val) => setExportFilters({...exportFilters, evalDateRange: val})}
                      options={[
                        { value: 'all', label: 'All Time' },
                        { value: 'current_semester', label: 'Current Semester' },
                        { value: 'last_semester', label: 'Last Semester' },
                        { value: 'current_year', label: 'Current Year' },
                        { value: 'last_30_days', label: 'Last 30 Days' }
                      ]}
                    />
                    <CustomDropdown
                      label="Program"
                      value={exportFilters.evalProgram}
                      onChange={(val) => setExportFilters({...exportFilters, evalProgram: val})}
                      searchable={programs.length > 5}
                      options={[
                        { value: 'all', label: 'All Programs' },
                        ...programs.map(prog => ({ value: prog.code, label: `${prog.code} - ${prog.name}` }))
                      ]}
                    />
                    <CustomDropdown
                      label="Evaluation Period"
                      value={exportFilters.evalPeriod}
                      onChange={(val) => setExportFilters({...exportFilters, evalPeriod: val})}
                      searchable={evaluationPeriods.length > 5}
                      options={[
                        { value: 'all', label: 'All Periods' },
                        ...evaluationPeriods.map(period => ({
                          value: period.id,
                          label: `${period.name} (${period.academic_year}, ${period.semester === 1 ? 'First' : period.semester === 2 ? 'Second' : 'Summer'} Semester) - ${period.status}`
                        }))
                      ]}
                    />
                  </div>
                </div>
              )}

              {selectedExportType === 'All Courses' && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    Course Filters
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <CustomDropdown
                      label="Program"
                      value={exportFilters.courseProgram}
                      onChange={(val) => setExportFilters({...exportFilters, courseProgram: val})}
                      searchable={programs.length > 5}
                      options={[
                        { value: 'all', label: 'All Programs' },
                        ...programs.map(prog => ({ value: prog.code, label: `${prog.code} - ${prog.name}` }))
                      ]}
                    />
                    <CustomDropdown
                      label="Status"
                      value={exportFilters.courseStatus}
                      onChange={(val) => setExportFilters({...exportFilters, courseStatus: val})}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'Active', label: 'Active' },
                        { value: 'Archived', label: 'Archived' }
                      ]}
                    />
                    <CustomDropdown
                      label="Year Level"
                      value={exportFilters.courseYearLevel}
                      onChange={(val) => setExportFilters({...exportFilters, courseYearLevel: val})}
                      options={[
                        { value: 'all', label: 'All Years' },
                        { value: '1', label: '1st Year' },
                        { value: '2', label: '2nd Year' },
                        { value: '3', label: '3rd Year' },
                        { value: '4', label: '4th Year' }
                      ]}
                    />
                  </div>
                </div>
              )}

              {selectedExportType === 'Audit Logs' && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    Audit Log Filters
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <CustomDropdown
                      label="Date Range"
                      value={exportFilters.auditDateRange}
                      onChange={(val) => setExportFilters({...exportFilters, auditDateRange: val})}
                      options={[
                        { value: 'all', label: 'All Time' },
                        { value: 'today', label: 'Today' },
                        { value: 'last_7_days', label: 'Last 7 Days' },
                        { value: 'last_30_days', label: 'Last 30 Days' },
                        { value: 'current_month', label: 'Current Month' },
                        { value: 'last_month', label: 'Last Month' }
                      ]}
                    />
                    <CustomDropdown
                      label="Action Type"
                      value={exportFilters.auditAction}
                      onChange={(val) => setExportFilters({...exportFilters, auditAction: val})}
                      searchable
                      options={[
                        { value: 'all', label: 'All Actions' },
                        { value: 'LOGIN', label: '🔐 Login' },
                        { value: 'LOGOUT', label: '🔐 Logout' },
                        { value: 'LOGIN_FAILED', label: '🔐 Login Failed' },
                        { value: 'PASSWORD_RESET', label: '🔐 Password Reset' },
                        { value: 'PASSWORD_CHANGED', label: '🔐 Password Changed' },
                        { value: 'CREATE_USER', label: '👤 Create User' },
                        { value: 'UPDATE_USER', label: '👤 Update User' },
                        { value: 'DELETE_USER', label: '👤 Delete User' },
                        { value: 'USER_ACTIVATED', label: '👤 User Activated' },
                        { value: 'USER_DEACTIVATED', label: '👤 User Deactivated' },
                        { value: 'CREATE_COURSE', label: '📚 Create Course' },
                        { value: 'UPDATE_COURSE', label: '📚 Update Course' },
                        { value: 'DELETE_COURSE', label: '📚 Delete Course' },
                        { value: 'CREATE_SECTION', label: '📋 Create Section' },
                        { value: 'UPDATE_SECTION', label: '📋 Update Section' },
                        { value: 'DELETE_SECTION', label: '📋 Delete Section' },
                        { value: 'ENROLL_STUDENTS', label: '📋 Enroll Students' },
                        { value: 'SUBMIT_EVALUATION', label: '📝 Submit Evaluation' },
                        { value: 'CREATE_PERIOD', label: '📅 Create Period' },
                        { value: 'UPDATE_PERIOD', label: '📅 Update Period' },
                        { value: 'EXPORT_DATA', label: '⚙️ Export Data' },
                        { value: 'IMPORT_DATA', label: '⚙️ Import Data' },
                        { value: 'SETTINGS_UPDATED', label: '⚙️ Settings Updated' }
                      ]}
                    />
                    <CustomDropdown
                      label="Severity"
                      value={exportFilters.auditSeverity}
                      onChange={(val) => setExportFilters({...exportFilters, auditSeverity: val})}
                      options={[
                        { value: 'all', label: 'All Severities' },
                        { value: 'Info', label: 'Info' },
                        { value: 'Warning', label: 'Warning' },
                        { value: 'Critical', label: 'Critical' }
                      ]}
                    />

                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-red-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-900">Export Information</p>
                    <p className="text-sm text-red-800 mt-1">
                      Format: <span className="font-semibold uppercase">{modalFormat}</span> | 
                      Type: <span className="font-semibold">{selectedExportType}</span>
                      {selectedExportType === 'All Users' && exportFilters.userRole !== 'all' && ` | Role: ${exportFilters.userRole}`}
                      {selectedExportType === 'All Courses' && exportFilters.courseStatus !== 'all' && ` | Status: ${exportFilters.courseStatus}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  disabled={exporting}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExport}
                  disabled={exporting}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {exporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      <span>Export Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.type === 'error' ? 'danger' : alertConfig.type}
      />
    </div>
  )
}




