import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Invalid or missing reset token')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  // Password validation criteria
  const passwordCriteria = {
    minLength: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  }

  const allCriteriaMet = Object.values(passwordCriteria).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('')
    setError('')

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (!allCriteriaMet) {
      setError('Password does not meet all requirements')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!token) {
      setError('Invalid reset token')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.resetPassword(token, newPassword)
      
      if (response.success) {
        setStatus('Password reset successful! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(response.message || 'Failed to reset password. Please try again.')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError(err.message || 'An error occurred. The reset link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card shadow-card p-8 lg:p-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-800">Reset Password</h2>
        
          {!token ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-input">
              <div className="flex items-start mb-6">
                <svg className="w-6 h-6 text-red-500 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <div>
                  <h3 className="font-bold text-red-800 mb-3">Invalid or Missing Reset Token</h3>
                  <p className="text-sm text-red-700 mb-4">
                    The password reset link is invalid or has expired.
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-input border border-red-200">
                <p className="text-sm font-bold text-gray-800 mb-3">What to do:</p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                  <li>Go back to the <a href="/forgot" className="text-[#7a0000] font-medium hover:underline">Forgot Password</a> page</li>
                  <li>Enter your LPU email address</li>
                  <li>Click "Request Password Reset"</li>
                  <li>Check your email for a new reset link</li>
                  <li>Use the link within 1 hour (links expire after 1 hour)</li>
                </ol>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/forgot')}
                  className="w-full bg-[#7a0000] hover:bg-[#8f0000] text-white px-5 py-3 rounded-button font-semibold transition-all duration-250"
                >
                  Request New Reset Link
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block mb-3 text-gray-700 font-semibold text-base">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 pr-12 rounded-input border-2 border-gray-200 focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-250"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading || status}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
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
              
              {/* Password Requirements Checklist */}
              {newPassword && (
                <div className="mt-4 space-y-3 bg-gray-50 p-5 rounded-input">
                  <p className="text-sm font-bold text-gray-700 mb-3">Password Requirements:</p>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      passwordCriteria.minLength 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                      {passwordCriteria.minLength && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      passwordCriteria.minLength ? 'text-green-700 font-medium' : 'text-gray-600'
                    }`}>
                      At least 8 characters
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      passwordCriteria.hasNumber 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                      {passwordCriteria.hasNumber && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      passwordCriteria.hasNumber ? 'text-green-700 font-medium' : 'text-gray-600'
                    }`}>
                      At least 1 number (0-9)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      passwordCriteria.hasSpecial 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                      {passwordCriteria.hasSpecial && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      passwordCriteria.hasSpecial ? 'text-green-700 font-medium' : 'text-gray-600'
                    }`}>
                      At least 1 special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block mb-3 text-gray-700 font-semibold text-base">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-4 py-3 pr-12 rounded-input border-2 border-gray-200 focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-250"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || status}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            {status && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-input mb-6">
                {status}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-input mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-sm text-red-800 font-semibold">{error}</p>
                    {(error.includes('expired') || error.includes('Invalid')) && (
                      <p className="text-xs text-red-700 mt-3">
                        Reset links expire after 1 hour. <a href="/forgot" className="font-bold hover:underline">Request a new link</a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-5 py-3 rounded-button font-semibold transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1"
                disabled={loading || status || !token}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
              <button
                type="button"
                className="px-5 py-3 rounded-button border border-gray-300 hover:bg-gray-50 transition-all duration-250 font-semibold"
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  )
}
