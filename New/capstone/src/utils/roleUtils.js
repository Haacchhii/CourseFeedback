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
  
  // Admin has full access
  if (isAdmin(user)) return courses
  
  // Secretary/Dept Head have department-wide access
  if (isStaffMember(user)) return courses
  
  // Other roles (if any) are limited to their assigned programs
  if (!user.assignedPrograms) return []
  
  return courses.filter(course => 
    user.assignedPrograms.includes(course.program)
  )
}

// Filter evaluations based on user's assigned programs
export function filterEvaluationsByAccess(evaluations, courses, user) {
  if (!user) return []
  
  // Admin has full access
  if (isAdmin(user)) return evaluations
  
  // Secretary/Dept Head have department-wide access
  if (isStaffMember(user)) return evaluations
  
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

// Check if user is Admin (full system control)
export function isAdmin(user) {
  return user && user.role === 'admin'
}

// Check if user is a staff member (Secretary/Dept Head/Instructor - same permissions)
export function isStaffMember(user) {
  if (!user) return false
  const role = user.role?.toLowerCase()
  return role === 'secretary' || 
         role === 'department_head' || 
         role === 'instructor'
}

// Legacy compatibility - kept for backward compatibility (no longer used)
export function isSystemAdmin(user) {
  return isAdmin(user)  // Redirect to isAdmin since system-admin role doesn't exist
}

export function isSecretary(user) {
  return isStaffMember(user)
}

export function isDepartmentHead(user) {
  return isStaffMember(user)
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
// Admins have all permissions by default
export function canManageUsers(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'userManagement')
}

// Check if user can manage courses (create, edit, delete courses)
export function canManageCourses(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'courseManagement')
}

// Check if user can manage evaluations (create questionnaires, set periods)
export function canManageEvaluations(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'evaluationManagement')
}

// Check if user can configure system settings
export function canConfigureSystem(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'systemConfiguration')
}

// Check if user can export data
export function canExportData(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'dataExport')
}

// Check if user can view audit logs
export function canViewAuditLogs(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'auditLogs')
}

// Check if user can delete evaluations
export function canDeleteEvaluations(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'deleteEvaluations')
}

// Check if user can reset passwords
export function canResetPasswords(user) {
  if (isAdmin(user)) return true
  return isSystemAdmin(user) && hasPermission(user, 'resetPasswords')
}

// Get user's role display name
export function getRoleDisplayName(user) {
  if (!user) return 'Unknown'
  
  switch(user.role?.toLowerCase()) {
    case 'admin': return 'Administrator'
    case 'secretary': return 'Secretary'
    case 'department_head': return 'Department Head'
    case 'student': return 'Student'
    default: return user.role || 'User'
  }
}

// Get the appropriate API object based on user role
export function getRoleBasedAPI(user, apiModule) {
  if (!user || !apiModule) return null
  
  const role = user.role?.toLowerCase()
  
  switch(role) {
    case 'admin':
      return apiModule.adminAPI
    case 'secretary':
      return apiModule.secretaryAPI
    case 'department_head':
      return apiModule.deptHeadAPI
    case 'student':
      return apiModule.studentAPI
    default:
      return null
  }
}
