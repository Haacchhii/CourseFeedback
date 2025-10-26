import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { mockHeads, mockAdmins, mockSecretaries, mockStudents } from '../../data/mock'

export default function Login(){
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  function submit(){
    setError('')
    const lpuRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i
    const lower = id.toLowerCase()
    // Block any access from lpu.edu.in domain
    if(lower.endsWith('@lpu.edu.in')){
      setError('Access denied Use your registered LPU email.')
      return
    }
    
    // Check if email matches a System Administrator (FULL CONTROL)
    const systemAdmin = mockAdmins.find(a => a.email.toLowerCase() === lower)
    if(systemAdmin){
      try{ 
        localStorage.setItem('role', 'system-admin')
        localStorage.setItem('currentUser', JSON.stringify(systemAdmin))
      }catch(e){}
      nav('/admin/dashboard') // System Admins go to admin dashboard
      return
    }
    
    // Check if email matches a Secretary (VIEW-ONLY)
    const secretary = mockSecretaries.find(s => s.email.toLowerCase() === lower)
    if(secretary){
      try{ 
        localStorage.setItem('role', 'secretary')
        localStorage.setItem('currentUser', JSON.stringify(secretary))
      }catch(e){}
      nav('/dashboard') // Secretaries go to main dashboard (view-only)
      return
    }
    
    // check if email matches a department head from mock data (exact match)
    // Department Heads have program-specific access
    const head = mockHeads.find(h=>h.email.toLowerCase() === lower)
    if(head){
      try{ 
        localStorage.setItem('role','head')
        localStorage.setItem('currentUser', JSON.stringify(head))
      }catch(e){}
      nav('/dashboard') // Department Heads use main dashboard
      return
    }
    
    // check if email matches a student from mock data (exact match)
    const student = mockStudents.find(s=>s.email.toLowerCase() === lower)
    if(student){
      try{ 
        localStorage.setItem('role','student')
        localStorage.setItem('currentUser', JSON.stringify(student))
      }catch(e){}
      nav('/student/courses')
      return
    }
  setError('Access denied use your registered LPU email.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
         style={{ backgroundImage: `url('/Back.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Enhanced Background Overlay with Academic Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-[#7a0000]/40 to-black/60 z-10"></div>
      <div className="fixed inset-0 opacity-10 z-10" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffd700' fill-opacity='0.3'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
           }}>
      </div>
      
      {/* Main Login Container */}
      <div className="relative w-full max-w-md mx-4 z-20">
        {/* LPU Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7a0000] to-[#a31111] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">LPU</span>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2 tracking-tight">Course Insight Guardian</h1>
          <p className="text-[#ffd700] text-sm font-medium">Academic Excellence Through Feedback</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#7a0000] to-[#a31111] px-8 py-6">
            <h2 className="text-white text-xl font-bold text-center">
              Welcome Back
            </h2>
            <p className="text-[#ffd700] text-sm text-center mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Card Body */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">
                  LPU Email Address
                </label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-200 placeholder-gray-400" 
                    placeholder="your.email@lpubatangas.edu.ph"
                    value={id} 
                    onChange={e=>setId(e.target.value)} 
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white focus:border-[#7a0000] focus:ring-2 focus:ring-[#7a0000]/20 transition-all duration-200 placeholder-gray-400" 
                    placeholder="Enter your password"
                    value={pw} 
                    onChange={e=>setPw(e.target.value)} 
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Login Button */}
              <button 
                className="w-full bg-gradient-to-r from-[#7a0000] to-[#a31111] hover:from-[#5a0000] hover:to-[#7a0000] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#7a0000]/50" 
                onClick={submit}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Sign In to Dashboard</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                </span>
              </button>

              {/* Additional Links */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Link 
                  to="/forgot" 
                  className="text-[#7a0000] hover:text-[#a31111] text-sm font-medium transition-colors duration-200"
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
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">
                Lyceum of the Philippines University - Batangas
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Empowering Academic Excellence Through Technology
              </p>
            </div>
          </div>
        </div>

        {/* Academic Achievement Badges */}
        <div className="flex justify-center space-x-4 mt-8">
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
            <span className="text-white text-xs font-medium">Academic Excellence</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
            <span className="text-white text-xs font-medium">Innovation Hub</span>
          </div>
        </div>
      </div>
    </div>
  )
}
