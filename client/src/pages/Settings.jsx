import { useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, saveSession, logout } = useAuth()
  const [secret, setSecret] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [mfaToken, setMfaToken] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const startSetup = async () => {
    setError('')
    setMessage('')
    const { data } = await api.get('/auth/mfa/setup')
    setSecret(data.secret)
    setQrCode(data.qr_code)
  }

  const enableMFA = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/mfa/enable', { mfa_token: mfaToken })
      setMessage("MFA enabled. On your next login you'll need an authenticator code.")
      setSecret(null)
      setQrCode(null)
      setMfaToken('')
      saveSession(localStorage.getItem('moodpath_token'), { ...user, mfa_enabled: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Could not enable MFA.')
    } finally {
      setLoading(false)
    }
  }

  const disableMFA = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/mfa/disable', { mfa_token: mfaToken })
      setMessage('MFA disabled.')
      setMfaToken('')
      saveSession(localStorage.getItem('moodpath_token'), { ...user, mfa_enabled: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Could not disable MFA.')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    setError('')
    setMessage('')
    try {
      const { data } = await api.get('/data/export')
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `moodpath-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('Your data has been downloaded.')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not export data.')
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account and all your mood and journal data. Continue?')) return
    setError('')
    try {
      await api.delete('/data/account')
      logout()
      window.location.href = '/login'
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete account.')
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">Manage your account, security, and your data.</p>

      {message && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-bold text-gray-900">Two-factor authentication</h2>
        <p className="mt-1 text-sm text-gray-600">
          {user?.mfa_enabled ? 'MFA is currently enabled.' : 'Add an extra layer of security to your account.'}
        </p>

        {!user?.mfa_enabled && !secret && (
          <button
            onClick={startSetup}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Set up authenticator
          </button>
        )}

        {secret && qrCode && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Scan this QR code with your authenticator app (e.g. Google Authenticator):
            </p>
            <img src={qrCode} alt="QR code for authenticator app" className="mt-3 h-48 w-48" />
            <p className="mt-2 text-xs text-gray-500">
              Or enter this secret manually: <code className="rounded bg-gray-100 px-1">{secret}</code>
            </p>
            <form onSubmit={enableMFA} className="mt-3 flex gap-2">
              <input
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="6-digit code"
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Verify &amp; enable
              </button>
            </form>
          </div>
        )}

        {user?.mfa_enabled && (
          <form onSubmit={disableMFA} className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              placeholder="Current 6-digit code"
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Disable MFA
            </button>
          </form>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-bold text-gray-900">Your data</h2>
        <p className="mt-1 text-sm text-gray-600">
          You can download a copy of everything you've logged, or permanently delete your account.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={exportData}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Export my data
          </button>
          <button
            onClick={deleteAccount}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Delete my account
          </button>
        </div>
      </section>
    </div>
  )
}
