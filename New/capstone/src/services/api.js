// API Service Layer for Course Feedback System
// This file handles all HTTP requests to the FastAPI backend

import axios from 'axios'
import { rateLimiter } from '../utils/rateLimiter'

// API Base URL - change this for production
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

// Retry configuration for Railway cold starts
const MAX_RETRIES = 2
const RETRY_DELAY = 3000 // 3 seconds

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 second timeout for Railway cold starts
})

// Request interceptor - Add auth token and rate limiting
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Apply rate limiting (only for non-GET requests to prevent spam)
    if (config.method !== 'get') {
      const endpoint = `${config.method}:${config.url}`
      const rateLimitResult = rateLimiter.checkLimit(endpoint, {
        maxRequests: 20, // 20 requests per minute
        timeWindow: 60000, // 1 minute
        blockDuration: 30000 // 30 second block
      })

      if (!rateLimitResult.allowed) {
        // Rate limit exceeded - reject request
        const error = new Error(rateLimitResult.reason)
        error.code = 'RATE_LIMIT_EXCEEDED'
        error.retryAfter = rateLimitResult.retryAfter
        return Promise.reject(error)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      console.error('API Error Response:', { status, data }) // Debug log
      console.error('Full error details:', JSON.stringify(data, null, 2)) // More detailed logging
      
      // Handle specific error codes
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      
      // Return error message from backend or default message
      const errorMessage = data?.detail || data?.message || `Server error (${status})`
      const errorObj = new Error(errorMessage)
      errorObj.response = error.response // Preserve response for debugging
      return Promise.reject(errorObj)
    } else if (error.request) {
      // Request was made but no response received - likely Railway cold start
      const config = error.config
      config._retryCount = config._retryCount || 0
      
      // Retry logic for Railway cold starts (server may be waking up)
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount++
        console.log(`Server not responding. Retrying... (${config._retryCount}/${MAX_RETRIES})`)
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        
        return apiClient.request(config)
      }
      
      console.error('No response from server after retries:', error.request)
      return Promise.reject(new Error('Server is not responding. It may be starting up - please try again in a few seconds.'))
    } else {
      // Something else happened
      console.error('Request error:', error.message)
      return Promise.reject(error)
    }
  }
)

// ============================================
// AUTHENTICATION API
// ============================================

