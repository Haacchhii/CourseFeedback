import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../utils/roleUtils'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('role')
    navigate('/')
  }

  // Don't show layout on landing page or auth pages
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/forgot') {
    return children
  }

  // Don't show layout if no user is logged in
  if (!currentUser) {
    return children
  }

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/sentiment', label: 'Sentiment Analysis', icon: '💭' },
    { path: '/anomalies', label: 'Anomaly Detection', icon: '🔍' },
    { path: '/courses', label: 'Courses', icon: '📚' },
    { path: '/evaluations', label: 'Evaluations', icon: '📝' },
    { path: '/evaluation-questions', label: 'Questions', icon: '❓' },
    ...(isAdmin(currentUser) ? [{ path: '/students', label: 'Students', icon: '👥' }, { path: '/api-test', label: 'API Test', icon: '🔧' }] : [])
  ]

  const studentNavigationItems = [
    { path: '/student-evaluation', label: 'Course Evaluation', icon: '📝' }
  ]

  const getNavigationItems = () => {
    if (currentUser.role === 'student') {
      return studentNavigationItems
    }
    if (isAdmin(currentUser) || isDepartmentHead(currentUser)) {
      return navigationItems
    }
    return []
  }

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <Link to={currentUser.role === 'student' ? '/student-evaluation' : '/dashboard'} className="flex items-center">
                <div className="text-xl font-bold text-[#7a0000]">Course Insight Guardian</div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-8">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'text-[#7a0000] bg-red-50'
                      : 'text-gray-600 hover:text-[#7a0000] hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">{currentUser.name}</div>
                <div className="text-xs text-gray-500">
                  {isAdmin(currentUser) ? 'Administrator' : 
                   isDepartmentHead(currentUser) ? `${currentUser.department || 'Department'} Head` : 
                   currentUser.role === 'student' ? 'Student' : 'User'}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">⏻</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 fixed top-16 left-0 right-0 z-30">
        <div className="px-4 py-3 space-y-1">
          {getNavigationItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActivePath(item.path)
                  ? 'text-[#7a0000] bg-red-50'
                  : 'text-gray-600 hover:text-[#7a0000] hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 md:pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            © 2025 Lyceum of the Philippines University - Batangas. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
