import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { questionnaireCategories } from '../../data/questionnaireConfig'

export default function EvaluateCourse(){
  const { courseId } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Initialize ratings state from questionnaire config
  const [ratings, setRatings] = useState(() => {
    const initial = {}
    questionnaireCategories.forEach(category => {
      category.questions.forEach(question => {
        initial[question.id] = null
      })
    })
    return initial
  })
  
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [currentCategory, setCurrentCategory] = useState(0)
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

  function setRating(questionId, value) {
    setRatings(prev => ({...prev, [questionId]: Number(value)}))
  }

  function getCategoryProgress(categoryIndex) {
    const category = questionnaireCategories[categoryIndex]
    const answered = category.questions.filter(q => ratings[q.id] !== null).length
    return (answered / category.questions.length) * 100
  }

  function canSubmit() {
    // Check all ratings are provided
    const allRatingsProvided = Object.values(ratings).every(r => r !== null)
    // Comment is optional - can be blank
    return allRatingsProvided
  }

  async function submit(){
    setError('')
    
    if (!canSubmit()) {
      return setError('Please complete all ratings before submitting')
    }
    
    try {
      setSubmitting(true)
      const currentUser = user || JSON.parse(localStorage.getItem('currentUser'))
      
      console.log('Submitting evaluation:', {
        courseId,
        studentId: currentUser.id,
        ratingsCount: Object.keys(ratings).length,
        hasComment: !!comment
      })
      
      // Backend accepts either user.id or student.id and converts automatically
      await studentAPI.submitEvaluation({
        class_section_id: parseInt(courseId),
        student_id: currentUser.id, // Can be either users.id or students.id
        ratings,
        comment
      })
      
      alert('Evaluation submitted successfully!')
      nav('/student/courses')
    } catch (err) {
      console.error('Error submitting evaluation:', err)
      console.error('Error response:', err.response?.data)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to submit evaluation. Please try again.'
      setError(errorMsg)
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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-[#7a0000] to-[#8f0000]">
          <button 
            onClick={() => nav('/student/courses')} 
            className="text-white hover:text-gray-200 mb-3 flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Courses
          </button>
          <h1 className="text-2xl font-bold text-white">{course.name}</h1>
          <p className="text-sm text-gray-200 mt-1">
            {course.class_code || courseId} • {course.instructor_name || 'Instructor'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">
              {Object.values(ratings).filter(r => r !== null).length} of {Object.keys(ratings).length} questions answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#7a0000] h-2 rounded-full transition-all duration-300"
              style={{width: `${(Object.values(ratings).filter(r => r !== null).length / Object.keys(ratings).length) * 100}%`}}
            ></div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4 border-b">
          <div className="flex overflow-x-auto space-x-2 -mb-px">
            {questionnaireCategories.map((category, idx) => {
              const progress = getCategoryProgress(idx)
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentCategory(idx)}
                  className={`px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    currentCategory === idx
                      ? 'border-[#7a0000] text-[#7a0000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{category.name}</span>
                    {progress === 100 && (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-[#7a0000] h-1 rounded-full transition-all"
                      style={{width: `${progress}%`}}
                    ></div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Questions */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800">{questionnaireCategories[currentCategory].name}</h2>
            <p className="text-sm text-gray-600 mt-1">{questionnaireCategories[currentCategory].description}</p>
          </div>

          <div className="space-y-8">
            {questionnaireCategories[currentCategory].questions.map((question) => (
              <div key={question.id} className="border-b pb-6 last:border-b-0">
                <div className="mb-3">
                  <div className="font-medium text-gray-800">{question.text}</div>
                  <div className="text-xs text-gray-500 mt-1">{question.shortLabel}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 w-28">Strongly Disagree</span>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    {[1, 2, 3, 4].map(value => (
                      <label key={value} className="flex flex-col items-center cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={value}
                          checked={ratings[question.id] === value}
                          onChange={(e) => setRating(question.id, e.target.value)}
                          className="sr-only"
                        />
                        <span className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold text-sm transition-all ${
                          ratings[question.id] === value
                            ? 'bg-[#7a0000] text-white border-[#7a0000] scale-110'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#7a0000] hover:scale-105'
                        }`}>
                          {value}
                        </span>
                        <span className="mt-2 text-[10px] text-gray-500 text-center">
                          {value === 1 ? 'Strongly\nDisagree' : value === 2 ? 'Disagree' : value === 3 ? 'Agree' : 'Strongly\nAgree'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 w-28 text-right">Strongly Agree</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <button
              onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
              disabled={currentCategory === 0}
              className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Previous
            </button>
            <div className="text-sm text-gray-600">
              Category {currentCategory + 1} of {questionnaireCategories.length}
            </div>
            <button
              onClick={() => setCurrentCategory(Math.min(questionnaireCategories.length - 1, currentCategory + 1))}
              disabled={currentCategory === questionnaireCategories.length - 1}
              className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="font-medium mb-2">Additional Comments and Suggestions</div>
          <div className="text-xs text-gray-500 mb-3">Please provide any additional feedback or suggestions for improvement (optional)</div>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
            placeholder="Enter your comments here... For example: The course materials were very informative but could use more practical examples."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          {comment.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {comment.length} characters
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="px-6 py-4 bg-white border-t">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {canSubmit() ? (
                <span className="text-green-600 font-medium flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Ready to submit!
                </span>
              ) : (
                <span>Complete all questions to submit</span>
              )}
            </div>
            
            <button 
              className="px-8 py-3 rounded-lg bg-[#7a0000] hover:bg-[#8f0000] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
              onClick={submit}
              disabled={submitting || !canSubmit()}
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
