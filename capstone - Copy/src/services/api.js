// API Service for Course Feedback System
// Connects React frontend to FastAPI backend

const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }

  // Authentication
  async authenticateUser(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Admin Department Management APIs
  async getDepartmentOverview() {
    return this.request('/api/admin/department-overview');
  }

  async getAllDepartments() {
    return this.request('/api/admin/departments');
  }

  async getAllStudents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.department_id) params.append('department_id', filters.department_id);
    if (filters.year_level) params.append('year_level', filters.year_level);
    if (filters.program) params.append('program', filters.program);
    
    const endpoint = `/api/admin/students${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getAllInstructors(departmentId = null) {
    const endpoint = departmentId 
      ? `/api/admin/instructors?department_id=${departmentId}`
      : '/api/admin/instructors';
    return this.request(endpoint);
  }

  async getAllEvaluations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.department_id) params.append('department_id', filters.department_id);
    if (filters.course_id) params.append('course_id', filters.course_id);
    if (filters.instructor_id) params.append('instructor_id', filters.instructor_id);
    if (filters.sentiment) params.append('sentiment', filters.sentiment);
    
    const endpoint = `/api/admin/evaluations${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Additional API endpoints
  async getAllCourses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.department_id) params.append('department_id', filters.department_id);
    if (filters.program) params.append('program', filters.program);
    if (filters.year_level) params.append('year_level', filters.year_level);
    
    const endpoint = `/api/admin/courses${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Future API endpoints (to be implemented)
  async submitEvaluation(evaluationData) {
    return this.request('/api/student/evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  }

  async getStudentEvaluations(studentId) {
    return this.request(`/api/student/${studentId}/evaluations`);
  }

  async getStudentCourses(studentId) {
    return this.request(`/api/student/${studentId}/courses`);
  }

  async getCourseById(courseId) {
    return this.request(`/api/courses/${courseId}`);
  }

  async getEvaluationQuestions() {
    return this.request('/api/admin/evaluation-questions');
  }

  async submitCourseEvaluation(evaluationData) {
    return this.request('/api/student/submit-evaluation', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  }

  async getInstructorCourses(instructorId) {
    return this.request(`/api/instructor/${instructorId}/courses`);
  }

  async getInstructorEvaluations(instructorId) {
    return this.request(`/api/instructor/${instructorId}/evaluations`);
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  healthCheck,
  getDepartmentOverview,
  getAllDepartments,
  getAllStudents,
  getAllInstructors,
  getAllEvaluations,
  getAllCourses,
  submitEvaluation,
  getStudentEvaluations,
  getInstructorCourses,
  getInstructorEvaluations,
} = apiService;