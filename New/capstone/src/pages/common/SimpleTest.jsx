import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function SimpleTest() {
  const navigate = useNavigate()

  const testLogin = (role) => {
    // Simulate login
    const testUsers = {
      admin: {
        email: 'admin@lpubatangas.edu.ph',
        name: 'Test Admin',
        role: 'admin',
        department: 'Academic Affairs',
        assignedPrograms: ['BSIT', 'BSCS', 'BSCS-DS', 'BS-CY', 'BMA']
      },
      head: {
        email: 'melodydimaano@lpubatangas.edu.ph',
        name: 'Melody Dimaano',
        role: 'head',
        department: 'Information Technology',
        assignedPrograms: ['BSIT']
      },
      student: {
        email: 'maria.santos.bsit1@lpubatangas.edu.ph',
        name: 'Maria Santos',
        role: 'student',
        program: 'BSIT',
        yearLevel: 1
      }
    }

    const user = testUsers[role]
    localStorage.setItem('role', role)
    localStorage.setItem('currentUser', JSON.stringify(user))

    // Navigate based on role
    if (role === 'admin') navigate('/dashboard')
    else if (role === 'head') navigate('/head')
    else if (role === 'student') navigate('/student/courses')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#7a0000] mb-2">🧪 Simple Test Page</h1>
          <p className="text-gray-600">Click a button to test login and navigation</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => testLogin('admin')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            🔐 Test Admin Login
            <div className="text-sm font-normal mt-1">Should go to /dashboard</div>
          </button>

          <button
            onClick={() => testLogin('head')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            🔐 Test Department Head Login
            <div className="text-sm font-normal mt-1">Should go to /head</div>
          </button>

          <button
            onClick={() => testLogin('student')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            🔐 Test Student Login
            <div className="text-sm font-normal mt-1">Should go to /student/courses</div>
          </button>

          <hr className="my-6" />

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Go to Real Login Page
          </button>

          <button
            onClick={() => navigate('/debug')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Go to Debug Page
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If you see a blank screen after clicking, check the browser console (F12) for errors.
            The Error Boundary should catch and display them.
          </p>
        </div>
      </div>
    </div>
  )
}
