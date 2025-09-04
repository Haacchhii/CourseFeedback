import React, { useState } from 'react'
import { mockEvaluations } from '../../data/mock'

export default function HeadEvaluations(){
  const [q, setQ] = useState('')
  const [data] = useState(mockEvaluations.slice())
  const filtered = data.filter(d=> d.comment.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">All Evaluations</h1>
      <div className="mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded w-full" placeholder="Search comments..." />
      </div>
      <div className="space-y-2">
        {filtered.map(f=> (
          <div key={f.id} className="bg-white p-3 rounded shadow">
            <div className="text-sm text-gray-600">{f.courseId} • {f.semester}</div>
            <div className="font-medium">{f.student} — {f.sentiment}</div>
            <div className="text-gray-700">{f.comment}</div>
          </div>
        ))}
        {filtered.length===0 && <div className="bg-white p-3 rounded shadow">No results</div>}
      </div>
    </div>
  )
}
