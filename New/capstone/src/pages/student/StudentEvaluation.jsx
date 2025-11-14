import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { studentAPI } from '../../services/api'
import { 
  questionnaireCategories, 
  ratingScale, 
  initializeEmptyResponses,
  calculateCategoryAverages,
  calculateOverallAverage,
  calculateSentiment
} from '../../data/questionnaireConfig'

export default function StudentEvaluation() {
  // ALL HOOKS MUST BE AT THE TOP - React Rules of Hooks
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [evaluationData, setEvaluationData] = useState({
    responses: initializeEmptyResponses(),
    comments: ''
  })
  
  // API State
  const [courses, setCourses] = useState([]) // Initialize as empty array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Redirect non-students
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (currentUser.role !== 'student') {
      navigate('/dashboard')
      return
    }
  }, [currentUser, navigate])
  
  // Fetch student courses - Use currentUser.id to prevent infinite loop
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (!currentUser?.id) {
          setError('User information not found')
          setCourses([])
          return
        }
        
        const response = await studentAPI.getCourses(currentUser.id)
        console.log('Student Evaluations - API Response:', response) // Debug log
        
        // Handle different response formats
        let coursesData = []
        if (Array.isArray(response)) {
          coursesData = response
        } else if (response?.data && Array.isArray(response.data)) {
          coursesData = response.data
        } else if (response?.success && Array.isArray(response.data)) {
          coursesData = response.data
        }
        
        console.log('Student Evaluations - Processed Data:', coursesData) // Debug log
        setCourses(coursesData)
        
      } catch (err) {
        console.error('Error fetching courses:', err)
        setError(err.message || 'Failed to load courses')
        setCourses([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    
    if (currentUser?.id) {
      fetchCourses()
    }
  }, [currentUser?.id])

  // Get courses available to the student
  const availableCourses = useMemo(() => {
    if (!Array.isArray(courses)) return [] // Safety check
    return courses.map(course => ({
      ...course,
      status: course.status ? course.status.toLowerCase() : 'active'
    }))
  }, [courses])

  // Get unique semesters for filter
  const availableSemesters = useMemo(() => {
    if (!Array.isArray(availableCourses)) return [] // Safety check
    const semesters = [...new Set(availableCourses.map(course => course.semester).filter(Boolean))]
    return semesters.sort()
  }, [availableCourses])

  // Filter courses based on search and semester
  const filteredCourses = useMemo(() => {
    if (!Array.isArray(availableCourses)) return [] // Safety check
    return availableCourses.filter(course => {
      const courseName = course.name?.toLowerCase() || ''
      const instructorName = course.instructor?.toLowerCase() || course.instructor_name?.toLowerCase() || ''
      const classCode = course.classCode?.toLowerCase() || course.class_code?.toLowerCase() || ''
      
      const matchesSearch = searchTerm === '' || 
        courseName.includes(searchTerm.toLowerCase()) ||
        instructorName.includes(searchTerm.toLowerCase()) ||
        classCode.includes(searchTerm.toLowerCase())
      
      const matchesSemester = semesterFilter === 'all' || course.semester === semesterFilter
      
      return matchesSearch && matchesSemester
    })
  }, [availableCourses, searchTerm, semesterFilter])

  const handleEvaluationSubmit = async () => {
    if (!selectedCourse) return

    // Validate all responses
    const allAnswered = Object.values(evaluationData.responses).every(val => val > 0)
    if (!allAnswered) {
      alert('Please answer all questions before submitting.')
      return
    }

    try {
      setSubmitting(true)
      
      // Calculate metrics
      const categoryAverages = calculateCategoryAverages(evaluationData.responses)
      const overallAverage = calculateOverallAverage(evaluationData.responses)
      const sentiment = calculateSentiment(parseFloat(overallAverage))

      // Submit to API
      await studentAPI.submitEvaluation({
        courseId: selectedCourse.id,
        studentId: currentUser.id,
        responses: evaluationData.responses,
        comments: evaluationData.comments,
        categoryAverages,
        overallAverage,
        sentiment
      })
      
      alert(`Evaluation submitted successfully!\n\nOverall Rating: ${overallAverage}/4.0\nSentiment: ${sentiment.toUpperCase()}`)
      setSelectedCourse(null)
      setEvaluationData({
        responses: initializeEmptyResponses(),
        comments: ''
      })
      
      // Refresh courses
      const updatedCourses = await studentAPI.getCourses(currentUser.id)
      setCourses(updatedCourses || [])
    } catch (err) {
      alert(`Failed to submit evaluation: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRatingChange = (questionId, value) => {
    setEvaluationData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: parseInt(value)
      }
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canEvaluate = (course) => {
    return course.status === 'active'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000]"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-bold mb-2">Error Loading Courses</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#7a0000] text-white rounded-lg hover:bg-[#8f0000]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      {/* Enhanced LPU Header */}
      <header className="lpu-header">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[#7a0000] font-bold text-xl">LPU</span>
              </div>
              <div>
                <h1 className="lpu-header-title text-3xl">Course Evaluation Portal</h1>
                <p className="lpu-header-subtitle text-lg">
                  Share Your Feedback & Shape the Future of Learning
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-right">
              <p className="text-[#ffd700] text-sm font-medium">Welcome,</p>
              <p className="text-white font-bold text-lg">{currentUser.name}</p>
              <div className="flex items-center justify-end space-x-2 mt-1">
                <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
                <span className="text-white text-xs">{currentUser.program} - Year {currentUser.yearLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Courses</h3>
                <p className="text-3xl font-bold text-white">{availableCourses.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Active Courses</h3>
                <p className="text-3xl font-bold text-white">{availableCourses.filter(c => c.status === 'active').length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#7a0000]/90 mb-2">Your Program</h3>
                <p className="text-2xl font-bold text-[#7a0000]">{currentUser.program}</p>
              </div>
              <div className="w-14 h-14 bg-[#7a0000]/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Year Level</h3>
                <p className="text-3xl font-bold text-white">{currentUser.yearLevel}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="lpu-card p-8 mb-8">
          <div className="flex items-center border-b border-gray-200 pb-4 mb-6">
            <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            <h3 className="text-xl font-bold text-gray-900">Find Your Courses</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-3">Search Courses</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by course name, instructor, or class code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="lpu-select pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-3">Semester Filter</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="lpu-select"
              >
                <option value="all">All Semesters</option>
                {availableSemesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="lpu-card">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Your Courses</h3>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredCourses.length} courses available
            </span>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div 
                  key={course.id} 
                  className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#7a0000] hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-xs font-bold text-[#7a0000] bg-[#7a0000]/10 px-2 py-1 rounded">
                          {course.classCode}
                        </span>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                          {course.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#7a0000] transition-colors">
                        {course.name}
                      </h4>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      {course.instructor}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      {course.semester}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      {course.enrolledStudents} students
                    </div>
                  </div>

                  {/* Action Button */}
                  {canEvaluate(course) ? (
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="w-full lpu-btn-primary py-3 text-center font-semibold group-hover:shadow-lg"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Evaluate Course
                      </span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 text-center font-semibold bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                      {course.status === 'pending' ? '⏳ Evaluation Not Ready' : '🔒 Evaluation Closed'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 19a7 7 0 100-14 7 7 0 000 14z"></path>
              </svg>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Courses Found</h4>
              <p className="text-sm text-gray-500">
                {searchTerm || semesterFilter !== 'all' 
                  ? 'Try adjusting your filters to see more courses'
                  : 'No courses are available for evaluation at this time'
                }
              </p>
            </div>
          )}
        </div>

        {/* Evaluation Status Guide */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Course Evaluation Guide</h3>
              <p className="text-sm text-blue-700">Understanding course statuses and evaluation periods</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                  Active
                </span>
                <span className="text-sm font-semibold text-gray-700">Ready to Evaluate</span>
              </div>
              <p className="text-xs text-gray-600">Course evaluation is open. Share your honest feedback to help improve the learning experience.</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
                  Pending
                </span>
                <span className="text-sm font-semibold text-gray-700">Coming Soon</span>
              </div>
              <p className="text-xs text-gray-600">Evaluation period hasn't started yet. Check back later to submit your feedback.</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                  Inactive
                </span>
                <span className="text-sm font-semibold text-gray-700">Period Ended</span>
              </div>
              <p className="text-xs text-gray-600">Evaluation period has closed. Thank you for your participation if you submitted feedback.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Form Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-[#7a0000]/20 animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#7a0000] to-[#6a0000] p-6 border-b-4 border-[#ffd700]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Course Evaluation Form</h2>
                      <p className="text-[#ffd700] text-sm mt-1">Your feedback helps improve our academic programs</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white/10 rounded-lg p-3">
                    <div className="flex items-center text-white mb-1">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      <span className="font-semibold">{selectedCourse.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-white/80">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      {selectedCourse.instructor} • {selectedCourse.classCode} • {selectedCourse.semester}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="ml-4 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] bg-gray-50">
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">How to Complete This Evaluation</h3>
                      <p className="text-sm text-blue-100 mt-1">Please rate each statement honestly using the scale below</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {ratingScale.map((scale) => (
                      <div key={scale.value} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">{scale.value}</div>
                        <div className="text-xs mt-1 text-blue-100">{scale.label}</div>
                      </div>
                    ))}
                  </div>
                </div>


                {/* Questionnaire Categories */}
                {questionnaireCategories.map((category, catIndex) => (
                  <div key={category.id} className="bg-white rounded-xl shadow-md border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-[#7a0000] to-[#6a0000] p-5 border-b-2 border-[#ffd700]">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#ffd700] rounded-lg flex items-center justify-center mr-3">
                          <span className="text-[#7a0000] font-bold text-lg">{catIndex + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {category.name}
                          </h3>
                          <p className="text-sm text-[#ffd700] mt-1">{category.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-5 bg-gray-50">
                      {category.questions.map((question, qIndex) => (
                        <div key={question.id} className="bg-white rounded-lg p-5 border-2 border-gray-200 hover:border-[#7a0000]/30 transition-all">
                          <label className="block text-sm font-semibold text-gray-800 mb-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-[#7a0000] text-white text-xs rounded-full mr-2">
                              {qIndex + 1}
                            </span>
                            {question.text}
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {ratingScale.map((scale) => (
                              <label 
                                key={scale.value} 
                                className={`flex-1 min-w-[100px] cursor-pointer rounded-xl border-2 transition-all transform hover:scale-105 ${
                                  evaluationData.responses[question.id] === scale.value
                                    ? 'border-[#7a0000] bg-gradient-to-br from-[#7a0000] to-[#6a0000] text-white shadow-lg scale-105'
                                    : 'border-gray-300 bg-white hover:border-[#7a0000] hover:shadow-md'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={scale.value}
                                  checked={evaluationData.responses[question.id] === scale.value}
                                  onChange={(e) => handleRatingChange(question.id, e.target.value)}
                                  className="sr-only"
                                />
                                <div className="text-center p-3">
                                  <div className="font-bold text-2xl mb-1">{scale.value}</div>
                                  <div className={`text-xs font-medium ${
                                    evaluationData.responses[question.id] === scale.value ? 'text-[#ffd700]' : 'text-gray-600'
                                  }`}>
                                    {scale.label}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}


                {/* Comments Section */}
                <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                    <div>
                      <label className="block text-sm font-bold text-gray-800">
                        Additional Comments & Suggestions
                      </label>
                      <p className="text-xs text-gray-600 mt-1">Share your thoughts to help us improve (Optional)</p>
                    </div>
                  </div>
                  <textarea
                    value={evaluationData.comments}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000] transition-all resize-none"
                    rows={4}
                    placeholder="Please share any additional feedback, suggestions, or comments about the course, teaching methods, materials, or overall learning experience..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  Your responses are confidential and anonymous
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEvaluationSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-[#7a0000] to-[#6a0000] hover:from-[#8f0000] hover:to-[#7a0000] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Submit Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
