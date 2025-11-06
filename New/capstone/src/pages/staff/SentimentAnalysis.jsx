import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { adminAPI, deptHeadAPI } from '../../services/api'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function SentimentAnalysis() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [sentimentData, setSentimentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')

  // Redirect unauthorized users
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

  // Fetch sentiment analysis from API
  useEffect(() => {
    const fetchSentiment = async () => {
      if (!currentUser) return
      
      try {
        setLoading(true)
        const filters = {}
        if (selectedSemester !== 'all') filters.semester = selectedSemester
        if (selectedYearLevel !== 'all') filters.yearLevel = selectedYearLevel
        
        let data
        if (isAdmin(currentUser)) {
          data = await adminAPI.getSentimentAnalysis(filters)
        } else if (isDepartmentHead(currentUser)) {
          data = await deptHeadAPI.getSentimentAnalysis(filters)
        }
        
        setSentimentData(data)
      } catch (err) {
        console.error('Error fetching sentiment analysis:', err)
        setError(err.message || 'Failed to load sentiment analysis')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSentiment()
  }, [currentUser, selectedSemester, selectedYearLevel])

  // Get semester options from sentiment data
  const semesterOptions = useMemo(() => {
    if (!sentimentData?.evaluations) return []
    const semesters = [...new Set(sentimentData.evaluations.map(e => e.semester).filter(Boolean))].sort()
    return semesters
  }, [sentimentData])

  // Filter evaluations by semester
  const filteredEvaluationsBySemester = useMemo(() => {
    if (!sentimentData?.evaluations) return []
    if (selectedSemester === 'all') return sentimentData.evaluations
    return accessibleEvaluations.filter(e => e.semester === selectedSemester)
  }, [accessibleEvaluations, selectedSemester])

  // Filter courses and evaluations by year level
  const filteredCourses = useMemo(() => {
    return accessibleCourses.filter(course => {
      const matchesYearLevel = selectedYearLevel === 'all' || course.yearLevel.toString() === selectedYearLevel
      return matchesYearLevel
    })
  }, [accessibleCourses, selectedYearLevel])

  const filteredEvaluations = useMemo(() => {
    return filteredEvaluationsBySemester.filter(evaluation => 
      filteredCourses.some(course => course.id === evaluation.courseId)
    )
  }, [filteredEvaluationsBySemester, filteredCourses])

  // Get year level options
  const yearLevelOptions = useMemo(() => {
    return [...new Set(accessibleCourses.map(course => course.yearLevel))].sort()
  }, [accessibleCourses])

  // Calculate sentiment overview
  const sentimentOverview = useMemo(() => {
    const total = filteredEvaluations.length
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 }

    const positive = filteredEvaluations.filter(e => e.sentiment === 'positive').length
    const neutral = filteredEvaluations.filter(e => e.sentiment === 'neutral').length
    const negative = filteredEvaluations.filter(e => e.sentiment === 'negative').length

    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100)
    }
  }, [filteredEvaluations])

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

  // Evaluation criteria breakdown
  const criteriaBreakdown = useMemo(() => {
    if (filteredEvaluations.length === 0) return []

    const criteria = ['Content Quality', 'Delivery Method', 'Assessment Fairness', 'Support Provided']
    
    return criteria.map(criterion => {
      // Mock average ratings for each criterion (in real app, would calculate from actual ratings)
      const avgRating = (Math.random() * 2 + 3).toFixed(1) // Random 3.0-5.0 rating
      return {
        name: criterion,
        rating: parseFloat(avgRating),
        color: parseFloat(avgRating) >= 4.0 ? '#10b981' : parseFloat(avgRating) >= 3.0 ? '#f59e0b' : '#ef4444'
      }
    })
  }, [filteredEvaluations])

  if (!currentUser) return null

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mb-4"></div>
          <p className="text-gray-600">Loading sentiment analysis...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Sentiment Analysis</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced LPU Header */}
      <header className="bg-gradient-to-r from-[#7a0000] to-[#a31111] shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Sentiment Analysis Dashboard</h1>
                <p className="text-[#ffd700] text-sm">
                  {isAdmin(currentUser) ? 'System-wide Academic Excellence Overview' : `${currentUser.department} Department Analysis`}
                </p>
              </div>
            </div>
            
            {/* Enhanced Filters */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-white">Academic Period:</label>
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="lpu-select bg-white/10 backdrop-blur-sm text-white border-white/20"
                >
                  <option value="all">All Semesters</option>
                  {semesterOptions.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-white">Year Level:</label>
                <select 
                  value={selectedYearLevel}
                  onChange={(e) => setSelectedYearLevel(e.target.value)}
                  className="lpu-select bg-white/10 backdrop-blur-sm text-white border-white/20"
                >
                  <option value="all">All Year Levels</option>
                  {yearLevelOptions.map(yearLevel => (
                    <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Sentiment Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Academic Sentiment Overview</h2>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredEvaluations.length} total responses
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Positive Feedback</span>
                <span className="text-xl font-bold text-green-600">{sentimentOverview.positive}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${sentimentOverview.positive}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Excellent responses</span>
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Neutral Feedback</span>
                <span className="text-xl font-bold text-yellow-600">{sentimentOverview.neutral}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${sentimentOverview.neutral}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Moderate responses</span>
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Negative Feedback</span>
                <span className="text-xl font-bold text-red-600">{sentimentOverview.negative}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${sentimentOverview.negative}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Needs improvement</span>
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Course Analysis Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Course Performance - {selectedSemester}</h2>
            </div>
          </div>
          
          {filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses
                .filter(course => course.semester.includes(selectedSemester.includes('1st') ? 'First Semester' : 'Second Semester'))
                .map((course) => {
                  const totalResponses = filteredEvaluations.filter(e => e.courseId === course.id).length;
                  const responseRate = course.enrolledStudents ? Math.round((totalResponses / course.enrolledStudents) * 100) : 0;
                  
                  return (
                    <div key={course.id} className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-[#7a0000] transition-all duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm">{course.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.program === 'BSIT' ? 'bg-blue-100 text-blue-800' :
                          course.program === 'BSCS-DS' ? 'bg-green-100 text-green-800' :
                          course.program === 'BS-CY' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {course.program}
                        </span>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center text-xs text-gray-600">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                          </svg>
                          {course.instructor}
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                          </svg>
                          Year {course.yearLevel} - {course.classCode}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          {totalResponses}/{course.enrolledStudents || 0} responses
                        </span>
                        <span className={`font-semibold ${
                          responseRate >= 80 ? 'text-green-600' :
                          responseRate >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {responseRate}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            responseRate >= 80 ? 'bg-green-500' :
                            responseRate >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${responseRate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <p>No courses available for the selected semester and filters</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Enhanced Year Level Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Academic Year Level Analysis</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Sentiment distribution across different year levels</p>
            
            {yearLevelSentiment.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={yearLevelSentiment}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name="Neutral" radius={[4, 4, 0, 0]} minPointSize={2} />
                  <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} minPointSize={2} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <p>No sentiment data available for the selected filters</p>
              </div>
            )}
          </div>

          {/* Enhanced Criteria Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Academic Criteria Performance</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Average ratings across evaluation criteria</p>
            
            {criteriaBreakdown.length > 0 ? (
              <div className="space-y-4">
                {criteriaBreakdown.map((criterion, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{criterion.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-[#7a0000]">
                            {criterion.rating}
                          </span>
                          <span className="text-gray-500 text-sm">/ 5.0</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= criterion.rating ? 'text-[#ffd700]' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            criterion.rating >= 4 ? 'bg-green-500' :
                            criterion.rating >= 3 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(criterion.rating / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <p>No evaluation criteria data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Interactive Features Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Interactive Analytics Dashboard</h3>
              <p className="text-blue-800 text-sm">
                Hover over chart elements to see detailed information. Click on legend items to hide/show data series.
                Use the academic period and year level filters to view specific segment analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
