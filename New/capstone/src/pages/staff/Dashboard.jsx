import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { isAdmin, isStaffMember } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, deptHeadAPI, secretaryAPI } from '../../services/api'
import CategoryMetricsDisplay, { CategoryComparisonWidget } from '../../components/CategoryMetricsDisplay'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'
import CompletionTracker from '../../components/staff/CompletionTracker'
import CourseCompletionTable from '../../components/staff/CourseCompletionTable'
import ContactAdminModal from '../../components/staff/ContactAdminModal'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function Dashboard() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // Data states
  const [dashboardData, setDashboardData] = useState(null)

  // Filter states
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [selectedCourses, setSelectedCourses] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Evaluation Period states
  const [evaluationPeriods, setEvaluationPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [activePeriod, setActivePeriod] = useState(null)

  // Modal states
  const [showContactAdminModal, setShowContactAdminModal] = useState(false)

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
        }
        
        if (programsResponse?.data) {
          setProgramOptions(transformPrograms(programsResponse.data))
        }
        if (yearLevelsResponse?.data) {
          setYearLevelOptions(yearLevelsResponse.data)
        }
        if (periodsResponse?.data) {
          setEvaluationPeriods(periodsResponse.data)
          const active = periodsResponse.data.find(p => p.status === 'active' || p.status === 'Active')
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
  }, [currentUser?.role])

  // Redirect students to evaluation page, admins to admin dashboard
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    // Redirect Admins to their dedicated dashboard
    if (isAdmin(currentUser)) {
      navigate('/admin/dashboard')
      return
    }
    
    if (currentUser.role === 'student') {
      navigate('/student-evaluation')
      return
    }
    
    // Only staff members (secretary/dept head) can access this dashboard
    if (!isStaffMember(currentUser)) {
      navigate('/')
      return
    }
  }, [currentUser?.role, currentUser?.id, navigate])

  // Use timeout hook for API call
  const { data: apiData, loading, error, retry } = useApiWithTimeout(
    async () => {
      if (!currentUser) return null
      
      // Don't fetch if no period is selected and no active period exists
      if (!selectedPeriod && !activePeriod) return null
      
      const filters = {}
      if (selectedProgram !== 'all') filters.program_id = selectedProgram
      if (selectedYearLevel !== 'all') filters.year_level = selectedYearLevel
      if (selectedSemester !== 'all') filters.semester = selectedSemester
      if (selectedPeriod) filters.period_id = selectedPeriod
      
      let dashboardResponse, evaluationsResponse
      if (currentUser.role === 'secretary') {
        [dashboardResponse, evaluationsResponse] = await Promise.all([
          secretaryAPI.getDashboard(filters),
          secretaryAPI.getEvaluations({ ...filters, page: 1, page_size: 50 }) // Limit for performance
        ])
      } else if (currentUser.role === 'department_head') {
        [dashboardResponse, evaluationsResponse] = await Promise.all([
          deptHeadAPI.getDashboard(filters),
          deptHeadAPI.getEvaluations({ ...filters, page: 1, page_size: 50 }) // Limit for performance
        ])
      } else {
        throw new Error(`Unsupported staff role: ${currentUser.role}`)
      }
      
      return {
        dashboard: dashboardResponse?.data || dashboardResponse,
        evaluations: Array.isArray(evaluationsResponse) ? evaluationsResponse : (evaluationsResponse?.data || [])
      }
    },
    [currentUser?.id, currentUser?.role, selectedProgram, selectedYearLevel, selectedSemester, selectedPeriod]
  )

  // Update dashboardData when apiData changes
  useEffect(() => {
    if (apiData) {
      setDashboardData(apiData.dashboard)
    }
  }, [apiData])

  // Calculate statistics from dashboard API data (not from course/evaluation lists)
  const stats = useMemo(() => {
    if (!dashboardData) {
      return {
        totalCourses: 0,
        totalEvaluations: 0,
        totalEnrolledStudents: 0,
        participationRate: 0,
        sentimentData: [
          { name: 'Positive', value: 0, color: '#10b981' },
          { name: 'Neutral', value: 0, color: '#f59e0b' },
          { name: 'Negative', value: 0, color: '#ef4444' }
        ],
        anomalies: 0
      }
    }

    const sentiment = dashboardData.sentiment || {}
    
    return {
      totalCourses: dashboardData.total_courses || dashboardData.total_sections || 0,
      totalEvaluations: dashboardData.total_evaluations || 0,
      totalEnrolledStudents: dashboardData.total_enrolled_students || 0,
      participationRate: dashboardData.participation_rate || 0,
      sentimentData: [
        { name: 'Positive', value: sentiment.positive || 0, color: '#10b981' },
        { name: 'Neutral', value: sentiment.neutral || 0, color: '#f59e0b' },
        { name: 'Negative', value: sentiment.negative || 0, color: '#ef4444' }
      ],
      anomalies: dashboardData.anomalies || 0
    }
  }, [dashboardData])

  // Year level sentiment data - calculate from evaluations
  const yearLevelSentiment = useMemo(() => {
    console.log('[DASHBOARD] apiData:', apiData)
    console.log('[DASHBOARD] apiData?.evaluations:', apiData?.evaluations)
    
    if (!apiData || !apiData.evaluations || apiData.evaluations.length === 0) {
      console.log('[DASHBOARD] No evaluations data - apiData structure:', JSON.stringify(apiData, null, 2))
      return []
    }
    
    const evaluations = apiData.evaluations
    console.log('[DASHBOARD] Evaluations count:', evaluations.length)
    console.log('[DASHBOARD] First evaluation sample:', evaluations[0])
    console.log('[DASHBOARD] First eval fields:', Object.keys(evaluations[0] || {}))
    
    const yearLevels = [1, 2, 3, 4]
    
    const result = yearLevels.map(level => {
      const levelEvals = evaluations.filter(e => e.yearLevel === level || e.year_level === level)
      console.log(`[DASHBOARD] Year ${level}: found ${levelEvals.length} evaluations`)
      if (levelEvals.length > 0) {
        console.log(`[DASHBOARD] Sample eval for Year ${level}:`, levelEvals[0])
        console.log(`[DASHBOARD] Sample eval sentiment value:`, levelEvals[0].sentiment)
        console.log(`[DASHBOARD] All sentiments for Year ${level}:`, levelEvals.map(e => e.sentiment))
      }
      const positive = levelEvals.filter(e => e.sentiment === 'positive').length
      const neutral = levelEvals.filter(e => e.sentiment === 'neutral').length
      const negative = levelEvals.filter(e => e.sentiment === 'negative').length
      
      console.log(`[DASHBOARD] Year ${level} sentiments - P:${positive} N:${neutral} Neg:${negative}`)
      
      return {
        name: `Year ${level}`,
        positive,
        neutral,
        negative,
        total: positive + neutral + negative
      }
    }).filter(level => level.total > 0)
    
    console.log('[DASHBOARD] Year level sentiment result:', JSON.stringify(result, null, 2))
    console.log('[DASHBOARD] Result array length:', result.length)
    return result
  }, [apiData])

  if (!currentUser) return null

  // Loading and error states
  if (loading) return <LoadingSpinner message="Loading dashboard..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      {/* Enhanced LPU Header with Better Spacing */}
      <header className="lpu-header">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-5">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl lg:text-4xl">Course Insight Guardian</h1>
                <p className="lpu-header-subtitle text-base lg:text-lg mt-1">
                  {isAdmin(currentUser) ? 'Academic Excellence Dashboard' : `${currentUser.department} Analytics Hub`}
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 lg:px-8 py-4 lg:py-5 text-left lg:text-right w-full lg:w-auto">
              <p className="text-[#ffd700] text-sm font-medium">Welcome back,</p>
              <p className="text-white font-bold text-lg lg:text-xl mt-1">{currentUser.name}</p>
              <div className="flex items-center justify-start lg:justify-end space-x-2 mt-2">
                <div className="w-2 h-2 bg-[#ffd700] rounded-full animate-pulse"></div>
                <span className="text-white text-xs font-medium">Online</span>
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
              <p className="text-gray-500">Select a past evaluation period from the filters below to view historical data.</p>
            ) : (
              <p className="text-gray-500">Please contact the administrator to create and activate an evaluation period.</p>
            )}
          </div>
        ) : (
          <>
        {/* Enhanced Statistics Cards with Improved Spacing */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-12">
          {/* Total Courses Card - Navigates to Courses page */}
          <div
            className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 hover:shadow-card-hover transition-all duration-250 cursor-pointer group"
            onClick={() => navigate('/courses')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Total Courses</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{stats.totalCourses}</p>
              </div>
              <div className="w-16 h-16 lg:w-18 lg:h-18 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-250 flex-shrink-0">
                <svg className="w-8 h-8 lg:w-9 lg:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Participation Rate Card - Navigates to Evaluations page */}
          <div
            className="bg-gradient-to-br from-[#C41E3A] to-[#9D1535] rounded-card shadow-card p-7 lg:p-8 transform hover:scale-105 hover:shadow-card-hover transition-all duration-250 cursor-pointer group"
            onClick={() => navigate('/evaluations')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Participation Rate</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white mb-3">{stats.participationRate}%</p>
                <div className="w-full bg-white/30 rounded-full h-2.5">
                  <div
                    className="bg-white rounded-full h-2.5 transition-all duration-500"
                    style={{ width: `${stats.participationRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-16 h-16 lg:w-18 lg:h-18 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-250 flex-shrink-0">
                <svg className="w-8 h-8 lg:w-9 lg:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Filters Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lpu-btn-secondary inline-flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {showFilters && (
            <div className="lpu-card p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
                Filter Dashboard Data
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Program Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📚 Academic Program
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="lpu-select"
                  >
                    <option value="all">All Programs</option>
                    {programOptions.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.program_code || program.code} - {program.program_name || program.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evaluation Period Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Evaluation Period
                  </label>
                  <select
                    value={selectedPeriod || ''}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="lpu-select"
                  >
                    <option value="">Select Period</option>
                    {evaluationPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name} {period.status === 'active' || period.status === 'Active' ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Level Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🎓 Year Level
                  </label>
                  <select
                    value={selectedYearLevel}
                    onChange={(e) => setSelectedYearLevel(e.target.value)}
                    className="lpu-select"
                  >
                    <option value="all">All Year Levels</option>
                    {yearLevelOptions.map((yl) => (
                      <option key={yl.value} value={yl.value}>
                        {yl.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="lpu-select"
                  >
                    <option value="all">All Semesters</option>
                    <option value="1">First Semester</option>
                    <option value="2">Second Semester</option>
                    <option value="3">Summer</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedProgram('all')
                    setSelectedYearLevel('all')
                    setSelectedSemester('all')
                  }}
                  className="lpu-btn-secondary"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lpu-btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment Analysis Chart */}
          <div className="lpu-chart-container">
            <div className="chart-title">
              <svg className="w-6 h-6 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Student Sentiment Distribution
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.sentimentData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.sentimentData.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Evaluations']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Year Level Performance */}
          <div className="lpu-chart-container">
            <div className="chart-title">
              <svg className="w-6 h-6 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              Academic Year Performance
            </div>
            <p className="text-gray-600 text-sm mb-6">Participation rates across different year levels</p>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearLevelSentiment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                <Bar dataKey="positive" fill="#10b981" name="Positive" radius={[4, 4, 0, 0]} />
                <Bar dataKey="neutral" fill="#f59e0b" name="Neutral" radius={[4, 4, 0, 0]} minPointSize={2} />
                <Bar dataKey="negative" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} minPointSize={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Completion Table (includes completion tracking) */}
        <div className="mb-8">
          <CourseCompletionTable selectedPeriod={selectedPeriod} />
        </div>

        {/* Quick Actions */}
        <div className="lpu-card p-6 mb-8">
          <div className="chart-title mb-6">Quick Academic Actions</div>
          <div className="grid md:grid-cols-5 gap-4">
            <button 
              onClick={() => navigate('/courses')}
              className="lpu-btn-primary text-center py-4"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              Manage Courses
            </button>
            
            <button 
              onClick={() => navigate('/sentiment')}
              className="lpu-btn-secondary text-center py-4"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              View Analytics
            </button>

            <button 
              onClick={() => navigate('/evaluations')}
              className="lpu-btn-secondary text-center py-4"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              Review Evaluations
            </button>

            <button 
              onClick={() => navigate('/anomalies')}
              className="lpu-btn-secondary text-center py-4"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              Check Issues
            </button>

            <button 
              onClick={() => setShowContactAdminModal(true)}
              className="lpu-btn-secondary text-center py-4 border-2 border-red-600 hover:bg-red-50"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Contact Admin
            </button>
          </div>
        </div>

        {/* Recent Feedback Table */}
        <div className="lpu-card">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Recent Student Feedback</h3>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              No recent responses (API limitation)
            </span>
          </div>
          
          {/* Note: Recent evaluations table hidden - API doesn't provide this data */}
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Recent Feedback</h4>
            <p className="text-gray-500">View detailed evaluations in the Evaluations page.</p>
            <button 
              onClick={() => navigate('/evaluations')}
              className="mt-4 px-6 py-2 bg-[#7a0000] text-white rounded-lg hover:bg-[#5a0000] transition-colors"
            >
              View All Evaluations
            </button>
          </div>
        </div>
        </>
        )}

      </div>

      {/* Contact Admin Modal */}
      <ContactAdminModal 
        isOpen={showContactAdminModal}
        onClose={() => setShowContactAdminModal(false)}
      />
    </div>
  )
}
