import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { getCurrentUser, isAdmin, canManageUsers, canManageCourses, canManageEvaluations, canConfigureSystem, canExportData, canViewAuditLogs, getRoleDisplayName } from '../../utils/roleUtils'
import { adminAPI } from '../../services/api'

const COLORS = ['#7a0000', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Redirect if not an admin
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (!isAdmin(currentUser)) {
      navigate('/dashboard') // Redirect to staff dashboard
      return
    }
  }, [currentUser, navigate])

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await adminAPI.getDashboardStats()
        // Backend returns {success: true, data: {...}}
        setStats(response.data || response)
      } catch (err) {
        console.error('Error fetching dashboard:', err)
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    
    if (currentUser && isAdmin(currentUser)) {
      fetchDashboard()
    }
  }, [currentUser])

  // Prepare chart data
  const programChartData = useMemo(() => {
    if (!stats?.programStats) return []
    return Object.entries(stats.programStats).map(([program, data]) => ({
      name: program,
      courses: data.courses || 0,
      students: data.students || 0,
      evaluations: data.evaluations || 0
    }))
  }, [stats])

  const userRolesData = useMemo(() => {
    if (!stats?.userRoles) return []
    return [
      { name: 'Students', value: stats.userRoles.students || 0, color: '#10b981' },
      { name: 'Dept. Heads', value: stats.userRoles.departmentHeads || 0, color: '#3b82f6' },
      { name: 'Secretaries', value: stats.userRoles.secretaries || 0, color: '#f59e0b' },
      { name: 'Admins', value: stats.userRoles.admins || 0, color: '#7a0000' }
    ]
  }, [stats])

  const sentimentChartData = useMemo(() => {
    if (!stats?.sentimentStats) return []
    return [
      { name: 'Positive', value: stats.sentimentStats.positive || 0, color: '#10b981' },
      { name: 'Neutral', value: stats.sentimentStats.neutral || 0, color: '#f59e0b' },
      { name: 'Negative', value: stats.sentimentStats.negative || 0, color: '#ef4444' }
    ]
  }, [stats])

  if (!currentUser || !isAdmin(currentUser)) return null

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7a0000] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Dashboard</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#7a0000] text-white rounded-lg hover:bg-[#5a0000] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Admin Header */}
      <header className="bg-gradient-to-r from-[#7a0000] to-[#5a0000] shadow-2xl border-b-4 border-[#ffd700]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <svg className="w-10 h-10 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">System Administration Panel</h1>
                <p className="text-[#ffd700] text-lg mt-1">Complete System Control & Management</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 text-right border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#ffd700] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#7a0000]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-[#ffd700] text-sm font-medium">System Administrator</p>
                  <p className="text-white font-bold text-lg">{currentUser.name}</p>
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white text-xs">Full Access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Users</h3>
                <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-xs text-white/80 mt-1">System-wide</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Total Courses */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Courses</h3>
                <p className="text-4xl font-bold text-white">{stats.totalCourses}</p>
                <p className="text-xs text-white/80 mt-1">{stats.totalPrograms} Programs</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Total Evaluations */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Evaluations</h3>
                <p className="text-4xl font-bold text-white">{stats.totalEvaluations}</p>
                <p className="text-xs text-white/80 mt-1">{stats.participationRate}% Participation</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">System Health</h3>
                <p className="text-4xl font-bold text-white">98%</p>
                <p className="text-xs text-white/80 mt-1">All systems operational</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* User Management */}
          {canManageUsers(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-500"
                 onClick={() => navigate('/admin/users')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-500">Manage all user accounts</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Create, edit, and delete user accounts. Assign roles and manage permissions.</p>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Manage Users →
              </button>
            </div>
          )}

          {/* Course Management */}
          {canManageCourses(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-purple-500"
                 onClick={() => navigate('/admin/courses')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Course Management</h3>
                  <p className="text-sm text-gray-500">Manage all courses</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Create, edit, and delete courses. Assign instructors and manage schedules.</p>
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Manage Courses →
              </button>
            </div>
          )}

          {/* Evaluation Management */}
          {canManageEvaluations(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-green-500"
                 onClick={() => navigate('/evaluation-questions')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Evaluation Management</h3>
                  <p className="text-sm text-gray-500">Configure evaluations</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Create questionnaires, set evaluation periods, and manage responses.</p>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Manage Evaluations →
              </button>
            </div>
          )}

          {/* Evaluation Period Management */}
          {canManageEvaluations(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-purple-500"
                 onClick={() => navigate('/admin/periods')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Evaluation Periods</h3>
                  <p className="text-sm text-gray-500">Control evaluation schedules</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Open/close evaluation periods, monitor participation, send reminders.</p>
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Manage Periods →
              </button>
            </div>
          )}

          {/* System Configuration */}
          {canConfigureSystem(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-orange-500"
                 onClick={() => navigate('/admin/settings')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">System Settings</h3>
                  <p className="text-sm text-gray-500">Configure system</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Configure system-wide settings, deadlines, and notifications.</p>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Configure System →
              </button>
            </div>
          )}

          {/* Data Export */}
          {canExportData(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-indigo-500"
                 onClick={() => navigate('/admin/export')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Data Export</h3>
                  <p className="text-sm text-gray-500">Export system data</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Export all system data in various formats (CSV, PDF, Excel).</p>
              <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Export Data →
              </button>
            </div>
          )}

          {/* Audit Logs */}
          {canViewAuditLogs(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-red-500"
                 onClick={() => navigate('/admin/audit-logs')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Audit Logs</h3>
                  <p className="text-sm text-gray-500">View system activity</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Monitor system activity, user actions, and security events.</p>
              <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                View Logs →
              </button>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Program Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Program Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="courses" fill="#7a0000" name="Courses" />
                <Bar dataKey="students" fill="#10b981" name="Students" />
                <Bar dataKey="evaluations" fill="#3b82f6" name="Evaluations" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* User Roles Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">User Roles Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userRolesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userRolesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Sentiment Analysis Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
