import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../../utils/roleUtils'

// Mock evaluation questions data
const mockQuestionSets = [
  {
    id: 'qs-1',
    title: 'Standard Course Evaluation',
    description: 'Standard 5-point Likert scale evaluation for all courses',
    type: 'global',
    status: 'active',
    createdBy: 'System',
    department: null,
    createdDate: '2024-01-15',
    questions: [
      { id: 'q1', text: 'The course content was well-organized and clear', type: 'likert', category: 'Content Quality' },
      { id: 'q2', text: 'The instructor explained concepts effectively', type: 'likert', category: 'Delivery Method' },
      { id: 'q3', text: 'Assignments and exams fairly assessed my understanding', type: 'likert', category: 'Assessment Fairness' },
      { id: 'q4', text: 'The instructor was available for help when needed', type: 'likert', category: 'Support Provided' },
      { id: 'q5', text: 'Overall, I would recommend this course to other students', type: 'likert', category: 'Overall Rating' },
      { id: 'q6', text: 'Additional comments or suggestions', type: 'text', category: 'Comments' }
    ]
  },
  {
    id: 'qs-2',
    title: 'Laboratory Course Evaluation',
    description: 'Specialized evaluation for laboratory and practical courses',
    type: 'global',
    status: 'active',
    createdBy: 'Dr. Admin',
    department: null,
    createdDate: '2024-02-01',
    questions: [
      { id: 'q1', text: 'Laboratory equipment was adequate and functional', type: 'likert', category: 'Resources' },
      { id: 'q2', text: 'Laboratory procedures were clearly explained', type: 'likert', category: 'Instruction' },
      { id: 'q3', text: 'Safety protocols were properly implemented', type: 'likert', category: 'Safety' },
      { id: 'q4', text: 'Hands-on activities enhanced my learning', type: 'likert', category: 'Learning Experience' },
      { id: 'q5', text: 'Additional feedback on laboratory experience', type: 'text', category: 'Comments' }
    ]
  },
  {
    id: 'qs-3',
    title: 'BSIT Specialized Evaluation',
    description: 'Evaluation tailored for Information Technology courses',
    type: 'department',
    status: 'active',
    createdBy: 'Melody Dimaano',
    department: 'Information Technology',
    createdDate: '2024-03-10',
    questions: [
      { id: 'q1', text: 'The course covered relevant industry technologies', type: 'likert', category: 'Relevance' },
      { id: 'q2', text: 'Practical programming exercises were helpful', type: 'likert', category: 'Practice' },
      { id: 'q3', text: 'Industry best practices were discussed', type: 'likert', category: 'Industry Connection' },
      { id: 'q4', text: 'Overall course effectiveness', type: 'likert', category: 'Overall' }
    ]
  }
]

