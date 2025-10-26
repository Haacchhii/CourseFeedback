import React, { useState } from 'react'

const initial = [ { id:1, name: 'Default Set', active: true, questions: ['Clarity','Usefulness','Engagement'] } ]

export default function HeadQuestions(){
  const [sets, setSets] = useState(initial)
  const [name, setName] = useState('')

  // editing states
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingQuestions, setEditingQuestions] = useState([])
  const [newQuestion, setNewQuestion] = useState('')

  function add(){
    if(!name.trim()) return
    setSets([...sets, { id: Date.now(), name, active: false, questions: [] }])
    setName('')
  }

  function startEdit(s){
    setEditingId(s.id)
    setEditingName(s.name)
    setEditingQuestions([...s.questions])
    setNewQuestion('')
  }

  function addQuestionLocal(){
    if(!newQuestion.trim()) return
    setEditingQuestions([...editingQuestions, newQuestion.trim()])
    setNewQuestion('')
  }

  function updateQuestionLocal(idx, value){
    const copy = [...editingQuestions]
    copy[idx] = value
    setEditingQuestions(copy)
  }

  function removeQuestionLocal(idx){
    const copy = editingQuestions.filter((_,i)=>i!==idx)
    setEditingQuestions(copy)
  }

  function saveEdit(){
    setSets(sets.map(s => s.id === editingId ? { ...s, name: editingName, questions: editingQuestions } : s))
    setEditingId(null)
    setEditingName('')
    setEditingQuestions([])
    setNewQuestion('')
  }

  function cancelEdit(){
    setEditingId(null)
    setEditingName('')
    setEditingQuestions([])
    setNewQuestion('')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Evaluation Questions</h1>
      <div className="mb-4 flex gap-2">
        <input className="border p-2 rounded" value={name} onChange={e=>setName(e.target.value)} placeholder="Question set name" />
        <button className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-4 py-2 rounded" onClick={add}>Create</button>
      </div>

      <div className="space-y-3">
        {sets.map(s=> (
          <div key={s.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="font-medium">{s.name} {s.active && <span className="text-sm text-green-600">(active)</span>}</div>
                <div className="text-sm text-gray-600 mb-2">{s.questions.length} questions collected</div>

                {editingId === s.id ? (
                  <div className="space-y-2">
                    <input className="border p-2 rounded w-full mb-2" value={editingName} onChange={e=>setEditingName(e.target.value)} />
                    <div className="space-y-1">
                      {editingQuestions.map((q,idx)=> (
                        <div key={idx} className="flex gap-2 items-center">
                          <input className="flex-1 border p-2 rounded" value={q} onChange={e=>updateQuestionLocal(idx, e.target.value)} />
                          <button className="px-2 py-1 text-sm text-red-600" onClick={()=>removeQuestionLocal(idx)}>Delete</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input className="flex-1 border p-2 rounded" placeholder="New question" value={newQuestion} onChange={e=>setNewQuestion(e.target.value)} />
                      <button className="px-3 py-1 bg-gray-200 rounded" onClick={addQuestionLocal}>Add</button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 bg-[#7a0000] text-white rounded" onClick={saveEdit}>Save</button>
                      <button className="px-3 py-1 border rounded" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {s.questions.slice(0,5).map((q,idx)=>(<div key={idx} className="text-gray-700">• {q}</div>))}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {editingId === s.id ? (
                  <div className="text-sm text-gray-500">Editing</div>
                ) : (
                  <div>
                    <button className="px-3 py-1 border rounded" onClick={()=>startEdit(s)}>Edit</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
