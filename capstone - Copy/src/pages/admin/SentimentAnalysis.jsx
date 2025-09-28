import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import apiService from '../../services/api'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function SentimentAnalysis() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [selectedSemester, setSelectedSemester] = useState('1st 2024')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  // Fetch evaluations from API
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true)
        const response = await apiService.getAllEvaluations()
        setEvaluations(response.data || [])
      } catch (err) {
        console.error('Failed to fetch evaluations:', err)
        setError('Failed to load sentiment data')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser && (isAdmin(currentUser) || isDepartmentHead(currentUser))) {
      fetchEvaluations()
    }
  }, [currentUser])

  // Semester options
  const semesterOptions = [
    '1st 2024', '2nd 2024', '1st 2025', '2nd 2025'
  ]

  // Use real API data
  const accessibleEvaluations = useMemo(() => {
    return evaluations
  }, [evaluations])

  // Filter courses and evaluations by year level
  const filteredCourses = useMemo(() => {
    return accessibleCourses.filter(course => {
      const matchesYearLevel = selectedYearLevel === 'all' || course.yearLevel.toString() === selectedYearLevel
      return matchesYearLevel
    })
  }, [accessibleCourses, selectedYearLevel])

  const filteredEvaluations = useMemo(() => {
    return accessibleEvaluations.filter(evaluation => 
      filteredCourses.some(course => course.id === evaluation.courseId)
    )
  }, [accessibleEvaluations, filteredCourses])

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

  if (!currentUser || (!isAdmin(currentUser) && !isDepartmentHead(currentUser))) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin or Department Head access required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sentiment analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sentiment Analysis</h1>
              <p className="text-gray-600">
                {isAdmin(currentUser) ? 'System-wide Sentiment Overview' : `${currentUser.department} Department Analysis`}
              </p>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Semester:</label>
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                >
                  {semesterOptions.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Year Level:</label>
                <select 
                  value={selectedYearLevel}
                  onChange={(e) => setSelectedYearLevel(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
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
        {/* Sentiment Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Sentiment Overview</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Positive</span>
              <span className="text-sm font-bold text-green-600">{sentimentOverview.positive}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${sentimentOverview.positive}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Neutral</span>
              <span className="text-sm font-bold text-yellow-600">{sentimentOverview.neutral}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${sentimentOverview.neutral}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Negative</span>
              <span className="text-sm font-bold text-red-600">{sentimentOverview.negative}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-red-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${sentimentOverview.negative}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Course Chart for Selected Semester */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Courses for {selectedSemester}</h2>
          
          {filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses
                .filter(course => course.semester.includes(selectedSemester.includes('1st') ? 'First Semester' : 'Second Semester'))
                .map((course) => {
                  const totalResponses = filteredEvaluations.filter(e => e.courseId === course.id).length;
                  const responseRate = course.enrolledStudents ? Math.round((totalResponses / course.enrolledStudents) * 100) : 0;
                  
                  return (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800 text-sm">{course.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.program === 'BSIT' ? 'bg-blue-100 text-blue-800' :
                          course.program === 'BSCS-DS' ? 'bg-green-100 text-green-800' :
                          course.program === 'BS-CY' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {course.program}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        <p>Instructor: {course.instructor}</p>
                        <p>Year {course.yearLevel} - {course.classCode}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">
                          {totalResponses}/{course.enrolledStudents || 0} responses
                        </span>
                        <span className={`font-medium ${
                          responseRate >= 80 ? 'text-green-600' :
                          responseRate >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {responseRate}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
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
            <div className="flex items-center justify-center h-32 text-gray-500">
              No courses available for the selected semester and filters
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment by Year Level Stacked Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Sentiment Analysis by Year Level</h2>
            
            {yearLevelSentiment.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={yearLevelSentiment}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
                  <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name="Neutral" />
                  <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No sentiment data available for the selected filters
              </div>
            )}
          </div>

          {/* Evaluation Criteria */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Evaluation Criteria</h2>
            
            {criteriaBreakdown.length > 0 ? (
              <div className="space-y-4">
                {criteriaBreakdown.map((criterion, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-800">{criterion.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-2xl font-bold mr-2" style={{ color: criterion.color }}>
                          {criterion.rating}
                        </span>
                        <span className="text-gray-500">/5.0</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= criterion.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No evaluation criteria data available
              </div>
            )}
          </div>
        </div>

        {/* Interactive Features Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Interactive Charts</h3>
          <p className="text-blue-700 text-sm">
            Hover over chart elements to see detailed information. Click on legend items to hide/show data series.
            Use the semester filter to view historical sentiment trends.
          </p>
        </div>
      </div>
    </div>
  )
}