export const authAPI = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Response with user data and token
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      
      // Store token and user data if login successful
      if (response.success && response.user) {
        if (response.token) {
          localStorage.setItem('token', response.token)
        }
        localStorage.setItem('currentUser', JSON.stringify(response.user))
        localStorage.setItem('role', response.user.role)
      }
      
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  /**
   * Logout current user
   */
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('role')
    window.location.href = '/login'
  },

  /**
   * Get current logged-in user from localStorage
   * @returns {Object|null} User object or null
   */
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('currentUser')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has token
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },

  /**
   * Request password reset email
   * @param {string} email - User email
   * @returns {Promise} Response with success message
   */
  forgotPassword: async (email) => {
    try {
      return await apiClient.post('/auth/forgot-password', { email })
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise} Response with success message
   */
  resetPassword: async (token, newPassword) => {
    try {
      return await apiClient.post('/auth/reset-password', { token, new_password: newPassword })
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  },

  /**
   * Change password for first-time login users
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current/temporary password
   * @param {string} newPassword - New password
   * @returns {Promise} Response with success message
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      return await apiClient.post('/auth/change-password', {
        user_id: userId,
        current_password: currentPassword,
        new_password: newPassword
      })
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  },
}

// ============================================
// SYSTEM ADMIN API - User Management
// ============================================

export const adminAPI = {
  /**
   * Get all users with pagination and filters
   * @param {Object} params - Query parameters (page, page_size, search, role, status)
   * @returns {Promise} Users list with pagination
   */
  getUsers: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.page_size) queryParams.append('page_size', params.page_size)
    if (params.search) queryParams.append('search', params.search)
    if (params.role) queryParams.append('role', params.role)
    if (params.status) queryParams.append('status', params.status)
    if (params.program) queryParams.append('program', params.program)
    if (params.year_level) queryParams.append('year_level', params.year_level)
    
    return apiClient.get(`/admin/users?${queryParams.toString()}`)
  },

  /**
   * Create new user
   * @param {Object} userData - User data (email, first_name, last_name, role, password, etc.)
   * @returns {Promise} Created user data
   */
  createUser: async (userData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/users?current_user_id=${currentUser?.id}`, userData)
  },

  /**
   * Update existing user
   * @param {number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user data
   */
  updateUser: async (userId, userData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/admin/users/${userId}?current_user_id=${currentUser?.id}`, userData)
  },

  /**
   * Delete user
   * @param {number} userId - User ID to delete
   * @param {boolean} force - Force delete (removes all related data)
   * @returns {Promise} Success message
   */
  deleteUser: async (userId, force = false) => {
    const currentUser = authAPI.getCurrentUser()
    const forceParam = force ? '&force=true' : ''
    return apiClient.delete(`/admin/users/${userId}?current_user_id=${currentUser?.id}${forceParam}`)
  },

  /**
   * Reset user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise} Success message
   */
  resetPassword: async (userId, newPassword) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/users/${userId}/reset-password?current_user_id=${currentUser?.id}`, { new_password: newPassword })
  },

  /**
   * Activate user (set is_active to true)
   * @param {number} userId - User ID
   * @returns {Promise} Success message
   */
  activateUser: async (userId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/admin/users/${userId}?current_user_id=${currentUser?.id}`, { is_active: true })
  },

  /**
   * Deactivate user (set is_active to false)
   * @param {number} userId - User ID
   * @returns {Promise} Success message
   */
  deactivateUser: async (userId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/admin/users/${userId}?current_user_id=${currentUser?.id}`, { is_active: false })
  },

  /**
   * Get user statistics
   * @returns {Promise} User stats (total, by role, active/inactive)
   */
  getUserStats: async () => {
    return apiClient.get('/admin/users/stats')
  },

  // ============================================
  // EVALUATION PERIODS
  // ============================================

  /**
   * Get all evaluation periods
   * @returns {Promise} List of evaluation periods
   */
  getPeriods: async () => {
    return apiClient.get('/admin/evaluation-periods')
  },

  /**
   * Get all evaluation periods (alias for getPeriods)
   * @returns {Promise} List of evaluation periods
   */
  getEvaluationPeriods: async () => {
    return apiClient.get('/admin/evaluation-periods')
  },

  /**
   * Create new evaluation period
   * @param {Object} periodData - Period data (name, start_date, end_date, semester, etc.)
   * @returns {Promise} Created period
   */
  createPeriod: async (periodData) => {
    const currentUser = authAPI.getCurrentUser()
    // Map camelCase to snake_case for backend
    const backendData = {
      name: periodData.name,
      semester: periodData.semester,
      academic_year: periodData.academicYear || periodData.academic_year,
      start_date: periodData.startDate || periodData.start_date,
      end_date: periodData.endDate || periodData.end_date
    }
    return apiClient.post(`/admin/evaluation-periods?current_user_id=${currentUser?.id}`, backendData)
  },

  /**
   * Update evaluation period status
   * @param {number} periodId - Period ID
   * @param {string} status - New status (draft, active, closed)
   * @returns {Promise} Updated period
   */
  updatePeriodStatus: async (periodId, status) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/admin/evaluation-periods/${periodId}/status?current_user_id=${currentUser?.id}`, { status })
  },

  /**
   * Update evaluation period (extend dates, etc.)
   * @param {number} periodId - Period ID
   * @param {Object} updateData - Data to update (endDate, startDate, name, etc.)
   * @returns {Promise} Updated period
   */
  updatePeriod: async (periodId, updateData) => {
    const currentUser = authAPI.getCurrentUser()
    // Map camelCase to snake_case for backend
    const backendData = {
      end_date: updateData.endDate || updateData.end_date,
      start_date: updateData.startDate || updateData.start_date,
      name: updateData.name,
      semester: updateData.semester,
      academic_year: updateData.academicYear || updateData.academic_year
    }
    // Remove undefined values
    Object.keys(backendData).forEach(key => backendData[key] === undefined && delete backendData[key])
    return apiClient.patch(`/admin/evaluation-periods/${periodId}?current_user_id=${currentUser?.id}`, backendData)
  },

  /**
   * Delete evaluation period
   * @param {number} periodId - Period ID
   * @returns {Promise} Success message
   */
  deletePeriod: async (periodId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/admin/evaluation-periods/${periodId}?current_user_id=${currentUser?.id}`)
  },

  /**
   * Get active evaluation period
   * @returns {Promise} Active period or null
   */
  getActivePeriod: async () => {
    return apiClient.get('/admin/evaluation-periods/active')
  },

  /**
   * Enroll class section in evaluation period
   * @param {number} periodId - Period ID
   * @param {number} sectionId - Class section ID
   * @returns {Promise} Enrollment result
   */
  enrollSectionInPeriod: async (periodId, sectionId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/evaluation-periods/${periodId}/enroll-section?current_user_id=${currentUser?.id}`, { section_id: sectionId })
  },

  /**
   * Get enrolled sections for an evaluation period
   * @param {number} periodId - Period ID
   * @returns {Promise} List of enrolled class sections
   */
  getPeriodEnrolledSections: async (periodId) => {
    return apiClient.get(`/admin/evaluation-periods/${periodId}/enrolled-sections`)
  },

  /**
   * Remove program section enrollment from period
   * @param {number} periodId - Period ID
   * @param {number} enrollmentId - Enrollment ID
   * @returns {Promise} Success message
   */
  removePeriodEnrollment: async (periodId, enrollmentId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/admin/evaluation-periods/${periodId}/enrolled-program-sections/${enrollmentId}?current_user_id=${currentUser?.id}`)
  },

  /**
   * Enroll program section in evaluation period
   * @param {number} periodId - Period ID
   * @param {number} programSectionId - Program section ID
   * @returns {Promise} Enrollment result with student and evaluation counts
   */
  enrollProgramSectionInPeriod: async (periodId, programSectionId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/evaluation-periods/${periodId}/enroll-program-section?current_user_id=${currentUser?.id}`, { program_section_id: programSectionId })
  },

  /**
   * Get enrolled program sections for an evaluation period
   * @param {number} periodId - Period ID
   * @returns {Promise} List of enrolled program sections
   */
  getPeriodEnrolledProgramSections: async (periodId) => {
    return apiClient.get(`/admin/evaluation-periods/${periodId}/enrolled-program-sections`)
  },

  // ============================================
  // COURSES
  // ============================================

  /**
   * Get all courses with filters
   * @param {Object} params - Query parameters (search, status, department, etc.)
   * @returns {Promise} Courses list
   */
  getCourses: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.department) queryParams.append('department', params.department)
    if (params.program_id) queryParams.append('program_id', params.program_id)
    if (params.year_level) queryParams.append('year_level', params.year_level)
    if (params.semester) queryParams.append('semester', params.semester)
    // Use pagination instead of loading all courses at once
    if (params.page) queryParams.append('page', params.page)
    if (params.page_size) queryParams.append('page_size', params.page_size)
    // Show all periods flag to get courses regardless of evaluation period
    if (params.show_all_periods) queryParams.append('show_all_periods', params.show_all_periods)
    
    return apiClient.get(`/admin/courses?${queryParams.toString()}`)
  },

  // ============================================
  // SYSTEM SETTINGS
  // ============================================

  // ============================================
  // AUDIT LOGS
  // ============================================

  /**
   * Get audit logs with filters
   * @param {Object} params - Query parameters (page, action, severity, user_id, start_date, end_date)
   * @returns {Promise} Audit logs with pagination
   */
  getAuditLogs: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.page_size) queryParams.append('page_size', params.page_size)
    if (params.action) queryParams.append('action', params.action)
    if (params.severity) queryParams.append('severity', params.severity)
    if (params.user_id) queryParams.append('user_id', params.user_id)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    
    return apiClient.get(`/admin/audit-logs?${queryParams.toString()}`)
  },

  /**
   * Get audit log statistics
   * @returns {Promise} Audit log stats
   */
  getAuditLogStats: async () => {
    return apiClient.get('/admin/audit-logs/stats')
  },

  // ============================================
  // DATA EXPORT
  // ============================================

  /**
   * Export users to CSV
   * @param {Object} filters - Export filters
   * @returns {Promise} CSV file blob
   */
  exportUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters)
    const response = await axios.get(`${API_BASE_URL}/admin/export/users?${queryParams.toString()}`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    return response.data
  },

  /**
   * Export evaluations to CSV
   * @param {Object} filters - Export filters
   * @returns {Promise} CSV file blob
   */
  exportEvaluations: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters)
    const response = await axios.get(`${API_BASE_URL}/admin/export/evaluations?${queryParams.toString()}`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    return response.data
  },

  /**
   * Get dashboard statistics
   * @returns {Promise} Dashboard stats
   */
  getDashboardStats: async () => {
    return apiClient.get('/admin/dashboard-stats')
  },

  /**
   * Get non-respondents (students who haven't completed evaluations)
   * @param {Object} params - Optional filters (evaluation_period_id, program_id, year_level)
   * @returns {Promise} Non-respondents data with statistics
   */
  getNonRespondents: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.evaluation_period_id) queryParams.append('evaluation_period_id', params.evaluation_period_id)
    if (params.program_id) queryParams.append('program_id', params.program_id)
    if (params.year_level) queryParams.append('year_level', params.year_level)
    
    const queryString = queryParams.toString()
    return apiClient.get(`/admin/non-respondents${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get admin dashboard data (same as dept head for secretaries)
   * @returns {Promise} Dashboard data with stats
   */
  getDashboard: async (filters = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams(filters)
    if (currentUser?.department) {
      queryParams.append('department', currentUser.department)
    }
    return apiClient.get(`/dept-head/dashboard?${queryParams.toString()}`)
  },

  /**
   * Get export history - MOCK DATA (export_history table doesn't exist)
   * @returns {Promise} Export history list
   */
  getExportHistory: async () => {
    return apiClient.get('/admin/export/history')
  },

  /**
   * Get instructors list (from users table with role='instructor')
   * @param {Object} params - Query parameters
   * @returns {Promise} Instructors list
   */
  getInstructors: async (params = {}) => {
    // Get instructors from users table
    return apiClient.get('/admin/users?role=instructor')
  },

  // ============================================
  // EMAIL NOTIFICATIONS
  // ============================================

  /**
   * Send email notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise} Send result
   */
  sendEmailNotification: async (notificationData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/send-notification?current_user_id=${currentUser?.id}`, notificationData)
  },

  /**
   * Get email configuration status
   * @returns {Promise} Email config status
   */
  getEmailConfigStatus: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/admin/email-config-status?current_user_id=${currentUser?.id}`)
  },

  /**
   * Create new course
   * @param {Object} courseData - Course data
   * @returns {Promise} Created course
   */
  createCourse: async (courseData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/courses?current_user_id=${currentUser?.id}`, courseData)
  },

  /**
   * Update course
   * @param {number} courseId - Course ID
   * @param {Object} courseData - Updated course data
   * @returns {Promise} Updated course
   */
  updateCourse: async (courseId, courseData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/admin/courses/${courseId}?current_user_id=${currentUser?.id}`, courseData)
  },

  /**
   * Delete course
   * @param {number} courseId - Course ID
   * @returns {Promise} Success message
   */
  deleteCourse: async (courseId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/admin/courses/${courseId}?current_user_id=${currentUser?.id}`)
  },

  /**
   * Get programs list
   * @returns {Promise} Programs list
   */
  getPrograms: async () => {
    return apiClient.get('/admin/programs')
  },

  /**
   * Upload enrollment list CSV
   * @param {File} file - CSV file containing student enrollment data
   * @returns {Promise} Upload result with success/error counts
   */
  uploadEnrollmentList: async (file) => {
    const currentUser = authAPI.getCurrentUser()
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/admin/enrollment-list/upload?current_user_id=${currentUser?.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // ============================================
  // SECTION MANAGEMENT
  // ============================================

  /**
   * Get all class sections with enrollment counts
   * @param {Object} params - Query parameters (search, program_id, year_level, semester)
   * @returns {Promise} Sections list with enrollment data
   */
  getSections: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.program_id) queryParams.append('program_id', params.program_id)
    if (params.program_code) queryParams.append('program_code', params.program_code)
    if (params.program_section_id) queryParams.append('program_section_id', params.program_section_id)
    if (params.year_level) queryParams.append('year_level', params.year_level)
    if (params.semester) queryParams.append('semester', params.semester)
    if (params.period_id) queryParams.append('period_id', params.period_id)
    
    const query = queryParams.toString()
    return apiClient.get(`/admin/sections${query ? '?' + query : ''}`)
  },

  /**
   * Create a new class section
   * @param {Object} sectionData - Section data (course_id, instructor_id, class_code, semester, academic_year, max_students)
   * @returns {Promise} Created section data
   */
  createSection: async (sectionData, autoEnroll = false) => {
    const url = autoEnroll ? '/admin/sections?auto_enroll=true' : '/admin/sections'
    return apiClient.post(url, sectionData)
  },

  /**
   * Update an existing section
   * @param {number} sectionId - Section ID
   * @param {Object} sectionData - Updated section data
   * @returns {Promise} Updated section data
   */
  updateSection: async (sectionId, sectionData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/admin/sections/${sectionId}?current_user_id=${currentUser?.id}`, sectionData)
  },

  /**
   * Delete a section
   * @param {number} sectionId - Section ID
   * @returns {Promise} Success message
   */
  deleteSection: async (sectionId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/admin/sections/${sectionId}?current_user_id=${currentUser?.id}`)
  },

  /**
   * Get enrolled students for a specific section
   * @param {number} sectionId - Section ID
   * @returns {Promise} List of enrolled students
   */
  getSectionStudents: async (sectionId) => {
    return apiClient.get(`/admin/sections/${sectionId}/students`)
  },

  /**
   * Get available students (with accounts, not enrolled) for a section
   * @param {number} sectionId - Section ID
   * @param {string} search - Optional search query
   * @returns {Promise} List of available students
   */
  getAvailableStudents: async (sectionId, search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiClient.get(`/admin/sections/${sectionId}/available-students${query}`)
  },

  /**
   * Enroll multiple students in a section
   * @param {number} sectionId - Section ID
   * @param {Array<number>} studentIds - Array of student IDs to enroll
   * @returns {Promise} Success message with counts
   */
  enrollStudents: async (sectionId, studentIds) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(
      `/admin/sections/${sectionId}/enroll?current_user_id=${currentUser?.id}`,
      { student_ids: studentIds }
    )
  },

  /**
   * Bulk enroll a single student to a section (used for CSV bulk enrollment)
   * @param {Object} enrollmentData - Enrollment data
   * @param {string} enrollmentData.student_identifier - Student email or student number
   * @param {string} enrollmentData.section_identifier - Section class code or ID
   * @param {string} enrollmentData.identifier_type - 'email', 'student_number', or 'auto'
   * @param {string} enrollmentData.notes - Optional enrollment notes
   * @returns {Promise} Success message
   */
  bulkEnrollStudent: async (enrollmentData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(
      `/admin/sections/bulk-enroll?current_user_id=${currentUser?.id}`,
      enrollmentData
    )
  },

  /**
   * Remove a student from a section
   * @param {number} sectionId - Section ID
   * @param {number} studentId - Student ID
   * @returns {Promise} Success message
   */
  removeStudentFromSection: async (sectionId, studentId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/admin/sections/${sectionId}/students/${studentId}?current_user_id=${currentUser?.id}`)
  },

  // ============================================
  // DATA EXPORT
  // ============================================

  /**
   * Export users data
   * @param {Object} options - Export options (format, filters)
   * @returns {Promise} Export data
   */
  exportUsers: async (options = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const params = new URLSearchParams()
    params.append('format', options.format || 'csv')
    if (currentUser?.id) params.append('user_id', currentUser.id)
    if (options.role) params.append('role', options.role)
    if (options.program) params.append('program', options.program)
    if (options.status) params.append('status', options.status)
    return apiClient.get(`/admin/export/users?${params.toString()}`)
  },

  /**
   * Export evaluations data
   * @param {Object} options - Export options (format, dateRange, filters)
   * @returns {Promise} Export data
   */
  exportEvaluations: async (options = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const params = new URLSearchParams()
    params.append('format', options.format || 'csv')
    if (currentUser?.id) params.append('user_id', currentUser.id)
    if (options.dateRange) params.append('dateRange', options.dateRange)
    if (options.program) params.append('program', options.program)
    if (options.semester) params.append('semester', options.semester)
    if (options.instructor) params.append('instructor', options.instructor)
    return apiClient.get(`/admin/export/evaluations?${params.toString()}`)
  },

  /**
   * Export courses data
   * @param {Object} options - Export options (format, filters)
   * @returns {Promise} Export data
   */
  exportCourses: async (options = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const params = new URLSearchParams()
    params.append('format', options.format || 'csv')
    if (currentUser?.id) params.append('user_id', currentUser.id)
    if (options.program) params.append('program', options.program)
    if (options.status) params.append('status', options.status)
    if (options.year_level) params.append('year_level', options.year_level)
    return apiClient.get(`/admin/export/courses?${params.toString()}`)
  },

  /**
   * Export analytics data
   * @param {Object} options - Export options (format, dateRange)
   * @returns {Promise} Export data
   */
  exportAnalytics: async (options = {}) => {
    const params = new URLSearchParams()
    params.append('format', options.format || 'csv')
    if (options.reportType) params.append('reportType', options.reportType)
    if (options.dateRange) params.append('dateRange', options.dateRange)
    return apiClient.get(`/admin/export/analytics?${params.toString()}`)
  },

  /**
   * Export audit logs
   * @param {Object} options - Export options (format, filters)
   * @returns {Promise} Export data
   */
  exportAuditLogs: async (options = {}) => {
    const params = new URLSearchParams()
    params.append('format', options.format || 'csv')
    if (options.action && options.action !== 'all') params.append('action', options.action)
    if (options.category && options.category !== 'all') params.append('category', options.category)
    if (options.user && options.user !== 'all') params.append('user', options.user)
    if (options.severity && options.severity !== 'all') params.append('severity', options.severity)
    
    // Convert dateRange to start_date and end_date
    if (options.dateRange && options.dateRange !== 'all') {
      const now = new Date()
      let startDate = null
      
      switch (options.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'last_7_days':
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case 'last_30_days':
          startDate = new Date(now.setDate(now.getDate() - 30))
          break
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          params.append('end_date', endDate.toISOString())
          break
      }
      
      if (startDate) {
        params.append('start_date', startDate.toISOString())
      }
    }
    
    const currentUser = authAPI.getCurrentUser()
    if (currentUser?.id) params.append('user_id', currentUser.id)
    
    return apiClient.get(`/admin/export/audit-logs?${params.toString()}`)
  },

  /**
   * Export full system data (all tables)
   * @param {Object} options - Export options (format)
   * @returns {Promise} Export data
   */
  exportFullSystem: async (options = {}) => {
    const format = options.format || 'json'
    return apiClient.get(`/admin/export/full-system?format=${format}`)
  },

  /**
   * Export custom query data
   * @param {Object} options - Custom export options
   * @returns {Promise} Export data
   */
  exportCustom: async (options = {}) => {
    const format = options.format || 'json'
    return apiClient.post('/admin/export/custom', {
      format,
      tables: options.tables,
      fields: options.fields,
      filters: options.filters,
      dateRange: options.dateRange
    })
  },

  /**
   * Get category averages for a course (6 categories from 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @returns {Promise} Category averages data
   */
  getCategoriesAverages: async (courseId, userId) => {
    return apiClient.get(`/admin/courses/${courseId}/category-averages?user_id=${userId}`)
  },

  /**
   * Get question distribution for a course (all 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @returns {Promise} Question distribution data
   */
  getQuestionDistribution: async (courseId, userId) => {
    return apiClient.get(`/admin/courses/${courseId}/question-distribution?user_id=${userId}`)
  },

  /**
   * Get completion rates for all courses
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Completion rates data with overall statistics and per-course breakdown
   */
  getCompletionRates: async (periodId = null) => {
    const currentUser = authAPI.getCurrentUser()
    const url = periodId 
      ? `/admin/completion-rates?user_id=${currentUser?.id}&period_id=${periodId}`
      : `/admin/completion-rates?user_id=${currentUser?.id}`
    return apiClient.get(url)
  },

  /**
   * Submit a support request to the system administrator
   * @param {Object} requestData - Support request data (issueType, subject, message, optional course/student info)
   * @returns {Promise} Success response with ticket ID
   */
  submitSupportRequest: async (requestData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/support-request?user_id=${currentUser?.id}`, requestData)
  },

  /**
   * Create database backup
   * @returns {Promise} Backup file or success message
   */
  createBackup: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/backup/create?user_id=${currentUser?.id}`)
  },

  /**
   * Restore database from backup
   * @param {File} backupFile - Backup file to restore
   * @returns {Promise} Success response
   */
  restoreBackup: async (backupFile) => {
    const currentUser = authAPI.getCurrentUser()
    const formData = new FormData()
    formData.append('backup_file', backupFile)
    
    return axios.post(`${API_BASE_URL}/admin/backup/restore?user_id=${currentUser?.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
  },

  /**
   * Get list of available backups
   * @returns {Promise} List of backup files with metadata
   */
  getBackupHistory: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/admin/backup/history?user_id=${currentUser?.id}`)
  },

  // ============================================
  // PROGRAM SECTIONS MANAGEMENT
  // ============================================

  /**
   * Get all program sections with optional filters
   * @param {Object} filters - Filter options (programId, yearLevel, semester, schoolYear, isActive)
   * @returns {Promise} List of program sections
   */
  getProgramSections: async (filters = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams()
    if (filters.programId) queryParams.append('program_id', filters.programId)
    if (filters.yearLevel) queryParams.append('year_level', filters.yearLevel)
    if (filters.semester) queryParams.append('semester', filters.semester)
    if (filters.schoolYear) queryParams.append('school_year', filters.schoolYear)
    if (filters.isActive !== undefined) queryParams.append('is_active', filters.isActive)
    
    const queryString = queryParams.toString()
    return apiClient.get(`/admin/program-sections${queryString ? '?' + queryString : ''}`)
  },

  /**
   * Create a new program section
   * @param {Object} sectionData - Section data (sectionName, programId, yearLevel, semester, schoolYear)
   * @returns {Promise} Created section
   */
  createProgramSection: async (sectionData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/program-sections?current_user_id=${currentUser?.id}`, {
      section_name: sectionData.sectionName,
      program_id: sectionData.programId,
      year_level: sectionData.yearLevel,
      semester: sectionData.semester,
      school_year: sectionData.schoolYear
    })
  },

  /**
   * Update a program section
   * @param {number} sectionId - Section ID
   * @param {Object} sectionData - Updated section data
   * @returns {Promise} Success response
   */
  updateProgramSection: async (sectionId, sectionData) => {
    const currentUser = authAPI.getCurrentUser()
    const updateData = {}
    if (sectionData.sectionName !== undefined) updateData.section_name = sectionData.sectionName
    if (sectionData.programId !== undefined) updateData.program_id = sectionData.programId
    if (sectionData.yearLevel !== undefined) updateData.year_level = sectionData.yearLevel
    if (sectionData.semester !== undefined) updateData.semester = sectionData.semester
    if (sectionData.schoolYear !== undefined) updateData.school_year = sectionData.schoolYear
    if (sectionData.isActive !== undefined) updateData.is_active = sectionData.isActive
    
    return apiClient.put(`/admin/program-sections/${sectionId}?current_user_id=${currentUser?.id}`, updateData)
  },

  /**
   * Delete a program section
   * @param {number} sectionId - Section ID
   * @returns {Promise} Success response
   */
  deleteProgramSection: async (sectionId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/admin/program-sections/${sectionId}?current_user_id=${currentUser?.id}`)
  },

  /**
   * Get students assigned to a program section
   * @param {number} sectionId - Program Section ID
   * @returns {Promise} List of students
   */
  getProgramSectionStudents: async (sectionId) => {
    return apiClient.get(`/admin/program-sections/${sectionId}/students`)
  },

  /**
   * Get students available for assignment with filters
   * @param {Object} filters - Filter options (programId, yearLevel, search, excludeSectionId)
   * @returns {Promise} List of students
   */
  getStudentsForAssignment: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    if (filters.programId) queryParams.append('program_id', filters.programId)
    if (filters.yearLevel) queryParams.append('year_level', filters.yearLevel)
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.excludeSectionId) queryParams.append('exclude_section_id', filters.excludeSectionId)
    
    const queryString = queryParams.toString()
    return apiClient.get(`/admin/students-for-assignment${queryString ? '?' + queryString : ''}`)
  },

  /**
   * Assign students to a section
   * @param {number} sectionId - Section ID
   * @param {Array<number>} studentIds - Array of student IDs
   * @returns {Promise} Success response
   */
  assignStudentsToSection: async (sectionId, studentIds) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(
      `/admin/program-sections/${sectionId}/assign-students?current_user_id=${currentUser?.id}`,
      { student_ids: studentIds }
    )
  },

  /**
   * Remove a student from a section
   * @param {number} sectionId - Section ID
   * @param {number} studentId - Student ID
   * @returns {Promise} Success response
   */
  removeStudentFromSection: async (sectionId, studentId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/admin/program-sections/${sectionId}/students/${studentId}?current_user_id=${currentUser?.id}`)
  },

  // ============================================
  // STUDENT ADVANCEMENT & ENROLLMENT TRANSITIONS
  // ============================================

  /**
   * Get advancement eligibility report
   * @returns {Promise} Report showing students eligible for year advancement
   */
  getAdvancementEligibility: async () => {
    return apiClient.get('/student-management/advancement/eligibility')
  },

  /**
   * Advance students to next year level
   * @param {Object} params - Advancement parameters
   * @param {number} params.program_id - Optional: Filter by program
   * @param {number} params.current_year_level - Optional: Filter by current year
   * @param {boolean} params.dry_run - Whether to preview only (default true)
   * @returns {Promise} Advancement results
   */
  advanceStudents: async (params = {}) => {
    return apiClient.post('/student-management/advancement/advance-students', {
      program_id: params.program_id,
      current_year_level: params.current_year_level,
      dry_run: params.dry_run !== undefined ? params.dry_run : true
    })
  },

  /**
   * Transition enrollments between evaluation periods
   * @param {Object} params - Transition parameters
   * @param {number} params.from_period_id - Source evaluation period ID
   * @param {number} params.to_period_id - Target evaluation period ID
   * @param {boolean} params.auto_advance_year - Whether to advance year level
   * @param {boolean} params.dry_run - Whether to preview only (default true)
   * @returns {Promise} Transition results
   */
  transitionEnrollments: async (params) => {
    return apiClient.post('/student-management/advancement/transition-enrollments', {
      from_period_id: params.from_period_id,
      to_period_id: params.to_period_id,
      auto_advance_year: params.auto_advance_year || false,
      dry_run: params.dry_run !== undefined ? params.dry_run : true
    })
  },

  /**
   * Get students grouped by year level
   * @param {Object} params - Query parameters
   * @param {number} params.year_level - Optional: Filter by year level
   * @param {number} params.program_id - Optional: Filter by program
   * @returns {Promise} Students list grouped by year
   */
  getStudentsByYearLevel: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.year_level) queryParams.append('year_level', params.year_level)
    if (params.program_id) queryParams.append('program_id', params.program_id)
    
    const queryString = queryParams.toString()
    return apiClient.get(`/student-management/advancement/students-by-year${queryString ? '?' + queryString : ''}`)
  },

  /**
   * List available advancement snapshots for rollback
   * @param {number} limit - Maximum number of snapshots to return
   * @returns {Promise} List of snapshots
   */
  getAdvancementSnapshots: async (limit = 10) => {
    return apiClient.get(`/student-management/advancement/snapshots?limit=${limit}`)
  },

  /**
   * Rollback student year levels to a previous snapshot
   * @param {Object} params - Rollback parameters
   * @param {number} params.snapshot_id - Optional: Specific snapshot ID (null = latest)
   * @param {boolean} params.dry_run - Whether to preview only (default true)
   * @returns {Promise} Rollback results
   */
  rollbackAdvancement: async (params = {}) => {
    return apiClient.post('/student-management/advancement/rollback', {
      snapshot_id: params.snapshot_id || null,
      dry_run: params.dry_run !== undefined ? params.dry_run : true
    })
  },

  /**
   * Manually create a snapshot of current student year levels
   * @param {string} description - Description of the snapshot
   * @returns {Promise} Snapshot creation result
   */
  createAdvancementSnapshot: async (description = 'Manual snapshot') => {
    return apiClient.post(`/student-management/advancement/create-snapshot?description=${encodeURIComponent(description)}`)
  },

  /**
   * Bulk enroll all students from a program section into a class section
   * @param {number} classSectionId - Class section ID
   * @param {number} programSectionId - Program section ID
   * @returns {Promise} Success response with enrollment counts
   */
  enrollProgramSectionToClass: async (classSectionId, programSectionId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(
      `/admin/sections/${classSectionId}/enroll-program-section?current_user_id=${currentUser?.id}`,
      { program_section_id: programSectionId }
    )
  },
}

