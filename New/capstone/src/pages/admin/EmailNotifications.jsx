import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'

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
        alert('Please enter a test email address')
        return
      }
    } else {
      if (!selectedPeriod) {
        alert('Please select an evaluation period')
        return
      }
    }
    
    if (!window.confirm(`Send ${notificationType} notification(s)?`)) {
      return
    }
    
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
      alert(result.message || 'Notification sent successfully')
      
      // Reset form for test emails
      if (notificationType === 'test') {
        setTestEmail('')
      }
      
    } catch (err) {
      alert(`Failed to send notification: ${err.message}`)
      setLastResult({ success: false, error: err.message })
    } finally {
      setSending(false)
    }
  }
  
  if (!currentUser || !isSystemAdmin(currentUser)) return null
  if (loading) return <LoadingSpinner message="Loading email settings..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />
  
  const periods = apiData?.periods || []
  const isConfigured = emailConfig?.enabled
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-xl border-b-4 border-purple-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/admin/dashboard')} 
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">📧 Email Notifications</h1>
                <p className="text-purple-100 text-sm mt-1">Send automated notifications to students</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Email Configuration Status */}
        <div className={`mb-6 p-6 rounded-xl shadow-md ${
          isConfigured 
            ? 'bg-green-50 border-2 border-green-200' 
            : 'bg-yellow-50 border-2 border-yellow-200'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-lg font-bold ${isConfigured ? 'text-green-900' : 'text-yellow-900'}`}>
                {isConfigured ? '✅ Email Service Configured' : '⚠️ Email Service Not Configured'}
              </h3>
              {isConfigured ? (
                <div className="mt-2 text-sm text-green-800">
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
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'send'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📤 Send Notifications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Notification History
          </button>
        </div>

        {/* Send Notifications Tab */}
        {activeTab === 'send' && (
          <div className="bg-white rounded-xl shadow-md p-6">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="test">🧪 Test Email</option>
                  <option value="period_start">🎯 Evaluation Period Started</option>
                  <option value="reminder">⚠️ Evaluation Reminder</option>
                  <option value="period_ending">🚨 Period Ending Soon</option>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  {notificationType === 'reminder' && (
                    <>
                      <p>• Subject: <strong>⚠️ REMINDER: Pending Evaluations</strong></p>
                      <p>• Content: List of pending courses, days remaining</p>
                      <p>• Recipients: Only students with pending evaluations</p>
                    </>
                  )}
                  {notificationType === 'period_ending' && (
                    <>
                      <p>• Subject: <strong>🚨 FINAL NOTICE: Deadline Approaching</strong></p>
                      <p>• Content: Hours remaining, urgent call-to-action</p>
                      <p>• Style: High-urgency red theme</p>
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
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <h3 className={`font-bold ${lastResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {lastResult.success ? '✅ Success' : '❌ Failed'}
                  </h3>
                  <p className={`text-sm mt-1 ${lastResult.success ? 'text-green-800' : 'text-red-800'}`}>
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
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !isConfigured}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
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
          <div className="bg-white rounded-xl shadow-md p-6">
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
    </div>
  )
}
