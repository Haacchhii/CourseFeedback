// SECTION MANAGEMENT UI COMPONENT
// Replace the "Enrollment Tab" section in EnhancedCourseManagement.jsx (lines 877-903)
// With this complete implementation

import React, { useState, useEffect } from 'react'

// Add this state at the top of EnhancedCourseManagement component:
const [sections, setSections] = useState([])
const [selectedSection, setSelectedSection] = useState(null)
const [enrolledStudents, setEnrolledStudents] = useState([])
const [availableStudents, setAvailableStudents] = useState([])
const [selectedStudentIds, setSelectedStudentIds] = useState([])
const [showSectionModal, setShowSectionModal] = useState(false)
const [sectionFilters, setSectionFilters] = useState({
  program_id: null,
  semester: null,
  academic_year: null
})
const [studentSearch, setStudentSearch] = useState('')
const [loadingSections, setLoadingSections] = useState(false)
const [loadingStudents, setLoadingStudents] = useState(false)

// Add these functions in the component:

const fetchSections = async () => {
  try {
    setLoadingSections(true)
    const params = {}
    if (sectionFilters.program_id) params.program_id = sectionFilters.program_id
    if (sectionFilters.semester) params.semester = sectionFilters.semester
    if (sectionFilters.academic_year) params.academic_year = sectionFilters.academic_year
    params.current_user_id = currentUser.id
    
    const response = await adminAPI.getSections(params)
    setSections(response.data || [])
  } catch (err) {
    console.error('Error fetching sections:', err)
    alert('Failed to load sections: ' + (err.message || 'Unknown error'))
  } finally {
    setLoadingSections(false)
  }
}

const openSectionManagement = async (section) => {
  try {
    setSelectedSection(section)
    setShowSectionModal(true)
    setLoadingStudents(true)
    
    // Fetch enrolled students
    const enrolledResponse = await adminAPI.getSectionStudents(section.section_id)
    setEnrolledStudents(enrolledResponse.data || [])
    
    // Fetch available students
    const availableResponse = await adminAPI.getAvailableStudentsForSection(section.section_id)
    setAvailableStudents(availableResponse.data || [])
    
    setLoadingStudents(false)
  } catch (err) {
    console.error('Error loading section students:', err)
    alert('Failed to load students: ' + (err.message || 'Unknown error'))
    setLoadingStudents(false)
  }
}

const enrollSelectedStudents = async () => {
  if (selectedStudentIds.length === 0) {
    alert('Please select at least one student to enroll')
    return
  }
  
  try {
    const response = await adminAPI.enrollStudentsInSection(
      selectedSection.section_id,
      selectedStudentIds
    )
    
    alert(response.message || 'Students enrolled successfully!')
    setSelectedStudentIds([])
    
    // Refresh the lists
    openSectionManagement(selectedSection)
    fetchSections() // Update enrollment counts
  } catch (err) {
    console.error('Error enrolling students:', err)
    alert('Failed to enroll students: ' + (err.message || 'Unknown error'))
  }
}

const removeStudentFromSection = async (studentId) => {
  if (!confirm('Are you sure you want to remove this student from the section?')) {
    return
  }
  
  try {
    await adminAPI.removeStudentFromSection(selectedSection.section_id, studentId)
    alert('Student removed successfully!')
    
    // Refresh the lists
    openSectionManagement(selectedSection)
    fetchSections() // Update enrollment counts
  } catch (err) {
    console.error('Error removing student:', err)
    alert('Failed to remove student: ' + (err.message || 'Unknown error'))
  }
}

const toggleStudentSelection = (studentId) => {
  setSelectedStudentIds(prev => 
    prev.includes(studentId)
      ? prev.filter(id => id !== studentId)
      : [...prev, studentId]
  )
}

const filteredAvailableStudents = availableStudents.filter(student => {
  const searchLower = studentSearch.toLowerCase()
  return (
    student.full_name.toLowerCase().includes(searchLower) ||
    student.student_number.toLowerCase().includes(searchLower) ||
    student.email.toLowerCase().includes(searchLower)
  )
})

