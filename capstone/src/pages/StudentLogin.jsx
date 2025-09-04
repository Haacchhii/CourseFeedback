import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockHeads, mockStudents } from '../data/mock'

export default function StudentLogin(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  function validate(){
    setError('')
    const lpuRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i
  // Block lpu.edu.in domain explicitly
  if(email.toLowerCase().endsWith('@lpu.edu.in')) return setError('Access denied. Use your registered LPU email.')
  if(!lpuRe.test(email)) return setError('Access denied. Use your registered LPU email.')
    if(password.length < 4) return setError('Password too short')
  // Prevent department head emails from logging in as student
    if(mockHeads && mockHeads.some(h=>h.email.toLowerCase() === email.toLowerCase())){
      return setError('Access denied. Use your registered LPU email.')
    }
    // Only allow login if email exists in mockStudents
    if(!(mockStudents && mockStudents.some(s=>s.email.toLowerCase() === email.toLowerCase()))) {
      return setError('Access denied. Use your registered LPU email.')
    }
    // mock login
    try{ localStorage.setItem('role','student') }catch(e){}
    nav('/student/courses')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center">
        <img src="/LPU LOGO 2.png" alt="LPU logo" className="h-16 w-16 mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-gray-800">Welcome, Student</h2>
        <p className="text-gray-500 mb-6 text-center">Sign in to access your courses and evaluations.</p>
        <form className="w-full" onSubmit={e=>{e.preventDefault();validate();}}>
          <label className="block mb-2 text-gray-700 font-medium">LPU Email</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7a0000] transition" value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="block mb-2 text-gray-700 font-medium">Password</label>
          <input type="password" className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7a0000] transition" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}
          <button className="w-full bg-[#7a0000] hover:bg-[#8f0000] text-white py-3 rounded-lg font-semibold shadow transition-transform duration-150 hover:scale-105" type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}
