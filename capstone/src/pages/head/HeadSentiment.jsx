import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts'
import { mockEvaluations, mockCourses } from '../../data/mock'
import { getCurrentUser, filterCoursesByAccess, filterEvaluationsByAccess, isSecretary } from '../../utils/roleUtils'

const COLORS = ['#4ade80','#fbbf24','#fb7185']

export default function HeadSentiment(){
  const currentUser = getCurrentUser()
  
  // Filter courses and evaluations based on user's access level
  const accessibleCourses = useMemo(() => {
    return filterCoursesByAccess(mockCourses, currentUser)
  }, [currentUser])
  
  const accessibleEvaluations = useMemo(() => {
    return filterEvaluationsByAccess(mockEvaluations, mockCourses, currentUser)
  }, [currentUser])

  // aggregate by course (only accessible courses)
  const byCourse = accessibleCourses.map(c=>{
    const ev = accessibleEvaluations.filter(e=>e.courseId===c.id)
    const pos = ev.filter(e=>e.sentiment==='positive').length
    const neg = ev.filter(e=>e.sentiment==='negative').length
    const neu = ev.filter(e=>e.sentiment==='neutral').length
    return { 
      name: c.name, 
      pos, 
      neg, 
      neu, 
      total: ev.length,
      program: c.program 
    }
  }).filter(c => c.total > 0) // Only show courses with evaluations

  const lineData = accessibleCourses.map(c=>({ 
    name: c.name, 
    avg: (Math.random()*2+3).toFixed(2),
    program: c.program 
  }))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Sentiment Analysis
        {!isSecretary(currentUser) && currentUser?.assignedPrograms && 
          ` - ${currentUser.assignedPrograms.join(', ')}`
        }
      </h1>
      
      {currentUser && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Analyzing:</span> {
              isSecretary(currentUser) 
                ? `All programs (${accessibleCourses.length} courses)`
                : `${currentUser.assignedPrograms?.join(', ')} programs (${accessibleCourses.length} courses)`
            }
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Total evaluations: {accessibleEvaluations.length}
          </div>
        </div>
      )}

      {byCourse.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {byCourse.map((c,i)=> (
            <div key={c.name} className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">
                {c.name}
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {c.program}
                </span>
              </h3>
              <div className="text-xs text-gray-500 mb-2">
                {c.total} evaluations
              </div>
              <PieChart width={250} height={200}>
                <Pie 
                  data={[
                    {name:'Positive',value:c.pos},
                    {name:'Neutral',value:c.neu},
                    {name:'Negative',value:c.neg}
                  ]} 
                  dataKey="value" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={60}
                >
                  { [0,1,2].map((j)=> <Cell key={j} fill={COLORS[j]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          ))}

          {lineData.length > 0 && (
            <div className="bg-white p-4 rounded shadow md:col-span-2">
              <h3 className="font-medium mb-2">Average Rating Trend</h3>
              <LineChart width={600} height={200} data={lineData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#4f46e5" />
              </LineChart>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-500">
            No sentiment data available for your assigned programs
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Evaluations will appear here once students submit feedback
          </div>
        </div>
      )}
    </div>
  )
}
