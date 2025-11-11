import React, { useMemo, useState, useEffect } from 'react'
import { studentAPI } from '../../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function StudentCourses(){
  const nav = useNavigate()
  const { user, logout: authLogout } = useAuth()
  
  // ALL STATE AND HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS
  const [currentStudent, setCurrentStudent] = useState(null)
  const [studentCourses, setStudentCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('')
  
  function logout(){ 
    authLogout()
  }

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
        const response = await studentAPI.getCourses(student.id)
        console.log('API Response:', response) // Debug log
        
        // Handle different response formats
        let coursesData = []
        if (Array.isArray(response)) {
          coursesData = response
        } else if (response?.data && Array.isArray(response.data)) {
          coursesData = response.data
        } else if (response?.success && Array.isArray(response.data)) {
          coursesData = response.data
        }
        
        setStudentCourses(coursesData)
        
      } catch (err) {
        console.error('Error fetching student courses:', err)
        setError(err.message || 'Failed to load courses')
        setStudentCourses([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudentData()
  }, [user])

  const semesters = useMemo(() => {
    if (!Array.isArray(studentCourses)) return ['All']
    const s = Array.from(new Set(studentCourses.map(c => c.semester).filter(Boolean)));
    return ['All', ...s]
  }, [studentCourses])

  const filtered = useMemo(() => {
    if (!Array.isArray(studentCourses)) return []
    return studentCourses.filter(c => {
      if(semester && semester !== 'All' && c.semester !== semester) return false
      if(!query) return true
      const q = query.toLowerCase()
      const id = c.id?.toString().toLowerCase() || ''
      const name = c.name?.toLowerCase() || ''
      const classCode = c.class_code?.toLowerCase() || c.classCode?.toLowerCase() || ''
      return id.includes(q) || name.includes(q) || classCode.includes(q)
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold mb-2">My Courses</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {currentStudent.name} - {currentStudent.program} Year {currentStudent.yearLevel}
            </p>
            <p className="text-xs text-gray-400 mt-1">Select a course to evaluate</p>
          </div>
          <div className="flex items-center justify-end sm:justify-start">
            <button className="text-sm text-white bg-[#7a0000] hover:bg-[#8f0000] px-4 py-2 rounded transition-colors whitespace-nowrap" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
          <input
            type="search"
            name="course-search"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm shadow-inner min-w-0"
            placeholder="Search courses..."
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <select
            className="border border-gray-200 rounded px-3 py-2 text-sm min-w-0 sm:w-auto"
            value={semester}
            onChange={e=>setSemester(e.target.value)}
          >
            {semesters.map(s => (
              <option key={s} value={s === 'All' ? 'All' : s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-3">
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">
              No courses found for your program and year level.
            </div>
          )}
          {filtered.map(c => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-sm text-blue-600">{c.id}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{c.classCode}</div>
                </div>
                {c.status === 'Done' ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Evaluated</span>
                ) : (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                )}
              </div>
              <div className="font-medium text-sm mb-2">{c.name}</div>
              <div className="text-xs text-gray-600 mb-2">
                <div>{c.instructor}</div>
                <div className="mt-1">{c.semester}</div>
              </div>
              {c.status === 'Done' ? (
                <div className="text-sm font-medium text-gray-500 text-center py-2">Completed</div>
              ) : (
                <Link 
                  to={`/student/evaluate/${c.id}`} 
                  className="block w-full text-center px-3 py-2 bg-[#7a0000] text-white rounded text-sm hover:bg-[#8f0000] transition-colors"
                >
                  Evaluate
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border-collapse table-auto">
            <thead>
              <tr className="text-left text-xs lg:text-sm text-gray-600">
                <th className="py-2 lg:py-3 px-2 lg:px-4 border-b whitespace-nowrap">Course Code</th>
                <th className="py-2 lg:py-3 px-2 lg:px-4 border-b whitespace-nowrap">Class Code</th>
                <th className="py-2 lg:py-3 px-2 lg:px-4 border-b">Subject Name</th>
                <th className="py-2 lg:py-3 px-2 lg:px-4 border-b">Instructor</th>
                <th className="py-2 lg:py-3 px-2 lg:px-4 border-b whitespace-nowrap">Semester</th>
                <th className="py-2 lg:py-3 px-2 lg:px-4 border-b">Status</th>
                <th className="py-2 lg:py-3 px-2 lg:px-4 border-b">Action</th>
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
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b font-semibold text-xs lg:text-sm text-blue-600 whitespace-nowrap">{c.id}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm font-mono text-gray-700 whitespace-nowrap">{c.classCode}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm font-medium">{c.name}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm text-gray-600">{c.instructor}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm text-gray-600 whitespace-nowrap">{c.semester}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm">
                    {c.status === 'Done' ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">Evaluated</span>
                    ) : (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">Pending</span>
                    )}
                  </td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm">
                    {c.status === 'Done' ? (
                      <span className="text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">Completed</span>
                    ) : (
                      <Link 
                        to={`/student/evaluate/${c.id}`} 
                        className="inline-flex items-center justify-center px-2 lg:px-3 py-1 bg-[#7a0000] text-white rounded text-xs lg:text-sm hover:bg-[#8f0000] transition-colors whitespace-nowrap"
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
