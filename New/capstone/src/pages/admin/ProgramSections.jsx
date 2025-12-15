import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { AlertModal, ConfirmModal } from '../../components/Modal';
import CustomDropdown from '../../components/CustomDropdown';

const ProgramSections = () => {
  const [sections, setSections] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSection, setSelectedSection] = useState(null);
  const [filters, setFilters] = useState({});
  
  // Form data for creating/editing sections
  const [formData, setFormData] = useState({
    sectionName: '',
    programId: '',
    yearLevel: '',
    semester: '',
    schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  });
  
  // Student assignment state
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentFilters, setStudentFilters] = useState({
    programId: '',
    yearLevel: '',
    search: ''
  });
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', cancelText: 'Cancel' });

  // Modal Helper Functions
  const showAlert = (message, title = 'Notification', type = 'info') => {
    setAlertConfig({ title, message, type });
    setShowAlertModal(true);
  };

  const showConfirm = (message, onConfirm, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmConfig({ title, message, onConfirm, confirmText, cancelText });
    setShowConfirmModal(true);
  };

  useEffect(() => {
    loadSections();
    loadPrograms();
  }, []);

  useEffect(() => {
    if (filters.programId || filters.yearLevel || filters.semester || filters.schoolYear) {
      loadSections();
    }
  }, [filters]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getProgramSections(filters);
      setSections(response.data || []);
    } catch (error) {
      console.error('Failed to load sections:', error);
      showAlert('Failed to load program sections', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await adminAPI.getPrograms();
      setPrograms(response.data || []);
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  };

  const loadAvailableStudents = async (sectionId = null) => {
    try {
      setLoadingStudents(true);
      const response = await adminAPI.getStudentsForAssignment({
        ...studentFilters,
        excludeSectionId: sectionId
      });
      setAvailableStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
      showAlert('Failed to load students', 'Error', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadAssignedStudents = async (sectionId) => {
    try {
      const response = await adminAPI.getSectionStudents(sectionId);
      setAssignedStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load assigned students:', error);
      showAlert('Failed to load section students', 'Error', 'error');
    }
  };

  const handleCreateSection = () => {
    setModalMode('create');
    setFormData({
      sectionName: '',
      programId: '',
      yearLevel: '',
      semester: '',
      schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    });
    setShowModal(true);
  };

  const handleEditSection = (section) => {
    setModalMode('edit');
    setSelectedSection(section);
    setFormData({
      sectionName: section.sectionName,
      programId: section.programId.toString(),
      yearLevel: section.yearLevel.toString(),
      semester: section.semester.toString(),
      schoolYear: section.schoolYear
    });
    setShowModal(true);
  };

  const handleDeleteSection = async (section) => {
    showConfirm(
      `Are you sure you want to delete section "${section.sectionName}"? This will remove all student assignments.`,
      async () => {
        try {
          await adminAPI.deleteProgramSection(section.id);
          showAlert('Section deleted successfully', 'Success', 'success');
          loadSections();
        } catch (error) {
          console.error('Failed to delete section:', error);
          showAlert('Failed to delete section', 'Error', 'error');
        }
      },
      'Delete Section',
      'Delete',
      'Cancel'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.sectionName || !formData.programId || !formData.yearLevel || 
        !formData.semester || !formData.schoolYear) {
      showAlert('Please fill in all required fields', 'Validation Error', 'warning');
      return;
    }
    
    const data = {
      sectionName: formData.sectionName.trim(),
      programId: parseInt(formData.programId),
      yearLevel: parseInt(formData.yearLevel),
      semester: parseInt(formData.semester),
      schoolYear: formData.schoolYear.trim()
    };

    // Validate parsed values
    if (isNaN(data.programId) || isNaN(data.yearLevel) || isNaN(data.semester)) {
      showAlert('Invalid numeric values', 'Validation Error', 'warning');
      return;
    }

    try {
      if (modalMode === 'create') {
        await adminAPI.createProgramSection(data);
        showAlert('Section created successfully', 'Success', 'success');
      } else {
        await adminAPI.updateProgramSection(selectedSection.id, data);
        showAlert('Section updated successfully', 'Success', 'success');
      }
      setShowModal(false);
      loadSections();
    } catch (error) {
      console.error('Failed to save section:', error);
      showAlert(error.response?.data?.detail || 'Failed to save section', 'Error', 'error');
    }
  };

  const handleManageStudents = (section) => {
    setSelectedSection(section);
    setStudentFilters({
      programId: section.programId.toString(),
      yearLevel: section.yearLevel.toString(),
      search: ''
    });
    setSelectedStudents([]);
    loadAvailableStudents(section.id);
    setShowStudentModal(true);
  };

  const handleViewStudents = (section) => {
    setSelectedSection(section);
    loadAssignedStudents(section.id);
    setShowStudentListModal(true);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudents.map(s => s.id));
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) {
      showAlert('Please select at least one student', 'Validation Error', 'warning');
      return;
    }

    try {
      const response = await adminAPI.assignStudentsToSection(selectedSection.id, selectedStudents);
      showAlert(response.message, 'Success', 'success');
      setShowStudentModal(false);
      loadSections();
    } catch (error) {
      console.error('Failed to assign students:', error);
      showAlert('Failed to assign students', 'Error', 'error');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    showConfirm(
      'Are you sure you want to remove this student from the section?',
      async () => {
        try {
          await adminAPI.removeStudentFromSection(selectedSection.id, studentId);
          showAlert('Student removed successfully', 'Success', 'success');
          loadAssignedStudents(selectedSection.id);
          loadSections();
        } catch (error) {
          console.error('Failed to remove student:', error);
          showAlert('Failed to remove student', 'Error', 'error');
        }
      },
      'Remove Student',
      'Remove',
      'Cancel'
    );
  };

  useEffect(() => {
    if (showStudentModal && selectedSection) {
      loadAvailableStudents(selectedSection.id);
    }
  }, [studentFilters.programId, studentFilters.yearLevel, studentFilters.search]);

  const yearLevelOptions = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' }
  ];

  const semesterOptions = [
    { value: 1, label: '1st Semester' },
    { value: 2, label: '2nd Semester' },
    { value: 3, label: 'Summer' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">

      {/* Create Section Button */}
      <div className="mb-6">
        <button
          onClick={handleCreateSection}
          className="bg-[#7a0000] hover:bg-[#5a0000] text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Create Section</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 lg:p-8 rounded-card shadow-card mb-12">
        <div className="grid grid-cols-4 gap-4">
          <CustomDropdown
            label="Program"
            value={filters.programId ? filters.programId.toString() : ''}
            onChange={(val) => setFilters({ ...filters, programId: val })}
            options={[
              { value: '', label: 'All Programs' },
              ...programs.map(program => ({
                value: program.id.toString(),
                label: program.code
              }))
            ]}
            searchable={true}
          />
          <CustomDropdown
            label="Year Level"
            value={filters.yearLevel ? filters.yearLevel.toString() : ''}
            onChange={(val) => setFilters({ ...filters, yearLevel: val })}
            options={[
              { value: '', label: 'All Years' },
              ...yearLevelOptions.map(opt => ({
                value: opt.value.toString(),
                label: opt.label
              }))
            ]}
          />
          <CustomDropdown
            label="Semester"
            value={filters.semester ? filters.semester.toString() : ''}
            onChange={(val) => setFilters({ ...filters, semester: val })}
            options={[
              { value: '', label: 'All Semesters' },
              ...semesterOptions.map(opt => ({
                value: opt.value.toString(),
                label: opt.label
              }))
            ]}
          />
          <div>
            <label className="block text-sm font-medium mb-1">School Year</label>
            <input
              type="text"
              value={filters.schoolYear || ''}
              onChange={(e) => setFilters({ ...filters, schoolYear: e.target.value })}
              placeholder="e.g., 2024-2025"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Sections Table */}
      {loading ? (
        <div className="text-center py-8">Loading sections...</div>
      ) : sections.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No sections found. Create your first section to get started.
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Section Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Year/Semester</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">School Year</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sections.map(section => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{section.sectionName}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">{section.programCode}</div>
                      <div className="text-gray-500">{section.programName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {yearLevelOptions.find(y => y.value === section.yearLevel)?.label} - 
                      {semesterOptions.find(s => s.value === section.semester)?.label}
                    </div>
                  </td>
                  <td className="px-6 py-4">{section.schoolYear}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewStudents(section)}
                      className="text-red-600 hover:underline font-medium"
                    >
                      {section.studentCount} student{section.studentCount !== 1 ? 's' : ''}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      section.isActive ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {section.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManageStudents(section)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Add Students
                      </button>
                      <button
                        onClick={() => handleEditSection(section)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-xl font-bold">
                {modalMode === 'create' ? 'Create Section' : 'Edit Section'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Section Name *</label>
                  <input
                    type="text"
                    value={formData.sectionName}
                    onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                    placeholder="e.g., BSIT 3A"
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <CustomDropdown
                  label="Program *"
                  value={formData.programId}
                  onChange={(val) => setFormData({ ...formData, programId: val })}
                  options={[
                    { value: '', label: 'Select a program' },
                    ...programs.map(program => ({
                      value: program.id.toString(),
                      label: `${program.code} - ${program.name}`
                    }))
                  ]}
                  searchable={true}
                />
                <CustomDropdown
                  label="Year Level *"
                  value={formData.yearLevel}
                  onChange={(val) => setFormData({ ...formData, yearLevel: val })}
                  options={[
                    { value: '', label: 'Select year level' },
                    ...yearLevelOptions.map(opt => ({
                      value: opt.value.toString(),
                      label: opt.label
                    }))
                  ]}
                />
                <CustomDropdown
                  label="Semester *"
                  value={formData.semester}
                  onChange={(val) => setFormData({ ...formData, semester: val })}
                  options={[
                    { value: '', label: 'Select semester' },
                    ...semesterOptions.map(opt => ({
                      value: opt.value.toString(),
                      label: opt.label
                    }))
                  ]}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">School Year *</label>
                  <input
                    type="text"
                    value={formData.schoolYear}
                    onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {modalMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Assignment Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-xl font-bold">
                Assign Students to {selectedSection?.sectionName}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">

            {/* Student Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-3 gap-4">
                <CustomDropdown
                  label="Program"
                  value={studentFilters.programId}
                  onChange={(val) => setStudentFilters({ ...studentFilters, programId: val })}
                  options={[
                    { value: '', label: 'All Programs' },
                    ...programs.map(program => ({
                      value: program.id.toString(),
                      label: program.code
                    }))
                  ]}
                  searchable={true}
                />
                <CustomDropdown
                  label="Year Level"
                  value={studentFilters.yearLevel}
                  onChange={(val) => setStudentFilters({ ...studentFilters, yearLevel: val })}
                  options={[
                    { value: '', label: 'All Years' },
                    ...yearLevelOptions.map(opt => ({
                      value: opt.value.toString(),
                      label: opt.label
                    }))
                  ]}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Search</label>
                  <input
                    type="text"
                    value={studentFilters.search}
                    onChange={(e) => setStudentFilters({ ...studentFilters, search: e.target.value })}
                    placeholder="Name, email, or student #"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Student List with Checkboxes */}
            {loadingStudents ? (
              <div className="text-center py-8">Loading students...</div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No students found</div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2 border-b pb-2">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === availableStudents.length && availableStudents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">
                    Select All ({selectedStudents.length} selected)
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableStudents.map(student => (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                        student.alreadyAssigned ? 'bg-gray-100 opacity-60' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        disabled={student.alreadyAssigned}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {student.lastName}, {student.firstName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.studentNumber} | {student.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {student.programCode} - {yearLevelOptions.find(y => y.value === student.yearLevel)?.label}
                        </div>
                      </div>
                      {student.alreadyAssigned && (
                        <span className="text-xs text-gray-500">Already in section</span>
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStudents}
                disabled={selectedStudents.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Student List Modal */}
      {showStudentListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-xl font-bold">
                Students in {selectedSection?.sectionName} ({assignedStudents.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">

            {assignedStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students assigned to this section yet
              </div>
            ) : (
              <div className="space-y-2">
                {assignedStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">
                        {student.lastName}, {student.firstName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.studentNumber} | {student.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {student.programCode} - {yearLevelOptions.find(y => y.value === student.yearLevel)?.label}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6 flex-shrink-0 p-6 border-t">
              <button
                onClick={() => setShowStudentListModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.type === 'error' ? 'danger' : alertConfig.type}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setShowConfirmModal(false);
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant="danger"
      />
    </div>
    </div>
  );
};

export default ProgramSections;




