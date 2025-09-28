import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { mockCourses, mockEvaluations } from '../../data/mock'

export default function Evaluations() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')

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

  // Filter data based on user access
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(mockCourses, currentUser)
  }, [currentUser])

  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const programs = [...new Set(accessibleCourses.map(course => course.program))].sort()
    const semesters = [...new Set(accessibleEvaluations.map(evaluation => evaluation.semester || 'Fall 2025'))].sort()

    return { programs, semesters }
  }, [accessibleCourses, accessibleEvaluations])

  // Enhanced evaluations with course information
  const enhancedEvaluations = useMemo(() => {
    return accessibleEvaluations.map(evaluation => {
      const course = accessibleCourses.find(c => c.id === evaluation.courseId)
      
      // Calculate average rating from ratings object
      const ratings = evaluation.ratings || {}
      const ratingValues = Object.values(ratings)
      const avgRating = ratingValues.length > 0 
        ? (ratingValues.reduce((a, b) => a + b) / ratingValues.length).toFixed(1)
        : 'N/A'

      return {
        ...evaluation,
        courseName: course?.name || 'Unknown Course',
        courseProgram: course?.program || 'Unknown',
        instructor: course?.instructor || 'Unknown',
        avgRating,
        submittedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    })
  }, [accessibleEvaluations, accessibleCourses])

  // Filter evaluations based on search and filters
  const filteredEvaluations = useMemo(() => {
    return enhancedEvaluations.filter(evaluation => {
      const matchesSearch = searchTerm === '' || 
        evaluation.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesProgram = programFilter === 'all' || evaluation.courseProgram === programFilter
      const matchesSentiment = sentimentFilter === 'all' || evaluation.sentiment === sentimentFilter
      const matchesSemester = semesterFilter === 'all' || (evaluation.semester || 'Fall 2025') === semesterFilter
      
      return matchesSearch && matchesProgram && matchesSentiment && matchesSemester
    })
  }, [enhancedEvaluations, searchTerm, programFilter, sentimentFilter, semesterFilter])

  // Calculate evaluation statistics
  const evaluationStats = useMemo(() => {
    const total = enhancedEvaluations.length
    const positive = enhancedEvaluations.filter(e => e.sentiment === 'positive').length
    const neutral = enhancedEvaluations.filter(e => e.sentiment === 'neutral').length
    const negative = enhancedEvaluations.filter(e => e.sentiment === 'negative').length
    const anomalies = enhancedEvaluations.filter(e => e.anomaly).length

    // Calculate average rating across all evaluations
    const ratingsData = enhancedEvaluations
      .filter(e => e.avgRating !== 'N/A')
      .map(e => parseFloat(e.avgRating))
    
    const overallAvgRating = ratingsData.length > 0 
      ? (ratingsData.reduce((a, b) => a + b) / ratingsData.length).toFixed(1)
      : '0.0'

    return {
      total,
      positive,
      neutral,
      negative,
      anomalies,
      overallAvgRating,
      responseRate: Math.round((total / (accessibleCourses.length * 35)) * 100) // Assuming 35 avg students per course
    }
  }, [enhancedEvaluations, accessibleCourses])

  // Sentiment trend data for chart
  const sentimentTrendData = useMemo(() => {
    const programs = filterOptions.programs
    
    return programs.map(program => {
      const programEvaluations = enhancedEvaluations.filter(e => e.courseProgram === program)
      const positive = programEvaluations.filter(e => e.sentiment === 'positive').length
      const neutral = programEvaluations.filter(e => e.sentiment === 'neutral').length
      const negative = programEvaluations.filter(e => e.sentiment === 'negative').length
      
      return {
        name: program,
        positive,
        neutral,
        negative
      }
    })
  }, [enhancedEvaluations, filterOptions.programs])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Evaluations</h1>
              <p className="text-gray-600">
                {isAdmin(currentUser) ? 'System-wide Evaluation Overview' : `${currentUser.department} Department Evaluations`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Evaluation Overview Statistics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Evaluations</h3>
            <p className="text-3xl font-bold text-[#7a0000]">{evaluationStats.total}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Positive</h3>
            <p className="text-3xl font-bold text-green-600">{evaluationStats.positive}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Neutral</h3>
            <p className="text-3xl font-bold text-yellow-600">{evaluationStats.neutral}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Negative</h3>
            <p className="text-3xl font-bold text-red-600">{evaluationStats.negative}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg. Rating</h3>
            <p className="text-3xl font-bold text-blue-600">{evaluationStats.overallAvgRating}/5.0</p>
          </div>
        </div>

        {/* Sentiment Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Sentiment by Program</h2>
          {sentimentTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentTrendData}>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search evaluations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Programs</option>
                {filterOptions.programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment</label>
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Semesters</option>
                {filterOptions.semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Evaluation List</h2>
            <p className="text-gray-600 mt-1">
              Showing {filteredEvaluations.length} of {evaluationStats.total} evaluations
            </p>
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
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentiment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
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
                {filteredEvaluations.map((evaluation, index) => (
                  <tr key={evaluation.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {evaluation.courseName.length > 30 
                            ? evaluation.courseName.substring(0, 30) + '...' 
                            : evaluation.courseName
                          }
                        </div>
                        <div className="text-sm text-gray-500">{evaluation.instructor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {evaluation.student}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {evaluation.courseProgram}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getRatingColor(evaluation.avgRating)}`}>
                        {evaluation.avgRating}/5.0
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSentimentColor(evaluation.sentiment)}`}>
                        {evaluation.sentiment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {evaluation.submittedDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="truncate" title={evaluation.comment}>
                        {evaluation.comment}
                      </div>
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
                ))}
              </tbody>
            </table>
            
            {filteredEvaluations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || programFilter !== 'all' || sentimentFilter !== 'all' || semesterFilter !== 'all'
                  ? 'No evaluations match your current filters'
                  : 'No evaluations available'
                }
              </div>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 text-center">
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold mr-4 transition duration-200">
            Export to Excel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  )
}
