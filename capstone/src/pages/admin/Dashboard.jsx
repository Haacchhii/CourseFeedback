import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { mockCourses, mockEvaluations } from '../../data/mock'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function Dashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  // Filter states
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')

  // Redirect students to evaluation page
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (currentUser.role === 'student') {
      navigate('/student-evaluation')
      return
    }
    
    if (!isAdmin(currentUser) && !isDepartmentHead(currentUser)) {
      navigate('/')
      return
    }
  }, [currentUser, navigate])

  // Filter data based on user access
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(mockCourses, currentUser)
  }, [currentUser])

  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])

  // Get filter options
  const filterOptions = useMemo(() => {
    const programs = [...new Set(accessibleCourses.map(course => course.program))].sort()
    const yearLevels = [...new Set(accessibleCourses.map(course => course.yearLevel))].sort()
    
    return { programs, yearLevels }
  }, [accessibleCourses])

  // Filter courses based on selected filters
  const filteredCourses = useMemo(() => {
    return accessibleCourses.filter(course => {
      const matchesProgram = selectedProgram === 'all' || course.program === selectedProgram
      const matchesYearLevel = selectedYearLevel === 'all' || course.yearLevel.toString() === selectedYearLevel
      return matchesProgram && matchesYearLevel
    })
  }, [accessibleCourses, selectedProgram, selectedYearLevel])

  // Filter evaluations based on filtered courses
  const filteredEvaluations = useMemo(() => {
    return accessibleEvaluations.filter(evaluation => 
      filteredCourses.some(course => course.id === evaluation.courseId)
    )
  }, [accessibleEvaluations, filteredCourses])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCourses = filteredCourses.length
    const totalEvaluations = filteredEvaluations.length
    
    // Calculate total enrolled students and participation
    const totalEnrolledStudents = filteredCourses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0)
    const participationRate = totalEnrolledStudents > 0 ? Math.round((totalEvaluations / totalEnrolledStudents) * 100) : 0
    
    const positiveCount = filteredEvaluations.filter(e => e.sentiment === 'positive').length
    const neutralCount = filteredEvaluations.filter(e => e.sentiment === 'neutral').length
    const negativeCount = filteredEvaluations.filter(e => e.sentiment === 'negative').length
    const anomalies = filteredEvaluations.filter(e => e.anomaly).length
    
    const avgRating = totalEvaluations > 0 
      ? (filteredEvaluations.reduce((acc, e) => {
          const ratings = Object.values(e.ratings || {})
          const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0
          return acc + avgRating
        }, 0) / totalEvaluations).toFixed(1)
      : '0.0'

    return {
      totalCourses,
      totalEvaluations,
      totalEnrolledStudents,
      participationRate,
      avgRating,
      sentimentData: [
        { name: 'Positive', value: positiveCount, color: '#10b981' },
        { name: 'Neutral', value: neutralCount, color: '#f59e0b' },
        { name: 'Negative', value: negativeCount, color: '#ef4444' }
      ],
      anomalies
    }
  }, [filteredCourses, filteredEvaluations])

  // Year level-wise sentiment data for stacked bar chart
  const yearLevelSentiment = useMemo(() => {
    const yearData = {}
    filteredCourses.forEach(course => {
      const yearLevel = `Year ${course.yearLevel}`
      if (!yearData[yearLevel]) {
        yearData[yearLevel] = { positive: 0, neutral: 0, negative: 0 }
      }
      
      const courseEvals = filteredEvaluations.filter(e => e.courseId === course.id)
      courseEvals.forEach(evaluation => {
        if (evaluation.sentiment === 'positive') yearData[yearLevel].positive++
        else if (evaluation.sentiment === 'neutral') yearData[yearLevel].neutral++
        else if (evaluation.sentiment === 'negative') yearData[yearLevel].negative++
      })
    })

    return Object.keys(yearData).sort().map(yearLevel => ({
      name: yearLevel,
      positive: yearData[yearLevel].positive,
      neutral: yearData[yearLevel].neutral,
      negative: yearData[yearLevel].negative
    }))
  }, [filteredCourses, filteredEvaluations])

  if (!currentUser) return null

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
                <h1 className="lpu-header-title text-3xl">Course Insight Guardian</h1>
                <p className="lpu-header-subtitle text-lg">
                  {isAdmin(currentUser) ? 'Academic Excellence Dashboard' : `${currentUser.department} Analytics Hub`}
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 text-right">
              <p className="text-[#ffd700] text-sm font-medium">Welcome back,</p>
              <p className="text-white font-bold text-lg">{currentUser.name}</p>
              <div className="flex items-center justify-end space-x-2 mt-1">
                <div className="w-2 h-2 bg-[#ffd700] rounded-full"></div>
                <span className="text-white text-xs">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Statistics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="stats-card lpu-card-crimson group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Total Courses</h3>
                <p className="stats-number">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#7a0000] to-[#a31111] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="stats-card lpu-card-gold group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Survey Participation</h3>
                <p className="text-2xl font-bold text-[#7a0000]">{stats.totalEvaluations}/{stats.totalEnrolledStudents}</p>
                <p className="text-sm text-gray-500 font-medium">students participating</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#ffd700] to-[#ffed4a] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="stats-card group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Participation Rate</h3>
                <p className="stats-number text-purple-600">{stats.participationRate}%</p>
                <div className="participation-progress mt-2">
                  <div 
                    className="participation-fill"
                    style={{ width: `${stats.participationRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="stats-card group excellence-indicator high-performance">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Average Rating</h3>
                <p className="stats-number text-green-600">{stats.avgRating}/5.0</p>
                <div className="flex items-center mt-1">
                  {[1,2,3,4,5].map(star => (
                    <svg key={star} className={`w-4 h-4 ${star <= Math.round(stats.avgRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="stats-card group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Issues Detected</h3>
                <p className="stats-number text-red-600">{stats.anomalies}</p>
                <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Sentiment Analysis Filters</h3>
        
          <div className="grid md:grid-cols-3 gap-6">
            {/* Program Filter - Only for Admins (Secretaries) */}
            {isAdmin(currentUser) && (
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-3">Academic Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="lpu-select"
                >
                  <option value="all">All Programs</option>
                  {filterOptions.programs.map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Level Filter */}
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-3">Year Level</label>
              <select
                value={selectedYearLevel}
                onChange={(e) => setSelectedYearLevel(e.target.value)}
                className="lpu-select"
              >
                <option value="all">All Year Levels</option>
                {filterOptions.yearLevels.map(yearLevel => (
                  <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>
                ))}
              </select>
            </div>

            {/* Course Focus Filter */}
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-3">Course Focus</label>
              <select 
                className="lpu-select"
                value={selectedCourses} 
                onChange={e => setSelectedCourses(e.target.value)}
              >
                <option value="all">All Courses</option>
                {filteredCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
          </div>
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
                  data={stats.sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.sentimentData.map((entry, index) => (
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
                <Bar dataKey="positive" stackId="a" fill="#059669" name="Positive" />
                <Bar dataKey="neutral" stackId="a" fill="#0891b2" name="Neutral" />
                <Bar dataKey="negative" stackId="a" fill="#dc2626" name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lpu-card p-6">
          <div className="chart-title mb-6">Quick Academic Actions</div>
          <div className="grid md:grid-cols-4 gap-4">
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
              Latest {accessibleEvaluations.slice(0, 10).length} responses
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Sentiment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accessibleEvaluations.slice(0, 10).map((evaluation, index) => {
                  const course = accessibleCourses.find(c => c.id === evaluation.courseId)
                  return (
                    <tr key={evaluation.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{course?.name || 'Unknown Course'}</div>
                        <div className="text-sm text-gray-500">{course?.code || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {evaluation.student}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          evaluation.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          evaluation.sentiment === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {evaluation.sentiment === 'positive' && '😊'}
                          {evaluation.sentiment === 'neutral' && '😐'}
                          {evaluation.sentiment === 'negative' && '😔'}
                          <span className="ml-1 capitalize">{evaluation.sentiment}</span>
                        </span>
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
                  )
                })}
              </tbody>
            </table>
            
            {accessibleEvaluations.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Feedback</h4>
                <p className="text-gray-500">Student evaluations will appear here once submitted.</p>
              </div>
            )}
          </div>
        </div>

        {/* Manage Evaluation Questions Button (Department Heads only) */}
        {isDepartmentHead(currentUser) && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/evaluation-questions')}
              className="lpu-btn-primary px-8 py-4 text-lg font-semibold inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Manage Evaluation Questions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
