import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const items = [
  ['','Dashboard'],
  ['sentiment','Sentiment'],
  ['anomalies','Anomalies'],
  ['courses','Courses'],
  ['questions','Questions'],
  ['evaluations','Evaluations']
]

export default function HeadLayout(){
  const nav = useNavigate()
  function logout(){ try{ localStorage.removeItem('role') }catch(e){}; nav('/login') }
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r p-4 flex flex-col h-screen">
        <nav className="flex flex-col gap-2">
          {items.map(([p,label])=> (
            <NavLink key={p} to={p} className={({isActive})=>`p-2 rounded ${isActive? 'bg-[#7a0000] text-white':'text-gray-700'}`} end>{label}</NavLink>
          ))}
        </nav>
  <button className="text-sm text-white bg-[#7a0000] hover:bg-[#8f0000] px-3 py-2 rounded w-full mt-auto" style={{marginBottom: '4rem'}} onClick={logout}>Logout</button>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
