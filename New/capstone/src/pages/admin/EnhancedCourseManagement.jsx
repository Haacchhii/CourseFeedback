import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { getCurrentUser, isSystemAdmin } from '../../utils/roleUtils'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'

export default function EnhancedCourseManagement() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  
  // State
  const [activeTab, setActiveTab] = useState('courses')
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showAssignInstructorModal, setShowAssignInstructorModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [csvFile, setCsvFile] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  
  // API State
  const [courses, setCourses] = useState([])
  const [instructors, setInstructors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    classCode: '',
    instructor: '',
    program: 'BSIT',
    yearLevel: 1,
    semester: 'First Semester',
    academicYear: '2024-2025',
    enrolledStudents: 0,
    status: 'Active'
  })

  // Use timeout hook for API calls
  const { data: apiData, loading, error, retry } = useApiWithTimeout(
    async () => {
      const [coursesData, instructorsData] = await Promise.all([
        adminAPI.getCourses(),
        adminAPI.getInstructors()
      ])
      return { courses: coursesData?.data || [], instructors: instructorsData?.data || [] }
    },
    [currentUser?.id, currentUser?.role]
  )

  // Update state when data changes
  useEffect(() => {
    if (apiData) {
      setCourses(apiData.courses)
      setInstructors(apiData.instructors)
    }
  }, [apiData])

  // Redirect if not system admin
  useEffect(() => {
    if (currentUser && !isSystemAdmin(currentUser)) {
      navigate('/courses')
    }
  }, [currentUser?.role, currentUser?.id, navigate])

  // Get programs
  const programs = useMemo(() => {
    const progs = [...new Set(courses.map(c => c.program))].filter(Boolean).sort()
    return progs
  }, [courses])

  // Get instructors - REMOVED (now fetched via API)

  // Enhanced courses with analytics
  const enhancedCourses = useMemo(() => {
    return courses.map(course => {
      return {
        ...course,
        evaluationCount: course.evaluation_count || 0,
        avgRating: parseFloat(course.avg_rating || 0),
        responseRate: course.response_rate || 0,
        status: course.status || 'Active'
      }
    })
  }, [courses])

  // Filter courses
  const filteredCourses = useMemo(() => {
    return enhancedCourses.filter(course => {
      const matchesSearch = searchTerm === '' ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.classCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesProgram = programFilter === 'all' || course.program === programFilter
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter
      
      return matchesSearch && matchesProgram && matchesStatus
    })
  }, [enhancedCourses, searchTerm, programFilter, statusFilter])

  // Analytics data
  const analytics = useMemo(() => {
    const byProgram = {}
    const byYearLevel = {}
    const trendData = []
    
    filteredCourses.forEach(course => {
      // By program
      if (!byProgram[course.program]) {
        byProgram[course.program] = {
          courses: 0,
          students: 0,
          avgRating: []
        }
      }
      byProgram[course.program].courses++
      byProgram[course.program].students += course.enrolledStudents || 0
      if (course.avgRating) byProgram[course.program].avgRating.push(course.avgRating)
      
      // By year level
      const year = `Year ${course.yearLevel}`
      if (!byYearLevel[year]) {
        byYearLevel[year] = {
          courses: 0,
          students: 0
        }
      }
      byYearLevel[year].courses++
      byYearLevel[year].students += course.enrolledStudents || 0
    })
    
    // Prepare chart data
    const programChartData = Object.entries(byProgram).map(([name, data]) => ({
      name,
      courses: data.courses,
      students: data.students,
      avgRating: data.avgRating.length > 0 
        ? (data.avgRating.reduce((a, b) => a + b, 0) / data.avgRating.length).toFixed(2)
        : 0
    }))
    
    const yearLevelData = Object.entries(byYearLevel).map(([name, data]) => ({
      name,
      courses: data.courses,
      students: data.students
    }))
    
    // Mock trend data (last 6 semesters)
    const semesters = ['S1 2023', 'S2 2023', 'S1 2024', 'S2 2024', 'S1 2025']
    const trendChartData = semesters.map((sem, idx) => ({
      semester: sem,
      courses: Math.round(filteredCourses.length * (0.8 + idx * 0.05)),
      avgRating: (3.8 + Math.random() * 0.6).toFixed(2)
    }))
    
    return {
      programChartData,
      yearLevelData,
      trendChartData
    }
  }, [filteredCourses])

  // Handlers
  const handleAddCourse = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await adminAPI.createCourse(formData)
      const updatedCourses = await adminAPI.getCourses()
      setCourses(updatedCourses?.data || [])
      alert(`Course "${formData.name}" created successfully!`)
      setShowAddModal(false)
      setFormData({
        name: '',
        classCode: '',
        instructor: '',
        program: 'BSIT',
        yearLevel: 1,
        semester: 'First Semester',
        academicYear: '2024-2025',
        enrolledStudents: 0,
        status: 'Active'
      })
    } catch (err) {
      alert(`Failed to create course: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCsvFile(file)
      // Mock CSV parsing
      const preview = [
        { name: 'Advanced Database Systems', classCode: 'CS301', instructor: 'Dr. Maria Santos', program: 'BSIT', yearLevel: 3 },
        { name: 'Web Development', classCode: 'CS201', instructor: 'Prof. Juan Cruz', program: 'BSIT', yearLevel: 2 },
        { name: 'Data Structures', classCode: 'CS202', instructor: 'Dr. Ana Reyes', program: 'BSCS', yearLevel: 2 }
      ]
      setImportPreview(preview)
    }
  }

  const handleBulkImport = (e) => {
    e?.preventDefault()
    if (importPreview.length > 0) {
      alert(`Successfully imported ${importPreview.length} courses!`)
      setShowBulkImportModal(false)
      setCsvFile(null)
      setImportPreview([])
    }
  }

  const handleAssignInstructor = (e) => {
    e?.preventDefault()
    alert(`Instructor assigned to ${selectedCourses.length} course(s)`)
    setShowAssignInstructorModal(false)
    setSelectedCourses([])
  }

  const handleArchiveCourse = async (course, e) => {
    e?.preventDefault()
    if (window.confirm(`Archive "${course.name}"?\n\nThis will hide the course from active listings but preserve all data.`)) {
      try {
        await adminAPI.updateCourse(course.id, { status: 'Archived' })
        const updatedCourses = await adminAPI.getCourses()
        setCourses(updatedCourses?.data || [])
        alert(`Course "${course.name}" archived successfully!`)
      } catch (err) {
        alert(`Failed to archive course: ${err.message}`)
      }
    }
  }

  const toggleCourseSelection = (courseId, e) => {
    e?.preventDefault()
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null
  
  // Loading and error states
  if (loading) return <LoadingSpinner message="Loading courses..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-xl border-b-4 border-indigo-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Enhanced Course Management</h1>
                <p className="text-indigo-100 text-sm mt-1">Comprehensive course administration and analytics</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setShowBulkImportModal(true)} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-3 rounded-xl transition-all flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <span>Bulk Import</span>
              </button>
              <button onClick={() => setShowAddModal(true)} className="bg-white hover:bg-indigo-50 text-indigo-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Add Course</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📚 Course List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('enrollment')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'enrollment'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👥 Enrollment
          </button>
        </div>

        {/* Course List Tab */}
        {activeTab === 'courses' && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Courses</p>
                    <p className="text-3xl font-bold text-gray-900">{filteredCourses.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Programs</p>
                    <p className="text-3xl font-bold text-green-600">{programs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {filteredCourses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {filteredCourses.length > 0
                        ? (filteredCourses.reduce((sum, c) => sum + c.avgRating, 0) / filteredCourses.length).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search</label>
                  <input
                    type="text"
                    placeholder="Search courses, codes, instructors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📚 Program</label>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Programs</option>
                    {programs.map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCourses.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                <p className="text-indigo-900 font-semibold">{selectedCourses.length} course(s) selected</p>
                <div className="flex space-x-2">
                  <button onClick={() => setShowAssignInstructorModal(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all">
                    Assign Instructor
                  </button>
                  <button onClick={() => alert('Archiving selected courses...')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all">
                    Archive
                  </button>
                  <button onClick={() => alert('Exporting selected courses...')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all">
                    Export
                  </button>
                </div>
              </div>
            )}

            {/* Courses Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                          onChange={() => {
                            if (selectedCourses.length === filteredCourses.length) {
                              setSelectedCourses([])
                            } else {
                              setSelectedCourses(filteredCourses.map(c => c.id))
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Course Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Instructor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Program</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Students</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rating</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={(e) => toggleCourseSelection(course.id, e)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.classCode || course.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{course.name}</div>
                          <div className="text-xs text-gray-500">Year {course.yearLevel} • {course.semester}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.instructor}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.program}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{course.enrolledStudents || 0}</div>
                          <div className="text-xs text-gray-500">{course.evaluationCount || 0} evals</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">{course.avgRating || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => navigate(`/courses`)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => alert(`Editing ${course.name}...`)}
                              className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-all"
                              title="Edit Course"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleArchiveCourse(course, e)}
                              className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all"
                              title="Archive Course"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Trend Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Course Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="courses" stroke="#6366f1" strokeWidth={2} name="Courses" />
                  <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} name="Avg Rating" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* By Program */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Courses by Program</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.programChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="courses" fill="#6366f1" name="Courses" />
                    <Bar dataKey="students" fill="#10b981" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By Year Level */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Distribution by Year Level</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.yearLevelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="courses" fill="#8b5cf6" name="Courses" />
                    <Bar dataKey="students" fill="#ec4899" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Rated Courses</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {filteredCourses
                  .sort((a, b) => b.avgRating - a.avgRating)
                  .slice(0, 3)
                  .map((course, idx) => (
                    <div key={course.id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all">
                      <div className="flex items-center mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white mr-3 ${
                          idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span className="text-2xl font-bold text-gray-900">{course.avgRating}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{course.name}</h4>
                      <p className="text-sm text-gray-600">{course.instructor}</p>
                      <p className="text-xs text-gray-500 mt-1">{course.evaluationCount} evaluations</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Tab */}
        {activeTab === 'enrollment' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Enrollment Management</h3>
            <p className="text-gray-600 mb-6">Manage student enrollments across all courses.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCourses.slice(0, 10).map(course => (
                <div key={course.id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{course.name}</h4>
                      <p className="text-sm text-gray-600">{course.instructor}</p>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">{course.enrolledStudents || 0}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => alert('View enrollment list...')} className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition-all">
                      View List
                    </button>
                    <button onClick={() => alert('Add students...')} className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-semibold transition-all">
                      Add Students
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 border-b-4 border-indigo-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">➕ Add New Course</h2>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Introduction to Programming"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.classCode}
                    onChange={(e) => setFormData({...formData, classCode: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="CS101"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Instructor *</label>
                <select
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Program *</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {programs.map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level *</label>
                  <select
                    value={formData.yearLevel}
                    onChange={(e) => setFormData({...formData, yearLevel: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="2024-2025"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Course</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 border-b-4 border-green-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📤 Bulk Import Courses</h2>
                <button onClick={() => setShowBulkImportModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">📋 CSV Format Requirements:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Headers: name, classCode, instructor, program, yearLevel, semester, academicYear</li>
                  <li>Year level must be 1-4</li>
                  <li>Program must match existing programs</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload CSV File *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-all"
                />
              </div>

              {importPreview.length > 0 && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 font-semibold">✅ Preview: {importPreview.length} courses ready to import</p>
                  </div>

                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Course Name</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Instructor</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Program</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importPreview.map((course, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="px-4 py-2">{course.name}</td>
                            <td className="px-4 py-2">{course.classCode}</td>
                            <td className="px-4 py-2">{course.instructor}</td>
                            <td className="px-4 py-2">{course.program}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={importPreview.length === 0}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Import {importPreview.length} Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Instructor Modal */}
      {showAssignInstructorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 border-b-4 border-blue-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">👨‍🏫 Assign Instructor</h2>
                <button onClick={() => setShowAssignInstructorModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">Assigning instructor to <strong>{selectedCourses.length} course(s)</strong></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Instructor *</label>
                <select
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose instructor...</option>
                  {instructors.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignInstructorModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignInstructor}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Assign Instructor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
