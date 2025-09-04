import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockHeads } from '../data/mock'

export default function HeadLogin(){
  const [user, setUser] = useState('')
  const [pw, setPw] = useState('')
  const nav = useNavigate()

  function login(){
    // Only allow if email exists in mockHeads
    if(mockHeads && mockHeads.some(h=>h.email.toLowerCase() === user.toLowerCase())){
      try{ localStorage.setItem('role','head') }catch(e){}
      nav('/head')
      return
    }
    alert('Access denied. Use your registered LPU email.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center">
        <img src="/LPU LOGO 2.png" alt="LPU logo" className="h-16 w-16 mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-gray-800">Welcome, Department Head</h2>
        <p className="text-gray-500 mb-6 text-center">Sign in to manage courses and view evaluations.</p>
        <form className="w-full" onSubmit={e=>{e.preventDefault();login();}}>
          <label className="block mb-2 text-gray-700 font-medium">Email</label>
          <input className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7a0000] transition" value={user} onChange={e=>setUser(e.target.value)} />
          <label className="block mb-2 text-gray-700 font-medium">Password</label>
          <input type="password" className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7a0000] transition" value={pw} onChange={e=>setPw(e.target.value)} />
          <button className="w-full bg-[#7a0000] hover:bg-[#8f0000] text-white py-3 rounded-lg font-semibold shadow transition-transform duration-150 hover:scale-105" type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}
