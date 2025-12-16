import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { isAdmin, isStaffMember } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, deptHeadAPI, secretaryAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'
import Pagination from '../../components/Pagination'
import { useDebounce } from '../../hooks/useDebounce'
import { transformPrograms, toDisplayCode } from '../../utils/programMapping'
import CustomDropdown from '../../components/CustomDropdown'

export default function Evaluations() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [evaluations, setEvaluations] = useState([])
  const [allEvaluations, setAllEvaluations] = useState([]) // All evaluations for chart
  const [courses, setCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // Debounce search
  const [programFilter, setProgramFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [yearLevelFilter, setYearLevelFilter] = useState('all')
  const [evaluationPeriods, setEvaluationPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [activePeriod, setActivePeriod] = useState(null)
  const [chartLimit, setChartLimit] = useState(10) // Top N items to show in chart
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState(null)

  // Filter options states
  const [programOptions, setProgramOptions] = useState([])
  const [yearLevelOptions, setYearLevelOptions] = useState([])

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!currentUser) return
      
      try {
        let programsResponse, yearLevelsResponse, periodsResponse
        
        if (currentUser.role === 'secretary') {
          [programsResponse, yearLevelsResponse, periodsResponse] = await Promise.all([
            secretaryAPI.getPrograms(),
            secretaryAPI.getYearLevels(),
            secretaryAPI.getEvaluationPeriods()
          ])
        } else if (currentUser.role === 'department_head') {
          [programsResponse, yearLevelsResponse, periodsResponse] = await Promise.all([
            deptHeadAPI.getPrograms(),
            deptHeadAPI.getYearLevels(),
            deptHeadAPI.getEvaluationPeriods()
          ])
        } else if (isAdmin(currentUser)) {
          [programsResponse, yearLevelsResponse, periodsResponse] = await Promise.all([
            adminAPI.getPrograms(),
            adminAPI.getYearLevels(),
            adminAPI.getEvaluationPeriods()
          ])
        }
        
        if (programsResponse?.data) {
          setProgramOptions(transformPrograms(programsResponse.data))
        }
        if (yearLevelsResponse?.data) {
          setYearLevelOptions(yearLevelsResponse.data)
        }
        if (periodsResponse?.data) {
          setEvaluationPeriods(periodsResponse.data)
          const active = periodsResponse.data.find(p => p.status === 'Open' || p.status === 'active' || p.status === 'Active')
          if (active) {
            setActivePeriod(active)
          }
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }
    
    fetchFilterOptions()
  }, [currentUser?.role])

  // Redirect unauthorized users
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (currentUser.role === 'student') {
      navigate('/student/courses')
      return
    }
    
    if (!isAdmin(currentUser) && !isStaffMember(currentUser)) {
      navigate('/')
      return
    }
  }, [currentUser?.role, currentUser?.id, navigate])

  // Use timeout hook for API calls - fetch paginated evaluations + all evaluations for chart
  const { data: apiData, loading, error, retry } = useApiWithTimeout(
    async () => {
      if (!currentUser) return null
      
      // Check if we have a period to query (either selected or active)
      if (!selectedPeriod && !activePeriod) {
        // No period selected and no active period - return empty data
        return { evaluations: [], allEvaluations: [], courses: [], dashboard: null, pagination: null }
      }
      
      const filters = {
        page: currentPage,
        page_size: 15
      }
      if (programFilter !== 'all') filters.program = programFilter
      if (sentimentFilter !== 'all') filters.sentiment = sentimentFilter
      if (semesterFilter !== 'all') filters.semester = semesterFilter
      if (yearLevelFilter !== 'all') filters.yearLevel = yearLevelFilter
      // Use selectedPeriod if set, otherwise use active period ID
      const periodIdToUse = selectedPeriod || activePeriod?.id
      if (periodIdToUse) filters.period_id = periodIdToUse
      
      // Fetch all evaluations for chart (1000 max) - also filter by period
      const allEvaluationsFilters = {
        page: 1,
        page_size: 1000
      }
      if (periodIdToUse) allEvaluationsFilters.period_id = periodIdToUse
      
      let evaluationsData, allEvaluationsData, coursesData, dashboardData
      
      // Use appropriate API based on user role
      if (isAdmin(currentUser)) {
        [evaluationsData, allEvaluationsData, coursesData] = await Promise.all([
          adminAPI.getEvaluations(filters),
          adminAPI.getEvaluations(allEvaluationsFilters),
          adminAPI.getCourses()
        ])
        dashboardData = null // Admin doesn't have dashboard endpoint yet
      } else if (currentUser.role === 'secretary') {
        [evaluationsData, allEvaluationsData, coursesData, dashboardData] = await Promise.all([
          secretaryAPI.getEvaluations(filters),
          secretaryAPI.getEvaluations(allEvaluationsFilters),
          secretaryAPI.getCourses(),
          secretaryAPI.getDashboard()
        ])
      } else if (currentUser.role === 'department_head') {
        [evaluationsData, allEvaluationsData, coursesData, dashboardData] = await Promise.all([
          deptHeadAPI.getEvaluations(filters),
          deptHeadAPI.getEvaluations(allEvaluationsFilters),
          deptHeadAPI.getCourses(),
          deptHeadAPI.getDashboard()
        ])
      } else {
        throw new Error(`Unsupported role: ${currentUser.role}`)
      }
      
      // Extract data and pagination from response
      const evaluations = Array.isArray(evaluationsData) ? evaluationsData : (evaluationsData?.data || [])
      const evalPagination = evaluationsData?.pagination || null
      const allEvaluations = Array.isArray(allEvaluationsData) ? allEvaluationsData : (allEvaluationsData?.data || [])
      const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.data || [])
      const dashboard = dashboardData?.data || null
      
      return { evaluations, allEvaluations, courses, dashboard, pagination: evalPagination }
    },
    [currentUser?.id, currentUser?.role, currentPage, programFilter, sentimentFilter, semesterFilter, yearLevelFilter, selectedPeriod, activePeriod]
  )

  // Update state when data changes
  useEffect(() => {
    if (apiData) {
      setEvaluations(apiData.evaluations)
      setAllEvaluations(apiData.allEvaluations || [])
      setCourses(apiData.courses)
      setPagination(apiData.pagination)
    }
  }, [apiData])
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [programFilter, sentimentFilter, semesterFilter, yearLevelFilter])

  // Extract dashboard statistics
  const dashboardStats = apiData?.dashboard || null

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const programs = [...new Set(courses.map(course => course.program))].filter(Boolean).sort()
    const semesters = [...new Set(evaluations.map(evaluation => evaluation.semester))].filter(Boolean).sort()
    const yearLevels = [...new Set(courses.map(course => course.yearLevel))].filter(Boolean).sort()

    return { programs, semesters, yearLevels }
  }, [courses, evaluations])

  // Enhanced evaluations with course information
  const enhancedEvaluations = useMemo(() => {
    return evaluations.map(evaluation => {
      // Match by sectionId (primary) or courseId (fallback)
      const course = courses.find(c => c.id === evaluation.sectionId || c.id === evaluation.courseId)
      
      // Use rating_overall from backend (1-4 scale) - matches Courses page calculation
      const avgRating = evaluation.rating_overall || evaluation.rating || 0

      // Use consistent dates based on semester instead of random dates
      let submittedDate = 'N/A'
      if (evaluation.semester) {
        if (evaluation.semester.includes('First 2023')) {
          submittedDate = '6/15/2023'
        } else if (evaluation.semester.includes('Second 2023')) {
          submittedDate = '12/10/2023'
        } else if (evaluation.semester.includes('First 2024')) {
          submittedDate = '6/15/2024'
        } else if (evaluation.semester.includes('Second 2024')) {
          submittedDate = '12/10/2024'
        } else if (evaluation.semester.includes('First 2025')) {
          submittedDate = '6/15/2025'
        }
      }

      return {
        ...evaluation,
        courseName: course?.name || 'Unknown Course',
        courseProgram: toDisplayCode(course?.program) || 'Unknown',
        avgRating,
        submittedDate: evaluation.submission_date 
          ? new Date(evaluation.submission_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit' 
            })
          : submittedDate
      }
    })
  }, [evaluations, courses])

  // Filter evaluations based on search and filters
  const filteredEvaluations = useMemo(() => {
    return enhancedEvaluations.filter(evaluation => {
      const matchesSearch = searchTerm === '' || 
        evaluation.courseName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        evaluation.student.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        evaluation.comment.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      
      const matchesProgram = programFilter === 'all' || evaluation.courseProgram === programFilter
      const matchesSentiment = sentimentFilter === 'all' || evaluation.sentiment === sentimentFilter
      const matchesSemester = semesterFilter === 'all' || evaluation.semester === semesterFilter
      const matchesYearLevel = yearLevelFilter === 'all' || evaluation.courseYearLevel?.toString() === yearLevelFilter
      
      return matchesSearch && matchesProgram && matchesSentiment && matchesSemester && matchesYearLevel
    })
  }, [enhancedEvaluations, searchTerm, programFilter, sentimentFilter, semesterFilter, yearLevelFilter])

  // Calculate evaluation statistics - use dashboard data if available
  const evaluationStats = useMemo(() => {
    // If we have dashboard stats, use them for accurate overall statistics
    if (dashboardStats) {
      return {
        total: dashboardStats.total_evaluations || 0,
        positive: dashboardStats.sentiment?.positive || 0,
        neutral: dashboardStats.sentiment?.neutral || 0,
        negative: dashboardStats.sentiment?.negative || 0,
        anomalies: dashboardStats.anomalies || 0,
        overallAvgRating: dashboardStats.average_rating?.toFixed(2) || '0.00',
        totalEnrolledStudents: dashboardStats.total_enrolled_students || 0,
        participationRate: Math.round(dashboardStats.participation_rate || 0)
      }
    }

    // Fallback to calculating from current data (for admin or when dashboard unavailable)
    const total = enhancedEvaluations.length
    const positive = enhancedEvaluations.filter(e => e.sentiment === 'positive').length
    const neutral = enhancedEvaluations.filter(e => e.sentiment === 'neutral').length
    const negative = enhancedEvaluations.filter(e => e.sentiment === 'negative').length
    const anomalies = enhancedEvaluations.filter(e => e.anomaly).length

    // Calculate total enrolled students and participation rate
    const totalEnrolledStudents = courses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0)
    const participationRate = totalEnrolledStudents > 0 ? Math.round((total / totalEnrolledStudents) * 100) : 0

    // Calculate average rating across all evaluations using rating_overall from backend
    const ratingsData = enhancedEvaluations
      .filter(e => e.avgRating > 0)
      .map(e => e.avgRating)
    
    const overallAvgRating = ratingsData.length > 0 
      ? (ratingsData.reduce((a, b) => a + b) / ratingsData.length).toFixed(2)
      : '0.00'

    return {
      total,
      positive,
      neutral,
      negative,
      anomalies,
      overallAvgRating,
      totalEnrolledStudents,
      participationRate
    }
  }, [dashboardStats, enhancedEvaluations, courses])

  // Sentiment trend data for chart - adapts based on user role (uses all evaluations, not just current page)
  const sentimentTrendData = useMemo(() => {
    console.log('[CHART] Calculating sentiment trend with', allEvaluations.length, 'evaluations')
    
    if (allEvaluations.length === 0) {
      console.log('[CHART] No evaluations available for chart')
      return []
    }
    
    if (isAdmin(currentUser)) {
      // Secretary/Admin: Sentiment by Program
      const programs = [...new Set(courses.map(c => c.program))].filter(Boolean)
      console.log('[CHART] Programs found:', programs)
      
      const programData = programs.map(program => {
        const programCourses = courses.filter(c => c.program === program)
        const programCourseIds = programCourses.map(c => c.id)
        
        // Match evaluations by sectionId or courseId
        const programEvaluations = allEvaluations.filter(e => 
          programCourseIds.includes(e.sectionId) || programCourseIds.includes(e.courseId)
        )
        
        const positive = programEvaluations.filter(e => e.sentiment === 'positive').length
        const neutral = programEvaluations.filter(e => e.sentiment === 'neutral').length
        const negative = programEvaluations.filter(e => e.sentiment === 'negative').length
        
        console.log(`[CHART] Program ${program}: ${positive} pos, ${neutral} neu, ${negative} neg`)
        
        return {
          name: program,
          positive,
          neutral,
          negative,
          total: positive + neutral + negative
        }
      })
      
      // Sort by total evaluations and apply limit
      const sortedData = programData.filter(d => d.total > 0).sort((a, b) => b.total - a.total)
      const finalData = chartLimit === 'all' ? sortedData : sortedData.slice(0, parseInt(chartLimit))
      console.log('[CHART] Final chart data:', finalData.length, 'programs')
      return finalData
    } else {
      // Department Head: Sentiment by Subject/Course
      const departmentCourses = currentUser?.assignedPrograms 
        ? courses.filter(course => currentUser.assignedPrograms.includes(course.program))
        : courses
      
      console.log('[CHART] Department courses:', departmentCourses.length)
      
      const courseData = departmentCourses.map(course => {
        const courseEvaluations = allEvaluations.filter(e => 
          e.sectionId === course.id || e.courseId === course.id
        )
        
        const positive = courseEvaluations.filter(e => e.sentiment === 'positive').length
        const neutral = courseEvaluations.filter(e => e.sentiment === 'neutral').length
        const negative = courseEvaluations.filter(e => e.sentiment === 'negative').length
        
        return {
          name: course.classCode || course.name,
          positive,
          neutral,
          negative,
          fullName: course.name,
          courseCode: course.classCode,
          total: positive + neutral + negative
        }
      })
      
      // Sort by total evaluations and apply limit
      const sortedData = courseData.filter(d => d.total > 0).sort((a, b) => b.total - a.total)
      const finalData = chartLimit === 'all' ? sortedData : sortedData.slice(0, parseInt(chartLimit))
      console.log('[CHART] Final chart data:', finalData.length, 'courses')
      return finalData
    }
  }, [allEvaluations, courses, currentUser, chartLimit])

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'neutral': return 'bg-yellow-100 text-yellow-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingColor = (rating) => {
    const numRating = parseFloat(rating)
    if (numRating >= 4.0) return 'text-green-600'
    if (numRating >= 3.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!currentUser) return null

  // Loading and error states
  if (loading) return <LoadingSpinner message="Loading evaluations..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen lpu-background">
      {/* Enhanced LPU Header */}
      <header className="lpu-header">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Student Evaluations Management</h1>
                <p className="text-[#ffd700] text-sm">
                  {isAdmin(currentUser) ? 'Comprehensive Academic Evaluation System' : `${currentUser.department} Department Evaluation Portal`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Enhanced Evaluation Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-6 mb-12">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Survey Participation</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{evaluationStats.total}/{evaluationStats.totalEnrolledStudents}</p>
                <p className="text-xs text-white/80 mt-1">students ({evaluationStats.participationRate}%)</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#C41E3A] to-[#9D1535] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Participation Rate</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{evaluationStats.participationRate}%</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  evaluationStats.participationRate >= 80 ? 'bg-green-400' :
                  evaluationStats.participationRate >= 60 ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}
                style={{ width: `${evaluationStats.participationRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Positive Feedback</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{evaluationStats.positive}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Neutral Feedback</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{evaluationStats.neutral}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Negative Feedback</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{evaluationStats.negative}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Average Rating</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{evaluationStats.overallAvgRating}/4.0</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Sentiment Trend Chart */}
        <div className="lpu-chart-container mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="chart-title">
                <svg className="w-6 h-6 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                {isAdmin(currentUser) ? 'Academic Program Sentiment Analysis' : 'Course-Level Sentiment Analysis'}
              </div>
              <p className="text-gray-600 text-sm">
                {isAdmin(currentUser) 
                  ? 'Comprehensive sentiment distribution across all academic programs'
                  : 'Detailed sentiment breakdown for individual courses'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Show:</label>
              <CustomDropdown
                value={chartLimit.toString()}
                onChange={(val) => setChartLimit(val)}
                options={[
                  { value: '5', label: 'Top 5' },
                  { value: '10', label: 'Top 10' },
                  { value: '20', label: 'Top 20' },
                  { value: 'all', label: 'All Items' }
                ]}
              />
            </div>
          </div>
          
          {sentimentTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={sentimentTrendData}>
                <XAxis 
                  dataKey="name" 
                  angle={0}
                  textAnchor="middle"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => {
                    const item = sentimentTrendData.find(d => d.name === label);
                    // Show full course name with code in tooltip
                    if (item?.fullName && item?.courseCode) {
                      return `${item.courseCode}: ${item.fullName}`;
                    }
                    return item?.fullName || label;
                  }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="positive" fill="#10b981" name="Positive" radius={[4, 4, 0, 0]} minPointSize={2} />
                <Bar dataKey="neutral" fill="#f59e0b" name="Neutral" radius={[4, 4, 0, 0]} minPointSize={2} />
                <Bar dataKey="negative" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} minPointSize={2} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <p>No evaluation data available for visualization</p>
            </div>
          )}
        </div>

        {/* Enhanced Filters Section */}
        <div className="lpu-card mb-8 p-8 overflow-visible">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              <h3 className="text-2xl font-bold text-gray-900">Evaluation Filters</h3>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredEvaluations.length} results
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 overflow-visible">
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-3">Search Evaluations</label>
              <input
                type="text"
                placeholder="Search by course, student, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lpu-input"
              />
            </div>
            
            <CustomDropdown
              label="Academic Program"
              value={programFilter}
              onChange={(val) => setProgramFilter(val)}
              options={[
                { value: 'all', label: 'All Programs' },
                ...programOptions.map(program => ({
                  value: program.code,
                  label: `${program.code} - ${program.name}`
                }))
              ]}
              searchable={true}
            />

            <CustomDropdown
              label="Year Level"
              value={yearLevelFilter}
              onChange={(val) => setYearLevelFilter(val)}
              options={[
                { value: 'all', label: 'All Year Levels' },
                ...yearLevelOptions.map(yearLevel => ({
                  value: yearLevel.value,
                  label: yearLevel.label
                }))
              ]}
            />

            <CustomDropdown
              label="Sentiment Type"
              value={sentimentFilter}
              onChange={(val) => setSentimentFilter(val)}
              options={[
                { value: 'all', label: 'All Sentiments' },
                { value: 'positive', label: 'Positive Feedback' },
                { value: 'neutral', label: 'Neutral Feedback' },
                { value: 'negative', label: 'Negative Feedback' }
              ]}
            />

            <CustomDropdown
              label="Evaluation Period"
              value={selectedPeriod ? selectedPeriod.toString() : ''}
              onChange={(val) => setSelectedPeriod(val ? parseInt(val) : null)}
              options={[
                { value: '', label: 'All Periods' },
                ...evaluationPeriods.map(period => ({
                  value: period.id.toString(),
                  label: `${period.name} (${period.academic_year}) ${period.status === 'Open' || period.status === 'active' ? '- Active' : ''}`
                }))
              ]}
            />
          </div>
        </div>

        {/* Show warning if no active period and no selection */}
        {!activePeriod && !selectedPeriod ? (
          <div className="lpu-card text-center py-16">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Evaluation Period</h3>
            <p className="text-gray-500 mb-4">There is currently no active evaluation period.</p>
            <p className="text-gray-500">Please contact the administrator to activate an evaluation period, or select a specific period from the filter above.</p>
          </div>
        ) : (
        <>
        {/* Enhanced Evaluations Table */}
        <div className="lpu-card">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h.01M9 16h.01"></path>
              </svg>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Evaluation Records</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Displaying {filteredEvaluations.length} of {evaluationStats.total} total evaluations
                </p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Course Information
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Academic Program
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Overall Rating
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Sentiment Analysis
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Student Feedback
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status Indicator
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEvaluations.map((evaluation, index) => (
                  <tr key={evaluation.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {evaluation.courseName.length > 40 
                          ? evaluation.courseName.substring(0, 40) + '...' 
                          : evaluation.courseName
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{evaluation.student}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        evaluation.courseProgram === 'BSIT' ? 'bg-blue-100 text-blue-800' :
                        evaluation.courseProgram === 'BSCS-DS' ? 'bg-green-100 text-green-800' :
                        evaluation.courseProgram === 'BSCYSEC' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {evaluation.courseProgram}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-bold ${getRatingColor(evaluation.avgRating)} mr-2`}>
                          {evaluation.avgRating}/4.0
                        </span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4].map((star) => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${
                                star <= parseFloat(evaluation.avgRating) ? 'text-[#ffd700]' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getSentimentColor(evaluation.sentiment)}`}>
                        {evaluation.sentiment === 'positive' && '😊'}
                        {evaluation.sentiment === 'neutral' && '😐'}
                        {evaluation.sentiment === 'negative' && '😔'}
                        <span className="ml-1 capitalize">{evaluation.sentiment}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{evaluation.submittedDate}</div>
                      <div className="text-xs text-gray-500">Academic Year 2025</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="truncate" title={evaluation.comment}>
                        {evaluation.comment}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.anomaly ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                          </svg>
                          Anomaly
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEvaluations.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h.01M9 16h.01"></path>
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Found</h4>
                <p className="text-gray-500">
                  {searchTerm || programFilter !== 'all' || sentimentFilter !== 'all' || semesterFilter !== 'all'
                    ? 'No evaluations match your current filters. Try adjusting your search criteria.'
                    : 'No evaluations have been submitted yet. Check back later for student feedback.'
                  }
                </p>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {pagination && pagination.total > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                onPageChange={setCurrentPage}
                itemLabel="evaluations"
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value)
                  setCurrentPage(1)
                }}
                showItemsPerPage={true}
              />
          )}
        </div>
        </>
        )}

      </div>
    </div>
  )
}
