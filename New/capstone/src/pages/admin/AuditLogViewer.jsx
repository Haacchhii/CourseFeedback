import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, isSystemAdmin } from '../../utils/roleUtils'
import { mockAdmins, mockSecretaries, mockHeads, mockStudents } from '../../data/mock'

export default function AuditLogViewer() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 15

  // Mock audit log data
  const [auditLogs] = useState([
    { id: 1, timestamp: '2025-10-21 14:30:25', user: 'admin@lpubatangas.edu.ph', action: 'USER_CREATED', category: 'User Management', details: 'Created user: student001@lpubatangas.edu.ph', ipAddress: '192.168.1.100', status: 'Success', severity: 'Info' },
    { id: 2, timestamp: '2025-10-21 14:15:10', user: 'admin@lpubatangas.edu.ph', action: 'USER_DELETED', category: 'User Management', details: 'Deleted user: olduser@lpubatangas.edu.ph', ipAddress: '192.168.1.100', status: 'Success', severity: 'Warning' },
    { id: 3, timestamp: '2025-10-21 13:45:00', user: 'secretary@lpubatangas.edu.ph', action: 'LOGIN', category: 'Authentication', details: 'Successful login', ipAddress: '192.168.1.105', status: 'Success', severity: 'Info' },
    { id: 4, timestamp: '2025-10-21 13:30:15', user: 'admin@lpubatangas.edu.ph', action: 'SETTINGS_CHANGED', category: 'System Settings', details: 'Updated email settings: SMTP configuration', ipAddress: '192.168.1.100', status: 'Success', severity: 'Info' },
    { id: 5, timestamp: '2025-10-21 12:00:05', user: 'admin@lpubatangas.edu.ph', action: 'PERIOD_CLOSED', category: 'Evaluation Management', details: 'Closed evaluation period: Midterm 2024-2025', ipAddress: '192.168.1.100', status: 'Success', severity: 'Warning' },
    { id: 6, timestamp: '2025-10-21 11:30:00', user: 'unknown@example.com', action: 'LOGIN_FAILED', category: 'Authentication', details: 'Failed login attempt - Invalid credentials', ipAddress: '203.177.45.89', status: 'Failed', severity: 'Critical' },
    { id: 7, timestamp: '2025-10-21 10:15:30', user: 'head@lpubatangas.edu.ph', action: 'COURSE_CREATED', category: 'Course Management', details: 'Created course: Advanced Database Systems (CS301)', ipAddress: '192.168.1.110', status: 'Success', severity: 'Info' },
    { id: 8, timestamp: '2025-10-21 09:45:20', user: 'admin@lpubatangas.edu.ph', action: 'BULK_IMPORT', category: 'Course Management', details: 'Imported 25 courses via CSV', ipAddress: '192.168.1.100', status: 'Success', severity: 'Info' },
    { id: 9, timestamp: '2025-10-21 09:00:10', user: 'admin@lpubatangas.edu.ph', action: 'BACKUP_CREATED', category: 'System Maintenance', details: 'Automated daily backup completed', ipAddress: '192.168.1.100', status: 'Success', severity: 'Info' },
    { id: 10, timestamp: '2025-10-20 18:30:00', user: 'admin@lpubatangas.edu.ph', action: 'PASSWORD_RESET', category: 'User Management', details: 'Reset password for: student123@lpubatangas.edu.ph', ipAddress: '192.168.1.100', status: 'Success', severity: 'Warning' },
    { id: 11, timestamp: '2025-10-20 16:20:45', user: 'secretary@lpubatangas.edu.ph', action: 'DATA_EXPORT', category: 'Data Management', details: 'Exported evaluation data to CSV', ipAddress: '192.168.1.105', status: 'Success', severity: 'Info' },
    { id: 12, timestamp: '2025-10-20 15:10:30', user: 'admin@lpubatangas.edu.ph', action: 'PERMISSIONS_CHANGED', category: 'User Management', details: 'Updated permissions for: secretary@lpubatangas.edu.ph', ipAddress: '192.168.1.100', status: 'Success', severity: 'Warning' },
    { id: 13, timestamp: '2025-10-20 14:00:00', user: 'unknown@test.com', action: 'ACCESS_DENIED', category: 'Security', details: 'Unauthorized access attempt to /admin/settings', ipAddress: '45.123.78.200', status: 'Blocked', severity: 'Critical' },
    { id: 14, timestamp: '2025-10-20 12:30:15', user: 'admin@lpubatangas.edu.ph', action: 'EVALUATION_DELETED', category: 'Evaluation Management', details: 'Deleted evaluation: Evaluation ID #455', ipAddress: '192.168.1.100', status: 'Success', severity: 'Warning' },
    { id: 15, timestamp: '2025-10-20 11:00:00', user: 'admin@lpubatangas.edu.ph', action: 'SYSTEM_RESTART', category: 'System Maintenance', details: 'System maintenance restart', ipAddress: '192.168.1.100', status: 'Success', severity: 'Warning' },
    { id: 16, timestamp: '2025-10-20 09:45:30', user: 'secretary@lpubatangas.edu.ph', action: 'REPORT_GENERATED', category: 'Reporting', details: 'Generated sentiment analysis report', ipAddress: '192.168.1.105', status: 'Success', severity: 'Info' },
    { id: 17, timestamp: '2025-10-19 17:30:00', user: 'admin@lpubatangas.edu.ph', action: 'USER_BULK_DEACTIVATE', category: 'User Management', details: 'Bulk deactivated 12 inactive users', ipAddress: '192.168.1.100', status: 'Success', severity: 'Warning' },
    { id: 18, timestamp: '2025-10-19 15:00:00', user: 'unknown@hacker.com', action: 'SQL_INJECTION_ATTEMPT', category: 'Security', details: 'Detected SQL injection attempt on login form', ipAddress: '185.220.101.50', status: 'Blocked', severity: 'Critical' },
    { id: 19, timestamp: '2025-10-19 13:30:45', user: 'admin@lpubatangas.edu.ph', action: 'COURSE_ARCHIVED', category: 'Course Management', details: 'Archived old courses: 8 courses from AY 2022-2023', ipAddress: '192.168.1.100', status: 'Success', severity: 'Info' },
    { id: 20, timestamp: '2025-10-19 10:00:00', user: 'admin@lpubatangas.edu.ph', action: 'NOTIFICATION_SENT', category: 'Communication', details: 'Sent reminder emails to 450 students', ipAddress: '192.168.1.100', status: 'Success', severity: 'Info' }
  ])

  // Redirect if not system admin
  useEffect(() => {
    if (!currentUser || !isSystemAdmin(currentUser)) {
      navigate('/admin/dashboard')
    }
  }, [currentUser, navigate])

  // Get unique users and actions
  const users = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.user))].sort()
  }, [auditLogs])

  const actions = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.action))].sort()
  }, [auditLogs])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = searchTerm === '' ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm)
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      const matchesUser = userFilter === 'all' || log.user === userFilter
      
      let matchesDate = true
      if (dateFilter !== 'all') {
        const logDate = new Date(log.timestamp)
        const today = new Date()
        if (dateFilter === 'today') {
          matchesDate = logDate.toDateString() === today.toDateString()
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = logDate >= weekAgo
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = logDate >= monthAgo
        }
      }
      
      return matchesSearch && matchesAction && matchesUser && matchesDate
    })
  }, [auditLogs, searchTerm, actionFilter, userFilter, dateFilter])

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage
    return filteredLogs.slice(start, start + logsPerPage)
  }, [filteredLogs, currentPage])

  // Stats
  const stats = useMemo(() => {
    const last24h = auditLogs.filter(log => {
      const logDate = new Date(log.timestamp)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logDate >= yesterday
    }).length

    const criticalEvents = auditLogs.filter(log => log.severity === 'Critical').length
    const failedAttempts = auditLogs.filter(log => log.status === 'Failed' || log.status === 'Blocked').length

    return { last24h, criticalEvents, failedAttempts }
  }, [auditLogs])

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  const handleExportLogs = () => {
    alert(`Exporting ${filteredLogs.length} audit logs to CSV...`)
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null

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
                <p className="text-3xl font-bold text-green-600">{stats.last24h}</p>
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
                <p className="text-3xl font-bold text-red-600">{stats.criticalEvents}</p>
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
                <p className="text-3xl font-bold text-orange-600">{stats.failedAttempts}</p>
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
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Actions</option>
                {actions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">👤 User</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
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
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
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
              Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${currentPage === page ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900">{selectedLog.details}</p>
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
