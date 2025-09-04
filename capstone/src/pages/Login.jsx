import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { mockHeads, mockStudents } from '../data/mock'

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
    // check if email matches a department head from mock data (exact match)
    const head = mockHeads.find(h=>h.email.toLowerCase() === lower)
    if(head){
      try{ 
        localStorage.setItem('role','head')
        localStorage.setItem('currentUser', JSON.stringify(head))
      }catch(e){}
      nav('/head')
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
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url('/Back.png')` }}>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-10"></div>
      <div className="relative w-full max-w-md bg-white rounded shadow z-20">
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Login</h2>
          <label className="block mb-2">Email or Username</label>
          <input className="w-full p-2 border rounded mb-3" value={id} onChange={e=>setId(e.target.value)} />
          <label className="block mb-2">Password</label>
          <input type="password" className="w-full p-2 border rounded mb-3" value={pw} onChange={e=>setPw(e.target.value)} />
          {error && <div className="text-red-600 mb-3">{error}</div>}
          <button className="w-full bg-[#7a0000] hover:bg-[#8f0000] text-white py-2 rounded" onClick={submit}>Login</button>
          <div className="mt-2 text-sm"><Link to="/forgot" className="text-[#7a0000]">Forgot password?</Link></div>
          <div className="text-sm text-gray-500 mt-3">Lyceum of the Philippines University-Batangas</div>
        </div>
      </div>
    </div>
  )
}
