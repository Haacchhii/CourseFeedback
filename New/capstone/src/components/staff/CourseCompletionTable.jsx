import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, secretaryAPI, deptHeadAPI } from '../../services/api'
import { isAdmin } from '../../utils/roleUtils'
import Pagination from '../Pagination'
import CustomDropdown from '../CustomDropdown'

export default function CourseCompletionTable({ selectedPeriod = null }) {
  const { user: currentUser } = useAuth()
  const [completionData, setCompletionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('completion_rate') // completion_rate, course_name, instructor
  const [filterThreshold, setFilterThreshold] = useState('all') // all, below70, below50
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchCompletionData()
  }, [currentUser, selectedPeriod])

  const fetchCompletionData = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError(null)

      let response
      if (isAdmin(currentUser)) {
        response = await adminAPI.getCompletionRates(selectedPeriod)
      } else if (currentUser.role === 'secretary') {
        response = await secretaryAPI.getCompletionRates(selectedPeriod)
      } else if (currentUser.role === 'department_head') {
        response = await deptHeadAPI.getCompletionRates(selectedPeriod)
      }

      if (response?.success && response?.data) {
        setCompletionData(response.data)
      }
    } catch (err) {
      console.error('Error fetching completion data:', err)
      setError(err.message || 'Failed to load completion data')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort courses
  const filteredCourses = React.useMemo(() => {
    if (!completionData?.courses) return []

    let filtered = completionData.courses.filter(course => {
      const matchesSearch = 
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.class_code.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = 
        filterThreshold === 'all' ||
        (filterThreshold === 'below70' && course.completion_rate < 70) ||
        (filterThreshold === 'below50' && course.completion_rate < 50)

      return matchesSearch && matchesFilter
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'completion_rate') {
        return a.completion_rate - b.completion_rate // Ascending (lowest first)
      } else if (sortBy === 'course_name') {
        return a.course_name.localeCompare(b.course_name)
      } else if (sortBy === 'instructor') {
        return a.instructor.localeCompare(b.instructor)
      }
      return 0
    })

    return filtered
  }, [completionData, searchTerm, sortBy, filterThreshold])

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, filterThreshold])

  if (loading) {
    return (
      <div className="lpu-card">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-[#7a0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="lpu-card">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lpu-card">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            Course Completion Tracking
          </h3>
          <button
            onClick={fetchCompletionData}
            className="lpu-btn-secondary text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="lpu-input pl-10"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          {/* Sort */}
          <CustomDropdown
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: 'completion_rate', label: 'Sort by: Completion Rate' },
              { value: 'course_name', label: 'Sort by: Course Name' }
            ]}
          />

          {/* Filter */}
          <CustomDropdown
            value={filterThreshold}
            onChange={(val) => setFilterThreshold(val)}
            options={[
              { value: 'all', label: 'Show: All Courses' },
              { value: 'below70', label: 'Show: Below 70%' },
              { value: 'below50', label: 'Show: Below 50%' }
            ]}
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredCourses.length)} of {filteredCourses.length} courses
          {completionData?.courses?.length !== filteredCourses.length && 
            ` (filtered from ${completionData?.courses?.length} total)`
          }
        </span>
        {totalPages > 1 && (
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Course</th>
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Enrolled</th>
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Submitted</th>
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Pending</th>
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Completion</th>
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCourses.length > 0 ? (
              paginatedCourses.map((course) => {
                const completionRate = course.completion_rate
                const statusColor = 
                  completionRate >= 85 ? 'green' :
                  completionRate >= 70 ? 'yellow' : 'red'

                return (
                  <tr key={course.section_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{course.course_name}</div>
                        <div className="text-sm text-gray-500">
                          {course.course_code} • {course.class_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {course.enrolled_students}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {course.submitted_evaluations}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-lg font-semibold ${course.pending_evaluations > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {course.pending_evaluations}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center">
                        <span className={`text-xl font-bold text-${statusColor}-600 mb-1`}>
                          {completionRate}%
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-${statusColor}-500 h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {course.is_below_threshold ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          </svg>
                          Low
                        </span>
                      ) : completionRate >= 85 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Good
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Fair
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  No courses match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredCourses.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCourses.length}
          onPageChange={setCurrentPage}
          itemLabel="courses"
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value)
            setCurrentPage(1)
          }}
          showItemsPerPage={true}
        />
      )}
    </div>
  )
}
