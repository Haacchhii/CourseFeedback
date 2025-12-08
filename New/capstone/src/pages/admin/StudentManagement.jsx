import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../utils/roleUtils'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'

export default function StudentManagement() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [eligibilityData, setEligibilityData] = useState(null)
  const [studentsByYear, setStudentsByYear] = useState(null)
  const [advancementResult, setAdvancementResult] = useState(null)
  const [transitionResult, setTransitionResult] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [rollbackResult, setRollbackResult] = useState(null)
  
  // Form states
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedYearLevel, setSelectedYearLevel] = useState('')
  const [isDryRun, setIsDryRun] = useState(true)
  
  // Transition form states
  const [fromPeriodId, setFromPeriodId] = useState('')
  const [toPeriodId, setToPeriodId] = useState('')
  const [autoAdvanceYear, setAutoAdvanceYear] = useState(false)
  const [isTransitionDryRun, setIsTransitionDryRun] = useState(true)
  
  // Rollback form states
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('')
  const [isRollbackDryRun, setIsRollbackDryRun] = useState(true)
  
  // Evaluation periods
  const [evaluationPeriods, setEvaluationPeriods] = useState([])
  
  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redirect if not admin
  useEffect(() => {
    if (!currentUser || !isAdmin(currentUser)) {
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  // Fetch eligibility report on mount
  useEffect(() => {
    fetchEligibilityReport()
    fetchEvaluationPeriods()
    if (activeTab === 'rollback') {
      fetchSnapshots()
    }
  }, [activeTab])

  const fetchEligibilityReport = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAdvancementEligibility()
      setEligibilityData(response.data)
    } catch (err) {
      console.error('Error fetching eligibility:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvaluationPeriods = async () => {
    try {
      const response = await adminAPI.getEvaluationPeriods()
      setEvaluationPeriods(response.data || [])
    } catch (err) {
      console.error('Error fetching periods:', err)
    }
  }

  const fetchSnapshots = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAdvancementSnapshots(20)
      setSnapshots(response.data?.snapshots || [])
    } catch (err) {
      console.error('Error fetching snapshots:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsByYear = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedYearLevel) params.year_level = selectedYearLevel
      if (selectedProgram) params.program_id = selectedProgram
      
      const response = await adminAPI.getStudentsByYearLevel(params)
      setStudentsByYear(response.data)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceStudents = async (skipConfirmation = false) => {
    if (!isDryRun && !skipConfirmation) {
      setConfirmAction('advance')
      setShowConfirmModal(true)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setAdvancementResult(null)
      
      const payload = {
        dry_run: isDryRun
      }
      if (selectedProgram) payload.program_id = parseInt(selectedProgram)
      if (selectedYearLevel) payload.current_year_level = parseInt(selectedYearLevel)
      
      const response = await adminAPI.advanceStudents(payload)
      setAdvancementResult(response.data)
      
      if (!isDryRun) {
        // Refresh eligibility data after real execution
        await fetchEligibilityReport()
      }
    } catch (err) {
      console.error('Error advancing students:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  const handleTransitionEnrollments = async (skipConfirmation = false) => {
    if (!isTransitionDryRun && !skipConfirmation) {
      setConfirmAction('transition')
      setShowConfirmModal(true)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setTransitionResult(null)
      
      const payload = {
        from_period_id: parseInt(fromPeriodId),
        to_period_id: parseInt(toPeriodId),
        auto_advance_year: autoAdvanceYear,
        dry_run: isTransitionDryRun
      }
      
      const response = await adminAPI.transitionEnrollments(payload)
      setTransitionResult(response.data)
      
      if (!isTransitionDryRun && autoAdvanceYear) {
        // Refresh eligibility data if year was advanced
        await fetchEligibilityReport()
      }
    } catch (err) {
      console.error('Error transitioning enrollments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  const handleRollbackAdvancement = async (skipConfirmation = false) => {
    if (!isRollbackDryRun && !skipConfirmation) {
      setConfirmAction('rollback')
      setShowConfirmModal(true)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setRollbackResult(null)
      
      const payload = {
        snapshot_id: selectedSnapshotId ? parseInt(selectedSnapshotId) : null,
        dry_run: isRollbackDryRun
      }
      
      const response = await adminAPI.rollbackAdvancement(payload)
      setRollbackResult(response.data)
      
      if (!isRollbackDryRun) {
        // Refresh data after real execution
        await fetchEligibilityReport()
        await fetchSnapshots()
      }
    } catch (err) {
      console.error('Error rolling back advancement:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  const confirmExecute = () => {
    if (confirmAction === 'advance') {
      setIsDryRun(false)
      handleAdvanceStudents(true)
    } else if (confirmAction === 'transition') {
      setIsTransitionDryRun(false)
      handleTransitionEnrollments(true)
    } else if (confirmAction === 'rollback') {
      setIsRollbackDryRun(false)
      handleRollbackAdvancement(true)
    }
  }

  if (loading && !eligibilityData) {
    return <LoadingSpinner message="Loading student management..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      {/* Header */}
      <header className="lpu-header">
        <div className="container mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-5">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl lg:text-4xl">Student Year Level Management</h1>
                <p className="lpu-header-subtitle text-base lg:text-lg mt-1">Advancement & Enrollment Transitions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Tabs */}
        <div className="mb-8 flex space-x-2 bg-white rounded-xl p-2 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#7a0000] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('advance')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'advance'
                ? 'bg-[#7a0000] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🎓 Year Advancement
          </button>
          <button
            onClick={() => setActiveTab('transition')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'transition'
                ? 'bg-[#7a0000] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔄 Enrollment Transition
          </button>
          <button
            onClick={() => setActiveTab('rollback')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'rollback'
                ? 'bg-[#7a0000] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⏪ Rollback/Undo
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && eligibilityData && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">📈 Advancement Eligibility Summary</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-white/80 text-sm font-medium mb-2">Total Eligible Students</p>
                  <p className="text-5xl font-bold">{eligibilityData.total_eligible}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-white/80 text-sm font-medium mb-2">Year 1 → Year 2</p>
                  <p className="text-5xl font-bold">{eligibilityData.by_year_level?.['1'] || 0}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-white/80 text-sm font-medium mb-2">Year 2 → Year 3</p>
                  <p className="text-5xl font-bold">{eligibilityData.by_year_level?.['2'] || 0}</p>
                </div>
              </div>
              <div className="mt-4 bg-white/20 rounded-lg p-6 inline-block">
                <p className="text-white/80 text-sm font-medium mb-2">Year 3 → Year 4</p>
                <p className="text-5xl font-bold">{eligibilityData.by_year_level?.['3'] || 0}</p>
              </div>
            </div>

            {/* Program Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 By Program</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(eligibilityData.by_program || {}).map(([code, data]) => (
                  <div key={code} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-[#7a0000] text-lg mb-3">{code}</h4>
                    <p className="text-sm text-gray-600 mb-4">{data.program_name}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year 1:</span>
                        <span className="font-semibold">{data.year_1 || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year 2:</span>
                        <span className="font-semibold">{data.year_2 || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year 3:</span>
                        <span className="font-semibold">{data.year_3 || 0}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-800 font-medium">Total Eligible:</span>
                        <span className="font-bold text-[#7a0000]">{data.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Year Advancement Tab */}
        {activeTab === 'advance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🎓 Advance Students to Next Year Level</h2>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>ℹ️ How it works:</strong> This will advance students from Year 1→2, Year 2→3, or Year 3→4. 
                  Year 4 students are not advanced (they graduate). Use dry run mode first to preview changes!
                </p>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Filter by Program (Optional)
                    </label>
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    >
                      <option value="">All Programs</option>
                      {Object.entries(eligibilityData?.by_program || {}).map(([code, data]) => (
                        <option key={code} value={data.program_id}>{code} - {data.program_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Filter by Current Year Level (Optional)
                    </label>
                    <select
                      value={selectedYearLevel}
                      onChange={(e) => setSelectedYearLevel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    >
                      <option value="">All Year Levels</option>
                      <option value="1">Year 1 only</option>
                      <option value="2">Year 2 only</option>
                      <option value="3">Year 3 only</option>
                    </select>
                  </div>
                </div>

                {/* Dry Run Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="dryRun"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    className="w-5 h-5 text-[#7a0000] rounded focus:ring-2 focus:ring-[#7a0000]"
                  />
                  <label htmlFor="dryRun" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    🔒 Dry Run Mode (Preview Only - Recommended)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleAdvanceStudents()}
                    disabled={loading}
                    className="flex-1 bg-[#7a0000] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#9a1000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{isDryRun ? '🔍 Preview Advancement' : '✅ Execute Advancement'}</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedProgram('')
                      setSelectedYearLevel('')
                      setIsDryRun(true)
                      setAdvancementResult(null)
                      setError(null)
                    }}
                    className="px-6 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>

              {/* Results */}
              {advancementResult && (
                <div className={`mt-8 rounded-lg p-6 ${advancementResult.dry_run ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${advancementResult.dry_run ? 'text-blue-800' : 'text-green-800'}`}>
                    {advancementResult.dry_run ? '🔍 Preview Results' : '✅ Advancement Complete!'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-2xl font-bold text-gray-800">
                        {advancementResult.students_advanced} students {advancementResult.dry_run ? 'would be' : 'were'} advanced
                      </p>
                    </div>

                    {advancementResult.advancement_plan && Object.entries(advancementResult.advancement_plan).map(([fromYear, data]) => (
                      <div key={fromYear} className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Year {data.from_year} → Year {data.to_year}: {data.students.length} students
                        </h4>
                        <div className="text-sm text-gray-600">
                          {data.students.slice(0, 5).map((student, idx) => (
                            <div key={idx} className="py-1">
                              • {student.student_number} - {student.name} ({student.program})
                            </div>
                          ))}
                          {data.students.length > 5 && (
                            <div className="py-1 text-gray-500">... and {data.students.length - 5} more</div>
                          )}
                        </div>
                      </div>
                    ))}

                    {advancementResult.dry_run ? (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-semibold">
                          💡 This was a preview. Uncheck "Dry Run Mode" and click "Execute Advancement" to apply changes.
                        </p>
                      </div>
                    ) : advancementResult.snapshot_id && (
                      <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                        <p className="text-green-800 text-sm font-semibold mb-2">
                          ✅ Snapshot Created: #{advancementResult.snapshot_id}
                        </p>
                        <p className="text-green-700 text-xs">
                          If you need to undo this advancement, go to the "Rollback/Undo" tab and select snapshot #{advancementResult.snapshot_id}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enrollment Transition Tab */}
        {activeTab === 'transition' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🔄 Transition Enrollments to New Period</h2>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>ℹ️ How it works:</strong> This copies student enrollments from one evaluation period to another. 
                  Check "Advance Year Level" if transitioning from 3rd semester to 1st semester (new academic year).
                </p>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      From Period <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fromPeriodId}
                      onChange={(e) => setFromPeriodId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    >
                      <option value="">Select source period...</option>
                      {evaluationPeriods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.name} ({period.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To Period <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={toPeriodId}
                      onChange={(e) => setToPeriodId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    >
                      <option value="">Select target period...</option>
                      {evaluationPeriods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.name} ({period.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Auto Advance Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="autoAdvance"
                    checked={autoAdvanceYear}
                    onChange={(e) => setAutoAdvanceYear(e.target.checked)}
                    className="w-5 h-5 text-[#7a0000] rounded focus:ring-2 focus:ring-[#7a0000]"
                  />
                  <label htmlFor="autoAdvance" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    📅 Advance Year Level (Check if new academic year - 3rd sem → 1st sem)
                  </label>
                </div>

                {/* Dry Run Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="transitionDryRun"
                    checked={isTransitionDryRun}
                    onChange={(e) => setIsTransitionDryRun(e.target.checked)}
                    className="w-5 h-5 text-[#7a0000] rounded focus:ring-2 focus:ring-[#7a0000]"
                  />
                  <label htmlFor="transitionDryRun" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    🔒 Dry Run Mode (Preview Only - Recommended)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleTransitionEnrollments()}
                    disabled={loading || !fromPeriodId || !toPeriodId}
                    className="flex-1 bg-[#7a0000] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#9a1000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{isTransitionDryRun ? '🔍 Preview Transition' : '✅ Execute Transition'}</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setFromPeriodId('')
                      setToPeriodId('')
                      setAutoAdvanceYear(false)
                      setIsTransitionDryRun(true)
                      setTransitionResult(null)
                      setError(null)
                    }}
                    className="px-6 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>

              {/* Results */}
              {transitionResult && (
                <div className={`mt-8 rounded-lg p-6 ${transitionResult.dry_run ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${transitionResult.dry_run ? 'text-blue-800' : 'text-green-800'}`}>
                    {transitionResult.dry_run ? '🔍 Preview Results' : '✅ Transition Complete!'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">From Period:</span>
                        <span className="font-semibold">{transitionResult.from_period}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To Period:</span>
                        <span className="font-semibold">{transitionResult.to_period}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Academic Year:</span>
                        <span className="font-semibold">{transitionResult.is_new_academic_year ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-800 font-medium">Students Affected:</span>
                        <span className="font-bold text-[#7a0000]">{transitionResult.students_affected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Enrollments Created:</span>
                        <span className="font-bold text-[#7a0000]">{transitionResult.enrollments_created}</span>
                      </div>
                      {transitionResult.students_advanced > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-800 font-medium">Students Advanced:</span>
                          <span className="font-bold text-green-600">{transitionResult.students_advanced}</span>
                        </div>
                      )}
                    </div>

                    {transitionResult.dry_run && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-semibold">
                          💡 This was a preview. Uncheck "Dry Run Mode" and click "Execute Transition" to apply changes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rollback/Undo Tab */}
        {activeTab === 'rollback' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">⏪ Rollback Student Year Level Advancement</h2>
              
              {/* Warning Box */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-red-800 font-bold mb-1">⚠️ EMERGENCY ROLLBACK FEATURE</p>
                    <p className="text-red-700 text-sm">
                      Use this ONLY if students were advanced by mistake! This will restore year levels to a previous snapshot.
                      A snapshot is automatically created every time you advance students.
                    </p>
                  </div>
                </div>
              </div>

              {/* Snapshots List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📸 Available Snapshots (Backups)</h3>
                
                {snapshots.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No snapshots available. Snapshots are created automatically when you advance students.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {snapshots.map((snapshot) => (
                      <div
                        key={snapshot.snapshot_id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedSnapshotId === String(snapshot.snapshot_id)
                            ? 'border-[#7a0000] bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => setSelectedSnapshotId(String(snapshot.snapshot_id))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="snapshot"
                                checked={selectedSnapshotId === String(snapshot.snapshot_id)}
                                onChange={() => setSelectedSnapshotId(String(snapshot.snapshot_id))}
                                className="w-4 h-4 text-[#7a0000]"
                              />
                              <div>
                                <p className="font-semibold text-gray-800">
                                  Snapshot #{snapshot.snapshot_id}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(snapshot.timestamp).toLocaleString()} • {snapshot.student_count} students
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {snapshot.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          {selectedSnapshotId === String(snapshot.snapshot_id) && (
                            <div className="bg-[#7a0000] text-white text-xs font-bold px-3 py-1 rounded-full">
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Snapshot Option */}
              <div className="mb-6">
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSnapshotId === ''
                      ? 'border-[#7a0000] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedSnapshotId('')}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="snapshot"
                      checked={selectedSnapshotId === ''}
                      onChange={() => setSelectedSnapshotId('')}
                      className="w-4 h-4 text-[#7a0000]"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">⚡ Latest Snapshot (Auto-select most recent)</p>
                      <p className="text-sm text-gray-600">Automatically uses the most recent backup</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dry Run Toggle */}
              <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <input
                  type="checkbox"
                  id="rollbackDryRun"
                  checked={isRollbackDryRun}
                  onChange={(e) => setIsRollbackDryRun(e.target.checked)}
                  className="w-5 h-5 text-[#7a0000] rounded focus:ring-2 focus:ring-[#7a0000]"
                />
                <label htmlFor="rollbackDryRun" className="text-sm font-semibold text-gray-800 cursor-pointer">
                  🔒 Dry Run Mode (Preview Only - HIGHLY Recommended)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => handleRollbackAdvancement()}
                  disabled={loading || snapshots.length === 0}
                  className="flex-1 bg-orange-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRollbackDryRun ? '🔍 Preview Rollback' : '⏪ Execute Rollback'}</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => fetchSnapshots()}
                  disabled={loading}
                  className="px-6 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  🔄 Refresh Snapshots
                </button>
              </div>

              {/* Results */}
              {rollbackResult && (
                <div className={`mt-8 rounded-lg p-6 ${rollbackResult.dry_run ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${rollbackResult.dry_run ? 'text-blue-800' : 'text-green-800'}`}>
                    {rollbackResult.dry_run ? '🔍 Preview Results' : '✅ Rollback Complete!'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Snapshot Used:</span>
                        <span className="font-semibold">#{rollbackResult.snapshot_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Snapshot Date:</span>
                        <span className="font-semibold">{new Date(rollbackResult.snapshot_timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-800 font-medium">Students Rolled Back:</span>
                        <span className="font-bold text-[#7a0000]">{rollbackResult.students_rolled_back}</span>
                      </div>
                    </div>

                    {rollbackResult.rollback_plan && Object.keys(rollbackResult.rollback_plan).length > 0 && (
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Rollback Details:</h4>
                        {Object.entries(rollbackResult.rollback_plan).map(([transition, students]) => (
                          <div key={transition} className="mb-2">
                            <p className="text-sm font-semibold text-gray-700">
                              Year {transition}: {students.length} students
                            </p>
                            <div className="text-xs text-gray-600 ml-4">
                              {students.slice(0, 3).map((name, idx) => (
                                <div key={idx}>• {name}</div>
                              ))}
                              {students.length > 3 && (
                                <div className="text-gray-500">... and {students.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {rollbackResult.students_rolled_back === 0 && (
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                        <p className="text-blue-800 text-sm font-semibold">
                          ℹ️ No changes needed. Student year levels already match the snapshot.
                        </p>
                      </div>
                    )}

                    {rollbackResult.dry_run && rollbackResult.students_rolled_back > 0 && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm font-semibold">
                          💡 This was a preview. Uncheck "Dry Run Mode" and click "Execute Rollback" to restore year levels.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">⚠️ Confirm Action</h3>
              <p className="text-gray-600">
                {confirmAction === 'advance' 
                  ? 'You are about to PERMANENTLY advance students to the next year level. A snapshot will be created automatically for rollback if needed.'
                  : confirmAction === 'transition'
                  ? 'You are about to PERMANENTLY create enrollments for the new period. This action will affect all students.'
                  : 'You are about to RESTORE student year levels to a previous state. This will UNDO recent advancements.'}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExecute}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Confirm Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