// ============================================
// STUDENT API
// ============================================

export const studentAPI = {
  /**
   * Get student's enrolled courses
   * @param {number} studentId - Student ID
   * @returns {Promise} List of enrolled courses
   */
  getCourses: async (studentId) => {
    return apiClient.get(`/student/${studentId}/courses`)
  },

  /**
   * Submit course evaluation
   * @param {Object} evaluationData - Evaluation data (student_id, class_section_id, responses)
   * @returns {Promise} Created evaluation
   */
  submitEvaluation: async (evaluationData) => {
    return apiClient.post('/student/evaluations', evaluationData)
  },

  /**
   * Get student's evaluation history
   * @param {number} studentId - Student ID
   * @returns {Promise} List of submitted evaluations
   */
  getEvaluations: async (studentId) => {
    return apiClient.get(`/student/${studentId}/evaluations`)
  },

  /**
   * Get student's evaluation history with period filtering
   * @param {number} studentId - Student ID
   * @param {number|null} periodId - Optional evaluation period ID filter
   * @returns {Promise} List of evaluations with period information
   */
  getEvaluationHistory: async (studentId, periodId = null) => {
    const url = periodId 
      ? `/student/${studentId}/evaluation-history?period_id=${periodId}`
      : `/student/${studentId}/evaluation-history`
    return apiClient.get(url)
  },

  /**
   * Get course details
   * @param {number} courseId - Course ID
   * @returns {Promise} Course details
   */
  getCourseDetails: async (courseId) => {
    return apiClient.get(`/student/courses/${courseId}`)
  },

  /**
   * Get evaluation for editing
   * @param {number} evaluationId - Evaluation ID
   * @returns {Promise} Evaluation data
   */
  getEvaluationForEdit: async (evaluationId) => {
    return apiClient.get(`/student/evaluations/${evaluationId}`)
  },

  /**
   * Update existing evaluation
   * @param {number} evaluationId - Evaluation ID
   * @param {Object} evaluationData - Updated evaluation data
   * @returns {Promise} Updated evaluation
   */
  updateEvaluation: async (evaluationId, evaluationData) => {
    return apiClient.put(`/student/evaluations/${evaluationId}`, evaluationData)
  },
}

