import React, { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { isAdmin, isStaffMember } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, deptHeadAPI, secretaryAPI, instructorAPI } from '../../services/api'

export default function Courses() {
  const { user: currentUser } = useAuth()
  const [courses, setCourses] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [chartLimit, setChartLimit] = useState(10) // Top N courses to show in chart
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseDetails, setCourseDetails] = useState(null)
  const [categoryAverages, setCategoryAverages] = useState([])
  const [questionDistribution, setQuestionDistribution] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
  // Data for section creation
  const [availableCourses, setAvailableCourses] = useState([])
  const [instructors, setInstructors] = useState([])
  
  // Form state for new section
  const [newSection, setNewSection] = useState({
    course_id: '',
    instructor_id: '',
    class_code: '',
    semester: 1,
    academic_year: '2024-2025',
    max_students: 40
  })
  
  const [formErrors, setFormErrors] = useState({})

  // Fetch programs from database
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!currentUser) return
      
      try {
        let programsData
        
        console.log('[COURSES] Fetching programs for role:', currentUser.role)
        
        if (isAdmin(currentUser)) {
          console.log('[COURSES] Calling adminAPI.getPrograms()')
          programsData = await adminAPI.getPrograms()
        } else if (currentUser.role === 'secretary') {
          console.log('[COURSES] Calling secretaryAPI.getPrograms()')
          programsData = await secretaryAPI.getPrograms()
        } else if (currentUser.role === 'department_head') {
          console.log('[COURSES] Calling deptHeadAPI.getPrograms()')
          programsData = await deptHeadAPI.getPrograms()
        } else if (currentUser.role === 'instructor') {
          console.log('[COURSES] Calling instructorAPI.getPrograms()')
          programsData = await instructorAPI.getPrograms()
        }
        
        console.log('[COURSES] Programs API response:', programsData)
        
        if (programsData?.data && Array.isArray(programsData.data) && programsData.data.length > 0) {
          console.log('[COURSES] Programs loaded successfully:', programsData.data)
          setPrograms(programsData.data)
        } else {
          console.warn('[COURSES] No programs data in API response, will extract from courses')
          setPrograms([])
        }
      } catch (err) {
        console.error('[COURSES] Error fetching programs:', err)
        setPrograms([])
      }
    }
    
    fetchPrograms()
  }, [currentUser])
  
  // Fallback: Extract unique programs from courses if programs array is empty
  useEffect(() => {
    if (programs.length === 0 && courses.length > 0) {
      console.log('[COURSES] Extracting unique programs from courses data')
      // Create a map to deduplicate by program code
      const programMap = new Map()
      courses.forEach(course => {
        if (course.program && !programMap.has(course.program)) {
          programMap.set(course.program, {
            id: programMap.size + 1,
            code: course.program,
            program_code: course.program,
            name: course.program,
            program_name: course.program
          })
        }
      })
      const programObjects = Array.from(programMap.values())
      console.log('[COURSES] Extracted unique programs:', programObjects)
      setPrograms(programObjects)
    }
  }, [courses, programs])

  // Add Course functionality removed - monitoring role only
  // Secretary/Dept Head can view and analyze courses but cannot create new ones

  // Fetch courses from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const filters = {}
        if (selectedProgram !== 'all') filters.program = selectedProgram
        
        let coursesData, evaluationsData
        
        // Use appropriate API based on user role
        if (isAdmin(currentUser)) {
          coursesData = await adminAPI.getCourses(filters)
          evaluationsData = await adminAPI.getEvaluations(filters)
        } else if (currentUser.role === 'secretary') {
          coursesData = await secretaryAPI.getCourses(filters)
          evaluationsData = await secretaryAPI.getEvaluations(filters)
        } else if (currentUser.role === 'department_head') {
          coursesData = await deptHeadAPI.getCourses(filters)
          evaluationsData = await deptHeadAPI.getEvaluations(filters)
        } else if (currentUser.role === 'instructor') {
          coursesData = await instructorAPI.getCourses(filters)
          evaluationsData = await instructorAPI.getEvaluations(filters)
        } else {
          throw new Error(`Unsupported role: ${currentUser.role}`)
        }
        
        // Extract data from response (handle both direct arrays and {success, data} format)
        const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.data || [])
        const evaluations = Array.isArray(evaluationsData) ? evaluationsData : (evaluationsData?.data || [])
        
        // Normalize course data (handle different backend formats)
        const normalizedCourses = courses.map(course => ({
          id: course.id || course.section_id,
          name: course.name || course.course_name || '',
          code: course.code || course.course_code || '',
          classCode: course.classCode || course.class_code || '',
          instructor: course.instructor || course.instructor_name || 'N/A',
          program: course.program || 'N/A',
          yearLevel: course.yearLevel || course.year_level,
          enrolledStudents: course.enrolledStudents || course.enrolled_students || 0,
          semester: course.semester || '',
          academic_year: course.academic_year || course.academicYear || '',
          status: course.status || 'active',
          evaluations_count: course.evaluations_count || course.evaluationCount || 0
        }))
        
        console.log(`[COURSES] Total courses received: ${normalizedCourses.length}`)
        console.log(`[COURSES] User role: ${currentUser.role}`)
        console.log(`[COURSES] First 3 courses:`, normalizedCourses.slice(0, 3))
        
        setCourses(normalizedCourses)
        setEvaluations(evaluations)
      } catch (err) {
        console.error('Error fetching courses:', err)
        setError(err.message || 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUser, selectedProgram])

  // Enhance courses with evaluation data
  const enhancedCourses = useMemo(() => {
    return courses.map(course => {
      // Match evaluations by sectionId (since course.id is actually section_id)
      const courseEvaluations = evaluations.filter(e => e.sectionId === course.id || e.courseId === course.id)
      
      // Use data from API response first, fallback to calculation
      const evaluationCount = course.evaluations_count || courseEvaluations.length
      const enrollmentCount = course.enrolledStudents || 0
      
      // Use overallRating from API (already calculated in backend)
      let overallRating = course.overallRating || 0
      
      // Only recalculate if API didn't provide it and we have evaluations
      if (!overallRating && courseEvaluations.length > 0) {
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
  }, [courses, evaluations])

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

  const filteredCourses = enhancedCourses.filter(course => {
    const matchesSearch = (course.name || course.course_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.code || course.course_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.instructor || course.instructor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Enhanced program matching - handle different field variations
    const courseProgram = course.program || course.program_code || course.program_name || ''
    const matchesProgram = selectedProgram === 'all' || 
                          courseProgram === selectedProgram ||
                          courseProgram.includes(selectedProgram) ||
                          selectedProgram.includes(courseProgram)
    
    return matchesSearch && matchesProgram
  })
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProgram])

  // Calculate active courses (courses with status 'active' or ongoing evaluations)
  const activeCourses = enhancedCourses.filter(course => {
    const status = (course.status || '').toLowerCase()
    return status === 'active' || status === 'ongoing' || status === 'open' || !status
  })
  
  // Debug logging
  useEffect(() => {
    console.log('[COURSES] Total courses:', courses.length)
    console.log('[COURSES] Enhanced courses:', enhancedCourses.length)
    console.log('[COURSES] Active courses:', activeCourses.length)
    console.log('[COURSES] Filtered courses:', filteredCourses.length)
    console.log('[COURSES] Programs in state:', programs)
  }, [courses, enhancedCourses, activeCourses, filteredCourses, programs])

  const handleCourseClick = async (courseId) => {
    setSubmitting(true)
    setLoadingDetails(true)
    setSelectedCourse(courseId)
    
    try {
      // Get actual course data
      const course = courses.find(c => c.id === courseId)
      if (!course) {
        throw new Error('Course not found')
      }
      
      const courseEvals = evaluations.filter(e => e.courseId === courseId)
      
      // Fetch category averages and question distribution from backend
      let categoryData = []
      let questionData = []
      
      try {
        if (isAdmin(currentUser)) {
          const [catResp, qResp] = await Promise.all([
            adminAPI.getCategoriesAverages(courseId, currentUser.id),
            adminAPI.getQuestionDistribution(courseId, currentUser.id)
          ])
          categoryData = catResp?.data?.categories || []
          questionData = qResp?.data?.questions || []
        } else if (currentUser.role === 'secretary') {
          const [catResp, qResp] = await Promise.all([
            secretaryAPI.getCategoryAverages(courseId, currentUser.id),
            secretaryAPI.getQuestionDistribution(courseId, currentUser.id)
          ])
          categoryData = catResp?.data?.categories || []
          questionData = qResp?.data?.questions || []
        } else if (currentUser.role === 'department_head') {
          const [catResp, qResp] = await Promise.all([
            deptHeadAPI.getCategoryAverages(courseId, currentUser.id),
            deptHeadAPI.getQuestionDistribution(courseId, currentUser.id)
          ])
          categoryData = catResp?.data?.categories || []
          questionData = qResp?.data?.questions || []
        }
        
        setCategoryAverages(categoryData)
        setQuestionDistribution(questionData)
      } catch (apiError) {
        console.error('Error fetching detailed analysis data:', apiError)
        // Continue with existing data even if new endpoints fail
        setCategoryAverages([])
        setQuestionDistribution([])
      }
      
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
      
      setSubmitting(false)
      setLoadingDetails(false)
    } catch (error) {
      console.error('Error loading course details:', error)
      setSubmitting(false)
      setLoadingDetails(false)
      // Could add error state here to show user-friendly error message
    }
  }
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewSection(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'max_students' || name === 'course_id' || name === 'instructor_id' 
        ? parseInt(value) || value
        : value
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
    
    if (!newSection.course_id) errors.course_id = 'Please select a course'
    if (!newSection.instructor_id) errors.instructor_id = 'Please select an instructor'
    if (!newSection.class_code?.trim()) errors.class_code = 'Class code is required'
    if (!newSection.academic_year?.trim()) errors.academic_year = 'Academic year is required'
    if (!newSection.max_students || newSection.max_students < 1) errors.max_students = 'Maximum students must be at least 1'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
    
  
  // Handle form submission
  const handleSubmitCourse = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSubmitting(true)
    
    try {
      // Create section using secretary or admin API
      let response
      if (currentUser.role === 'secretary') {
        response = await secretaryAPI.createSection(newSection)
      } else if (currentUser.role === 'department_head') {
        response = await adminAPI.createSection(newSection)
      } else {
        response = await adminAPI.createSection(newSection)
      }
      
      alert('Class section created successfully!')
      setShowAddModal(false)
      
      // Refresh the courses list
      const filters = {}
      if (selectedProgram !== 'all') filters.program = selectedProgram
      
      let coursesData
      if (currentUser.role === 'secretary') {
        coursesData = await secretaryAPI.getCourses(filters)
      } else if (currentUser.role === 'department_head') {
        coursesData = await deptHeadAPI.getCourses(filters)
      } else {
        coursesData = await adminAPI.getCourses(filters)
      }
      
      const coursesArray = Array.isArray(coursesData) ? coursesData : (coursesData?.data || [])
      const normalized = coursesArray.map(course => ({
        id: course.id || course.section_id,
        name: course.name || course.course_name || '',
        code: course.code || course.course_code || '',
        classCode: course.classCode || course.class_code || '',
        instructor: course.instructor || course.instructor_name || 'N/A',
        program: course.program || 'N/A',
        yearLevel: course.yearLevel || course.year_level,
        enrolledStudents: course.enrolledStudents || course.enrolled_students || 0,
        semester: course.semester || '',
        academic_year: course.academic_year || course.academicYear || '',
        status: course.status || 'active',
        evaluations_count: course.evaluations_count || course.evaluationCount || 0
      }))
      setCourses(normalized)
      
      // Reset form
      setNewSection({
        course_id: '',
        instructor_id: '',
        class_code: '',
        semester: 1,
        academic_year: '2024-2025',
        max_students: 40
      })
      setFormErrors({})
      
    } catch (error) {
      console.error('[COURSES] Error creating section:', error)
      alert(error.message || 'Failed to create section. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  // Reset form when modal is closed
  const handleCloseModal = () => {
    setShowAddModal(false)
    setNewSection({
      course_id: '',
      instructor_id: '',
      class_code: '',
      semester: 1,
      academic_year: '2024-2025',
      max_students: 40
    })
    setFormErrors({})
  }

  // Convert data for recharts format with Top N limiter
  const chartData = useMemo(() => {
    if (!filteredCourses || filteredCourses.length === 0) return []
    
    // Sort by overall rating (descending) and take top N
    const sortedCourses = [...filteredCourses].sort((a, b) => 
      (Number(b.overallRating) || 0) - (Number(a.overallRating) || 0)
    )
    
    const limitedCourses = chartLimit === 'all' 
      ? sortedCourses 
      : sortedCourses.slice(0, parseInt(chartLimit))
    
    return limitedCourses.map(course => ({
      code: String(course.code || 'N/A'),
      overallRating: Number(course.overallRating) || 0,
      responseRate: Number(course.responseRate) || 0
    }))
  }, [filteredCourses, chartLimit])

  // Recharts doesn't need chartOptions object

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen lpu-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen lpu-background">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Courses</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-6 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
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
                {currentUser?.role === 'instructor' 
                  ? 'View your assigned courses, track student evaluations, and monitor class performance metrics.'
                  : currentUser?.role === 'department_head'
                  ? 'Monitor department courses, track evaluation metrics, and analyze student feedback.'
                  : 'Monitor course performance, track evaluation metrics, and analyze student feedback across all academic programs.'}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-white/80 text-sm">
                      {currentUser?.role === 'instructor' 
                        ? 'Your Assigned Sections'
                        : currentUser?.role === 'department_head'
                        ? `${currentUser.department || 'Department'} Courses`
                        : 'System-wide Analysis'}
                    </p>
                    <p className="font-bold text-[#ffd700] text-lg">
                      {activeCourses.length} {currentUser?.role === 'instructor' ? 'Active Sections' : 'Active Courses'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Role-specific Info Banner */}
        {currentUser?.role === 'instructor' && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Instructor View</h3>
                <p className="text-sm text-blue-700">
                  You are viewing only your assigned course sections ({activeCourses.length} active). 
                  To view all courses, please contact your department head or system administrator.
                </p>
              </div>
            </div>
          </div>
        )}
        
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
                <p className="text-3xl font-bold text-white">{courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0)}</p>
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
                  {courses.length > 0 ? (courses.reduce((sum, course) => sum + (course.overallRating || 0), 0) / courses.length).toFixed(1) : '0.0'}
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
                  {courses.length > 0 ? Math.round(courses.reduce((sum, course) => sum + (course.responseRate || 0), 0) / courses.length) : 0}%
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#7a0000]">Course Performance Overview</h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  value={chartLimit}
                  onChange={(e) => setChartLimit(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                >
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                  <option value="all">All Courses</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="overallRating" fill="#7a0000" name="Overall Rating" />
              </BarChart>
            </ResponsiveContainer>
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
                onChange={(e) => {
                  console.log('[COURSES] Program filter changed to:', e.target.value)
                  setSelectedProgram(e.target.value)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent bg-white transition-all duration-200"
              >
                <option value="all">All Programs</option>
                {programs.map(program => {
                  const displayCode = program.code || program.program_code || ''
                  const displayName = program.name || program.program_name || 'Unknown Program'
                  const optionValue = displayCode || displayName
                  const optionLabel = displayCode ? `${displayCode} - ${displayName}` : displayName
                  
                  console.log('[COURSES] Rendering option:', { displayCode, displayName, optionValue, optionLabel })
                  
                  return (
                    <option key={program.id} value={optionValue}>
                      {optionLabel}
                    </option>
                  )
                })}
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
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCourses.length)} of {filteredCourses.length} courses (Page {currentPage} of {totalPages})
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
                {paginatedCourses.map((course) => (
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
                        <span className="font-bold text-gray-900">{course.overallRating || '0.0'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${course.responseRate || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-gray-900">{course.responseRate || 0}%</span>
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • {filteredCourses.length} total courses
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            currentPage === pageNum
                              ? 'bg-[#7a0000] text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-2 py-2 text-gray-500">...</span>
                    }
                    return null
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
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
                          {courseDetails.overallRating || '0.0'}
                        </div>
                        <div className="flex justify-center mb-3">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-6 h-6 ${i < Math.floor(courseDetails.overallRating || 0) ? 'text-[#ffd700]' : 'text-gray-300'}`} 
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

                  {/* Category Averages (31 Questions - 6 Categories) */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Category Performance Analysis</h3>
                    <p className="text-sm text-gray-500 mb-6">Average ratings across 6 evaluation categories (31 questions)</p>
                    
                    {loadingDetails ? (
                      <div className="flex justify-center py-8">
                        <svg className="animate-spin h-8 w-8 text-[#7a0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : categoryAverages.length > 0 ? (
                      <div className="space-y-4">
                        {categoryAverages.map((category, index) => {
                          const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-teal-600', 'text-pink-600'];
                          const bgColors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50', 'bg-teal-50', 'bg-pink-50'];
                          const percentage = (category.average / 4) * 100;
                          
                          return (
                            <div key={category.category_id} className={`${bgColors[index % bgColors.length]} p-4 rounded-lg`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-800">{category.category_name}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                                </div>
                                <div className={`text-2xl font-bold ${colors[index % colors.length]} ml-4`}>
                                  {category.average}/4.0
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className={`h-2.5 rounded-full ${colors[index % colors.length].replace('text-', 'bg-')}`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-gray-600">
                                    {category.question_count} questions • {category.total_responses} responses
                                  </span>
                                  <span className="text-xs font-medium text-gray-700">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <p>No category data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Analysis Tab (31 Questions) */}
              {activeTab === 'sentiment' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                      Question-Level Response Distribution
                    </h3>
                    <p className="text-sm text-gray-600">
                      Detailed breakdown of how students rated each of the 31 evaluation questions (1 = Strongly Disagree, 4 = Strongly Agree)
                    </p>
                  </div>

                  {loadingDetails ? (
                    <div className="flex justify-center py-12">
                      <svg className="animate-spin h-10 w-10 text-[#7a0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : questionDistribution.length > 0 ? (
                    <div className="space-y-6">
                      {/* Group questions by category */}
                      {categoryAverages.map((category, catIndex) => {
                        // Get question numbers for this category
                        const categoryQuestionMaps = {
                          'relevance_of_course': [1, 2, 3, 4, 5, 6],
                          'course_organization': [7, 8, 9, 10, 11],
                          'teaching_learning': [12, 13, 14, 15, 16, 17, 18],
                          'assessment': [19, 20, 21, 22, 23, 24],
                          'learning_environment': [25, 26, 27, 28, 29, 30],
                          'counseling': [31]
                        };
                        
                        const questionNumbers = categoryQuestionMaps[category.category_id] || [];
                        const categoryQuestions = questionDistribution.filter(q => 
                          questionNumbers.includes(q.question_number)
                        );
                        
                        if (categoryQuestions.length === 0) return null;
                        
                        const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink'];
                        const color = colors[catIndex % colors.length];
                        
                        return (
                          <div key={category.category_id} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-6`}>
                            <h4 className={`text-lg font-bold text-${color}-900 mb-4`}>
                              {category.category_name}
                            </h4>
                            
                            <div className="space-y-4">
                              {categoryQuestions.map(question => (
                                <div key={question.question_number} className="bg-white rounded-lg p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="font-semibold text-gray-700">
                                      Question {question.question_number}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-lg font-bold text-${color}-600`}>
                                        {question.average.toFixed(2)}
                                      </span>
                                      <span className="text-sm text-gray-500">/ 4.0</span>
                                    </div>
                                  </div>
                                  
                                  {/* Response distribution bars */}
                                  <div className="space-y-2">
                                    {['4', '3', '2', '1'].map(rating => {
                                      const ratingData = question.distribution[rating];
                                      const barColors = {
                                        '4': 'bg-green-500',
                                        '3': 'bg-blue-500',
                                        '2': 'bg-orange-500',
                                        '1': 'bg-red-500'
                                      };
                                      
                                      return (
                                        <div key={rating} className="flex items-center space-x-3">
                                          <span className="text-xs font-medium text-gray-600 w-24">
                                            Rating {rating}
                                          </span>
                                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                            <div 
                                              className={`${barColors[rating]} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                                              style={{ width: `${ratingData.percentage}%` }}
                                            >
                                              {ratingData.percentage > 10 && (
                                                <span className="text-xs font-medium text-white">
                                                  {ratingData.percentage.toFixed(1)}%
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <span className="text-xs text-gray-600 w-16 text-right">
                                            {ratingData.count} ({ratingData.percentage.toFixed(1)}%)
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <span className="text-xs text-gray-500">
                                      Total responses: {question.total_responses}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                      <p className="text-lg font-medium">No question distribution data available</p>
                      <p className="text-sm">Evaluation responses will appear here once submitted</p>
                    </div>
                  )}
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
      
      {/* Add Course functionality removed - monitoring role only */}
      {false && (
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
                      <h2 className="text-xl font-bold text-white">Create New Class Section</h2>
                      <p className="text-[#ffd700] text-sm">Add a new section for an existing course</p>
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
                {/* Course Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="course_id"
                    value={newSection.course_id}
                    onChange={handleInputChange}
                    className={`lpu-select ${formErrors.course_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Select a Course --</option>
                    {availableCourses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.subject_code} - {course.subject_name} (Year {course.year_level})
                      </option>
                    ))}
                  </select>
                  {formErrors.course_id && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.course_id}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Choose from existing course definitions</p>
                </div>
                
                {/* Class Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="class_code"
                    value={newSection.class_code}
                    onChange={handleInputChange}
                    placeholder="e.g., ITCO-1001-A"
                    className={`lpu-input ${formErrors.class_code ? 'border-red-500' : ''}`}
                  />
                  {formErrors.class_code && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.class_code}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Unique section identifier</p>
                </div>
                
                {/* Instructor Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Instructor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="instructor_id"
                    value={newSection.instructor_id}
                    onChange={handleInputChange}
                    className={`lpu-select ${formErrors.instructor_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Select Instructor --</option>
                    {instructors.map(instructor => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.first_name} {instructor.last_name} ({instructor.email})
                      </option>
                    ))}
                  </select>
                  {formErrors.instructor_id && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.instructor_id}</p>
                  )}
                </div>
                
                {/* Semester */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={newSection.semester}
                    onChange={handleInputChange}
                    className="lpu-select"
                  >
                    <option value={1}>First Semester</option>
                    <option value={2}>Second Semester</option>
                    <option value={3}>Summer</option>
                  </select>
                </div>
                
                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="academic_year"
                    value={newSection.academic_year}
                    onChange={handleInputChange}
                    placeholder="e.g., 2024-2025"
                    className={`lpu-input ${formErrors.academic_year ? 'border-red-500' : ''}`}
                  />
                  {formErrors.academic_year && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.academic_year}</p>
                  )}
                </div>
                
                {/* Max Students */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Students <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="max_students"
                    value={newSection.max_students}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="40"
                    className={`lpu-input ${formErrors.max_students ? 'border-red-500' : ''}`}
                  />
                  {formErrors.max_students && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.max_students}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Section capacity</p>
                </div>
              </div>
              
              {/* Form Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Section Summary
                </h4>
                <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Course:</span> {availableCourses.find(c => c.id === newSection.course_id)?.subject_name || 'Not selected'}</div>
                  <div><span className="font-medium">Class Code:</span> {newSection.class_code || 'Not specified'}</div>
                  <div><span className="font-medium">Instructor:</span> {instructors.find(i => i.id === newSection.instructor_id)?.first_name && instructors.find(i => i.id === newSection.instructor_id)?.last_name ? `${instructors.find(i => i.id === newSection.instructor_id).first_name} ${instructors.find(i => i.id === newSection.instructor_id).last_name}` : 'Not selected'}</div>
                  <div><span className="font-medium">Semester:</span> {newSection.semester === 1 ? 'First Semester' : newSection.semester === 2 ? 'Second Semester' : 'Summer'}</div>
                  <div><span className="font-medium">Academic Year:</span> {newSection.academic_year}</div>
                  <div><span className="font-medium">Capacity:</span> {newSection.max_students} students</div>
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
                      Create Section
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