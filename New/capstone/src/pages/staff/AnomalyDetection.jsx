import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { isAdmin, isStaffMember } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, deptHeadAPI, secretaryAPI } from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import { transformPrograms, toDisplayCode } from '../../utils/programMapping'
import CustomDropdown from '../../components/CustomDropdown'

export default function AnomalyDetection() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Enhanced filter states
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // Debounce search
  const [severityFilter, setSeverityFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [yearLevelFilter, setYearLevelFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  
  // Filter options
  const [programs, setPrograms] = useState([])
  const [yearLevels, setYearLevels] = useState([])
  const [courses, setCourses] = useState([])

  // Evaluation Period states
  const [evaluationPeriods, setEvaluationPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [activePeriod, setActivePeriod] = useState(null)

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
  }, [currentUser, navigate])

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!currentUser) return
      
      try {
        let programsRes, yearLevelsRes, coursesRes, periodsRes
        
        if (isAdmin(currentUser)) {
          [programsRes, yearLevelsRes, coursesRes, periodsRes] = await Promise.all([
            adminAPI.getPrograms(),
            Promise.resolve({ data: [{ id: 1, year_level: 1 }, { id: 2, year_level: 2 }, { id: 3, year_level: 3 }, { id: 4, year_level: 4 }] }),
            adminAPI.getCourses(),
            adminAPI.getEvaluationPeriods()
          ])
        } else if (currentUser.role === 'secretary') {
          [programsRes, yearLevelsRes, coursesRes, periodsRes] = await Promise.all([
            secretaryAPI.getPrograms(),
            secretaryAPI.getYearLevels(),
            secretaryAPI.getCourses(),
            secretaryAPI.getEvaluationPeriods()
          ])
        } else if (currentUser.role === 'department_head') {
          [programsRes, yearLevelsRes, coursesRes, periodsRes] = await Promise.all([
            deptHeadAPI.getPrograms(),
            deptHeadAPI.getYearLevels(),
            deptHeadAPI.getCourses(),
            deptHeadAPI.getEvaluationPeriods()
          ])
        }
        
        if (programsRes?.data) setPrograms(transformPrograms(programsRes.data))
        if (yearLevelsRes?.data) setYearLevels(yearLevelsRes.data)
        if (coursesRes?.data) setCourses(coursesRes.data)
        if (periodsRes?.data) {
          setEvaluationPeriods(periodsRes.data)
          const active = periodsRes.data.find(p => p.status === 'active' || p.status === 'Active')
          if (active) {
            setActivePeriod(active.id)
            setSelectedPeriod(active.id)
          }
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }
    
    fetchFilterOptions()
  }, [currentUser])

  // Fetch anomalies from API
  useEffect(() => {
    const fetchAnomalies = async () => {
      if (!currentUser) return
      
      try {
        setLoading(true)
        
        if (!selectedPeriod && !activePeriod) {
          setAnomalies([])
          setLoading(false)
          return
        }
        const params = {}
        if (selectedPeriod) params.period_id = selectedPeriod
        
        let data
        
        // Use appropriate API based on user role
        if (isAdmin(currentUser)) {
          data = await adminAPI.getAnomalies(params)
        } else if (currentUser.role === 'secretary') {
          data = await secretaryAPI.getAnomalies(params)
        } else if (currentUser.role === 'department_head') {
          data = await deptHeadAPI.getAnomalies(params)
        } else {
          throw new Error(`Unsupported role: ${currentUser.role}`)
        }
        
        // Extract data from response (handle both direct array and {success, data} format)
        const anomalies = Array.isArray(data) ? data : (data?.data || [])
        setAnomalies(anomalies)
      } catch (err) {
        console.error('Error fetching anomalies:', err)
        setError(err.message || 'Failed to load anomalies')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnomalies()
  }, [currentUser, selectedPeriod])

  // Enhanced filter logic
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anomaly => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        anomaly.courseName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        anomaly.comment?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        anomaly.instructorName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      
      // Severity filter
      const matchesSeverity = severityFilter === 'all' || anomaly.severity === severityFilter
      
      // Program filter
      const matchesProgram = programFilter === 'all' || anomaly.programId === parseInt(programFilter)
      
      // Year level filter
      const matchesYearLevel = yearLevelFilter === 'all' || anomaly.yearLevel === parseInt(yearLevelFilter)
      
      // Course filter
      const matchesCourse = courseFilter === 'all' || anomaly.courseId === parseInt(courseFilter)
      
      // Semester filter
      const matchesSemester = semesterFilter === 'all' || anomaly.semester === semesterFilter
      
      // Date range filter
      let matchesDateRange = true
      if (dateRangeFilter !== 'all' && anomaly.submittedAt) {
        const anomalyDate = new Date(anomaly.submittedAt)
        const now = new Date()
        
        if (dateRangeFilter === 'today') {
          matchesDateRange = anomalyDate.toDateString() === now.toDateString()
        } else if (dateRangeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDateRange = anomalyDate >= weekAgo
        } else if (dateRangeFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDateRange = anomalyDate >= monthAgo
        } else if (dateRangeFilter === 'semester') {
          const semesterStart = new Date(now.getFullYear(), now.getMonth() >= 6 ? 6 : 0, 1)
          matchesDateRange = anomalyDate >= semesterStart
        }
      }
      
      return matchesSearch && matchesSeverity && matchesProgram && matchesYearLevel && matchesCourse && matchesSemester && matchesDateRange
    })
  }, [anomalies, searchTerm, severityFilter, programFilter, yearLevelFilter, courseFilter, semesterFilter, dateRangeFilter])

  // Calculate anomaly statistics
  const anomalyStats = useMemo(() => {
    const total = anomalies.length
    const high = anomalies.filter(a => a.severity === 'High').length
    const medium = anomalies.filter(a => a.severity === 'Medium').length
    const low = anomalies.filter(a => a.severity === 'Low').length

    return { total, high, medium, low }
  }, [anomalies])

  // Severity chart data
  const severityChartData = useMemo(() => {
    return [
      { name: 'High', value: anomalyStats.high, color: '#ef4444' },
      { name: 'Medium', value: anomalyStats.medium, color: '#f59e0b' },
      { name: 'Low', value: anomalyStats.low, color: '#10b981' }
    ]
  }, [anomalyStats])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!currentUser) return null

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen lpu-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mb-4"></div>
          <p className="text-gray-600">Loading anomalies...</p>
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
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Anomalies</h2>
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
                <h1 className="text-2xl font-bold text-white">Anomaly Detection System</h1>
                <p className="text-[#ffd700] text-sm">
                  Advanced DBSCAN-based anomaly detection in course evaluations
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-white/80 text-sm">
                      {isAdmin(currentUser) ? 'System-wide Analysis' : `${currentUser.department} Department`}
                    </p>
                    <p className="font-bold text-[#ffd700] text-lg">{anomalyStats.total} Anomalies Detected</p>
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

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        
        {/* Show warning if no active period and no selection */}
        {!activePeriod && !selectedPeriod ? (
          <div className="lpu-card text-center py-16 mb-10">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Evaluation Period</h3>
            <p className="text-gray-500 mb-4">There is currently no active evaluation period.</p>
            {evaluationPeriods.length > 0 ? (
              <p className="text-gray-500">Select a past evaluation period from the filters below to view historical anomaly data.</p>
            ) : (
              <p className="text-gray-500">Please contact the administrator to create and activate an evaluation period.</p>
            )}
          </div>
        ) : (
          <>
        {/* Enhanced Anomaly Statistics */}
        <div className="grid md:grid-cols-4 gap-5 lg:gap-6 mb-12">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Anomalies</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{anomalyStats.total}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">High Severity</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{anomalyStats.high}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Medium Severity</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{anomalyStats.medium}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 transition-all duration-250">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Low Severity</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{anomalyStats.low}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Severity Distribution Chart */}
        <div className="lpu-card mb-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-[#7a0000] flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Anomaly Severity Distribution
            </h2>
            <p className="text-gray-600 text-sm mt-1">DBSCAN-based severity classification analysis</p>
          </div>
          
          {severityChartData.some(item => item.value > 0) ? (
            <div className="lpu-chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={severityChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#7a0000', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="value" fill="#7a0000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Anomalies Detected</h3>
              <p>The system has not identified any anomalous evaluation patterns</p>
            </div>
          )}
        </div>

        {/* Enhanced Filter and Search */}
        <div className="lpu-card mb-8 p-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-semibold text-[#7a0000] flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"></path>
              </svg>
              Search & Filter Anomalies
            </h2>
            <p className="text-gray-600 text-sm mt-1">Find specific anomalies by course, student, or content</p>
          </div>
          
          {/* Enhanced Multi-Row Filters */}
          <div className="space-y-4">
            {/* Row 1: Evaluation Period, Search, and Severity */}
            <div className="grid md:grid-cols-3 gap-4">
              <CustomDropdown
                label="📅 Evaluation Period"
                value={selectedPeriod ? selectedPeriod.toString() : ''}
                onChange={(val) => setSelectedPeriod(val)}
                options={[
                  { value: '', label: 'Select Period' },
                  ...evaluationPeriods.map(period => ({
                    value: period.id.toString(),
                    label: `${period.name} ${period.status === 'active' || period.status === 'Active' ? '(Active)' : ''}`
                  }))
                ]}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search Anomalies</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by course, instructor, or comment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent transition-all duration-200"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
              
              <CustomDropdown
                label="⚠️ Severity Level"
                value={severityFilter}
                onChange={(val) => setSeverityFilter(val)}
                options={[
                  { value: 'all', label: 'All Severities' },
                  { value: 'High', label: '🔴 High Severity' },
                  { value: 'Medium', label: '🟡 Medium Severity' },
                  { value: 'Low', label: '🟢 Low Severity' }
                ]}
              />
            </div>

            {/* Row 2: Program, Year Level, Course */}
            <div className="grid md:grid-cols-3 gap-4">
              <CustomDropdown
                label="🎓 Program"
                value={programFilter}
                onChange={(val) => setProgramFilter(val)}
                options={[
                  { value: 'all', label: 'All Programs' },
                  ...programs.map(program => ({
                    value: program.id.toString(),
                    label: program.name || program.program_name
                  }))
                ]}
                searchable={true}
              />
              
              <CustomDropdown
                label="📚 Year Level"
                value={yearLevelFilter}
                onChange={(val) => setYearLevelFilter(val)}
                options={[
                  { value: 'all', label: 'All Years' },
                  ...yearLevels.map(yl => ({
                    value: yl.year_level.toString(),
                    label: `Year ${yl.year_level}`
                  }))
                ]}
              />
              
              <CustomDropdown
                label="📖 Course"
                value={courseFilter}
                onChange={(val) => setCourseFilter(val)}
                options={[
                  { value: 'all', label: 'All Courses' },
                  ...courses.map(course => ({
                    value: course.id.toString(),
                    label: `${course.code} - ${course.name}`
                  }))
                ]}
                searchable={true}
              />
            </div>

            {/* Row 3: Semester and Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <CustomDropdown
                label="📅 Semester"
                value={semesterFilter}
                onChange={(val) => setSemesterFilter(val)}
                options={[
                  { value: 'all', label: 'All Semesters' },
                  { value: '1st Semester', label: '1st Semester' },
                  { value: '2nd Semester', label: '2nd Semester' },
                  { value: 'Summer', label: 'Summer' }
                ]}
              />
              
              <CustomDropdown
                label="🕒 Date Range"
                value={dateRangeFilter}
                onChange={(val) => setDateRangeFilter(val)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' },
                  { value: 'semester', label: 'Current Semester' }
                ]}
              />
            </div>

            {/* Filter Summary and Clear */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {(searchTerm || severityFilter !== 'all' || programFilter !== 'all' || yearLevelFilter !== 'all' || courseFilter !== 'all' || semesterFilter !== 'all' || dateRangeFilter !== 'all') && (
                  <span className="font-medium">
                    🔍 {[
                      searchTerm && 'Search',
                      severityFilter !== 'all' && 'Severity',
                      programFilter !== 'all' && 'Program',
                      yearLevelFilter !== 'all' && 'Year',
                      courseFilter !== 'all' && 'Course',
                      semesterFilter !== 'all' && 'Semester',
                      dateRangeFilter !== 'all' && 'Date'
                    ].filter(Boolean).join(', ')} active
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSeverityFilter('all')
                  setProgramFilter('all')
                  setYearLevelFilter('all')
                  setCourseFilter('all')
                  setSemesterFilter('all')
                  setDateRangeFilter('all')
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all text-sm font-medium"
              >
                🔄 Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Anomaly List */}
        <div className="lpu-card">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#7a0000]/5 to-[#ffd700]/5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#7a0000] flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  Detected Anomalies
                </h2>
                <p className="text-gray-600 mt-1 font-medium">
                  Showing {filteredAnomalies.length} of {anomalyStats.total} anomalous evaluations
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-[#7a0000] text-white text-sm font-medium rounded-full">
                  {filteredAnomalies.length} Results
                </span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-25 transition-all duration-200 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#7a0000] to-[#9a1000] rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#7a0000] transition-colors duration-200">
                        {anomaly.courseName}
                      </h3>
                      <span className={`ml-3 px-3 py-1 text-xs font-bold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity} Severity
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        {anomaly.program}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Student: {anomaly.student}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Detected: {anomaly.detectedAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg text-center border border-gray-300">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-[#7a0000] mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                      </svg>
                      <p className="text-xs font-semibold text-gray-600">Average Rating</p>
                    </div>
                    <p className="text-2xl font-bold text-[#7a0000]">{anomaly.avgRating}/4.0</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-lg text-center border border-blue-300">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                      <p className="text-xs font-semibold text-blue-600">DBSCAN Score</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{anomaly.dbscanScore}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg text-center border border-green-300">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p className="text-xs font-semibold text-green-600">Confidence</p>
                    </div>
                    <p className="text-2xl font-bold text-green-800">{anomaly.confidence}%</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-5 rounded-lg border border-yellow-200">
                    <h4 className="font-bold text-yellow-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Anomaly Details
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-700">
                        <span className="font-semibold">Type:</span> {anomaly.anomalyType}
                      </p>
                      <p className="text-sm text-yellow-700">
                        <span className="font-semibold">Description:</span> {anomaly.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      Student Comment
                    </h4>
                    <p className="text-sm text-gray-700 italic leading-relaxed bg-white p-3 rounded border">
                      "{anomaly.comment}"
                    </p>
                  </div>
                </div>

                {anomaly.ratings && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                      Rating Breakdown
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(anomaly.ratings).map(([criterion, rating]) => (
                        <div key={criterion} className="bg-white p-3 rounded-lg border shadow-sm">
                          <div className="text-xs text-gray-600 font-medium mb-1">{criterion}</div>
                          <div className="text-lg font-bold text-blue-800">{parseFloat(rating).toFixed(2)}/4.0</div>
                          <div className="flex mt-1">
                            {[...Array(4)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-[#ffd700]' : 'text-gray-300'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredAnomalies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || severityFilter !== 'all' 
                ? 'No anomalies match your current filters'
                : 'No anomalies detected'
              }
            </div>
          )}
        </div>

        {/* DBSCAN Algorithm Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">About DBSCAN Anomaly Detection</h3>
          <p className="text-blue-700 text-sm mb-3">
            Our system uses Density-Based Spatial Clustering of Applications with Noise (DBSCAN) to identify 
            anomalous patterns in course evaluations. This algorithm excels at finding outliers in multi-dimensional 
            rating data by analyzing the density of similar evaluations.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800">High Severity</h4>
              <p className="text-blue-600">Isolated outliers with significant rating deviations</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Medium Severity</h4>
              <p className="text-blue-600">Border points with moderate anomaly patterns</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Low Severity</h4>
              <p className="text-blue-600">Minor deviations requiring attention</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
