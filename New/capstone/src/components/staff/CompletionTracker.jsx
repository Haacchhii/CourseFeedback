import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, secretaryAPI, deptHeadAPI } from '../../services/api'
import { isAdmin } from '../../utils/roleUtils'

export default function CompletionTracker() {
  const { user: currentUser } = useAuth()
  const [completionData, setCompletionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCompletionData()
  }, [currentUser])

  const fetchCompletionData = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError(null)

      let response
      if (isAdmin(currentUser)) {
        response = await adminAPI.getCompletionRates()
      } else if (currentUser.role === 'secretary') {
        response = await secretaryAPI.getCompletionRates()
      } else if (currentUser.role === 'department_head') {
        response = await deptHeadAPI.getCompletionRates()
      }

      if (response?.success && response?.data) {
        setCompletionData(response.data.overall)
      }
    } catch (err) {
      console.error('Error fetching completion data:', err)
      setError(err.message || 'Failed to load completion data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="lpu-card">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-[#7a0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="lpu-card">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!completionData) {
    return null
  }

  const completionRate = completionData.completion_rate || 0
  const isLowCompletion = completionRate < 70

  return (
    <div className="lpu-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Evaluation Completion
        </h3>
        <button
          onClick={fetchCompletionData}
          className="text-gray-400 hover:text-[#7a0000] transition-colors"
          title="Refresh data"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>

      {/* Completion Rate Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg className="transform -rotate-90 w-40 h-40">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={439.6}
              strokeDashoffset={439.6 - (439.6 * completionRate) / 100}
              className={`${isLowCompletion ? 'text-red-500' : completionRate < 85 ? 'text-yellow-500' : 'text-green-500'} transition-all duration-1000`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${isLowCompletion ? 'text-red-600' : completionRate < 85 ? 'text-yellow-600' : 'text-green-600'}`}>
              {completionRate}%
            </span>
            <span className="text-xs text-gray-500 mt-1">Complete</span>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {completionData.total_evaluations}
          </div>
          <div className="text-sm text-blue-700">Submitted</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {completionData.pending_evaluations}
          </div>
          <div className="text-sm text-orange-700">Pending</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {completionData.total_students}
          </div>
          <div className="text-sm text-purple-700">Total Students</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {completionData.low_completion_courses}
          </div>
          <div className="text-sm text-red-700">Low (&lt;70%)</div>
        </div>
      </div>

      {/* Status Message */}
      {isLowCompletion ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-800">Action Required</h4>
              <p className="text-xs text-red-700 mt-1">
                Completion rate is below 70%. Consider sending reminders to students.
              </p>
            </div>
          </div>
        </div>
      ) : completionRate < 85 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">Room for Improvement</h4>
              <p className="text-xs text-yellow-700 mt-1">
                {completionData.pending_evaluations} students haven't submitted evaluations yet.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-green-800">Excellent Progress</h4>
              <p className="text-xs text-green-700 mt-1">
                Most students have completed their evaluations. Keep up the good work!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
