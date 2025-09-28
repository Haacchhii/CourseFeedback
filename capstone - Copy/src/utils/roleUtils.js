// Role-based access control utilities

export function getCurrentUser() {
  try {
    const user = localStorage.getItem('currentUser')
    return user ? JSON.parse(user) : null
  } catch (e) {
    return null
  }
}

export function getCurrentRole() {
  try {
    return localStorage.getItem('role') || null
  } catch (e) {
    return null
  }
}

// Filter courses based on user's assigned programs
export function filterCoursesByAccess(courses, user) {
  if (!user) return []
  
  // Admins have global access to all courses
  if (isAdmin(user)) return courses
  
  // Department heads and other roles are limited to their assigned programs
  if (!user.assignedPrograms) return []
  
  return courses.filter(course => 
    user.assignedPrograms.includes(course.program)
  )
}

// Filter evaluations based on user's assigned programs
export function filterEvaluationsByAccess(evaluations, courses, user) {
  if (!user) return []
  
  // Admins have global access to all evaluations
  if (isAdmin(user)) return evaluations
  
  // Department heads and other roles are limited to their assigned programs
  if (!user.assignedPrograms) return []
  
  // Get course IDs that the user has access to
  const accessibleCourseIds = courses
    .filter(course => user.assignedPrograms.includes(course.program))
    .map(course => course.id)
  
  return evaluations.filter(evaluation => 
    accessibleCourseIds.includes(evaluation.courseId)
  )
}

// Check if user is an admin (secretary has global access)
export function isAdmin(user) {
  return user && user.role === 'secretary'
}

// Check if user is a secretary (global access)
export function isSecretary(user) {
  return user && user.role === 'secretary'
}

// Check if user is a department head (limited access)
export function isDepartmentHead(user) {
  return user && user.role === 'department_head'
}

// Get programs for filtering (used by secretaries)
export function getAvailablePrograms(user) {
  if (!user || !user.assignedPrograms) return []
  return user.assignedPrograms
}
