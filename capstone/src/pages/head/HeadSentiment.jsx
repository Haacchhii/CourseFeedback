import React from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts'
import { mockEvaluations, mockCourses } from '../../data/mock'

const COLORS = ['#4ade80','#fbbf24','#fb7185']

export default function HeadSentiment(){
  // aggregate by course
  const byCourse = mockCourses.map(c=>{
    const ev = mockEvaluations.filter(e=>e.courseId===c.id)
    const pos = ev.filter(e=>e.sentiment==='positive').length
    const neg = ev.filter(e=>e.sentiment==='negative').length
    const neu = ev.filter(e=>e.sentiment==='neutral').length
    return { name: c.name, pos, neg, neu }
  })

  const lineData = mockCourses.map(c=>({ name: c.name, avg: (Math.random()*2+3).toFixed(2) }))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Sentiment Analysis</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {byCourse.map((c,i)=> (
          <div key={c.name} className="bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2">{c.name}</h3>
            <PieChart width={250} height={200}>
              <Pie data={[{name:'Positive',value:c.pos},{name:'Neutral',value:c.neu},{name:'Negative',value:c.neg}]} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                { [0,1,2].map((j)=> <Cell key={j} fill={COLORS[j]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        ))}

        <div className="bg-white p-4 rounded shadow md:col-span-2">
          <h3 className="font-medium mb-2">Average Rating Trend</h3>
          <LineChart width={600} height={200} data={lineData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="avg" stroke="#4f46e5" />
          </LineChart>
        </div>
      </div>
    </div>
  )
}
