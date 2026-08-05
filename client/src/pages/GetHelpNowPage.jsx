import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function GetHelpNowPage() {
  const { isLoggedIn } = useAuth()
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('') // '', 'sent', 'error'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestContact = async (e) => {
    e.preventDefault()
    setStatus('')
    setError('')
    setLoading(true)
    try {
      await api.post('/support/request', { message })
      setStatus('sent')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.error || 'Could not send your request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Get help now</h1>
      <p className="mt-2 text-gray-600">
        This page is always here for you — you don't need anything to be flagged to reach out. If you are struggling
        right now, please connect with a real person.
      </p>

      <div className="mt-8 space-y-4">
        <section className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Your campus counselling unit</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            Your institution's counselling team is the first place to go for direct, in-person support. Please confirm
            their current contact details with your institution and add them here before deployment.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Talk to someone you trust</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            A trusted friend, family member, or lecturer can help you take the next step. You don't have to face things
            alone.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Request a call-back from the support team</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            You can ask the support team to contact you directly through this platform — independent of any automatic
            detection. Your request is private, and a member of the support team will be notified to reach out to you.
          </p>
          {isLoggedIn ? (
            <form onSubmit={requestContact} className="mt-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Optional: tell us anything you'd like the support team to know…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {status === 'sent' && (
                <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  Your request has been received. A member of the support team will reach out to you.
                </p>
              )}
              {status === 'error' && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Request a call-back'}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              <Link to="/login" className="font-medium text-brand-600 hover:underline">Log in</Link> to request a
              call-back. Or you can still{' '}
              <Link to="/journal" className="font-medium text-brand-600 hover:underline">write to your journal</Link>.
            </p>
          )}
        </section>

        <p className="rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
          Note: this is an academic prototype. In a real deployment, this page must list verified, current crisis-line
          and emergency contact numbers appropriate to your institution and country. Nothing on this page is a
          substitute for emergency services when you are in immediate danger.
        </p>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Read our{' '}
        <Link to="/privacy" className="font-medium text-brand-600 hover:underline">Privacy Policy</Link> to understand
        how your data is protected and how the safety system works.
      </p>
    </div>
  )
}
