import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { mockCourses, mockEvaluations } from '../../data/mock'

export default function Courses() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddModal, setShowAddModal] = useState(false)

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

  // Get unique programs for filter
  const availablePrograms = useMemo(() => {
    const programs = [...new Set(accessibleCourses.map(course => course.program))]
    return programs.sort()
  }, [accessibleCourses])

  // Filter courses based on search and program
  const filteredCourses = useMemo(() => {
    return accessibleCourses.filter(course => {
      const matchesSearch = searchTerm === '' || 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.classCode.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesProgram = programFilter === 'all' || course.program === programFilter
      
      return matchesSearch && matchesProgram
    })
  }, [accessibleCourses, searchTerm, programFilter])

  // Course statistics
  const courseStats = useMemo(() => {
    const totalCourses = accessibleCourses.length
    const totalEnrollments = accessibleCourses.reduce((sum, course) => {
      // Mock enrollment count (20-50 students per course)
      return sum + Math.floor(Math.random() * 31) + 20
    }, 0)
    
    const programDistribution = availablePrograms.map(program => {
      const count = accessibleCourses.filter(course => course.program === program).length
      return { name: program, value: count, color: `hsl(${Math.random() * 360}, 70%, 50%)` }
    })

    const statusDistribution = ['Active', 'Pending', 'Inactive'].map(status => {
      const count = Math.floor(Math.random() * 10) + 5 // Mock status distribution
      return { name: status, value: count }
    })

    return {
      totalCourses,
      totalEnrollments,
      avgEnrollment: Math.round(totalEnrollments / totalCourses) || 0,
      programDistribution,
      statusDistribution
    }
  }, [accessibleCourses, availablePrograms])

  // Get course details with evaluations
  const getCourseDetails = (course) => {
    const courseEvaluations = accessibleEvaluations.filter(e => e.courseId === course.id)
    
    // Generate more realistic evaluation data
    const evaluationCount = Math.max(courseEvaluations.length, Math.floor(Math.random() * 15) + 5)
    const enrollmentCount = Math.floor(evaluationCount * (1.2 + Math.random() * 0.5)) // 120-170% of evaluations
    
    // Generate sample student evaluations if none exist
    const sampleComments = [
      "The course materials were well organized and the instructor explained concepts clearly. I particularly enjoyed the practical exercises.",
      "Good course content but the pace was a bit fast. More examples would have been helpful.",
      "The instructor was very knowledgeable and responsive to questions. The assignments were challenging but fair.",
      "Excellent course! The hands-on approach really helped me understand the concepts better.",
      "The course content was relevant but could use more modern examples. Overall, it was informative."
    ]
    
    const evaluations = courseEvaluations.length > 0 ? courseEvaluations : 
      Array.from({ length: Math.min(evaluationCount, 5) }, (_, i) => ({
        student: `Student ${i + 1}`,
        comment: sampleComments[i % sampleComments.length],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0 rating
        sentiment: Math.random() > 0.7 ? 'negative' : Math.random() > 0.3 ? 'positive' : 'neutral',
        semester: Math.random() > 0.5 ? 'First 2023' : 'Second 2023'
      }))

    const sentimentBreakdown = {
      positive: evaluations.filter(e => e.sentiment === 'positive').length,
      neutral: evaluations.filter(e => e.sentiment === 'neutral').length,
      negative: evaluations.filter(e => e.sentiment === 'negative').length
    }

    const criteriaRatings = {
      'Content Quality': (Math.random() * 1.5 + 3.5).toFixed(1),
      'Delivery Method': (Math.random() * 1.5 + 3.5).toFixed(1),
      'Assessment Fairness': (Math.random() * 1.5 + 3.5).toFixed(1),
      'Support Provided': (Math.random() * 1.5 + 3.5).toFixed(1)
    }

    return {
      ...course,
      enrollmentCount,
      evaluationCount,
      sentimentBreakdown,
      criteriaRatings,
      evaluations
    }
  }

  const courseDetails = selectedCourse ? getCourseDetails(selectedCourse) : null

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Courses Management</h1>
              <p className="text-gray-600">
                {isAdmin(currentUser) ? 'System-wide Course Overview' : `${currentUser.department} Department Courses`}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Course Overview Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-[#7a0000]">{courseStats.totalCourses}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Enrollments</h3>
            <p className="text-3xl font-bold text-blue-600">{courseStats.totalEnrollments}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg. Enrollment</h3>
            <p className="text-3xl font-bold text-green-600">{courseStats.avgEnrollment}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Programs</h3>
            <p className="text-3xl font-bold text-purple-600">{availablePrograms.length}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
              <input
                type="text"
                placeholder="Search by course name, instructor, or class code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program Filter</label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Programs</option>
                {availablePrograms.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Course List</h2>
            <p className="text-gray-600 mt-1">
              Showing {filteredCourses.length} of {courseStats.totalCourses} courses
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
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.classCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {course.program}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Year {course.yearLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.status === 'Active' ? 'bg-green-100 text-green-800' :
                        course.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="text-[#7a0000] hover:text-[#8f0000] mr-4"
                      >
                        View Details
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCourses.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || programFilter !== 'all' 
                  ? 'No courses match your current filters'
                  : 'No courses available'
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && courseDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{courseDetails.name}</h2>
                  <p className="text-gray-600">{courseDetails.classCode} • {courseDetails.instructor}</p>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'overview' 
                      ? 'border-[#7a0000] text-[#7a0000]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('sentiment')}
                  className={`py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'sentiment' 
                      ? 'border-[#7a0000] text-[#7a0000]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sentiment Analysis
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'comments' 
                      ? 'border-[#7a0000] text-[#7a0000]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Comments
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overall Rating and Evaluations Side by Side */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Overall Rating */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Overall Rating</h3>
                      <p className="text-sm text-gray-500 mb-4">Average across all evaluations</p>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-blue-600 mb-2">
                          {courseDetails.evaluationCount > 0 ? 
                            (courseDetails.evaluations.reduce((acc, evaluation) => acc + (evaluation.rating || 4), 0) / courseDetails.evaluationCount).toFixed(1) : 
                            '0'
                          }
                          <span className="text-2xl text-gray-400">/5.0</span>
                        </div>
                      </div>
                    </div>

                    {/* Evaluations Count */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Evaluations</h3>
                      <p className="text-sm text-gray-500 mb-4">Total number of evaluations</p>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-blue-600">
                          {courseDetails.evaluationCount > 0 ? courseDetails.evaluationCount : 'No data'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Rating Breakdown</h3>
                    <p className="text-sm text-gray-500 mb-6">Average ratings by category</p>
                    
                    <div className="space-y-4">
                      {Object.entries(courseDetails.criteriaRatings).map(([criterion, rating]) => (
                        <div key={criterion} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">{criterion}</span>
                              <span className="text-sm font-medium">{rating}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${(parseFloat(rating) / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Course Information */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Course Information</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium text-gray-600">Program:</span> {courseDetails.program}</div>
                        <div><span className="font-medium text-gray-600">Year Level:</span> Year {courseDetails.yearLevel}</div>
                        <div><span className="font-medium text-gray-600">Semester:</span> {courseDetails.semester}</div>
                        <div><span className="font-medium text-gray-600">Status:</span> {courseDetails.status}</div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium text-gray-600">Total Enrolled:</span> {courseDetails.enrollmentCount} students</div>
                        <div><span className="font-medium text-gray-600">Response Rate:</span> {Math.round((courseDetails.evaluationCount / courseDetails.enrollmentCount) * 100)}%</div>
                        <div><span className="font-medium text-gray-600">Department:</span> Computer Science</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sentiment' && (
                <div className="space-y-6">
                  {/* Criteria Comparison */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Criteria Comparison</h3>
                    <p className="text-sm text-gray-500 mb-6">Breakdown of evaluation criteria</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {Object.entries(courseDetails.criteriaRatings).map(([criterion, rating], index) => {
                        const colors = ['text-green-600', 'text-orange-500', 'text-blue-600', 'text-purple-600'];
                        const bgColors = ['bg-green-100', 'bg-orange-100', 'bg-blue-100', 'bg-purple-100'];
                        return (
                          <div key={criterion} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${bgColors[index % 4]}`}></div>
                            <span className={`text-sm font-medium ${colors[index % 4]}`}>
                              {criterion}: {rating}/5.0
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Placeholder */}
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(courseDetails.criteriaRatings).map(([name, value]) => ({ name: name.replace(' ', '\n'), value: parseFloat(value) }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Student Comments</h3>
                    <p className="text-sm text-gray-500 mb-6">Feedback from course evaluations</p>
                    
                    {courseDetails.evaluations.length > 0 ? (
                      <div className="space-y-4">
                        {courseDetails.evaluations.map((evaluation, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-700">
                                  {evaluation.student || `Anonymous Student ${index + 1}`}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  evaluation.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                  evaluation.sentiment === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {evaluation.sentiment || 'neutral'}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-600">
                                  Rating: {evaluation.rating || 4}/5
                                </div>
                                <div className="text-xs text-gray-500">
                                  {evaluation.semester || 'First 2023'}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm italic">
                              "{evaluation.comment || 'The course materials were well organized and the instructor explained concepts clearly. I particularly enjoyed the practical exercises.'}"
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📝</div>
                        <div>No student comments available for this course yet.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
