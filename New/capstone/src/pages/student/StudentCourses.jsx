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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-sm md:text-base text-gray-600">
              {currentStudent.name} • {currentStudent.program} • Year {currentStudent.year_level || currentStudent.yearLevel}
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="search"
                name="course-search"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by course code or name..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={semester}
                onChange={e=>setSemester(e.target.value)}
              >
                {semesters.map(s => (
                  <option key={s} value={s === 'All' ? 'All' : s}>
                    {s === 'All' ? 'All Semesters' : `Semester ${s}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500 text-sm">No courses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">Course Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-56">Class Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Subject Name</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">Semester</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider w-56">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map(c => (
                    <tr 
                      key={c.id} 
                      onClick={() => nav(`/student/evaluate/${c.class_section_id || c.id}`)}
                      className={`cursor-pointer transition-all hover:bg-gray-50 ${
                        c.already_evaluated ? 'bg-green-50/30' : ''
                      }`}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-base font-semibold text-blue-600">{c.code}</span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-base font-mono text-gray-700">{c.class_code}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-base font-medium text-gray-900">{c.name}</span>
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <span className="text-base text-gray-600">{c.semester}</span>
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        {c.already_evaluated ? (
                          <div className="flex items-center justify-center gap-3">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              Evaluated
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                nav(`/student/evaluate/${c.class_section_id || c.id}`)
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