// ============================================
// DEPARTMENT HEAD API
// ============================================

export const deptHeadAPI = {
  /**
   * Get department dashboard data
   * @param {Object} filters - Query parameters (period_id, etc.)
   * @returns {Promise} Dashboard data with stats
   */
  getDashboard: async (filters = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ 
      department: currentUser?.department,
      user_id: currentUser?.id,
      ...filters 
    })
    return apiClient.get(`/dept-head/dashboard?${queryParams.toString()}`)
  },

  /**
   * Get department evaluations with filters
   * @param {Object} params - Query parameters (page, page_size, semester, academic_year, course_id, etc.)
   * @returns {Promise} Evaluations list with pagination
   */
  getEvaluations: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ 
      user_id: currentUser?.id, 
      page: params.page || 1,
      page_size: params.page_size || 15, 
      ...params 
    })
    return apiClient.get(`/dept-head/evaluations?${queryParams.toString()}`)
  },

  /**
   * Get sentiment analysis for department
   * @param {Object} params - Query parameters (semester, academic_year, course_id)
   * @returns {Promise} Sentiment analysis data
   */
  getSentimentAnalysis: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/dept-head/sentiment-analysis?${queryParams.toString()}`)
  },

  /**
   * Get department courses with stats
   * @param {Object} params - Query parameters (semester, academic_year, etc.)
   * @returns {Promise} Courses list with evaluation stats
   */
  getCourses: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/dept-head/courses?${queryParams.toString()}`)
  },

  /**
   * Get course evaluation report
   * @param {number} courseId - Course ID
   * @param {Object} params - Query parameters (semester, academic_year)
   * @returns {Promise} Detailed course report
   */
  getCourseReport: async (courseId, params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/dept-head/courses/${courseId}/report?${queryParams.toString()}`)
  },

  /**
   * Get department instructors with stats
   * @param {Object} params - Query parameters (semester, academic_year)
   * @returns {Promise} Instructors list with performance data
   */
  getInstructors: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/dept-head/instructors?${queryParams.toString()}`)
  },

  /**
   * Get anomaly detection results
   * @param {Object} params - Query parameters (semester, academic_year, threshold)
   * @returns {Promise} Detected anomalies
   */
  getAnomalies: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/dept-head/anomalies?${queryParams.toString()}`)
  },

  /**
   * Get department trends over time
   * @param {Object} params - Query parameters (metric, start_date, end_date)
   * @returns {Promise} Trend data
   */
  getTrends: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/dept-head/trends?${queryParams.toString()}`)
  },

  /**
   * Get evaluation questions/form structure
   * @returns {Promise} Question sets
   */
  getQuestions: async () => {
    // Return mock question sets for now (can be replaced with API call later)
    return Promise.resolve({
      success: true,
      data: {
        questionSets: [
          {
            id: 1,
            category: 'Teaching Effectiveness',
            questions: [
              { id: 1, text: 'The instructor demonstrates mastery of the subject matter', type: 'rating' },
              { id: 2, text: 'The instructor presents the material in an organized manner', type: 'rating' },
              { id: 3, text: 'The instructor encourages student participation', type: 'rating' }
            ]
          },
          {
            id: 2,
            category: 'Course Content',
            questions: [
              { id: 4, text: 'The course content is relevant and up-to-date', type: 'rating' },
              { id: 5, text: 'The learning materials are helpful', type: 'rating' }
            ]
          },
          {
            id: 3,
            category: 'Feedback',
            questions: [
              { id: 6, text: 'Additional comments or suggestions', type: 'text' }
            ]
          }
        ]
      }
    })
  },

  /**
   * Get programs list for filtering
   * @returns {Promise} List of programs managed by dept head
   */
  getPrograms: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/dept-head/programs?user_id=${currentUser?.id}`)
  },

  /**
   * Get year levels list for filtering
   * @returns {Promise} List of year levels
   */
  getYearLevels: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/dept-head/year-levels?user_id=${currentUser?.id}`)
  },

  /**
   * Get non-respondents (students who haven't completed evaluations)
   * @param {Object} params - Optional filters (evaluation_period_id, program_id, year_level)
   * @returns {Promise} Non-respondents data with statistics
   */
  getNonRespondents: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id })
    if (params.evaluation_period_id) queryParams.append('evaluation_period_id', params.evaluation_period_id)
    if (params.program_id) queryParams.append('program_id', params.program_id)
    if (params.year_level) queryParams.append('year_level', params.year_level)
    
    return apiClient.get(`/dept-head/non-respondents?${queryParams.toString()}`)
  },

  /**
   * Get category averages for a course (6 categories from 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Category averages data
   */
  getCategoryAverages: async (courseId, userId, periodId = null) => {
    const url = periodId 
      ? `/dept-head/courses/${courseId}/category-averages?user_id=${userId}&period_id=${periodId}`
      : `/dept-head/courses/${courseId}/category-averages?user_id=${userId}`
    return apiClient.get(url)
  },

  /**
   * Get question distribution for a course (all 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Question distribution data
   */
  getQuestionDistribution: async (courseId, userId, periodId = null) => {
    const url = periodId 
      ? `/dept-head/courses/${courseId}/question-distribution?user_id=${userId}&period_id=${periodId}`
      : `/dept-head/courses/${courseId}/question-distribution?user_id=${userId}`
    return apiClient.get(url)
  },

  /**
   * Get completion rates for all courses
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Completion rates data with overall statistics and per-course breakdown
   */
  getCompletionRates: async (periodId = null) => {
    const currentUser = authAPI.getCurrentUser()
    const url = periodId 
      ? `/dept-head/completion-rates?user_id=${currentUser?.id}&period_id=${periodId}`
      : `/dept-head/completion-rates?user_id=${currentUser?.id}`
    return apiClient.get(url)
  },

  /**
   * Get program sections
   * @param {Object} filters - Filter parameters (program_id, year_level, semester, etc.)
   * @returns {Promise} Program sections list
   */
  getProgramSections: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    if (filters.program_id) queryParams.append('program_id', filters.program_id)
    if (filters.year_level) queryParams.append('year_level', filters.year_level)
    if (filters.semester) queryParams.append('semester', filters.semester)
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active)
    
    const query = queryParams.toString()
    return apiClient.get(`/admin/program-sections${query ? '?' + query : ''}`)
  },

  /**
   * Submit a support request to the system administrator
   * @param {Object} requestData - Support request data (issueType, subject, message, optional course/student info)
   * @returns {Promise} Success response with ticket ID
   */
  submitSupportRequest: async (requestData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/dept-head/support-request?user_id=${currentUser?.id}`, requestData)
  },

  /**
   * Get ML analysis results for a specific section
   * @param {number} sectionId - Class section ID
   * @returns {Promise} ML analysis results (sentiment, anomaly)
   */
  getMLAnalysis: async (sectionId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/dept-head/ml-analysis/${sectionId}?user_id=${currentUser?.id}`)
  },

  /**
   * Get ML insights summary across all sections
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Summary of ML insights
   */
  getMLInsightsSummary: async (periodId = null) => {
    const currentUser = authAPI.getCurrentUser()
    const url = periodId 
      ? `/dept-head/ml-insights-summary?user_id=${currentUser?.id}&period_id=${periodId}`
      : `/dept-head/ml-insights-summary?user_id=${currentUser?.id}`
    return apiClient.get(url)
  },

  /**
   * Get all evaluation periods
   * @returns {Promise} List of evaluation periods
   */
  getEvaluationPeriods: async () => {
    return apiClient.get('/admin/evaluation-periods')
  },
}

