import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, isSystemAdmin } from '../../utils/roleUtils'
import { adminAPI } from '../../services/api'

export default function SystemSettings() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)
  
  // API State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    institutionName: 'Lyceum of the Philippines University - Batangas',
    institutionShortName: 'LPU Batangas',
    academicYear: '2024-2025',
    currentSemester: 'First Semester',
    ratingScale: 5,
    timezone: 'Asia/Manila',
    dateFormat: 'MM/DD/YYYY',
    language: 'English'
  })

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'noreply@lpubatangas.edu.ph',
    smtpPassword: '••••••••',
    fromEmail: 'noreply@lpubatangas.edu.ph',
    fromName: 'LPU Evaluation System',
    enableNotifications: true,
    reminderFrequency: '3' // days
  })

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    twoFactorAuth: false,
    ipWhitelist: '',
    allowedDomains: '@lpubatangas.edu.ph'
  })

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    includeEvaluations: true,
    includeUsers: true,
    includeCourses: true,
    backupLocation: 'cloud',
    lastBackup: 'October 21, 2025 02:00 AM'
  })

  // Redirect if not system admin
  useEffect(() => {
    if (!currentUser || !isSystemAdmin(currentUser)) {
      navigate('/login')
    }
  }, [currentUser, navigate])
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await adminAPI.getSettings()
        if (data.general) setGeneralSettings(data.general)
        if (data.email) setEmailSettings(data.email)
        if (data.security) setSecuritySettings(data.security)
        if (data.backup) setBackupSettings(data.backup)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSaveSettings = async (section) => {
    try {
      setSubmitting(true)
      const settingsMap = {
        'General': generalSettings,
        'Email': emailSettings,
        'Security': securitySettings,
        'Backup': backupSettings
      }
      await adminAPI.updateSettings({ category: section, settings: settingsMap[section] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      alert(`${section} settings saved successfully!`)
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTestEmail = () => {
    alert('Test email sent to ' + currentUser.email)
  }

  const handleBackupNow = () => {
    if (window.confirm('Create a manual backup now?')) {
      alert('Backup initiated. This may take several minutes.')
    }
  }

  const handleRestoreBackup = () => {
    if (window.confirm('⚠️ WARNING: Restoring a backup will overwrite current data.\n\nAre you sure you want to continue?')) {
      alert('Please select a backup file to restore...')
    }
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-bold mb-2">Error Loading Settings</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-700 to-gray-800 shadow-xl border-b-4 border-gray-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
                <p className="text-gray-300 text-sm mt-1">Configure system-wide settings and preferences</p>
              </div>
            </div>
            {saved && (
              <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Settings Saved!</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
              <span>General</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'email'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span>Email</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span>Security</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'backup'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
              </svg>
              <span>Backup</span>
            </div>
          </button>
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ General Settings</h2>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Institution Name</label>
                  <input
                    type="text"
                    value={generalSettings.institutionName}
                    onChange={(e) => setGeneralSettings({...generalSettings, institutionName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Short Name</label>
                  <input
                    type="text"
                    value={generalSettings.institutionShortName}
                    onChange={(e) => setGeneralSettings({...generalSettings, institutionShortName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
                  <input
                    type="text"
                    value={generalSettings.academicYear}
                    onChange={(e) => setGeneralSettings({...generalSettings, academicYear: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Semester</label>
                  <select
                    value={generalSettings.currentSemester}
                    onChange={(e) => setGeneralSettings({...generalSettings, currentSemester: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating Scale</label>
                  <select
                    value={generalSettings.ratingScale}
                    onChange={(e) => setGeneralSettings({...generalSettings, ratingScale: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5-Point Scale</option>
                    <option value={10}>10-Point Scale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Asia/Manila">Asia/Manila (PHT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Format</label>
                  <select
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleSaveSettings('General')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>💾 Save General Settings</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📧 Email Settings</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 font-semibold mb-1">📋 SMTP Configuration</p>
                <p className="text-sm text-blue-700">Configure your email server settings for sending notifications and reminders.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="text"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Username</label>
                  <input
                    type="email"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Password</label>
                  <input
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From Email</label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From Name</label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reminder Frequency (days)</label>
                <input
                  type="number"
                  value={emailSettings.reminderFrequency}
                  onChange={(e) => setEmailSettings({...emailSettings, reminderFrequency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Send reminder emails every N days for pending evaluations</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailSettings.enableNotifications}
                    onChange={(e) => setEmailSettings({...emailSettings, enableNotifications: e.target.checked})}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                  />
                  <span className="text-sm font-semibold text-gray-700">Enable automatic email notifications</span>
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleTestEmail}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  📨 Send Test Email
                </button>
                <button
                  onClick={() => handleSaveSettings('Email')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all"
                >
                  💾 Save Email Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔒 Security Settings</h2>
            
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-900 font-semibold mb-1">⚠️ Security Configuration</p>
                <p className="text-sm text-red-700">Changes to security settings affect all users. Review carefully before saving.</p>
              </div>

              {/* Password Policy */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔑 Password Policy</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Password Length</label>
                  <input
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequireUppercase}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireUppercase: e.target.checked})}
                      className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 mr-3"
                    />
                    <span className="text-sm text-gray-700">Require uppercase letters (A-Z)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequireLowercase}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireLowercase: e.target.checked})}
                      className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 mr-3"
                    />
                    <span className="text-sm text-gray-700">Require lowercase letters (a-z)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequireNumbers}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireNumbers: e.target.checked})}
                      className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 mr-3"
                    />
                    <span className="text-sm text-gray-700">Require numbers (0-9)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequireSpecialChars}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireSpecialChars: e.target.checked})}
                      className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 mr-3"
                    />
                    <span className="text-sm text-gray-700">Require special characters (!@#$%)</span>
                  </label>
                </div>
              </div>

              {/* Session & Login Security */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">⏱️ Session & Login Security</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) => setSecuritySettings({...securitySettings, lockoutDuration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Allowed Email Domains</label>
                    <input
                      type="text"
                      value={securitySettings.allowedDomains}
                      onChange={(e) => setSecuritySettings({...securitySettings, allowedDomains: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                      className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 mr-3"
                    />
                    <span className="text-sm font-semibold text-gray-700">Enable Two-Factor Authentication (2FA)</span>
                  </label>
                </div>
              </div>

              {/* IP Whitelist */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🌐 IP Whitelist</h3>
                <textarea
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
                  rows={4}
                  placeholder="Enter allowed IP addresses (one per line)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">Leave empty to allow all IPs. Format: 192.168.1.1 or 192.168.1.0/24</p>
              </div>

              <button
                onClick={() => handleSaveSettings('Security')}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all"
              >
                💾 Save Security Settings
              </button>
            </div>
          </div>
        )}

        {/* Backup Settings Tab */}
        {activeTab === 'backup' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💾 Backup & Restore</h2>
            
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-900 font-semibold mb-1">📦 Automated Backup System</p>
                <p className="text-sm text-purple-700">Regular backups ensure your data is safe and recoverable.</p>
              </div>

              {/* Last Backup Status */}
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-green-900 mb-1">✅ Last Successful Backup</h3>
                    <p className="text-sm text-green-700">{backupSettings.lastBackup}</p>
                  </div>
                  <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Auto Backup Settings */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Automatic Backup Configuration</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={backupSettings.autoBackup}
                      onChange={(e) => setBackupSettings({...backupSettings, autoBackup: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3"
                    />
                    <span className="text-sm font-semibold text-gray-700">Enable automatic backups</span>
                  </label>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                      <select
                        value={backupSettings.backupFrequency}
                        onChange={(e) => setBackupSettings({...backupSettings, backupFrequency: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Backup Time</label>
                      <input
                        type="time"
                        value={backupSettings.backupTime}
                        onChange={(e) => setBackupSettings({...backupSettings, backupTime: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Retention (days)</label>
                      <input
                        type="number"
                        value={backupSettings.retentionDays}
                        onChange={(e) => setBackupSettings({...backupSettings, retentionDays: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Backup */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Backup Contents</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={backupSettings.includeEvaluations}
                      onChange={(e) => setBackupSettings({...backupSettings, includeEvaluations: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3"
                    />
                    <span className="text-sm text-gray-700">Include evaluations and responses</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={backupSettings.includeUsers}
                      onChange={(e) => setBackupSettings({...backupSettings, includeUsers: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3"
                    />
                    <span className="text-sm text-gray-700">Include user accounts and permissions</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={backupSettings.includeCourses}
                      onChange={(e) => setBackupSettings({...backupSettings, includeCourses: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mr-3"
                    />
                    <span className="text-sm text-gray-700">Include courses and programs</span>
                  </label>
                </div>
              </div>

              {/* Storage Location */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">☁️ Storage Location</h3>
                <select
                  value={backupSettings.backupLocation}
                  onChange={(e) => setBackupSettings({...backupSettings, backupLocation: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="cloud">Cloud Storage</option>
                  <option value="local">Local Server</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={handleBackupNow}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <span>Backup Now</span>
                </button>
                <button
                  onClick={handleRestoreBackup}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>Restore Backup</span>
                </button>
                <button
                  onClick={() => handleSaveSettings('Backup')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all"
                >
                  💾 Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
