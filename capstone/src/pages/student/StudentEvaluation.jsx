import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../utils/roleUtils'
import { mockCourses } from '../../data/mock'

export default function StudentEvaluation() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState(null)
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

  // Get courses available to the student (filter by program)
  const availableCourses = useMemo(() => {
    if (!currentUser) return []
    
    return mockCourses.filter(course => 
      course.program === currentUser.program &&
      course.yearLevel <= currentUser.yearLevel
    ).map(course => ({
      ...course,
      status: Math.random() > 0.7 ? 'inactive' : Math.random() > 0.3 ? 'active' : 'pending' // Mock status
    }))
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

  const handleEvaluationSubmit = () => {
    if (!selectedCourse) return

    // In a real app, this would make an API call
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

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Course Evaluation</h1>
              <p className="text-gray-600">
                Evaluate your courses and provide feedback to help improve the learning experience
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome,</p>
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-sm text-gray-500">{currentUser.program} - Year {currentUser.yearLevel}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Student Information</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2">{currentUser.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Program:</span>
              <span className="ml-2">{currentUser.program}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Year Level:</span>
              <span className="ml-2">Year {currentUser.yearLevel}</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester Filter</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Semesters</option>
                {availableSemesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Selection Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your Courses</h2>
            <p className="text-gray-600 mt-1">
              Select a course to evaluate. Only active courses can be evaluated.
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
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.classCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canEvaluate(course) ? (
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="text-[#7a0000] hover:text-[#8f0000]"
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
              <span className="text-blue-700">Evaluation period has ended</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Form Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Course Evaluation</h2>
                  <p className="text-gray-600">{selectedCourse.name} - {selectedCourse.instructor}</p>
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
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-8">
                {/* Course Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Course Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Course:</span> {selectedCourse.name}</div>
                    <div><span className="font-medium">Code:</span> {selectedCourse.classCode}</div>
                    <div><span className="font-medium">Instructor:</span> {selectedCourse.instructor}</div>
                    <div><span className="font-medium">Semester:</span> {selectedCourse.semester}</div>
                  </div>
                </div>

                {/* Rating Questions */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Rate your experience (1 = Strongly Disagree, 5 = Strongly Agree)</h3>
                  
                  {/* Content Quality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Content Quality: The course content was well-organized, relevant, and clearly presented
                    </label>
                    <div className="flex space-x-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex items-center">
                          <input
                            type="radio"
                            name="contentQuality"
                            value={rating}
                            checked={evaluationData.contentQuality === rating}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, contentQuality: parseInt(e.target.value) }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Delivery Method: The instructor explained concepts effectively and used appropriate teaching methods
                    </label>
                    <div className="flex space-x-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex items-center">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value={rating}
                            checked={evaluationData.deliveryMethod === rating}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, deliveryMethod: parseInt(e.target.value) }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Assessment Fairness */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Assessment Fairness: Assignments and exams fairly assessed my understanding of the course material
                    </label>
                    <div className="flex space-x-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex items-center">
                          <input
                            type="radio"
                            name="assessmentFairness"
                            value={rating}
                            checked={evaluationData.assessmentFairness === rating}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, assessmentFairness: parseInt(e.target.value) }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Support Provided */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Support Provided: The instructor was available for help and provided adequate support when needed
                    </label>
                    <div className="flex space-x-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex items-center">
                          <input
                            type="radio"
                            name="supportProvided"
                            value={rating}
                            checked={evaluationData.supportProvided === rating}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, supportProvided: parseInt(e.target.value) }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Overall Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Overall Rating: I would recommend this course to other students
                    </label>
                    <div className="flex space-x-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex items-center">
                          <input
                            type="radio"
                            name="overallRating"
                            value={rating}
                            checked={evaluationData.overallRating === rating}
                            onChange={(e) => setEvaluationData(prev => ({ ...prev, overallRating: parseInt(e.target.value) }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={evaluationData.comments}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    rows={4}
                    placeholder="Please share any additional feedback, suggestions, or comments about the course..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
      )}
    </div>
  )
}
