import React, { useMemo, useState, useEffect } from 'react'
import apiService from '../../services/api'
import { Link, useNavigate } from 'react-router-dom'

export default function StudentCourses(){
  const nav = useNavigate()
  const [currentStudent, setCurrentStudent] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  function logout(){ try{ localStorage.removeItem('role'); localStorage.removeItem('currentUser') }catch(e){}; nav('/login') }

  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('')

    // Get current student info and load courses from database
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true)
        const stored = localStorage.getItem('currentUser')
        if (stored) {
          const student = JSON.parse(stored)
          setCurrentStudent(student)
          
          // Load courses for this student
          const coursesResponse = await apiService.getStudentCourses(student.id)
          setCourses(coursesResponse.data || [])
        } else {
          nav('/login')
        }
      } catch (error) {
        console.error('Error loading student data:', error)
        setError('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }
    
    loadStudentData()
  }, [])

  // Filter courses based on current student's program and year level
  const studentCourses = useMemo(() => {
    if (!currentStudent) return []
    return courses.filter(c => 
      c.program === currentStudent.program && 
      c.yearLevel === currentStudent.yearLevel
    )
  }, [currentStudent])

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

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Student access required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold">My Courses</h1>
            <p className="text-sm text-gray-500">
              {currentStudent.name} - {currentStudent.program} Year {currentStudent.yearLevel}
            </p>
            <p className="text-xs text-gray-400">Select a course to evaluate</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm text-white bg-[#7a0000] hover:bg-[#8f0000] px-3 py-2 rounded whitespace-nowrap" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
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
