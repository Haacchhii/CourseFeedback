import React from 'react'
import { mockEvaluations, mockCourses } from '../../data/mock'

export default function HeadAnomalies(){
  const flagged = mockEvaluations.filter(e=>e.anomaly)
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Anomaly Detection</h1>
      <div className="space-y-3">
        {flagged.map(f=>{
          const course = mockCourses.find(c=>c.id===f.courseId) || {}
          return (
            <div key={f.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{course.name} — {course.instructor}</div>
                  <div className="text-sm text-gray-600">{f.comment.slice(0,120)}</div>
                </div>
                <div className="text-red-600 font-semibold">Flagged</div>
              </div>
            </div>
          )
        })}
        {flagged.length===0 && <div className="bg-white p-4 rounded shadow">No anomalies detected</div>}
      </div>
    </div>
  )
}
