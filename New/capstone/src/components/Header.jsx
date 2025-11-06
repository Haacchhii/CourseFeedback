import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header(){
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const hideOn = ['/login','/head/login','/forgot', '/']
  const showRole = user && isAuthenticated() && !hideOn.includes(location.pathname)

  const getRoleDisplay = (role) => {
    switch(role?.toLowerCase()) {
      case 'admin':
        return 'Administrator'
      case 'department_head':
        return 'Department Head'
      case 'secretary':
        return 'Secretary'
      case 'instructor':
        return 'Instructor'
      case 'student':
        return 'Student'
      default:
        return role
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#7a0000] text-white shadow z-40">
      <div className="relative">
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
          <img src="/LPU LOGO 2.png" alt="LPU logo" className="h-32 w-32 object-contain" />
        </div>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
          {/* left placeholder (logo is absolutely positioned) */}
          <div className="text-sm" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="font-semibold text-center">CCAS-Course Evaluation</div>
          </div>
        </div>
        
        {/* Role indicator and logout button at the right */}
        {showRole && (
          <div className="absolute right-4 top-0 h-full flex items-center gap-4 z-50">
            <div className="text-sm uppercase tracking-wider">
              {getRoleDisplay(user.role)}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