// Load sections when tab changes to 'enrollment' (now 'sections')
useEffect(() => {
  if (activeTab === 'enrollment') { // Keep this check or change to 'sections' if you rename the tab
    fetchSections()
  }
}, [activeTab, sectionFilters])

// ===========================================
// JSX TO REPLACE THE ENROLLMENT TAB (lines 877-903)
// ===========================================

{/* Sections Tab (formerly Enrollment) */}
{activeTab === 'enrollment' && (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">📚 Section Management</h3>
        <p className="text-gray-600 mt-1">Manage student enrollments in class sections</p>
      </div>
      <button
        onClick={fetchSections}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span>Refresh</span>
      </button>
    </div>

    {/* Filters */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <select
        value={sectionFilters.semester || ''}
        onChange={(e) => setSectionFilters(prev => ({ ...prev, semester: e.target.value ? parseInt(e.target.value) : null }))}
        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">All Semesters</option>
        <option value="1">1st Semester</option>
        <option value="2">2nd Semester</option>
        <option value="3">Summer</option>
      </select>

      <input
        type="text"
        placeholder="Academic Year (e.g., 2024-2025)"
        value={sectionFilters.academic_year || ''}
        onChange={(e) => setSectionFilters(prev => ({ ...prev, academic_year: e.target.value || null }))}
        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      <button
        onClick={() => setSectionFilters({ program_id: null, semester: null, academic_year: null })}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
      >
        Clear Filters
      </button>
    </div>

    {/* Loading State */}
    {loadingSections ? (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading sections...</p>
      </div>
    ) : sections.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">No sections found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or create new sections</p>
      </div>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(section => (
          <div key={section.section_id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{section.subject_name}</h4>
                <p className="text-sm text-gray-600">{section.subject_code} - {section.section_code}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {section.instructor_name} • {section.program_code}
                </p>
                <p className="text-xs text-gray-500">
                  Semester {section.semester} • {section.academic_year}
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{section.enrolled_count}</div>
                <div className="text-xs text-gray-500">students</div>
              </div>
            </div>
            <button
              onClick={() => openSectionManagement(section)}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <span>Manage Students</span>
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* Section Management Modal */}
{showSectionModal && selectedSection && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 border-b-4 border-indigo-800">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedSection.subject_name}</h2>
            <p className="text-indigo-100 text-sm mt-1">
              {selectedSection.section_code} • {selectedSection.instructor_name}
            </p>
            <p className="text-indigo-200 text-xs mt-1">
              Semester {selectedSection.semester} • {selectedSection.academic_year}
            </p>
          </div>
          <button
            onClick={() => {
              setShowSectionModal(false)
              setSelectedSection(null)
              setSelectedStudentIds([])
              setStudentSearch('')
            }}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {loadingStudents ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Enrolled Students */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                  {enrolledStudents.length}
                </span>
                Enrolled Students
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {enrolledStudents.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No students enrolled yet</p>
                  </div>
                ) : (
                  enrolledStudents.map(student => (
                    <div key={student.student_id} className="border-2 border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{student.full_name}</div>
                          <div className="text-sm text-gray-600">{student.student_number}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {student.program_code} • Year {student.year_level}
                          </div>
                          {student.has_evaluated && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              ✓ Evaluated
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeStudentFromSection(student.student_id)}
                          className="ml-2 w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                          title="Remove student"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Students */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                  {filteredAvailableStudents.length}
                </span>
                Available Students
              </h3>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name, number, or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Enroll Button */}
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={enrollSelectedStudents}
                  className="w-full mb-4 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  <span>Enroll Selected ({selectedStudentIds.length})</span>
                </button>
              )}

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredAvailableStudents.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No available students</p>
                    <p className="text-gray-400 text-sm mt-1">All registered students are enrolled</p>
                  </div>
                ) : (
                  filteredAvailableStudents.map(student => (
                    <label
                      key={student.student_id}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all flex items-start ${
                        selectedStudentIds.includes(student.student_id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.student_id)}
                        onChange={() => toggleStudentSelection(student.student_id)}
                        className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-semibold text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-600">{student.student_number}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.program_code} • Year {student.year_level}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
