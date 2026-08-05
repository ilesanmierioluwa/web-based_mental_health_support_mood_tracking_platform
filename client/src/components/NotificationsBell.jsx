import { useState, useEffect, useRef } from 'react'
import api from '../api'

export default function NotificationsBell() {
  const [alerts, setAlerts] = useState([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  const loadAlerts = async () => {
    try {
      const { data } = await api.get('/alerts')
      setAlerts(data.alerts)
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = alerts.filter((a) => !a.read).length

  const markRead = async (id) => {
    await api.post(`/alerts/${id}/read`).catch(() => {})
    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, read: true } : a)))
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-gray-600 transition hover:bg-gray-100"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              alerts.map((a) => (
                <button
                  key={a._id}
                  onClick={() => markRead(a._id)}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-brand-50 ${
                    a.read ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-sm text-gray-700">{a.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
