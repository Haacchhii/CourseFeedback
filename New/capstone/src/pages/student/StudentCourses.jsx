import React, { useState, useEffect } from 'react'
import { studentAPI } from '../../services/api'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'
import { toDisplayCode } from '../../utils/programMapping'

// Helper function to calculate time remaining
function getTimeRemaining(endDateStr) {
  if (!endDateStr) return null
  
  const endDate = new Date(endDateStr + 'T23:59:59')
  const now = new Date()
  const diff = endDate - now
  
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { expired: false, days, hours, minutes }
}

export default function StudentCourses(){
  const nav = useNavigate()
  const { user, logout: authLogout } = useAuth()
  
  // State
  const [currentStudent, setCurrentStudent] = useState(null)
  const [studentCourses, setStudentCourses] = useState([])
  const [evaluationHistory, setEvaluationHistory] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [availablePeriods, setAvailablePeriods] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [evaluationStatus, setEvaluationStatus] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)

  // Get student info
  useEffect(() => {
    let student = user
    if (!student) {
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        student = JSON.parse(storedUser)
      }
    }
    setCurrentStudent(student)
  }, [user])

  // Use timeout hook for API call
  const { data: coursesData, loading, error, retry } = useApiWithTimeout(
    async () => {
      if (!currentStudent?.id) return { data: [] }
      const response = await studentAPI.getCourses(currentStudent.id)
      return response
    },
    [currentStudent?.id]
  )

  // Update courses when data changes
  useEffect(() => {
    if (coursesData) {
      let courses = []
      if (Array.isArray(coursesData)) {
        courses = coursesData
      } else if (coursesData?.data && Array.isArray(coursesData.data)) {
        courses = coursesData.data
      } else if (coursesData?.success && Array.isArray(coursesData.data)) {
        courses = coursesData.data
      }
      setStudentCourses(courses)
      
      // Extract evaluation status info from API response
      if (coursesData?.evaluation_status) {
        setEvaluationStatus(coursesData.evaluation_status)
      }
    }
  }, [coursesData])
  
  // Update time remaining countdown every minute
  useEffect(() => {
    if (!evaluationStatus?.period_end_date) return
    
    const updateCountdown = () => {
      setTimeRemaining(getTimeRemaining(evaluationStatus.period_end_date))
    }
    
    updateCountdown() // Initial calculation
    const interval = setInterval(updateCountdown, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [evaluationStatus?.period_end_date])
  
  function logout(){ 
    authLogout()
  }

  // Fetch evaluation history
  const fetchEvaluationHistory = async () => {
    if (!currentStudent?.id) return
    
    setHistoryLoading(true)
    try {
      const response = await studentAPI.getEvaluationHistory(
        currentStudent.id, 
        selectedPeriod || null
      )
      
      if (response.success) {
        setEvaluationHistory(response.data || [])
        setAvailablePeriods(response.available_periods || [])
      }
    } catch (err) {
      setEvaluationHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // Fetch history on mount and when period filter changes
  useEffect(() => {
    if (currentStudent?.id) {
      fetchEvaluationHistory()
    }
  }, [currentStudent?.id, selectedPeriod])

  // Loading and error states
  if (!currentStudent) return <LoadingSpinner message="Loading student info..." />
  if (loading) return <LoadingSpinner message="Loading your courses..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      <div className="w-full mx-auto max-w-screen-2xl px-6 sm:px-8 lg:px-10 py-10 lg:py-12">
        {/* Header Section */}
        <div className="bg-white rounded-card shadow-card border border-gray-200 p-6 lg:p-8 mb-6 lg:mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-sm md:text-base text-gray-600">
              {currentStudent.name} • {toDisplayCode(currentStudent.program)} • Year {currentStudent.year_level || currentStudent.yearLevel}
            </p>
          </div>
        </div>

        {/* Evaluation Period Countdown Warning */}
        {evaluationStatus?.active_period_exists && timeRemaining && !timeRemaining.expired && (
          <div className={`rounded-card shadow-card border p-4 lg:p-5 mb-6 lg:mb-8 ${
            timeRemaining.days <= 1 
              ? 'bg-red-50 border-red-300' 
              : timeRemaining.days <= 3 
                ? 'bg-amber-50 border-amber-300' 
                : 'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                timeRemaining.days <= 1 
                  ? 'bg-red-100' 
                  : timeRemaining.days <= 3 
                    ? 'bg-amber-100' 
                    : 'bg-blue-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  timeRemaining.days <= 1 
                    ? 'text-red-600' 
                    : timeRemaining.days <= 3 
                      ? 'text-amber-600' 
                      : 'text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  timeRemaining.days <= 1 
                    ? 'text-red-800' 
                    : timeRemaining.days <= 3 
                      ? 'text-amber-800' 
                      : 'text-blue-800'
                }`}>
                  {timeRemaining.days <= 1 
                    ? '⚠️ Evaluation Period Ending Soon!' 
                    : timeRemaining.days <= 3 
                      ? '⏰ Evaluation Period Deadline Approaching' 
                      : '📋 Active Evaluation Period'}
                </h3>
                <p className={`text-sm ${
                  timeRemaining.days <= 1 
                    ? 'text-red-700' 
                    : timeRemaining.days <= 3 
                      ? 'text-amber-700' 
                      : 'text-blue-700'
                }`}>
                  {evaluationStatus.active_period_name && (
                    <span className="font-medium">{evaluationStatus.active_period_name}: </span>
                  )}
                  <span className="font-bold">
                    {timeRemaining.days > 0 && `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''}, `}
                    {timeRemaining.hours} hour{timeRemaining.hours !== 1 ? 's' : ''}, {timeRemaining.minutes} minute{timeRemaining.minutes !== 1 ? 's' : ''} remaining
                  </span>
                </p>
                {evaluationStatus.evaluable_courses > 0 && (
                  <p className={`text-xs mt-1 ${
                    timeRemaining.days <= 1 
                      ? 'text-red-600' 
                      : timeRemaining.days <= 3 
                        ? 'text-amber-600' 
                        : 'text-blue-600'
                  }`}>
                    You have {evaluationStatus.evaluable_courses} course{evaluationStatus.evaluable_courses !== 1 ? 's' : ''} pending evaluation
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div className="bg-white rounded-card shadow-card border border-gray-200 overflow-hidden">
          {studentCourses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500 text-sm">No courses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Course Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Class Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Subject Name</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {studentCourses.map(c => (
                    <tr
                      key={c.class_section_id || `${c.id}-${c.class_code}`}
                      onClick={() => nav(`/student/evaluate/${c.class_section_id || c.id}`)}
                      className={`cursor-pointer transition-all hover:bg-blue-50 ${
                        c.already_evaluated ? 'bg-green-50/30' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-blue-600">{c.code}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-700">{c.class_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-sm text-gray-600">{c.semester}</span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {c.already_evaluated ? (
                          <div className="flex items-center justify-center gap-4 lg:gap-5">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              Evaluated
                            </span>
                            {/* Edit button removed - evaluations cannot be edited once submitted */}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Evaluation History Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Evaluation History</h2>
            
            {/* Period Filter */}
            {availablePeriods.length > 0 && (
              <div className="sm:w-64">
                <select
                  className="lpu-select"
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                >
                  <option value="">All Periods</option>
                  {availablePeriods.map(period => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.evaluation_count} evaluation{period.evaluation_count !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* History Content */}
          <div className="bg-white rounded-card shadow-card border border-gray-200 overflow-hidden">
            {historyLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#7a0000] border-r-transparent"></div>
                <p className="text-gray-500 text-sm mt-4">Loading history...</p>
              </div>
            ) : evaluationHistory.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-sm">No evaluation history found</p>
                {selectedPeriod && (
                  <p className="text-gray-400 text-xs mt-2">Try selecting a different period</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Course</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Evaluation Period</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider w-40">Submitted</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider w-32">Rating</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider w-32">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {evaluationHistory.map((evaluation, idx) => {
                      const hasResponse = evaluation.evaluation_id && evaluation.submission_date
                      return (
                      <tr key={evaluation.evaluation_id || `no-eval-${idx}`} className={`hover:bg-gray-50 transition-colors ${!hasResponse ? 'bg-yellow-50/30' : ''}`}>
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-base font-medium text-gray-900">{evaluation.course.subject_name}</div>
                            <div className="text-sm text-gray-500 mt-1">{evaluation.course.class_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <div className="text-base font-medium text-gray-900">{evaluation.evaluation_period.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {evaluation.evaluation_period.semester} • {evaluation.evaluation_period.academic_year}
                            </div>
                            <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                              evaluation.evaluation_period.status === 'active' || evaluation.evaluation_period.status === 'Open'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {evaluation.evaluation_period.status === 'active' || evaluation.evaluation_period.status === 'Open' ? 'Active' : 'Closed'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          {hasResponse ? (
                            <span className="text-sm text-gray-600">
                              {new Date(evaluation.submission_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              No Response
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          {hasResponse ? (
                            <div className="flex items-center justify-center">
                              <span className="text-lg font-semibold text-blue-600">{evaluation.rating_overall?.toFixed(1) || 'N/A'}</span>
                              <span className="text-sm text-gray-500 ml-1">/4</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          {hasResponse && evaluation.sentiment ? (
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                              evaluation.sentiment === 'positive' 
                                ? 'bg-green-100 text-green-800'
                                : evaluation.sentiment === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {evaluation.sentiment === 'positive' && (
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"/>
                                </svg>
                              )}
                              {evaluation.sentiment === 'negative' && (
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-5.172 7.414a1 1 0 001.415-1.414 3 3 0 014.242 0 1 1 0 001.415 1.414 5 5 0 00-7.072 0z" clipRule="evenodd"/>
                                </svg>
                              )}
                              {evaluation.sentiment.charAt(0).toUpperCase() + evaluation.sentiment.slice(1)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
