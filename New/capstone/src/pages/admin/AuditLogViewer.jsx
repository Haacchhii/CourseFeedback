import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'

export default function AuditLogViewer() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const logsPerPage = 15
  
  // API State
  const [auditLogs, setAuditLogs] = useState([])
  const [stats, setStats] = useState({ last24h: 0, criticalEvents: 0, failedAttempts: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Redirect if not system admin
  useEffect(() => {
    if (!currentUser || !isSystemAdmin(currentUser)) {
      navigate('/admin/dashboard')
    }
  }, [currentUser, navigate])
  
  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build params for backend API
        const params = {
          page: currentPage,
          page_size: logsPerPage
        }
        
        // Add action filter if set
        if (actionFilter !== 'all') {
          params.action = actionFilter
        }
        
        // Add severity filter if set
        if (severityFilter !== 'all') {
          params.severity = severityFilter
        }
        
        // Date range filtering
        if (dateFilter === 'custom' && customStartDate && customEndDate) {
          params.start_date = new Date(customStartDate).toISOString()
          params.end_date = new Date(customEndDate + 'T23:59:59').toISOString()
        } else if (dateFilter !== 'all') {
          const now = new Date()
          if (dateFilter === 'today') {
            params.start_date = new Date(now.setHours(0, 0, 0, 0)).toISOString()
          } else if (dateFilter === 'yesterday') {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            params.start_date = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
            params.end_date = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
          } else if (dateFilter === 'week') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            params.start_date = weekAgo.toISOString()
          } else if (dateFilter === '2weeks') {
            const twoWeeksAgo = new Date()
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
            params.start_date = twoWeeksAgo.toISOString()
          } else if (dateFilter === 'month') {
            const monthAgo = new Date()
            monthAgo.setDate(monthAgo.getDate() - 30)
            params.start_date = monthAgo.toISOString()
          } else if (dateFilter === '3months') {
            const threeMonthsAgo = new Date()
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
            params.start_date = threeMonthsAgo.toISOString()
          } else if (dateFilter === '6months') {
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            params.start_date = sixMonthsAgo.toISOString()
          } else if (dateFilter === 'year') {
            const yearAgo = new Date()
            yearAgo.setFullYear(yearAgo.getFullYear() - 1)
            params.start_date = yearAgo.toISOString()
          }
        }
        
        const response = await adminAPI.getAuditLogs(params)
        
        if (response?.success) {
          setAuditLogs(response.data || [])
          // Update total pages from backend pagination
          if (response.pagination) {
            setTotalPages(response.pagination.total_pages)
          }
        } else {
          setError('Failed to load audit logs')
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err)
        setError(err.message || 'Failed to load audit logs. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [currentPage, actionFilter, severityFilter, dateFilter, customStartDate, customEndDate])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [actionFilter, categoryFilter, severityFilter, statusFilter, dateFilter, searchTerm, userFilter])

  // Get unique users and actions from current page
  const users = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.user))].sort()
  }, [auditLogs])

  const actions = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.action))].sort()
  }, [auditLogs])
  
  const categories = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.category))].sort()
  }, [auditLogs])

  // Comprehensive list of all possible actions
  const allPossibleActions = [
    // Authentication
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGED',
    // User Management
    'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'USER_ROLE_CHANGED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
    // Course Management
    'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE', 'COURSE_UPDATED', 'COURSE_ARCHIVED', 'COURSE_RESTORED',
    // Section Management
    'CREATE_SECTION', 'UPDATE_SECTION', 'DELETE_SECTION', 'SECTION_UPDATED', 'SECTION_DELETED',
    // Enrollment
    'ENROLL_STUDENT', 'DROP_STUDENT', 'REMOVE_STUDENT_FROM_SECTION', 'BULK_ENROLLMENT',
    // Questionnaire
    'QUESTIONNAIRE_SUBMITTED', 'QUESTIONNAIRE_UPDATED', 'QUESTIONNAIRE_VIEWED',
    // Evaluation
    'EVALUATION_CREATED', 'EVALUATION_UPDATED', 'EVALUATION_SUBMITTED', 'EVALUATION_GRADED',
    // Period Management
    'CREATE_PERIOD', 'UPDATE_PERIOD', 'DELETE_PERIOD', 'PERIOD_ACTIVATED', 'PERIOD_CLOSED',
    // Data Export
    'EXPORT_USERS', 'EXPORT_COURSES', 'EXPORT_SECTIONS', 'EXPORT_EVALUATIONS', 'EXPORT_AUDIT_LOGS',
    // System Configuration
    'SYSTEM_CONFIG_CHANGE', 'SETTINGS_UPDATED', 'BACKUP_CREATED', 'DATABASE_RESTORED',
    // Program Management
    'CREATE_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM'
  ]

  // Client-side filtering for search, user, category, and status (since backend handles action, severity, date)
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = searchTerm === '' ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && typeof log.details === 'string' && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm))
      
      const matchesUser = userFilter === 'all' || log.user === userFilter
      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter
      
      return matchesSearch && matchesUser && matchesCategory && matchesStatus
    })
  }, [auditLogs, searchTerm, userFilter, categoryFilter, statusFilter])

  // Use filtered logs directly (backend handles pagination)
  const paginatedLogs = filteredLogs

  // Fetch stats separately
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getAuditLogStats()
        if (response?.success) {
          setStats({
            last24h: response.data.last_24h || 0,
            criticalEvents: response.data.critical_events || 0,
            failedAttempts: response.data.failed_blocked || 0
          })
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }
    fetchStats()
  }, [])

  // Calculate stats from all logs if API doesn't provide them
  const displayStats = useMemo(() => {
    if (stats.last24h !== undefined) {
      return stats
    }
    
    // Fallback to calculating from current page
    const last24h = auditLogs.filter(log => {
      const logDate = new Date(log.timestamp)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logDate >= yesterday
    }).length

    const criticalEvents = auditLogs.filter(log => log.severity === 'Critical').length
    const failedAttempts = auditLogs.filter(log => log.status === 'Failed' || log.status === 'Blocked').length

    return { last24h, criticalEvents, failedAttempts }
  }, [auditLogs, stats])

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  const handleExportLogs = async () => {
    try {
      // Create CSV content
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Category', 'IP Address', 'Status', 'Severity', 'Details']
      const csvData = [
        headers.join(','),
        ...auditLogs.map(log => [
          log.id,
          new Date(log.timestamp).toLocaleString(),
          `"${log.user}"`,
          `"${log.action}"`,
          `"${log.category}"`,
          log.ipAddress,
          log.status,
          log.severity,
          `"${typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}"`
        ].join(','))
      ].join('\n')
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export logs. Please try again.')
    }
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
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
            <h3 className="text-xl font-bold mb-2">Error Loading Audit Logs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-xl border-b-4 border-red-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Audit Log Viewer</h1>
                <p className="text-red-100 text-sm mt-1">Monitor system activity and security events</p>
              </div>
            </div>
            <button onClick={handleExportLogs} className="bg-white hover:bg-red-50 text-red-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Export Logs</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-3xl font-bold text-gray-900">{auditLogs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 24 Hours</p>
                <p className="text-3xl font-bold text-green-600">{displayStats.last24h}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Events</p>
                <p className="text-3xl font-bold text-red-600">{displayStats.criticalEvents}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed/Blocked</p>
                <p className="text-3xl font-bold text-orange-600">{displayStats.failedAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔎 Advanced Filters</h3>
          
          {/* Row 1: Search and Action */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search by user, action, IP, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Actions</option>
                <optgroup label="Authentication">
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                  <option value="PASSWORD_RESET">PASSWORD_RESET</option>
                  <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
                </optgroup>
                <optgroup label="User Management">
                  <option value="CREATE_USER">CREATE_USER</option>
                  <option value="UPDATE_USER">UPDATE_USER</option>
                  <option value="DELETE_USER">DELETE_USER</option>
                  <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
                  <option value="USER_ACTIVATED">USER_ACTIVATED</option>
                  <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
                </optgroup>
                <optgroup label="Course Management">
                  <option value="CREATE_COURSE">CREATE_COURSE</option>
                  <option value="UPDATE_COURSE">UPDATE_COURSE</option>
                  <option value="COURSE_UPDATED">COURSE_UPDATED</option>
                  <option value="DELETE_COURSE">DELETE_COURSE</option>
                  <option value="COURSE_ARCHIVED">COURSE_ARCHIVED</option>
                  <option value="COURSE_RESTORED">COURSE_RESTORED</option>
                </optgroup>
                <optgroup label="Section Management">
                  <option value="CREATE_SECTION">CREATE_SECTION</option>
                  <option value="UPDATE_SECTION">UPDATE_SECTION</option>
                  <option value="SECTION_UPDATED">SECTION_UPDATED</option>
                  <option value="DELETE_SECTION">DELETE_SECTION</option>
                  <option value="SECTION_DELETED">SECTION_DELETED</option>
                </optgroup>
                <optgroup label="Enrollment">
                  <option value="ENROLL_STUDENT">ENROLL_STUDENT</option>
                  <option value="DROP_STUDENT">DROP_STUDENT</option>
                  <option value="REMOVE_STUDENT_FROM_SECTION">REMOVE_STUDENT_FROM_SECTION</option>
                  <option value="BULK_ENROLLMENT">BULK_ENROLLMENT</option>
                </optgroup>
                <optgroup label="Questionnaire & Evaluation">
                  <option value="QUESTIONNAIRE_SUBMITTED">QUESTIONNAIRE_SUBMITTED</option>
                  <option value="QUESTIONNAIRE_UPDATED">QUESTIONNAIRE_UPDATED</option>
                  <option value="EVALUATION_SUBMITTED">EVALUATION_SUBMITTED</option>
                  <option value="EVALUATION_GRADED">EVALUATION_GRADED</option>
                </optgroup>
                <optgroup label="Period Management">
                  <option value="CREATE_PERIOD">CREATE_PERIOD</option>
                  <option value="UPDATE_PERIOD">UPDATE_PERIOD</option>
                  <option value="DELETE_PERIOD">DELETE_PERIOD</option>
                  <option value="PERIOD_ACTIVATED">PERIOD_ACTIVATED</option>
                  <option value="PERIOD_CLOSED">PERIOD_CLOSED</option>
                </optgroup>
                <optgroup label="Data Export">
                  <option value="EXPORT_USERS">EXPORT_USERS</option>
                  <option value="EXPORT_COURSES">EXPORT_COURSES</option>
                  <option value="EXPORT_SECTIONS">EXPORT_SECTIONS</option>
                  <option value="EXPORT_EVALUATIONS">EXPORT_EVALUATIONS</option>
                  <option value="EXPORT_AUDIT_LOGS">EXPORT_AUDIT_LOGS</option>
                </optgroup>
                <optgroup label="System">
                  <option value="SYSTEM_CONFIG_CHANGE">SYSTEM_CONFIG_CHANGE</option>
                  <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
                  <option value="BACKUP_CREATED">BACKUP_CREATED</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Row 2: Category, Severity, Status */}
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📂 Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Authentication">Authentication</option>
                <option value="User Management">User Management</option>
                <option value="Course Management">Course Management</option>
                <option value="Section Management">Section Management</option>
                <option value="Enrollment">Enrollment</option>
                <option value="Questionnaire">Questionnaire</option>
                <option value="Evaluation">Evaluation</option>
                <option value="Period Management">Period Management</option>
                <option value="Data Export">Data Export</option>
                <option value="System Configuration">System Configuration</option>
                <option value="Program Management">Program Management</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⚠️ Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="Info">ℹ️ Info</option>
                <option value="Warning">⚠️ Warning</option>
                <option value="Critical">🚨 Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">✓ Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="Success">✅ Success</option>
                <option value="Failed">❌ Failed</option>
                <option value="Blocked">🚫 Blocked</option>
                <option value="Pending">⏳ Pending</option>
              </select>
            </div>
          </div>

          {/* Row 3: User and Date Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">👤 User / Role</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <optgroup label="By Role">
                  <option value="System">🖥️ System</option>
                  <option value="Admin">👨‍💼 Admin</option>
                  <option value="Instructor">👩‍🏫 Instructor</option>
                  <option value="Student">🎓 Student</option>
                  <option value="Secretary">📋 Secretary</option>
                  <option value="Department Head">🎯 Department Head</option>
                </optgroup>
                {users.length > 0 && (
                  <optgroup label="Specific Users">
                    {users.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="2weeks">Last 14 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="grid md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📆 Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📆 End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Filter Summary */}
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {(actionFilter !== 'all' || categoryFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
                <span>🔍 Active filters: {[
                  actionFilter !== 'all' && 'Action',
                  categoryFilter !== 'all' && 'Category',
                  severityFilter !== 'all' && 'Severity',
                  statusFilter !== 'all' && 'Status',
                  userFilter !== 'all' && 'User',
                  dateFilter !== 'all' && 'Date',
                  searchTerm && 'Search'
                ].filter(Boolean).join(', ')}</span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('')
                setActionFilter('all')
                setCategoryFilter('all')
                setSeverityFilter('all')
                setStatusFilter('all')
                setUserFilter('all')
                setDateFilter('all')
                setCustomStartDate('')
                setCustomEndDate('')
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm font-medium"
            >
              🔄 Clear All Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">IP Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.user}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.category}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{log.ipAddress}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'Success' ? 'bg-green-100 text-green-800' :
                          log.status === 'Failed' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {log.status}
                        </span>
                        {log.severity === 'Critical' && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, paginatedLogs.length + (currentPage - 1) * logsPerPage)} of {paginatedLogs.length} logs on this page
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg transition-all ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-all ${currentPage === page ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 border-b-4 border-red-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📋 Log Details</h2>
                <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Log ID</label>
                  <p className="text-gray-900 font-mono">#{selectedLog.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Timestamp</label>
                  <p className="text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">User</label>
                <p className="text-gray-900">{selectedLog.user}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Action</label>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{selectedLog.category}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Details</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {typeof selectedLog.details === 'object' ? (
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-900">{selectedLog.details || 'No details available'}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">IP Address</label>
                  <p className="text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedLog.status === 'Success' ? 'bg-green-100 text-green-800' :
                    selectedLog.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedLog.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                  selectedLog.severity === 'Warning' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedLog.severity}
                </span>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
