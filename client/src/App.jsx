import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MoodLog from './pages/MoodLog'
import Journal from './pages/Journal'
import Resources from './pages/Resources'
import GetHelpNowPage from './pages/GetHelpNowPage'
import Privacy from './pages/Privacy'
import Settings from './pages/Settings'
import CounsellorDashboard from './pages/CounsellorDashboard'
import AdminPanel from './pages/AdminPanel'

function Protected({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading…</div>
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RoleRoute({ roles, children }) {
  const { user, isLoggedIn, loading } = useAuth()
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading…</div>
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RootRedirect() {
  const { user, isLoggedIn, loading } = useAuth()
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading…</div>
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'counsellor') return <Navigate to="/counsellor" replace />
  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<Layout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/get-help-now" element={<GetHelpNowPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/mood" element={<Protected><MoodLog /></Protected>} />
            <Route path="/journal" element={<Protected><Journal /></Protected>} />
            <Route path="/resources" element={<Protected><Resources /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/counsellor" element={<RoleRoute roles={['counsellor', 'admin']}><CounsellorDashboard /></RoleRoute>} />
            <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminPanel /></RoleRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
