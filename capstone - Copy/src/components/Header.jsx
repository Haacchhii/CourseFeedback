import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header(){
  let role = null
  try{ role = localStorage.getItem('role') }catch(e){}
  const location = useLocation()
  const hideOn = ['/login','/head/login','/forgot']
  const showRole = role && !hideOn.includes(location.pathname)

  return (
  <header className="fixed top-0 left-0 right-0 bg-[#7a0000] text-white shadow z-40">
      <div className="relative">
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
          <img src="/LPU LOGO 2.png" alt="LPU logo" className="h-32 w-32 object-contain" />
        </div>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
          {/* left placeholder (logo is absolutely positioned) */}
          <div className="text-sm" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="font-semibold text-center">CCAS-Course Evaluation</div>
          </div>
        </div>
        {/* role indicator at the absolute far right of the header */}
  <div className="text-sm" style={{position: 'absolute', right: '12rem', top: 0, height: '100%', display: 'flex', alignItems: 'center', zIndex: 50}}>
          {showRole && <span className="uppercase tracking-wider">{role === 'head' ? 'Department Head' : role}</span>}
        </div>
      </div>
    </header>
  )
}
