import React, { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { mockCourses, mockEvaluations } from '../../data/mock'

export default function HeadCourses(){
  const [courses, setCourses] = useState(mockCourses.slice())
  const [name, setName] = useState('')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Get course details with evaluations
  const getCourseDetails = (course) => {
    const courseEvaluations = mockEvaluations.filter(e => e.courseId === course.id)
    
    // Generate more realistic evaluation data
    const evaluationCount = Math.max(courseEvaluations.length, Math.floor(Math.random() * 15) + 5)
    const enrollmentCount = Math.floor(evaluationCount * (1.2 + Math.random() * 0.5))
    
    // Generate sample student evaluations if none exist
    const sampleComments = [
      "The course materials were well organized and the instructor explained concepts clearly. I particularly enjoyed the practical exercises.",
      "Good course content but the pace was a bit fast. More examples would have been helpful.",
      "The instructor was very knowledgeable and responsive to questions. The assignments were challenging but fair.",
      "Excellent course! The hands-on approach really helped me understand the concepts better.",
      "The course content was relevant but could use more modern examples. Overall, it was informative."
    ]
    
    const evaluations = courseEvaluations.length > 0 ? courseEvaluations : 
      Array.from({ length: Math.min(evaluationCount, 5) }, (_, i) => ({
        student: `Student ${i + 1}`,
        comment: sampleComments[i % sampleComments.length],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        sentiment: Math.random() > 0.7 ? 'negative' : Math.random() > 0.3 ? 'positive' : 'neutral',
        semester: Math.random() > 0.5 ? 'First 2023' : 'Second 2023'
      }))

    const sentimentBreakdown = {
      positive: evaluations.filter(e => e.sentiment === 'positive').length,
      neutral: evaluations.filter(e => e.sentiment === 'neutral').length,
      negative: evaluations.filter(e => e.sentiment === 'negative').length
    }

    const criteriaRatings = {
      'Content Quality': (Math.random() * 1.5 + 3.5).toFixed(1),
      'Delivery Method': (Math.random() * 1.5 + 3.5).toFixed(1),
      'Assessment Fairness': (Math.random() * 1.5 + 3.5).toFixed(1),
      'Support Provided': (Math.random() * 1.5 + 3.5).toFixed(1)
    }

    return {
      ...course,
      enrollmentCount,
      evaluationCount,
      sentimentBreakdown,
      criteriaRatings,
      evaluations
    }
  }

  const courseDetails = selectedCourse ? getCourseDetails(selectedCourse) : null
  function add(){
    if(!name.trim()) return
    const id = 'C'+(courses.length+101)
    setCourses([...courses, { id, name, instructor: 'TBD', semester: 'Upcoming' }])
    setName('')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Courses</h1>
        <div className="mb-4 flex gap-2">
        <input className="border p-2 rounded" value={name} onChange={e=>setName(e.target.value)} placeholder="Course name" />
  <button className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-4 py-2 rounded" onClick={add}>Add</button>
      </div>
      <div className="space-y-3">
        {courses.map(c=>{
          const ev = mockEvaluations.filter(e=>e.courseId===c.id)
          const avg = ev.length? (ev.reduce((s,e)=> s + ((e.ratings.clarity+e.ratings.usefulness+e.ratings.engagement)/3),0)/ev.length).toFixed(2) : 'N/A'
          return (
            <div key={c.id} className="bg-white p-4 rounded shadow flex justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">{c.instructor} • {c.semester}</div>
              </div>
              <div className="text-right flex items-center space-x-4">
                <div>
                  <div>Avg Rating: <span className="font-semibold">{avg}</span></div>
                  <div className="text-sm text-gray-500">Responses: {ev.length}</div>
                </div>
                <button
                  onClick={() => setSelectedCourse(c)}
                  className="text-[#7a0000] hover:text-[#8f0000] font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && courseDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{courseDetails.name}</h2>
                  <p className="text-gray-600">{courseDetails.classCode || courseDetails.id} • {courseDetails.instructor}</p>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'overview' 
                      ? 'border-[#7a0000] text-[#7a0000]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('sentiment')}
                  className={`py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'sentiment' 
                      ? 'border-[#7a0000] text-[#7a0000]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sentiment Analysis
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-2 border-b-2 font-medium text-sm ${
                    activeTab === 'comments' 
                      ? 'border-[#7a0000] text-[#7a0000]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Student Comments
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overall Rating and Evaluations Side by Side */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Overall Rating */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Overall Rating</h3>
                      <p className="text-sm text-gray-500 mb-4">Average across all evaluations</p>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-blue-600 mb-2">
                          {courseDetails.evaluationCount > 0 ? 
                            (courseDetails.evaluations.reduce((acc, evaluation) => acc + (evaluation.rating || 4), 0) / courseDetails.evaluationCount).toFixed(1) : 
                            '0'
                          }
                          <span className="text-2xl text-gray-400">/5.0</span>
                        </div>
                      </div>
                    </div>

                    {/* Evaluations Count */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Evaluations</h3>
                      <p className="text-sm text-gray-500 mb-4">Total number of evaluations</p>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-blue-600">
                          {courseDetails.evaluationCount > 0 ? courseDetails.evaluationCount : 'No data'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Rating Breakdown</h3>
                    <p className="text-sm text-gray-500 mb-6">Average ratings by category</p>
                    
                    <div className="space-y-4">
                      {Object.entries(courseDetails.criteriaRatings).map(([criterion, rating]) => (
                        <div key={criterion} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">{criterion}</span>
                              <span className="text-sm font-medium">{rating}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${(parseFloat(rating) / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sentiment' && (
                <div className="space-y-6">
                  {/* Criteria Comparison */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Criteria Comparison</h3>
                    <p className="text-sm text-gray-500 mb-6">Breakdown of evaluation criteria</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {Object.entries(courseDetails.criteriaRatings).map(([criterion, rating], index) => {
                        const colors = ['text-green-600', 'text-orange-500', 'text-blue-600', 'text-purple-600'];
                        const bgColors = ['bg-green-100', 'bg-orange-100', 'bg-blue-100', 'bg-purple-100'];
                        return (
                          <div key={criterion} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${bgColors[index % 4]}`}></div>
                            <span className={`text-sm font-medium ${colors[index % 4]}`}>
                              {criterion}: {rating}/5.0
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart */}
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(courseDetails.criteriaRatings).map(([name, value]) => ({ name: name.replace(' ', '\n'), value: parseFloat(value) }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Student Comments</h3>
                    <p className="text-sm text-gray-500 mb-6">Feedback from course evaluations</p>
                    
                    {courseDetails.evaluations.length > 0 ? (
                      <div className="space-y-4">
                        {courseDetails.evaluations.map((evaluation, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-700">
                                  {evaluation.student || `Anonymous Student ${index + 1}`}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  evaluation.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                  evaluation.sentiment === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {evaluation.sentiment || 'neutral'}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-600">
                                  Rating: {evaluation.rating || 4}/5
                                </div>
                                <div className="text-xs text-gray-500">
                                  {evaluation.semester || 'First 2023'}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm italic">
                              "{evaluation.comment || 'The course materials were well organized and the instructor explained concepts clearly. I particularly enjoyed the practical exercises.'}"
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📝</div>
                        <div>No student comments available for this course yet.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
