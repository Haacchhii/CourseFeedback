import React, { useState } from 'react'
import { mockCourses, mockEvaluations } from '../../data/mock'

export default function HeadCourses(){
  const [courses, setCourses] = useState(mockCourses.slice())
  const [name, setName] = useState('')
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
              <div className="text-right">
                <div>Avg Rating: <span className="font-semibold">{avg}</span></div>
                <div className="text-sm text-gray-500">Responses: {ev.length}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
