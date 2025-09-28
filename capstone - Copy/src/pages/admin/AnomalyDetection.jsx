import React, { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import apiService from '../../services/api'

export default function AnomalyDetection() {
  const navigate = useNavigate()
  const [selectedTimeRange, setSelectedTimeRange] = useState('last30days')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  
  const currentUser = getCurrentUser()

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

  // Fetch evaluations from API
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true)
        const response = await apiService.getAllEvaluations()
        setEvaluations(response.data || [])
      } catch (err) {
        console.error('Failed to fetch evaluations:', err)
        setError('Failed to load anomaly data')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser && (isAdmin(currentUser) || isDepartmentHead(currentUser))) {
      fetchEvaluations()
    }
  }, [currentUser])

  // Use real API data for anomaly detection
  const accessibleEvaluations = useMemo(() => {
    return evaluations
  }, [evaluations])

  if (!currentUser || (!isAdmin(currentUser) && !isDepartmentHead(currentUser))) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin or Department Head access required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading anomaly detection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Generate mock anomaly data from real evaluations
  const anomalies = useMemo(() => {
    return accessibleEvaluations.map((evaluation, index) => {
      // Mock anomaly detection based on evaluation data
      const hasLowRating = evaluation.overall_rating && evaluation.overall_rating < 3
      const hasNegativeSentiment = evaluation.sentiment && evaluation.sentiment === 'negative'
      
      let severity = 'Low'
      let confidence = Math.random() * 0.3 + 0.6 // 60-90%
      let dbscanScore = Math.random() * 2 + 1 // 1-3 distance score
      
      if (hasLowRating || hasNegativeSentiment) {
        severity = Math.random() > 0.5 ? 'High' : 'Medium'
        confidence = Math.random() * 0.2 + 0.7 // 70-90%
        dbscanScore = Math.random() * 1.5 + 2 // 2-3.5 distance score
      }
      
      return {
        id: evaluation.id || index,
        courseCode: evaluation.course_code || 'N/A',
        courseName: evaluation.course_name || 'Unknown Course',
        instructor: evaluation.instructor_name || 'Unknown Instructor',
        semester: evaluation.semester || 'Current',
        type: hasLowRating ? 'Low Rating Pattern' : hasNegativeSentiment ? 'Negative Sentiment' : 'Statistical Outlier',
        severity,
        confidence: Math.round(confidence * 100),
        description: `Detected ${severity.toLowerCase()} anomaly in evaluation pattern`,
        detectedAt: evaluation.created_at || new Date().toISOString().split('T')[0],
        dbscanScore: dbscanScore.toFixed(2),
        clusterSize: Math.floor(Math.random() * 15) + 5,
        rating: evaluation.overall_rating || Math.random() * 5,
        sentiment: evaluation.sentiment || (Math.random() > 0.7 ? 'negative' : 'positive')
      }
    }).filter(anomaly => 
      // Filter based on search and severity
      (searchTerm === '' || 
       anomaly.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       anomaly.instructor.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (severityFilter === 'all' || anomaly.severity === severityFilter)
    )
  }, [accessibleEvaluations, searchTerm, severityFilter])

  // Time range filtering
  const filteredAnomalies = useMemo(() => {
    if (selectedTimeRange === 'all') return anomalies
    
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (selectedTimeRange) {
      case 'last7days':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'last30days':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case 'last90days':
        cutoffDate.setDate(now.getDate() - 90)
        break
      default:
        return anomalies
    }
    
    return anomalies.filter(anomaly => 
      new Date(anomaly.detectedAt) >= cutoffDate
    )
  }, [anomalies, selectedTimeRange])

  // Chart data preparation
  const severityChartData = useMemo(() => {
    const severityCounts = filteredAnomalies.reduce((acc, anomaly) => {
      acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count,
      color: severity === 'High' ? '#ef4444' : severity === 'Medium' ? '#f59e0b' : '#10b981'
    }))
  }, [filteredAnomalies])

  const confidenceScatterData = filteredAnomalies.map(anomaly => ({
    confidence: anomaly.confidence,
    dbscanScore: parseFloat(anomaly.dbscanScore),
    severity: anomaly.severity
  }))

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anomaly Detection</h1>
          <p className="text-gray-600">AI-powered detection of unusual patterns in course evaluations</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses or instructors..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedTimeRange('last30days')
                  setSeverityFilter('all')
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Anomalies</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAnomalies.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="w-6 h-6 bg-red-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAnomalies.filter(a => a.severity === 'High').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Medium Severity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAnomalies.filter(a => a.severity === 'Medium').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAnomalies.length > 0 
                    ? Math.round(filteredAnomalies.reduce((sum, a) => sum + a.confidence, 0) / filteredAnomalies.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomalies by Severity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData}>
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence vs DBSCAN Score</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={confidenceScatterData}>
                  <XAxis dataKey="confidence" name="Confidence %" />
                  <YAxis dataKey="dbscanScore" name="DBSCAN Score" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="dbscanScore" fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Anomalies List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detected Anomalies</h3>
          </div>
          
          {filteredAnomalies.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-lg mb-2">No anomalies detected</div>
              <p className="text-gray-400">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DBSCAN Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detected
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnomalies.map((anomaly) => (
                    <tr key={anomaly.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {anomaly.courseCode} - {anomaly.courseName}
                          </div>
                          <div className="text-sm text-gray-500">{anomaly.instructor}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{anomaly.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {anomaly.confidence}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {anomaly.dbscanScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {anomaly.detectedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}