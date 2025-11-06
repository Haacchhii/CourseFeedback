import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, isAdmin, isDepartmentHead } from '../../utils/roleUtils'
import { adminAPI, deptHeadAPI } from '../../services/api'

export default function EvaluationQuestions() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [questionSets, setQuestionSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
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

  // Fetch question sets from API
  useEffect(() => {
    const fetchQuestionSets = async () => {
      if (!currentUser) return
      
      try {
        setLoading(true)
        let data
        if (isAdmin(currentUser)) {
          data = await adminAPI.getQuestionSets()
        } else if (isDepartmentHead(currentUser)) {
          data = await deptHeadAPI.getQuestions()
        }
        setQuestionSets(data || [])
      } catch (err) {
        console.error('Error fetching question sets:', err)
        setError(err.message || 'Failed to load question sets')
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuestionSets()
  }, [currentUser])

  // Filter question sets based on user role and filters
  const filteredQuestionSets = useMemo(() => {
    let sets = questionSets

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
    // Example: await api.createQuestionSet(newQuestionSet)
    setShowCreateModal(false)
    setNewQuestionSet({
      title: '',
      description: '',
      questions: [{ text: '', type: 'likert', category: 'Content Quality' }]
    })
  }

  const handleStatusChange = (questionSetId, newStatus) => {
    // In a real app, this would make an API call
    // Example: await api.updateQuestionSetStatus(questionSetId, newStatus)
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen lpu-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0000] mb-4"></div>
          <p className="text-gray-600">Loading question sets...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen lpu-background">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Question Sets</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#7a0000] hover:bg-[#8f0000] text-white px-6 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lpu-background">
      {/* Enhanced LPU Header */}
      <header className="lpu-header">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-[#7a0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Evaluation Question Management</h1>
                <p className="text-[#ffd700] text-sm">
                  {isAdmin(currentUser) 
                  ? 'Comprehensive question template management system' 
                  : `${currentUser.department} Department Question Portal`
                }
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              {isAdmin(currentUser) && (
                <>
                  <button className="lpu-btn-secondary inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                    </svg>
                    Import Questions
                  </button>
                  <button className="lpu-btn-secondary inline-flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    Export Questions
                  </button>
                </>
              )}
              
              {isDepartmentHead(currentUser) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="lpu-btn-primary inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create Question Set
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Statistics Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Total Question Sets</h3>
                <p className="text-3xl font-bold text-white">{questionSetStats.total}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Active Templates</h3>
                <p className="text-3xl font-bold text-white">{questionSetStats.active}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Archived Sets</h3>
                <p className="text-3xl font-bold text-white">{questionSetStats.archived}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8l6 6m0 0l6-6"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Global Templates</h3>
                <p className="text-3xl font-bold text-white">{questionSetStats.global}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">Department Sets</h3>
                <p className="text-3xl font-bold text-white">{questionSetStats.department}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Admin Controls */}
        {isAdmin(currentUser) && (
          <div className="lpu-card mb-8">
            <h2 className="text-xl font-semibold text-[#7a0000] mb-6 border-b border-gray-200 pb-3">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Administrative Controls
              </span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-blue-800">Question Settings</h3>
                </div>
                <p className="text-blue-700 text-sm mb-4">Configure global question parameters and validation rules</p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Configure Settings
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-green-800">Global Templates</h3>
                </div>
                <p className="text-green-700 text-sm mb-4">Manage system-wide question templates</p>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Manage Templates
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-yellow-800">Approval Queue</h3>
                </div>
                <p className="text-yellow-700 text-sm mb-4">Review and approve department submissions</p>
                <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  View Queue (0)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="lpu-card mb-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-[#7a0000] flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"></path>
              </svg>
              Filter Question Sets
            </h2>
            <p className="text-gray-600 text-sm mt-1">Use filters to quickly find specific question templates</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Templates</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search question sets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent transition-all duration-200"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent bg-white transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active Templates</option>
                <option value="archived">Archived Templates</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent bg-white transition-all duration-200"
              >
                <option value="all">All Types</option>
                {isAdmin(currentUser) && <option value="global">Global Templates</option>}
                <option value="department">Department Templates</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Question Sets List */}
        <div className="lpu-card">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#7a0000]/5 to-[#ffd700]/5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#7a0000] flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Question Templates Overview
                </h2>
                <p className="text-gray-600 mt-1 font-medium">
                  Showing {filteredQuestionSets.length} question sets across all departments
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-[#7a0000] text-white text-sm font-medium rounded-full">
                  {filteredQuestionSets.length} Templates
                </span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredQuestionSets.map((questionSet) => (
              <div key={questionSet.id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-25 transition-all duration-200 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#7a0000] transition-colors duration-200">
                        {questionSet.title}
                      </h3>
                      <div className="ml-3 flex space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(questionSet.status)}`}>
                          {questionSet.status.charAt(0).toUpperCase() + questionSet.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(questionSet.type)}`}>
                          {questionSet.type.charAt(0).toUpperCase() + questionSet.type.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {questionSet.description}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Created by: {questionSet.createdBy}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Date: {questionSet.createdDate}
                      </span>
                      <span className="flex items-center font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(questionSet.status)}`}>
                        {questionSet.status.charAt(0).toUpperCase() + questionSet.status.slice(1)}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(questionSet.type)}`}>
                        {questionSet.type.charAt(0).toUpperCase() + questionSet.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedQuestionSet(questionSet)}
                        className="text-[#7a0000] hover:text-[#8f0000] text-sm font-semibold hover:underline transition-colors duration-200"
                      >
                        Preview Questions
                      </button>
                      {(isAdmin(currentUser) || 
                        (isDepartmentHead(currentUser) && questionSet.department === currentUser.department)) && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline transition-colors duration-200">
                            Edit Template
                          </button>
                          <button
                            onClick={() => handleStatusChange(questionSet.id, questionSet.status === 'active' ? 'archived' : 'active')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors duration-200 ${
                              questionSet.status === 'active' 
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {questionSet.status === 'active' ? 'Archive' : 'Activate'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Categories Preview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Question Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(questionSet.questions.map(q => q.category))].map(category => (
                          <span key={category} className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-gray-700">{questionSet.lastModified || questionSet.createdDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredQuestionSets.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Question Templates Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No question sets match your current filters. Try adjusting your search criteria.'
                    : 'No question sets are available yet. Create your first template to get started.'
                  }
                </p>
                {isDepartmentHead(currentUser) && !searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="lpu-btn-primary"
                  >
                    Create First Template
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Create Question Set Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="lpu-header">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Create New Question Template</h2>
                    <p className="text-[#ffd700] text-sm mt-1">Design custom evaluation questions for your department</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-white hover:text-[#ffd700] transition-colors duration-200"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Template Title</label>
                    <input
                      type="text"
                      value={newQuestionSet.title}
                      onChange={(e) => setNewQuestionSet(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent transition-all duration-200"
                      placeholder="Enter descriptive template name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={currentUser.department}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Template Description</label>
                  <textarea
                    value={newQuestionSet.description}
                    onChange={(e) => setNewQuestionSet(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent transition-all duration-200"
                    rows={3}
                    placeholder="Describe the purpose and context of this question template"
                  />
                </div>

                <div className="bg-gradient-to-r from-[#7a0000]/5 to-[#ffd700]/5 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#7a0000]">Question Configuration</h3>
                      <p className="text-gray-600 text-sm mt-1">Design your evaluation questions</p>
                    </div>
                    <button
                      onClick={addQuestion}
                      className="lpu-btn-secondary"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newQuestionSet.questions.map((question, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-gray-800 flex items-center">
                            <span className="w-6 h-6 bg-[#7a0000] text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                              {index + 1}
                            </span>
                            Question {index + 1}
                          </h4>
                          {newQuestionSet.questions.length > 1 && (
                            <button
                              onClick={() => removeQuestion(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transition-colors duration-200"
                            >
                              Remove Question
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent bg-white"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent bg-white"
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
                            placeholder="Enter the question text that students will see"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white font-medium transition-all duration-200"
              >
                Cancel Creation
              </button>
              <button
                onClick={handleCreateQuestionSet}
                className="lpu-btn-primary"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Preview Questions Modal */}
      {selectedQuestionSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="lpu-header">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedQuestionSet.title}</h2>
                    <p className="text-[#ffd700] text-sm mt-1">{selectedQuestionSet.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/80 text-sm">
                        {selectedQuestionSet.questions.length} Questions
                      </span>
                      <span className="text-white/80 text-sm">
                        Created: {selectedQuestionSet.createdDate}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedQuestionSet.status)}`}>
                        {selectedQuestionSet.status.charAt(0).toUpperCase() + selectedQuestionSet.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQuestionSet(null)}
                    className="text-white hover:text-[#ffd700] transition-colors duration-200"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {selectedQuestionSet.questions.map((question, index) => (
                  <div key={question.id} className="lpu-card hover:shadow-lg transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-[#7a0000]">Question {index + 1}</h3>
                      </div>
                      <div className="flex space-x-2">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {question.type === 'likert' ? '5-Point Scale' : question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                        </span>
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {question.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-4">
                      <p className="text-gray-800 font-medium leading-relaxed">{question.text}</p>
                    </div>
                    
                    {question.type === 'likert' && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3">Rating Scale</h4>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div className="text-center p-2 bg-red-100 rounded text-red-800 font-medium">
                            <div className="font-bold">1</div>
                            <div>Strongly Disagree</div>
                          </div>
                          <div className="text-center p-2 bg-orange-100 rounded text-orange-800 font-medium">
                            <div className="font-bold">2</div>
                            <div>Disagree</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-100 rounded text-yellow-800 font-medium">
                            <div className="font-bold">3</div>
                            <div>Neutral</div>
                          </div>
                          <div className="text-center p-2 bg-green-100 rounded text-green-800 font-medium">
                            <div className="font-bold">4</div>
                            <div>Agree</div>
                          </div>
                          <div className="text-center p-2 bg-blue-100 rounded text-blue-800 font-medium">
                            <div className="font-bold">5</div>
                            <div>Strongly Agree</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {question.type === 'text' && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">Response Type</h4>
                        <p className="text-green-700 text-sm">Students will provide written feedback in a text area</p>
                      </div>
                    )}
                    
                    {question.type === 'multiple' && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-purple-800 mb-2">Response Type</h4>
                        <p className="text-purple-700 text-sm">Students will select from predefined options</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Template contains {selectedQuestionSet.questions.length} questions across {[...new Set(selectedQuestionSet.questions.map(q => q.category))].length} categories
                </div>
                <button
                  onClick={() => setSelectedQuestionSet(null)}
                  className="lpu-btn-primary"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
