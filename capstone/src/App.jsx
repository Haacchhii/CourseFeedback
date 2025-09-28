import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'

// Landing and Login (Common Pages)
import Index from './pages/common/Index'
import Login from './pages/common/Login'
import ForgotPassword from './pages/common/ForgotPassword'
import NotFound from './pages/common/NotFound'

// Admin and Department Head Pages
import Dashboard from './pages/admin/Dashboard'
import SentimentAnalysis from './pages/admin/SentimentAnalysis'
import AnomalyDetection from './pages/admin/AnomalyDetection'
import Courses from './pages/admin/Courses'
import Evaluations from './pages/admin/Evaluations'
import EvaluationQuestions from './pages/admin/EvaluationQuestions'

// Student Pages
import StudentEvaluation from './pages/student/StudentEvaluation'
import StudentCourses from './pages/student/StudentCourses'
import EvaluateCourse from './pages/student/EvaluateCourse'

// Legacy Head Pages (keeping for backward compatibility)
import Header from './components/Header'
import HeadLayout from './pages/head/HeadLayout'
import HeadDashboard from './pages/head/HeadDashboard'
import HeadSentiment from './pages/head/HeadSentiment'
import HeadAnomalies from './pages/head/HeadAnomalies'
import HeadCourses from './pages/head/HeadCourses'
import HeadQuestions from './pages/head/HeadQuestions'
import HeadEvaluations from './pages/head/HeadEvaluations'

export default function App(){
  return (
    <Layout>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Index />} />
        
        {/* Login Pages */}
        <Route path="/login" element={<Login/>} />
        <Route path="/forgot" element={<ForgotPassword/>} />

        {/* Main Application Pages (Admin & Department Head) */}
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/sentiment" element={<SentimentAnalysis/>} />
        <Route path="/anomalies" element={<AnomalyDetection/>} />
        <Route path="/courses" element={<Courses/>} />
        <Route path="/evaluations" element={<Evaluations/>} />
        <Route path="/evaluation-questions" element={<EvaluationQuestions/>} />

        {/* Student Pages */}
        <Route path="/student-evaluation" element={<StudentEvaluation/>} />

        {/* Legacy Student Routes (backward compatibility) */}
        <Route path="/student/courses" element={
          <>
            <Header />
            <div className="pt-16">
              <StudentCourses/>
            </div>
          </>
        } />
        <Route path="/student/evaluate/:courseId" element={
          <>
            <Header />
            <div className="pt-16">
              <EvaluateCourse/>
            </div>
          </>
        } />

        {/* Legacy Head Routes (backward compatibility) */}
        <Route path="/head/login" element={<Login/>} />
        <Route path="/head" element={
          <>
            <Header />
            <div className="pt-16">
              <HeadLayout/>
            </div>
          </>
        }>
          <Route index element={<HeadDashboard/>} />
          <Route path="sentiment" element={<HeadSentiment/>} />
          <Route path="anomalies" element={<HeadAnomalies/>} />
          <Route path="courses" element={<HeadCourses/>} />
          <Route path="questions" element={<HeadQuestions/>} />
          <Route path="evaluations" element={<HeadEvaluations/>} />
        </Route>

        {/* 404 Not Found */}
        <Route path="/404" element={<NotFound/>} />
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </Layout>
  )
}
