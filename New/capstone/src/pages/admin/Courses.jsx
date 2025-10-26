import React, { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getCurrentUser, isAdmin, filterCoursesByAccess, filterEvaluationsByAccess } from '../../utils/roleUtils'
import { mockCourses, mockEvaluations } from '../../data/mock'

export default function Courses() {
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseDetails, setCourseDetails] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state for new course
  const [newCourse, setNewCourse] = useState({
    id: '',
    name: '',
    instructor: '',
    semester: 'First Semester 2025',
    program: '',
    yearLevel: 1,
    status: 'Pending',
    classCode: '',
    enrolledStudents: 0
  })
  
  const [formErrors, setFormErrors] = useState({})

  // Use actual mock data with access filtering
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(mockCourses, currentUser)
  }, [currentUser])

  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])

  // Enhance courses with evaluation data
  const courses = useMemo(() => {
    return accessibleCourses.map(course => {
      const courseEvaluations = accessibleEvaluations.filter(e => e.courseId === course.id)
      const evaluationCount = courseEvaluations.length
      const enrollmentCount = course.enrolledStudents || 0
      
      // Calculate overall rating from evaluations
      let overallRating = 0
      if (courseEvaluations.length > 0) {
        const totalRating = courseEvaluations.reduce((sum, e) => {
          const ratings = Object.values(e.ratings || {})
          const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0
          return sum + avgRating
        }, 0)
        overallRating = (totalRating / courseEvaluations.length).toFixed(1)
      }
      
      const responseRate = enrollmentCount > 0 ? Math.round((evaluationCount / enrollmentCount) * 100) : 0
      
      return {
        ...course,
        code: course.classCode || course.id,
        enrollmentCount,
        evaluationCount,
        overallRating: parseFloat(overallRating),
        responseRate,
        status: course.status || 'active'
      }
    })
  }, [accessibleCourses, accessibleEvaluations])

  // Mock detailed course data (can be replaced with actual evaluation details later)
  const mockCourseDetails = {
    1: {
      name: 'Introduction to Computer Science',
      classCode: 'CS101',
      instructor: 'Dr. Maria Santos',
      program: 'Computer Science',
      yearLevel: 1,
      enrollmentCount: 45,
      evaluationCount: 42,
      overallRating: 4.2,
      criteriaRatings: {
        'Course Content': 4.3,
        'Teaching Effectiveness': 4.1,
        'Assignments & Assessments': 4.0,
        'Course Organization': 4.4
      },
      sentimentBreakdown: {
        positive: 28,
        neutral: 12,
        negative: 2
      },
      evaluations: [],
      recentComments: [
        { text: "Great introduction to programming concepts", rating: 5, date: "Nov 15, 2024" },
        { text: "Assignments were challenging but fair", rating: 4, date: "Nov 14, 2024" },
        { text: "Could use more practical examples", rating: 3, date: "Nov 13, 2024" }
      ]
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProgram = selectedProgram === 'all' || course.program === selectedProgram
    return matchesSearch && matchesProgram
  })

  const programs = [...new Set(courses.map(course => course.program))]

  const handleCourseClick = async (courseId) => {
    setLoading(true)
    setSelectedCourse(courseId)
    
    try {
      // Simulate API call with Promise
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Get actual course data
      const course = courses.find(c => c.id === courseId)
      if (!course) {
        throw new Error('Course not found')
      }
      
      const courseEvals = accessibleEvaluations.filter(e => e.courseId === courseId)
      
      // Calculate criteria ratings from categoryRatings
      const criteriaRatings = {}
      const categoryNames = {
        'course_content': 'Course Content & Organization',
        'instructor_effectiveness': 'Instructor Effectiveness',
        'teaching_methods': 'Teaching Methods & Resources',
        'assessment_feedback': 'Assessment & Feedback',
        'interaction_support': 'Interaction & Support',
        'learning_outcomes': 'Learning Outcomes'
      }
      
      // Calculate average for each category
      Object.keys(categoryNames).forEach(categoryKey => {
        const ratings = courseEvals
          .filter(e => e.categoryRatings && e.categoryRatings[categoryKey])
          .map(e => e.categoryRatings[categoryKey])
        
        if (ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          criteriaRatings[categoryNames[categoryKey]] = parseFloat(avg.toFixed(2))
        }
      })
      
      // If no categoryRatings available, use old ratings format as fallback
      if (Object.keys(criteriaRatings).length === 0) {
        const ratingsByCategory = {
          'Course Content': [],
          'Instructor Quality': [],
          'Teaching Methods': [],
          'Assessment Quality': []
        }
        
        courseEvals.forEach(e => {
          if (e.ratings) {
            if (e.ratings.clarity) ratingsByCategory['Course Content'].push(e.ratings.clarity)
            if (e.ratings.usefulness) ratingsByCategory['Instructor Quality'].push(e.ratings.usefulness)
            if (e.ratings.engagement) ratingsByCategory['Teaching Methods'].push(e.ratings.engagement)
            if (e.ratings.organization) ratingsByCategory['Assessment Quality'].push(e.ratings.organization)
          }
        })
        
        Object.entries(ratingsByCategory).forEach(([key, ratings]) => {
          if (ratings.length > 0) {
            const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            criteriaRatings[key] = parseFloat(avg.toFixed(2))
          }
        })
      }
      
      // Calculate sentiment breakdown
      const sentimentBreakdown = {
        positive: courseEvals.filter(e => e.sentiment === 'positive').length,
        neutral: courseEvals.filter(e => e.sentiment === 'neutral').length,
        negative: courseEvals.filter(e => e.sentiment === 'negative').length
      }
      
      // Set the course details
      setCourseDetails({
        ...course,
        criteriaRatings,
        sentimentBreakdown,
        evaluations: courseEvals.slice(0, 10), // Show recent 10
        recentComments: courseEvals.slice(0, 5).map(e => ({
          text: e.comment,
          rating: e.rating || e.avgRating,
          date: new Date().toLocaleDateString()
        }))
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading course details:', error)
      setLoading(false)
      // Could add error state here to show user-friendly error message
    }
  }
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewCourse(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  // Validate form
  const validateForm = () => {
    const errors = {}
    
    if (!newCourse.id.trim()) {
      errors.id = 'Course ID is required'
    }
    if (!newCourse.name.trim()) {
      errors.name = 'Course name is required'
    }
    if (!newCourse.instructor.trim()) {
      errors.instructor = 'Instructor name is required'
    }
    if (!newCourse.program) {
      errors.program = 'Program is required'
    }
    if (!newCourse.classCode.trim()) {
      errors.classCode = 'Class code is required'
    }
    if (newCourse.enrolledStudents < 0) {
      errors.enrolledStudents = 'Enrolled students cannot be negative'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Handle form submission
  const handleSubmitCourse = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      // Here you would typically send the data to your backend
      // Example: await api.createCourse(newCourse)
      
      setLoading(false)
      setShowAddModal(false)
      
      // Reset form
      setNewCourse({
        id: '',
        name: '',
        instructor: '',
        semester: 'First Semester 2025',
        program: '',
        yearLevel: 1,
        status: 'Pending',
        classCode: '',
        enrolledStudents: 0
      })
      setFormErrors({})
      
      // Show success message (you can add a toast notification here)
      alert('Course created successfully!')
    }, 1000)
  }
  
  // Reset form when modal is closed
  const handleCloseModal = () => {
    setShowAddModal(false)
    setNewCourse({
      id: '',
      name: '',
      instructor: '',
      semester: 'First Semester 2025',
      program: '',
      yearLevel: 1,
      status: 'Pending',
      classCode: '',
      enrolledStudents: 0
    })
    setFormErrors({})
  }

  // Convert data for recharts format
  const chartData = filteredCourses.map(course => ({
    code: course.code,
    overallRating: course.overallRating,
    responseRate: course.responseRate
  }))

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Course Performance Overview',
        font: {
          size: 16,
          weight: 'bold',
          family: 'system-ui, -apple-system, sans-serif'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  }

  return (
    <div className="min-h-screen lpu-background">
      {/* Enhanced Header */}
      <header className="lpu-header">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Course Management</h1>
                  <p className="text-[#ffd700] text-lg font-medium">
                    Lyceum of the Philippines University
                  </p>
                </div>
              </div>
              
              <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
                Monitor course performance, track evaluation metrics, and analyze student feedback across all academic programs.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-white/80 text-sm">
                      {isAdmin(currentUser) ? 'System-wide Analysis' : `${currentUser.department} Department`}
                    </p>
                    <p className="font-bold text-[#ffd700] text-lg">{filteredCourses.length} Active Courses</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowAddModal(true)}
                className="lpu-btn-secondary inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Course
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Course Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Courses</h3>
                <p className="text-3xl font-bold text-white">{courses.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Students</h3>
                <p className="text-3xl font-bold text-white">{courses.reduce((sum, course) => sum + course.enrollmentCount, 0)}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Avg Rating</h3>
                <p className="text-3xl font-bold text-white">
                  {(courses.reduce((sum, course) => sum + course.overallRating, 0) / courses.length).toFixed(1)}
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Response Rate</h3>
                <p className="text-3xl font-bold text-white">
                  {Math.round(courses.reduce((sum, course) => sum + course.responseRate, 0) / courses.length)}%
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Performance Chart */}
        <div className="lpu-card mb-8">
          <div className="lpu-chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="lpu-card mb-8 p-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-[#7a0000] flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"></path>
              </svg>
              Search & Filter Courses
            </h2>
            <p className="text-gray-600 text-sm mt-1">Find courses by name, code, instructor, or program</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Courses</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by course name, code, or instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent transition-all duration-200"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent bg-white transition-all duration-200"
              >
                <option value="all">All Programs</option>
                {programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Course Table */}
        <div className="lpu-card">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#7a0000]/5 to-[#ffd700]/5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#7a0000] flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Active Courses
                </h2>
                <p className="text-gray-600 mt-1 font-medium">
                  Showing {filteredCourses.length} of {courses.length} courses
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-[#7a0000] text-white text-sm font-medium rounded-full">
                  {filteredCourses.length} Results
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Response Rate</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-25 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#7a0000] to-[#9a1000] rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">{course.code.slice(-2)}</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-[#7a0000] transition-colors duration-200">
                            {course.name}
                          </div>
                          <div className="text-sm text-gray-500">{course.code} • {course.program}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{course.instructor}</div>
                      <div className="text-sm text-gray-500">Year {course.yearLevel} • {course.semester}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span className="font-medium text-gray-900">{course.enrollmentCount}</span>
                      </div>
                      <div className="text-sm text-gray-500">{course.evaluationCount} evaluations</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(course.overallRating) ? 'text-[#ffd700]' : 'text-gray-300'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                        <span className="font-bold text-gray-900">{course.overallRating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${course.responseRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-gray-900">{course.responseRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCourseClick(course.id)}
                        className="lpu-btn-primary text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCourses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || selectedProgram !== 'all' 
                ? 'No courses match your current filters'
                : 'No courses found'
              }
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Course Detail Modal */}
      {selectedCourse && courseDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Enhanced Modal Header */}
            <div className="lpu-header">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{courseDetails.name}</h2>
                    <p className="text-[#ffd700] text-sm mt-1">
                      {courseDetails.classCode} • Instructor: {courseDetails.instructor}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/80 text-sm">
                        {courseDetails.program} - Year {courseDetails.yearLevel}
                      </span>
                      <span className="text-white/80 text-sm">
                        {courseDetails.enrollmentCount} Students Enrolled
                      </span>
                      <span className="text-white/80 text-sm">
                        {courseDetails.evaluationCount} Evaluations Received
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="text-white hover:text-[#ffd700] transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Enhanced Tab Navigation */}
              <div className="px-6 pb-6">
                <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'overview' 
                        ? 'bg-white text-[#7a0000] shadow-sm' 
                        : 'text-white/80 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('sentiment')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'sentiment' 
                        ? 'bg-white text-[#7a0000] shadow-sm' 
                        : 'text-white/80 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    Detailed Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overall Rating and Evaluations Side by Side */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Overall Rating */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Overall Rating</h3>
                      <p className="text-sm text-gray-500 mb-4">Average across all evaluations</p>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-blue-600 mb-2">
                          {courseDetails.overallRating}
                        </div>
                        <div className="flex justify-center mb-3">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-6 h-6 ${i < Math.floor(courseDetails.overallRating) ? 'text-[#ffd700]' : 'text-gray-300'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">Based on {courseDetails.evaluationCount} evaluations</p>
                      </div>
                    </div>

                    {/* Evaluation Stats */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Evaluation Statistics</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                          <span className="font-medium text-blue-700">Total Evaluations</span>
                          <span className="text-2xl font-bold text-blue-600">{courseDetails.evaluationCount}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                          <span className="font-medium text-green-700">Response Rate</span>
                          <span className="text-2xl font-bold text-green-600">
                            {Math.round((courseDetails.evaluationCount / courseDetails.enrollmentCount) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                          <span className="font-medium text-purple-700">Enrolled Students</span>
                          <span className="text-2xl font-bold text-purple-600">{courseDetails.enrollmentCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Comparison */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Criteria Comparison</h3>
                    <p className="text-sm text-gray-500 mb-6">Breakdown of evaluation criteria</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {Object.entries(courseDetails.criteriaRatings).map(([criterion, rating], index) => {
                        const colors = ['text-green-600', 'text-orange-500', 'text-blue-600', 'text-purple-600'];
                        const bgColors = ['bg-green-100', 'bg-orange-100', 'bg-blue-100', 'bg-purple-100'];
                        return (
                          <div key={criterion} className={`${bgColors[index % bgColors.length]} p-3 rounded-lg`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">{criterion}</span>
                              <span className={`text-lg font-bold ${colors[index % colors.length]}`}>
                                {rating}/4.0
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="lpu-btn-primary"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Course Modal - Complete Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="lpu-header">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Add New Course</h2>
                      <p className="text-[#ffd700] text-sm">Fill in the course details below</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:text-[#ffd700] transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Modal Body - Form */}
            <form onSubmit={handleSubmitCourse} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Course ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={newCourse.id}
                    onChange={handleInputChange}
                    placeholder="e.g., BSIT101"
                    className={`lpu-input ${formErrors.id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formErrors.id && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.id}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Unique identifier for the course</p>
                </div>
                
                {/* Class Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="classCode"
                    value={newCourse.classCode}
                    onChange={handleInputChange}
                    placeholder="e.g., ITCO-1001-A"
                    className={`lpu-input ${formErrors.classCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formErrors.classCode && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.classCode}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Official class section code</p>
                </div>
                
                {/* Course Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCourse.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Introduction to Computing"
                    className={`lpu-input ${formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                
                {/* Instructor */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Instructor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="instructor"
                    value={newCourse.instructor}
                    onChange={handleInputChange}
                    placeholder="e.g., Dr. Maria Santos"
                    className={`lpu-input ${formErrors.instructor ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formErrors.instructor && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.instructor}</p>
                  )}
                </div>
                
                {/* Program */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="program"
                    value={newCourse.program}
                    onChange={handleInputChange}
                    className={`lpu-select ${formErrors.program ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="">Select Program</option>
                    <option value="BSIT">BSIT - Information Technology</option>
                    <option value="BSCS">BSCS - Computer Science</option>
                    <option value="BSCS-DS">BSCS-DS - Data Science</option>
                    <option value="BS-CY">BS-CY - Cybersecurity</option>
                    <option value="BMA">BMA - Multimedia Arts</option>
                    <option value="BS-Psychology">BS-Psychology</option>
                    <option value="AB-Psychology">AB-Psychology</option>
                  </select>
                  {formErrors.program && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.program}</p>
                  )}
                </div>
                
                {/* Year Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="yearLevel"
                    value={newCourse.yearLevel}
                    onChange={handleInputChange}
                    className="lpu-select"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                
                {/* Semester */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Period <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={newCourse.semester}
                    onChange={handleInputChange}
                    className="lpu-select"
                  >
                    <option value="First Semester 2025">First Semester 2025</option>
                    <option value="Second Semester 2025">Second Semester 2025</option>
                    <option value="First Semester 2026">First Semester 2026</option>
                    <option value="Second Semester 2026">Second Semester 2026</option>
                  </select>
                </div>
                
                {/* Enrolled Students */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enrolled Students
                  </label>
                  <input
                    type="number"
                    name="enrolledStudents"
                    value={newCourse.enrolledStudents}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                    className={`lpu-input ${formErrors.enrolledStudents ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formErrors.enrolledStudents && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.enrolledStudents}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Number of students enrolled</p>
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Status
                  </label>
                  <select
                    name="status"
                    value={newCourse.status}
                    onChange={handleInputChange}
                    className="lpu-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              
              {/* Form Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Course Summary
                </h4>
                <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Course:</span> {newCourse.name || 'Not specified'}</div>
                  <div><span className="font-medium">Code:</span> {newCourse.classCode || 'Not specified'}</div>
                  <div><span className="font-medium">Instructor:</span> {newCourse.instructor || 'Not specified'}</div>
                  <div><span className="font-medium">Program:</span> {newCourse.program || 'Not specified'}</div>
                  <div><span className="font-medium">Year Level:</span> Year {newCourse.yearLevel}</div>
                  <div><span className="font-medium">Semester:</span> {newCourse.semester}</div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="lpu-btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lpu-btn-primary inline-flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Create Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}