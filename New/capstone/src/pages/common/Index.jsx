import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockHeads, mockAdmins, mockStudents } from '../../data/mock'

export default function Index() {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  function submit() {
    setError('')
    const lpuRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i
    const lower = id.toLowerCase()
    
    // Block any access from lpu.edu.in domain
    if(lower.endsWith('@lpu.edu.in')){
      setError('Access denied. Use your registered LPU email.')
      return
    }
    
    // Check if email matches an admin from mock data (exact match)
    const admin = mockAdmins.find(a=>a.email.toLowerCase() === lower)
    if(admin){
      try{ 
        localStorage.setItem('role','admin')
        localStorage.setItem('currentUser', JSON.stringify(admin))
      }catch(e){}
      nav('/dashboard')
      return
    }
    
    // Check if email matches a department head from mock data (exact match)
    const head = mockHeads.find(h=>h.email.toLowerCase() === lower)
    if(head){
      try{ 
        localStorage.setItem('role','head')
        localStorage.setItem('currentUser', JSON.stringify(head))
      }catch(e){}
      nav('/dashboard')
      return
    }
    
    // Check if email matches a student from mock data (exact match)
    const student = mockStudents.find(s=>s.email.toLowerCase() === lower)
    if(student){
      try{ 
        localStorage.setItem('role','student')
        localStorage.setItem('currentUser', JSON.stringify(student))
      }catch(e){}
      nav('/student-evaluation')
      return
    }
    
    setError('Access denied. Use your registered LPU email.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#7a0000] text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Course Insight Guardian</h1>
          <p className="text-sm opacity-90">LPUB - College of Computing, Arts, and Sciences</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Course Insight Guardian
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Advanced Course Evaluation System with AI-Powered Analytics
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#7a0000] mb-2">
                  🤖 SVM Sentiment Analysis
                </h3>
                <p className="text-gray-600">
                  Advanced sentiment analysis using Support Vector Machine algorithms to understand 
                  student feedback and evaluate course satisfaction levels automatically.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#7a0000] mb-2">
                  📊 DBSCAN Anomaly Detection
                </h3>
                <p className="text-gray-600">
                  Density-based clustering algorithm to identify unusual patterns in evaluation 
                  data, helping detect potential issues in course delivery and student satisfaction.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#7a0000] mb-2">
                  📈 Real-time Analytics
                </h3>
                <p className="text-gray-600">
                  Comprehensive dashboards and reporting tools for administrators and department 
                  heads to monitor course performance and student feedback trends.
                </p>
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
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-semibold mb-6 text-center">Login to Continue</h3>
            
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-4 mt-12">
        <p className="text-sm">
          © 2025 Lyceum of the Philippines University - Batangas. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
