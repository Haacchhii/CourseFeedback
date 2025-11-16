import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../../components/ChangePasswordModal'

export default function Login(){
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [tempUser, setTempUser] = useState(null)
  const [tempToken, setTempToken] = useState(null)
  const nav = useNavigate()
  const { login } = useAuth()

  const handlePasswordChangeSuccess = () => {
    // Password changed successfully, now proceed with normal login flow
    if (tempUser && tempToken) {
      // Update user object to clear mustChangePassword flag
      const updatedUser = { ...tempUser, mustChangePassword: false }
      
      // Use AuthContext login to store token and user
      login(tempToken, updatedUser)
      
      // Navigate based on role
      const role = updatedUser.role.toLowerCase()
      
      if (role === 'admin') {
        nav('/admin/dashboard')
      } else if (role === 'student') {
        nav('/student/courses')
      } else if (role === 'secretary' || role === 'department_head' || role === 'instructor') {
        nav('/dashboard')
      } else {
        setError('Unknown role. Please contact administrator.')
      }
    }
    
    // Clean up
    setShowChangePassword(false)
    setTempUser(null)
    setTempToken(null)
  }

  async function submit(){
    setError('')
    setLoading(true)
    
    const lpuRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i
    const lower = id.toLowerCase()
    
    // Block any access from lpu.edu.in domain (invalid)
    if(lower.endsWith('@lpu.edu.in')){
      setError('Access denied. Use your registered LPU email.')
      setLoading(false)
      return
    }
    
    try {
      // Call real API for authentication
      const response = await authAPI.login(lower, pw)
      
      if (response.success && response.token && response.user) {
        // Check if user must change password on first login
        if (response.user.mustChangePassword) {
          // Store temp data and show password change modal
          setTempUser(response.user)
          setTempToken(response.token)
          setShowChangePassword(true)
          setLoading(false)
          return
        }

        // Use AuthContext login to store token and user
        login(response.token, response.user)
        
        // Navigate based on role - Simplified
        // Admin → /admin/dashboard
        // Secretary/Dept Head/Instructor → /dashboard  
        // Student → /student/courses
        const role = response.user.role.toLowerCase()
        
        if (role === 'admin') {
          nav('/admin/dashboard')
        } else if (role === 'student') {
          nav('/student/courses')
        } else if (role === 'secretary' || role === 'department_head' || role === 'instructor') {
          // All staff roles go to same dashboard
          nav('/dashboard')
        } else {
          setError('Unknown role. Please contact administrator.')
        }
      } else {
        setError(response.message || 'Invalid email or password')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 sm:px-6 py-8" 
         style={{ backgroundImage: `url('/Back.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Enhanced Background Overlay with Academic Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-[#7a0000]/40 to-black/60 z-10"></div>
      <div className="fixed inset-0 opacity-10 z-10" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffd700' fill-opacity='0.3'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
           }}>
      </div>
      
      {/* Main Login Container */}
      <div className="relative w-full max-w-md z-20">
        {/* LPU Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full shadow-lg mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#7a0000] to-[#a31111] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">LPU</span>
            </div>
          </div>
          <h1 className="text-white text-xl sm:text-2xl font-bold mb-2 tracking-tight px-4">Course Insight Guardian</h1>
          <p className="text-[#ffd700] text-xs sm:text-sm font-medium">Academic Excellence Through Feedback</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#7a0000] to-[#a31111] px-6 sm:px-8 py-4 sm:py-6">
            <h2 className="text-white text-lg sm:text-xl font-bold text-center">
              Welcome Back
            </h2>
            <p className="text-[#ffd700] text-xs sm:text-sm text-center mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1e293b] mb-2">
                  LPU Email Address
                </label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-200 bg-white focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-200 placeholder-gray-400" 
                    placeholder="your.email@lpubatangas.edu.ph"
                    value={id} 
                    onChange={e=>setId(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && submit()}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1e293b] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-200 bg-white focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-200 placeholder-gray-400" 
                    placeholder="Enter your password"
                    value={pw} 
                    onChange={e=>setPw(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && submit()}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-start sm:items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm font-medium break-words">{error}</span>
                </div>
              )}

              {/* Login Button */}
              <button 
                className="w-full bg-gradient-to-r from-[#7a0000] to-[#a31111] hover:from-[#5a0000] hover:to-[#7a0000] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#7a0000]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base" 
                onClick={submit}
                disabled={loading}
              >
                <span className="flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                      </svg>
                    </>
                  )}
                </span>
              </button>

              {/* Additional Links */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 gap-3 sm:gap-0">
                <Link 
                  to="/forgot" 
                  className="text-[#7a0000] hover:text-[#a31111] text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  Forgot Password?
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#7a0000] rounded-full"></div>
                  <span className="text-xs text-gray-500 font-medium">Secure Login</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">
                Lyceum of the Philippines University - Batangas
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                Empowering Academic Excellence Through Technology
              </p>
            </div>
          </div>
        </div>

        {/* Academic Achievement Badges */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
            <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
            <span className="text-white text-xs font-medium">Academic Excellence</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
            <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
            <span className="text-white text-xs font-medium">Innovation Hub</span>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && tempUser && (
        <ChangePasswordModal
          user={tempUser}
          onSuccess={handlePasswordChangeSuccess}
          onCancel={null}  // Cannot cancel on first login
        />
      )}
    </div>
  )
}
