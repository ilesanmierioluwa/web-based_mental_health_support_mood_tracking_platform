import { useState, useEffect } from 'react'
import api from '../api'

const STATUS_LABELS = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  contacted: 'Contacted user',
  resolved: 'Resolved',
}

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
}

export default function CounsellorDashboard() {
  const [tab, setTab] = useState('escalations')
  const [escalations, setEscalations] = useState([])
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState([])
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/counsellor/escalations')
      setEscalations(data.escalations)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  const openEscalation = async (id) => {
    setError('')
    setSelected(null)
    setNewStatus('')
    setNote('')
    try {
      const [detail, notesRes] = await Promise.all([
        api.get(`/counsellor/escalations/${id}`),
        api.get(`/counsellor/escalations/${id}/notes`),
      ])
      setSelected(detail.data.escalation)
      setNotes(notesRes.data.notes)
      setNewStatus(detail.data.escalation.status)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not open escalation.')
    }
  }

  const updateStatus = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/counsellor/escalations/${selected._id}/status`, {
        status: newStatus,
        note: note.trim() ? note : undefined,
      })
      setNote('')
      await openEscalation(selected._id)
      await loadQueue()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update status.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Support queue</h1>
      <p className="mt-1 text-sm text-gray-600">
        Entries flagged for follow-up, and users who have asked to be contacted. You can see only the specific
        escalated entry — not a user's full journal.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab('escalations')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'escalations' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-brand-100'}`}
        >
          Escalations
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'requests' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-brand-100'}`}
        >
          Call-back requests
        </button>
      </div>

      {tab === 'requests' ? (
        <SupportRequests />
      ) : (
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <h2 className="font-bold text-gray-900">Escalated entries</h2>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading…</p>
          ) : escalations.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No escalated entries right now.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {escalations.map((esc) => (
                <li key={esc._id}>
                  <button
                    onClick={() => openEscalation(esc._id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                      selected?._id === esc._id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${esc.tier === 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          Tier {esc.tier}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{esc.user?.name || 'User'}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {esc.matched_category?.replace(/_/g, ' ')} · {new Date(esc.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[esc.status]}`}>
                      {STATUS_LABELS[esc.status]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          {!selected ? (
            <p className="text-sm text-gray-500">Select an entry to review it. Only that specific entry's content will be shown.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Entry details</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                User: {selected.user?.name} ({selected.user?.email}) · Logged {new Date(selected.entry.created_at).toLocaleString()}
              </p>
              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{selected.entry.content}</p>
              </div>

              <form onSubmit={updateStatus} className="mt-5 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mark status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Private note about follow-up…"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Save status
                </button>
              </form>

              {notes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900">Follow-up notes</h3>
                  <ul className="mt-2 space-y-2">
                    {notes.map((n) => (
                      <li key={n._id} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-sm text-gray-700">{n.note}</p>
                        <p className="mt-1 text-xs text-gray-500">{n.counsellor_name} · {new Date(n.created_at).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      )}
    </div>
  )
}

function SupportRequests() {
  const [requests, setRequests] = useState([])
  const [statusChanges, setStatusChanges] = useState({})

  const load = async () => {
    try {
      const { data } = await api.get('/counsellor/support-requests')
      setRequests(data.requests)
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = async (id, status) => {
    try {
      await api.post(`/counsellor/support-requests/${id}/status`, { status })
      setStatusChanges((prev) => ({ ...prev, [id]: status }))
      load()
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="font-bold text-gray-900">Users who asked to be contacted</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          These are user-initiated requests, independent of automatic risk detection.
        </p>
      </div>
      {requests.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">No call-back requests right now.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {requests.map((r) => (
            <li key={r._id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{r.user?.email} · {new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                  <select
                    value={statusChanges[r._id] || r.status}
                    onChange={(e) => update(r._id, e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {r.message && (
                <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  "{r.message}"
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
