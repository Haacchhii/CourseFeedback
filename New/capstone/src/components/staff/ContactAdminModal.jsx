import React, { useState } from 'react';
import { adminAPI, secretaryAPI, deptHeadAPI } from '../../services/api';

const ContactAdminModal = ({ isOpen, onClose, prefilledCourse = null, prefilledStudent = null }) => {
  const [formData, setFormData] = useState({
    issueType: 'general',
    courseId: prefilledCourse?.id || '',
    courseName: prefilledCourse?.name || '',
    studentId: prefilledStudent?.id || '',
    studentName: prefilledStudent?.name || '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const issueTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'evaluation', label: 'Evaluation Problem' },
    { value: 'course', label: 'Course Data Issue' },
    { value: 'student', label: 'Student Account Issue' },
    { value: 'report', label: 'Report/Analytics Issue' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    // Validation
    if (!formData.subject.trim() || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Subject and message are required'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Get user role from localStorage
      const userRole = localStorage.getItem('userRole');
      
      let api;
      if (userRole === 'admin' || userRole === 'system_admin') {
        api = adminAPI;
      } else if (userRole === 'secretary') {
        api = secretaryAPI;
      } else if (userRole === 'department_head') {
        api = deptHeadAPI;
      }

      // Send the support request
      const response = await api.submitSupportRequest(formData);

      setSubmitStatus({
        type: 'success',
        message: 'Your message has been sent to the system administrator successfully.'
      });

      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setFormData({
          issueType: 'general',
          courseId: '',
          courseName: '',
          studentId: '',
          studentName: '',
          subject: '',
          message: ''
        });
        setSubmitStatus({ type: '', message: '' });
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting support request:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to send message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <h2 className="text-xl font-bold text-gray-800">Contact System Administrator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Issue Type */}
          <div>
            <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type *
            </label>
            <select
              id="issueType"
              name="issueType"
              value={formData.issueType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              {issueTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Course Information (Optional) */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="courseName" className="block text-sm font-medium text-gray-700 mb-2">
                Course Name (Optional)
              </label>
              <input
                type="text"
                id="courseName"
                name="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to Programming"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                Course ID (Optional)
              </label>
              <input
                type="text"
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                placeholder="e.g., CS101"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Student Information (Optional) */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                Student Name (Optional)
              </label>
              <input
                type="text"
                id="studentName"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                placeholder="e.g., Juan Dela Cruz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                Student ID (Optional)
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="e.g., 2024-00001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Please provide detailed information about your issue or inquiry..."
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              required
              disabled={isSubmitting}
            />
            <p className="mt-2 text-sm text-gray-500">
              {formData.message.length} characters
            </p>
          </div>

          {/* Status Message */}
          {submitStatus.message && (
            <div className={`p-4 rounded-lg ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {submitStatus.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )}
                <p className={`text-sm ${
                  submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {submitStatus.message}
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactAdminModal;
