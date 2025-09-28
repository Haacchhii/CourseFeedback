import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

// Test endpoints
const tests = [
  { name: 'Health Check', fn: () => apiService.healthCheck() },
  { name: 'Database Status', fn: () => fetch('http://127.0.0.1:8000/api/admin/database-status').then(r => r.json()) },
  { name: 'Department Overview', fn: () => apiService.getDepartmentOverview() },
  { name: 'All Departments', fn: () => apiService.getAllDepartments() },
  { name: 'All Students', fn: () => apiService.getAllStudents() },
  { name: 'All Instructors', fn: () => apiService.getAllInstructors() },
  { name: 'All Evaluations', fn: () => apiService.getAllEvaluations() },
];

const ApiTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = [];

    // Test all endpoints
    const tests = [
      { name: 'Health Check', fn: () => apiService.healthCheck() },
      { name: 'Database Status', fn: () => fetch('http://127.0.0.1:8000/api/admin/database-status').then(r => r.json()) },
      { name: 'Department Overview', fn: () => apiService.getDepartmentOverview() },
      { name: 'All Departments', fn: () => apiService.getAllDepartments() },
      { name: 'All Students', fn: () => apiService.getAllStudents() },
      { name: 'All Instructors', fn: () => apiService.getAllInstructors() },
      { name: 'All Evaluations', fn: () => apiService.getAllEvaluations() },
    ];

    for (const test of tests) {
      try {
        const result = await test.fn();
        results.push({
          name: test.name,
          status: 'SUCCESS',
          data: result,
          error: null
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'ERROR',
          data: null,
          error: error.message
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Frontend-Backend API Connection Test
        </h1>
        <p className="text-gray-600">
          Testing connection between React frontend and FastAPI backend
        </p>
        <button
          onClick={runTests}
          disabled={loading}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Tests Again'}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              result.status === 'SUCCESS'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{result.name}</h3>
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  result.status === 'SUCCESS'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.status}
              </span>
            </div>
            
            {result.error && (
              <p className="text-red-600 text-sm mb-2">
                Error: {result.error}
              </p>
            )}
            
            {result.data && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p className="font-medium text-gray-700 mb-1">Response Data:</p>
                <pre className="text-gray-600 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2).slice(0, 300)}
                  {JSON.stringify(result.data, null, 2).length > 300 ? '...' : ''}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {testResults.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
          <p className="text-blue-700">
            {testResults.filter(r => r.status === 'SUCCESS').length} of {testResults.length} tests passed
          </p>
          {testResults.every(r => r.status === 'SUCCESS') && (
            <p className="text-green-700 font-medium mt-2">
              🎉 All API endpoints are working correctly!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiTest;