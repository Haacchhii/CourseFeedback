import React, { useState, useMemo } from 'react'
import { mockEvaluations, mockCourses } from '../../data/mock'
import { getCurrentUser, filterEvaluationsByAccess } from '../../utils/roleUtils'

export default function HeadEvaluations(){
  const currentUser = getCurrentUser()
  const [q, setQ] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')
  
  // Filter evaluations based on user's access level
  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])

  const filteredEvaluations = useMemo(() => {
    return accessibleEvaluations.filter(d => {
      // Text search filter
      const matchesSearch = d.comment.toLowerCase().includes(q.toLowerCase())
      
      // Sentiment filter
      const matchesSentiment = !sentimentFilter || sentimentFilter === 'All' || d.sentiment === sentimentFilter
      
      return matchesSearch && matchesSentiment
    })
  }, [accessibleEvaluations, q, sentimentFilter])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        All Evaluations
        {currentUser?.assignedPrograms && 
          ` - ${currentUser.assignedPrograms.join(', ')}`
        }
      </h1>

      {/* Filters Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Search Comments</label>
            <input 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              className="border p-2 rounded w-full" 
              placeholder="Search comments..." 
            />
          </div>

          {/* Program Filter (Read-only for Department Heads) */}
          <div>
            <label className="block text-sm font-medium mb-1">Program</label>
            <input 
              type="text"
              value={currentUser?.assignedPrograms?.join(', ') || 'No programs assigned'}
              readOnly
              className="border p-2 rounded w-full bg-gray-100 text-gray-600 cursor-not-allowed"
              title="Department heads can only view evaluations for their assigned programs"
            />
          </div>

          {/* Sentiment Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Sentiment</label>
            <select 
              className="border p-2 rounded w-full"
              value={sentimentFilter}
              onChange={e => setSentimentFilter(e.target.value)}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-2">
          Showing {filteredEvaluations.length} of {accessibleEvaluations.length} evaluations
        </div>
      </div>

      {/* Evaluations List */}
      <div className="space-y-2">
        {filteredEvaluations.map(f=> {
          const course = mockCourses.find(c => c.id === f.courseId)
          return (
            <div key={f.id} className="bg-white p-3 rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-gray-600">
                  {f.courseId} • {f.semester}
                  {course && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {course.program}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    f.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    f.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {f.sentiment}
                  </span>
                  {f.anomaly && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      Anomaly
                    </span>
                  )}
                </div>
              </div>
              <div className="font-medium">{f.student}</div>
              <div className="text-gray-700 mt-1">{f.comment}</div>
            </div>
          )
        })}
        {filteredEvaluations.length===0 && (
          <div className="bg-white p-3 rounded shadow text-center text-gray-500">
            No evaluations found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}
