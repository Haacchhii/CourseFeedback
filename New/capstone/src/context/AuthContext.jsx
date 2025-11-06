import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('currentUser')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Auto-logout on token expiry
  useEffect(() => {
    if (!token) return

    try {
      // Decode JWT to check expiry (basic decode without verification)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = payload.exp * 1000 // Convert to milliseconds
      const timeUntilExpiry = expiryTime - Date.now()

      if (timeUntilExpiry <= 0) {
        // Token already expired
        logout()
        return
      }

      // Set timeout to auto-logout when token expires
      const timeoutId = setTimeout(() => {
        logout()
        alert('Your session has expired. Please log in again.')
      }, timeUntilExpiry)

      return () => clearTimeout(timeoutId)
    } catch (error) {
      console.error('Error checking token expiry:', error)
    }
  }, [token])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('currentUser', JSON.stringify(userData))
    localStorage.setItem('role', userData.role)
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('role')
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const hasRole = (roles) => {
    if (!user) return false
    if (Array.isArray(roles)) {
      return roles.includes(user.role)
    }
    return user.role === roles
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
