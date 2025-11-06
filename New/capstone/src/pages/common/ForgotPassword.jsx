import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const emailRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i

  async function submit(e){
    e.preventDefault()
    setStatus('')
    setError('')
    
    if(email.toLowerCase().endsWith('@lpu.edu.in')) {
      setError('Access denied. Use your registered LPU email.')
      return
    }
    
    if(!emailRe.test(email)) {
      setError('Please use your LPU Batangas email address.')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await authAPI.forgotPassword(email)
      
      if (response.success) {
        setStatus('A password reset link has been sent to your email.')
      } else {
        setError(response.message || 'Failed to send reset link. Please try again.')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Forgot Password</h2>
        <form onSubmit={submit}>
          <label className="block mb-2 text-gray-700 font-medium">Enter your email</label>
                    <input
            type="email"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all"
            placeholder="your.email@lpubatangas.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'success'}
          />
          
          {status && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-3">
              {status}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-3">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <button 
              type="submit" 
              className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-6 py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
            <button 
              type="button" 
              className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 font-medium"
              onClick={()=>nav('/login')}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
