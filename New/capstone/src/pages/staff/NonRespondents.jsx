import React, { useState, useEffect } from 'react'
import { secretaryAPI, deptHeadAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Search, Users, AlertCircle, ChevronDown, ChevronRight, GraduationCap, BookOpen } from 'lucide-react'

export default function NonRespondents() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Evaluation Period states
  const [evaluationPeriods, setEvaluationPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [activePeriod, setActivePeriod] = useState(null)

  // Expanded states for accordion
  const [expandedProgramSections, setExpandedProgramSections] = useState({})
  const [expandedCourseSections, setExpandedCourseSections] = useState({})

  // Determine which API to use based on user role
  const api = user?.role === 'secretary' ? secretaryAPI : deptHeadAPI

  // Fetch evaluation periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      if (!user) return
      try {
        const periodsData = await api.getEvaluationPeriods()
        setEvaluationPeriods(periodsData.data || [])
        const active = periodsData.data?.find(p => p.status === 'Open' || p.status === 'active' || p.status === 'Active')
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
  }, [selectedPeriod])

  const fetchNonRespondents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {}
      if (selectedPeriod) params.evaluation_period_id = selectedPeriod

      const response = await api.getNonRespondents(params)
      const rawData = response.data || response
      
      // Group data by program section, then by course section
      const grouped = groupByProgramAndCourse(rawData.non_respondents || [])
      setData({
        ...rawData,
        groupedData: grouped
      })
    } catch (err) {
      console.error('Error fetching non-respondents:', err)
      setError(err.message || 'Failed to load non-respondents data')
    } finally {
      setLoading(false)
    }
  }

  // Group non-respondents by program section, then by course section
  const groupByProgramAndCourse = (nonRespondents) => {
    const grouped = {}
    
    nonRespondents.forEach(student => {
      const programSectionKey = `${student.program}-${student.section || 'No Section'}`
      
      if (!grouped[programSectionKey]) {
        grouped[programSectionKey] = {
          program: student.program,
          section: student.section || 'No Section',
          yearLevel: student.year_level,
          courseSections: {},
          totalStudents: 0
        }
      }
      
      // Group by each pending course
      student.pending_courses?.forEach(course => {
        const courseKey = course.course_code || course.class_code || 'Unknown Course'
        
        if (!grouped[programSectionKey].courseSections[courseKey]) {
          grouped[programSectionKey].courseSections[courseKey] = {
            courseCode: courseKey,
            courseName: course.course_name || course.subject_name || courseKey,
            students: []
          }
        }
        
        // Add student if not already in this course section
        const existingStudent = grouped[programSectionKey].courseSections[courseKey].students.find(
          s => s.student_id === student.student_id
        )
        if (!existingStudent) {
          grouped[programSectionKey].courseSections[courseKey].students.push({
            student_id: student.student_id,
            student_number: student.student_number,
            full_name: student.full_name,
            year_level: student.year_level
          })
        }
      })
      
      grouped[programSectionKey].totalStudents++
    })
    
    return grouped
  }

  const toggleProgramSection = (key) => {
    setExpandedProgramSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleCourseSection = (programKey, courseKey) => {
    const combinedKey = `${programKey}-${courseKey}`
    setExpandedCourseSections(prev => ({
      ...prev,
      [combinedKey]: !prev[combinedKey]
    }))
  }

  // Filter grouped data by search
  const filterGroupedData = (groupedData) => {
    if (!searchQuery) return groupedData
    
    const filtered = {}
    Object.entries(groupedData).forEach(([key, programSection]) => {
      const filteredCourseSections = {}
      
      Object.entries(programSection.courseSections).forEach(([courseKey, courseSection]) => {
        const filteredStudents = courseSection.students.filter(student =>
          student.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        
        if (filteredStudents.length > 0) {
          filteredCourseSections[courseKey] = {
            ...courseSection,
            students: filteredStudents
          }
        }
      })
      
      if (Object.keys(filteredCourseSections).length > 0) {
        filtered[key] = {
          ...programSection,
          courseSections: filteredCourseSections
        }
      }
    })
    
    return filtered
  }

  const filteredGroupedData = data?.groupedData ? filterGroupedData(data.groupedData) : {}

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
                Students who haven't completed evaluations by section
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
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
              </div>
            </div>

            {/* Program Sections Accordion */}
            {error ? (
              <div className="lpu-card p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={fetchNonRespondents} className="lpu-btn-secondary">
                  Retry
                </button>
              </div>
            ) : Object.keys(filteredGroupedData).length === 0 ? (
              <div className="lpu-card p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No non-respondents found</p>
                <p className="text-sm text-gray-500 mt-2">All students have completed their evaluations!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(filteredGroupedData).map(([programKey, programSection]) => (
                  <div key={programKey} className="lpu-card overflow-hidden">
                    {/* Program Section Header */}
                    <button
                      onClick={() => toggleProgramSection(programKey)}
                      className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white hover:from-[#8a1000] hover:to-[#aa2000] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <GraduationCap className="w-6 h-6" />
                        <div className="text-left">
                          <h3 className="text-lg font-bold">{programSection.program} - {programSection.section}</h3>
                          <p className="text-sm text-white/80">Year {programSection.yearLevel} • {Object.keys(programSection.courseSections).length} courses with pending evaluations</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                          {programSection.totalStudents} students
                        </span>
                        {expandedProgramSections[programKey] ? (
                          <ChevronDown className="w-6 h-6" />
                        ) : (
                          <ChevronRight className="w-6 h-6" />
                        )}
                      </div>
                    </button>

                    {/* Course Sections */}
                    {expandedProgramSections[programKey] && (
                      <div className="p-4 bg-gray-50 space-y-3">
                        {Object.entries(programSection.courseSections).map(([courseKey, courseSection]) => {
                          const combinedKey = `${programKey}-${courseKey}`
                          return (
                            <div key={courseKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Course Section Header */}
                              <button
                                onClick={() => toggleCourseSection(programKey, courseKey)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <BookOpen className="w-5 h-5 text-[#7a0000]" />
                                  <div className="text-left">
                                    <h4 className="font-semibold text-gray-900">{courseSection.courseCode}</h4>
                                    <p className="text-sm text-gray-600">{courseSection.courseName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    {courseSection.students.length} pending
                                  </span>
                                  {expandedCourseSections[combinedKey] ? (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                  )}
                                </div>
                              </button>

                              {/* Students Table */}
                              {expandedCourseSections[combinedKey] && (
                                <div className="border-t border-gray-200">
                                  <table className="w-full">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Number</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Year Level</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {courseSection.students.map((student) => (
                                        <tr key={student.student_id} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {student.student_number}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-700">
                                            {student.full_name}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {student.year_level}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
