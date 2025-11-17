import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin, getRoleDisplayName } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'
import ProgramSections from './ProgramSections'

export default function UserManagement() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('users')
  
  // State
  const [allUsers, setAllUsers] = useState([])
  const [programs, setPrograms] = useState([])
  const [userStats, setUserStats] = useState({
    total_users: 0,
    students: 0,
    dept_heads: 0,
    secretaries: 0,
    admins: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [bulkImportFile, setBulkImportFile] = useState(null)
  const [bulkImportPreview, setBulkImportPreview] = useState([])
  const [bulkImportErrors, setBulkImportErrors] = useState([])
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: '' })
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15) // 15 users per page for faster loading
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    program: 'BSIT',
    yearLevel: 1,
    department: '',
    assignedPrograms: [],
    status: 'Active'
  })

  // Use timeout hook for API call with pagination
  const { data: apiData, loading, error, retry } = useApiWithTimeout(
    async () => {
      const [usersResponse, programsResponse, statsResponse] = await Promise.all([
        adminAPI.getUsers({ 
          page: currentPage, 
          page_size: pageSize,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined
        }),
        adminAPI.getPrograms(),
        adminAPI.getUserStats()
      ])
      return {
        users: usersResponse?.data || [],
        programs: programsResponse?.data || [],
        stats: statsResponse?.data || {
          total_users: 0,
          students: 0,
          dept_heads: 0,
          secretaries: 0,
          admins: 0
        },
        pagination: usersResponse?.pagination || {}
      }
    },
    [currentUser?.id, currentUser?.role, currentPage, pageSize, roleFilter, statusFilter, searchTerm]
  )

  // Update allUsers and programs when data changes
  useEffect(() => {
    if (apiData) {
      setAllUsers(apiData.users)
      if (apiData.programs && apiData.programs.length > 0) {
        setPrograms(apiData.programs.map(p => p.code).sort())
      }
      if (apiData.stats) {
        setUserStats(apiData.stats)
      }
      // Update pagination state
      if (apiData.pagination) {
        setTotalUsers(apiData.pagination.total || 0)
        setTotalPages(apiData.pagination.total_pages || 0)
      }
    }
  }, [apiData])

  // Redirect if not system admin
  useEffect(() => {
    if (currentUser && !isSystemAdmin(currentUser)) {
      navigate('/dashboard')
    }
  }, [currentUser?.role, currentUser?.id, navigate])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [roleFilter, statusFilter, searchTerm])

  // Client-side filtering for program only (server handles role, status, search)
  const filteredUsers = useMemo(() => {
    if (programFilter === 'all') return allUsers
    
    return allUsers.filter(user => {
      if (user.program === programFilter) return true
      if (user.assignedPrograms && user.assignedPrograms.includes(programFilter)) return true
      return false
    })
  }, [allUsers, programFilter])

  // Use filteredUsers directly (server-side pagination already applied)
  const paginatedUsers = filteredUsers

  // Handlers
  const handleAddUser = () => {
    setFormData({
      name: '',
      email: '',
      role: 'student',
      program: 'BSIT',
      yearLevel: 1,
      department: '',
      assignedPrograms: [],
      status: 'Active'
    })
    setShowAddModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setFormData({
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email,
      role: user.role,
      program: user.program || 'BSIT',
      yearLevel: user.yearLevel || 1,
      department: user.department || '',
      assignedPrograms: user.assignedPrograms || [],
      status: user.status || 'Active'
    })
    setShowEditModal(true)
  }

  const handleDeleteUser = async (user) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    if (window.confirm(`Are you sure you want to delete ${fullName}?\n\nThis action cannot be undone. All evaluation data will be anonymized and preserved.`)) {
      try {
        setSubmitting(true)
        await adminAPI.deleteUser(user.id)
        // Trigger data reload
        retry()
        alert(`User ${fullName} deleted successfully!`)
      } catch (err) {
        console.error('Error deleting user:', err)
        alert(`Failed to delete user: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleBulkImportFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBulkImportFile(file)
    setBulkImportErrors([])
    setBulkImportPreview([])

    // Parse CSV file
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setBulkImportErrors(['CSV file is empty or has no data rows'])
          return
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const requiredHeaders = ['email', 'first_name', 'last_name', 'role']
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
        
        if (missingHeaders.length > 0) {
          setBulkImportErrors([`Missing required columns: ${missingHeaders.join(', ')}`])
          return
        }

        // Parse data rows
        const data = []
        const errors = []
        const validRoles = ['student', 'instructor', 'department_head', 'secretary', 'admin']

        for (let i = 1; i < Math.min(lines.length, 101); i++) { // Preview first 100 rows
          const values = lines[i].split(',').map(v => v.trim())
          const row = {}
          
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })

          // Validate row
          const rowErrors = []
          if (!row.email || !row.email.includes('@')) rowErrors.push('Invalid email')
          if (!row.first_name) rowErrors.push('Missing first name')
          if (!row.last_name) rowErrors.push('Missing last name')
          if (!validRoles.includes(row.role)) rowErrors.push(`Invalid role: ${row.role}`)
          
          if (row.role === 'student') {
            if (row.program && !programs.includes(row.program)) {
              rowErrors.push(`Invalid program: ${row.program}`)
            }
            if (row.year_level && ![1, 2, 3, 4, '1', '2', '3', '4'].includes(row.year_level)) {
              rowErrors.push('Invalid year level (must be 1-4)')
            }
          }

          if (rowErrors.length > 0) {
            errors.push({ row: i, errors: rowErrors, data: row })
          }

          data.push({ ...row, rowNumber: i, hasErrors: rowErrors.length > 0 })
        }

        setBulkImportPreview(data.slice(0, 5)) // Show first 5 rows in preview
        setBulkImportErrors(errors)
      } catch (err) {
        setBulkImportErrors([`Failed to parse CSV: ${err.message}`])
      }
    }

    reader.readAsText(file)
  }

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      alert('Please select a CSV file first')
      return
    }

    if (bulkImportErrors.length > 0) {
      const proceed = window.confirm(
        `Found ${bulkImportErrors.length} error(s) in the CSV file.\n\n` +
        `Do you want to skip invalid rows and import only valid ones?`
      )
      if (!proceed) return
    }

    try {
      setSubmitting(true)
      setImportProgress({ current: 0, total: 0, status: 'Reading file...' })

      // Read and parse full file
      const text = await bulkImportFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const validUsers = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        // Skip invalid rows
        if (!row.email || !row.email.includes('@') || !row.first_name || !row.last_name) continue
        if (!['student', 'instructor', 'department_head', 'secretary', 'admin'].includes(row.role)) continue

        validUsers.push(row)
      }

      setImportProgress({ current: 0, total: validUsers.length, status: 'Importing users...' })

      // Import users in batches
      const batchSize = 10
      let imported = 0
      const failedUsers = []

      for (let i = 0; i < validUsers.length; i += batchSize) {
        const batch = validUsers.slice(i, i + batchSize)
        
        await Promise.all(batch.map(async (userData) => {
          try {
            // Get program ID if role is student
            let programId = null
            if (userData.role === 'student' && userData.program) {
              const programsResponse = await adminAPI.getPrograms()
              const matchingProgram = programsResponse?.data?.find(p => p.code === userData.program)
              programId = matchingProgram?.id
            }

            await adminAPI.createUser({
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role,
              password: userData.password || 'changeme123',
              department: userData.department || null,
              program_id: programId,
              year_level: userData.year_level ? parseInt(userData.year_level) : 1,
              student_number: userData.student_number || null
            })
            imported++
          } catch (err) {
            failedUsers.push({ email: userData.email, error: err.message })
          }
        }))

        setImportProgress({ current: i + batch.length, total: validUsers.length, status: `Imported ${imported}/${validUsers.length}...` })
      }

      // Show results
      const message = `Bulk import complete!\n\n` +
        `✅ Successfully imported: ${imported} users\n` +
        `❌ Failed: ${failedUsers.length} users` +
        (failedUsers.length > 0 ? `\n\nFailed users:\n${failedUsers.slice(0, 5).map(f => `${f.email}: ${f.error}`).join('\n')}` : '')
      
      alert(message)
      
      // Refresh user list and close modal
      retry()
      setShowBulkImportModal(false)
      setBulkImportFile(null)
      setBulkImportPreview([])
      setBulkImportErrors([])
      setImportProgress({ current: 0, total: 0, status: '' })
    } catch (err) {
      alert(`Bulk import failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const downloadCSVTemplate = () => {
    const template = `email,first_name,last_name,role,program,year_level,student_number,password\nstudent@example.com,John,Doe,student,BSIT,1,2024001,\ninstructor@example.com,Jane,Smith,instructor,,,,\nsecretary@example.com,Bob,Johnson,secretary,,,,\n`
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'user_import_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleResetPassword = async (user) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    const newPassword = window.prompt(
      `Reset password for ${fullName}\n\nEnter new password (minimum 8 characters):`,
      'changeme123'
    )
    
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long')
        return
      }
      
      try {
        setSubmitting(true)
        const response = await adminAPI.resetPassword(user.id, newPassword)
        alert(response?.data?.message || `Password for ${fullName} has been reset successfully!`)
        await loadUsers() // Reload users to reflect any changes
      } catch (err) {
        console.error('Error resetting password:', err)
        const errorMsg = err.response?.data?.detail || err.message || 'Unknown error occurred'
        alert(`Failed to reset password: ${errorMsg}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User'
      
      // Get program ID from programs list if role is student
      let programId = null
      if (formData.role === 'student' && formData.program) {
        // Get programs and find matching one
        const programsResponse = await adminAPI.getPrograms()
        const matchingProgram = programsResponse?.data?.find(p => p.code === formData.program)
        programId = matchingProgram?.id
      }
      
      // Prepare API payload matching backend UserCreate model
      // For students, password will be auto-generated on backend as Lpub@{student_number}
      const userData = {
        email: formData.email,
        first_name: firstName,
        last_name: lastName,
        role: formData.role,
        password: formData.role === 'student' ? 'temp' : (formData.password || 'changeme123'), // Backend will override for students
        department: formData.department || null,
        program_id: programId,
        year_level: formData.yearLevel || 1
      }
      
      const response = await adminAPI.createUser(userData)
      
      // Trigger data reload
      retry()
      
      // Show success message with generated password for students
      if (formData.role === 'student' && response.generated_password) {
        alert(`✅ Student created successfully!\n\nTemporary Password: ${response.generated_password}\n\n⚠️ IMPORTANT: Share this password with the student. They will be required to change it on first login.`)
      } else {
        alert(`User ${formData.name} created successfully!`)
      }
      
      setShowAddModal(false)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        program: 'BSIT',
        yearLevel: 1,
        department: '',
        assignedPrograms: [],
        status: 'Active'
      })
    } catch (err) {
      console.error('Error creating user:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
      const validationErrors = err.response?.data?.errors || []
      const fullError = validationErrors.length > 0 
        ? `${errorMsg}\n${validationErrors.map(e => `- ${e.msg || e}`).join('\n')}`
        : errorMsg
      alert(`Failed to create user: ${fullError}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User'
      
      // Prepare API payload matching backend UserUpdate model
      const userData = {
        email: formData.email,
        first_name: firstName,
        last_name: lastName,
        role: formData.role,
        department: formData.department || null,
        is_active: formData.status === 'Active'
      }
      
      await adminAPI.updateUser(selectedUser.id, userData)
      
      // Trigger data reload
      retry()
      alert(`User ${formData.name} updated successfully!`)
      setShowEditModal(false)
    } catch (err) {
      console.error('Error updating user:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
      const validationErrors = err.response?.data?.errors || []
      const fullError = validationErrors.length > 0 
        ? `${errorMsg}\n${validationErrors.map(e => `- ${e.msg || e}`).join('\n')}`
        : errorMsg
      alert(`Failed to update user: ${fullError}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first')
      return
    }
    
    if (window.confirm(`${action} ${selectedUsers.length} selected users?`)) {
      // In real app: await api.bulkAction(action, selectedUsers)
      alert(`${action} completed for ${selectedUsers.length} users`)
      setSelectedUsers([])
    }
  }

  const toggleUserSelection = (userEmail) => {
    setSelectedUsers(prev => 
      prev.includes(userEmail) 
        ? prev.filter(e => e !== userEmail)
        : [...prev, userEmail]
    )
  }

  const toggleAllUsers = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.email))
    }
  }

  if (!currentUser || !isSystemAdmin(currentUser)) return null

  // Loading state
  if (loading) return <LoadingSpinner message="Loading users..." />

  // Error state
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl border-b-4 border-blue-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">User Management</h1>
                <p className="text-blue-100 text-sm mt-1">Manage all system users and permissions</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowBulkImportModal(true)} className="bg-white hover:bg-blue-50 text-blue-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <span>Bulk Import</span>
              </button>
              <button onClick={handleAddUser} className="bg-white hover:bg-blue-50 text-blue-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'sections'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📚 Program Sections
            </button>
          </div>
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeTab === 'sections' ? (
          <ProgramSections />
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{userStats.total_users}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-3xl font-bold text-green-600">{userStats.students}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dept Heads</p>
                <p className="text-3xl font-bold text-purple-600">{userStats.dept_heads}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staff Members</p>
                <p className="text-3xl font-bold text-red-600">{userStats.secretaries + userStats.admins}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="department_head">Department Head</option>
                <option value="secretary">Secretary</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📚 Program</label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Programs</option>
                {programs.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-blue-900 font-semibold">{selectedUsers.length} user(s) selected</p>
            <div className="flex space-x-2">
              <button onClick={() => handleBulkAction('Activate')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all">
                Activate
              </button>
              <button onClick={() => handleBulkAction('Deactivate')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all">
                Deactivate
              </button>
              <button onClick={() => handleBulkAction('Delete')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all">
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={toggleAllUsers}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Program</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.map((user, index) => (
                  <tr key={user.email || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.email)}
                        onChange={() => toggleUserSelection(user.email)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'student' ? 'bg-green-100 text-green-800' :
                        user.role === 'instructor' ? 'bg-indigo-100 text-indigo-800' :
                        user.role === 'department_head' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'secretary' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.program || (user.assignedPrograms && user.assignedPrograms.length > 0 ? user.assignedPrograms.join(', ') : 'N/A')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm rounded-lg ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className={`px-4 py-2 rounded-lg ${currentPage >= totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className={`px-4 py-2 text-sm rounded-lg ${currentPage >= totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
              >
                Last
              </button>
            </div>
          </div>
        </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 border-b-4 border-blue-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">➕ Add New User</h2>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@lpubatangas.edu.ph"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password {formData.role !== 'student' && '*'}
                </label>
                {formData.role === 'student' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div className="text-sm text-blue-700">
                        <p className="font-semibold mb-1">Auto-Generated Password</p>
                        <p>Password will be automatically generated as: <span className="font-mono font-bold">Lpub@{formData.email.split('@')[0] || 'studentnumber'}</span></p>
                        <p className="mt-1 text-xs text-blue-600">Student will be required to change this password on first login.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <input
                    type="password"
                    required
                    value={formData.password || ''}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (min 8 characters)"
                    minLength={8}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="department_head">Department Head</option>
                  <option value="secretary">Secretary</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Program *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {programs.map(prog => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level *</label>
                    <select
                      value={formData.yearLevel}
                      onChange={(e) => setFormData({...formData, yearLevel: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 border-b-4 border-purple-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">✏️ Edit User: {`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email}</h2>
                <button onClick={() => setShowEditModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="department_head">Department Head</option>
                  <option value="secretary">Secretary</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Program *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {programs.map(prog => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level *</label>
                    <select
                      value={formData.yearLevel}
                      onChange={(e) => setFormData({...formData, yearLevel: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">⚪ Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Inactive"
                      checked={formData.status === 'Inactive'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-4 h-4 text-gray-600 focus:ring-2 focus:ring-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">⚫ Inactive</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">📊 Activity Stats:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Joined: Aug 15, 2025</li>
                  <li>• Evaluations: 5/10 completed</li>
                  <li>• Last Login: Oct 20, 2025</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Tip:</strong> Use the Reset Password action button in the user table to send a password reset email.
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 border-b-4 border-green-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">📤 Bulk Import Users</h2>
                  <p className="text-green-100 text-sm mt-1">Upload a CSV file to import multiple users at once</p>
                </div>
                <button onClick={() => setShowBulkImportModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">📋 CSV Template Required</p>
                    <p className="text-sm text-blue-700 mb-3">Download the template file to see the required format and column headers.</p>
                    <p className="text-xs text-blue-600 mb-2"><strong>Required columns:</strong> email, first_name, last_name, role</p>
                    <p className="text-xs text-blue-600"><strong>Optional columns:</strong> program, year_level, student_number, password (defaults to "changeme123")</p>
                  </div>
                  <button
                    onClick={downloadCSVTemplate}
                    className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload CSV File *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-all">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkImportFileChange}
                    className="hidden"
                    id="bulk-import-file"
                  />
                  <label htmlFor="bulk-import-file" className="cursor-pointer">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm font-semibold text-gray-700">{bulkImportFile ? bulkImportFile.name : 'Click to upload or drag and drop'}</p>
                    <p className="text-xs text-gray-500 mt-1">CSV file only</p>
                  </label>
                </div>
              </div>

              {/* Validation Errors */}
              {bulkImportErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Found {bulkImportErrors.length} error(s) in CSV:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {bulkImportErrors.slice(0, 10).map((err, idx) => (
                      <p key={idx} className="text-xs text-red-700">
                        • Row {err.row}: {err.errors.join(', ')}
                      </p>
                    ))}
                    {bulkImportErrors.length > 10 && (
                      <p className="text-xs text-red-600 font-semibold">... and {bulkImportErrors.length - 10} more errors</p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {bulkImportPreview.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Preview (First 5 rows)</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Row</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">First Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Last Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Role</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Program</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {bulkImportPreview.map((row, idx) => (
                            <tr key={idx} className={row.hasErrors ? 'bg-red-50' : 'bg-white'}>
                              <td className="px-4 py-2 text-xs text-gray-600">{row.rowNumber}</td>
                              <td className="px-4 py-2 text-xs text-gray-900">{row.email}</td>
                              <td className="px-4 py-2 text-xs text-gray-900">{row.first_name}</td>
                              <td className="px-4 py-2 text-xs text-gray-900">{row.last_name}</td>
                              <td className="px-4 py-2 text-xs text-gray-900">{row.role}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">{row.program || 'N/A'}</td>
                              <td className="px-4 py-2">
                                {row.hasErrors ? (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    Invalid
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    Valid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Progress */}
              {importProgress.total > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">{importProgress.status}</p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">{importProgress.current} / {importProgress.total}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={submitting || !bulkImportFile || bulkImportPreview.length === 0}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <span>Import Users</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </div>
  )
}
