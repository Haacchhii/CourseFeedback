// API Service Layer for Course Feedback System
// This file handles all HTTP requests to the FastAPI backend

import axios from 'axios'

// API Base URL - change this for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      console.error('API Error Response:', { status, data }) // Debug log
      
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
      // Request was made but no response received
      console.error('No response from server:', error.request)
      return Promise.reject(new Error('No response from server. Please check your connection.'))
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
        localStorage.setItem('user', JSON.stringify(response.user))
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
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    window.location.href = '/login'
  },

  /**
   * Get current logged-in user from localStorage
   * @returns {Object|null} User object or null
   */
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user')
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
    return apiClient.put(`/admin/users/${userId}`, userData)
  },

  /**
   * Delete user
   * @param {number} userId - User ID to delete
   * @returns {Promise} Success message
   */
  deleteUser: async (userId) => {
    return apiClient.delete(`/admin/users/${userId}`)
  },

  /**
   * Reset user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise} Success message
   */
  resetPassword: async (userId, newPassword) => {
    return apiClient.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword })
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
   * Create new evaluation period
   * @param {Object} periodData - Period data (name, start_date, end_date, semester, etc.)
   * @returns {Promise} Created period
   */
  createPeriod: async (periodData) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.post(`/admin/evaluation-periods?current_user_id=${currentUser?.id}`, periodData)
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
   * Get active evaluation period
   * @returns {Promise} Active period or null
   */
  getActivePeriod: async () => {
    return apiClient.get('/admin/evaluation-periods/active')
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
    // Use pagination instead of loading all courses at once
    if (params.page) queryParams.append('page', params.page)
    if (params.page_size) queryParams.append('page_size', params.page_size)
    
    return apiClient.get(`/admin/courses?${queryParams.toString()}`)
  },

  // ============================================
  // SYSTEM SETTINGS
  // ============================================

  /**
   * Get system settings by category
   * @param {string} category - Settings category (general, email, security, backup)
   * @returns {Promise} Settings for category
   */
  getSettings: async (category = 'general') => {
    return apiClient.get(`/admin/settings/${category}`)
  },

  /**
   * Update system settings
   * @param {Object} data - {category: string, settings: object}
   * @returns {Promise} Success message
   */
  updateSettings: async (data) => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.put(`/admin/settings?current_user_id=${currentUser?.id}`, data)
  },

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
    if (params.year_level) queryParams.append('year_level', params.year_level)
    if (params.semester) queryParams.append('semester', params.semester)
    
    const query = queryParams.toString()
    return apiClient.get(`/admin/sections${query ? '?' + query : ''}`)
  },

  /**
   * Create a new class section
   * @param {Object} sectionData - Section data (course_id, instructor_id, class_code, semester, academic_year, max_students)
   * @returns {Promise} Created section data
   */
  createSection: async (sectionData) => {
    return apiClient.post('/admin/sections', sectionData)
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
    const format = options.format || 'json'
    return apiClient.get(`/admin/export/users?format=${format}`)
  },

  /**
   * Export evaluations data
   * @param {Object} options - Export options (format, dateRange, filters)
   * @returns {Promise} Export data
   */
  exportEvaluations: async (options = {}) => {
    const format = options.format || 'json'
    const params = new URLSearchParams({ format })
    if (options.dateRange) {
      if (options.dateRange.start) params.append('start_date', options.dateRange.start)
      if (options.dateRange.end) params.append('end_date', options.dateRange.end)
    }
    return apiClient.get(`/admin/export/evaluations?${params.toString()}`)
  },

  /**
   * Export courses data
   * @param {Object} options - Export options (format, filters)
   * @returns {Promise} Export data
   */
  exportCourses: async (options = {}) => {
    const format = options.format || 'json'
    return apiClient.get(`/admin/export/courses?format=${format}`)
  },

  /**
   * Export analytics data
   * @param {Object} options - Export options (format, dateRange)
   * @returns {Promise} Export data
   */
  exportAnalytics: async (options = {}) => {
    const format = options.format || 'json'
    const params = new URLSearchParams({ format })
    if (options.dateRange) {
      if (options.dateRange.start) params.append('start_date', options.dateRange.start)
      if (options.dateRange.end) params.append('end_date', options.dateRange.end)
    }
    return apiClient.get(`/admin/export/analytics?${params.toString()}`)
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
   * @returns {Promise} Completion rates data with overall statistics and per-course breakdown
   */
  getCompletionRates: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/admin/completion-rates?user_id=${currentUser?.id}`)
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
   * @returns {Promise} Dashboard data with stats
   */
  getDashboard: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/dept-head/dashboard?department=${currentUser?.department}`)
  },

  /**
   * Get department evaluations with filters
   * @param {Object} params - Query parameters (semester, academic_year, course_id, etc.)
   * @returns {Promise} Evaluations list
   */
  getEvaluations: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
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
   * Get category averages for a course (6 categories from 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @returns {Promise} Category averages data
   */
  getCategoryAverages: async (courseId, userId) => {
    return apiClient.get(`/dept-head/courses/${courseId}/category-averages?user_id=${userId}`)
  },

  /**
   * Get question distribution for a course (all 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @returns {Promise} Question distribution data
   */
  getQuestionDistribution: async (courseId, userId) => {
    return apiClient.get(`/dept-head/courses/${courseId}/question-distribution?user_id=${userId}`)
  },

  /**
   * Get completion rates for all courses
   * @returns {Promise} Completion rates data with overall statistics and per-course breakdown
   */
  getCompletionRates: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/dept-head/completion-rates?user_id=${currentUser?.id}`)
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
}

// ============================================
// INSTRUCTOR API
// ============================================

export const instructorAPI = {
  /**
   * Get instructor dashboard data
   * @returns {Promise} Dashboard data with stats
   */
  getDashboard: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/instructor/dashboard?user_id=${currentUser?.id}`)
  },

  /**
   * Get instructor courses
   * @returns {Promise} List of courses taught
   */
  getCourses: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/instructor/courses?user_id=${currentUser?.id}`)
  },

  /**
   * Get instructor evaluations
   * @param {Object} params - Query parameters (class_section_id, etc.)
   * @returns {Promise} Evaluations list
   */
  getEvaluations: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/instructor/evaluations?${queryParams.toString()}`)
  },

  /**
   * Get sentiment analysis (instructor view)
   * @param {Object} params - Query parameters
   * @returns {Promise} Sentiment analysis data
   */
  getSentimentAnalysis: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/instructor/sentiment-analysis?${queryParams.toString()}`)
  },

  /**
   * Get anomalies (instructor view)
   * @param {Object} params - Query parameters
   * @returns {Promise} Anomalies list
   */
  getAnomalies: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
    return apiClient.get(`/instructor/anomalies?${queryParams.toString()}`)
  },

  /**
   * Get evaluation questions/form structure
   * @returns {Promise} Question sets
   */
  getQuestions: async () => {
    // Return mock question sets for now (instructors typically view, not edit)
    return Promise.resolve({
      success: true,
      data: {
        questionSets: []
      }
    })
  },

  /**
   * Get programs list for filtering
   * @returns {Promise} List of programs
   */
  getPrograms: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/instructor/programs?user_id=${currentUser?.id}`)
  },

  /**
   * Get year levels list for filtering
   * @returns {Promise} List of year levels
   */
  getYearLevels: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/instructor/year-levels?user_id=${currentUser?.id}`)
  },
}

// ============================================
// SECRETARY API
// ============================================

export const secretaryAPI = {
  /**
   * Get secretary dashboard data
   * @returns {Promise} Dashboard data
   */
  getDashboard: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/secretary/dashboard?user_id=${currentUser?.id}`)
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
   * Get evaluations list
   * @param {Object} params - Query parameters
   * @returns {Promise} Evaluations list
   */
  getEvaluations: async (params = {}) => {
    const currentUser = authAPI.getCurrentUser()
    const queryParams = new URLSearchParams({ user_id: currentUser?.id, ...params })
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
   * @returns {Promise} Category averages data
   */
  getCategoryAverages: async (courseId, userId) => {
    return apiClient.get(`/secretary/courses/${courseId}/category-averages?user_id=${userId}`)
  },

  /**
   * Get question distribution for a course (all 31 questions)
   * @param {number} courseId - Course ID
   * @param {number} userId - User ID
   * @returns {Promise} Question distribution data
   */
  getQuestionDistribution: async (courseId, userId) => {
    return apiClient.get(`/secretary/courses/${courseId}/question-distribution?user_id=${userId}`)
  },

  /**
   * Get completion rates for all courses
   * @returns {Promise} Completion rates data with overall statistics and per-course breakdown
   */
  getCompletionRates: async () => {
    const currentUser = authAPI.getCurrentUser()
    return apiClient.get(`/secretary/completion-rates?user_id=${currentUser?.id}`)
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
   * Get all evaluations with filters
   * @param {Object} params - Query parameters (semester, academic_year, student_id, etc.)
   * @returns {Promise} Evaluations list
   */
  getEvaluations: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
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
export default {
  auth: authAPI,
  admin: adminAPI,
  student: studentAPI,
  deptHead: deptHeadAPI,
  secretary: secretaryAPI,
  instructor: instructorAPI,
  legacyAdmin: legacyAdminAPI,
  utils: {
    downloadFile,
    formatDateForAPI,
  },
}
