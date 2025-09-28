import React, { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { mockCourses, mockEvaluations } from '../../data/mock'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function Dashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

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

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCourses = accessibleCourses.length
    const totalEvaluations = accessibleEvaluations.length
    const positiveCount = accessibleEvaluations.filter(e => e.sentiment === 'positive').length
    const neutralCount = accessibleEvaluations.filter(e => e.sentiment === 'neutral').length
    const negativeCount = accessibleEvaluations.filter(e => e.sentiment === 'negative').length
    const anomalies = accessibleEvaluations.filter(e => e.anomaly).length
    
    const avgRating = totalEvaluations > 0 
      ? (accessibleEvaluations.reduce((acc, e) => {
          const ratings = Object.values(e.ratings || {})
          const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0
          return acc + avgRating
        }, 0) / totalEvaluations).toFixed(1)
      : '0.0'

    return {
      totalCourses,
      totalEvaluations,
      avgRating,
      sentimentData: [
        { name: 'Positive', value: positiveCount, color: '#10b981' },
        { name: 'Neutral', value: neutralCount, color: '#f59e0b' },
        { name: 'Negative', value: negativeCount, color: '#ef4444' }
      ],
      anomalies
    }
  }, [accessibleCourses, accessibleEvaluations])

  // Department-wise sentiment data for admins
  const departmentSentiment = useMemo(() => {
    if (!isAdmin(currentUser)) return []
    
    const deptData = {}
    accessibleCourses.forEach(course => {
      const program = course.program
      if (!deptData[program]) {
        deptData[program] = { positive: 0, neutral: 0, negative: 0 }
      }
      
      const courseEvals = accessibleEvaluations.filter(e => e.courseId === course.id)
      courseEvals.forEach(evaluation => {
        if (evaluation.sentiment === 'positive') deptData[program].positive++
        else if (evaluation.sentiment === 'neutral') deptData[program].neutral++
        else if (evaluation.sentiment === 'negative') deptData[program].negative++
      })
    })

    return Object.keys(deptData).map(program => ({
      name: program,
      positive: deptData[program].positive,
      neutral: deptData[program].neutral,
      negative: deptData[program].negative
    }))
  }, [currentUser, accessibleCourses, accessibleEvaluations])

  // Course-wise sentiment data for department heads
  const courseSentiment = useMemo(() => {
    if (!isDepartmentHead(currentUser)) return []
    
    return accessibleCourses.slice(0, 10).map(course => {
      const courseEvals = accessibleEvaluations.filter(e => e.courseId === course.id)
      const positive = courseEvals.filter(e => e.sentiment === 'positive').length
      const neutral = courseEvals.filter(e => e.sentiment === 'neutral').length
      const negative = courseEvals.filter(e => e.sentiment === 'negative').length
      
      return {
        name: course.name.length > 20 ? course.name.substring(0, 20) + '...' : course.name,
        positive,
        neutral,
        negative
      }
    })
  }, [currentUser, accessibleCourses, accessibleEvaluations])

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">
                {isAdmin(currentUser) ? 'System-wide Overview' : `${currentUser.department} Department`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold">{currentUser.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-[#7a0000]">{stats.totalCourses}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Evaluations</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalEvaluations}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-green-600">{stats.avgRating}/5.0</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Anomalies Detected</h3>
            <p className="text-3xl font-bold text-red-600">{stats.anomalies}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment Analysis Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Sentiment Analysis Overview</h3>
            {stats.sentimentData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.sentimentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No evaluation data available
              </div>
            )}
          </div>

          {/* Department/Course Sentiment Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">
              {isAdmin(currentUser) ? 'Sentiment by Department' : 'Sentiment by Course'}
            </h3>
            
            {(isAdmin(currentUser) ? departmentSentiment : courseSentiment).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={isAdmin(currentUser) ? departmentSentiment : courseSentiment}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="positive" fill="#10b981" name="Positive" />
                  <Bar dataKey="neutral" fill="#f59e0b" name="Neutral" />
                  <Bar dataKey="negative" fill="#ef4444" name="Negative" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No evaluation data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Recent Feedback</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentiment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anomaly
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accessibleEvaluations.slice(0, 10).map((evaluation, index) => {
                  const course = accessibleCourses.find(c => c.id === evaluation.courseId)
                  return (
                    <tr key={evaluation.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {course?.name || 'Unknown Course'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {evaluation.student}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          evaluation.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          evaluation.sentiment === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {evaluation.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {evaluation.comment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evaluation.anomaly ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Anomaly
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
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
              <div className="text-center py-8 text-gray-500">
                No recent feedback available
              </div>
            )}
          </div>
        </div>

        {/* Manage Evaluation Questions Button (Department Heads only) */}
        {isDepartmentHead(currentUser) && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/evaluation-questions')}
              className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              Manage Evaluation Questions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