// ============================================
// SECRETARY API
// ============================================

export const secretaryAPI = {
  /**
   * Get secretary dashboard data
   * @param {Object} filters - Query parameters (period_id, etc.)
   * @returns {Promise} Dashboard data
   */
  getDashboard: async (filters = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ 
      user_id: currentUser?.id,
      ...filters 
    })
    return apiClient.get(`/secretary/dashboard?${queryParams.toString()}`)
  },

  /**
   * Get department courses (secretary can view)
   * @param {Object} params - Query parameters (search, status, semester, etc.)
   * @returns {Promise} Courses list
   */
  getCourses: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/secretary/courses?${queryParams.toString()}`)
  },

  /**
   * Create new course (if secretary has permission)
   * @param {Object} courseData - Course data
   * @returns {Promise} Created course
   */
  createCourse: async (courseData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/secretary/courses?user_id=${currentUser?.id}`, courseData)
  },

  /**
   * Update course (if secretary has permission)
   * @param {number} courseId - Course ID
   * @param {Object} courseData - Updated course data
   * @returns {Promise} Updated course
   */
  updateCourse: async (courseId, courseData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/secretary/courses/${courseId}?user_id=${currentUser?.id}`, courseData)
  },

  /**
   * Delete course (if secretary has permission)
   * @param {number} courseId - Course ID
   * @returns {Promise} Success message
   */
  deleteCourse: async (courseId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.delete(`/secretary/courses/${courseId}?user_id=${currentUser?.id}`)
  },

  /**
   * Get course sections
   * @param {number} courseId - Course ID
   * @returns {Promise} Course sections
   */
  getCourseSections: async (courseId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/secretary/courses/${courseId}/sections?user_id=${currentUser?.id}`)
  },

  /**
   * Create new class section
   * @param {Object} sectionData - Section data
   * @returns {Promise} Created section
   */
  createSection: async (sectionData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/secretary/sections?user_id=${currentUser?.id}`, sectionData)
  },

  /**
   * Assign instructor to section
   * @param {number} sectionId - Section ID
   * @param {number} instructorId - Instructor ID
   * @returns {Promise} Updated section
   */
  assignInstructor: async (sectionId, instructorId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/secretary/sections/${sectionId}/assign-instructor?user_id=${currentUser?.id}`, {
      instructor_id: instructorId,
    })
  },

  /**
   * Get available programs
   * @returns {Promise} Programs list
   */
  getPrograms: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/secretary/programs?user_id=${currentUser?.id}`)
  },

  /**
   * Get year levels list for filtering
   * @returns {Promise} List of year levels
   */
  getYearLevels: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/secretary/year-levels?user_id=${currentUser?.id}`)
  },

  /**
   * Get all evaluation periods
   * @returns {Promise} List of evaluation periods
   */
  getEvaluationPeriods: async () => {
    return apiClient.get('/admin/evaluation-periods')
  },

  /**
   * Get non-respondents (students who haven't completed evaluations)
   * @param {Object} params - Optional filters (evaluation_period_id, year_level)
   * @returns {Promise} Non-respondents data with statistics
   */
  getNonRespondents: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id })
    if (params.evaluation_period_id) queryParams.append('evaluation_period_id', params.evaluation_period_id)
    if (params.year_level) queryParams.append('year_level', params.year_level)
    
    return apiClient.get(`/secretary/non-respondents?${queryParams.toString()}`)
  },

  /**
   * Get evaluations summary report
   * @param {Object} params - Query parameters (semester, academic_year)
   * @returns {Promise} Evaluations summary
   */
  getEvaluationsSummary: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/secretary/reports/evaluations-summary?${queryParams.toString()}`)
  },

  /**
   * Get evaluations list with pagination
   * @param {Object} params - Query parameters (page, page_size, course_id, sentiment, etc.)
   * @returns {Promise} Evaluations list with pagination (15 per page by default)
   */
  getEvaluations: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ 
      user_id: currentUser?.id, 
      page: params.page || 1,
      page_size: params.page_size || 15, 
      ...params 
    })
    return apiClient.get(`/secretary/evaluations?${queryParams.toString()}`)
  },

  /**
   * Get sentiment analysis (secretary view)
   * @param {Object} params - Query parameters
   * @returns {Promise} Sentiment analysis data
   */
  getSentimentAnalysis: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/secretary/sentiment-analysis?${queryParams.toString()}`)
  },

  /**
   * Get anomalies (secretary view)
   * @param {Object} params - Query parameters
   * @returns {Promise} Anomalies list
   */
  getAnomalies: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/secretary/anomalies?${queryParams.toString()}`)
  },

  /**
   * Get evaluation questions/form structure
   * @returns {Promise} Question sets
   */
  getQuestions: async () => {
    // Return mock question sets for now (secretaries typically view, not edit)
    return Promise.resolve({
      success: true,
      data: {
        questionSets: []
      }
    })
  },

  /**
   * Get year levels list for filtering
   * @returns {Promise} List of year levels
   */
  getYearLevels: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/secretary/year-levels?user_id=${currentUser?.id}`)
  },

  /**
   * Get category averages for a course (6 categories from 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Category averages data
   */
  getCategoryAverages: async (courseId, userId, periodId = null) => {
    const url = periodId 
      ? `/secretary/courses/${courseId}/category-averages?user_id=${userId}&period_id=${periodId}`
      : `/secretary/courses/${courseId}/category-averages?user_id=${userId}`
    return apiClient.get(url)
  },

  /**
   * Get question distribution for a course (all 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Question distribution data
   */
  getQuestionDistribution: async (courseId, userId, periodId = null) => {
    const url = periodId 
      ? `/secretary/courses/${courseId}/question-distribution?user_id=${userId}&period_id=${periodId}`
      : `/secretary/courses/${courseId}/question-distribution?user_id=${userId}`
    return apiClient.get(url)
  },

  /**
   * Get completion rates for all courses
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Completion rates data with overall statistics and per-course breakdown
   */
  getCompletionRates: async (periodId = null) => {
    const currentUser = authAPI.getCurrentUser()
    const url = periodId 
      ? `/secretary/completion-rates?user_id=${currentUser?.id}&period_id=${periodId}`
      : `/secretary/completion-rates?user_id=${currentUser?.id}`
    return apiClient.get(url)
  },

  /**
   * Get program sections
   * @param {Object} filters - Filter parameters (program_id, year_level, semester, etc.)
   * @returns {Promise} Program sections list
   */
  getProgramSections: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    if (filters.program_id) queryParams.append('program_id', filters.program_id)
    if (filters.year_level) queryParams.append('year_level', filters.year_level)
    if (filters.semester) queryParams.append('semester', filters.semester)
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active)
    
    const query = queryParams.toString()
    return apiClient.get(`/admin/program-sections${query ? '?' + query : ''}`)
  },

  /**
   * Submit a support request to the system administrator
   * @param {Object} requestData - Support request data (issueType, subject, message, optional course/student info)
   * @returns {Promise} Success response with ticket ID
   */
  submitSupportRequest: async (requestData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/secretary/support-request?user_id=${currentUser?.id}`, requestData)
  },

  /**
   * Get ML analysis results for a specific section
   * @param {number} sectionId - Class section ID
   * @returns {Promise} ML analysis results (sentiment, anomaly)
   */
  getMLAnalysis: async (sectionId) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/secretary/ml-analysis/${sectionId}?user_id=${currentUser?.id}`)
  },

  /**
   * Get ML insights summary across all sections
   * @param {number} periodId - Optional evaluation period ID
   * @returns {Promise} Summary of ML insights
   */
  getMLInsightsSummary: async (periodId = null) => {
    const currentUser = authAPI.getCurrentUser()
    const url = periodId 
      ? `/secretary/ml-insights-summary?user_id=${currentUser?.id}&period_id=${periodId}`
      : `/secretary/ml-insights-summary?user_id=${currentUser?.id}`
    return apiClient.get(url)
  },
}

