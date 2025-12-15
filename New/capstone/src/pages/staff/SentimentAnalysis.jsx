import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { isAdmin, isStaffMember } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, deptHeadAPI, secretaryAPI } from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'
import { transformPrograms, toDisplayCode } from '../../utils/programMapping'
import CustomDropdown from '../../components/CustomDropdown'

const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'] // Green, Yellow, Red

export default function SentimentAnalysis() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [sentimentData, setSentimentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Anomaly detection state (merged from AnomalyDetection.jsx)
  const [anomalies, setAnomalies] = useState([])
  const [anomaliesLoading, setAnomaliesLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // Debounce search

  // Filter options states
  const [programOptions, setProgramOptions] = useState([])
  const [yearLevelOptions, setYearLevelOptions] = useState([])

  // Evaluation Period states
  const [evaluationPeriods, setEvaluationPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [activePeriod, setActivePeriod] = useState(null)

  // Redirect unauthorized users
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (currentUser.role === 'student') {
      navigate('/student/courses')
      return
    }
    
    if (!isAdmin(currentUser) && !isStaffMember(currentUser)) {
      navigate('/')
      return
    }
  }, [currentUser, navigate])

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!currentUser) return
      
      try {
        let programsResponse, yearLevelsResponse, periodsResponse
        
        if (currentUser.role === 'secretary') {
          [programsResponse, yearLevelsResponse, periodsResponse] = await Promise.all([
            secretaryAPI.getPrograms(),
            secretaryAPI.getYearLevels(),
            secretaryAPI.getEvaluationPeriods()
          ])
        } else if (currentUser.role === 'department_head') {
          [programsResponse, yearLevelsResponse, periodsResponse] = await Promise.all([
            deptHeadAPI.getPrograms(),
            deptHeadAPI.getYearLevels(),
            deptHeadAPI.getEvaluationPeriods()
          ])
        } else if (isAdmin(currentUser)) {
          [programsResponse, periodsResponse] = await Promise.all([
            adminAPI.getPrograms(),
            adminAPI.getEvaluationPeriods()
          ])
        }
        
        if (programsResponse?.data) {
          setProgramOptions(transformPrograms(programsResponse.data))
        }
        if (yearLevelsResponse?.data) {
          setYearLevelOptions(yearLevelsResponse.data)
        }
        if (periodsResponse?.data) {
          setEvaluationPeriods(periodsResponse.data)
          const active = periodsResponse.data.find(p => p.status === 'Open' || p.status === 'active' || p.status === 'Active')
          if (active) {
            setActivePeriod(active.id)
            setSelectedPeriod(active.id)
          }
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }
    
    fetchFilterOptions()
  }, [currentUser?.role])

  // State for evaluations data
  const [evaluations, setEvaluations] = useState([])
  
  // Fetch sentiment analysis and evaluations from API
  useEffect(() => {
    const fetchSentiment = async () => {
      if (!currentUser) return
      
      try {
        setLoading(true)
        
        if (!selectedPeriod && !activePeriod) {
          setSentimentData(null)
          setEvaluations([])
          setLoading(false)
          return
        }
        const filters = {}
        if (selectedSemester !== 'all') filters.semester = selectedSemester
        if (selectedYearLevel !== 'all') filters.yearLevel = selectedYearLevel
        if (selectedProgram !== 'all') filters.program_id = selectedProgram
        if (selectedPeriod) filters.period_id = selectedPeriod
        
        let sentimentResponse, evaluationsResponse
        
        // Use appropriate API based on user role
        if (isAdmin(currentUser)) {
          [sentimentResponse, evaluationsResponse] = await Promise.all([
            adminAPI.getSentimentAnalysis(filters),
            adminAPI.getEvaluations({ ...filters, page: 1, page_size: 100 }) // Limit for performance
          ])
        } else if (currentUser.role === 'secretary') {
          [sentimentResponse, evaluationsResponse] = await Promise.all([
            secretaryAPI.getSentimentAnalysis(filters),
            secretaryAPI.getEvaluations({ ...filters, page: 1, page_size: 100 }) // Limit for performance
          ])
        } else if (currentUser.role === 'department_head') {
          [sentimentResponse, evaluationsResponse] = await Promise.all([
            deptHeadAPI.getSentimentAnalysis(filters),
            deptHeadAPI.getEvaluations({ ...filters, page: 1, page_size: 100 }) // Limit for performance
          ])
        } else {
          throw new Error(`Unsupported role: ${currentUser.role}`)
        }
        
        // Extract data from response (handle both direct object and {success, data} format)
        const sentimentData = sentimentResponse?.data || sentimentResponse
        const evaluationsData = Array.isArray(evaluationsResponse) ? evaluationsResponse : (evaluationsResponse?.data || [])
        
        setSentimentData(sentimentData)
        setEvaluations(evaluationsData)
      } catch (err) {
        console.error('Error fetching sentiment analysis:', err)
        setError(err.message || 'Failed to load sentiment analysis')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSentiment()
  }, [currentUser, selectedSemester, selectedYearLevel, selectedProgram, selectedPeriod])

  // Fetch anomalies (merged from AnomalyDetection.jsx)
  useEffect(() => {
    const fetchAnomalies = async () => {
      if (!currentUser) return
      
      try {
        setAnomaliesLoading(true)
        
        if (!selectedPeriod && !activePeriod) {
          setAnomalies([])
          setAnomaliesLoading(false)
          return
        }
        const params = {}
        if (selectedPeriod) params.period_id = selectedPeriod
        
        let data
        
        // Use appropriate API based on user role
        if (isAdmin(currentUser)) {
          data = await adminAPI.getAnomalies(params)
        } else if (currentUser.role === 'secretary') {
          data = await secretaryAPI.getAnomalies(params)
        } else if (currentUser.role === 'department_head') {
          data = await deptHeadAPI.getAnomalies(params)
        }
        
        // Extract data from response
        const anomaliesData = Array.isArray(data) ? data : (data?.data || [])
        setAnomalies(anomaliesData)
      } catch (err) {
        console.error('Error fetching anomalies:', err)
      } finally {
        setAnomaliesLoading(false)
      }
    }
    
    fetchAnomalies()
  }, [currentUser, selectedPeriod])

  // Filter anomalies by search term
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anomaly => {
      if (searchTerm === '') return true
      return anomaly.courseName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
             anomaly.comment?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    })
  }, [anomalies, searchTerm])

  // Since API doesn't return courses/evaluations arrays, use the trend and summary data
  const sentimentOverview = useMemo(() => {
    // Backend returns 'summary' not 'overall'
    const summary = sentimentData?.summary || sentimentData?.overall
    if (!summary) {
      return { positive: 0, neutral: 0, negative: 0 }
    }
    
    const total = (summary.positive || 0) + (summary.neutral || 0) + (summary.negative || 0)
    
    if (total === 0) {
      return { positive: 0, neutral: 0, negative: 0 }
    }

    return {
      positive: Math.round(((summary.positive || 0) / total) * 100),
      neutral: Math.round(((summary.neutral || 0) / total) * 100),
      negative: Math.round(((summary.negative || 0) / total) * 100)
    }
  }, [sentimentData])

  // Prepare trend data for charts
  const trendData = useMemo(() => {
    if (!sentimentData?.trends || sentimentData.trends.length === 0) {
      return []
    }
    return sentimentData.trends.map(trend => ({
      date: trend.date,
      positive: trend.positive || 0,
      neutral: trend.neutral || 0,
      negative: trend.negative || 0
    }))
  }, [sentimentData])

  // Year level-wise sentiment data - calculate from evaluations
  const yearLevelSentiment = useMemo(() => {
    if (!evaluations || evaluations.length === 0) {
      console.log('[SENTIMENT] No evaluations data:', evaluations)
      return []
    }
    
    console.log('[SENTIMENT] Evaluations count:', evaluations.length)
    console.log('[SENTIMENT] First evaluation sample:', evaluations[0])
    console.log('[SENTIMENT] First eval fields:', Object.keys(evaluations[0] || {}))
    
    const yearLevels = [1, 2, 3, 4]
    
    const result = yearLevels.map(level => {
      const levelEvals = evaluations.filter(e => e.yearLevel === level || e.year_level === level)
      console.log(`[SENTIMENT] Year ${level}: found ${levelEvals.length} evaluations`)
      const positive = levelEvals.filter(e => e.sentiment === 'positive').length
      const neutral = levelEvals.filter(e => e.sentiment === 'neutral').length
      const negative = levelEvals.filter(e => e.sentiment === 'negative').length
      
      return {
        name: `Year ${level}`,
        positive,
        neutral,
        negative,
        total: positive + neutral + negative
      }
    }).filter(level => level.total > 0)
    
    console.log('[SENTIMENT] Year level sentiment result:', result)
    return result
  }, [evaluations])

  // Evaluation criteria breakdown - calculate from evaluations ratings
  const criteriaBreakdown = useMemo(() => {
    if (!evaluations || evaluations.length === 0) {
      console.log('[CRITERIA] No evaluations for criteria breakdown')
      return []
    }
    
    console.log('[CRITERIA] Processing', evaluations.length, 'evaluations')
    console.log('[CRITERIA] First eval ratings:', evaluations[0]?.ratings)
    
    // Define the 6 main categories from the LPU evaluation form
    const categories = {
      "Relevance of Course": { questions: [1, 2, 3, 4, 5, 6], total: 0, count: 0 },
      "Course Organization & ILOs": { questions: [7, 8, 9, 10, 11], total: 0, count: 0 },
      "Teaching - Learning": { questions: [12, 13, 14, 15, 16, 17, 18], total: 0, count: 0 },
      "Assessment": { questions: [19, 20, 21, 22, 23, 24], total: 0, count: 0 },
      "Learning Environment": { questions: [25, 26, 27, 28, 29, 30], total: 0, count: 0 },
      "Counseling": { questions: [31], total: 0, count: 0 }
    }
    
    // Calculate averages from evaluations
    evaluations.forEach(evaluation => {
      const ratings = evaluation.ratings
      if (!ratings || typeof ratings !== 'object') {
        console.log('[CRITERIA] Evaluation has no valid ratings:', evaluation.id)
        return
      }
      
      Object.entries(categories).forEach(([categoryName, categoryData]) => {
        categoryData.questions.forEach(qNum => {
          const qKey = qNum.toString()
          if (ratings[qKey] && typeof ratings[qKey] === 'number') {
            categoryData.total += ratings[qKey]
            categoryData.count += 1
          }
        })
      })
    })
    
    // Format results for display
    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        rating: data.count > 0 ? (data.total / data.count).toFixed(2) : '0.00',
        count: data.count
      }))
      .filter(category => category.count > 0) // Only show categories with data
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)) // Sort by rating
  }, [evaluations])

  if (!currentUser) return null

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mb-4"></div>
          <p className="text-gray-600">Loading sentiment analysis...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Sentiment Analysis</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-6 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced LPU Header */}
      <header className="bg-gradient-to-r from-[#7a0000] to-[#a31111] shadow-lg">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Sentiment Analysis Dashboard</h1>
                <p className="text-[#ffd700] text-sm">
                  {isAdmin(currentUser) ? 'System-wide Academic Excellence Overview' : `${currentUser.department} Department Analysis`}
                </p>
              </div>
            </div>
            
            {/* Filters temporarily hidden - API doesn't support filtering yet */}
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        
        {/* Show warning if no active period and no selection */}
        {!activePeriod && !selectedPeriod ? (
          <div className="lpu-card text-center py-16 mb-10">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Evaluation Period</h3>
            <p className="text-gray-500 mb-4">There is currently no active evaluation period.</p>
            {evaluationPeriods.length > 0 ? (
              <p className="text-gray-500">Click "Show Filters" below and select a past evaluation period to view historical data.</p>
            ) : (
              <p className="text-gray-500">Please contact the administrator to create and activate an evaluation period.</p>
            )}
          </div>
        ) : (
          <>
        {/* Enhanced Sentiment Overview */}
        <div className="bg-white rounded-card shadow-card p-7 lg:p-8 mb-12">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">Academic Sentiment Overview</h2>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {sentimentData?.total_evaluations || sentimentData?.summary ? 
                (sentimentData.total_evaluations || ((sentimentData.summary?.positive || 0) + (sentimentData.summary?.neutral || 0) + (sentimentData.summary?.negative || 0))) : 0
              } total responses
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Positive Feedback</span>
                <span className="text-4xl lg:text-5xl font-bold text-green-600">{sentimentOverview.positive}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${sentimentOverview.positive}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Excellent responses</span>
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Neutral Feedback</span>
                <span className="text-4xl lg:text-5xl font-bold text-yellow-600">{sentimentOverview.neutral}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${sentimentOverview.neutral}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Moderate responses</span>
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Negative Feedback</span>
                <span className="text-4xl lg:text-5xl font-bold text-red-600">{sentimentOverview.negative}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${sentimentOverview.negative}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Needs improvement</span>
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="lpu-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Analysis Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lpu-btn-secondary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
          </div>

          {showFilters && (
            <div className="lpu-card p-6 bg-gray-50 overflow-visible">
              <div className="grid md:grid-cols-4 gap-6 overflow-visible">
                {/* Evaluation Period Filter */}
                <CustomDropdown
                  label="Evaluation Period"
                  value={selectedPeriod?.toString() || ''}
                  onChange={(val) => setSelectedPeriod(val)}
                  options={[
                    { value: '', label: 'Select Period' },
                    ...evaluationPeriods.map(period => ({
                      value: period.id.toString(),
                      label: `${period.name} ${period.status === 'Open' || period.status === 'active' || period.status === 'Active' ? '(Active)' : ''}`
                    }))
                  ]}
                />

                {/* Program Filter */}
                <CustomDropdown
                  label="Academic Program"
                  value={selectedProgram}
                  onChange={(val) => setSelectedProgram(val)}
                  options={[
                    { value: 'all', label: 'All Programs' },
                    ...programOptions.map(program => ({
                      value: program.id.toString(),
                      label: `${program.code} - ${program.name}`
                    }))
                  ]}
                  searchable={programOptions.length > 5}
                />

                {/* Year Level Filter */}
                <CustomDropdown
                  label="Year Level"
                  value={selectedYearLevel}
                  onChange={(val) => setSelectedYearLevel(val)}
                  options={[
                    { value: 'all', label: 'All Year Levels' },
                    ...yearLevelOptions.map(yl => ({
                      value: yl.value,
                      label: yl.label
                    }))
                  ]}
                />

                {/* Semester Filter */}
                <CustomDropdown
                  label="Semester"
                  value={selectedSemester}
                  onChange={(val) => setSelectedSemester(val)}
                  options={[
                    { value: 'all', label: 'All Semesters' },
                    { value: '1', label: 'First Semester' },
                    { value: '2', label: 'Second Semester' },
                    { value: '3', label: 'Summer' }
                  ]}
                />
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedProgram('all')
                    setSelectedYearLevel('all')
                    setSelectedSemester('all')
                  }}
                  className="lpu-btn-secondary"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lpu-btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sentiment Trend and Analysis Grid */}
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 mb-12">
          {/* Academic Year Level Analysis */}
          <div className="bg-white rounded-card shadow-card p-7 lg:p-8">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">Academic Year Level Analysis</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Sentiment distribution across different year levels</p>
            
            {yearLevelSentiment.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={yearLevelSentiment}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                  />
                  <Bar dataKey="positive" fill="#10b981" name="Positive" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="neutral" fill="#f59e0b" name="Neutral" radius={[4, 4, 0, 0]} minPointSize={2} />
                  <Bar dataKey="negative" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} minPointSize={2} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <p>No sentiment data available for the selected filters</p>
              </div>
            )}
          </div>

          {/* Enhanced Criteria Analysis */}
          <div className="bg-white rounded-card shadow-card p-7 lg:p-8">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">Academic Criteria Performance</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Average ratings across evaluation criteria</p>
            
            {criteriaBreakdown.length > 0 ? (
              <div className="space-y-4">
                {criteriaBreakdown.map((criterion, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{criterion.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-4xl lg:text-5xl font-bold text-[#7a0000]">
                            {parseFloat(criterion.rating).toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-sm">/ 4.0</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        {[1, 2, 3, 4].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= parseFloat(criterion.rating) ? 'text-[#ffd700]' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            parseFloat(criterion.rating) >= 3.5 ? 'bg-green-500' :
                            parseFloat(criterion.rating) >= 2.5 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(parseFloat(criterion.rating) / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <p>No evaluation criteria data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Interactive Features Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Interactive Analytics Dashboard</h3>
              <p className="text-blue-800 text-sm">
                Hover over chart elements to see detailed information. Click on legend items to hide/show data series.
                Use the academic period and year level filters to view specific segment analysis.
              </p>
            </div>
          </div>
        </div>

        {/* ===== ANOMALY DETECTION SECTION (Merged from AnomalyDetection.jsx) ===== */}
        <div className="mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              Anomaly Detection
            </h2>
            <p className="text-gray-600">
              Identifies suspicious evaluation patterns including straight-lining, outliers, and contradictory responses
            </p>
          </div>

          {/* Anomaly Summary Cards */}
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6 mb-12">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-card shadow-card p-7 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white/90 mb-2">Total Anomalies</h3>
                  <p className="text-4xl lg:text-5xl font-bold text-white">{anomalies.length}</p>
                  <p className="text-xs text-white/70 mt-1">Detected issues</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white/90 mb-2">Filtered Results</h3>
                  <p className="text-4xl lg:text-5xl font-bold text-white">{filteredAnomalies.length}</p>
                  <p className="text-xs text-white/70 mt-1">Matching search</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-card shadow-card p-7 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white/90 mb-2">Flagged Rate</h3>
                  <p className="text-4xl lg:text-5xl font-bold text-white">
                    {sentimentData?.overall ?
                      Math.round((anomalies.length / (sentimentData.overall.positive + sentimentData.overall.neutral + sentimentData.overall.negative)) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-white/70 mt-1">Of total evaluations</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search anomalies by course or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="lpu-input pl-12"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          {/* Anomalies Table */}
          <div className="lpu-card overflow-hidden">
            <div className="overflow-x-auto">
              {anomaliesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <svg className="animate-spin h-8 w-8 text-[#7a0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : filteredAnomalies.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Course</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Anomaly Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAnomalies.map((anomaly, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{anomaly.courseName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{anomaly.courseCode || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            anomaly.anomalyReason?.includes('straight') ? 'bg-red-100 text-red-800' :
                            anomaly.anomalyReason?.includes('outlier') ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {anomaly.anomalyReason || 'Detected'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            <span className="font-medium">{anomaly.ratingOverall || 'N/A'}</span>
                            <span className="text-gray-400 mx-1">/</span>
                            <span className="text-gray-500">4.0</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {anomaly.submissionDate ? new Date(anomaly.submissionDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-lg font-medium">No anomalies detected</p>
                  <p className="text-sm">All evaluations appear to be legitimate</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
