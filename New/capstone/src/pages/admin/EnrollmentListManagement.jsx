import { useState, useEffect, useMemo } from 'react';
import { Upload, Search, Filter, Users, TrendingUp, AlertCircle, CheckCircle, X, Download, FileText, Eye } from 'lucide-react';
import { adminAPI, apiClient } from '../../services/api';
import { AlertModal } from '../../components/Modal';
import Pagination from '../../components/Pagination';

const EnrollmentListManagement = () => {
  const [enrollmentList, setEnrollmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    program_id: '',
    year_level: '',
    status: 'active'
  });
  const [stats, setStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [colleges, setColleges] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // CSV Preview State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);

  // Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  // Modal Helper Function
  const showAlert = (message, title = 'Notification', type = 'info') => {
    setAlertConfig({ title, message, type });
    setShowAlertModal(true);
  };
  
  // Pagination calculations
  const totalPages = Math.ceil(enrollmentList.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return enrollmentList.slice(startIndex, startIndex + itemsPerPage);
  }, [enrollmentList, currentPage, itemsPerPage]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [enrollmentList]);

  useEffect(() => {
    fetchPrograms();
    fetchEnrollmentList();
    fetchStats();
  }, []);

  // Refresh when filters change
  useEffect(() => {
    fetchEnrollmentList();
  }, [filters]);

  const fetchPrograms = async () => {
    try {
      const response = await adminAPI.getPrograms();
      setPrograms(response.data || response);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchEnrollmentList = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (filters.program_id) params.append('program_id', filters.program_id);
      if (filters.year_level) params.append('year_level', filters.year_level);
      if (filters.status) params.append('status', filters.status);

      // Add cache buster to force fresh data
      params.append('_t', Date.now());

      const response = await apiClient.get(`/admin/enrollment-list/search?${params.toString()}`);
      // Handle different response formats
      const data = response?.data || response;
      const enrollments = Array.isArray(data) ? data : [];
      console.log('[EnrollmentList] Fetched enrollments:', enrollments.length);
      setEnrollmentList(enrollments);
    } catch (err) {
      setError('Failed to fetch enrollment list. Please try again.');
      console.error('Error fetching enrollment list:', err);
      setEnrollmentList([]); // Clear list on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Add cache buster to force fresh data
      const response = await apiClient.get(`/admin/enrollment-list/stats?_t=${Date.now()}`);
      console.log('[EnrollmentList] Fetched stats:', response);
      setStats(response);
      
      // Extract unique colleges from stats for dynamic filtering
      if (response?.by_college) {
        const collegeList = Object.keys(response.by_college).map(code => ({
          code: code,
          name: code // Backend provides code, can be enhanced later
        }));
        setColleges(collegeList);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Reset stats on error
      setStats({ total_students: 0, by_status: {}, by_program: {}, by_year: {} });
    }
  };

  const handleSearch = () => {
    fetchEnrollmentList();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchEnrollmentList();
  };

  const handleClearFilters = () => {
    setFilters({
      program_id: '',
      year_level: '',
      status: 'active'
    });
    setSearchQuery('');
    setTimeout(() => fetchEnrollmentList(), 100);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setCsvErrors([]);
    setCsvPreview([]);

    // Parse CSV for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          setCsvErrors(['CSV file is empty or has no data rows']);
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['student_number', 'first_name', 'last_name', 'program_code', 'year_level'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setCsvErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
          return;
        }

        // Parse data rows (preview first 10)
        const preview = [];
        const errors = [];

        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          // Validate row
          const rowErrors = [];
          if (!row.student_number) rowErrors.push('Missing student number');
          if (!row.first_name) rowErrors.push('Missing first name');
          if (!row.last_name) rowErrors.push('Missing last name');
          if (!row.program_code) rowErrors.push('Missing program code');
          if (!row.year_level || ![1, 2, 3, 4, '1', '2', '3', '4'].includes(row.year_level)) {
            rowErrors.push('Invalid year level (must be 1-4)');
          }

          if (rowErrors.length > 0) {
            errors.push({ row: i, errors: rowErrors, data: row });
          }

          preview.push({ ...row, rowNumber: i, hasErrors: rowErrors.length > 0 });
        }

        setCsvPreview(preview);
        setCsvErrors(errors);
        setShowPreviewModal(true);
      } catch (err) {
        setCsvErrors([`Failed to parse CSV: ${err.message}`]);
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmUpload = async () => {
    if (!csvFile) return;

    setUploading(true);
    setUploadResult(null);
    setError(null);
    setShowPreviewModal(false);

    try {
      const response = await adminAPI.uploadEnrollmentList(csvFile);
      setUploadResult(response);
      
      // Show success modal
      const successCount = response?.success_count || response?.created || 0;
      const updatedCount = response?.updated_count || response?.updated || 0;
      const totalProcessed = successCount + updatedCount;
      
      showAlert(
        `Successfully processed ${totalProcessed} student(s)\n• Created: ${successCount}\n• Updated: ${updatedCount}`,
        'Upload Successful',
        'success'
      );
      
      fetchEnrollmentList();
      fetchStats();
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
    } catch (err) {
      showAlert(
        err.response?.data?.detail || err.message || 'Failed to upload file. Please check the format and try again.',
        'Upload Failed',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    // Generate sample using actual program codes from the system
    const samplePrograms = programs.slice(0, 3).map(p => p.code || p.program_code).filter(Boolean);
    const programCodes = samplePrograms.length > 0 ? samplePrograms : ['PROGRAM1', 'PROGRAM2', 'PROGRAM3'];
    
    const csvContent = `student_number,first_name,last_name,middle_name,program_code,year_level
2024-00001,Juan,Dela Cruz,Santos,${programCodes[0]},1
2024-00002,Maria,Santos,Lopez,${programCodes[1] || programCodes[0]},2
2024-00003,Pedro,Garcia,Martinez,${programCodes[2] || programCodes[0]},3`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_enrollment_list.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="lpu-header">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/lpu-logo.png" 
                alt="University Logo" 
                className="w-32 h-32 object-contain"
              />
              <div>
                <h1 className="lpu-header-title text-3xl">📋 Enrollment List Management</h1>
                <p className="lpu-header-subtitle text-lg">Manage official enrollment records and student assignments</p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchEnrollmentList();
                fetchStats();
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white rounded-card hover:from-[#9a1000] hover:to-[#7a0000] shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-6 sm:px-8 lg:px-10 py-10 lg:py-12 max-w-screen-2xl">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 lg:mb-8 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-card flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 rounded-full p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className="mb-6 lg:mb-8 bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-card shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6" />
              <span className="font-bold text-lg">Upload Successful!</span>
              <button onClick={() => setUploadResult(null)} className="ml-auto hover:bg-green-100 rounded-full p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm space-y-1">
              <p>✅ Successfully imported/updated: {uploadResult.successful}</p>
              {uploadResult.skipped > 0 && <p>⚠️ Skipped: {uploadResult.skipped}</p>}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc list-inside">
                    {uploadResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {uploadResult.errors.length > 5 && (
                      <li>... and {uploadResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 lg:mb-12">
            <div className="bg-white rounded-card shadow-card p-6 lg:p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[#7a0000] mt-2">{stats.total_students || 0}</p>
                </div>
                <Users className="w-10 h-10 text-[#7a0000]" />
              </div>
            </div>
            <div className="bg-white rounded-card shadow-card p-6 lg:p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[#7a0000] mt-2">{stats.by_status?.active || 0}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-[#7a0000]" />
              </div>
            </div>
            <div className="bg-white rounded-card shadow-card p-6 lg:p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Programs</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[#7a0000] mt-2">{Object.keys(stats.by_program || {}).length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-[#7a0000]" />
              </div>
            </div>
            <div className="bg-white rounded-card shadow-card p-6 lg:p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Year Levels</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[#7a0000] mt-2">{Object.keys(stats.by_year || {}).length}</p>
                </div>
                <Filter className="w-10 h-10 text-[#7a0000]" />
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-card shadow-card mb-8 lg:mb-12">
          <div className="p-6 lg:p-8 border-b border-gray-200">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Bulk Upload
            </h2>
          </div>
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                  id="csv-upload"
                />
                <div className="flex items-center gap-3 cursor-pointer">
                  <button
                    onClick={() => document.getElementById('csv-upload').click()}
                    disabled={uploading}
                    className="px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white rounded-card hover:from-[#9a1000] hover:to-[#7a0000] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transition-all font-medium"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload CSV
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    Upload enrollment records in CSV format
                  </span>
                </div>
              </label>
              <button
                onClick={downloadSampleCSV}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-card hover:from-gray-200 hover:to-gray-300 flex items-center gap-2 shadow-sm hover:shadow-md transition-all font-medium"
              >
                <Download className="w-5 h-5" />
                Download Sample
              </button>
            </div>
            <div className="mt-6 p-4 lg:p-6 bg-red-50 rounded-card border-2 border-red-200">
              <p className="font-bold text-base text-[#7a0000] mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                CSV Format Requirements:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-[#9a1000]">
                <li><strong>Required columns:</strong> student_number, first_name, last_name, middle_name, email, program_code, year_level, college_code, college_name</li>
                <li><strong>Program codes:</strong> Must exist in the system {programs.length > 0 && `(${programs.slice(0, 5).map(p => p.code || p.program_code).join(', ')}${programs.length > 5 ? ', etc.' : ''})`}</li>
                <li><strong>Year level:</strong> Must be between 1 and 4</li>
                <li><strong>Behavior:</strong> Existing student records will be updated, new records will be inserted</li>
                <li><strong>Email:</strong> Must be valid format (optional but recommended)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-card shadow-card mb-8 lg:mb-12">
          <div className="p-6 lg:p-8 border-b border-gray-200">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Search className="w-6 h-6" />
              Search & Filter
            </h2>
          </div>
          <div className="p-6 lg:p-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by student number, name, or email..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000] text-base"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white rounded-card hover:from-[#9a1000] hover:to-[#7a0000] shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Program</label>
                <select
                  value={filters.program_id}
                  onChange={(e) => handleFilterChange('program_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000] text-base"
                >
                  <option value="">All Programs</option>
                  {programs.length > 0 ? (
                    programs.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.code || program.program_code} - {program.name || program.program_name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading programs...</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year Level</label>
                <select
                  value={filters.year_level}
                  onChange={(e) => handleFilterChange('year_level', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000] text-base"
                >
                  <option value="">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-[#7a0000] focus:border-[#7a0000] text-base"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleApplyFilters}
                className="px-6 py-3 bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white rounded-card hover:from-[#9a1000] hover:to-[#7a0000] shadow-md hover:shadow-lg transition-all font-medium flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-card hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md transition-all font-medium flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enrollment List Table */}
        <div className="bg-white rounded-card shadow-card">
          <div className="p-6 lg:p-8 border-b border-gray-200">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Enrolled Students ({enrollmentList.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#7a0000] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : enrollmentList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No enrollment records found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                      Student Number
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                      Year Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedList.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.first_name} {student.middle_name ? student.middle_name + ' ' : ''}{student.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{student.program_code}</div>
                          <div className="text-xs text-gray-500">{student.program_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Year {student.year_level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination Controls */}
          {enrollmentList.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={enrollmentList.length}
              onPageChange={setCurrentPage}
              itemLabel="students"
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              showItemsPerPage={true}
            />
          )}
        </div>
      </div>

      {/* CSV Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">CSV Preview</h2>
                  <p className="text-sm text-white/80">{csvFile?.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setCsvFile(null);
                  setCsvPreview([]);
                  setCsvErrors([]);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Errors Section */}
              {csvErrors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-900 mb-2">Validation Errors Found</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {csvErrors.slice(0, 10).map((err, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-red-800">
                            <span className="font-bold">Row {err.row}:</span>
                            <span>{err.errors.join(', ')}</span>
                          </div>
                        ))}
                        {csvErrors.length > 10 && (
                          <p className="text-sm text-red-700 font-bold text-center py-2 bg-red-100 rounded">
                            + {csvErrors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Data Preview</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      Showing first {csvPreview.length} rows
                    </span>
                  </div>
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Student #</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Program</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Year</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {csvPreview.map((row, idx) => (
                            <tr key={idx} className={row.hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'}>
                              <td className="px-4 py-3">
                                {row.hasErrors ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                    <X className="w-3 h-3 mr-1" />
                                    Error
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Valid
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.student_number}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {row.last_name}, {row.first_name} {row.middle_name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{row.program_code}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">Year {row.year_level}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              {csvErrors.length === 0 && csvPreview.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-green-900">Ready to Upload</h3>
                      <p className="text-sm text-green-800 mt-1">
                        All rows passed validation. Click "Confirm Upload" to import the students.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setCsvFile(null);
                  setCsvPreview([]);
                  setCsvErrors([]);
                }}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-all"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading || csvErrors.length > 0 || csvPreview.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white rounded-lg font-semibold hover:from-[#9a1000] hover:to-[#7a0000] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Confirm Upload</span>
                  </>
                )}
              </button>
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
    </div>
  );
};

export default EnrollmentListManagement;
