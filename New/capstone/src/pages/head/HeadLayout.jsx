import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getCurrentUser, getCurrentRole, isSecretary, isDepartmentHead } from '../../utils/roleUtils'

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
  const currentUser = getCurrentUser()
  const currentRole = getCurrentRole()
  
  function logout(){ 
    try{ 
      localStorage.removeItem('role')
      localStorage.removeItem('currentUser')
    }catch(e){}
    nav('/login') 
  }

  const getUserTitle = () => {
    if (isSecretary(currentUser)) return 'Secretary'
    if (isDepartmentHead(currentUser)) return 'Department Head'
    return 'Administrator'
  }

  const getAccessInfo = () => {
    if (isSecretary(currentUser) || isDepartmentHead(currentUser)) {
      return 'Department-Wide Access - All Programs'
    }
    return 'Access Level Unknown'
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r p-4 flex flex-col h-screen">
        {/* User Info Section */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold text-gray-800">
            {currentUser?.name || 'Unknown User'}
          </div>
          <div className="text-xs text-blue-600 font-medium">
            {getUserTitle()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentUser?.department || 'No Department'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {getAccessInfo()}
          </div>
        </div>

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
