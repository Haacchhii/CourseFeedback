import React, { useMemo, useState, useEffect } from 'react'
import { studentAPI } from '../../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function StudentCourses(){
  const nav = useNavigate()
  const { user, logout: authLogout } = useAuth()
  const [currentStudent, setCurrentStudent] = useState(null)
  const [studentCourses, setStudentCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  function logout(){ 
    authLogout()
  }

  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('')

  // Get current student info and fetch their courses
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get student from auth context or localStorage
        let student = user
        if (!student) {
          const storedUser = localStorage.getItem('currentUser')
          if (storedUser) {
            student = JSON.parse(storedUser)
          }
        }
        
        if (!student) {
          setError('No student information found')
          return
        }
        
        setCurrentStudent(student)
        
        // Fetch student's courses from API
        const courses = await studentAPI.getCourses(student.id)
        setStudentCourses(courses || [])
        
      } catch (err) {
        console.error('Error fetching student courses:', err)
        setError(err.message || 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudentData()
  }, [user])

  const semesters = useMemo(() => {
    const s = Array.from(new Set(studentCourses.map(c => c.semester)));
    return ['All', ...s]
  }, [studentCourses])

  const filtered = useMemo(() => {
    return studentCourses.filter(c => {
      if(semester && semester !== 'All' && c.semester !== semester) return false
      if(!query) return true
      const q = query.toLowerCase()
      return c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.classCode.toLowerCase().includes(q)
    })
  }, [query, semester, studentCourses])

  if (!currentStudent) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your courses...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Error Loading Courses</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#7a0000] text-white rounded-lg hover:bg-[#8f0000] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">My Courses</h1>
            <p className="text-sm text-gray-500">
              {currentStudent.name} - {currentStudent.program} Year {currentStudent.yearLevel}
            </p>
            <p className="text-xs text-gray-400">Select a course to evaluate</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm text-white bg-[#7a0000] hover:bg-[#8f0000] px-3 py-2 rounded" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <input
            type="search"
            name="course-search"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm shadow-inner"
            placeholder="Search courses by name, code, or class code..."
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <select
            className="border border-gray-200 rounded px-3 py-2 text-sm"
            value={semester}
            onChange={e=>setSemester(e.target.value)}
          >
            {semesters.map(s => (
              <option key={s} value={s === 'All' ? 'All' : s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-3 px-4 border-b">Course Code</th>
                <th className="py-3 px-4 border-b">Class Code</th>
                <th className="py-3 px-4 border-b">Subject Name</th>
                <th className="py-3 px-4 border-b">Instructor</th>
                <th className="py-3 px-4 border-b">Semester</th>
                <th className="py-3 px-4 border-b">Status</th>
                <th className="py-3 px-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 px-4 text-center text-sm text-gray-500">No courses found for your program and year level.</td>
                </tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="align-top hover:bg-gray-50">
                  <td className="py-4 px-4 border-b font-semibold text-sm text-blue-600">{c.id}</td>
                  <td className="py-4 px-4 border-b text-sm font-mono text-gray-700">{c.classCode}</td>
                  <td className="py-4 px-4 border-b text-sm font-medium">{c.name}</td>
                  <td className="py-4 px-4 border-b text-sm text-gray-600">{c.instructor}</td>
                  <td className="py-4 px-4 border-b text-sm text-gray-600">{c.semester}</td>
                  <td className="py-4 px-4 border-b text-sm">
                    {c.status === 'Done' ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Evaluated</span>
                    ) : (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                    )}
                  </td>
                  <td className="py-4 px-4 border-b text-sm">
                    {c.status === 'Done' ? (
                      <span className="text-sm font-medium text-gray-500">Completed</span>
                    ) : (
                      <Link 
                        to={`/student/evaluate/${c.id}`} 
                        className="inline-flex items-center justify-center px-3 py-1 bg-[#7a0000] text-white rounded text-sm hover:bg-[#8f0000] transition-colors"
                      >
                        Evaluate
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
