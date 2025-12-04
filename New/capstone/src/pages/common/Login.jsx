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
  const [showPassword, setShowPassword] = useState(false)
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
        // Check if this is first-time login (redirect to password change page)
        if (response.user.firstLogin) {
          // Navigate to first-time login page with user data and temp password
          nav('/first-time-login', { 
            state: { 
              user: response.user, 
              tempPassword: pw  // Pass the temp password they just used
            } 
          })
          setLoading(false)
          return
        }
        
        // Check if user must change password on first login (legacy support)
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
        // Secretary/Dept Head → /dashboard  
        // Student → /student/courses
        const role = response.user.role.toLowerCase()
        
        if (role === 'admin') {
          nav('/admin/dashboard')
        } else if (role === 'student') {
          nav('/student/courses')
        } else if (role === 'secretary' || role === 'department_head') {
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center relative overflow-hidden p-6 sm:p-8"
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-white rounded-full shadow-card mb-6">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#7a0000] to-[#a31111] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl lg:text-2xl">LPU</span>
            </div>
          </div>
          <h1 className="text-white text-2xl lg:text-3xl font-bold mb-3 tracking-tight">Course Insight Guardian</h1>
          <p className="text-[#ffd700] text-sm lg:text-base font-medium">Academic Excellence Through Feedback</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-card shadow-card border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#7a0000] to-[#a31111] px-8 lg:px-10 py-6 lg:py-8">
            <h2 className="text-white text-xl lg:text-2xl font-bold text-center">
              Welcome Back
            </h2>
            <p className="text-[#ffd700] text-sm lg:text-base text-center mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Card Body */}
          <div className="p-8 lg:p-10">
            <div className="space-y-6 lg:space-y-8">
              {/* Email Input */}
              <div>
                <label className="block text-sm lg:text-base font-semibold text-[#1e293b] mb-3">
                  LPU Email Address
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 text-base rounded-input border-2 border-gray-200 bg-white focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-250 placeholder-gray-400"
                    placeholder="your.email@lpubatangas.edu.ph"
                    value={id}
                    onChange={e=>setId(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && submit()}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm lg:text-base font-semibold text-[#1e293b] mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 pr-12 text-base rounded-input border-2 border-gray-200 bg-white focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-250 placeholder-gray-400"
                    placeholder="Enter your password"
                    value={pw}
                    onChange={e=>setPw(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && submit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-input flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm font-medium break-words">{error}</span>
                </div>
              )}

              {/* Login Button */}
              <button
                className="w-full bg-gradient-to-r from-[#7a0000] to-[#a31111] hover:from-[#5a0000] hover:to-[#7a0000] text-white font-semibold py-3 px-5 rounded-button transition-all duration-250 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-[#7a0000]/50 disabled:opacity-50 disabled:cursor-not-allowed text-base"
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
              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200 gap-4">
                <Link
                  to="/forgot"
                  className="text-[#7a0000] hover:text-[#a31111] text-sm font-medium transition-colors duration-250"
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
          <div className="bg-gray-50 px-8 lg:px-10 py-5 lg:py-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">
                Lyceum of the Philippines University - Batangas
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Empowering Academic Excellence Through Technology
              </p>
            </div>
          </div>
        </div>

        {/* Academic Achievement Badges */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-5 mt-8">
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2.5">
            <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
            <span className="text-white text-sm font-medium">Academic Excellence</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2.5">
            <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
            <span className="text-white text-sm font-medium">Innovation Hub</span>
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
