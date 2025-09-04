import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockCourses, mockEvaluations } from '../data/mock'

export default function EvaluateCourse(){
  const { courseId } = useParams()
  const course = mockCourses.find(c=>c.id===courseId) || { name: courseId }
  const [ratings, setRatings] = useState({ content: null, delivery: null, assessment: null, support: null, overall: null })
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  const questions = [
    { key: 'content', title: 'Content Quality', help: 'How would you rate the quality of course materials?' },
    { key: 'delivery', title: 'Delivery Method', help: 'How effective was the teaching approach?' },
    { key: 'assessment', title: 'Assessment Fairness', help: 'How fair and appropriate were the assessments?' },
    { key: 'support', title: 'Support Provided', help: 'How would you rate the support provided during the course?' },
    { key: 'overall', title: 'Overall Rating', help: 'How would you rate the overall course experience?' }
  ]

  function setRating(k, v){ setRatings(prev => ({...prev, [k]: Number(v)})) }

  function submit(){
    setError('')
    if(!comment.trim()) return setError('Please add a comment')
    // push to mock (in real app we'd POST)
    mockEvaluations.push({ id: 'e'+(mockEvaluations.length+1), courseId, student: 'You', ratings, comment, sentiment: 'neutral', anomaly: false, semester: course.semester || 'Unknown' })
    // mark course as done
    const c = mockCourses.find(x=>x.id===courseId)
    if(c) c.status = 'Done'
    nav('/student/courses')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold">{course.id} {course.name}</h1>
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
            <button className="px-4 py-2 border rounded bg-gray-50" onClick={()=>nav('/student/courses')}>Back to Courses</button>
            <button className="px-4 py-2 rounded bg-[#7a0000] hover:bg-[#8f0000] text-white" onClick={submit}>Submit Evaluation</button>
          </div>
        </div>
      </div>
    </div>
  )
}
