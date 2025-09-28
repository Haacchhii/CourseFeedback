import React from 'react'
import { mockEvaluations, mockCourses } from '../../data/mock'
import { getCurrentUser, filterEvaluationsByAccess, isSecretary } from '../../utils/roleUtils'

export default function HeadDashboard(){
  const currentUser = getCurrentUser()
  
  // Filter evaluations based on user's access level
  const accessibleEvaluations = filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  
  const total = accessibleEvaluations.length
  const avg = total > 0 ? (accessibleEvaluations.reduce((s,e)=> s + (e.ratings? ( (e.ratings.clarity + e.ratings.usefulness + e.ratings.engagement)/3 ) : 3),0)/total).toFixed(2) : '0.00'
  const positive = total > 0 ? (accessibleEvaluations.filter(e=>e.sentiment==='positive').length/total*100).toFixed(0) : '0'
  const anomalies = accessibleEvaluations.filter(e=>e.anomaly).length

  const getRoleSpecificTitle = () => {
    if (isSecretary(currentUser)) {
      return 'Secretary Dashboard - All Programs'
    }
    if (currentUser?.assignedPrograms) {
      return `Department Head Dashboard - ${currentUser.assignedPrograms.join(', ')}`
    }
    return 'Dashboard Overview'
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{getRoleSpecificTitle()}</h1>
      {currentUser && (
        <p className="text-sm text-gray-600 mb-4">
          Showing data for: {currentUser.assignedPrograms?.join(', ') || 'All Programs'}
        </p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">Total Submitted</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">Average Rating</div>
          <div className="text-2xl font-bold">{avg}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">% Positive</div>
          <div className="text-2xl font-bold">{positive}%</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-600">Anomalies</div>
          <div className="text-2xl font-bold text-red-600">{anomalies}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Evaluation Trend</h3>
          <div className="text-sm text-gray-500">Chart placeholder for your accessible courses</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Sentiment Breakdown</h3>
          <div className="text-sm text-gray-500">Sentiment analysis for your programs</div>
        </div>
      </div>
    </div>
  )
}
