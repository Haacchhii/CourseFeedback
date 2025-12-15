import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import Pagination from '../../components/Pagination'
import { useDebounce } from '../../hooks/useDebounce'
import { AlertModal } from '../../components/Modal'
import CustomDropdown from '../../components/CustomDropdown'

export default function AuditLogViewer() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // Debounce search
  const [actionFilter, setActionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [logsPerPage, setLogsPerPage] = useState(15)
  
  // API State
  const [auditLogs, setAuditLogs] = useState([])
  const [stats, setStats] = useState({ totalLogs: 0, last24h: 0, criticalEvents: 0, failedAttempts: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal State
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' })

  // Modal Helper Function
  const showAlert = (message, title = 'Notification', type = 'info') => {
    setAlertConfig({ title, message, type })
    setShowAlertModal(true)
  }

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
        
        // Add filters if set
        if (actionFilter !== 'all') {
          params.action = actionFilter
        }
        
        if (categoryFilter !== 'all') {
          params.category = categoryFilter
        }
        
        if (statusFilter !== 'all') {
          params.status = statusFilter
        }
        
        if (userFilter !== 'all') {
          params.user = userFilter
        }
        
        if (searchTerm.trim()) {
          params.search = searchTerm.trim()
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
  }, [currentPage, actionFilter, categoryFilter, statusFilter, userFilter, searchTerm, dateFilter, customStartDate, customEndDate])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [actionFilter, categoryFilter, statusFilter, dateFilter, searchTerm, userFilter])

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

  // Backend handles all filtering, use response directly
  const paginatedLogs = auditLogs

  // Fetch stats separately
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getAuditLogStats()
        if (response?.success) {
          setStats({
            totalLogs: response.data.total_logs || 0,
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
    const totalLogs = auditLogs.length
    const last24h = auditLogs.filter(log => {
      const logDate = new Date(log.timestamp)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logDate >= yesterday
    }).length

    const criticalEvents = auditLogs.filter(log => log.severity === 'Critical').length
    const failedAttempts = auditLogs.filter(log => log.status === 'Failed' || log.status === 'Blocked').length

    return { totalLogs, last24h, criticalEvents, failedAttempts }
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
      showAlert('Failed to export logs. Please try again.', 'Export Failed', 'error')
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
                <h1 className="lpu-header-title text-3xl">Audit Log Viewer</h1>
                <p className="lpu-header-subtitle text-lg">Monitor system activity and security events</p>
              </div>
            </div>
            <button onClick={handleExportLogs} className="bg-white hover:bg-[#ffd700] text-[#7a0000] font-semibold px-6 py-3 rounded-button shadow-card transition-all duration-250 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Export Logs</span>
            </button>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-5 lg:gap-6 mb-12">
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600 uppercase tracking-wide">Total Logs</p>
                <p className="text-4xl lg:text-5xl font-bold text-gray-900">{displayStats.totalLogs}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600 uppercase tracking-wide">Last 24 Hours</p>
                <p className="text-4xl lg:text-5xl font-bold text-yellow-600">{displayStats.last24h}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600 uppercase tracking-wide">Critical Events</p>
                <p className="text-4xl lg:text-5xl font-bold text-red-600">{displayStats.criticalEvents}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-gray-600 uppercase tracking-wide">Failed/Blocked</p>
                <p className="text-4xl lg:text-5xl font-bold text-yellow-600">{displayStats.failedAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-card shadow-card p-6 lg:p-8 mb-12">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
              />
            </div>
            <CustomDropdown
              label="⚡ Action Type"
              value={actionFilter}
              onChange={(val) => setActionFilter(val)}
              searchable
              options={[
                { value: 'all', label: 'All Actions' },
                { value: 'LOGIN', label: '🔐 LOGIN' },
                { value: 'LOGOUT', label: '🔐 LOGOUT' },
                { value: 'LOGIN_FAILED', label: '🔐 LOGIN_FAILED' },
                { value: 'PASSWORD_RESET', label: '🔐 PASSWORD_RESET' },
                { value: 'PASSWORD_CHANGED', label: '🔐 PASSWORD_CHANGED' },
                { value: 'CREATE_USER', label: '👤 CREATE_USER' },
                { value: 'UPDATE_USER', label: '👤 UPDATE_USER' },
                { value: 'DELETE_USER', label: '👤 DELETE_USER' },
                { value: 'USER_ROLE_CHANGED', label: '👤 USER_ROLE_CHANGED' },
                { value: 'USER_ACTIVATED', label: '👤 USER_ACTIVATED' },
                { value: 'USER_DEACTIVATED', label: '👤 USER_DEACTIVATED' },
                { value: 'CREATE_COURSE', label: '📚 CREATE_COURSE' },
                { value: 'UPDATE_COURSE', label: '📚 UPDATE_COURSE' },
                { value: 'COURSE_UPDATED', label: '📚 COURSE_UPDATED' },
                { value: 'DELETE_COURSE', label: '📚 DELETE_COURSE' },
                { value: 'COURSE_ARCHIVED', label: '📚 COURSE_ARCHIVED' },
                { value: 'COURSE_RESTORED', label: '📚 COURSE_RESTORED' },
                { value: 'CREATE_SECTION', label: '📋 CREATE_SECTION' },
                { value: 'UPDATE_SECTION', label: '📋 UPDATE_SECTION' },
                { value: 'SECTION_UPDATED', label: '📋 SECTION_UPDATED' },
                { value: 'DELETE_SECTION', label: '📋 DELETE_SECTION' },
                { value: 'SECTION_DELETED', label: '📋 SECTION_DELETED' },
                { value: 'ENROLL_STUDENT', label: '🎓 ENROLL_STUDENT' },
                { value: 'DROP_STUDENT', label: '🎓 DROP_STUDENT' },
                { value: 'REMOVE_STUDENT_FROM_SECTION', label: '🎓 REMOVE_STUDENT' },
                { value: 'BULK_ENROLLMENT', label: '🎓 BULK_ENROLLMENT' },
                { value: 'QUESTIONNAIRE_SUBMITTED', label: '📝 QUESTIONNAIRE_SUBMITTED' },
                { value: 'QUESTIONNAIRE_UPDATED', label: '📝 QUESTIONNAIRE_UPDATED' },
                { value: 'EVALUATION_SUBMITTED', label: '📝 EVALUATION_SUBMITTED' },
                { value: 'EVALUATION_GRADED', label: '📝 EVALUATION_GRADED' },
                { value: 'CREATE_PERIOD', label: '📅 CREATE_PERIOD' },
                { value: 'UPDATE_PERIOD', label: '📅 UPDATE_PERIOD' },
                { value: 'DELETE_PERIOD', label: '📅 DELETE_PERIOD' },
                { value: 'PERIOD_ACTIVATED', label: '📅 PERIOD_ACTIVATED' },
                { value: 'PERIOD_CLOSED', label: '📅 PERIOD_CLOSED' },
                { value: 'EXPORT_USERS', label: '📤 EXPORT_USERS' },
                { value: 'EXPORT_COURSES', label: '📤 EXPORT_COURSES' },
                { value: 'EXPORT_SECTIONS', label: '📤 EXPORT_SECTIONS' },
                { value: 'EXPORT_EVALUATIONS', label: '📤 EXPORT_EVALUATIONS' },
                { value: 'EXPORT_AUDIT_LOGS', label: '📤 EXPORT_AUDIT_LOGS' },
                { value: 'SYSTEM_CONFIG_CHANGE', label: '⚙️ SYSTEM_CONFIG_CHANGE' },
                { value: 'SETTINGS_UPDATED', label: '⚙️ SETTINGS_UPDATED' },
                { value: 'BACKUP_CREATED', label: '⚙️ BACKUP_CREATED' }
              ]}
            />
          </div>

          {/* Row 2: Category and Status */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <CustomDropdown
              label="📂 Category"
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'Authentication', label: 'Authentication' },
                { value: 'User Management', label: 'User Management' },
                { value: 'Course Management', label: 'Course Management' },
                { value: 'Section Management', label: 'Section Management' },
                { value: 'Enrollment', label: 'Enrollment' },
                { value: 'Questionnaire', label: 'Questionnaire' },
                { value: 'Evaluation', label: 'Evaluation' },
                { value: 'Period Management', label: 'Period Management' },
                { value: 'Data Export', label: 'Data Export' },
                { value: 'System Configuration', label: 'System Configuration' },
                { value: 'Program Management', label: 'Program Management' }
              ]}
            />
            <CustomDropdown
              label="✓ Status"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Success', label: '✅ Success' },
                { value: 'Failed', label: '❌ Failed' },
                { value: 'Blocked', label: '🚫 Blocked' },
                { value: 'Pending', label: '⏳ Pending' }
              ]}
            />
          </div>

          {/* Row 3: User and Date Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <CustomDropdown
              label="👤 User / Role"
              value={userFilter}
              onChange={(val) => setUserFilter(val)}
              searchable={users.length > 5}
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'System', label: '🖥️ System' },
                { value: 'Admin', label: '👨‍💼 Admin' },
                { value: 'Instructor', label: '👩‍🏫 Instructor' },
                { value: 'Student', label: '🎓 Student' },
                { value: 'Secretary', label: '📋 Secretary' },
                { value: 'Department Head', label: '🎯 Department Head' },
                ...users.map(user => ({ value: user, label: user }))
              ]}
            />
            <CustomDropdown
              label="📅 Date Range"
              value={dateFilter}
              onChange={(val) => setDateFilter(val)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'week', label: 'Last 7 Days' },
                { value: '2weeks', label: 'Last 14 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: '3months', label: 'Last 3 Months' },
                { value: '6months', label: 'Last 6 Months' },
                { value: 'year', label: 'Last Year' },
                { value: 'custom', label: 'Custom Range' }
              ]}
            />
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
              {(actionFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
                <span>🔍 Active filters: {[
                  actionFilter !== 'all' && 'Action',
                  categoryFilter !== 'all' && 'Category',
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
        <div className="bg-white rounded-card shadow-card overflow-hidden w-fit mx-auto">
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium text-center">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{log.user}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{log.category}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 text-center">{log.ipAddress}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'Success' ? 'bg-yellow-100 text-yellow-800' :
                          log.status === 'Failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-orange-800'
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
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all inline-flex items-center justify-center"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={paginatedLogs.length}
              onPageChange={setCurrentPage}
              itemLabel="logs"
              itemsPerPage={logsPerPage}
              onItemsPerPageChange={(value) => {
                setLogsPerPage(value)
                setCurrentPage(1)
              }}
              showItemsPerPage={true}
            />
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
                  <span className="inline-flex px-3 py-1 text-sm font-semibold bg-red-100 text-red-800 rounded">
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
                    selectedLog.status === 'Success' ? 'bg-yellow-100 text-yellow-800' :
                    selectedLog.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-orange-800'
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedLog.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                  selectedLog.severity === 'Warning' ? 'bg-yellow-100 text-orange-800' :
                  'bg-red-100 text-red-800'
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




