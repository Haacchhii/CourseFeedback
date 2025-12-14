import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'
import { AlertModal, ConfirmModal } from '../../components/Modal'

export default function EvaluationPeriodManagement() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // Helper function to check if period is open (backend uses "Open", frontend checks both)
  const isOpen = (status) => status === 'Open' || status === 'active'
  const isClosed = (status) => status === 'Closed' || status === 'closed'
  
  // State
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [pastPeriods, setPastPeriods] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)

  // Modal State
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', cancelText: 'Cancel' })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [periodToExtend, setPeriodToExtend] = useState(null)
  const [formData, setFormData] = useState({
    semester: '1st Semester',
    academicYear: '2025-2026',
    startDate: '',
    endDate: '',
    notifyUsers: true
  })

  // Enrollment Management State
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrolledProgramSections, setEnrolledProgramSections] = useState([])
  const [availableProgramSections, setAvailableProgramSections] = useState([])
  const [enrollFormData, setEnrollFormData] = useState({
    programSectionId: ''
  })
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)

  // Use timeout hook for API call
  const { data: periodsData, loading, error, retry } = useApiWithTimeout(
    () => adminAPI.getPeriods(),
    [currentUser?.id, currentUser?.role]
  )

  // Update periods when data changes
  useEffect(() => {
    if (periodsData?.data) {
      const periods = periodsData.data
      const current = periods.find(p => p.status === 'Open' || isOpen(p.status)) || null
      const past = periods.filter(p => isClosed(p.status) || isClosed(p.status))
      setCurrentPeriod(current)
      setPastPeriods(past)
    }
  }, [periodsData])

  // Load available sections when modal opens
  useEffect(() => {
    if (showEnrollModal && currentPeriod?.id) {
      loadAvailableSections()
    }
  }, [showEnrollModal, currentPeriod?.id])

  const loadAvailableSections = async () => {
    try {
      setLoadingSections(true)
      const response = await adminAPI.getProgramSections({ is_active: true })
      setAvailableProgramSections(response?.data || [])
    } catch (err) {
      console.error('Failed to load program sections:', err)
    } finally {
      setLoadingSections(false)
    }
  }

  // Load enrolled sections when current period changes
  useEffect(() => {
    if (currentPeriod?.id) {
      loadEnrolledSections()
    }
  }, [currentPeriod?.id])

  const loadEnrolledSections = async () => {
    if (!currentPeriod?.id) return
    try {
      setLoadingEnrollments(true)
      const response = await adminAPI.getPeriodEnrolledProgramSections(currentPeriod.id)
      setEnrolledProgramSections(response?.data || [])
    } catch (err) {
      console.error('Failed to load enrolled program sections:', err)
    } finally {
      setLoadingEnrollments(false)
    }
  }

  // Modal Helper Functions
  const showAlert = (message, title = 'Notification', type = 'info') => {
    setAlertConfig({ title, message, type })
    setShowAlertModal(true)
  }

  const showConfirm = (message, onConfirm, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmConfig({ title, message, onConfirm, confirmText, cancelText })
    setShowConfirmModal(true)
  }

  // Redirect if not system admin
  useEffect(() => {
    if (currentUser && !isSystemAdmin(currentUser)) {
      navigate('/dashboard')
    }
  }, [currentUser?.role, currentUser?.id, navigate])

  const handleClosePeriod = async () => {
    if (!currentPeriod) return
    
    showConfirm(
      `Close "${currentPeriod.name}"?\n\nThis will prevent any further evaluations from being submitted. This action cannot be undone.`,
      async () => {
        try {
          setSubmitting(true)
          await adminAPI.updatePeriodStatus(currentPeriod.id, 'closed')

          // Refresh periods
          const response = await adminAPI.getPeriods()
          const periods = response?.data || []
          const current = periods.find(p => isOpen(p.status)) || null
          const past = periods.filter(p => isClosed(p.status))
          setCurrentPeriod(current)
          setPastPeriods(past)
          
          showAlert('Evaluation period closed successfully!', 'Success', 'success')
        } catch (err) {
          showAlert(`Failed to close period: ${err.message}`, 'Error', 'error')
        } finally {
          setSubmitting(false)
        }
      },
      'Close Period',
      'Close Period',
      'Cancel'
    )
  }

  const handleOpenPeriod = async () => {
    if (!currentPeriod) return
    
    showConfirm(
      `Reopen "${currentPeriod.name}"?\n\nStudents will be able to submit evaluations again.`,
      async () => {
        try {
          setSubmitting(true)
          await adminAPI.updatePeriodStatus(currentPeriod.id, 'active')

          // Refresh periods
          const response = await adminAPI.getPeriods()
          const periods = response?.data || []
          const current = periods.find(p => isOpen(p.status)) || null
          const past = periods.filter(p => isClosed(p.status))
          setCurrentPeriod(current)
          setPastPeriods(past)
          
          showAlert('Evaluation period reopened successfully!', 'Success', 'success')
        } catch (err) {
          showAlert(`Failed to reopen period: ${err.message}`, 'Error', 'error')
        } finally {
          setSubmitting(false)
        }
      },
      'Reopen Period',
      'Reopen Period',
      'Cancel'
    )
  }

  const handleExtendPeriod = async (e) => {
    e.preventDefault()
    const targetPeriod = periodToExtend || currentPeriod
    if (!targetPeriod) return

    const newEndDate = new Date(formData.endDate)
    const currentEndDate = new Date(targetPeriod.endDate)
    
    if (newEndDate <= currentEndDate) {
      showAlert('New end date must be after the current end date.', 'Invalid Date', 'warning')
      return
    }

    const confirmMsg = isClosed(targetPeriod.status)
      ? `Extend and Reopen "${targetPeriod.name}"?\n\nThis will:\n• Extend the period to ${formData.endDate}\n• Reopen the period for new submissions\n• Send notifications to all enrolled students`
      : `Extend "${targetPeriod.name}" to ${formData.endDate}?\n\nThis will send notifications to all enrolled students.`

    showConfirm(
      confirmMsg,
      async () => {
        await processExtendPeriod(targetPeriod)
      },
      'Extend Period',
      'Extend Period',
      'Cancel'
    )
  }

  const processExtendPeriod = async (targetPeriod) => {

    try {
      setSubmitting(true)
      
      // Update the end date
      await adminAPI.updatePeriod(targetPeriod.id, { endDate: formData.endDate })
      
      // If period is closed, reopen it
      if (isClosed(targetPeriod.status)) {
        await adminAPI.updatePeriodStatus(targetPeriod.id, 'active')
      }

      // Refresh periods
      const response = await adminAPI.getPeriods()
      const periods = response?.data || []
      const current = periods.find(p => isOpen(p.status)) || null
      const past = periods.filter(p => isClosed(p.status))
      setCurrentPeriod(current)
      setPastPeriods(past)
      
      showAlert(`Period extended successfully to ${formData.endDate}${isClosed(targetPeriod.status) ? ' and reopened' : ''}.`, 'Success', 'success')
      setShowExtendModal(false)
      setPeriodToExtend(null)
    } catch (err) {
      showAlert(err.message || 'Failed to extend period', 'Error', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openExtendModal = (period) => {
    setPeriodToExtend(period)
    const currentEnd = new Date(period.endDate)
    const suggestedEnd = new Date(currentEnd)
    suggestedEnd.setDate(suggestedEnd.getDate() + 7) // Suggest 7 days extension
    setFormData(prev => ({
      ...prev,
      endDate: suggestedEnd.toISOString().split('T')[0]
    }))
    setShowExtendModal(true)
  }

  const handleCreatePeriod = async (e) => {
    e.preventDefault()
    if (currentPeriod && isOpen(currentPeriod.status)) {
      showAlert('Please close the current period before creating a new one.', 'Cannot Create Period', 'warning')
      return
    }
    
    // Validate date overlap with active periods
    const newStartDate = new Date(formData.startDate)
    const newEndDate = new Date(formData.endDate)
    
    // Check against all existing periods (both open and closed)
    const allPeriods = [...(currentPeriod ? [currentPeriod] : []), ...pastPeriods]
    const hasOverlap = allPeriods.some(period => {
      const existingStart = new Date(period.startDate)
      const existingEnd = new Date(period.endDate)
      
      // Check if new period overlaps with existing period
      return (
        (newStartDate >= existingStart && newStartDate <= existingEnd) || // New start is within existing period
        (newEndDate >= existingStart && newEndDate <= existingEnd) ||     // New end is within existing period
        (newStartDate <= existingStart && newEndDate >= existingEnd)      // New period completely encompasses existing period
      )
    })
    
    if (hasOverlap) {
      showAlert('The selected dates overlap with an existing evaluation period. Please choose different dates that do not conflict with any active or past periods.', 'Date Overlap Detected', 'warning')
      return
    }
    
    // Auto-generate period name from semester + academic year
    const periodName = `${formData.semester} ${formData.academicYear}`
    
    try {
      setSubmitting(true)
      await adminAPI.createPeriod({ ...formData, name: periodName })
      
      // Refresh periods
      const response = await adminAPI.getPeriods()
      const periods = response?.data || []
      const current = periods.find(p => isOpen(p.status)) || null
      const past = periods.filter(p => isClosed(p.status))
      setCurrentPeriod(current)
      setPastPeriods(past)

      showAlert(`New evaluation period "${periodName}" created successfully!`, 'Success', 'success')
      setShowCreateModal(false)
    } catch (err) {
      showAlert(`Failed to create period: ${err.message}`, 'Error', 'error')
    } finally {
      setSubmitting(false)
    }
  }



  const handleEnrollSection = async (e) => {
    e.preventDefault()
    if (!currentPeriod?.id || !enrollFormData.programSectionId) return

    const section = availableProgramSections.find(s => s.id === parseInt(enrollFormData.programSectionId))
    if (!section) return

    const confirmMsg = `Enable program section "${section.sectionName}" (${section.programCode}) for evaluation?\n\nAll students in this program section will be able to evaluate ALL their enrolled courses during this period.`
    
    showConfirm(
      confirmMsg,
      async () => {
        try {
          setSubmitting(true)
          const response = await adminAPI.enrollProgramSectionInPeriod(currentPeriod.id, parseInt(enrollFormData.programSectionId))
          
          // Handle response structure properly
          const data = response.data || response
          
          // Check for different error scenarios
          if (data.success === false) {
            // Display detailed error messages from backend
            const errorMsg = data.message || 'Enrollment failed'
            
            // Check for specific error scenarios
            if (errorMsg.includes('No students are assigned')) {
              showAlert(`${errorMsg}\n\nPlease add students to this program section before enrolling it in an evaluation period.`, 'No Students in Section', 'error')
            } else if (errorMsg.includes('No active students found')) {
              showAlert(`${errorMsg}\n\nPlease ensure students are set to 'active' status in the system.`, 'No Active Students', 'error')
            } else if (errorMsg.includes('No course enrollments found')) {
              showAlert(`${errorMsg}\n\nStudents must be enrolled in courses (class sections) before they can be enabled for evaluation.`, 'No Course Enrollments', 'error')
            } else if (errorMsg.includes('already enrolled')) {
              showAlert(errorMsg, 'Already Enrolled', 'warning')
            } else if (errorMsg.includes('none are \'active\' status')) {
              showAlert(`${errorMsg}\n\nPlease check that student enrollments are marked as 'active' in the database.`, 'Enrollment Status Issue', 'error')
            } else {
              // Generic error message
              showAlert(errorMsg, 'Enrollment Failed', 'warning')
            }
          } else {
            // Success case
            const enrollData = data.data || data
            showAlert(`${data.message}\n\n📊 Summary:\n• ${enrollData.students_enrolled} students enrolled\n• ${enrollData.evaluations_created} evaluation records created\n• ${enrollData.class_sections_affected} course section(s) affected`, 'Enrollment Successful', 'success')
          }
        
        setShowEnrollModal(false)
        setEnrollFormData({ programSectionId: '' })
        
        // Reload period statistics and enrolled sections
        const periodsResponse = await adminAPI.getPeriods()
        const periods = periodsResponse?.data || []
        const current = periods.find(p => isOpen(p.status)) || null
        const past = periods.filter(p => isClosed(p.status))
        setCurrentPeriod(current)
        setPastPeriods(past)
        
        await loadEnrolledSections()
        } catch (err) {
          console.error('Enrollment error:', err)
          
          // Handle different error response formats
          const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error occurred'
          
          // Check if it's a specific error scenario
          if (typeof errorDetail === 'string') {
            if (errorDetail.includes('not found')) {
              showAlert(`${errorDetail}\n\nThe selected program section or evaluation period may have been deleted.`, 'Not Found', 'error')
            } else if (errorDetail.includes('No students') || errorDetail.includes('No course enrollments')) {
              showAlert(errorDetail, 'Enrollment Error', 'error')
            } else {
              showAlert(errorDetail, 'Failed to Enroll Program Section', 'error')
            }
          } else {
            showAlert('An unexpected error occurred. Please try again or contact support.', 'Failed to Enroll Program Section', 'error')
          }
        } finally {
          setSubmitting(false)
        }
        
        setShowEnrollModal(false)
        setEnrollFormData({ programSectionId: '' })
      },
      'Enable Program Section',
      'Enable',
      'Cancel'
    )
  }

  const handleEnrollAllSections = async () => {
    if (!currentPeriod?.id || availableProgramSections.length === 0) return
    
    // Filter out sections that are already enrolled
    const enrolledIds = new Set(enrolledProgramSections.map(s => s.program_section_id || s.programSectionId))
    const sectionsToEnroll = availableProgramSections.filter(s => !enrolledIds.has(s.id))
    
    if (sectionsToEnroll.length === 0) {
      showAlert('All program sections are already enrolled in this evaluation period.', 'Already Enrolled', 'info')
      return
    }
    
    const confirmMsg = `Enroll ALL ${sectionsToEnroll.length} program sections for evaluation?\n\nThis will enable evaluation for:\n${sectionsToEnroll.slice(0, 5).map(s => `• ${s.sectionName || s.section_name} (${s.programCode || s.program_code})`).join('\n')}${sectionsToEnroll.length > 5 ? `\n... and ${sectionsToEnroll.length - 5} more sections` : ''}\n\nAll students in these sections will be able to evaluate their enrolled courses.`
    
    showConfirm(
      confirmMsg,
      async () => {
        try {
          setSubmitting(true)
          
          let totalStudents = 0
          let totalEvaluations = 0
          let successCount = 0
          let failCount = 0
          const errors = []
          
          // Enroll sections one by one
          for (const section of sectionsToEnroll) {
            try {
              const response = await adminAPI.enrollProgramSectionInPeriod(currentPeriod.id, section.id)
              const data = response.data || response
              
              if (data.success !== false) {
                successCount++
                const enrollData = data.data || data
                totalStudents += enrollData.students_enrolled || 0
                totalEvaluations += enrollData.evaluations_created || 0
              } else {
                failCount++
                errors.push(`${section.sectionName || section.section_name}: ${data.message}`)
              }
            } catch (err) {
              failCount++
              const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error'
              errors.push(`${section.sectionName || section.section_name}: ${errorMsg}`)
            }
          }
          
          // Show summary
          let summaryMsg = `Bulk Enrollment Complete!\n\n📊 Summary:\n• ${successCount} sections enrolled successfully\n• ${totalStudents} total students enrolled\n• ${totalEvaluations} evaluation records created`
          
          if (failCount > 0) {
            summaryMsg += `\n\n⚠️ ${failCount} section(s) failed:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... and ${errors.length - 3} more` : ''}`
          }
          
          showAlert(summaryMsg, failCount === 0 ? 'Bulk Enrollment Successful' : 'Bulk Enrollment Completed with Issues', failCount === 0 ? 'success' : 'warning')
          
          // Reload period statistics and enrolled sections
          const periodsResponse = await adminAPI.getPeriods()
          const periods = periodsResponse?.data || []
          const current = periods.find(p => isOpen(p.status)) || null
          const past = periods.filter(p => isClosed(p.status))
          setCurrentPeriod(current)
          setPastPeriods(past)
          
          await loadEnrolledSections()
        } catch (err) {
          showAlert(err.message || 'Failed to enroll all sections', 'Bulk Enrollment Failed', 'error')
        } finally {
          setSubmitting(false)
        }
      },
      'Enroll All Program Sections',
      'Enroll All',
      'Cancel'
    )
  }

  const handleRemoveEnrollment = async (enrollmentId, classCode, subject) => {
    showConfirm(
      `Remove "${classCode}" from this evaluation period?\n\nThis will delete all evaluation records for students in this program section.`,
      async () => {
        try {
          setSubmitting(true)
          const response = await adminAPI.removePeriodEnrollment(currentPeriod.id, enrollmentId)
          const data = response?.data || response
          const evalsDeleted = data?.evaluations_deleted || 0
          
          showAlert(`Section removed successfully!\n\n${evalsDeleted} evaluation record(s) deleted.`, 'Success', 'success')
          
          // Reload period statistics and enrolled sections
          const periodsResponse = await adminAPI.getPeriods()
          const periods = periodsResponse?.data || []
          const current = periods.find(p => isOpen(p.status)) || null
          const past = periods.filter(p => isClosed(p.status))
          setCurrentPeriod(current)
          setPastPeriods(past)
          
          await loadEnrolledSections()
        } catch (err) {
          showAlert(err.response?.data?.detail || err.message, 'Failed to Remove Enrollment', 'error')
        } finally {
          setSubmitting(false)
        }
      },
      'Remove Enrollment',
      'Remove',
      'Cancel'
    )
  }

  const handleDeletePastPeriod = async (periodId, periodName) => {
    showConfirm(
      `Delete "${periodName}"?\n\nThis will permanently delete this evaluation period and all associated data. This action cannot be undone!`,
      async () => {
        try {
          setSubmitting(true)
          await adminAPI.deletePeriod(periodId)
          
          // Refresh periods
          const response = await adminAPI.getPeriods()
          const periods = response?.data || []
          const current = periods.find(p => isOpen(p.status)) || null
          const past = periods.filter(p => isClosed(p.status))
          setCurrentPeriod(current)
          setPastPeriods(past)
          
          showAlert(`Period "${periodName}" deleted successfully!`, 'Success', 'success')
        } catch (err) {
          showAlert(err.message || 'Failed to delete period', 'Error', 'error')
        } finally {
          setSubmitting(false)
        }
      },
      'Delete Period',
      'Delete Period',
      'Cancel'
    )
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null

  // Loading and error states
  if (loading) return <LoadingSpinner message="Loading evaluation periods..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="lpu-header">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 max-w-screen-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl">Evaluation Period Management</h1>
                <p className="lpu-header-subtitle text-lg">Control evaluation schedules and monitor participation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Current Period Card */}
        {currentPeriod ? (
          <div className="bg-white rounded-card shadow-card overflow-hidden mb-12 border-2 border-[#7a0000]/20">
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{currentPeriod.name}</h2>
                  <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                    isOpen(currentPeriod.status)
                      ? 'bg-green-400 text-green-900'
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {isOpen(currentPeriod.status) ? '🟢 OPEN' : '⚫ CLOSED'}
                  </span>
                </div>
                <p className="text-white/80">
                  {new Date(currentPeriod.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(currentPeriod.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex space-x-2">
                {isOpen(currentPeriod.status) ? (
                  <>
                    <button onClick={() => openExtendModal(currentPeriod)} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-semibold">
                      Extend
                    </button>
                    <button onClick={handleClosePeriod} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-all font-semibold">
                      Close Period
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openExtendModal(currentPeriod)} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-semibold">
                      Extend & Reopen
                    </button>
                    <button onClick={handleOpenPeriod} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-semibold">
                      Reopen
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-5 lg:gap-6 mb-12">
              <div className="bg-white rounded-card p-7 lg:p-8 border-2 border-gray-200 hover:border-[#7a0000] transition-all duration-250 shadow-card">
                <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Evaluations</p>
                <p className="text-4xl lg:text-5xl font-bold text-[#7a0000]">{currentPeriod.totalEvaluations}</p>
              </div>
              <div className="bg-white rounded-card p-7 lg:p-8 border-2 border-gray-200 hover:border-green-500 transition-all duration-250 shadow-card">
                <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Completed</p>
                <p className="text-4xl lg:text-5xl font-bold text-green-600">{currentPeriod.completedEvaluations}</p>
              </div>
              <div className="bg-white rounded-card p-7 lg:p-8 border-2 border-gray-200 hover:border-[#7a0000] transition-all duration-250 shadow-card">
                <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Participation Rate</p>
                <p className="text-4xl lg:text-5xl font-bold text-[#7a0000]">{currentPeriod.participationRate}%</p>
              </div>
              <div className="bg-white rounded-card p-7 lg:p-8 border-2 border-gray-200 hover:border-[#7a0000] transition-all duration-250 shadow-card">
                <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Days Remaining</p>
                <p className="text-4xl lg:text-5xl font-bold text-[#7a0000]">{currentPeriod.daysRemaining}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Completion Progress</span>
                <span className="text-sm font-bold text-[#7a0000]">{currentPeriod.completedEvaluations}/{currentPeriod.totalEvaluations}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-[#7a0000] to-[#9a1000] transition-all duration-500 flex items-center justify-end px-2"
                  style={{ width: `${currentPeriod.participationRate}%` }}
                >
                  <span className="text-xs font-bold text-white">{currentPeriod.participationRate}%</span>
                </div>
              </div>
            </div>

            {/* Warning/Info Messages */}
            {isOpen(currentPeriod.status) && currentPeriod.daysRemaining <= 5 && (
              <div className="bg-[#7a0000]/5 border-l-4 border-[#7a0000] p-4 mb-6 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-[#7a0000] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <div>
                    <p className="font-bold text-[#7a0000]">⚠️ Period ending soon!</p>
                    <p className="text-sm text-[#7a0000]/80">Only {currentPeriod.daysRemaining} days remaining.</p>
                  </div>
                </div>
              </div>
            )}

            {currentPeriod.participationRate < 50 && isOpen(currentPeriod.status) && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="font-bold text-red-900">❌ Low participation rate!</p>
                    <p className="text-sm text-red-700">Participation is below 50%. Immediate action recommended.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enrollment Management Section */}
            <div className="border-t-2 border-gray-200 pt-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <svg className="w-7 h-7 mr-3 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    Enrolled Program Sections
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Program sections enrolled for evaluation during this period</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleEnrollAllSections}
                    disabled={submitting || availableProgramSections.length === 0}
                    className="px-5 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center space-x-2 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Enroll All</span>
                  </button>
                  <button 
                    onClick={() => setShowEnrollModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span>Enroll Section</span>
                  </button>
                </div>
              </div>

              {loadingEnrollments ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading enrolled sections...</p>
                </div>
              ) : enrolledProgramSections.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">No Program Sections Enrolled</h4>
                  <p className="text-gray-600 mb-4">Enroll program sections to enable students to evaluate during this period.</p>
                  <button 
                    onClick={() => setShowEnrollModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white font-semibold rounded-xl transition-all inline-flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span>Enroll First Program Section</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {enrolledProgramSections.map((section) => (
                    <div key={section.id} className="bg-gradient-to-br from-[#7a0000]/5 to-[#9a1000]/5 border-2 border-[#7a0000]/20 rounded-xl p-5 hover:shadow-lg hover:border-[#7a0000]/40 transition-all">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-gray-900 truncate">{section.section_name || section.sectionName}</h4>
                            <span className="px-2 py-0.5 bg-[#7a0000] text-white rounded-md text-xs font-semibold whitespace-nowrap">
                              Year {section.year_level || section.yearLevel}
                            </span>
                            <span className="px-2 py-0.5 bg-[#9a1000] text-white rounded-md text-xs font-semibold whitespace-nowrap">
                              Sem {section.semester}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 truncate">{section.program_name || section.programName}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold border border-gray-200">
                              {section.program_code || section.programCode}
                            </span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold border border-blue-100">
                              👥 {section.enrolled_count || section.enrolledCount} students
                            </span>
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg font-semibold border border-green-100">
                              ✅ {section.evaluations_created || section.evaluationsCreated || 0} evals
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Enrolled {new Date(section.created_at || section.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveEnrollment(section.id, section.section_name || section.sectionName, section.program_name || section.programName)}
                          disabled={submitting}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-all font-semibold text-xs flex items-center gap-1 flex-shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-white rounded-card shadow-card overflow-hidden mb-12 border-2 border-gray-200">
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Evaluation Period</h3>
              <p className="text-gray-600 mb-6">Create a new evaluation period to start collecting feedback</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                Create New Period
              </button>
            </div>
          </div>
        )}

        {/* Past Periods Section */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] p-6">
            <h2 className="text-2xl font-bold text-white">📚 Past Evaluation Periods</h2>
            <p className="text-white/80 text-sm mt-1">Historical evaluation period records</p>
          </div>

          <div className="p-6 lg:p-8">
            <div className="space-y-4">
              {pastPeriods.map((period) => (
                <div key={period.id} className="border-2 border-gray-200 rounded-card p-6 lg:p-8 hover:shadow-lg transition-all duration-250">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{period.name}</h3>
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                          CLOSED
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex items-center space-x-6">
                        <div>
                          <p className="text-xs text-gray-500">Participation</p>
                          <p className="text-2xl font-bold text-[#7a0000]">{period.participationRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-2xl font-bold text-green-600">{period.completedEvaluations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-2xl font-bold text-[#7a0000]">{period.totalEvaluations}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openExtendModal(period)}
                        disabled={submitting}
                        className="px-4 py-2 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all font-semibold text-sm flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Extend & Reopen</span>
                      </button>
                      <button
                        onClick={() => handleDeletePastPeriod(period.id, period.name)}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-all font-semibold text-sm flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] p-6 border-b-4 border-[#5a0000] flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📅 Create New Evaluation Period</h2>
                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreatePeriod} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Semester *</label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    required
                    pattern="\d{4}-\d{4}"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    placeholder="2025-2026"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY (e.g., 2025-2026)</p>
                </div>
              </div>

              <div className="bg-[#7a0000]/5 border border-[#7a0000]/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-[#7a0000] mb-1">📝 Period Name Preview:</p>
                <p className="text-lg font-bold text-[#7a0000]">{formData.semester} {formData.academicYear}</p>
                <p className="text-xs text-[#7a0000]/70 mt-1">Name will be auto-generated from semester and academic year</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">⚠️ Cannot select past dates</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">⚠️ Must be after start date</p>
                </div>
              </div>

              <div className="bg-[#7a0000]/5 border border-[#7a0000]/20 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifyUsers}
                    onChange={(e) => setFormData({...formData, notifyUsers: e.target.checked})}
                    className="w-4 h-4 text-[#7a0000] rounded focus:ring-2 focus:ring-[#7a0000] mr-3"
                  />
                  <span className="text-sm font-semibold text-[#7a0000]">
                    📧 Send email notification to all users when period opens
                  </span>
                </label>
              </div>

              <div className="bg-[#7a0000]/5 border border-[#7a0000]/20 rounded-lg p-4">
                <p className="text-sm text-[#7a0000]">
                  <strong>⚠️ Note:</strong> The current evaluation period must be closed before creating a new one.
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white rounded-lg font-semibold transition-all"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Period Modal */}
      {showExtendModal && (periodToExtend || currentPeriod) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className={`bg-gradient-to-r from-[#7a0000] to-[#9a1000] px-5 py-4 border-b-4 border-[#5a0000] flex-shrink-0`}>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">⏰ Extend Period</h2>
                  <p className="text-white/90 text-xs mt-1">{(periodToExtend || currentPeriod).name}</p>
                </div>
                <button onClick={() => { setShowExtendModal(false); setPeriodToExtend(null); }} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleExtendPeriod} className="flex-1 overflow-y-auto p-6 space-y-4">
              {isClosed((periodToExtend || currentPeriod).status) && (
                <div className="bg-[#7a0000]/5 border-l-4 border-[#7a0000] p-4 rounded">
                  <p className="text-sm text-[#7a0000]">
                    <strong>ℹ️ Note:</strong> This period is currently closed. Extending it will automatically reopen the period for new submissions.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current End Date</label>
                <input
                  type="date"
                  disabled
                  value={(periodToExtend || currentPeriod).endDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New End Date *</label>
                <input
                  type="date"
                  required
                  min={(periodToExtend || currentPeriod).endDate}
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                />
              </div>

              <div className="bg-[#7a0000]/5 border border-[#7a0000]/20 rounded-lg p-4">
                <p className="text-sm text-[#7a0000]">
                  <strong>📧 Email notifications</strong> will be sent to all users informing them of the extension.
                </p>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Extend Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Program Section Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] px-5 py-4 border-b-4 border-[#5a0000]">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">📚 Enroll Program Section</h2>
                  <p className="text-white/80 text-xs mt-1">Enable a student group for evaluation during this period</p>
                </div>
                <button onClick={() => setShowEnrollModal(false)} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEnrollSection} className="p-4 space-y-3">
              {loadingSections ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading sections...</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Program Section *</label>
                    {availableProgramSections.length === 0 ? (
                      <div className="bg-[#7a0000]/5 border border-[#7a0000]/20 rounded-lg p-4">
                        <p className="text-sm font-semibold text-[#7a0000] mb-2">⚠️ No Program Sections Found</p>
                        <p className="text-sm text-[#7a0000]/80 mb-3">
                          You need to create program sections before enrolling them in an evaluation period.
                        </p>
                        <p className="text-xs text-[#7a0000]/70">
                          <strong>To create sections:</strong> Go to Course Management → Manage Sections → Create a section (e.g., "BSIT-3A") and assign students to it.
                        </p>
                      </div>
                    ) : (
                      <>
                        <select
                          required
                          value={enrollFormData.programSectionId}
                          onChange={(e) => setEnrollFormData({...enrollFormData, programSectionId: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                        >
                          <option value="">Select a program section...</option>
                          {availableProgramSections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.sectionName || section.section_name} - {section.programCode || section.program_code} (Year {section.yearLevel || section.year_level}, Sem {section.semester}) - {section.studentCount || section.student_count} students
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select the student group (e.g., BSCS-DS-3A) to enable for evaluation</p>
                      </>
                    )}
                  </div>

                  <div className="bg-[#7a0000]/5 border border-[#7a0000]/20 rounded-lg p-4">
                    <p className="text-sm text-[#7a0000]">
                      <strong>ℹ️ What happens:</strong>
                    </p>
                    <ul className="text-sm text-[#7a0000]/80 mt-2 space-y-1 ml-4 list-disc">
                      <li>All students in the program section can submit evaluations</li>
                      <li>Evaluations created for ALL courses the students are enrolled in</li>
                      <li>One click enables evaluation for the entire student group</li>
                      <li>Evaluations will be linked to this evaluation period</li>
                    </ul>
                  </div>

                  {enrollFormData.programSectionId && (
                    <div className="bg-[#7a0000]/5 border border-[#7a0000]/20 rounded-lg p-4">
                      <p className="text-sm font-semibold text-[#7a0000]">
                        📋 Selected: {availableProgramSections.find(s => s.id === parseInt(enrollFormData.programSectionId))?.sectionName || availableProgramSections.find(s => s.id === parseInt(enrollFormData.programSectionId))?.section_name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {availableProgramSections.find(s => s.id === parseInt(enrollFormData.programSectionId))?.programCode || availableProgramSections.find(s => s.id === parseInt(enrollFormData.programSectionId))?.program_code} - Year {availableProgramSections.find(s => s.id === parseInt(enrollFormData.programSectionId))?.yearLevel || availableProgramSections.find(s => s.id === parseInt(enrollFormData.programSectionId))?.year_level}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableProgramSections.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enrolling...' : availableProgramSections.length === 0 ? 'No Sections Available' : 'Enroll Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">Operation Failed</h2>
              </div>
            </div>
            
            <div className="p-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-900 whitespace-pre-wrap">{errorMessage}</p>
              </div>
              
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.type === 'error' ? 'danger' : alertConfig.type}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          confirmConfig.onConfirm()
          setShowConfirmModal(false)
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant="warning"
      />
    </div>
  )
}





