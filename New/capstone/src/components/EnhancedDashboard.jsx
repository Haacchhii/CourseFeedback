import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { isAdmin } from '../utils/roleUtils'
import { useAuth } from '../context/AuthContext'
import { courses, evaluations } from '../../data/mock'

export default function EnhancedDashboard() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [selectedCourses, setSelectedCourses] = useState('all')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')

  // Filter data based on user access
  const accessibleCourses = useMemo(() => {
    return isAdmin(currentUser) ? courses : courses.filter(course => course.department === currentUser.department)
  }, [currentUser])

  const accessibleEvaluations = useMemo(() => {
    return isAdmin(currentUser) ? evaluations : evaluations.filter(evaluation => {
      const course = courses.find(c => c.id === evaluation.courseId)
      return course && course.department === currentUser.department
    })
  }, [currentUser])

  // Apply filters
  const filteredCourses = useMemo(() => {
    return accessibleCourses.filter(course => {
      const programMatch = selectedProgram === 'all' || course.program === selectedProgram
      const yearMatch = selectedYearLevel === 'all' || course.yearLevel.toString() === selectedYearLevel
      return programMatch && yearMatch
    })
  }, [accessibleCourses, selectedProgram, selectedYearLevel])

  const filteredEvaluations = useMemo(() => {
    if (selectedCourses === 'all') {
      return accessibleEvaluations.filter(evaluation =>
        filteredCourses.some(course => course.id === evaluation.courseId)
      )
    } else {
      return accessibleEvaluations.filter(evaluation => evaluation.courseId === parseInt(selectedCourses))
    }
  }, [accessibleEvaluations, filteredCourses, selectedCourses])

  // Enhanced Statistics
  const stats = useMemo(() => {
    const totalCourses = filteredCourses.length
    const totalEnrolledStudents = filteredCourses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0)
    const totalEvaluations = filteredEvaluations.length
    const participationRate = totalEnrolledStudents > 0 ? ((totalEvaluations / totalEnrolledStudents) * 100).toFixed(1) : 0
    const avgRating = filteredEvaluations.length > 0 ? (filteredEvaluations.reduce((sum, e) => sum + e.rating, 0) / filteredEvaluations.length).toFixed(1) : 0
    
    // Sentiment distribution
    const sentimentCounts = filteredEvaluations.reduce((acc, evaluation) => {
      acc[evaluation.sentiment] = (acc[evaluation.sentiment] || 0) + 1
      return acc
    }, {})

    // Anomaly detection (mock)
    const anomalies = filteredEvaluations.filter(e => e.rating <= 2 || e.sentiment === 'negative').length

    return {
      totalCourses,
      totalEnrolledStudents,
      totalEvaluations,
      participationRate: parseFloat(participationRate),
      avgRating: parseFloat(avgRating),
      sentimentCounts,
      anomalies
    }
  }, [filteredCourses, filteredEvaluations])

  // Chart data preparations
  const sentimentData = [
    { name: 'Positive', value: stats.sentimentCounts.positive || 0, color: '#059669' },
    { name: 'Neutral', value: stats.sentimentCounts.neutral || 0, color: '#0891b2' },
    { name: 'Negative', value: stats.sentimentCounts.negative || 0, color: '#dc2626' }
  ]

  const yearLevelData = useMemo(() => {
    const yearData = {}
    filteredCourses.forEach(course => {
      const year = `Year ${course.yearLevel}`
      if (!yearData[year]) {
        yearData[year] = { name: year, courses: 0, evaluations: 0, participation: 0 }
      }
      yearData[year].courses++
      
      const courseEvals = filteredEvaluations.filter(e => e.courseId === course.id)
      yearData[year].evaluations += courseEvals.length
      yearData[year].participation = course.enrolledStudents > 0 ? 
        ((courseEvals.length / course.enrolledStudents) * 100).toFixed(1) : 0
    })
    
    return Object.values(yearData)
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
                <p className="stats-number text-green-600">{stats.avgRating}/4.0</p>
                <div className="flex items-center mt-1">
                  {[1,2,3,4].map(star => (
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

        {/* Enhanced Filters */}
        <div className="lpu-chart-container mb-8">
          <div className="chart-title">Academic Analytics Filters</div>
          <div className="lpu-divider"></div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {isAdmin(currentUser) && (
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-3">Academic Program</label>
                <select 
                  className="lpu-select"
                  value={selectedProgram} 
                  onChange={e => setSelectedProgram(e.target.value)}
                >
                  <option value="all">All Programs</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-3">Year Level</label>
              <select 
                className="lpu-select"
                value={selectedYearLevel} 
                onChange={e => setSelectedYearLevel(e.target.value)}
              >
                <option value="all">All Year Levels</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            
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
            <p className="text-gray-600 text-sm mb-6">Overall feedback sentiment across all evaluations</p>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
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
              <BarChart data={yearLevelData}>
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
                <Bar 
                  dataKey="participation" 
                  fill="url(#colorGradient)" 
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7a0000" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ffd700" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Excellence Indicators */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="lpu-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-[#1e293b] mb-2">Academic Quality</h3>
            <p className="text-3xl font-bold text-green-600 mb-2">{stats.participationRate >= 80 ? 'Excellent' : stats.participationRate >= 60 ? 'Good' : 'Needs Improvement'}</p>
            <p className="text-sm text-gray-600">Based on participation and ratings</p>
          </div>

          <div className="lpu-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7a0000] to-[#a31111] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-[#1e293b] mb-2">Engagement Level</h3>
            <p className="text-3xl font-bold text-[#7a0000] mb-2">{stats.participationRate >= 75 ? 'High' : stats.participationRate >= 50 ? 'Medium' : 'Low'}</p>
            <p className="text-sm text-gray-600">Student participation metrics</p>
          </div>

          <div className="lpu-card p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffed4a] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-[#1e293b] mb-2">Innovation Index</h3>
            <p className="text-3xl font-bold text-[#ffd700] mb-2">{stats.anomalies <= 5 ? 'Advanced' : stats.anomalies <= 15 ? 'Progressive' : 'Developing'}</p>
            <p className="text-sm text-gray-600">Teaching methodology assessment</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lpu-card p-6">
          <div className="chart-title mb-6">Quick Academic Actions</div>
          <div className="grid md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/courses')}
              className="lpu-btn-primary text-center"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              Manage Courses
            </button>
            
            <button 
              onClick={() => navigate('/sentiment')}
              className="lpu-btn-secondary text-center"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              View Analytics
            </button>

            <button 
              onClick={() => navigate('/evaluations')}
              className="lpu-btn-secondary text-center"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              Review Evaluations
            </button>

            <button 
              onClick={() => navigate('/anomalies')}
              className="lpu-btn-secondary text-center"
            >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              Check Issues
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}