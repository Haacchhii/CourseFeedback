import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import apiService from '../../services/api'

export default function Login(){
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function submit(){
    setError('')
    const lpuRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i
    const lower = id.toLowerCase()
    // Block any access from lpu.edu.in domain
    if(lower.endsWith('@lpu.edu.in')){
      setError('Access denied Use your registered LPU email.')
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
          nav('/head')
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
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center px-4" style={{ backgroundImage: `url('/Back.png')` }}>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-10"></div>
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-lg shadow-lg z-20">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Login</h2>
          <label className="block mb-2 text-sm font-medium text-gray-700">Email or Username</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-[#7a0000] focus:border-transparent" 
                 value={id} onChange={e=>setId(e.target.value)} />
          <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
          <input type="password" 
                 className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-[#7a0000] focus:border-transparent" 
                 value={pw} onChange={e=>setPw(e.target.value)} />
          {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
          <button className="w-full bg-[#7a0000] hover:bg-[#8f0000] text-white py-3 rounded-lg font-semibold transition duration-200" 
                  onClick={submit}>Login</button>
          <div className="mt-2 text-sm"><Link to="/forgot" className="text-[#7a0000]">Forgot password?</Link></div>
          <div className="text-sm text-gray-500 mt-3">Lyceum of the Philippines University-Batangas</div>
        </div>
      </div>
    </div>
  )
}
