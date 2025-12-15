import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSystemAdmin, getRoleDisplayName } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, apiClient } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'
import ProgramSections from './ProgramSections'
import Pagination from '../../components/Pagination'
import { useDebounce } from '../../hooks/useDebounce'
import { transformPrograms, toDisplayCode } from '../../utils/programMapping'
import { DeleteUserModal, DeleteResultModal, AlertModal, ConfirmModal } from '../../components/Modal'
import CustomDropdown from '../../components/CustomDropdown'

export default function UserManagement() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('users')
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null })
  const [resultModal, setResultModal] = useState({ isOpen: false, userName: '', deleteType: '', reason: '' })
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' })
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: null, confirmText: 'Confirm', cancelText: 'Cancel' })
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showBulkPasswordModal, setShowBulkPasswordModal] = useState(false)
  const [bulkPassword, setBulkPassword] = useState('')
  
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
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // Debounce search
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [yearLevelFilter, setYearLevelFilter] = useState('all')
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
  const [pageSize, setPageSize] = useState(15) // 15 users per page for faster loading
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school_id: '',
    role: 'student',
    program: 'BSIT',
    yearLevel: 1,
    department: '',
    assignedPrograms: [],
    status: 'Active'
  })

  // Enrollment validation state
  const [enrollmentInfo, setEnrollmentInfo] = useState(null)
  const [enrollmentValidation, setEnrollmentValidation] = useState(null)
  const [lookingUpEnrollment, setLookingUpEnrollment] = useState(false)
  const [enrollmentLookupDone, setEnrollmentLookupDone] = useState(false)

  // Use timeout hook for API call with pagination
  const { data: apiData, loading, error, retry } = useApiWithTimeout(
    async () => {
      const [usersResponse, programsResponse, statsResponse] = await Promise.all([
        adminAPI.getUsers({ 
          page: currentPage, 
          page_size: pageSize,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          program: programFilter !== 'all' ? programFilter : undefined,
          year_level: yearLevelFilter !== 'all' ? parseInt(yearLevelFilter) : undefined,
          search: debouncedSearchTerm || undefined
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
    [currentUser?.id, currentUser?.role, currentPage, pageSize, roleFilter, statusFilter, programFilter, yearLevelFilter, debouncedSearchTerm]
  )

  // Update allUsers and programs when data changes
  useEffect(() => {
    if (apiData) {
      // Map is_active to status for display
      const usersWithStatus = (apiData.users || []).map(user => ({
        ...user,
        status: user.is_active ? 'Active' : 'Inactive'
      }))
      setAllUsers(usersWithStatus)
      if (apiData.programs && apiData.programs.length > 0) {
        setPrograms(transformPrograms(apiData.programs || []).map(p => p.code).sort())
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

  // Reset program and year level filters when role changes away from student
  useEffect(() => {
    if (roleFilter !== 'student') {
      setProgramFilter('all')
      setYearLevelFilter('all')
    }
  }, [roleFilter])

  // Modal helper functions
  const showAlert = (message, title = 'Notification', type = 'info') => {
    setAlertConfig({ title, message, type })
    setShowAlertModal(true)
  }

  const showConfirm = (message, onConfirm, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmConfig({ title, message, onConfirm, confirmText, cancelText })
    setShowConfirmModal(true)
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [roleFilter, statusFilter, searchTerm, yearLevelFilter, programFilter])

  // Server now handles all filtering (role, status, program, year_level, search)
  // Use allUsers directly since filtering is done server-side
  const paginatedUsers = allUsers

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
    // API returns snake_case: year_level, is_active
    const yearLevelValue = user.year_level || user.yearLevel || 1
    const statusValue = user.is_active !== undefined 
      ? (user.is_active ? 'Active' : 'Inactive') 
      : (user.status || 'Active')
    
    console.log('Editing user:', user.email, 'year_level from API:', user.year_level, 'parsed:', yearLevelValue)
    
    setFormData({
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email,
      role: user.role,
      program: user.program || 'BSIT',
      yearLevel: yearLevelValue,
      department: user.department || '',
      assignedPrograms: user.assignedPrograms || [],
      status: statusValue
    })
    setShowEditModal(true)
  }

  const handleDeleteUser = (user, force = false) => {
    setDeleteModal({ isOpen: true, user, force })
  }

  const confirmDeleteUser = async () => {
    const user = deleteModal.user
    const force = deleteModal.force || false
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    
    try {
      setSubmitting(true)
      const response = await adminAPI.deleteUser(user.id, force)
      // Trigger data reload
      retry()
      
      // Show result modal based on delete type
      const deleteType = response.delete_type || 'soft'
      const reason = deleteType === 'hard' 
        ? 'No related data found (newly created user)' 
        : 'User has related data (evaluations/enrollments). Account preserved for data integrity'
      
      setResultModal({
        isOpen: true,
        userName: fullName,
        deleteType,
        reason
      })
    } catch (err) {
      console.error('Error deleting user:', err)
      setErrorModal({
        isOpen: true,
        message: `Failed to delete user: ${err.message}`
      })
    } finally {
      setSubmitting(false)
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
        const requiredHeaders = ['email', 'first_name', 'last_name', 'school_id', 'role']
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
          if (row.email && !row.email.toLowerCase().endsWith('@lpubatangas.edu.ph')) rowErrors.push('Email must be @lpubatangas.edu.ph')
          if (!row.first_name) rowErrors.push('Missing first name')
          if (!row.last_name) rowErrors.push('Missing last name')
          if (!row.school_id || row.school_id.trim() === '') rowErrors.push('Missing school_id')
          
          // Normalize role to lowercase for validation
          row.role = row.role.toLowerCase()
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
      showAlert('Please select a CSV file first', 'Warning', 'warning')
      return
    }

    const processBulkImport = async () => {
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
        
        // Validate email domain
        if (!row.email.toLowerCase().endsWith('@lpubatangas.edu.ph')) continue
        
        // Normalize role to lowercase for validation
        row.role = row.role.toLowerCase()
        if (!['student', 'instructor', 'department_head', 'secretary', 'admin'].includes(row.role)) continue

        validUsers.push(row)
      }

      setImportProgress({ current: 0, total: validUsers.length, status: 'Importing users...' })

      // Prepare users for bulk import
      const usersToImport = validUsers.map(userData => {
        // Parse year_level properly - handle empty strings
        let yearLevel = 1
        if (userData.year_level && userData.year_level.toString().trim() !== '') {
          const parsed = parseInt(userData.year_level)
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) {
            yearLevel = parsed
          }
        }
        console.log(`User ${userData.email}: year_level from CSV = '${userData.year_level}', parsed = ${yearLevel}`)
        
        return {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role.toLowerCase(),
          password: userData.password || 'changeme123',
          department: userData.department || null,
          program: userData.program || null,
          program_id: null, // Backend will resolve this
          year_level: yearLevel,
          school_id: userData.school_id || null
        }
      })

      // Use bulk import endpoint (single API call)
      const response = await apiClient.post('/admin/users/bulk-import', usersToImport)
      
      const imported = response.data?.success || 0
      const failedUsers = response.data?.errors || []

      // Show results
      const message = `Bulk import complete!\n\n` +
        `✅ Successfully imported: ${imported} users\n` +
        `❌ Failed: ${failedUsers.length} users` +
        (failedUsers.length > 0 ? `\n\nFailed users:\n${failedUsers.slice(0, 5).map(f => `Row ${f.row}: ${f.email} - ${f.error}`).join('\n')}` : '')
      
      showAlert(message, failedUsers.length > 0 ? 'Partial Success' : 'Success', failedUsers.length > 0 ? 'warning' : 'success')
      
      // Refresh user list and close modal
      retry()
      setShowBulkImportModal(false)
      setBulkImportFile(null)
      setBulkImportPreview([])
      setBulkImportErrors([])
      setImportProgress({ current: 0, total: 0, status: '' })
      } catch (err) {
        showAlert(`Bulk import failed: ${err.message}`, 'Error', 'error')
      } finally {
        setSubmitting(false)
      }
    }

    if (bulkImportErrors.length > 0) {
      showConfirm(
        `Found ${bulkImportErrors.length} error(s) in the CSV file.\n\nDo you want to skip invalid rows and import only valid ones?`,
        processBulkImport,
        'Validation Errors',
        'Import Valid Rows'
      )
    } else {
      processBulkImport()
    }
  }

  const downloadCSVTemplate = () => {
    const template = `email,first_name,last_name,school_id,role,program,year_level
iturraldejose@lpubatangas.edu.ph,Jose,Iturralde,23130778,student,BSIT,1
juandelacruz@lpubatangas.edu.ph,Juan,Dela Cruz,23140001,student,BSCS,2
mariasantos@lpubatangas.edu.ph,Maria,Santos,23150001,student,BAPSY,3
secretary@lpubatangas.edu.ph,Ana,Reyes,20100001,secretary,,
depthead@lpubatangas.edu.ph,Pedro,Garcia,19050001,department_head,,

# IMPORTANT: school_id is REQUIRED for all users
# For students: Password will be auto-generated as lpub@{school_id}
# Example: school_id "23130778" → password "lpub@23130778"
# Students must change this password on first login
`
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'user_import_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleResetPassword = (user) => {
    setResetPasswordUser(user)
    setNewPassword('changeme123')
    setShowResetPasswordModal(true)
  }

  const handleConfirmResetPassword = async () => {
    const fullName = `${resetPasswordUser.first_name || ''} ${resetPasswordUser.last_name || ''}`.trim()
    
    if (newPassword.length < 8) {
      showAlert('Password must be at least 8 characters long', 'Warning', 'warning')
      return
    }
    
    try {
      setSubmitting(true)
      const response = await adminAPI.resetPassword(resetPasswordUser.id, newPassword)
      showAlert(response?.data?.message || `Password for ${fullName} has been reset successfully!`, 'Success', 'success')
      setShowResetPasswordModal(false)
      setNewPassword('')
      setResetPasswordUser(null)
      retry() // Reload users to reflect any changes
    } catch (err) {
      console.error('Error resetting password:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error occurred'
      showAlert(`Failed to reset password: ${errorMsg}`, 'Error', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmBulkPasswordReset = async () => {
    if (!bulkPassword || bulkPassword.length < 8) {
      showAlert('Password must be at least 8 characters long', 'Warning', 'warning')
      return
    }

    try {
      setSubmitting(true)
      setShowBulkPasswordModal(false)
      
      const userIds = selectedUsers
      let successCount = 0
      let failCount = 0
      const errors = []
      
      for (const id of userIds) {
        try {
          await adminAPI.resetPassword(id, bulkPassword)
          successCount++
        } catch (err) {
          failCount++
          errors.push(`User ID ${id}: ${err.message}`)
          console.error(`Failed to reset password for user ${id}:`, err)
        }
      }
      
      // Show results
      let message = `Password reset completed: ${successCount} successful`
      if (failCount > 0) {
        message += `, ${failCount} failed`
        if (errors.length > 0) {
          console.error('Bulk password reset errors:', errors)
          message += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`
          if (errors.length > 5) {
            message += `\n...and ${errors.length - 5} more`
          }
        }
      }
      
      showAlert(message, successCount > 0 && failCount === 0 ? 'Success' : 'Completed with Errors', successCount > 0 && failCount === 0 ? 'success' : 'warning')
      setSelectedUsers([])
      setBulkPassword('')
      retry()
    } catch (err) {
      showAlert(err.message, 'Error', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Lookup enrollment information
  const handleLookupEnrollment = async () => {
    if (!formData.school_id || formData.school_id.trim() === '') {
      showAlert('Please enter a student number first', 'Warning', 'warning')
      return
    }

    setLookingUpEnrollment(true)
    setEnrollmentValidation(null)

    try {
      const response = await apiClient.get(`/admin/enrollment-list/student/${formData.school_id}`)
      if (response) {
        setEnrollmentInfo(response)
        setEnrollmentLookupDone(true)
        
        // Auto-fill form with enrollment data
        const fullName = `${response.first_name} ${response.middle_name ? response.middle_name + ' ' : ''}${response.last_name}`.trim()
        setFormData(prev => ({
          ...prev,
          name: fullName,
          email: response.email || prev.email,
          program: response.program_code,
          yearLevel: response.year_level
        }))
        
        showAlert(`✅ Student found in enrollment list!\n\nName: ${fullName}\nProgram: ${response.program_code} - ${response.program_name}\nYear Level: ${response.year_level}\n\nForm has been auto-filled with enrollment data.`, 'Success', 'success')
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setEnrollmentLookupDone(true)
        setEnrollmentInfo(null)
        showAlert(`⚠️ Student number "${formData.school_id}" not found in enrollment list.\n\nPlease verify the student number or contact the registrar to add this student to the enrollment list first.`, 'Warning', 'warning')
      } else {
        console.error('Error looking up enrollment:', err)
        showAlert('Failed to lookup enrollment information. Please try again.', 'Error', 'error')
      }
    } finally {
      setLookingUpEnrollment(false)
    }
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    
    // Validate enrollment for students
    if (formData.role === 'student' && enrollmentInfo) {
      // Check if program matches enrollment
      if (enrollmentInfo.program_code !== formData.program) {
        showConfirm(
          `⚠️ PROGRAM MISMATCH WARNING\n\nEnrollment List: ${enrollmentInfo.program_code} - ${enrollmentInfo.program_name}\nSelected Program: ${formData.program}\n\nStudent "${formData.name}" is enrolled in ${enrollmentInfo.program_code}, not ${formData.program}.\n\nDo you want to correct the program to match the enrollment list?`,
          () => {
            // Auto-correct to enrolled program
            setFormData(prev => ({ ...prev, program: enrollmentInfo.program_code }))
          },
          'Program Mismatch Warning',
          'Correct Program',
          'Cancel'
        )
        return // Stop submission, let user review the correction
      }
    }
    
    try {
      setSubmitting(true)
      
      // Validate email domain
      if (!formData.email.toLowerCase().endsWith('@lpubatangas.edu.ph')) {
        showAlert('Email must be from @lpubatangas.edu.ph domain', 'Validation Error', 'error')
        return
      }
      
      // Validate password for non-student users
      if (formData.role !== 'student' && formData.password) {
        const password = formData.password
        if (password.length < 8) {
          showAlert('Password must be at least 8 characters long', 'Validation Error', 'error')
          return
        }
        if (!/[A-Z]/.test(password)) {
          showAlert('Password must contain at least one uppercase letter', 'Validation Error', 'error')
          return
        }
        if (!/[a-z]/.test(password)) {
          showAlert('Password must contain at least one lowercase letter', 'Validation Error', 'error')
          return
        }
        if (!/[0-9]/.test(password)) {
          showAlert('Password must contain at least one number', 'Validation Error', 'error')
          return
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          showAlert('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)', 'Validation Error', 'error')
          return
        }
      }
      
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
        // For students, password will be auto-generated on backend as lpub@{school_id}
        const userData = {
          email: formData.email,
          first_name: firstName,
          last_name: lastName,
          school_id: formData.school_id || null,
          role: formData.role,
          password: formData.role === 'student' ? 'temp' : (formData.password || 'changeme123'), // Backend will override for students
          department: formData.department || null,
          program_id: programId,
          year_level: formData.yearLevel || 1
        };
        
        const response = await adminAPI.createUser(userData);
      
      // Trigger data reload
      retry()
      
      // Show success message with generated password for students
      if (formData.role === 'student' && response.generated_password) {
        showAlert(`✅ Student created successfully!\n\nTemporary Password: ${response.generated_password}\n\n⚠️ IMPORTANT: Share this password with the student. They will be required to change it on first login.`, 'Success', 'success')
      } else {
        showAlert(`User ${formData.name} created successfully!`, 'Success', 'success')
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
      // Reset enrollment lookup state
      setEnrollmentInfo(null)
      setEnrollmentValidation(null)
      setEnrollmentLookupDone(false)
    } catch (err) {
      console.error('Error creating user:', err)
      
      // Handle program mismatch error specifically
      if (err.response?.data?.error === 'PROGRAM_MISMATCH') {
        const data = err.response.data
        const enrolled = data.enrolled_program
        const attempted = data.attempted_program
        showAlert(`❌ PROGRAM MISMATCH ERROR\n\n${data.message}\n\nEnrolled in: ${enrolled.code} - ${enrolled.name}\nAttempted: ${attempted.code} - ${attempted.name}\n\n✅ Please use "${enrolled.code}" as the program for this student.`, 'Error', 'error')
      } else if (err.response?.data?.error === 'STUDENT_NOT_IN_ENROLLMENT_LIST') {
        showAlert(`❌ ENROLLMENT VALIDATION ERROR\n\n${err.response.data.message}\n\n⚠️ This student must be added to the enrollment list by the registrar before creating their account.`, 'Error', 'error')
      } else {
        const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
        const validationErrors = err.response?.data?.errors || []
        const fullError = validationErrors.length > 0 
          ? `${errorMsg}\n${validationErrors.map(e => `- ${e.msg || e}`).join('\n')}`
          : errorMsg
        showAlert(`Failed to create user: ${fullError}`, 'Error', 'error')
      }
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
      showAlert(`User ${formData.name} updated successfully!`, 'Success', 'success')
      setShowEditModal(false)
    } catch (err) {
      console.error('Error updating user:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
      const validationErrors = err.response?.data?.errors || []
      const fullError = validationErrors.length > 0 
        ? `${errorMsg}\n${validationErrors.map(e => `- ${e.msg || e}`).join('\n')}`
        : errorMsg
      showAlert(`Failed to update user: ${fullError}`, 'Error', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      showAlert('Please select users first', 'Warning', 'warning')
      return
    }
    
    showConfirm(`${action} ${selectedUsers.length} selected users?`, async () => {
      try {
        setSubmitting(true)
        
        // Get user IDs and data from emails
        const selectedUserData = allUsers.filter(u => selectedUsers.includes(u.email))
        const userIds = selectedUserData.map(u => u.id)
        
        console.log(`[BULK ACTION] ${action} for users:`, userIds)
        
        let successCount = 0
        let failCount = 0
        const errors = []
        
        // Execute action based on type with error handling for each
        if (action === 'Activate') {
          for (const id of userIds) {
            try {
              await adminAPI.activateUser(id)
              successCount++
            } catch (err) {
              failCount++
              errors.push(`User ID ${id}: ${err.message}`)
              console.error(`Failed to activate user ${id}:`, err)
            }
          }
        } else if (action === 'Deactivate') {
          for (const id of userIds) {
            try {
              await adminAPI.deactivateUser(id)
              successCount++
            } catch (err) {
              failCount++
              errors.push(`User ID ${id}: ${err.message}`)
              console.error(`Failed to deactivate user ${id}:`, err)
            }
          }
        } else if (action === 'Delete') {
          for (const id of userIds) {
            try {
              await adminAPI.deleteUser(id)
              successCount++
            } catch (err) {
              failCount++
              errors.push(`User ID ${id}: ${err.message}`)
              console.error(`Failed to delete user ${id}:`, err)
            }
          }
        } else if (action === 'Reset Password') {
          // Open bulk password reset modal
          setShowBulkPasswordModal(true)
          setSubmitting(false)
          return
        }
        
        // Show results
        let message = `${action} completed: ${successCount} successful`
        if (failCount > 0) {
          message += `, ${failCount} failed`
          if (errors.length > 0) {
            console.error('Bulk action errors:', errors)
            message += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`
            if (errors.length > 5) {
              message += `\n... and ${errors.length - 5} more`
            }
          }
        }
        showAlert(message, errors.length > 0 ? 'Partial Success' : 'Success', errors.length > 0 ? 'warning' : 'success')
        
        // Clear selection
        setSelectedUsers([])
        
        // Force reload users data
        console.log('[BULK ACTION] Refreshing user list...')
        await retry()
        
      } catch (err) {
        console.error('Bulk action error:', err)
        showAlert(`Failed to ${action.toLowerCase()}: ${err.response?.data?.detail || err.message}`, 'Error', 'error')
      } finally {
        setSubmitting(false)
      }
    }, `Confirm ${action}`, action)
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      {/* Enhanced LPU Header */}
      <header className="lpu-header">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-4">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl">User Management</h1>
                <p className="lpu-header-subtitle text-lg">Manage all system users and permissions</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowBulkImportModal(true)} className="bg-white hover:bg-white/90 text-[#7a0000] font-semibold px-6 py-3 rounded-button shadow-card hover:shadow-card-hover transition-all duration-250 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <span>Bulk Import</span>
              </button>
              <button onClick={handleAddUser} className="bg-[#ffd700] hover:bg-[#ffed4e] text-[#7a0000] font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Tab Navigation */}
        <div className="bg-white rounded-card shadow-card mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'sections'
                  ? 'border-b-2 border-red-600 text-red-600'
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
        {/* Enhanced Statistics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Total Users</h3>
                <p className="text-4xl lg:text-5xl font-bold text-white">{userStats.total_users}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Students</p>
                <p className="text-4xl lg:text-5xl font-bold text-white">{userStats.students}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Dept Heads</p>
                <p className="text-4xl lg:text-5xl font-bold text-white">{userStats.dept_heads}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Staff Members</p>
                <p className="text-4xl lg:text-5xl font-bold text-white">{userStats.secretaries + userStats.admins}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
              />
            </div>
            <CustomDropdown
              label="🎯 Role"
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'student', label: 'Student' },
                { value: 'instructor', label: 'Instructor' },
                { value: 'department_head', label: 'Department Head' },
                { value: 'secretary', label: 'Secretary' },
                { value: 'admin', label: 'Administrator' }
              ]}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              placeholder="All Roles"
            />
            <CustomDropdown
              label="📚 Program"
              options={[
                { value: 'all', label: roleFilter === 'student' ? 'All Programs' : 'Select Student Role First' },
                ...(roleFilter === 'student' ? programs.map(prog => ({ value: prog, label: prog })) : [])
              ]}
              value={programFilter}
              onChange={(value) => setProgramFilter(value)}
              disabled={roleFilter !== 'student'}
              placeholder={roleFilter === 'student' ? 'All Programs' : 'Select Student Role First'}
            />
            <CustomDropdown
              label="⚡ Status"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              placeholder="All Status"
            />
            <CustomDropdown
              label="🎓 Year Level"
              options={[
                { value: 'all', label: roleFilter === 'student' ? 'All Levels' : 'Select Student Role First' },
                ...(roleFilter === 'student' ? [
                  { value: '1', label: '1st Year' },
                  { value: '2', label: '2nd Year' },
                  { value: '3', label: '3rd Year' },
                  { value: '4', label: '4th Year' }
                ] : [])
              ]}
              value={yearLevelFilter}
              onChange={(value) => setYearLevelFilter(value)}
              disabled={roleFilter !== 'student'}
              placeholder={roleFilter === 'student' ? 'All Levels' : 'Select Student Role First'}
            />
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
              <button onClick={() => handleBulkAction('Reset Password')} className="px-4 py-2 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white rounded-lg transition-all">
                Reset Password
              </button>
              <button onClick={() => handleBulkAction('Delete')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all">
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-card shadow-card overflow-hidden w-fit mx-auto">
          <div className="overflow-x-auto">
            <table className="table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                  <th className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={toggleAllUsers}
                      className="w-4 h-4 text-[#7a0000] rounded focus:ring-2 focus:ring-[#7a0000]"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">School ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Program</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
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
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
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
                    <td className="px-6 py-4 text-sm text-gray-600">{user.school_id || 'N/A'}</td>
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
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
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
                          onClick={() => handleDeleteUser(user, false)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user, true)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                          title="Force Delete (Remove All Data)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalUsers}
              onPageChange={setCurrentPage}
              itemLabel="users"
              itemsPerPage={pageSize}
              onItemsPerPageChange={(value) => {
                setPageSize(value)
                setCurrentPage(1)
              }}
              showItemsPerPage={true}
            />
        </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl my-4">
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] p-5 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add New User
                </h2>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmitAdd} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
                  placeholder="user@lpubatangas.edu.ph"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School ID Number *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.school_id}
                    onChange={(e) => {
                      setFormData({...formData, school_id: e.target.value})
                      setEnrollmentLookupDone(false)
                      setEnrollmentInfo(null)
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
                    placeholder="e.g., 2022-00001"
                  />
                  {formData.role === 'student' && (
                    <button
                      type="button"
                      onClick={handleLookupEnrollment}
                      disabled={lookingUpEnrollment || !formData.school_id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {lookingUpEnrollment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Looking up...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                          </svg>
                          Lookup
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'student' ? (
                    <>Click "Lookup" to auto-fill from enrollment list. Password: <span className="font-mono font-semibold">lpub@{formData.school_id || 'studentid'}</span></>
                  ) : (
                    <>This will be used to generate the temporary password: <span className="font-mono font-semibold">lpub@{formData.school_id || 'schoolid'}</span></>
                  )}
                </p>
                
                {/* Enrollment Info Display */}
                {enrollmentInfo && formData.role === 'student' && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div className="flex-1 text-sm">
                        <p className="font-semibold text-green-800 mb-1">✅ Found in Enrollment List</p>
                        <div className="text-green-700 space-y-1">
                          <p><span className="font-medium">Name:</span> {enrollmentInfo.first_name} {enrollmentInfo.middle_name || ''} {enrollmentInfo.last_name}</p>
                          <p><span className="font-medium">Program:</span> {enrollmentInfo.program_code} - {enrollmentInfo.program_name}</p>
                          <p><span className="font-medium">Year Level:</span> {enrollmentInfo.year_level}</p>
                          <p><span className="font-medium">College:</span> {enrollmentInfo.college_code} - {enrollmentInfo.college_name}</p>
                          {enrollmentInfo.email && <p><span className="font-medium">Email:</span> {enrollmentInfo.email}</p>}
                        </div>
                        <p className="text-xs text-green-600 mt-2">⚠️ Program is locked to enrollment record. Cannot be changed.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {enrollmentLookupDone && !enrollmentInfo && formData.role === 'student' && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">⚠️ Not in Enrollment List</p>
                        <p>This student must be added to the enrollment list by the registrar before account creation.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password {formData.role !== 'student' && formData.role !== 'secretary' && formData.role !== 'department_head' && '*'}
                </label>
                {['student', 'secretary', 'department_head'].includes(formData.role) ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div className="text-sm text-blue-700">
                        <p className="font-semibold mb-1">🔒 Auto-Generated Temporary Password</p>
                        <p>Password will be: <span className="font-mono font-bold bg-blue-100 px-2 py-1 rounded">lpub@{formData.school_id || 'schoolid'}</span></p>
                        <p className="mt-2 text-xs text-red-600">
                          ✅ User will receive a welcome email<br/>
                          ✅ Required to change password on first login
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <input
                    type="password"
                    required
                    value={formData.password || ''}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0000] focus:border-transparent"
                    placeholder="Enter password (min 8 characters)"
                    minLength={8}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <CustomDropdown
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'instructor', label: 'Instructor' },
                    { value: 'department_head', label: 'Department Head' },
                    { value: 'secretary', label: 'Secretary' },
                    { value: 'admin', label: 'Administrator' }
                  ]}
                  value={formData.role}
                  onChange={(value) => setFormData({...formData, role: value})}
                />
              </div>

              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Program * {enrollmentInfo && <span className="text-green-600 text-xs ml-2">🔒 Locked to enrollment</span>}
                    </label>
                    <CustomDropdown
                      options={programs.map(prog => ({ value: prog, label: prog }))}
                      value={formData.program}
                      onChange={(value) => setFormData({...formData, program: value})}
                      disabled={enrollmentInfo !== null}
                      helpText={enrollmentInfo ? '✅ Program is automatically set from enrollment list and cannot be changed' : null}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level *</label>
                    <CustomDropdown
                      options={[
                        { value: 1, label: '1st Year' },
                        { value: 2, label: '2nd Year' },
                        { value: 3, label: '3rd Year' },
                        { value: 4, label: '4th Year' }
                      ]}
                      value={formData.yearLevel}
                      onChange={(value) => setFormData({...formData, yearLevel: parseInt(value)})}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <CustomDropdown
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' }
                  ]}
                  value={formData.status}
                  onChange={(value) => setFormData({...formData, status: value})}
                />
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full my-4 max-h-[90vh] flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] p-5 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit User
                </h2>
                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">{`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email}</p>
            </div>
            
            <form onSubmit={handleSubmitEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <CustomDropdown
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'instructor', label: 'Instructor' },
                    { value: 'department_head', label: 'Department Head' },
                    { value: 'secretary', label: 'Secretary' },
                    { value: 'admin', label: 'Administrator' }
                  ]}
                  value={formData.role}
                  onChange={(value) => setFormData({...formData, role: value})}
                />
              </div>

              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Program *</label>
                    <CustomDropdown
                      options={programs.map(prog => ({ value: prog, label: prog }))}
                      value={formData.program}
                      onChange={(value) => setFormData({...formData, program: value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level *</label>
                    <CustomDropdown
                      options={[
                        { value: 1, label: '1st Year' },
                        { value: 2, label: '2nd Year' },
                        { value: 3, label: '3rd Year' },
                        { value: 4, label: '4th Year' }
                      ]}
                      value={formData.yearLevel}
                      onChange={(value) => setFormData({...formData, yearLevel: parseInt(value)})}
                    />
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
                  className="flex-1 px-6 py-3 bg-[#7a0000] hover:bg-[#9a1000] text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl my-4">
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] p-5 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  Bulk Import Users
                </h2>
                <button onClick={() => setShowBulkImportModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Download Template */}
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#7a0000] rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">CSV Template</h3>
                    <p className="text-xs text-gray-600">Step 1: Download the template first</p>
                  </div>
                </div>
                
                <button
                  onClick={downloadCSVTemplate}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mb-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>Download Template</span>
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Required Columns</p>
                    <ul className="space-y-0.5 text-xs text-gray-700">
                      <li>• email</li>
                      <li>• first_name</li>
                      <li>• last_name</li>
                      <li>• school_id <span className="text-red-600 font-semibold">(REQUIRED)</span></li>
                      <li>• role</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Optional Columns</p>
                    <ul className="space-y-0.5 text-xs text-gray-700 mb-2">
                      <li>• program</li>
                      <li>• year_level</li>
                    </ul>
                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                      <p className="text-xs font-semibold text-orange-800">🔐 Password Generation</p>
                      <p className="text-xs text-orange-700">Password: lpub@{'{school_id}'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Upload Your CSV File</h3>
                    <p className="text-xs text-gray-600">Select the filled CSV file to import</p>
                  </div>
                </div>
                
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${bulkImportFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkImportFileChange}
                    className="hidden"
                    id="bulk-import-file"
                  />
                  <label htmlFor="bulk-import-file" className="cursor-pointer block">
                    {bulkImportFile ? (
                      <>
                        <svg className="w-12 h-12 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p className="text-sm font-bold text-green-900 mb-1">{bulkImportFile.name}</p>
                        <p className="text-xs text-green-700">File uploaded successfully!</p>
                        <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">CSV file only</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Validation Errors */}
              {bulkImportErrors.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-red-900 mb-3">⚠️ Found {bulkImportErrors.length} Validation Error(s)</p>
                      <div className="bg-white border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {bulkImportErrors.slice(0, 10).map((err, idx) => (
                            <div key={idx} className="flex items-start space-x-2 pb-2 border-b border-red-100 last:border-0">
                              <span className="text-red-600 font-bold text-xs mt-0.5">•</span>
                              <p className="text-sm text-red-800 flex-1">
                                {typeof err === 'string' ? (
                                  err
                                ) : (
                                  <><span className="font-bold">Row {err.row}:</span> {(err.errors || []).join(', ')}</>
                                )}
                              </p>
                            </div>
                          ))}
                          {bulkImportErrors.length > 10 && (
                            <p className="text-sm text-red-700 font-bold bg-red-100 px-3 py-2 rounded-lg text-center">
                              + {bulkImportErrors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {bulkImportPreview.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#7a0000] to-[#9a1000] rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Data Preview</h3>
                        <p className="text-sm text-gray-600">Showing first 5 rows</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                      {bulkImportPreview.length} rows
                    </span>
                  </div>
                  
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Row</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">First Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Last Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">School ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Program</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Year</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bulkImportPreview.map((row, idx) => (
                            <tr key={idx} className={`${row.hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
                              <td className="px-4 py-3 text-xs text-gray-600 font-semibold">{row.rowNumber}</td>
                              <td className="px-4 py-3 text-xs text-gray-900 font-medium">{row.email}</td>
                              <td className="px-4 py-3 text-xs text-gray-900">{row.first_name}</td>
                              <td className="px-4 py-3 text-xs text-gray-900">{row.last_name}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
                                  {row.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-900 font-mono font-bold">{row.school_id || <span className="text-gray-400">N/A</span>}</td>
                              <td className="px-4 py-3 text-xs text-gray-600">{row.program || <span className="text-gray-400">N/A</span>}</td>
                              <td className="px-4 py-3 text-center text-xs font-bold text-gray-900">{row.year_level || <span className="text-gray-400">1</span>}</td>
                              <td className="px-4 py-3 text-center">
                                {row.hasErrors ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                    </svg>
                                    Invalid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                    </svg>
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
                <div className="bg-red-50 border border-[#7a0000]/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#7a0000] mb-2">{importProgress.status}</p>
                  <div className="w-full bg-[#7a0000]/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-[#7a0000] mt-1">{importProgress.current} / {importProgress.total}</p>
                </div>
              )}
            </div>

            {/* Footer with Action Buttons - Fixed at bottom */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0 rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={submitting || !bulkImportFile || bulkImportPreview.length === 0}
                  className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Modal Components */}
      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={confirmDeleteUser}
        userName={deleteModal.user ? `${deleteModal.user.first_name || ''} ${deleteModal.user.last_name || ''}`.trim() : ''}
      />

      <DeleteResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal({ isOpen: false, userName: '', deleteType: '', reason: '' })}
        userName={resultModal.userName}
        deleteType={resultModal.deleteType}
        reason={resultModal.reason}
      />

      <AlertModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title="Error"
        message={errorModal.message}
        variant="danger"
      />

      {/* New Modal Components */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
      />

      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white p-5 rounded-t-2xl">
              <h3 className="text-lg font-bold">Reset Password</h3>
              <p className="text-white/80 text-sm mt-1">{resetPasswordUser.first_name} {resetPasswordUser.last_name}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password (min. 8 characters)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
                  placeholder="Enter new password"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setNewPassword('')
                  setResetPasswordUser(null)
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || !newPassword || newPassword.length < 8}
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Password Reset Modal */}
      {showBulkPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white p-5 rounded-t-2xl">
              <h3 className="text-lg font-bold">Bulk Password Reset</h3>
              <p className="text-white/80 text-sm mt-1">{selectedUsers.length} users selected</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password (min. 8 characters)
                </label>
                <input
                  type="text"
                  value={bulkPassword}
                  onChange={(e) => setBulkPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#7a0000] transition-all"
                  placeholder="Enter new password"
                  autoFocus
                />
                {bulkPassword && bulkPassword.length < 8 && (
                  <p className="mt-2 text-xs text-red-600">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setShowBulkPasswordModal(false)
                  setBulkPassword('')
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkPasswordReset}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] hover:from-[#9a1000] hover:to-[#7a0000] text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || !bulkPassword || bulkPassword.length < 8}
              >
                {submitting ? 'Resetting...' : 'Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

