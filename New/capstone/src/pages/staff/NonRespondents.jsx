import React, { useState, useEffect } from 'react'
import { secretaryAPI, deptHeadAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ActiveFilters from '../../components/ActiveFilters'
import Pagination from '../../components/Pagination'
import { Search, Users, AlertCircle } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'

export default function NonRespondents() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500) // Debounce search
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Evaluation Period states
  const [evaluationPeriods, setEvaluationPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [activePeriod, setActivePeriod] = useState(null)

  const yearLevels = [
    { value: '1', label: 'Year 1' },
    { value: '2', label: 'Year 2' },
    { value: '3', label: 'Year 3' },
    { value: '4', label: 'Year 4' }
  ]

  // Determine which API to use based on user role
  const api = user?.role === 'secretary' ? secretaryAPI : deptHeadAPI

  // Fetch evaluation periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      if (!user) return
      try {
        const periodsData = await api.getEvaluationPeriods()
        setEvaluationPeriods(periodsData.data || [])
        const active = periodsData.data?.find(p => p.status === 'active' || p.status === 'Active')
        if (active) {
          setActivePeriod(active.id)
          setSelectedPeriod(active.id)
        }
      } catch (err) {
        console.error('Error fetching evaluation periods:', err)
      }
    }
    fetchPeriods()
  }, [user?.role])

  useEffect(() => {
    if (selectedPeriod || activePeriod) {
      fetchNonRespondents()
    }
  }, [selectedYearLevel, selectedPeriod])

  const fetchNonRespondents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {}
      if (selectedYearLevel !== 'all') params.year_level = selectedYearLevel
      if (selectedPeriod) params.evaluation_period_id = selectedPeriod

      const response = await api.getNonRespondents(params)
      setData(response.data || response)
      setCurrentPage(1)
    } catch (err) {
      console.error('Error fetching non-respondents:', err)
      setError(err.message || 'Failed to load non-respondents data')
    } finally {
      setLoading(false)
    }
  }

  // Filtered and paginated data
  const filteredData = data?.non_respondents?.filter(student =>
    debouncedSearchQuery === '' ||
    student.student_number.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    student.full_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    student.program.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  ) || []

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Clear filters
  const clearFilter = (filterKey) => {
    if (filterKey === 'yearLevel') setSelectedYearLevel('all')
    if (filterKey === 'search') setSearchQuery('')
  }

  const clearAllFilters = () => {
    setSelectedYearLevel('all')
    setSearchQuery('')
  }

  const activeFilters = {}
  if (selectedYearLevel !== 'all') activeFilters.yearLevel = selectedYearLevel
  if (searchQuery) activeFilters.search = searchQuery

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9D1535] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading non-respondents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      {/* Header */}
      <header className="lpu-header">
        <div className="container mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex items-center space-x-5">
            <img 
              src="/lpu-logo.png" 
              alt="University Logo" 
              className="w-32 h-32 object-contain"
            />
            <div>
              <h1 className="lpu-header-title text-3xl lg:text-4xl">Non-Respondent Tracking</h1>
              <p className="lpu-header-subtitle text-base lg:text-lg mt-1">
                Students who haven't completed evaluations
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        
        {/* Show warning if no active period and no selection */}
        {!activePeriod && !selectedPeriod ? (
          <div className="lpu-card text-center py-16 mb-10">
            <AlertCircle className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Evaluation Period</h3>
            <p className="text-gray-500 mb-4">There is currently no active evaluation period.</p>
            {evaluationPeriods.length > 0 ? (
              <p className="text-gray-500">Select a past evaluation period from the filters below to view historical data.</p>
            ) : (
              <p className="text-gray-500">Please contact the administrator to create and activate an evaluation period.</p>
            )}
          </div>
        ) : (
          <>
        {/* Statistics Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Total Students</h3>
            <p className="text-4xl font-bold text-white">{data?.total_students || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Responded</h3>
            <p className="text-4xl font-bold text-white">{data?.responded || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Non-Responded</h3>
            <p className="text-4xl font-bold text-white">{data?.non_responded || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#C41E3A] to-[#9D1535] rounded-card shadow-card p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Response Rate</h3>
            <p className="text-4xl font-bold text-white">{data?.response_rate || '0%'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="lpu-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filters</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Student number or name..."
                  className="lpu-select pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Period</label>
              <select
                value={selectedPeriod || ''}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="lpu-select"
              >
                <option value="">Select Period</option>
                {evaluationPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} {period.status === 'active' || period.status === 'Active' ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
              <select
                value={selectedYearLevel}
                onChange={(e) => setSelectedYearLevel(e.target.value)}
                className="lpu-select"
              >
                <option value="all">All Year Levels</option>
                {yearLevels.map((y) => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        <ActiveFilters
          filters={activeFilters}
          filterLabels={{
            yearLevel: 'Year Level',
            search: 'Search'
          }}
          filterOptions={{
            yearLevel: yearLevels
          }}
          onClearFilter={clearFilter}
          onClearAll={clearAllFilters}
          totalResults={filteredData.length}
          itemLabel="students"
        />

        {/* Table */}
        <div className="lpu-card overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={fetchNonRespondents} className="lpu-btn-secondary">
                Retry
              </button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No non-respondents found</p>
              <p className="text-sm text-gray-500 mt-2">All students have completed their evaluations!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table-auto">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Student Number
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Program
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Section
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Year
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Pending
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Progress
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Pending Courses
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.student_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.program}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.section}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          {student.year_level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {student.pending_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {student.completed_count}/{student.total_courses}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="max-w-xs">
                            {student.pending_courses.slice(0, 2).map((course, idx) => (
                              <div key={idx} className="text-xs">
                                {course.course_code}
                              </div>
                            ))}
                            {student.pending_courses.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{student.pending_courses.length - 2} more
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredData.length}
                onPageChange={setCurrentPage}
                itemLabel="students"
              />
            </>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}
