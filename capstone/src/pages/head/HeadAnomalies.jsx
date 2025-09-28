import React, { useMemo } from 'react'
import { mockEvaluations, mockCourses } from '../../data/mock'
import { getCurrentUser, filterEvaluationsByAccess, isSecretary } from '../../utils/roleUtils'

export default function HeadAnomalies(){
  const currentUser = getCurrentUser()
  
  // Filter evaluations based on user's access level, then filter for anomalies
  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])
  
  const flagged = accessibleEvaluations.filter(e=>e.anomaly)
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Anomaly Detection
        {!isSecretary(currentUser) && currentUser?.assignedPrograms && 
          ` - ${currentUser.assignedPrograms.join(', ')}`
        }
      </h1>
      
      {currentUser && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Access Level:</span> {
              isSecretary(currentUser) 
                ? 'Full Access - Monitoring all programs for anomalies'
                : `Department Access - Monitoring ${currentUser.assignedPrograms?.join(', ')} programs`
            }
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Found {flagged.length} anomalies in {accessibleEvaluations.length} total evaluations
          </div>
        </div>
      )}

      <div className="space-y-3">
        {flagged.map(f=>{
          const course = mockCourses.find(c=>c.id===f.courseId) || {}
          return (
            <div key={f.id} className="bg-white p-4 rounded shadow border-l-4 border-red-500">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">
                    {course.name} — {course.instructor}
                    {course.program && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {course.program}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Student: {f.student} • {f.semester}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {f.comment.slice(0,120)}{f.comment.length > 120 ? '...' : ''}
                  </div>
                  {f.sentiment && (
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        f.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        f.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        Sentiment: {f.sentiment}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-red-600 font-semibold text-sm">
                  🚩 FLAGGED
                </div>
              </div>
            </div>
          )
        })}
        {flagged.length===0 && (
          <div className="bg-white p-4 rounded shadow text-center">
            <div className="text-green-600 font-medium">✅ No anomalies detected</div>
            <div className="text-sm text-gray-500 mt-1">
              All evaluations in your assigned programs appear normal
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
