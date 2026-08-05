import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GetHelpNow from './GetHelpNow'
import NotificationsBell from './NotificationsBell'

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-100 text-brand-800' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`

export default function Layout() {
  const { user, isLoggedIn, isCounsellor, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </span>
            <span className="text-lg font-bold text-gray-900">MoodPath</span>
          </Link>

          {isLoggedIn && (
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to="/" className={navLinkClass} end>Dashboard</NavLink>
              <NavLink to="/mood" className={navLinkClass}>Log Mood</NavLink>
              <NavLink to="/journal" className={navLinkClass}>Journal</NavLink>
              <NavLink to="/resources" className={navLinkClass}>Resources</NavLink>
              {isCounsellor && <NavLink to="/counsellor" className={navLinkClass}>Support Queue</NavLink>}
              {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="hidden text-sm text-gray-500 sm:inline">
                  Hi, {user?.name?.split(' ')[0]}
                  {user?.role !== 'user' && (
                    <span className="ml-1 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                      {user.role}
                    </span>
                  )}
                </span>
                {isLoggedIn && <NotificationsBell />}
                <Link to="/settings" className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 md:inline-block">Settings</Link>
                <button onClick={handleLogout} className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 md:inline-block">
                  Log out
                </button>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 md:hidden"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 md:inline-block">Log in</Link>
                <Link to="/register" className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 md:inline-block">Sign up</Link>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 md:hidden"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {isLoggedIn && (
                <>
                  <NavLink to="/" className={navLinkClass} end onClick={closeMenu}>Dashboard</NavLink>
                  <NavLink to="/mood" className={navLinkClass} onClick={closeMenu}>Log Mood</NavLink>
                  <NavLink to="/journal" className={navLinkClass} onClick={closeMenu}>Journal</NavLink>
                  <NavLink to="/resources" className={navLinkClass} onClick={closeMenu}>Resources</NavLink>
                  {isCounsellor && <NavLink to="/counsellor" className={navLinkClass} onClick={closeMenu}>Support Queue</NavLink>}
                  {isAdmin && <NavLink to="/admin" className={navLinkClass} onClick={closeMenu}>Admin</NavLink>}
                </>
              )}
              {!isLoggedIn && (
                <>
                  <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>Log in</NavLink>
                  <NavLink to="/register" className={navLinkClass} onClick={closeMenu}>Sign up</NavLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
          <p className="text-sm text-gray-500">
            MoodPath is a self-monitoring and early-awareness tool — it is not a diagnostic or treatment system.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
            <Link to="/get-help-now" className="text-brand-600 hover:underline">Get Help Now</Link>
          </div>
        </div>
      </footer>

      <GetHelpNow />
    </div>
  )
}
