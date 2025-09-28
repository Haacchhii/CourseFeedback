import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/api'

export default function Index() {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function submit() {
    setError('')
    const lpuRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i
    const lower = id.toLowerCase()
    
    // Block any access from lpu.edu.in domain
    if(lower.endsWith('@lpu.edu.in')){
      setError('Access denied. Use your registered LPU email.')
      return
    }
    
    try {
      // Authenticate user with database
      const response = await apiService.authenticateUser(lower, pw)
      
      if (response.success && response.user) {
        const user = response.user
        
        try{ 
          localStorage.setItem('role', user.role)
          localStorage.setItem('currentUser', JSON.stringify(user))
        }catch(e){
          console.error('Failed to save to localStorage:', e)
        }
        
        // Navigate based on role
        if (user.role === 'secretary') {
          nav('/dashboard') // Secretary (admin) goes to main dashboard
        } else if (user.role === 'department_head') {
          nav('/dashboard')
        } else if (user.role === 'student') {
          nav('/student-evaluation')
        } else {
          setError('Invalid role assigned to account.')
        }
        return
      } else {
        setError('Invalid credentials or account not found.')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Authentication failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#7a0000] text-white p-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-xl md:text-2xl font-bold">Course Insight Guardian</h1>
          <p className="text-xs md:text-sm opacity-90">LPUB - College of Computing, Arts, and Sciences</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Left Side - Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                  Course Insight Guardian
                </h2>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  Comprehensive evaluation system for enhanced learning experiences
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-800 mb-1">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-600">Real-time insights and reporting</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold text-gray-800 mb-1">Smart Evaluation</h3>
                  <p className="text-sm text-gray-600">Intelligent course assessment</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">👥</div>
                  <h3 className="font-semibold text-gray-800 mb-1">Multi-Role Access</h3>
                  <p className="text-sm text-gray-600">Students, heads, administrators</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="font-semibold text-gray-800 mb-1">Secure Platform</h3>
                  <p className="text-sm text-gray-600">Protected data and privacy</p>
                </div>
              </div>

              {/* University Branding */}
              <div className="bg-[#7a0000] text-white p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-2">
                  Lyceum of the Philippines University - Batangas
                </h4>
                <p className="text-sm opacity-90">
                  College of Computing, Arts, and Sciences
                </p>
                <p className="text-xs opacity-75 mt-2">
                  Empowering education through technology and innovation
                </p>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
              <h3 className="text-xl lg:text-2xl font-semibold mb-6 text-center">Login to Continue</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent" 
                  placeholder="your.email@lpubatangas.edu.ph"
                  value={id} 
                  onChange={e=>setId(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent" 
                  placeholder="Enter your password"
                  value={pw} 
                  onChange={e=>setPw(e.target.value)} 
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button 
                className="w-full bg-[#7a0000] hover:bg-[#8f0000] text-white py-3 rounded-lg font-semibold transition duration-200" 
                onClick={submit}
              >
                Login
              </button>

              <div className="text-center">
                <a href="#" className="text-[#7a0000] text-sm hover:underline">
                  Forgot your password?
                </a>
              </div>

              {/* User Type Guide */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Access Levels:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>Students:</strong> Course evaluation interface</li>
                  <li>• <strong>Department Heads:</strong> Department-specific analytics</li>
                  <li>• <strong>Administrators:</strong> System-wide access and controls</li>
                </ul>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4 mt-12">
        <p className="text-sm">
          © 2025 Lyceum of the Philippines University - Batangas. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
