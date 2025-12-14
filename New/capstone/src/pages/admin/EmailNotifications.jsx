import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'
import { AlertModal, ConfirmModal } from '../../components/Modal'

export default function EmailNotifications() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // State
  const [activeTab, setActiveTab] = useState('send')
  const [notificationType, setNotificationType] = useState('test')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [customEmails, setCustomEmails] = useState('')
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [emailConfig, setEmailConfig] = useState(null)

  // Modal State
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', cancelText: 'Cancel' })
  
  // Fetch evaluation periods and email config
  const { data: apiData, loading, error, retry } = useApiWithTimeout(
    async () => {
      const [periodsData, configData] = await Promise.all([
        adminAPI.getEvaluationPeriods(),
        adminAPI.getEmailConfigStatus()
      ])
      return {
        periods: periodsData?.data || [],
        config: configData?.data || null
      }
    },
    [currentUser?.id]
  )
  
  useEffect(() => {
    if (apiData) {
      setEmailConfig(apiData.config)
      // Auto-select first active period
      const activePeriod = apiData.periods.find(p => p.status === 'active')
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id.toString())
      }
    }
  }, [apiData])
  
  // Modal Helper Functions
  const showAlert = (message, title = 'Notification', type = 'info') => {
    setAlertConfig({ title, message, type })
    setShowAlertModal(true)
  }

  const showConfirm = (message, onConfirm, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmConfig({ title, message, onConfirm, confirmText, cancelText })
    setShowConfirmModal(true)
  }

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && !isSystemAdmin(currentUser)) {
      navigate('/admin/dashboard')
    }
  }, [currentUser, navigate])
  
  const handleSendNotification = async (e) => {
    e.preventDefault()
    
    // Validation
    if (notificationType === 'test') {
      if (!testEmail) {
        showAlert('Please enter a test email address', 'Validation Error', 'warning')
        return
      }
    } else {
      if (!selectedPeriod) {
        showAlert('Please select an evaluation period', 'Validation Error', 'warning')
        return
      }
    }
    
    showConfirm(
      `Send ${notificationType} notification(s)?`,
      async () => {
        try {
          setSending(true)
          const recipientEmails = customEmails.trim() 
            ? customEmails.split(',').map(e => e.trim()).filter(Boolean)
            : null
          
          const result = await adminAPI.sendEmailNotification({
            notification_type: notificationType,
            period_id: selectedPeriod ? parseInt(selectedPeriod) : null,
            recipient_emails: recipientEmails,
            test_email: testEmail || null
          })
          
          setLastResult(result)
          showAlert(result.message || 'Notification sent successfully', 'Success', 'success')
          
          // Reset form for test emails
          if (notificationType === 'test') {
            setTestEmail('')
          }
          
        } catch (err) {
          showAlert(err.message, 'Failed to Send Notification', 'error')
          setLastResult({ success: false, error: err.message })
        } finally {
          setSending(false)
        }
      },
      'Send Notification',
      'Send',
      'Cancel'
    )
  }
  
  if (!currentUser || !isSystemAdmin(currentUser)) return null
  if (loading) return <LoadingSpinner message="Loading email settings..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />
  
  const periods = apiData?.periods || []
  const isConfigured = emailConfig?.enabled
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="lpu-header">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl">📧 Email Notifications</h1>
                <p className="lpu-header-subtitle text-lg">Send automated notifications to students</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Email Configuration Status */}
        <div className={`mb-12 p-8 lg:p-10 rounded-card shadow-card ${
          isConfigured 
            ? 'bg-yellow-50 border-2 border-yellow-200' 
            : 'bg-yellow-50 border-2 border-yellow-200'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-lg font-bold ${isConfigured ? 'text-yellow-900' : 'text-yellow-900'}`}>
                {isConfigured ? '✅ Email Service Configured' : '⚠️ Email Service Not Configured'}
              </h3>
              {isConfigured ? (
                <div className="mt-2 text-sm text-yellow-800">
                  <p><strong>SMTP Server:</strong> {emailConfig.smtp_server}:{emailConfig.smtp_port}</p>
                  <p><strong>From:</strong> {emailConfig.from_name} &lt;{emailConfig.from_email}&gt;</p>
                </div>
              ) : (
                <div className="mt-2 text-sm text-yellow-800">
                  <p>Email notifications are disabled. Configure SMTP settings in the .env file:</p>
                  <pre className="mt-2 p-3 bg-yellow-100 rounded text-xs overflow-x-auto">
{`EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-250 mb-12 p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'send'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📤 Send Notifications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Notification History
          </button>
        </div>

        {/* Send Notifications Tab */}
        {activeTab === 'send' && (
          <div className="bg-white rounded-card shadow-card p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Email Notifications</h2>
            
            <form onSubmit={handleSendNotification} className="space-y-6">
              {/* Notification Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notification Type *
                </label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                  required
                >
                  <option value="test">🧪 Test Email</option>
                  <option value="period_start">🎯 Evaluation Period Started</option>
                </select>
              </div>

              {/* Test Email Field */}
              {notificationType === 'test' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Test Email Address *
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    placeholder="your-email@example.com"
                    required={notificationType === 'test'}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    A test email will be sent to verify your email configuration.
                  </p>
                </div>
              )}

              {/* Evaluation Period Selection */}
              {notificationType !== 'test' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Evaluation Period *
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    required={notificationType !== 'test'}
                  >
                    <option value="">Select Period...</option>
                    {periods.map(period => (
                      <option key={period.id} value={period.id}>
                        {period.name} ({period.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Recipients (Optional) */}
              {notificationType !== 'test' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Recipients (Optional)
                  </label>
                  <textarea
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    rows="3"
                    placeholder="student1@example.com, student2@example.com"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Leave empty to send to all active students. Enter comma-separated emails for specific recipients.
                  </p>
                </div>
              )}

              {/* Notification Preview */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">📋 Notification Preview:</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  {notificationType === 'test' && (
                    <p>• Test email will be sent to: <strong>{testEmail || 'Not specified'}</strong></p>
                  )}
                  {notificationType === 'period_start' && (
                    <>
                      <p>• Subject: <strong>📝 Evaluation Period Started</strong></p>
                      <p>• Content: Period details, course count, evaluation instructions</p>
                      <p>• Call-to-action: Link to student dashboard</p>
                    </>
                  )}

                  {notificationType !== 'test' && (
                    <p className="mt-2">
                      • Recipients: {customEmails.trim() ? 'Custom list' : 'All active students'}
                    </p>
                  )}
                </div>
              </div>

              {/* Last Result */}
              {lastResult && (
                <div className={`p-4 rounded-lg ${
                  lastResult.success 
                    ? 'bg-yellow-50 border-2 border-yellow-200' 
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <h3 className={`font-bold ${lastResult.success ? 'text-yellow-900' : 'text-red-900'}`}>
                    {lastResult.success ? '✅ Success' : '❌ Failed'}
                  </h3>
                  <p className={`text-sm mt-1 ${lastResult.success ? 'text-yellow-800' : 'text-red-800'}`}>
                    {lastResult.message}
                  </p>
                  {lastResult.sent_count !== undefined && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p>• Sent: {lastResult.sent_count}</p>
                      {lastResult.failed_count > 0 && <p>• Failed: {lastResult.failed_count}</p>}
                      <p>• Total Recipients: {lastResult.total_recipients}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-button hover:bg-gray-50 font-semibold transition-all duration-250"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !isConfigured}
                  className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-amber-700 text-white rounded-button font-semibold transition-all duration-250 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sending ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>📤 Send Notification</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-card shadow-card p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification History</h2>
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="text-lg font-semibold">Notification history coming soon</p>
              <p className="text-sm mt-2">Check audit logs for email notification records</p>
            </div>
          </div>
        )}
      </div>

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
        variant="info"
      />
    </div>
  )
}




