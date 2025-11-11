import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Index(){
  const nav = useNavigate()
  const { isAuthenticated } = useAuth()

  // Redirect authenticated users
  React.useEffect(() => {
    if (isAuthenticated()) {
      const user = JSON.parse(localStorage.getItem('currentUser'))
      if (user) {
        if (user.role === 'admin') {
          nav('/admin/dashboard')
        } else if (user.role === 'student') {
          nav('/student/courses')
        } else {
          nav('/dashboard')
        }
      }
    }
  }, [isAuthenticated, nav])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#7a0000] text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Course Insight Guardian</h1>
            <p className="text-sm opacity-90">LPUB - College of Computing, Arts, and Sciences</p>
          </div>
          <button
            onClick={() => nav('/login')}
            className="bg-white text-[#7a0000] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">
              Course Insight Guardian
            </h2>
            <p className="text-2xl text-gray-600 mb-8">
              Advanced Course Evaluation System with AI-Powered Analytics
            </p>
            <button
              onClick={() => nav('/login')}
              className="bg-[#7a0000] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#5a0000] transition-colors shadow-lg"
            >
              Get Started →
            </button>
          </div>

          {/* Features */}
          <div className="space-y-6 mb-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-[#7a0000] mb-3">
                🤖 SVM Sentiment Analysis
              </h3>
              <p className="text-gray-600 text-lg">
                Advanced sentiment analysis using Support Vector Machine algorithms to understand 
                student feedback and evaluate course satisfaction levels automatically.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-[#7a0000] mb-3">
                📊 DBSCAN Anomaly Detection
              </h3>
              <p className="text-gray-600 text-lg">
                Density-based clustering algorithm to identify unusual patterns in evaluation 
                data, helping detect potential issues in course delivery and student satisfaction.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-[#7a0000] mb-3">
                📈 Real-time Analytics
              </h3>
              <p className="text-gray-600 text-lg">
                Comprehensive dashboards and reporting tools for administrators and department 
                heads to monitor course performance and student feedback trends.
              </p>
            </div>
          </div>

          {/* Access Levels */}
          <div className="bg-[#7a0000] text-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4">Access Levels</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">👨‍🎓 Students</h4>
                <p className="text-sm opacity-90">Course evaluation interface and feedback submission</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">👔 Staff</h4>
                <p className="text-sm opacity-90">Department analytics, reports, and insights</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">⚙️ Administrators</h4>
                <p className="text-sm opacity-90">System-wide access and controls</p>
              </div>
            </div>
          </div>

          {/* University Branding */}
          <div className="text-center mt-12 p-8 bg-white rounded-lg shadow-md">
            <h4 className="text-2xl font-bold text-gray-800 mb-2">
              Lyceum of the Philippines University - Batangas
            </h4>
            <p className="text-lg text-gray-600 mb-2">
              College of Computing, Arts, and Sciences
            </p>
            <p className="text-sm text-gray-500">
              Empowering education through technology and innovation
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6 mt-12">
        <p className="text-sm">
          © 2025 Lyceum of the Philippines University - Batangas. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
