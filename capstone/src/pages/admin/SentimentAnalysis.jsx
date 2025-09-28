import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { mockCourses, mockEvaluations } from '../../data/mock'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function SentimentAnalysis() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [selectedSemester, setSelectedSemester] = useState('1st 2024')

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

  // Semester options
  const semesterOptions = [
    '1st 2024', '2nd 2024', '1st 2025', '2nd 2025'
  ]

  // Filter data based on user access and semester
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(mockCourses, currentUser)
  }, [currentUser])

  const accessibleEvaluations = useMemo(() => {
    const filtered = filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
    // Filter by semester if needed (mockEvaluations don't have semester field, so we'll show all for now)
    return filtered
  }, [currentUser, selectedSemester])

  // Calculate sentiment overview
  const sentimentOverview = useMemo(() => {
    const total = accessibleEvaluations.length
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 }

    const positive = accessibleEvaluations.filter(e => e.sentiment === 'positive').length
    const neutral = accessibleEvaluations.filter(e => e.sentiment === 'neutral').length
    const negative = accessibleEvaluations.filter(e => e.sentiment === 'negative').length

    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100)
    }
  }, [accessibleEvaluations])

  // Department-wise sentiment for admins
  const departmentSentiment = useMemo(() => {
    if (!isAdmin(currentUser)) return []
    
    const deptData = {}
    accessibleCourses.forEach(course => {
      const program = course.program
      if (!deptData[program]) {
        deptData[program] = { name: program, positive: 0, neutral: 0, negative: 0 }
      }
      
      const courseEvals = accessibleEvaluations.filter(e => e.courseId === course.id)
      courseEvals.forEach(evaluation => {
        if (evaluation.sentiment === 'positive') deptData[program].positive++
        else if (evaluation.sentiment === 'neutral') deptData[program].neutral++
        else if (evaluation.sentiment === 'negative') deptData[program].negative++
      })
    })

    return Object.values(deptData)
  }, [currentUser, accessibleCourses, accessibleEvaluations])

  // Course-wise sentiment for department heads
  const courseSentiment = useMemo(() => {
    if (!isDepartmentHead(currentUser)) return []
    
    return accessibleCourses.map(course => {
      const courseEvals = accessibleEvaluations.filter(e => e.courseId === course.id)
      const positive = courseEvals.filter(e => e.sentiment === 'positive').length
      const neutral = courseEvals.filter(e => e.sentiment === 'neutral').length
      const negative = courseEvals.filter(e => e.sentiment === 'negative').length
      
      return {
        name: course.name.length > 25 ? course.name.substring(0, 25) + '...' : course.name,
        positive,
        neutral,
        negative
      }
    }).filter(course => course.positive + course.neutral + course.negative > 0)
  }, [currentUser, accessibleCourses, accessibleEvaluations])

  // Evaluation criteria breakdown
  const criteriaBreakdown = useMemo(() => {
    if (accessibleEvaluations.length === 0) return []

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
  }, [accessibleEvaluations])

  if (!currentUser) return null

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
            
            {/* Semester Filter */}
            <div className="flex items-center space-x-4">
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

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment by Department/Course Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              {isAdmin(currentUser) ? 'Sentiment by Department' : 'Sentiment by Course'}
            </h2>
            
            {(isAdmin(currentUser) ? departmentSentiment : courseSentiment).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={isAdmin(currentUser) ? departmentSentiment : courseSentiment}>
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="positive" fill="#10b981" name="Positive" />
                  <Bar dataKey="neutral" fill="#f59e0b" name="Neutral" />
                  <Bar dataKey="negative" fill="#ef4444" name="Negative" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No sentiment data available for the selected semester
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
