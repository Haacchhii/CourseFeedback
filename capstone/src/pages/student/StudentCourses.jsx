import React, { useMemo, useState, useEffect } from 'react'
import { mockCourses, mockStudents } from '../../data/mock'
import { Link, useNavigate } from 'react-router-dom'

export default function StudentCourses(){
  const nav = useNavigate()
  const [currentStudent, setCurrentStudent] = useState(null)
  
  function logout(){ try{ localStorage.removeItem('role'); localStorage.removeItem('currentUser') }catch(e){}; nav('/login') }

  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('')

  // Get current student info from localStorage or mock data
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        setCurrentStudent(JSON.parse(storedUser))
      } else {
        // Default to first student if no stored user
        const defaultStudent = mockStudents[0]
        setCurrentStudent(defaultStudent)
        localStorage.setItem('currentUser', JSON.stringify(defaultStudent))
      }
    } catch (e) {
      const defaultStudent = mockStudents[0]
      setCurrentStudent(defaultStudent)
    }
  }, [])

  // Filter courses based on current student's program and year level
  const studentCourses = useMemo(() => {
    if (!currentStudent) return []
    return mockCourses.filter(c => 
      c.program === currentStudent.program && 
      c.yearLevel === currentStudent.yearLevel
    )
  }, [currentStudent])

  const semesters = useMemo(() => {
    const s = Array.from(new Set(studentCourses.map(c => c.semester)));
    return ['All', ...s]
  }, [studentCourses])

  const filtered = useMemo(() => {
    return studentCourses.filter(c => {
      if(semester && semester !== 'All' && c.semester !== semester) return false
      if(!query) return true
      const q = query.toLowerCase()
      return c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.classCode.toLowerCase().includes(q)
    })
  }, [query, semester, studentCourses])

  if (!currentStudent) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">My Courses</h1>
            <p className="text-sm text-gray-500">
              {currentStudent.name} - {currentStudent.program} Year {currentStudent.yearLevel}
            </p>
            <p className="text-xs text-gray-400">Select a course to evaluate</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm text-white bg-[#7a0000] hover:bg-[#8f0000] px-3 py-2 rounded" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <input
            type="search"
            name="course-search"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm shadow-inner"
            placeholder="Search courses by name, code, or class code..."
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <select
            className="border border-gray-200 rounded px-3 py-2 text-sm"
            value={semester}
            onChange={e=>setSemester(e.target.value)}
          >
            {semesters.map(s => (
              <option key={s} value={s === 'All' ? 'All' : s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-3 px-4 border-b">Course Code</th>
                <th className="py-3 px-4 border-b">Class Code</th>
                <th className="py-3 px-4 border-b">Subject Name</th>
                <th className="py-3 px-4 border-b">Instructor</th>
                <th className="py-3 px-4 border-b">Semester</th>
                <th className="py-3 px-4 border-b">Status</th>
                <th className="py-3 px-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 px-4 text-center text-sm text-gray-500">No courses found for your program and year level.</td>
                </tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="align-top hover:bg-gray-50">
                  <td className="py-4 px-4 border-b font-semibold text-sm text-blue-600">{c.id}</td>
                  <td className="py-4 px-4 border-b text-sm font-mono text-gray-700">{c.classCode}</td>
                  <td className="py-4 px-4 border-b text-sm font-medium">{c.name}</td>
                  <td className="py-4 px-4 border-b text-sm text-gray-600">{c.instructor}</td>
                  <td className="py-4 px-4 border-b text-sm text-gray-600">{c.semester}</td>
                  <td className="py-4 px-4 border-b text-sm">
                    {c.status === 'Done' ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Evaluated</span>
                    ) : (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                    )}
                  </td>
                  <td className="py-4 px-4 border-b text-sm">
                    {c.status === 'Done' ? (
                      <span className="text-sm font-medium text-gray-500">Completed</span>
                    ) : (
                      <Link 
                        to={`/student/evaluate/${c.id}`} 
                        className="inline-flex items-center justify-center px-3 py-1 bg-[#7a0000] text-white rounded text-sm hover:bg-[#8f0000] transition-colors"
                      >
                        Evaluate
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
