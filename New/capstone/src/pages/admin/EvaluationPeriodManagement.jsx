import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, isSystemAdmin } from '../../utils/roleUtils'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'

export default function EvaluationPeriodManagement() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  
  // State
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [pastPeriods, setPastPeriods] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    notifyUsers: true
  })

  // Use timeout hook for API call
  const { data: periodsData, loading, error, retry } = useApiWithTimeout(
    () => adminAPI.getPeriods(),
    [currentUser?.id, currentUser?.role]
  )

  // Update periods when data changes
  useEffect(() => {
    if (periodsData?.data) {
      const periods = periodsData.data
      const current = periods.find(p => p.status === 'Open') || null
      const past = periods.filter(p => p.status === 'Closed')
      setCurrentPeriod(current)
      setPastPeriods(past)
    }
  }, [periodsData])

  // Redirect if not system admin
  useEffect(() => {
    if (currentUser && !isSystemAdmin(currentUser)) {
      navigate('/dashboard')
    }
  }, [currentUser?.role, currentUser?.id, navigate])

  const handleClosePeriod = async () => {
    if (!currentPeriod) return
    
    if (window.confirm(`Close "${currentPeriod.name}"?\n\nThis will prevent any further evaluations from being submitted. This action cannot be undone.`)) {
      try {
        setSubmitting(true)
        await adminAPI.updatePeriodStatus(currentPeriod.id, 'Closed')
        
        // Refresh periods
        const response = await adminAPI.getPeriods()
        const periods = response?.data || []
        const current = periods.find(p => p.status === 'Open') || null
        const past = periods.filter(p => p.status === 'Closed')
        setCurrentPeriod(current)
        setPastPeriods(past)
        
        alert('Evaluation period closed successfully!')
      } catch (err) {
        alert(`Failed to close period: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleOpenPeriod = async () => {
    if (!currentPeriod) return
    
    if (window.confirm(`Reopen "${currentPeriod.name}"?\n\nStudents will be able to submit evaluations again.`)) {
      try {
        setSubmitting(true)
        await adminAPI.updatePeriodStatus(currentPeriod.id, 'Open')
        
        // Refresh periods
        const response = await adminAPI.getPeriods()
        const periods = response?.data || []
        const current = periods.find(p => p.status === 'Open') || null
        const past = periods.filter(p => p.status === 'Closed')
        setCurrentPeriod(current)
        setPastPeriods(past)
        
        alert('Evaluation period reopened successfully!')
      } catch (err) {
        alert(`Failed to reopen period: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleExtendPeriod = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await adminAPI.updatePeriod(currentPeriod.id, { endDate: formData.endDate })
      
      // Refresh periods
      const response = await adminAPI.getPeriods()
      const periods = response?.data || []
      const current = periods.find(p => p.status === 'Open') || null
      setCurrentPeriod(current)
      
      alert(`Period extended to ${formData.endDate}. Email notifications sent to all users.`)
      setShowExtendModal(false)
    } catch (err) {
      alert(`Failed to extend period: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePeriod = async (e) => {
    e.preventDefault()
    if (currentPeriod && currentPeriod.status === 'Open') {
      alert('Please close the current period before creating a new one.')
      return
    }
    
    try {
      setSubmitting(true)
      await adminAPI.createPeriod(formData)
      
      // Refresh periods
      const response = await adminAPI.getPeriods()
      const periods = response?.data || []
      const current = periods.find(p => p.status === 'Open') || null
      const past = periods.filter(p => p.status === 'Closed')
      setCurrentPeriod(current)
      setPastPeriods(past)
      
      alert(`New evaluation period "${formData.name}" created successfully!`)
      setShowCreateModal(false)
    } catch (err) {
      alert(`Failed to create period: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendReminder = async () => {
    if (!currentPeriod) return
    
    const pending = currentPeriod.totalEvaluations - currentPeriod.completedEvaluations
    if (window.confirm(`Send reminder email to ${pending} students who haven't completed their evaluations?`)) {
      try {
        setSubmitting(true)
        await adminAPI.sendEvaluationReminders(currentPeriod.id)
        alert(`Reminder emails sent to ${pending} students!`)
      } catch (err) {
        alert(`Failed to send reminders: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null

  // Loading and error states
  if (loading) return <LoadingSpinner message="Loading evaluation periods..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-xl border-b-4 border-purple-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Evaluation Period Management</h1>
                <p className="text-purple-100 text-sm mt-1">Control evaluation schedules and monitor participation</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-white hover:bg-purple-50 text-purple-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>New Period</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Current Period Card */}
        {currentPeriod ? (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8 border-2 border-purple-200">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{currentPeriod.name}</h2>
                  <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                    currentPeriod.status === 'Open' 
                      ? 'bg-green-400 text-green-900' 
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {currentPeriod.status === 'Open' ? '🟢 OPEN' : '⚫ CLOSED'}
                  </span>
                </div>
                <p className="text-purple-100">
                  {new Date(currentPeriod.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(currentPeriod.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex space-x-2">
                {currentPeriod.status === 'Open' ? (
                  <>
                    <button onClick={() => setShowExtendModal(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-semibold">
                      Extend
                    </button>
                    <button onClick={handleClosePeriod} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-semibold">
                      Close Period
                    </button>
                  </>
                ) : (
                  <button onClick={handleOpenPeriod} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-semibold">
                    Reopen Period
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <p className="text-sm font-semibold text-blue-600 mb-1">Total Evaluations</p>
                <p className="text-4xl font-bold text-blue-900">{currentPeriod.totalEvaluations}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <p className="text-sm font-semibold text-green-600 mb-1">Completed</p>
                <p className="text-4xl font-bold text-green-900">{currentPeriod.completedEvaluations}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                <p className="text-sm font-semibold text-orange-600 mb-1">Participation Rate</p>
                <p className="text-4xl font-bold text-orange-900">{currentPeriod.participationRate}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <p className="text-sm font-semibold text-purple-600 mb-1">Days Remaining</p>
                <p className="text-4xl font-bold text-purple-900">{currentPeriod.daysRemaining}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Completion Progress</span>
                <span className="text-sm font-bold text-purple-600">{currentPeriod.completedEvaluations}/{currentPeriod.totalEvaluations}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 flex items-center justify-end px-2"
                  style={{ width: `${currentPeriod.participationRate}%` }}
                >
                  <span className="text-xs font-bold text-white">{currentPeriod.participationRate}%</span>
                </div>
              </div>
            </div>

            {/* Warning/Info Messages */}
            {currentPeriod.status === 'Open' && currentPeriod.daysRemaining <= 5 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <div>
                    <p className="font-bold text-orange-900">⚠️ Period ending soon!</p>
                    <p className="text-sm text-orange-700">Only {currentPeriod.daysRemaining} days remaining. Consider sending reminder emails.</p>
                  </div>
                </div>
              </div>
            )}

            {currentPeriod.participationRate < 50 && currentPeriod.status === 'Open' && (
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

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button onClick={handleSendReminder} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>Send Reminder Emails</span>
              </button>
              <button onClick={() => alert('Exporting report...')} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border-2 border-gray-200">
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Evaluation Period</h3>
              <p className="text-gray-600 mb-6">Create a new evaluation period to start collecting feedback</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                Create New Period
              </button>
            </div>
          </div>
        )}

        {/* Past Periods Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6">
            <h2 className="text-2xl font-bold text-white">📚 Past Evaluation Periods</h2>
            <p className="text-gray-300 text-sm mt-1">Historical evaluation period records</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {pastPeriods.map((period) => (
                <div key={period.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
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
                          <p className="text-2xl font-bold text-purple-600">{period.participationRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-2xl font-bold text-green-600">{period.completedEvaluations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-2xl font-bold text-blue-600">{period.totalEvaluations}</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => alert('Viewing detailed report...')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-semibold text-sm">
                      View Report
                    </button>
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
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 border-b-4 border-purple-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📅 Create New Evaluation Period</h2>
                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreatePeriod} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Period Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Finals Evaluation - AY 2024-2025"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifyUsers}
                    onChange={(e) => setFormData({...formData, notifyUsers: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm font-semibold text-blue-900">
                    📧 Send email notification to all users when period opens
                  </span>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
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
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Period Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 border-b-4 border-orange-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">⏰ Extend Period</h2>
                <button onClick={() => setShowExtendModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleExtendPeriod} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current End Date</label>
                <input
                  type="date"
                  disabled
                  value={currentPeriod.endDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New End Date *</label>
                <input
                  type="date"
                  required
                  min={currentPeriod.endDate}
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>📧 Email notifications</strong> will be sent to all users informing them of the extension.
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all"
                >
                  Extend Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
