import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { isSystemAdmin } from '../../utils/roleUtils'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'

export default function EnhancedCourseManagement() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  // State
  const [activeTab, setActiveTab] = useState('courses')
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showAssignInstructorModal, setShowAssignInstructorModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [csvFile, setCsvFile] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  const [importErrors, setImportErrors] = useState([])
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15) // 15 courses per page for faster loading
  const [totalCourses, setTotalCourses] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Section Management State
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false)
  const [showEditSectionModal, setShowEditSectionModal] = useState(false)
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  
  // Section Pagination State
  const [sectionCurrentPage, setSectionCurrentPage] = useState(1)
  const [sectionPageSize] = useState(15) // 15 sections per page
  
  // Enrollment Filters
  const [sectionSearchTerm, setSectionSearchTerm] = useState('')
  const [sectionProgramFilter, setSectionProgramFilter] = useState('all')
  const [sectionSemesterFilter, setSectionSemesterFilter] = useState('all')
  const [sectionYearFilter, setSectionYearFilter] = useState('all')
  
  const [sectionFormData, setSectionFormData] = useState({
    program_id: '',
    year_level: '',
    semester: '',
    course_id: '',
    instructor_id: '',
    class_code: '',
    academic_year: '2024-2025',
    max_students: 40
  })
  
  // API State
  const [courses, setCourses] = useState([])
  const [allCourses, setAllCourses] = useState([]) // All courses for section creation (unpaginated)
  const [instructors, setInstructors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    classCode: '',
    instructor: '',
    program: 'BSIT',
    yearLevel: 1,
    semester: 'First Semester',
    academicYear: '2024-2025',
    enrolledStudents: 0,
    status: 'Active'
  })

  // Use timeout hook for API calls with extended timeout for large course list
  const { data: apiData, loading, error, retry } = useApiWithTimeout(
    async () => {
      const [coursesData, instructorsData, programsData] = await Promise.all([
        adminAPI.getCourses({ 
          page: currentPage, 
          page_size: pageSize,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        adminAPI.getInstructors(),
        adminAPI.getPrograms()
      ])
      return { 
        courses: coursesData?.data || [], 
        instructors: instructorsData?.data || [],
        programs: programsData?.data || [],
        pagination: coursesData?.pagination || {}
      }
    },
    [currentUser?.id, currentUser?.role, currentPage, pageSize, statusFilter],
    30000 // 30 seconds timeout - should be fast with pagination
  )

  // Update state when data changes
  useEffect(() => {
    if (apiData) {
      setCourses(apiData.courses)
      setInstructors(apiData.instructors)
      // Update pagination state
      if (apiData.pagination) {
        setTotalCourses(apiData.pagination.total || 0)
        setTotalPages(apiData.pagination.total_pages || 0)
      }
    }
  }, [apiData])

  // Redirect if not system admin
  useEffect(() => {
    if (currentUser && !isSystemAdmin(currentUser)) {
      navigate('/courses')
    }
  }, [currentUser?.role, currentUser?.id, navigate])

  // Get programs from API data or derive from courses
  const programs = useMemo(() => {
    if (apiData?.programs && apiData.programs.length > 0) {
      return apiData.programs.map(p => p.code).sort()
    }
    // Fallback to deriving from courses
    const progs = [...new Set(courses.map(c => c.program))].filter(Boolean).sort()
    return progs
  }, [courses, apiData])

  // Get instructors - REMOVED (now fetched via API)

  // Enhanced courses with analytics
  const enhancedCourses = useMemo(() => {
    return courses.map(course => {
      return {
        ...course,
        evaluationCount: course.evaluation_count || 0,
        avgRating: parseFloat(course.avg_rating || 0),
        responseRate: course.response_rate || 0,
        status: course.status || 'Active'
      }
    })
  }, [courses])

  // Filter courses (status filter is server-side, others are client-side for current page)
  const filteredCourses = useMemo(() => {
    return enhancedCourses.filter(course => {
      const matchesSearch = searchTerm === '' ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.classCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesProgram = programFilter === 'all' || course.program === programFilter
      // Status filter is handled server-side now, no need to filter again
      
      return matchesSearch && matchesProgram
    })
  }, [enhancedCourses, searchTerm, programFilter])

  // Filter sections for enrollment tab
  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const matchesSearch = sectionSearchTerm === '' ||
        section.subject_code?.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
        section.subject_name?.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
        section.class_code?.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
        section.instructor_name?.toLowerCase().includes(sectionSearchTerm.toLowerCase())
      
      const matchesProgram = sectionProgramFilter === 'all' || section.program_code === sectionProgramFilter
      
      const matchesSemester = sectionSemesterFilter === 'all' || section.semester === parseInt(sectionSemesterFilter)
      
      const matchesYear = sectionYearFilter === 'all' || section.year_level === parseInt(sectionYearFilter)
      
      return matchesSearch && matchesProgram && matchesSemester && matchesYear
    })
  }, [sections, sectionSearchTerm, sectionProgramFilter, sectionSemesterFilter, sectionYearFilter])

  // Paginated sections (15 per page)
  const paginatedSections = useMemo(() => {
    const startIndex = (sectionCurrentPage - 1) * sectionPageSize
    const endIndex = startIndex + sectionPageSize
    return filteredSections.slice(startIndex, endIndex)
  }, [filteredSections, sectionCurrentPage, sectionPageSize])

  const sectionTotalPages = Math.ceil(filteredSections.length / sectionPageSize)

  // Reset to page 1 when filters change
  useEffect(() => {
    setSectionCurrentPage(1)
  }, [sectionSearchTerm, sectionProgramFilter, sectionSemesterFilter, sectionYearFilter])

  // Analytics data
  const analytics = useMemo(() => {
    const byProgram = {}
    const byYearLevel = {}
    const trendData = []
    
    filteredCourses.forEach(course => {
      // By program
      if (!byProgram[course.program]) {
        byProgram[course.program] = {
          courses: 0,
          students: 0,
          avgRating: []
        }
      }
      byProgram[course.program].courses++
      byProgram[course.program].students += course.enrolledStudents || 0
      if (course.avgRating) byProgram[course.program].avgRating.push(course.avgRating)
      
      // By year level
      const year = `Year ${course.yearLevel}`
      if (!byYearLevel[year]) {
        byYearLevel[year] = {
          courses: 0,
          students: 0
        }
      }
      byYearLevel[year].courses++
      byYearLevel[year].students += course.enrolledStudents || 0
    })
    
    // Prepare chart data
    const programChartData = Object.entries(byProgram).map(([name, data]) => ({
      name,
      courses: data.courses,
      students: data.students,
      avgRating: data.avgRating.length > 0 
        ? (data.avgRating.reduce((a, b) => a + b, 0) / data.avgRating.length).toFixed(2)
        : 0
    }))
    
    const yearLevelData = Object.entries(byYearLevel).map(([name, data]) => ({
      name,
      courses: data.courses,
      students: data.students
    }))
    
    // Mock trend data (last 6 semesters)
    const semesters = ['S1 2023', 'S2 2023', 'S1 2024', 'S2 2024', 'S1 2025']
    const trendChartData = semesters.map((sem, idx) => ({
      semester: sem,
      courses: Math.round(filteredCourses.length * (0.8 + idx * 0.05)),
      avgRating: (3.8 + Math.random() * 0.6).toFixed(2)
    }))
    
    return {
      programChartData,
      yearLevelData,
      trendChartData
    }
  }, [filteredCourses])

  // Handlers
  const handleAddCourse = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await adminAPI.createCourse(formData)
      const updatedCourses = await adminAPI.getCourses()
      setCourses(updatedCourses?.data || [])
      alert(`Course "${formData.name}" created successfully!`)
      setShowAddModal(false)
      setFormData({
        name: '',
        classCode: '',
        instructor: '',
        program: 'BSIT',
        yearLevel: 1,
        semester: 'First Semester',
        academicYear: '2024-2025',
        enrolledStudents: 0,
        status: 'Active'
      })
    } catch (err) {
      alert(`Failed to create course: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter courses for Create Section form based on selected program, year level, and semester
  const filteredCoursesForSection = useMemo(() => {
    if (!sectionFormData.program_id || !sectionFormData.year_level || !sectionFormData.semester) {
      return []
    }
    
    const filtered = allCourses.filter(course => {
      const matchProgram = course.program_id === parseInt(sectionFormData.program_id)
      const matchYear = course.year_level === parseInt(sectionFormData.year_level) || course.yearLevel === parseInt(sectionFormData.year_level)
      const matchSemester = course.semester === parseInt(sectionFormData.semester)
      
      return matchProgram && matchYear && matchSemester
    })
    
    // Debug logging
    console.log('Course filtering:', {
      totalCoursesInCurrentPage: allCourses.length,
      filteredCount: filtered.length,
      filters: {
        program_id: sectionFormData.program_id,
        year_level: sectionFormData.year_level,
        semester: sectionFormData.semester
      },
      sampleCourse: allCourses[0]
    })
    
    return filtered
  }, [allCourses, sectionFormData.program_id, sectionFormData.year_level, sectionFormData.semester])

  const handleOpenCreateSectionModal = async () => {
    setShowCreateSectionModal(true)
    // Load all courses without pagination for the section form
    try {
      const response = await adminAPI.getCourses({ page_size: 10000 }) // Get all courses
      setAllCourses(response?.data || [])
    } catch (err) {
      console.error('Error loading all courses:', err)
    }
  }

  const handleCreateSection = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await adminAPI.createSection(sectionFormData)
      await loadSections()
      alert('Section created successfully!')
      setShowCreateSectionModal(false)
      setSectionFormData({
        course_id: '',
        instructor_id: '',
        class_code: '',
        semester: 1,
        academic_year: '2024-2025',
        max_students: 40
      })
    } catch (err) {
      alert(`Failed to create section: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setCsvFile(file)
    setImportErrors([])
    
    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      
      if (lines.length < 2) {
        setImportErrors(['CSV file is empty or invalid'])
        return
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const requiredHeaders = ['name', 'classcode', 'instructor', 'program', 'yearlevel', 'semester', 'academicyear']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        setImportErrors([`Missing required columns: ${missingHeaders.join(', ')}`])
        return
      }

      // Parse rows
      const preview = []
      const errors = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`)
          continue
        }

        const row = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx]
        })

        // Validation
        if (!row.name || !row.classcode || !row.instructor || !row.program) {
          errors.push(`Row ${i + 1}: Missing required fields`)
          continue
        }

        const yearLevel = parseInt(row.yearlevel)
        if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 4) {
          errors.push(`Row ${i + 1}: Invalid year level (must be 1-4)`)
          continue
        }

        preview.push({
          name: row.name,
          classCode: row.classcode,
          instructor: row.instructor,
          program: row.program,
          yearLevel: yearLevel,
          semester: row.semester || 'First Semester',
          academicYear: row.academicyear || '2024-2025',
          enrolledStudents: 0,
          status: 'Active'
        })
      }

      setImportPreview(preview)
      setImportErrors(errors)
      
    } catch (err) {
      setImportErrors([`Failed to parse CSV: ${err.message}`])
    }
  }

  const handleBulkImport = async (e) => {
    e?.preventDefault()
    
    if (importPreview.length === 0) {
      alert('No courses to import')
      return
    }

    if (!window.confirm(`Import ${importPreview.length} courses?\n\nThis will create new courses in the system.`)) {
      return
    }

    try {
      setSubmitting(true)
      let successCount = 0
      const errors = []

      for (const courseData of importPreview) {
        try {
          await adminAPI.createCourse(courseData)
          successCount++
        } catch (err) {
          errors.push(`Failed to import "${courseData.name}": ${err.message}`)
        }
      }

      // Refresh courses list
      const updatedCourses = await adminAPI.getCourses()
      setCourses(updatedCourses?.data || [])

      if (errors.length > 0) {
        alert(`Imported ${successCount} of ${importPreview.length} courses.\n\nErrors:\n${errors.join('\n')}`)
      } else {
        alert(`Successfully imported ${successCount} courses!`)
      }
      
      setShowBulkImportModal(false)
      setCsvFile(null)
      setImportPreview([])
      setImportErrors([])
      
    } catch (err) {
      alert(`Bulk import failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignInstructor = async (e) => {
    e?.preventDefault()
    
    if (!formData.instructor) {
      alert('Please select an instructor')
      return
    }

    if (selectedCourses.length === 0) {
      alert('No courses selected')
      return
    }

    if (!window.confirm(`Assign "${formData.instructor}" to ${selectedCourses.length} course(s)?`)) {
      return
    }

    try {
      setSubmitting(true)
      let successCount = 0
      const errors = []

      for (const courseId of selectedCourses) {
        try {
          await adminAPI.updateCourse(courseId, { instructor: formData.instructor })
          successCount++
        } catch (err) {
          errors.push(`Failed to update course ID ${courseId}: ${err.message}`)
        }
      }

      // Refresh courses list
      const updatedCourses = await adminAPI.getCourses()
      setCourses(updatedCourses?.data || [])

      if (errors.length > 0) {
        alert(`Updated ${successCount} of ${selectedCourses.length} courses.\n\nErrors:\n${errors.join('\n')}`)
      } else {
        alert(`Successfully assigned instructor to ${successCount} course(s)!`)
      }
      
      setShowAssignInstructorModal(false)
      setSelectedCourses([])
      setFormData({...formData, instructor: ''})
      
    } catch (err) {
      alert(`Instructor assignment failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchiveCourse = async (course, e) => {
    e?.preventDefault()
    if (window.confirm(`Archive "${course.name}"?\n\nThis will hide the course from active listings but preserve all data.`)) {
      try {
        setSubmitting(true)
        await adminAPI.updateCourse(course.id, { status: 'Archived' })
        // Trigger data reload by calling retry
        retry()
        alert(`Course "${course.name}" archived successfully!`)
      } catch (err) {
        alert(`Failed to archive course: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleEditCourse = (course, e) => {
    e?.preventDefault()
    setSelectedCourse(course)
    setFormData({
      name: course.name || '',
      classCode: course.classCode || course.class_code || '',
      instructor: course.instructor || '',
      program: course.program || 'BSIT',
      yearLevel: course.yearLevel || course.year_level || 1,
      semester: course.semester || 'First Semester',
      academicYear: course.academicYear || course.academic_year || '2024-2025',
      enrolledStudents: course.enrolledStudents || course.enrolled_students || 0,
      status: course.status || 'Active'
    })
    setShowEditModal(true)
  }

  const handleUpdateCourse = async (e) => {
    e.preventDefault()
    if (!selectedCourse) return

    try {
      setSubmitting(true)
      await adminAPI.updateCourse(selectedCourse.id, formData)
      // Trigger data reload
      retry()
      alert(`Course "${formData.name}" updated successfully!`)
      setShowEditModal(false)
      setSelectedCourse(null)
      setFormData({
        name: '',
        classCode: '',
        instructor: '',
        program: 'BSIT',
        yearLevel: 1,
        semester: 'First Semester',
        academicYear: '2024-2025',
        enrolledStudents: 0,
        status: 'Active'
      })
    } catch (err) {
      alert(`Failed to update course: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCourse = async (course, e) => {
    e?.preventDefault()
    if (window.confirm(`⚠️ DELETE "${course.name}"?\n\nThis action CANNOT be undone!\n\nAll associated evaluations and data will be permanently removed.`)) {
      try {
        setSubmitting(true)
        await adminAPI.deleteCourse(course.id)
        // Trigger data reload
        retry()
        alert(`Course "${course.name}" deleted successfully!`)
      } catch (err) {
        alert(`Failed to delete course: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const toggleCourseSelection = (courseId, e) => {
    e?.preventDefault()
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  // Section Management Functions
  const loadSections = async () => {
    try {
      const response = await adminAPI.getSections({
        program_id: programFilter !== 'all' ? programFilter : null
      })
      setSections(response?.data || [])
    } catch (err) {
      console.error('Error loading sections:', err)
    }
  }

  const openSectionModal = async (section) => {
    try {
      setSelectedSection(section)
      setShowSectionModal(true)
      setSubmitting(true)
      
      const [enrolledResp, availableResp] = await Promise.all([
        adminAPI.getSectionStudents(section.id),
        adminAPI.getAvailableStudents(section.id)
      ])
      
      setEnrolledStudents(enrolledResp?.data || [])
      setAvailableStudents(availableResp?.data || [])
      setSelectedStudentIds([])
    } catch (err) {
      alert(`Error loading section data: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnrollStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student to enroll')
      return
    }
    
    try {
      setSubmitting(true)
      await adminAPI.enrollStudents(selectedSection.id, selectedStudentIds)
      
      // Reload section data
      const [enrolledResp, availableResp] = await Promise.all([
        adminAPI.getSectionStudents(selectedSection.id),
        adminAPI.getAvailableStudents(selectedSection.id)
      ])
      
      setEnrolledStudents(enrolledResp?.data || [])
      setAvailableStudents(availableResp?.data || [])
      setSelectedStudentIds([])
      
      alert(`Successfully enrolled ${selectedStudentIds.length} student(s)!`)
    } catch (err) {
      alert(`Failed to enroll students: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this section?`)) return
    
    try {
      setSubmitting(true)
      await adminAPI.removeStudentFromSection(selectedSection.id, studentId)
      
      // Reload section data
      const [enrolledResp, availableResp] = await Promise.all([
        adminAPI.getSectionStudents(selectedSection.id),
        adminAPI.getAvailableStudents(selectedSection.id)
      ])
      
      setEnrolledStudents(enrolledResp?.data || [])
      setAvailableStudents(availableResp?.data || [])
      
      alert(`${studentName} removed successfully!`)
    } catch (err) {
      alert(`Failed to remove student: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSection = (section, e) => {
    e?.stopPropagation() // Prevent card click
    setSelectedSection(section)
    setSectionFormData({
      program_id: section.program_id || '',
      year_level: section.year_level || '',
      semester: section.semester || '',
      course_id: section.course_id || '',
      instructor_id: section.instructor_id || '',
      class_code: section.class_code || '',
      academic_year: section.academic_year || '2024-2025',
      max_students: section.max_students || 40
    })
    setShowEditSectionModal(true)
  }

  const handleUpdateSection = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await adminAPI.updateSection(selectedSection.id, sectionFormData)
      await loadSections()
      setShowEditSectionModal(false)
      alert('Section updated successfully!')
    } catch (err) {
      alert(`Failed to update section: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSection = async (section, e) => {
    e?.stopPropagation() // Prevent card click
    if (!window.confirm(`⚠️ DELETE Section "${section.class_code}"?\n\nThis will remove all student enrollments in this section.\n\nThis action CANNOT be undone!`)) {
      return
    }
    
    try {
      setSubmitting(true)
      await adminAPI.deleteSection(section.id)
      await loadSections()
      alert('Section deleted successfully!')
    } catch (err) {
      alert(`Failed to delete section: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Load sections when enrollment tab is active
  useEffect(() => {
    if (activeTab === 'enrollment') {
      loadSections()
    }
  }, [activeTab, programFilter])

  if (!currentUser || !isSystemAdmin(currentUser)) return null
  
  // Loading and error states
  if (loading) return <LoadingSpinner message="Loading courses..." />
  if (error) return <ErrorDisplay error={error} onRetry={retry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-xl border-b-4 border-indigo-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/dashboard')} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Enhanced Course Management</h1>
                <p className="text-indigo-100 text-sm mt-1">Comprehensive course administration and analytics</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setShowBulkImportModal(true)} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-3 rounded-xl transition-all flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <span>Bulk Import</span>
              </button>
              <button onClick={() => setShowAddModal(true)} className="bg-white hover:bg-indigo-50 text-indigo-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Add Course</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📚 Course List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('enrollment')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'enrollment'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👥 Enrollment
          </button>
        </div>

        {/* Course List Tab */}
        {activeTab === 'courses' && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Courses</p>
                    <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
                    <p className="text-xs text-gray-500 mt-1">Showing {filteredCourses.length} on this page</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Programs</p>
                    <p className="text-3xl font-bold text-green-600">{programs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {filteredCourses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {filteredCourses.length > 0
                        ? (filteredCourses.reduce((sum, c) => sum + c.avgRating, 0) / filteredCourses.length).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search</label>
                  <input
                    type="text"
                    placeholder="Search courses, codes, instructors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📚 Program</label>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCourses.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                <p className="text-indigo-900 font-semibold">{selectedCourses.length} course(s) selected</p>
                <div className="flex space-x-2">
                  <button onClick={() => setShowAssignInstructorModal(true)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all">
                    Assign Instructor
                  </button>
                  <button onClick={() => alert('Archiving selected courses...')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all">
                    Archive
                  </button>
                  <button onClick={() => alert('Exporting selected courses...')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all">
                    Export
                  </button>
                </div>
              </div>
            )}

            {/* Courses Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                          onChange={() => {
                            if (selectedCourses.length === filteredCourses.length) {
                              setSelectedCourses([])
                            } else {
                              setSelectedCourses(filteredCourses.map(c => c.id))
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Course Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Instructor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Program</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Students</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rating</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={(e) => toggleCourseSelection(course.id, e)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.classCode || course.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{course.name}</div>
                          <div className="text-xs text-gray-500">Year {course.yearLevel} • {course.semester}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.instructor}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{course.program}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{course.enrolledStudents || 0}</div>
                          <div className="text-xs text-gray-500">{course.evaluationCount || 0} evals</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">{course.avgRating || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => navigate(`/courses`)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleEditCourse(course, e)}
                              className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-all"
                              title="Edit Course"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDeleteCourse(course, e)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                              title="Delete Course"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleArchiveCourse(course, e)}
                              className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all"
                              title="Archive Course"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="bg-white rounded-b-xl border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(currentPage * pageSize, totalCourses)}</span> of{' '}
                  <span className="font-semibold">{totalCourses}</span> courses
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Trend Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Course Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="courses" stroke="#6366f1" strokeWidth={2} name="Courses" />
                  <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} name="Avg Rating" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* By Program */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Courses by Program</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.programChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="courses" fill="#6366f1" name="Courses" />
                    <Bar dataKey="students" fill="#10b981" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By Year Level */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Distribution by Year Level</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.yearLevelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="courses" fill="#8b5cf6" name="Courses" />
                    <Bar dataKey="students" fill="#ec4899" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Rated Courses</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {filteredCourses
                  .sort((a, b) => b.avgRating - a.avgRating)
                  .slice(0, 3)
                  .map((course, idx) => (
                    <div key={course.id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all">
                      <div className="flex items-center mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white mr-3 ${
                          idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span className="text-2xl font-bold text-gray-900">{course.avgRating}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{course.name}</h4>
                      <p className="text-sm text-gray-600">{course.instructor}</p>
                      <p className="text-xs text-gray-500 mt-1">{course.evaluationCount} evaluations</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Tab - Section Management */}
        {activeTab === 'enrollment' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">👥 Section Management</h3>
                <p className="text-gray-600">Manage student enrollments by class section</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenCreateSectionModal}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Create Section
                </button>
                <button
                  onClick={loadSections}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="🔍 Search sections..."
                value={sectionSearchTerm}
                onChange={(e) => setSectionSearchTerm(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <select
                value={sectionProgramFilter}
                onChange={(e) => setSectionProgramFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Programs</option>
                {apiData?.programs && apiData.programs.map(prog => (
                  <option key={prog.id} value={prog.code}>{prog.code}</option>
                ))}
              </select>

              <select
                value={sectionYearFilter}
                onChange={(e) => setSectionYearFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Year Levels</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>

              <select
                value={sectionSemesterFilter}
                onChange={(e) => setSectionSemesterFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Semesters</option>
                <option value="1">First Semester</option>
                <option value="2">Second Semester</option>
                <option value="3">Summer</option>
              </select>

              <div className="text-sm text-gray-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-semibold">
                    {filteredSections.length === 0 ? 'No sections' : `${paginatedSections.length} sections`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {filteredSections.length > 0 && `Page ${sectionCurrentPage} of ${sectionTotalPages} • ${filteredSections.length} total`}
                  </div>
                </div>
              </div>
            </div>

            {submitting && !showSectionModal ? (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No sections found</p>
                <p className="text-sm">Create class sections from the Courses tab</p>
              </div>
            ) : filteredSections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No sections match your filters</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedSections.map(section => (
                  <div
                    key={section.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all relative group"
                  >
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditSection(section, e)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        title="Edit Section"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteSection(section, e)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Delete Section"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>

                    {/* Section Info - Clickable */}
                    <div 
                      className="cursor-pointer"
                      onClick={() => openSectionModal(section)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900">{section.subject_code}</h4>
                          <p className="text-sm text-gray-600">{section.subject_name}</p>
                          <p className="text-xs text-gray-500 mt-1">Section: {section.class_code || 'N/A'}</p>
                        </div>
                        <span className="text-2xl font-bold text-indigo-600">
                          {section.enrolled_count || 0}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          {section.instructor_name || 'No instructor assigned'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Semester {section.semester === 3 ? 'Summer' : section.semester} • {section.academic_year}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {sectionTotalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setSectionCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={sectionCurrentPage === 1}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex gap-2">
                    {[...Array(sectionTotalPages)].map((_, idx) => {
                      const pageNum = idx + 1
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === sectionTotalPages ||
                        (pageNum >= sectionCurrentPage - 1 && pageNum <= sectionCurrentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setSectionCurrentPage(pageNum)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              sectionCurrentPage === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      } else if (
                        pageNum === sectionCurrentPage - 2 ||
                        pageNum === sectionCurrentPage + 2
                      ) {
                        return <span key={pageNum} className="px-2 py-2">...</span>
                      }
                      return null
                    })}
                  </div>

                  <button
                    onClick={() => setSectionCurrentPage(prev => Math.min(sectionTotalPages, prev + 1))}
                    disabled={sectionCurrentPage === sectionTotalPages}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
            )}
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 border-b-4 border-indigo-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">➕ Add New Course</h2>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Introduction to Programming"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.classCode}
                    onChange={(e) => setFormData({...formData, classCode: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="CS101"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Instructor *</label>
                <select
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={`${inst.first_name} ${inst.last_name}`}>
                      {inst.first_name} {inst.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Program *</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="2024-2025"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Course</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 border-b-4 border-purple-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">✏️ Edit Course</h2>
                <button onClick={() => { setShowEditModal(false); setSelectedCourse(null); }} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Introduction to Programming"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.classCode}
                    onChange={(e) => setFormData({...formData, classCode: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="CS101"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Instructor *</label>
                <select
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={`${inst.first_name} ${inst.last_name}`}>
                      {inst.first_name} {inst.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="2024-2025"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enrolled Students</label>
                  <input
                    type="number"
                    value={formData.enrolledStudents}
                    onChange={(e) => setFormData({...formData, enrolledStudents: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="30"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedCourse(null); }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Course</span>
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 border-b-4 border-green-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📤 Bulk Import Courses</h2>
                <button onClick={() => setShowBulkImportModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">📋 CSV Format Requirements:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Headers: name, classCode, instructor, program, yearLevel, semester, academicYear</li>
                  <li>Year level must be 1-4</li>
                  <li>Program must match existing programs</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload CSV File *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-all"
                />
              </div>

              {/* Show Errors */}
              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-900 font-semibold mb-2">⚠️ Errors Found:</p>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    {importErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importPreview.length > 0 && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 font-semibold">✅ Preview: {importPreview.length} courses ready to import</p>
                  </div>

                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Course Name</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Instructor</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Program</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importPreview.map((course, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="px-4 py-2">{course.name}</td>
                            <td className="px-4 py-2">{course.classCode}</td>
                            <td className="px-4 py-2">{course.instructor}</td>
                            <td className="px-4 py-2">{course.program}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={importPreview.length === 0 || submitting}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Import {importPreview.length} Courses</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Instructor Modal */}
      {showAssignInstructorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 border-b-4 border-blue-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">👨‍🏫 Assign Instructor</h2>
                <button onClick={() => setShowAssignInstructorModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">Assigning instructor to <strong>{selectedCourses.length} course(s)</strong></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Instructor *</label>
                <select
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose instructor...</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={`${inst.first_name} ${inst.last_name}`}>
                      {inst.first_name} {inst.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignInstructorModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignInstructor}
                  disabled={!formData.instructor || submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <span>Assign Instructor</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Management Modal */}
      {showSectionModal && selectedSection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 border-b-4 border-indigo-800 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedSection.subject_code} - {selectedSection.section_name}
                  </h2>
                  <p className="text-indigo-100">{selectedSection.subject_name}</p>
                </div>
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Enrolled Students */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg mr-2">
                      {enrolledStudents.length}
                    </span>
                    Enrolled Students
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {enrolledStudents.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No students enrolled</p>
                    ) : (
                      enrolledStudents.map(student => (
                        <div
                          key={student.id}
                          className="bg-white rounded-lg p-3 flex justify-between items-center hover:shadow-md transition-all"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{student.student_number}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(student.id, `${student.first_name} ${student.last_name}`)}
                            disabled={submitting}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Available Students */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg mr-2">
                        {availableStudents.length}
                      </span>
                      Available Students
                    </h3>
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                    {availableStudents
                      .filter(s =>
                        !studentSearchTerm ||
                        s.first_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.last_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.student_number.includes(studentSearchTerm)
                      )
                      .map(student => (
                        <div
                          key={student.id}
                          className="bg-white rounded-lg p-3 flex items-center hover:shadow-md transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds, student.id])
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id))
                              }
                            }}
                            className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{student.student_number}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={handleEnrollStudents}
                    disabled={selectedStudentIds.length === 0 || submitting}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Enrolling...</span>
                      </>
                    ) : (
                      <span>Enroll {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''} Students</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Section Modal */}
      {showCreateSectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 border-b-4 border-green-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">➕ Create New Section</h2>
                <button 
                  onClick={() => setShowCreateSectionModal(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSection} className="p-6 space-y-4">
              {/* Program Selection - First */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Program *</label>
                <select
                  required
                  value={sectionFormData.program_id}
                  onChange={(e) => {
                    const newProgramId = e.target.value
                    setSectionFormData({ 
                      ...sectionFormData, 
                      program_id: newProgramId,
                      year_level: '', // Reset dependent fields
                      semester: '',
                      course_id: ''
                    })
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a program</option>
                  {apiData?.programs && apiData.programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.code} - {program.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Level Selection - Second */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Year Level *</label>
                <select
                  required
                  disabled={!sectionFormData.program_id}
                  value={sectionFormData.year_level}
                  onChange={(e) => {
                    const newYearLevel = e.target.value
                    setSectionFormData({ 
                      ...sectionFormData, 
                      year_level: newYearLevel,
                      semester: '', // Reset dependent fields
                      course_id: ''
                    })
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select year level</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                {!sectionFormData.program_id && (
                  <p className="text-xs text-gray-500 mt-1">Select a program first</p>
                )}
              </div>

              {/* Semester Selection - Third */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Semester *</label>
                <select
                  required
                  disabled={!sectionFormData.year_level}
                  value={sectionFormData.semester}
                  onChange={(e) => {
                    const newSemester = e.target.value
                    setSectionFormData({ 
                      ...sectionFormData, 
                      semester: newSemester,
                      course_id: '' // Reset course selection
                    })
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select semester</option>
                  <option value="1">First Semester</option>
                  <option value="2">Second Semester</option>
                  <option value="3">Summer</option>
                </select>
                {!sectionFormData.year_level && (
                  <p className="text-xs text-gray-500 mt-1">Select year level first</p>
                )}
              </div>

              {/* Course Selection - Fourth (filtered) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Course *</label>
                <select
                  required
                  disabled={!sectionFormData.semester}
                  value={sectionFormData.course_id}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, course_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a course</option>
                  {filteredCoursesForSection.length === 0 && sectionFormData.semester && (
                    <option value="" disabled>No courses available for selected criteria</option>
                  )}
                  {filteredCoursesForSection.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_code || course.classCode} - {course.course_name || course.name}
                    </option>
                  ))}
                </select>
                {!sectionFormData.semester && (
                  <p className="text-xs text-gray-500 mt-1">Select semester first</p>
                )}
                {sectionFormData.semester && filteredCoursesForSection.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ No courses found for the selected program, year level, and semester</p>
                )}
              </div>

              {/* Instructor Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Instructor *</label>
                <select
                  required
                  value={sectionFormData.instructor_id}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, instructor_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name} ({instructor.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Code */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Section Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CS101-A, IT201-1"
                  value={sectionFormData.class_code}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, class_code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Academic Year and Max Students */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="2024-2025"
                    value={sectionFormData.academic_year}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, academic_year: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Max Students *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sectionFormData.max_students}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, max_students: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateSectionModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      <span>Create Section</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {showEditSectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 border-b-4 border-blue-800">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">✏️ Edit Section</h2>
                <button 
                  onClick={() => setShowEditSectionModal(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateSection} className="p-6 space-y-4">
              {/* Instructor Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Instructor *</label>
                <select
                  required
                  value={sectionFormData.instructor_id}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, instructor_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name} ({instructor.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Code */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Section Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CS101-A, IT201-1"
                  value={sectionFormData.class_code}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, class_code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Academic Year and Max Students */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="2024-2025"
                    value={sectionFormData.academic_year}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, academic_year: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Max Students *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sectionFormData.max_students}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, max_students: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditSectionModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Update Section</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
