import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import apiService from '../../services/api'

export default function Evaluations() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [yearLevelFilter, setYearLevelFilter] = useState('all')
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
        setError('Failed to load evaluations')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser && (isAdmin(currentUser) || isDepartmentHead(currentUser))) {
      fetchEvaluations()
    }
  }, [currentUser])

  // Use real API data instead of mock data
  const accessibleEvaluations = useMemo(() => {
    return evaluations
  }, [currentUser])

  // Get unique values for filters from real data
  const filterOptions = useMemo(() => {
    const programs = [...new Set(accessibleEvaluations.map(evaluation => 
      evaluation.course_code?.startsWith('CS') ? 'Computer Science' : 
      evaluation.course_code?.startsWith('IT') ? 'Information Technology' : 'Unknown'
    ))].filter(p => p !== 'Unknown').sort()
    
    const semesters = ['Fall 2025', 'Spring 2025'] // Can be extracted from created_at if needed
    const yearLevels = [...new Set(accessibleEvaluations.map(evaluation => 
      evaluation.course_code?.includes('1') ? '1st Year' :
      evaluation.course_code?.includes('2') ? '2nd Year' :
      evaluation.course_code?.includes('3') ? '3rd Year' :
      evaluation.course_code?.includes('4') ? '4th Year' : 'Unknown'
    ))].filter(y => y !== 'Unknown').sort()

    return { programs, semesters, yearLevels }
  }, [accessibleEvaluations])

  // Enhanced evaluations with database information
  const enhancedEvaluations = useMemo(() => {
    return accessibleEvaluations.map(evaluation => {
      return {
        ...evaluation,
        courseName: evaluation.course_name || 'Unknown Course',
        courseProgram: evaluation.course_code?.startsWith('CS') ? 'Computer Science' : 
                      evaluation.course_code?.startsWith('IT') ? 'Information Technology' : 'Unknown',
        instructor: evaluation.instructor_name || 'Unknown',
        avgRating: evaluation.overall_rating || 'N/A',
        submittedDate: evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'N/A'
      }
    })
  }, [accessibleEvaluations])

  // Filter evaluations based on search and filters with database fields
  const filteredEvaluations = useMemo(() => {
    return enhancedEvaluations.filter(evaluation => {
      const matchesSearch = searchTerm === '' || 
        evaluation.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesProgram = programFilter === 'all' || evaluation.courseProgram === programFilter
      const matchesSentiment = sentimentFilter === 'all' || evaluation.sentiment === sentimentFilter
      const matchesSemester = semesterFilter === 'all' // Always match semester for now
      
      // Extract year level from course code
      const courseYearLevel = evaluation.course_code?.match(/\d/)?.[0] || '1'
      const matchesYearLevel = yearLevelFilter === 'all' || courseYearLevel === yearLevelFilter.charAt(0)
      
      return matchesSearch && matchesProgram && matchesSentiment && matchesSemester && matchesYearLevel
    })
  }, [enhancedEvaluations, searchTerm, programFilter, sentimentFilter, semesterFilter, yearLevelFilter])

  // Calculate evaluation statistics
  const evaluationStats = useMemo(() => {
    const total = enhancedEvaluations.length
    const positive = enhancedEvaluations.filter(e => e.sentiment === 'positive').length
    const neutral = enhancedEvaluations.filter(e => e.sentiment === 'neutral').length
    const negative = enhancedEvaluations.filter(e => e.sentiment === 'negative').length
    const anomalies = enhancedEvaluations.filter(e => e.anomaly).length

    // Calculate total enrolled students and participation rate
    const totalEnrolledStudents = accessibleCourses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0)
    const participationRate = totalEnrolledStudents > 0 ? Math.round((total / totalEnrolledStudents) * 100) : 0

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
      totalEnrolledStudents,
      participationRate
    }
  }, [enhancedEvaluations, accessibleCourses])

  // Sentiment trend data for chart - adapts based on user role
  const sentimentTrendData = useMemo(() => {
    if (isAdmin(currentUser)) {
      // Secretary/Admin: Sentiment by Program
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
    } else {
      // Department Head: Sentiment by Subject/Course
      // Get unique courses for department head's assigned programs
      const departmentCourses = accessibleCourses
        .filter(course => currentUser?.assignedPrograms?.includes(course.program))
        .slice(0, 8) // Limit to 8 courses for better visualization
      
      return departmentCourses.map(course => {
        const courseEvaluations = enhancedEvaluations.filter(e => e.courseId === course.id)
        const positive = courseEvaluations.filter(e => e.sentiment === 'positive').length
        const neutral = courseEvaluations.filter(e => e.sentiment === 'neutral').length
        const negative = courseEvaluations.filter(e => e.sentiment === 'negative').length
        
        return {
          name: course.name.length > 20 ? course.name.substring(0, 20) + '...' : course.name,
          positive,
          neutral,
          negative,
          fullName: course.name
        }
      })
    }
  }, [enhancedEvaluations, filterOptions.programs, accessibleCourses, currentUser])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluations...</p>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Survey Participation</h3>
            <p className="text-2xl font-bold text-[#7a0000]">{evaluationStats.total}/{evaluationStats.totalEnrolledStudents}</p>
            <p className="text-sm text-gray-500">students ({evaluationStats.participationRate}%)</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Participation Rate</h3>
            <p className="text-3xl font-bold text-purple-600">{evaluationStats.participationRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  evaluationStats.participationRate >= 80 ? 'bg-green-500' :
                  evaluationStats.participationRate >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${evaluationStats.participationRate}%` }}
              ></div>
            </div>
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
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {isAdmin(currentUser) ? 'Sentiment by Program' : 'Sentiment by Course'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin(currentUser) 
                ? 'Overview of sentiment distribution across all academic programs'
                : 'Sentiment analysis for courses in your assigned programs'
              }
            </p>
          </div>
          
          {sentimentTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentTrendData}>
                <XAxis 
                  dataKey="name" 
                  angle={isAdmin(currentUser) ? 0 : -45}
                  textAnchor={isAdmin(currentUser) ? 'middle' : 'end'}
                  height={isAdmin(currentUser) ? 60 : 80}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => {
                    const item = sentimentTrendData.find(d => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="positive" fill="#10b981" name="Positive" />
                <Bar dataKey="neutral" fill="#f59e0b" name="Neutral" />
                <Bar dataKey="negative" fill="#ef4444" name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No evaluation data available for visualization
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              {isDepartmentHead(currentUser) ? (
                <input 
                  type="text"
                  value={currentUser?.assignedPrograms?.join(', ') || 'No programs assigned'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  title="Department heads can only view evaluations for their assigned programs"
                />
              ) : (
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
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
              <select
                value={yearLevelFilter}
                onChange={(e) => setYearLevelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Year Levels</option>
                {filterOptions.yearLevels.map(yearLevel => (
                  <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>
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
