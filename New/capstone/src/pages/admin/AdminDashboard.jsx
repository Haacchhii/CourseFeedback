import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { isAdmin, canManageUsers, canManageCourses, canManageEvaluations, canConfigureSystem, canExportData, canViewAuditLogs, getRoleDisplayName } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'

const COLORS = ['#7a0000', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Use custom hook for data fetching with timeout
  const { data: apiResponse, loading, error, retry } = useApiWithTimeout(
    async () => {
      const response = await adminAPI.getDashboardStats()
      return response.data || response
    },
    [currentUser?.id, currentUser?.role]
  )

  // Extract stats from nested data structure
  const stats = useMemo(() => {
    if (!apiResponse) return null
    // If data is already flat, return as is
    if (apiResponse.totalUsers !== undefined) return apiResponse
    // If data is nested, extract it
    if (apiResponse.data) return apiResponse.data
    return apiResponse
  }, [apiResponse])

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
  }, [currentUser?.role, currentUser?.id, navigate])

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

  if (!currentUser || !isAdmin(currentUser)) return null

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={retry} />
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      {/* Enhanced LPU Header with Better Spacing */}
      <header className="lpu-header">
        <div className="container mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-5">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl lg:text-4xl">Course Insight Guardian</h1>
                <p className="lpu-header-subtitle text-base lg:text-lg mt-1">System Administration Panel</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 lg:px-8 py-4 lg:py-5 text-left lg:text-right w-full lg:w-auto">
              <p className="text-[#ffd700] text-sm font-medium">Welcome back,</p>
              <p className="text-white font-bold text-lg lg:text-xl mt-1">{currentUser?.first_name || currentUser?.name || 'Admin'} {currentUser?.last_name || ''}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Enhanced Statistics Cards with Improved Spacing */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-12">
          {/* Total Users Card */}
          <div
            className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 hover:shadow-card-hover transition-all duration-250 cursor-pointer group"
            onClick={() => navigate('/admin/users')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Total Users</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white mb-2">{stats.totalUsers}</p>
                <p className="text-sm text-white/90 font-medium">System-wide</p>
              </div>
              <div className="w-16 h-16 lg:w-18 lg:h-18 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-250 flex-shrink-0">
                <svg className="w-8 h-8 lg:w-9 lg:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Total Courses Card */}
          <div
            className="bg-gradient-to-br from-[#C41E3A] to-[#9D1535] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 hover:shadow-card-hover transition-all duration-250 cursor-pointer group"
            onClick={() => navigate('/admin/courses')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Total Courses</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white mb-2">{stats.totalCourses}</p>
                <p className="text-sm text-white/90 font-medium">{stats.totalPrograms} Programs</p>
              </div>
              <div className="w-16 h-16 lg:w-18 lg:h-18 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-250 flex-shrink-0">
                <svg className="w-8 h-8 lg:w-9 lg:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Total Evaluations Card */}
          <div
            className="bg-gradient-to-br from-[#9D1535] to-[#7D1028] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 hover:shadow-card-hover transition-all duration-250 cursor-pointer group"
            onClick={() => navigate('/admin/periods')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Total Evaluations</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white mb-2">{stats.totalEvaluations}</p>
                <p className="text-sm text-white/90 font-medium">{stats.participationRate}% Participation</p>
              </div>
              <div className="w-16 h-16 lg:w-18 lg:h-18 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-250 flex-shrink-0">
                <svg className="w-8 h-8 lg:w-9 lg:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions Grid with Better Spacing */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {/* User Management */}
          {canManageUsers(currentUser) && (
            <div className="bg-white rounded-card shadow-card p-8 hover:shadow-card-hover transition-all duration-250 cursor-pointer border-2 border-transparent hover:border-[#9D1535] group"
                 onClick={() => navigate('/admin/users')}>
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mr-5 group-hover:bg-red-200 transition-colors duration-250 flex-shrink-0">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">User Management</h3>
                  <p className="text-sm text-gray-500 font-medium">Manage all user accounts</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">Create, edit, and delete user accounts. Assign roles and manage permissions.</p>
              <button className="w-full bg-red-500 hover:bg-red-700 text-white font-semibold py-3 px-5 rounded-button transition-colors duration-250 flex items-center justify-center">
                Manage Users
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Course Management */}
          {canManageCourses(currentUser) && (
            <div className="bg-white rounded-card shadow-card p-8 hover:shadow-card-hover transition-all duration-250 cursor-pointer border-2 border-transparent hover:border-[#9D1535] group"
                 onClick={() => navigate('/admin/courses')}>
              <div className="flex items-start mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mr-5 group-hover:bg-red-200 transition-colors duration-250 flex-shrink-0">
                  <svg className="w-7 h-7 text-[#9D1535]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Course Management</h3>
                  <p className="text-sm text-gray-500 font-medium">Manage all courses</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">Create, edit, and delete courses. Assign instructors and manage schedules.</p>
              <button className="w-full bg-gradient-to-r from-[#9D1535] to-[#7D1028] hover:from-[#7D1028] hover:to-[#5D0C1F] text-white font-semibold py-3 px-5 rounded-button transition-colors duration-250 flex items-center justify-center">
                Manage Courses
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Evaluation Period Management */}
          {canManageEvaluations(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-yellow-500"
                 onClick={() => navigate('/admin/periods')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Evaluation Periods</h3>
                  <p className="text-sm text-gray-500">Control evaluation schedules</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Open/close evaluation periods, monitor participation.</p>
              <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Manage Periods →
              </button>
            </div>
          )}

          {/* Student Year Level Management */}
          {canManageUsers(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-green-500"
                 onClick={() => navigate('/admin/student-management')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Student Management</h3>
                  <p className="text-sm text-gray-500">Year advancement & transitions</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Advance students to next year level and transition enrollments.</p>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Manage Students →
              </button>
            </div>
          )}

          {/* Email Notifications */}
          {canConfigureSystem(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-red-500"
                 onClick={() => navigate('/admin/emails')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Send automated emails</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Send period notifications and system alerts to students.</p>
              <button className="w-full bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Manage Emails →
              </button>
            </div>
          )}



          {/* Data Export */}
          {canExportData(currentUser) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-red-500"
                 onClick={() => navigate('/admin/export')}>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Data Export</h3>
                  <p className="text-sm text-gray-500">Export system data</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Export all system data in various formats (CSV, PDF, Excel).</p>
              <button className="w-full bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
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
              <button className="w-full bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                View Logs →
              </button>
            </div>
          )}
        </div>

        {/* Charts Section with Enhanced Spacing */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Program Distribution */}
          <div className="bg-white rounded-card shadow-card p-8 lg:p-10">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Program Distribution</h3>
              <p className="text-sm text-gray-600">Courses, students, and evaluations by program</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
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
          <div className="bg-white rounded-card shadow-card p-8 lg:p-10">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">User Roles Distribution</h3>
              <p className="text-sm text-gray-600">System users by role type</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
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


      </div>
    </div>
  )
}