// ============================================
// ADMIN (LEGACY) API - For backward compatibility
// ============================================

export const legacyAdminAPI = {
  /**
   * Get department overview
   * @returns {Promise} Department stats
   */
  getDepartmentOverview: async () => {
    return apiClient.get('/admin/department-overview')
  },

  /**
   * Get all departments
   * @returns {Promise} Departments list
   */
  getDepartments: async () => {
    return apiClient.get('/admin/departments')
  },

  /**
   * Get all students with filters
   * @param {Object} params - Query parameters (department, program, year_level, etc.)
   * @returns {Promise} Students list
   */
  getStudents: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return apiClient.get(`/admin/students?${queryParams.toString()}`)
  },

  /**
   * Get all instructors
   * @param {Object} params - Query parameters (department, status)
   * @returns {Promise} Instructors list
   */
  getInstructors: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return apiClient.get(`/admin/instructors?${queryParams.toString()}`)
  },

  /**
   * Get all evaluations with filters and pagination
   * @param {Object} params - Query parameters (page, page_size, semester, academic_year, student_id, etc.)
   * @returns {Promise} Evaluations list with pagination (15 per page by default)
   */
  getEvaluations: async (params = {}) => {
    const queryParams = new URLSearchParams({ 
      page: params.page || 1,
      page_size: params.page_size || 15,
      ...params 
    })
    return apiClient.get(`/admin/evaluations?${queryParams.toString()}`)
  },

  /**
   * Get all courses
   * @param {Object} params - Query parameters (department, semester, status)
   * @returns {Promise} Courses list
   */
  getCourses: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    return apiClient.get(`/admin/courses?${queryParams.toString()}`)
  },
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Download file from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Format date for API
 * @param {Date} date - Date object
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Export default object with all APIs
export { apiClient }

export default {
  auth: authAPI,
  admin: adminAPI,
  student: studentAPI,
  deptHead: deptHeadAPI,
  secretary: secretaryAPI,
  legacyAdmin: legacyAdminAPI,
  utils: {
    downloadFile,
    formatDateForAPI,
  },
}
