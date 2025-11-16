import React, { useMemo, useState, useEffect } from 'react'
import { studentAPI } from '../../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'

export default function StudentCourses(){
  const nav = useNavigate()
  const { user, logout: authLogout } = useAuth()
  
  // State
  const [currentStudent, setCurrentStudent] = useState(null)
  const [studentCourses, setStudentCourses] = useState([])
  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('')

  // Get student info
  useEffect(() => {
    let student = user
    if (!student) {
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        student = JSON.parse(storedUser)
      }
    }
    setCurrentStudent(student)
  }, [user])

  // Use timeout hook for API call
  const { data: coursesData, loading, error, retry } = useApiWithTimeout(
    async () => {
      if (!currentStudent?.id) return { data: [] }
      const response = await studentAPI.getCourses(currentStudent.id)
      return response
    },
    [currentStudent?.id]
  )

  // Update courses when data changes
  useEffect(() => {
    if (coursesData) {
      let courses = []
      if (Array.isArray(coursesData)) {
        courses = coursesData
      } else if (coursesData?.data && Array.isArray(coursesData.data)) {
        courses = coursesData.data
      } else if (coursesData?.success && Array.isArray(coursesData.data)) {
        courses = coursesData.data
      }
      setStudentCourses(courses)
    }
  }, [coursesData])
  
  function logout(){ 
    authLogout()
  }

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

  // Loading and error states
  if (!currentStudent) return <LoadingSpinner message="Loading student info..." />
  if (loading) return <LoadingSpinner message="Loading your courses..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

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
                  <div className="text-xs text-gray-500 font-mono mt-1">{c.class_code}</div>
                </div>
                {c.already_evaluated ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">✓ Evaluated</span>
                ) : (
                  <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">Evaluate</span>
                )}
              </div>
              <div className="font-medium text-sm mb-2">{c.name}</div>
              <div className="text-xs text-gray-600 mb-2">
                <div>{c.instructor_name}</div>
                <div className="mt-1">{c.semester}</div>
              </div>
              {c.already_evaluated ? (
                <Link 
                  to={`/student/evaluate/${c.class_section_id || c.id}`}
                  className="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Edit Evaluation
                </Link>
              ) : (
                <Link 
                  to={`/student/evaluate/${c.class_section_id || c.id}`}
                  className="block w-full text-center px-3 py-2 bg-[#7a0000] text-white rounded text-sm hover:bg-[#8f0000] transition-colors"
                >
                  Evaluate Now
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
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-sm text-gray-500">No courses found for your program and year level.</td>
                </tr>
              )}
              {filtered.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => nav(`/student/evaluate/${c.class_section_id || c.id}`)}
                  className={`align-top cursor-pointer transition-all ${
                    c.already_evaluated 
                      ? 'hover:bg-green-50 border-l-4 border-l-green-500' 
                      : 'hover:bg-orange-50 border-l-4 border-l-orange-500'
                  }`}
                >
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b font-semibold text-xs lg:text-sm text-blue-600 whitespace-nowrap">{c.code}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm font-mono text-gray-700 whitespace-nowrap">{c.class_code}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm font-medium">{c.name}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm text-gray-600">{c.instructor_name}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm text-gray-600 whitespace-nowrap">{c.semester}</td>
                  <td className="py-3 lg:py-4 px-2 lg:px-4 border-b text-xs lg:text-sm">
                    <div className="flex items-center gap-2">
                      {c.already_evaluated ? (
                        <>
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium">✓ Evaluated</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              nav(`/student/evaluate/${c.class_section_id || c.id}`)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline whitespace-nowrap"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium">Evaluate</span>
                      )}
                    </div>
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
