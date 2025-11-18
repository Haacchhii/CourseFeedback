import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Common Pages
import Index from './pages/common/Index'
import Login from './pages/common/Login'
import ForgotPassword from './pages/common/ForgotPassword'
import FirstTimeLogin from './pages/auth/FirstTimeLogin'
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

// Staff Pages (Secretary/Dept Head)
import StaffDashboard from './pages/staff/Dashboard'
import StaffSentimentAnalysis from './pages/staff/SentimentAnalysis'
import StaffCourses from './pages/staff/Courses'
import StaffEvaluations from './pages/staff/Evaluations'

// Student Pages
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
        <Route path="/first-time-login" element={<FirstTimeLogin/>} />

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

        {/* Staff Dashboard (Secretary/Dept Head - Same Features) - Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['secretary', 'department_head']}>
            <StaffDashboard/>
          </ProtectedRoute>
        } />
        <Route path="/sentiment" element={
          <ProtectedRoute allowedRoles={['secretary', 'department_head']}>
            <StaffSentimentAnalysis/>
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute allowedRoles={['secretary', 'department_head']}>
            <StaffCourses/>
          </ProtectedRoute>
        } />
        <Route path="/evaluations" element={
          <ProtectedRoute allowedRoles={['secretary', 'department_head']}>
            <StaffEvaluations/>
          </ProtectedRoute>
        } />

        {/* Student Pages - Protected */}
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
