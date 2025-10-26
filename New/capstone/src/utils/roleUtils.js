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
  
  // System Admins, Secretaries, and Department Heads have department-wide access to all courses
  if (isSystemAdmin(user) || isSecretary(user) || isDepartmentHead(user)) return courses
  
  // Other roles (if any) are limited to their assigned programs
  if (!user.assignedPrograms) return []
  
  return courses.filter(course => 
    user.assignedPrograms.includes(course.program)
  )
}

// Filter evaluations based on user's assigned programs
export function filterEvaluationsByAccess(evaluations, courses, user) {
  if (!user) return []
  
  // System Admins, Secretaries, and Department Heads have department-wide access to all evaluations
  if (isSystemAdmin(user) || isSecretary(user) || isDepartmentHead(user)) return evaluations
  
  // Other roles (if any) are limited to their assigned programs
  if (!user.assignedPrograms) return []
  
  // Get course IDs that the user has access to
  const accessibleCourseIds = courses
    .filter(course => user.assignedPrograms.includes(course.program))
    .map(course => course.id)
  
  return evaluations.filter(evaluation => 
    accessibleCourseIds.includes(evaluation.courseId)
  )
}

// Check if user is a System Administrator (full system control)
export function isSystemAdmin(user) {
  return user && user.role === 'system-admin'
}

// Check if user is a legacy admin or secretary (view-only access)
export function isAdmin(user) {
  return user && (user.role === 'admin' || user.role === 'secretary')
}

// Check if user is a secretary (department-wide view access)
export function isSecretary(user) {
  return user && (user.role === 'secretary' || user.role === 'admin')
}

// Check if user is a department head (department-wide access - same as secretary)
export function isDepartmentHead(user) {
  return user && user.role === 'head'
}

// Get programs for filtering (used by secretaries)
export function getAvailablePrograms(user) {
  if (!user || !user.assignedPrograms) return []
  return user.assignedPrograms
}

// Check if user has a specific permission (for System Admins)
export function hasPermission(user, permissionName) {
  if (!user) return false
  
  // System Admins have a permissions object
  if (isSystemAdmin(user) && user.permissions) {
    return user.permissions[permissionName] === true
  }
  
  return false
}

// Check if user can manage users (create, edit, delete accounts)
export function canManageUsers(user) {
  return isSystemAdmin(user) && hasPermission(user, 'userManagement')
}

// Check if user can manage courses (create, edit, delete courses)
export function canManageCourses(user) {
  return isSystemAdmin(user) && hasPermission(user, 'courseManagement')
}

// Check if user can manage evaluations (create questionnaires, set periods)
export function canManageEvaluations(user) {
  return isSystemAdmin(user) && hasPermission(user, 'evaluationManagement')
}

// Check if user can configure system settings
export function canConfigureSystem(user) {
  return isSystemAdmin(user) && hasPermission(user, 'systemConfiguration')
}

// Check if user can export data
export function canExportData(user) {
  return isSystemAdmin(user) && hasPermission(user, 'dataExport')
}

// Check if user can view audit logs
export function canViewAuditLogs(user) {
  return isSystemAdmin(user) && hasPermission(user, 'auditLogs')
}

// Check if user can delete evaluations
export function canDeleteEvaluations(user) {
  return isSystemAdmin(user) && hasPermission(user, 'deleteEvaluations')
}

// Check if user can reset passwords
export function canResetPasswords(user) {
  return isSystemAdmin(user) && hasPermission(user, 'resetPasswords')
}

// Get user's role display name
export function getRoleDisplayName(user) {
  if (!user) return 'Unknown'
  
  switch(user.role) {
    case 'system-admin': return 'System Administrator'
    case 'admin': return 'Administrator'
    case 'secretary': return 'Secretary'
    case 'head': return 'Department Head'
    case 'student': return 'Student'
    default: return 'User'
  }
}
