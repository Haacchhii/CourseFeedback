import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../utils/roleUtils'
import { mockAdmins, mockHeads, mockStudents, mockCourses, mockEvaluations } from '../../data/mock'

export default function Debug() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  const quickLogin = (email, role) => {
    const user = role === 'admin' 
      ? mockAdmins.find(a => a.email === email)
      : role === 'head'
      ? mockHeads.find(h => h.email === email)
      : mockStudents.find(s => s.email === email)

    if (user) {
      localStorage.setItem('role', role)
      localStorage.setItem('currentUser', JSON.stringify(user))
      
      if (role === 'admin') navigate('/dashboard')
      else if (role === 'head') navigate('/head')
      else if (role === 'student') navigate('/student/courses')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#7a0000] mb-8">Debug Panel</h1>

        {/* Current User Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
          {currentUser ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {currentUser.name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Role:</strong> {currentUser.role}</p>
              <p><strong>Department:</strong> {currentUser.department}</p>
              <p><strong>Programs:</strong> {currentUser.assignedPrograms?.join(', ') || 'None'}</p>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <p className="text-gray-600">No user logged in</p>
          )}
        </div>

        {/* Quick Login Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Login</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Admin (Full Access)</h3>
              <button
                onClick={() => quickLogin('admin@lpubatangas.edu.ph', 'admin')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2"
              >
                Login as Admin
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-blue-700 mb-2">Department Heads</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => quickLogin('melodydimaano@lpubatangas.edu.ph', 'head')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  IT Head (Melody)
                </button>
                <button
                  onClick={() => quickLogin('dr.rivera@lpubatangas.edu.ph', 'head')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  CS Head (Dr. Rivera)
                </button>
                <button
                  onClick={() => quickLogin('prof.santos@lpubatangas.edu.ph', 'head')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  CY Head (Prof. Santos)
                </button>
                <button
                  onClick={() => quickLogin('dr.mendoza@lpubatangas.edu.ph', 'head')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  BMA Head (Dr. Mendoza)
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-purple-700 mb-2">Students</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => quickLogin('maria.santos.bsit1@lpubatangas.edu.ph', 'student')}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Maria Santos (BSIT)
                </button>
                <button
                  onClick={() => quickLogin('sophia.martinez.bscsds1@lpubatangas.edu.ph', 'student')}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Sophia Martinez (BSCS-DS)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">System Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Total Admins:</p>
              <p>{mockAdmins.length}</p>
            </div>
            <div>
              <p className="font-semibold">Total Heads:</p>
              <p>{mockHeads.length}</p>
            </div>
            <div>
              <p className="font-semibold">Total Students:</p>
              <p>{mockStudents.length}</p>
            </div>
            <div>
              <p className="font-semibold">Total Courses:</p>
              <p>{mockCourses.length}</p>
            </div>
            <div>
              <p className="font-semibold">Total Evaluations:</p>
              <p>{mockEvaluations.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Direct Navigation</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Home</button>
            <button onClick={() => navigate('/login')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Login</button>
            <button onClick={() => navigate('/dashboard')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Dashboard</button>
            <button onClick={() => navigate('/head')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Head</button>
            <button onClick={() => navigate('/student/courses')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Student Courses</button>
          </div>
        </div>
      </div>
    </div>
  )
}
