import React, { useState, useEffect } from 'react'
import { secretaryAPI, deptHeadAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ActiveFilters from '../../components/ActiveFilters'
import Pagination from '../../components/Pagination'
import { Download, Search, Users, AlertCircle } from 'lucide-react'

export default function NonRespondents() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
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
    searchQuery === '' ||
    student.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.program.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredData.length) return

    const headers = ['Student Number', 'Name', 'Program', 'Section', 'Year Level', 'Pending Count', 'Completed', 'Total Courses', 'Pending Courses']
    const rows = filteredData.map(s => [
      s.student_number,
      s.full_name,
      s.program,
      s.section,
      s.year_level,
      s.pending_count,
      s.completed_count,
      s.total_courses,
      s.pending_courses.map(c => `${c.course_code}: ${c.course_name}`).join('; ')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `non-respondents-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

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
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <Users className="w-8 h-8 text-[#7a0000]" />
            </div>
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
            <p className="text-gray-500">Please contact the administrator to activate an evaluation period, or select a specific period from the filter below.</p>
          </div>
        ) : (
          <>
        {/* Statistics Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Total Students</h3>
            <p className="text-4xl font-bold text-white">{data?.total_students || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#10b981] to-[#059669] rounded-card shadow-card p-6">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Responded</h3>
            <p className="text-4xl font-bold text-white">{data?.responded || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-card shadow-card p-6">
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

        {/* Export Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={exportToCSV}
            disabled={!filteredData.length}
            className="lpu-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>

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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                itemLabel=\"students\"
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
