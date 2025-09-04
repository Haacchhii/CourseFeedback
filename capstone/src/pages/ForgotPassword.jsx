import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const nav = useNavigate()

  const emailRe = /^[^@]+@(lpubatangas\.edu\.ph)$/i

  function submit(e){
    e.preventDefault()
    setStatus('')
  if(email.toLowerCase().endsWith('@lpu.edu.in')) return setStatus('Access denied. Use your registered LPU email.')
  if(!emailRe.test(email)) return setStatus('Access denied. Use your registered LPU email.')
    // mock: pretend to send reset link
    setStatus('A password reset link has been sent to your email.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Forgot Password</h2>
        <form onSubmit={submit}>
          <label className="block mb-2">Enter your email</label>
          <input className="w-full p-2 border rounded mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
          {status && <div className="text-sm mb-3 text-gray-700">{status}</div>}
          <div className="flex gap-2">
            <button type="submit" className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-4 py-2 rounded">Send Link</button>
            <button type="button" className="px-4 py-2 rounded border" onClick={()=>nav('/login')}>Back</button>
          </div>
        </form>
      </div>
    </div>
  )
}
