import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAdmin, isStaffMember, getRoleDisplayName } from '../utils/roleUtils'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: currentUser, logout: authLogout } = useAuth()
  
  // ALL HOOKS MUST BE BEFORE ANY EARLY RETURNS (React Rules of Hooks)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleLogout = () => {
    authLogout()
  }

  // Don't show layout on landing page or auth pages
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/forgot') {
    return children
  }

  // Don't show layout if no user is logged in
  if (!currentUser) {
    return children
  }

  // Admin navigation items
  const adminNavigationItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/enrollment-list', label: 'Enrollment List', icon: '📋' },
    { path: '/admin/student-management', label: 'Student Advancement', icon: '🎓' },
    { path: '/admin/periods', label: 'Evaluation Periods', icon: '📅' },
    { path: '/admin/courses', label: 'Course Management', icon: '📚' },
    { path: '/admin/export', label: 'Data Export', icon: '📤' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' }
  ]

  // Staff navigation items (Secretary/Dept Head)
  const staffNavigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/sentiment', label: 'Sentiment & Anomalies', icon: '💭' },
    { path: '/courses', label: 'Courses', icon: '📚' },
    { path: '/evaluations', label: 'Evaluations', icon: '📝' }
  ]

  // Student navigation items
  const studentNavigationItems = [
    { path: '/student/courses', label: 'My Courses', icon: '📚' }
  ]

  const getNavigationItems = () => {
    if (isAdmin(currentUser)) {
      return adminNavigationItems
    } else if (isStaffMember(currentUser)) {
      return staffNavigationItems
    } else if (currentUser.role === 'student') {
      return studentNavigationItems
    }
    return []
  }

  const getDefaultPath = () => {
    if (isAdmin(currentUser)) return '/admin/dashboard'
    if (isStaffMember(currentUser)) return '/dashboard'
    if (currentUser.role === 'student') return '/student-evaluation'
    return '/dashboard'
  }

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center flex-shrink-0">
              <Link to={getDefaultPath()} className="flex items-center">
                <div className="text-base sm:text-lg md:text-xl font-bold text-[#7a0000] truncate max-w-[150px] sm:max-w-none">
                  Course Insight Guardian
                </div>
              </Link>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-1 justify-center mx-4">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-2 xl:px-3 py-2 rounded-md text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                    isActivePath(item.path)
                      ? 'text-[#7a0000] bg-red-50'
                      : 'text-gray-600 hover:text-[#7a0000] hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1 xl:mr-2">{item.icon}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="xl:hidden">{item.label.split(' ')[0]}</span>
                </Link>
              ))}
            </div>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
              <div className="text-right hidden lg:block">
                <div className="text-xs lg:text-sm font-medium text-gray-800 truncate max-w-[120px] xl:max-w-none">
                  {currentUser.first_name && currentUser.last_name 
                    ? `${currentUser.first_name} ${currentUser.last_name}`
                    : currentUser.name || currentUser.email}
                </div>
                <div className="text-xs text-gray-500">
                  {getRoleDisplayName(currentUser)}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#7a0000] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#7a0000]"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 fixed top-16 left-0 right-0 z-30 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {/* User Info - Mobile */}
            <div className="pb-3 mb-3 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-800 truncate">
                {currentUser.first_name && currentUser.last_name 
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : currentUser.name || currentUser.email}
              </div>
              <div className="text-xs text-gray-500">
                {getRoleDisplayName(currentUser)}
              </div>
            </div>

            {/* Navigation Items */}
            {getNavigationItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActivePath(item.path)
                    ? 'text-[#7a0000] bg-red-50'
                    : 'text-gray-600 hover:text-[#7a0000] hover:bg-gray-50'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Logout Button - Mobile */}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            © 2025 Lyceum of the Philippines University - Batangas. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
