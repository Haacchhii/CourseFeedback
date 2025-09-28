import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import apiService from '../../services/api'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function Dashboard() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  // Filter states
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  
  // API data states
  const [departmentData, setDepartmentData] = useState(null)
  const [studentsData, setStudentsData] = useState([])
  const [evaluationsData, setEvaluationsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  // Fetch API data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch department overview, students, and evaluations
        const [deptOverview, students, evaluations] = await Promise.all([
          apiService.getDepartmentOverview(),
          apiService.getAllStudents(),
          apiService.getAllEvaluations()
        ])

        setDepartmentData(deptOverview.data)
        setStudentsData(students.data || [])
        setEvaluationsData(evaluations.data || [])
        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data. Using mock data as fallback.')
        // Continue with mock data as fallback
      } finally {
        setLoading(false)
      }
    }

    if (currentUser && (isAdmin(currentUser) || isDepartmentHead(currentUser))) {
      fetchDashboardData()
    }
  }, [currentUser])

  // Use real data from API
  const accessibleCourses = useMemo(() => {
    // Convert API evaluations data to courses format for charts
    return evaluationsData.map(evaluation => ({
      id: evaluation.evaluation_id,
      code: evaluation.course_code,
      name: evaluation.course_name,
      program: evaluation.course_code?.startsWith('CS') ? 'Computer Science' : 'Information Technology',
      yearLevel: evaluation.course_code?.includes('1') ? '1st Year' : '2nd Year'
    })).filter((course, index, self) => 
      index === self.findIndex(c => c.code === course.code)
    )
  }, [evaluationsData])

  const accessibleEvaluations = useMemo(() => {
    return evaluationsData || []
  }, [evaluationsData])

  // Get filter options from real data
  const filterOptions = useMemo(() => {
    const programs = [...new Set(accessibleCourses.map(course => course.program))].filter(Boolean).sort()
    const yearLevels = [...new Set(accessibleCourses.map(course => course.yearLevel))].filter(Boolean).sort()
    
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {/* Department Management Section for Admins */}
        {isAdmin(currentUser) && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Department Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total Instructors</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {/* TODO: Connect to backend */}
                  {Math.floor(stats.totalCourses * 0.7)} {/* Rough estimate */}
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-800 mt-2">
                  View All Instructors →
                </button>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Active Students</h3>
                <p className="text-2xl font-bold text-green-600">{stats.totalEnrolledStudents}</p>
                <button 
                  className="text-sm text-green-600 hover:text-green-800 mt-2"
                  onClick={() => navigate('/students')}
                >
                  View Student List →
                </button>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Departments</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {/* TODO: Connect to backend */}
                  5 {/* Placeholder */}
                </p>
                <button className="text-sm text-purple-600 hover:text-purple-800 mt-2">
                  Manage Departments →
                </button>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800">Data Export</h3>
                <div className="mt-2 space-y-1">
                  <button className="block text-sm text-orange-600 hover:text-orange-800">
                    Export Evaluations
                  </button>
                  <button className="block text-sm text-orange-600 hover:text-orange-800">
                    Export Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-[#7a0000]">{stats.totalCourses}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Survey Participation</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalEvaluations}/{stats.totalEnrolledStudents}</p>
            <p className="text-sm text-gray-500">students ({stats.participationRate}%)</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Participation Rate</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.participationRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.participationRate >= 80 ? 'bg-green-500' :
                  stats.participationRate >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${stats.participationRate}%` }}
              ></div>
            </div>
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

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Sentiment Analysis Filters</h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Program Filter - Only for Admins (Secretaries) */}
            {isAdmin(currentUser) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
              <select
                value={selectedYearLevel}
                onChange={(e) => setSelectedYearLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Year Levels</option>
                {filterOptions.yearLevels.map(yearLevel => (
                  <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>
                ))}
              </select>
            </div>

            {/* Filter Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Active Filters</label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {isAdmin(currentUser) && selectedProgram !== 'all' && (
                  <div>Program: {selectedProgram}</div>
                )}
                {selectedYearLevel !== 'all' && (
                  <div>Year Level: {selectedYearLevel}</div>
                )}
                <div>Showing: {stats.totalCourses} courses, {stats.totalEvaluations} evaluations</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
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

          {/* Sentiment by Year Level Stacked Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Sentiment Analysis by Year Level</h3>
            
            {yearLevelSentiment.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearLevelSentiment}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
                  <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name="Neutral" />
                  <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
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
