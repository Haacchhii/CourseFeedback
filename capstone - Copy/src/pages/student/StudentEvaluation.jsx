import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../utils/roleUtils'
import apiService from '../../services/api'

export default function StudentEvaluation() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [availableCourses, setAvailableCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [evaluationData, setEvaluationData] = useState({
    contentQuality: 5,
    deliveryMethod: 5,
    assessmentFairness: 5,
    supportProvided: 5,
    overallRating: 5,
    comments: ''
  })

  // Redirect non-students
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (currentUser.role !== 'student') {
      navigate('/dashboard')
      return
    }
  }, [currentUser, navigate])

  // Fetch available courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await apiService.getAllEvaluations()
        
        // Create unique courses from evaluations
        const courseMap = new Map()
        response.data?.forEach(evaluation => {
          if (evaluation.course_code && !courseMap.has(evaluation.course_code)) {
            courseMap.set(evaluation.course_code, {
              id: evaluation.course_code,
              code: evaluation.course_code,
              classCode: evaluation.course_code,
              name: evaluation.course_name,
              instructor: evaluation.instructor_name,
              program: evaluation.course_code?.startsWith('CS') ? 'Computer Science' : 'Information Technology',
              yearLevel: evaluation.course_code?.includes('1') ? 1 : evaluation.course_code?.includes('2') ? 2 : 3,
              semester: evaluation.semester || 'Current',
              credits: 3, // Default credits
              status: 'active' // All courses are available for evaluation
            })
          }
        })
        
        setAvailableCourses(Array.from(courseMap.values()))
      } catch (err) {
        console.error('Failed to fetch courses:', err)
        setError('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser?.role === 'student') {
      fetchCourses()
    }
  }, [currentUser])

  // Get unique semesters for filter
  const availableSemesters = useMemo(() => {
    const semesters = [...new Set(availableCourses.map(course => course.semester))]
    return semesters.sort()
  }, [availableCourses])

  // Filter courses based on search and semester
  const filteredCourses = useMemo(() => {
    return availableCourses.filter(course => {
      const matchesSearch = searchTerm === '' || 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.classCode.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSemester = semesterFilter === 'all' || course.semester === semesterFilter
      
      return matchesSearch && matchesSemester
    })
  }, [availableCourses, searchTerm, semesterFilter])

  const handleEvaluationSubmit = async () => {
    if (!selectedCourse) return

    try {
      // In a real implementation, you would submit the evaluation to the API
      console.log('Submitting evaluation for course:', selectedCourse.id, evaluationData)
      
      alert('Evaluation submitted successfully!')
      setSelectedCourse(null)
      setEvaluationData({
        contentQuality: 5,
        deliveryMethod: 5,
        assessmentFairness: 5,
        supportProvided: 5,
        overallRating: 5,
        comments: ''
      })
    } catch (err) {
      console.error('Failed to submit evaluation:', err)
      alert('Failed to submit evaluation. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canEvaluate = (course) => {
    return course.status === 'active'
  }

  if (!currentUser || currentUser.role !== 'student') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Student access required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Evaluation</h1>
          <p className="text-gray-600">Evaluate your courses to help improve the learning experience</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Courses
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by course name, instructor, or code..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#7a0000] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Semesters</option>
                {availableSemesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Available Courses</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.classCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {canEvaluate(course) ? (
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="text-[#7a0000] hover:text-[#8f0000] font-medium"
                        >
                          Evaluate
                        </button>
                      ) : (
                        <span className="text-gray-400">
                          {course.status === 'pending' ? 'Not Ready' : 'Evaluation Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCourses.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || semesterFilter !== 'all' 
                  ? 'No courses match your current filters'
                  : 'No courses available for evaluation'
                }
              </div>
            )}
          </div>
        </div>

        {/* Evaluation Status Legend */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-3">Course Status Guide</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                Active
              </span>
              <span className="text-blue-700">Course is available for evaluation</span>
            </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
                Pending
              </span>
              <span className="text-blue-700">Evaluation period hasn't started yet</span>
            </div>
            <div className="flex items-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                Inactive
              </span>
              <span className="text-blue-700">Evaluation period has closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Evaluate: {selectedCourse.name}
                </h3>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating Categories */}
                {[
                  { key: 'contentQuality', label: 'Content Quality', description: 'How relevant and up-to-date is the course content?' },
                  { key: 'deliveryMethod', label: 'Delivery Method', description: 'How effective is the teaching methodology?' },
                  { key: 'assessmentFairness', label: 'Assessment Fairness', description: 'Are the assessments fair and well-designed?' },
                  { key: 'supportProvided', label: 'Support Provided', description: 'How accessible and helpful is the instructor?' },
                  { key: 'overallRating', label: 'Overall Rating', description: 'Your overall experience with this course' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        <p className="text-xs text-gray-500">{description}</p>
                      </div>
                      <span className="text-lg font-semibold text-[#7a0000]">
                        {evaluationData[key]}/5
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={evaluationData[key]}
                      onChange={(e) => setEvaluationData({
                        ...evaluationData,
                        [key]: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                ))}

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={evaluationData.comments}
                    onChange={(e) => setEvaluationData({
                      ...evaluationData,
                      comments: e.target.value
                    })}
                    placeholder="Share any specific feedback about the course..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#7a0000] focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEvaluationSubmit}
                  className="px-6 py-2 bg-[#7a0000] hover:bg-[#8f0000] text-white rounded-lg"
                >
                  Submit Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}