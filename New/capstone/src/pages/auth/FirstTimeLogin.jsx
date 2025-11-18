import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../../services/api'

export default function FirstTimeLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '' })
  const [showPassword, setShowPassword] = useState(false)

  // Get user data from location state (passed from login)
  const userData = location.state?.user
  const tempPassword = location.state?.tempPassword

  useEffect(() => {
    // Redirect if no user data
    if (!userData || !tempPassword) {
      navigate('/login')
    }
  }, [userData, tempPassword, navigate])

  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) {
      return { score: 0, message: '', color: '' }
    }

    let score = 0
    let message = ''
    let color = ''

    // Length check
    if (password.length >= 8) score++
    if (password.length >= 12) score++

    // Character variety checks
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    // Determine strength
    if (score <= 2) {
      message = 'Weak - Add more variety'
      color = 'text-red-600'
    } else if (score <= 4) {
      message = 'Medium - Good, but could be stronger'
      color = 'text-yellow-600'
    } else {
      message = 'Strong - Excellent password!'
      color = 'text-green-600'
    }

    return { score, message, color }
  }

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(formData.newPassword))
  }, [formData.newPassword])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Check if new password is same as temporary
    if (formData.newPassword === tempPassword) {
      setError('New password cannot be the same as your temporary password')
      return
    }

    try {
      setSubmitting(true)
      
      // Call change password API
      await authAPI.changePassword(userData.id, tempPassword, formData.newPassword)
      
      // Store updated user data
      const updatedUser = { ...userData, first_login: false }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // Show success message
      alert('✅ Password changed successfully! Redirecting to your dashboard...')
      
      // Redirect based on role
      const roleRoutes = {
        admin: '/admin/dashboard',
        system_admin: '/admin/dashboard',
        department_head: '/depthead/dashboard',
        secretary: '/secretary/dashboard',
        instructor: '/instructor/dashboard',
        student: '/student/courses'
      }
      
      const redirectPath = roleRoutes[userData.role] || '/dashboard'
      navigate(redirectPath, { replace: true })
      
    } catch (err) {
      console.error('Password change error:', err)
      setError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!userData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7a0000] via-[#8f0000] to-[#a00000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7a0000] to-[#a00000] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">First Time Login</h1>
          <p className="text-gray-600">Welcome, {userData.first_name}!</p>
          <p className="text-sm text-gray-500 mt-2">Please change your temporary password to secure your account</p>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900">Account Security</p>
              <p className="text-xs text-blue-800 mt-1">
                For your security, you must change your temporary password before accessing the system.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000] transition-all"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={`font-semibold ${passwordStrength.color}`}>
                    {passwordStrength.message}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score <= 4 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Password must be at least 8 characters and include a mix of letters, numbers, and symbols
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000] transition-all"
              placeholder="Confirm your new password"
            />
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center">
                <svg className={`w-4 h-4 mr-2 ${formData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                At least 8 characters long
              </li>
              <li className="flex items-center">
                <svg className={`w-4 h-4 mr-2 ${/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Mix of uppercase and lowercase letters
              </li>
              <li className="flex items-center">
                <svg className={`w-4 h-4 mr-2 ${/[0-9]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                At least one number
              </li>
              <li className="flex items-center">
                <svg className={`w-4 h-4 mr-2 ${/[^a-zA-Z0-9]/.test(formData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                At least one special character (@, #, $, etc.)
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || formData.newPassword !== formData.confirmPassword || formData.newPassword.length < 8}
            className="w-full bg-gradient-to-r from-[#7a0000] to-[#a00000] hover:from-[#8f0000] hover:to-[#b00000] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Changing Password...
              </span>
            ) : (
              'Change Password & Continue'
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <div>
              <p className="text-xs font-semibold text-yellow-900">Security Tip</p>
              <p className="text-xs text-yellow-800 mt-1">
                Never share your password with anyone. LPU staff will never ask for your password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
