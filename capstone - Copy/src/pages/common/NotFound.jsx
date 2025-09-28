import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Link 
              to="/" 
              className="inline-block bg-[#7a0000] hover:bg-[#8f0000] text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              Go to Home
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Or try one of these links:</p>
            <div className="mt-2 space-x-4">
              <Link to="/dashboard" className="text-[#7a0000] hover:text-[#8f0000] underline">
                Dashboard
              </Link>
              <Link to="/student-evaluation" className="text-[#7a0000] hover:text-[#8f0000] underline">
                Student Evaluation
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 text-xs text-gray-400">
          <p>Course Insight Guardian - LPUB College of Computing, Arts, and Sciences</p>
        </div>
      </div>
    </div>
  )
}
