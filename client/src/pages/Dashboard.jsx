import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import api from '../api'

const MOOD_LABELS = { 1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Very Good' }
const BAR_COLORS = {
  1: '#f87171',
  2: '#fbbf24',
  3: '#a1a1aa',
  4: '#4ade80',
  5: '#22c55e',
}

function formatPeriodLabel(key, period) {
  const d = new Date(key)
  if (period === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  if (period === 'week') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export default function Dashboard() {
  const [period, setPeriod] = useState('day')
  const [series, setSeries] = useState([])
  const [tagData, setTagData] = useState([])
  const [streak, setStreak] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [period])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [analytics, tags, streakRes, recs] = await Promise.all([
        api.get(`/moods/analytics?period=${period}`),
        api.get('/moods/tags'),
        api.get('/moods/streak'),
        api.get('/resources/recommendations'),
      ])
      const chartData = analytics.data.data.map((d) => ({
        label: formatPeriodLabel(d.periodKey, period),
        mood: d.mood_scale,
        entries: d.entryCount,
      }))
      setSeries(chartData)
      setTagData(tags.data.data)
      setStreak(streakRes.data)
      setRecommendations(recs.data.items)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Your wellbeing, at a glance</h1>
      <p className="mt-1 text-sm text-gray-600">
        These are patterns in the moods you've logged. They're observations of your own data — not a diagnosis.
      </p>

      {streak && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm text-gray-700">{streak.message}</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Mood over time</h2>
            <div className="flex rounded-lg border border-gray-200 p-0.5">
              {['day', 'week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
                    period === p ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-64">
            {loading ? (
              <p className="text-sm text-gray-500">Loading your chart…</p>
            ) : series.length === 0 ? (
              <p className="text-sm text-gray-500">
                No mood entries yet.{' '}
                <Link to="/mood" className="font-medium text-brand-600 hover:underline">Log your first check-in</Link>.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b4ff2" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6b4ff2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [MOOD_LABELS[v], 'Mood']} />
                  <Area type="monotone" dataKey="mood" stroke="#6b4ff2" strokeWidth={2} fill="url(#moodFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900">Mood and your tags</h2>
          <p className="mt-1 text-xs text-gray-500">Average mood on days you logged each tag.</p>
          <div className="mt-4 h-64">
            {tagData.length === 0 ? (
              <p className="text-sm text-gray-500">Add tags to your check-ins to see patterns here.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="tag" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} / 5`, 'Average mood']} />
                  <Bar dataKey="avgMood">
                    {tagData.map((entry) => (
                      <Cell key={entry.tag} fill={BAR_COLORS[Math.round(entry.avgMood)] || '#a1a1aa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Resources for you</h2>
          <Link to="/resources" className="text-sm font-medium text-brand-600 hover:underline">Browse all resources</Link>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Suggested based on the moods and tags you've logged recently.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-500">Log a few check-ins and we'll suggest resources that may help.</p>
          ) : (
            recommendations.map((r) => (
              <div key={r._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <span className="text-xs font-medium uppercase tracking-wide text-brand-600">{r.category.replace('_', ' ')}</span>
                <h3 className="mt-1 font-semibold text-gray-900">{r.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-gray-600">{r.body}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
