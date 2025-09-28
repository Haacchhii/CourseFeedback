import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { mockEvaluations, mockCourses } from '../../data/mock'
import { getCurrentUser, filterEvaluationsByAccess, filterCoursesByAccess, isSecretary } from '../../utils/roleUtils'

export default function HeadDashboard(){
  const currentUser = getCurrentUser()
  
  // Filter states
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  
  // Filter data based on user's access level
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(mockCourses, currentUser)
  }, [currentUser])
  
  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])

  // Get filter options
  const yearLevels = useMemo(() => {
    return [...new Set(accessibleCourses.map(course => course.yearLevel))].sort()
  }, [accessibleCourses])

  // Filter courses based on selected filters
  const filteredCourses = useMemo(() => {
    return accessibleCourses.filter(course => {
      const matchesYearLevel = selectedYearLevel === 'all' || course.yearLevel.toString() === selectedYearLevel
      return matchesYearLevel
    })
  }, [accessibleCourses, selectedYearLevel])

  // Filter evaluations based on filtered courses
  const filteredEvaluations = useMemo(() => {
    return accessibleEvaluations.filter(evaluation => 
      filteredCourses.some(course => course.id === evaluation.courseId)
    )
  }, [accessibleEvaluations, filteredCourses])
  
  const total = filteredEvaluations.length
  const avg = total > 0 ? (filteredEvaluations.reduce((s,e)=> s + (e.ratings? ( (e.ratings.clarity + e.ratings.usefulness + e.ratings.engagement)/3 ) : 3),0)/total).toFixed(2) : '0.00'
  const positive = total > 0 ? (filteredEvaluations.filter(e=>e.sentiment==='positive').length/total*100).toFixed(0) : '0'
  const anomalies = filteredEvaluations.filter(e=>e.anomaly).length

  // Year level-wise sentiment data for stacked bar chart
  const yearLevelSentiment = useMemo(() => {
    const yearData = {}
    filteredCourses.forEach(course => {
      const yearLevel = `Year ${course.yearLevel}`
      if (!yearData[yearLevel]) {
        yearData[yearLevel] = { positive: 0, neutral: 0, negative: 0 }
      }
      
      const courseEvals = filteredEvaluations.filter(e => e.courseId === course.id)
      courseEvals.forEach(evaluation => {
        if (evaluation.sentiment === 'positive') yearData[yearLevel].positive++
        else if (evaluation.sentiment === 'neutral') yearData[yearLevel].neutral++
        else if (evaluation.sentiment === 'negative') yearData[yearLevel].negative++
      })
    })

    return Object.keys(yearData).sort().map(yearLevel => ({
      name: yearLevel,
      positive: yearData[yearLevel].positive,
      neutral: yearData[yearLevel].neutral,
      negative: yearData[yearLevel].negative
    }))
  }, [filteredCourses, filteredEvaluations])

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
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Year Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
            <select
              value={selectedYearLevel}
              onChange={(e) => setSelectedYearLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
            >
              <option value="all">All Year Levels</option>
              {yearLevels.map(yearLevel => (
                <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>
              ))}
            </select>
          </div>

          {/* Filter Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Active Filters</label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {selectedYearLevel !== 'all' && (
                <div>Year Level: {selectedYearLevel}</div>
              )}
              <div>Showing: {filteredCourses.length} courses, {total} evaluations</div>
            </div>
          </div>
        </div>
      </div>
      
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

      {/* Sentiment by Year Level Stacked Bar Chart */}
      {yearLevelSentiment.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">Sentiment Analysis by Year Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearLevelSentiment}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
