import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Header from './components/Header'
import StudentCourses from './pages/StudentCourses'
import EvaluateCourse from './pages/EvaluateCourse'
import HeadLayout from './pages/head/HeadLayout'
import HeadDashboard from './pages/head/HeadDashboard'
import HeadSentiment from './pages/head/HeadSentiment'
import HeadAnomalies from './pages/head/HeadAnomalies'
import HeadCourses from './pages/head/HeadCourses'
import HeadQuestions from './pages/head/HeadQuestions'
import HeadEvaluations from './pages/head/HeadEvaluations'
import ForgotPassword from './pages/ForgotPassword'

export default function App(){
  return (
    <>
      <Header />
  <div className="pt-16">
  <Routes>
  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="/login" element={<Login/>} />
  <Route path="/forgot" element={<ForgotPassword/>} />
  <Route path="/student/courses" element={<StudentCourses/>} />
      <Route path="/student/evaluate/:courseId" element={<EvaluateCourse/>} />

  <Route path="/head/login" element={<Login/>} />
      <Route path="/head" element={<HeadLayout/>}>
        <Route index element={<HeadDashboard/>} />
        <Route path="sentiment" element={<HeadSentiment/>} />
        <Route path="anomalies" element={<HeadAnomalies/>} />
        <Route path="courses" element={<HeadCourses/>} />
        <Route path="questions" element={<HeadQuestions/>} />
        <Route path="evaluations" element={<HeadEvaluations/>} />
      </Route>
  </Routes>
  </div>
    </>
  )
}
