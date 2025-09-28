import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const DepartmentStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department_id: 'all',
    year_level: 'all',
    program: 'all',
    search: ''
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        
        // Build filters for API call
        const apiFilters = {};
        if (filters.department_id !== 'all') apiFilters.department_id = filters.department_id;
        if (filters.year_level !== 'all') apiFilters.year_level = filters.year_level;
        if (filters.program !== 'all') apiFilters.program = filters.program;

        const response = await apiService.getAllStudents(apiFilters);
        
        // Apply search filter locally (or add to API later)
        let filteredStudents = response.data || [];
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredStudents = filteredStudents.filter(student => 
            student.first_name.toLowerCase().includes(searchTerm) ||
            student.last_name.toLowerCase().includes(searchTerm) ||
            student.student_number.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm)
          );
        }
        
        setStudents(filteredStudents);
      } catch (error) {
        console.error('Failed to fetch students:', error);
        // Fallback to mock data if API fails
        setStudents([
          {
            student_id: 1,
            student_number: "2021-00001",
            first_name: "Alice",
            last_name: "Johnson", 
            year_level: "3rd Year",
            program: "Computer Science",
            email: "alice.johnson@student.edu",
            evaluations_submitted: 5
        },
        {
          student_id: 2,
          student_number: "2021-00002",
          first_name: "Bob",
          last_name: "Wilson",
          year_level: "2nd Year",
          program: "Information Technology", 
          email: "bob.wilson@student.edu",
          evaluations_submitted: 3
        },
        {
          student_id: 3,
          student_number: "2021-00003",
          first_name: "Carol",
          last_name: "Davis",
          year_level: "4th Year",
          program: "Computer Science",
          email: "carol.davis@student.edu",
          evaluations_submitted: 8
        },
        {
          student_id: 4,
          student_number: "2021-00004", 
          first_name: "David",
          last_name: "Miller",
          year_level: "1st Year",
          program: "Business Administration",
          email: "david.miller@student.edu",
          evaluations_submitted: 2
        }
      ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [filters]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      student.last_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      student.student_number.includes(filters.search) ||
      student.program.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesYearLevel = filters.year_level === 'all' || student.year_level === filters.year_level;
    const matchesProgram = filters.program === 'all' || student.program === filters.program;
    
    return matchesSearch && matchesYearLevel && matchesProgram;
  });

  if (loading) return <div className="p-6">Loading students...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">All Students</h1>
            <p className="text-gray-600">Manage students across all departments</p>
          </div>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export to CSV
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add Student
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Name, ID, or program..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.year_level}
                onChange={(e) => setFilters({...filters, year_level: e.target.value})}
              >
                <option value="all">All Year Levels</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.program}
                onChange={(e) => setFilters({...filters, program: e.target.value})}
              >
                <option value="all">All Programs</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Business Administration">Business Administration</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({department_id: 'all', year_level: 'all', program: 'all', search: ''})}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Students ({filteredStudents.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.student_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.year_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.program}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.evaluations_submitted >= 5 ? 'bg-green-100 text-green-800' :
                        student.evaluations_submitted >= 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.evaluations_submitted}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        View Profile
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        View Evaluations
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentStudents;