import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

function SupportivePanel({ tier }) {
  const [sent, setSent] = useState(false)
  if (tier < 3) return null
  return (
    <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
      <h3 className="text-lg font-bold text-gray-900">It looks like you might be going through something difficult right now.</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        That is completely okay, and you don't have to carry it alone. A member of your institution's support team has
        been notified so they can check in with you — and we've also saved a supportive note for you below. You can
        reach out to them directly too, whenever you're ready.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={async () => {
            try {
              await api.post('/support/request', { message: '' })
              setSent(true)
            } catch {
              /* noop */
            }
          }}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {sent ? 'Request received ✓' : 'Request immediate contact'}
        </button>
        <Link to="/get-help-now" className="rounded-lg border border-brand-400 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100">
          See help options now
        </Link>
        <Link to="/resources" className="rounded-lg border border-brand-400 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100">
          Browse supportive resources
        </Link>
      </div>
      {sent && (
        <p className="mt-3 text-sm text-brand-800">
          A member of the support team has been asked to contact you. You are not alone.
        </p>
      )}
    </div>
  )
}

export default function Journal() {
  const [content, setContent] = useState('')
  const [entries, setEntries] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lastTier, setLastTier] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const { data } = await api.get('/journals')
      setEntries(data.entries)
    } catch {
      /* noop */
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { data } = await api.post('/journals', { content })
      setLastTier(data.entry.risk_tier)
      setMessage(
        data.entry.risk_tier >= 3
          ? 'Your entry has been saved, and our support team has been notified so they can check in with you.'
          : data.entry.risk_tier === 2
          ? 'Your entry has been saved. A member of the support team has been asked to review it and may reach out.'
          : 'Your entry has been saved privately.'
      )
      setContent('')
      loadEntries()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your entry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Your private journal</h1>
      <p className="mt-1 text-sm text-gray-600">Write freely. This space is yours.</p>

      <form onSubmit={handleSubmit} className="mt-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="How has your day been? What's been on your mind?"
          className="w-full rounded-xl border border-gray-300 p-4 text-sm leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs leading-relaxed text-gray-600">
          <strong>This entry is private.</strong> If it contains language that suggests you may be in crisis, our safety
          system will notify a Support Contact so they can reach out to you — see our{' '}
          <Link to="/privacy" className="font-medium text-brand-600 hover:underline">Privacy Policy</Link> for details.
        </p>

        {message && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save entry'}
        </button>
      </form>

      <SupportivePanel tier={lastTier} />

      <section className="mt-12">
        <h2 className="text-lg font-bold text-gray-900">Past entries</h2>
        {entries.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">You haven't written any entries yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {entries.map((entry) => (
              <li key={entry._id} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{entry.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                  {entry.risk_tier === 0 ? (
                    <span className="text-gray-400">No concerns detected</span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                      Flagged for support review
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
