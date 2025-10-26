import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { mockEvaluations, mockCourses } from '../../data/mock'
import { getCurrentUser, filterEvaluationsByAccess, filterCoursesByAccess, isSecretary } from '../../utils/roleUtils'

export default function HeadDashboard(){
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  
  // Filter states
  const [selectedYearLevel, setSelectedYearLevel] = useState('all')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedSemester, setSelectedSemester] = useState('all')
  
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

  const programs = useMemo(() => {
    return [...new Set(accessibleCourses.map(course => course.program))].sort()
  }, [accessibleCourses])

  const semesters = useMemo(() => {
    return [...new Set(accessibleEvaluations.map(e => e.semester).filter(Boolean))].sort()
  }, [accessibleEvaluations])

  // Filter courses based on selected filters
  const filteredCourses = useMemo(() => {
    return accessibleCourses.filter(course => {
      const matchesYearLevel = selectedYearLevel === 'all' || course.yearLevel.toString() === selectedYearLevel
      const matchesProgram = selectedProgram === 'all' || course.program === selectedProgram
      return matchesYearLevel && matchesProgram
    })
  }, [accessibleCourses, selectedYearLevel, selectedProgram])

  // Filter evaluations based on filtered courses and semester
  const filteredEvaluations = useMemo(() => {
    return accessibleEvaluations.filter(evaluation => {
      const matchesCourse = filteredCourses.some(course => course.id === evaluation.courseId)
      const matchesSemester = selectedSemester === 'all' || evaluation.semester === selectedSemester
      return matchesCourse && matchesSemester
    })
  }, [accessibleEvaluations, filteredCourses, selectedSemester])
  
  const total = filteredEvaluations.length
  // Calculate average rating based on actual avgRating field (4-point scale)
  const avg = total > 0 ? (filteredEvaluations.reduce((s,e)=> s + (e.avgRating || 0),0)/total).toFixed(2) : '0.00'
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
        <div className="grid md:grid-cols-4 gap-4">
          {/* Program Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent cursor-pointer"
            >
              <option value="all">All Programs</option>
              {programs.map(program => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </div>

          {/* Year Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
            <select
              value={selectedYearLevel}
              onChange={(e) => setSelectedYearLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent cursor-pointer"
            >
              <option value="all">All Year Levels</option>
              {yearLevels.map(yearLevel => (
                <option key={yearLevel} value={yearLevel}>Year {yearLevel}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent cursor-pointer"
            >
              <option value="all">All Semesters</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>

          {/* Filter Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Active Filters</label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded h-[42px] flex items-center">
              <div>Showing: {filteredCourses.length} courses, {total} evaluations</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Total Submitted Card - Navigates to Evaluations page */}
        <div 
          className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 cursor-pointer group"
          onClick={() => navigate('/evaluations')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white/90 mb-2">Total Submitted</div>
              <div className="text-3xl font-bold text-white">{total}</div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Average Rating Card - Navigates to Sentiment page */}
        <div 
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 cursor-pointer group"
          onClick={() => navigate('/sentiment')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white/90 mb-2">Average Rating</div>
              <div className="text-3xl font-bold text-white">{avg}</div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Positive Sentiment Card - Navigates to Sentiment page */}
        <div 
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 cursor-pointer group"
          onClick={() => navigate('/sentiment')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white/90 mb-2">% Positive</div>
              <div className="text-3xl font-bold text-white">{positive}%</div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Anomalies Card - Navigates to Anomalies page */}
        <div 
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 cursor-pointer group"
          onClick={() => navigate('/anomalies')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white/90 mb-2">Anomalies</div>
              <div className="text-3xl font-bold text-white">{anomalies}</div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
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
              <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" radius={[4, 4, 0, 0]} />
              <Bar dataKey="neutral" stackId="a" fill="#f59e0b" name="Neutral" radius={[4, 4, 0, 0]} minPointSize={2} />
              <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} minPointSize={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
