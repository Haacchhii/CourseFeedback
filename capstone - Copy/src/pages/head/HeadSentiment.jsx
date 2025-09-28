import React, { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import apiService from '../../services/api'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isSecretary } from '../../utils/roleUtils'

export default function HeadSentiment(){
  const currentUser = getCurrentUser()
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [courses, setCourses] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [coursesRes, evaluationsRes] = await Promise.all([
          apiService.getAllCourses(),
          apiService.getAllEvaluations()
        ])
        setCourses(coursesRes.data || [])
        setEvaluations(evaluationsRes.data || [])
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  
  // Filter courses and evaluations based on user's access level
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(courses, currentUser)
  }, [courses, currentUser])
  
  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(evaluations, currentUser)
  }, [evaluations, currentUser])

  // Get year level options
  const yearLevelOptions = useMemo(() => {
    return [...new Set(accessibleCourses.map(course => course.yearLevel))].sort()
  }, [accessibleCourses])

  // Filter courses by year level
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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Sentiment Analysis
        {!isSecretary(currentUser) && currentUser?.assignedPrograms && 
          ` - ${currentUser.assignedPrograms.join(', ')}`
        }
      </h1>
      
      {currentUser && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Analyzing:</span> {
              isSecretary(currentUser) 
                ? `All programs (${accessibleCourses.length} courses)`
                : `${currentUser.assignedPrograms?.join(', ')} programs (${accessibleCourses.length} courses)`
            }
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total evaluations: {filteredEvaluations.length}
          </div>
        </div>
      )}

      {/* Year Level Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
            <select
              value={selectedYearLevel}
              onChange={(e) => setSelectedYearLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
            >
              <option value="all">All Year Levels</option>
              {yearLevelOptions.map(yearLevel => (
                <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Active Filters</label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {selectedYearLevel !== 'all' && (
                <div>Year Level: {selectedYearLevel}</div>
              )}
              <div>Showing: {filteredCourses.length} courses, {filteredEvaluations.length} evaluations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment by Year Level Stacked Bar Chart */}
      {yearLevelSentiment.length > 0 ? (
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
      ) : (
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-500">
            No sentiment data available for the selected filters
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Evaluations will appear here once students submit feedback
          </div>
        </div>
      )}
    </div>
  )
}
