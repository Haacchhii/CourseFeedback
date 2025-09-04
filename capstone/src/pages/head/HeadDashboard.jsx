import React from 'react'
import { mockEvaluations } from '../../data/mock'

export default function HeadDashboard(){
  const total = mockEvaluations.length
  const avg = (mockEvaluations.reduce((s,e)=> s + (e.ratings? ( (e.ratings.clarity + e.ratings.usefulness + e.ratings.engagement)/3 ) : 3),0)/total).toFixed(2)
  const positive = (mockEvaluations.filter(e=>e.sentiment==='positive').length/total*100).toFixed(0)
  const anomalies = mockEvaluations.filter(e=>e.anomaly).length

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">Total Submitted<div className="text-2xl font-bold">{total}</div></div>
        <div className="bg-white p-4 rounded shadow">Average Rating<div className="text-2xl font-bold">{avg}</div></div>
        <div className="bg-white p-4 rounded shadow">% Positive<div className="text-2xl font-bold">{positive}%</div></div>
        <div className="bg-white p-4 rounded shadow">Anomalies<div className="text-2xl font-bold">{anomalies}</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">Placeholder for trend chart</div>
        <div className="bg-white p-4 rounded shadow">Placeholder for sentiment breakdown</div>
      </div>
    </div>
  )
}
