import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function EvaluateCourse(){
  const { courseId } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ratings, setRatings] = useState({ content: null, delivery: null, assessment: null, support: null, overall: null })
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const data = await studentAPI.getCourseDetails(courseId)
        setCourse(data || { name: courseId })
      } catch (err) {
        console.error('Error fetching course:', err)
        setCourse({ name: courseId }) // Fallback
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  const questions = [
    { key: 'content', title: 'Content Quality', help: 'How would you rate the quality of course materials?' },
    { key: 'delivery', title: 'Delivery Method', help: 'How effective was the teaching approach?' },
    { key: 'assessment', title: 'Assessment Fairness', help: 'How fair and appropriate were the assessments?' },
    { key: 'support', title: 'Support Provided', help: 'How would you rate the support provided during the course?' },
    { key: 'overall', title: 'Overall Rating', help: 'How would you rate the overall course experience?' }
  ]

  function setRating(k, v){ setRatings(prev => ({...prev, [k]: Number(v)})) }

  async function submit(){
    setError('')
    if(!comment.trim()) return setError('Please add a comment')
    
    // Validate all ratings are provided
    const missingRatings = questions.filter(q => ratings[q.key] === null)
    if (missingRatings.length > 0) {
      return setError('Please provide all ratings before submitting')
    }
    
    try {
      setSubmitting(true)
      const currentUser = user || JSON.parse(localStorage.getItem('currentUser'))
      
      await studentAPI.submitEvaluation({
        courseId,
        studentId: currentUser.id,
        ratings,
        comment
      })
      
      alert('Evaluation submitted successfully!')
      nav('/student/courses')
    } catch (err) {
      console.error('Error submitting evaluation:', err)
      setError(err.message || 'Failed to submit evaluation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">Course not found</p>
          <button onClick={() => nav('/student/courses')} className="mt-4 px-4 py-2 bg-[#7a0000] text-white rounded">
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold">{course.id || courseId} {course.name}</h1>
          <p className="text-sm text-gray-500">{course.description || 'Learn the basics of programming'}</p>
        </div>

        <div className="space-y-6">
          {questions.map(q => (
            <div key={q.key}>
              <div className="mb-1">
                <div className="font-medium">{q.title}</div>
                <div className="text-xs text-gray-500">{q.help}</div>
              </div>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-3">
                  {[1,2,3,4,5].map(n => (
                    <label key={n} className="flex flex-col items-center text-center text-xs">
                      <input
                        type="radio"
                        name={`${q.key}-rating`}
                        value={n}
                        checked={ratings[q.key] === n}
                        onChange={e=>setRating(q.key, e.target.value)}
                        className="sr-only"
                      />
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full border ${ratings[q.key]===n ? 'bg-[#7a0000] text-white border-[#7a0000]' : 'bg-white text-gray-700 border-gray-300'}`}>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div>
            <div className="font-medium mb-1">Comments and Suggestions</div>
            <div className="text-xs text-gray-500 mb-2">Please provide any additional feedback or suggestions for improvement</div>
            <textarea
              rows={5}
              className="w-full border border-gray-200 rounded p-3 text-sm"
              placeholder={'Enter your comments here... For example: The course materials were very informative but could use more practical examples.'}
              value={comment}
              onChange={e=>setComment(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600">{error}</div>}

          <div className="flex items-center justify-between">
            <button className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100" onClick={()=>nav('/student/courses')}>
              Back to Courses
            </button>
            <button 
              className="px-6 py-2 rounded bg-[#7a0000] hover:bg-[#8f0000] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Evaluation</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
