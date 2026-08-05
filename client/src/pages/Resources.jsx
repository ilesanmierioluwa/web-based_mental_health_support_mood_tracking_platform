import { useState, useEffect } from 'react'
import api from '../api'

const CATEGORY_LABELS = {
  anxiety: 'Anxiety',
  low_mood: 'Low mood',
  stress: 'Stress management',
  sleep: 'Sleep',
  grounding: 'Grounding & breathing',
  crisis_support: 'Crisis support',
}

export default function Resources() {
  const [items, setItems] = useState([])
  const [category, setCategory] = useState('all')

  useEffect(() => {
    api.get('/resources').then(({ data }) => setItems(data.items)).catch(() => {})
  }, [])

  const filtered = category === 'all' ? items : items.filter((i) => i.category === category)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Self-help resources</h1>
      <p className="mt-1 text-sm text-gray-600">
        Original, short resources written for this platform. They are suggestions to try — not medical advice.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('all')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            category === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-brand-100'
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              category === key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-brand-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <article key={r._id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
              {CATEGORY_LABELS[r.category] || r.category}
            </span>
            <h2 className="mt-1 font-semibold text-gray-900">{r.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{r.body}</p>
            {r.external_link && (
              <a
                href={r.external_link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-sm font-medium text-brand-600 hover:underline"
              >
                Learn more →
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
