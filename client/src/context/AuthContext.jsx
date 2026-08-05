import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moodpath_user'))
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('moodpath_token') || null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('moodpath_token')))

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
        localStorage.setItem('moodpath_user', JSON.stringify(data.user))
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [token])

  const saveSession = (t, u) => {
    localStorage.setItem('moodpath_token', t)
    localStorage.setItem('moodpath_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('moodpath_token')
    localStorage.removeItem('moodpath_user')
    setToken(null)
    setUser(null)
  }

  const isLoggedIn = Boolean(token)
  const isCounsellor = user && (user.role === 'counsellor' || user.role === 'admin')
  const isAdmin = user && user.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, loading, isLoggedIn, isCounsellor, isAdmin, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
