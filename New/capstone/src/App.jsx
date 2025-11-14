import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Common Pages
import Index from './pages/common/Index'
import Login from './pages/common/Login'
import ForgotPassword from './pages/common/ForgotPassword'
import NotFound from './pages/common/NotFound'

// Admin Pages (System Administration)
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import EvaluationPeriodManagement from './pages/admin/EvaluationPeriodManagement'
import EnhancedCourseManagement from './pages/admin/EnhancedCourseManagement'
import SystemSettings from './pages/admin/SystemSettings'
import AuditLogViewer from './pages/admin/AuditLogViewer'
import DataExportCenter from './pages/admin/DataExportCenter'
import EmailNotifications from './pages/admin/EmailNotifications'

// Staff Pages (Secretary/Dept Head/Instructor)
import StaffDashboard from './pages/staff/Dashboard'
import StaffSentimentAnalysis from './pages/staff/SentimentAnalysis'
import StaffAnomalyDetection from './pages/staff/AnomalyDetection'
import StaffCourses from './pages/staff/Courses'
import StaffEvaluations from './pages/staff/Evaluations'
import StaffEvaluationQuestions from './pages/staff/EvaluationQuestions'

// Student Pages
import StudentEvaluation from './pages/student/StudentEvaluation'
import StudentCourses from './pages/student/StudentCourses'
import EvaluateCourse from './pages/student/EvaluateCourse'

export default function App(){
  return (
    <Layout>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Index />} />
        
        {/* Login Pages */}
        <Route path="/login" element={<Login/>} />
        <Route path="/forgot" element={<ForgotPassword/>} />

        {/* Admin Dashboard (Full Control) - Protected */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard/>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement/>
          </ProtectedRoute>
        } />
        <Route path="/admin/periods" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EvaluationPeriodManagement/>
          </ProtectedRoute>
        } />
        <Route path="/admin/courses" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EnhancedCourseManagement/>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SystemSettings/>
          </ProtectedRoute>
        } />
        <Route path="/admin/export" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DataExportCenter/>
          </ProtectedRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogViewer/>
          </ProtectedRoute>
        } />
        <Route path="/admin/emails" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EmailNotifications/>
          </ProtectedRoute>
        } />

        {/* Staff Dashboard (Secretary/Dept Head/Instructor - Same Features) - Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['secretary', 'instructor', 'department_head']}>
            <StaffDashboard/>
          </ProtectedRoute>
        } />
        <Route path="/sentiment" element={
          <ProtectedRoute allowedRoles={['secretary', 'instructor', 'department_head']}>
            <StaffSentimentAnalysis/>
          </ProtectedRoute>
        } />
        <Route path="/anomalies" element={
          <ProtectedRoute allowedRoles={['secretary', 'instructor', 'department_head']}>
            <StaffAnomalyDetection/>
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute allowedRoles={['secretary', 'instructor', 'department_head']}>
            <StaffCourses/>
          </ProtectedRoute>
        } />
        <Route path="/evaluations" element={
          <ProtectedRoute allowedRoles={['secretary', 'instructor', 'department_head']}>
            <StaffEvaluations/>
          </ProtectedRoute>
        } />
        <Route path="/evaluation-questions" element={
          <ProtectedRoute allowedRoles={['secretary', 'instructor', 'department_head']}>
            <StaffEvaluationQuestions/>
          </ProtectedRoute>
        } />

        {/* Student Pages - Protected */}
        <Route path="/student-evaluation" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentEvaluation/>
          </ProtectedRoute>
        } />
        <Route path="/student/courses" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentCourses/>
          </ProtectedRoute>
        } />
        <Route path="/student/evaluate/:courseId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <EvaluateCourse/>
          </ProtectedRoute>
        } />

        {/* 404 Not Found */}
        <Route path="/404" element={<NotFound/>} />
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </Layout>
  )
}