export default function EvaluationQuestions() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null)
  
  // Form states for creating new question set
  const [newQuestionSet, setNewQuestionSet] = useState({
    title: '',
    description: '',
    questions: [
      { text: '', type: 'likert', category: 'Content Quality' }
    ]
  })

  // Redirect unauthorized users
  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }
    
    if (currentUser.role === 'student') {
      navigate('/student-evaluation')
      return
    }
    
    if (!isAdmin(currentUser) && !isDepartmentHead(currentUser)) {
      navigate('/')
      return
    }
  }, [currentUser, navigate])

  // Filter question sets based on user role and filters
  const filteredQuestionSets = useMemo(() => {
    let sets = mockQuestionSets

    // Filter by user role
    if (isDepartmentHead(currentUser)) {
      // Department heads can see global templates and their own department's sets
      sets = sets.filter(set => 
        set.type === 'global' || 
        (set.type === 'department' && set.department === currentUser.department)
      )
    }

    // Apply search and status filters
    return sets.filter(set => {
      const matchesSearch = searchTerm === '' || 
        set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || set.status === statusFilter
      const matchesType = typeFilter === 'all' || set.type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [currentUser, searchTerm, statusFilter, typeFilter])

  // Question set statistics
  const questionSetStats = useMemo(() => {
    const total = filteredQuestionSets.length
    const active = filteredQuestionSets.filter(set => set.status === 'active').length
    const archived = filteredQuestionSets.filter(set => set.status === 'archived').length
    const global = filteredQuestionSets.filter(set => set.type === 'global').length
    const department = filteredQuestionSets.filter(set => set.type === 'department').length

    return { total, active, archived, global, department }
  }, [filteredQuestionSets])

  const handleCreateQuestionSet = () => {
    // In a real app, this would make an API call
    console.log('Creating question set:', newQuestionSet)
    setShowCreateModal(false)
    setNewQuestionSet({
      title: '',
      description: '',
      questions: [{ text: '', type: 'likert', category: 'Content Quality' }]
    })
  }

  const handleStatusChange = (questionSetId, newStatus) => {
    // In a real app, this would make an API call
    console.log(`Changing status of ${questionSetId} to ${newStatus}`)
  }

  const addQuestion = () => {
    setNewQuestionSet(prev => ({
      ...prev,
      questions: [...prev.questions, { text: '', type: 'likert', category: 'Content Quality' }]
    }))
  }

  const removeQuestion = (index) => {
    setNewQuestionSet(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestion = (index, field, value) => {
    setNewQuestionSet(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'global': return 'bg-blue-100 text-blue-800'
      case 'department': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Evaluation Questions</h1>
              <p className="text-gray-600">
                {isAdmin(currentUser) 
                  ? 'Manage global question templates and approve department submissions' 
                  : `Manage ${currentUser.department} department question sets`
                }
              </p>
            </div>
            
            <div className="flex space-x-4">
              {isAdmin(currentUser) && (
                <>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200">
                    Import Questions
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200">
                    Export Questions
                  </button>
                </>
              )}
              
              {isDepartmentHead(currentUser) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
                >
                  Create Question Set
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Sets</h3>
            <p className="text-3xl font-bold text-[#7a0000]">{questionSetStats.total}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active</h3>
            <p className="text-3xl font-bold text-green-600">{questionSetStats.active}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Archived</h3>
            <p className="text-3xl font-bold text-gray-600">{questionSetStats.archived}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Global</h3>
            <p className="text-3xl font-bold text-blue-600">{questionSetStats.global}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Department</h3>
            <p className="text-3xl font-bold text-purple-600">{questionSetStats.department}</p>
          </div>
        </div>

        {/* Admin Features */}
        {isAdmin(currentUser) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Question Settings</h3>
                <p className="text-blue-700 text-sm mb-3">Configure global question parameters and validation rules</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                  Configure Settings
                </button>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Global Templates</h3>
                <p className="text-green-700 text-sm mb-3">Manage system-wide question templates</p>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                  Manage Templates
                </button>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Approval Queue</h3>
                <p className="text-yellow-700 text-sm mb-3">Review and approve department submissions</p>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm">
                  View Queue (0)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search question sets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="global">Global</option>
                <option value="department">Department</option>
              </select>
            </div>
          </div>
        </div>

        {/* Question Sets List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Question Sets Overview</h2>
            <p className="text-gray-600 mt-1">
              Showing {filteredQuestionSets.length} question sets
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredQuestionSets.map((questionSet) => (
              <div key={questionSet.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {questionSet.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {questionSet.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created by: {questionSet.createdBy}</span>
                      <span>Date: {questionSet.createdDate}</span>
                      <span>Questions: {questionSet.questions.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(questionSet.type)}`}>
                      {questionSet.type}
                    </span>
                    <button
                      onClick={() => handleStatusChange(questionSet.id, questionSet.status === 'active' ? 'archived' : 'active')}
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${getStatusColor(questionSet.status)}`}
                    >
                      {questionSet.status}
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Question Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(questionSet.questions.map(q => q.category))].map(category => (
                        <span key={category} className="inline-flex px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setSelectedQuestionSet(questionSet)}
                      className="text-[#7a0000] hover:text-[#8f0000] text-sm font-medium"
                    >
                      Preview Questions
                    </button>
                    {(isAdmin(currentUser) || 
                      (isDepartmentHead(currentUser) && questionSet.department === currentUser.department)) && (
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredQuestionSets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No question sets match your current filters'
                : 'No question sets available'
              }
            </div>
          )}
        </div>
      </div>

      {/* Create Question Set Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Create New Question Set</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newQuestionSet.title}
                      onChange={(e) => setNewQuestionSet(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                      placeholder="Enter question set title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={currentUser.department}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newQuestionSet.description}
                    onChange={(e) => setNewQuestionSet(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    rows={3}
                    placeholder="Describe the purpose and context of this question set"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Questions</h3>
                    <button
                      onClick={addQuestion}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newQuestionSet.questions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          {newQuestionSet.questions.length > 1 && (
                            <button
                              onClick={() => removeQuestion(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                            >
                              <option value="likert">5-Point Likert Scale</option>
                              <option value="text">Text Response</option>
                              <option value="multiple">Multiple Choice</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                              value={question.category}
                              onChange={(e) => updateQuestion(index, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                            >
                              <option value="Content Quality">Content Quality</option>
                              <option value="Delivery Method">Delivery Method</option>
                              <option value="Assessment Fairness">Assessment Fairness</option>
                              <option value="Support Provided">Support Provided</option>
                              <option value="Overall Rating">Overall Rating</option>
                              <option value="Comments">Comments</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                          <textarea
                            value={question.text}
                            onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                            rows={2}
                            placeholder="Enter the question text"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuestionSet}
                className="px-6 py-2 bg-[#7a0000] hover:bg-[#8f0000] text-white rounded-lg"
              >
                Create Question Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Questions Modal */}
      {selectedQuestionSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedQuestionSet.title}</h2>
                  <p className="text-gray-600">{selectedQuestionSet.description}</p>
                </div>
                <button
                  onClick={() => setSelectedQuestionSet(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {selectedQuestionSet.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <div className="flex space-x-2">
                        <span className="inline-flex px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                          {question.type}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                          {question.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{question.text}</p>
                    
                    {question.type === 'likert' && (
                      <div className="mt-3 flex space-x-4 text-sm text-gray-500">
                        <span>1 - Strongly Disagree</span>
                        <span>2 - Disagree</span>
                        <span>3 - Neutral</span>
                        <span>4 - Agree</span>
                        <span>5 - Strongly Agree</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
