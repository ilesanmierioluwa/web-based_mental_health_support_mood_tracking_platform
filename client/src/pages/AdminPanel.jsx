import { useState, useEffect } from 'react'
import api from '../api'

const CATEGORIES = ['anxiety', 'low_mood', 'stress', 'sleep', 'grounding', 'crisis_support']

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

export default function AdminPanel() {
  const [tab, setTab] = useState('keywords')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Admin panel</h1>
      <p className="mt-1 text-sm text-gray-600">Manage the risk-keyword list, resources, support accounts, and audit logs.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <TabButton active={tab === 'keywords'} onClick={() => setTab('keywords')}>Risk keywords</TabButton>
        <TabButton active={tab === 'resources'} onClick={() => setTab('resources')}>Resources</TabButton>
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>Support accounts</TabButton>
        <TabButton active={tab === 'audit'} onClick={() => setTab('audit')}>Audit log</TabButton>
      </div>

      <div className="mt-6">
        {tab === 'keywords' && <KeywordsTab />}
        {tab === 'resources' && <ResourcesTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}

// ---- Risk keywords tab ------------------------------------------------------

function KeywordsTab() {
  const [keywords, setKeywords] = useState([])
  const [history, setHistory] = useState([])
  const [phrase, setPhrase] = useState('')
  const [tier, setTier] = useState('1')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const [kw, hist] = await Promise.all([api.get('/admin/keywords'), api.get('/admin/keywords/history')])
    setKeywords(kw.data.keywords)
    setHistory(hist.data.history)
  }

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const addKeyword = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.post('/admin/keywords', { phrase_or_pattern: phrase, tier: Number(tier) })
      setPhrase('')
      setMessage('Keyword added. This change is recorded in the version history.')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add keyword.')
    }
  }

  const removeKeyword = async (id) => {
    if (!window.confirm('Deactivate this keyword? Its removal will be recorded in the version history.')) return
    try {
      await api.delete(`/admin/keywords/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove keyword.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Add a risk keyword</h2>
        <p className="mt-1 text-xs text-gray-500">
          Academic demo note: this sensitive list must be reviewed and maintained by qualified mental health
          professionals before real deployment.
        </p>
        <form onSubmit={addKeyword} className="mt-4 space-y-3">
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Phrase (e.g. feeling trapped)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="1">Tier 1 — general distress</option>
            <option value="2">Tier 2 — hopelessness</option>
            <option value="3">Tier 3 — highest concern</option>
          </select>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
            Add keyword
          </button>
        </form>

        <h3 className="mt-6 font-bold text-gray-900">Current keywords</h3>
        <ul className="mt-2 divide-y divide-gray-100">
          {keywords.map((k) => (
            <li key={k._id} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">
                <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-semibold ${k.tier === 3 ? 'bg-red-100 text-red-700' : k.tier === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  T{k.tier}
                </span>
                {k.phrase_or_pattern}
              </span>
              {k.is_active ? (
                <button onClick={() => removeKeyword(k._id)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              ) : (
                <span className="text-xs text-gray-400">Inactive</span>
              )}
            </li>
          ))}
        </ul>
        {message && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Version history</h2>
        <p className="mt-1 text-xs text-gray-500">Every change to this sensitive list is audited.</p>
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
          {history.length === 0 && <p className="text-sm text-gray-500">No changes recorded yet.</p>}
          {history.map((h) => (
            <li key={h._id} className="rounded-lg bg-gray-50 p-3 text-sm">
              <span className={`font-medium ${h.action === 'removed' ? 'text-red-600' : h.action === 'added' ? 'text-green-700' : 'text-blue-700'}`}>
                {h.action}
              </span>{' '}
              <span className="text-gray-700">"{h.phrase_or_pattern}"</span>
              <span className="ml-1 text-xs text-gray-500">(T{h.tier})</span>
              <p className="mt-0.5 text-xs text-gray-500">by {h.changed_by} · {new Date(h.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ---- Resources tab ----------------------------------------------------------

function ResourcesTab() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', category: 'stress', body: '', tags_for_matching: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await api.get('/resources/admin')
    setItems(data.items)
  }

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const tags = form.tags_for_matching.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    try {
      await api.post('/resources/admin', { ...form, tags_for_matching: tags })
      setForm({ title: '', category: 'stress', body: '', tags_for_matching: '' })
      setMessage('Resource added.')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add resource.')
    }
  }

  const toggleActive = async (item) => {
    await api.put(`/resources/admin/${item._id}`, { is_active: !item.is_active })
    load()
  }

  const remove = async (item) => {
    if (!window.confirm('Delete this resource?')) return
    await api.delete(`/resources/admin/${item._id}`)
    load()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Add a resource</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Body text (write your own original content)"
            rows={4}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <input
            type="text"
            value={form.tags_for_matching}
            onChange={(e) => setForm({ ...form, tags_for_matching: e.target.value })}
            placeholder="Matching tags (comma separated, e.g. stress, exams)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
            Add resource
          </button>
        </form>
        {message && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Resource library</h2>
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li key={item._id} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.title}{' '}
                  {!item.is_active && <span className="text-xs text-gray-400">(inactive)</span>}
                </p>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => toggleActive(item)} className="text-xs font-medium text-brand-600 hover:underline">
                  {item.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => remove(item)} className="text-xs font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ---- Users tab --------------------------------------------------------------

function UsersTab() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'counsellor' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await api.get('/admin/users')
    setUsers(data.users)
  }

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.post('/admin/users', form)
      setForm({ name: '', email: '', password: '', role: 'counsellor' })
      setMessage('Support account created.')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create account.')
    }
  }

  const changeRole = async (user, role) => {
    await api.put(`/admin/users/${user._id}`, { role })
    load()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Create a support account</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Temporary password (min 8 chars)"
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="counsellor">Counsellor</option>
            <option value="admin">Administrator</option>
          </select>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
            Create account
          </button>
        </form>
        {message && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold text-gray-900">Accounts</h2>
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
          {users.map((u) => (
            <li key={u._id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={(e) => changeRole(u, e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="user">User</option>
                <option value="counsellor">Counsellor</option>
                <option value="admin">Admin</option>
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ---- Audit tab --------------------------------------------------------------

function AuditTab() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    api.get('/admin/audit-logs').then(({ data }) => setLogs(data.logs)).catch(() => {})
  }, [])

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-bold text-gray-900">Audit log</h2>
      <p className="mt-1 text-xs text-gray-500">Recent actions across the platform.</p>
      <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
        {logs.length === 0 && <p className="text-sm text-gray-500">No log entries yet.</p>}
        {logs.map((l) => (
          <li key={l._id} className="rounded-lg bg-gray-50 p-3 text-sm">
            <span className="font-medium text-gray-900">{l.action}</span>
            <span className="ml-2 text-xs text-gray-500">by {l.user || 'System'}</span>
            <p className="mt-0.5 text-xs text-gray-500">
              {l.target_table ? `target: ${l.target_table}` : ''} · {new Date(l.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
