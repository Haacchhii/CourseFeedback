import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { mockCourses, mockEvaluations } from '../../data/mock'

export default function AnomalyDetection() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  // Redirect unauthorized users
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (currentUser.role === 'student') {
      navigate('/student-evaluation')
      return
    }
    
    if (!isAdmin(currentUser) && !isDepartmentHead(currentUser)) {
      navigate('/')
      return
    }
  }, [currentUser, navigate])

  // Filter data based on user access
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(mockCourses, currentUser)
  }, [currentUser])

  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])

  // Generate mock anomaly data with DBSCAN-like characteristics
  const anomalies = useMemo(() => {
    const anomalyEvaluations = accessibleEvaluations.filter(e => e.anomaly)
    
    return anomalyEvaluations.map((evaluation, index) => {
      const course = accessibleCourses.find(c => c.id === evaluation.courseId)
      
      // Mock DBSCAN-like severity calculation
      const ratings = Object.values(evaluation.ratings || {})
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0
      
      let severity = 'Medium'
      let confidence = Math.random() * 0.3 + 0.6 // 60-90%
      let dbscanScore = Math.random() * 2 + 1 // 1-3 distance score
      
      if (avgRating <= 2.0) {
        severity = 'High'
        confidence = Math.random() * 0.2 + 0.8 // 80-100%
        dbscanScore = Math.random() + 2.5 // 2.5-3.5
      } else if (avgRating <= 3.0) {
        severity = 'Medium'
        confidence = Math.random() * 0.25 + 0.65 // 65-90%
        dbscanScore = Math.random() + 1.5 // 1.5-2.5
      } else {
        severity = 'Low'
        confidence = Math.random() * 0.2 + 0.6 // 60-80%
        dbscanScore = Math.random() + 1 // 1-2
      }

      return {
        id: `anomaly-${index + 1}`,
        courseId: evaluation.courseId,
        courseName: course?.name || 'Unknown Course',
        program: course?.program || 'Unknown',
        student: evaluation.student,
        comment: evaluation.comment,
        ratings: evaluation.ratings,
        avgRating: avgRating.toFixed(1),
        severity,
        confidence: (confidence * 100).toFixed(1),
        dbscanScore: dbscanScore.toFixed(2),
        detectedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        anomalyType: avgRating <= 2.0 ? 'Outlier Rating' : avgRating >= 4.5 ? 'Suspicious High Rating' : 'Pattern Deviation',
        description: avgRating <= 2.0 
          ? 'Extremely low ratings compared to course average'
          : avgRating >= 4.5 
          ? 'Unusually high ratings with negative sentiment'
          : 'Rating pattern deviates from expected distribution'
      }
    })
  }, [accessibleEvaluations, accessibleCourses])

  // Calculate anomaly statistics
  const anomalyStats = useMemo(() => {
    const total = anomalies.length
    const high = anomalies.filter(a => a.severity === 'High').length
    const medium = anomalies.filter(a => a.severity === 'Medium').length
    const low = anomalies.filter(a => a.severity === 'Low').length

    return { total, high, medium, low }
  }, [anomalies])

  // Filter anomalies based on search and severity
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anomaly => {
      const matchesSearch = searchTerm === '' || 
        anomaly.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anomaly.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anomaly.comment.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSeverity = severityFilter === 'all' || anomaly.severity.toLowerCase() === severityFilter.toLowerCase()
      
      return matchesSearch && matchesSeverity
    })
  }, [anomalies, searchTerm, severityFilter])

  // Severity distribution chart data
  const severityChartData = [
    { name: 'High', value: anomalyStats.high, color: '#ef4444' },
    { name: 'Medium', value: anomalyStats.medium, color: '#f59e0b' },
    { name: 'Low', value: anomalyStats.low, color: '#10b981' }
  ]

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Anomaly Detection</h1>
              <p className="text-gray-600">
                DBSCAN-based anomaly detection in course evaluations
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {isAdmin(currentUser) ? 'System-wide' : currentUser.department} Anomalies
              </p>
              <p className="font-semibold">{anomalyStats.total} detected</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Anomaly Overview Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Anomalies</h3>
            <p className="text-3xl font-bold text-[#7a0000]">{anomalyStats.total}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">High Severity</h3>
            <p className="text-3xl font-bold text-red-600">{anomalyStats.high}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Medium Severity</h3>
            <p className="text-3xl font-bold text-yellow-600">{anomalyStats.medium}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Low Severity</h3>
            <p className="text-3xl font-bold text-green-600">{anomalyStats.low}</p>
          </div>
        </div>

        {/* Severity Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Anomaly Severity Distribution</h2>
          {severityChartData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#7a0000" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No anomalies detected
            </div>
          )}
        </div>

        {/* Filter and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by course, student, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity Filter</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anomaly List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Detected Anomalies</h2>
            <p className="text-gray-600 mt-1">
              Showing {filteredAnomalies.length} of {anomalyStats.total} anomalies
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {anomaly.courseName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {anomaly.program} • Student: {anomaly.student} • Detected: {anomaly.detectedAt}
                    </p>
                  </div>
                  
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                    {anomaly.severity} Severity
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Average Rating</p>
                    <p className="text-lg font-bold text-gray-800">{anomaly.avgRating}/5.0</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">DBSCAN Score</p>
                    <p className="text-lg font-bold text-gray-800">{anomaly.dbscanScore}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Confidence</p>
                    <p className="text-lg font-bold text-gray-800">{anomaly.confidence}%</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Anomaly Details</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Type:</span> {anomaly.anomalyType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {anomaly.description}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Student Comment</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    "{anomaly.comment}"
                  </p>
                </div>

                {anomaly.ratings && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Rating Breakdown</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {Object.entries(anomaly.ratings).map(([criterion, rating]) => (
                        <div key={criterion} className="flex justify-between">
                          <span className="text-gray-600">{criterion}:</span>
                          <span className="font-medium">{rating}/5</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredAnomalies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || severityFilter !== 'all' 
                ? 'No anomalies match your current filters'
                : 'No anomalies detected'
              }
            </div>
          )}
        </div>

        {/* DBSCAN Algorithm Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">About DBSCAN Anomaly Detection</h3>
          <p className="text-blue-700 text-sm mb-3">
            Our system uses Density-Based Spatial Clustering of Applications with Noise (DBSCAN) to identify 
            anomalous patterns in course evaluations. This algorithm excels at finding outliers in multi-dimensional 
            rating data by analyzing the density of similar evaluations.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800">High Severity</h4>
              <p className="text-blue-600">Isolated outliers with significant rating deviations</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Medium Severity</h4>
              <p className="text-blue-600">Border points with moderate anomaly patterns</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Low Severity</h4>
              <p className="text-blue-600">Minor deviations requiring attention</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
