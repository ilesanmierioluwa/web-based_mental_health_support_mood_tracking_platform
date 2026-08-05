import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Very Low' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Very Good' },
]

const TAG_OPTIONS = [
  'good_sleep',
  'poor_sleep',
  'low_stress',
  'stressed',
  'exercise',
  'no_exercise',
  'social',
  'isolated',
  'anxious',
]

const TAG_LABELS = {
  good_sleep: 'Good sleep',
  poor_sleep: 'Poor sleep',
  low_stress: 'Low stress',
  stressed: 'Stressed',
  exercise: 'Exercised',
  no_exercise: 'No exercise',
  social: 'Social contact',
  isolated: 'Felt isolated',
  anxious: 'Anxious',
}

export default function MoodLog() {
  const navigate = useNavigate()
  const [moodScale, setMoodScale] = useState(3)
  const [tags, setTags] = useState([])
  const [note, setNote] = useState('')
  const [customTag, setCustomTag] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase().replace(/\s+/g, '_')
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t])
    }
    setCustomTag('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await api.post('/moods', { mood_scale: moodScale, tags, note })
      setMessage('Thanks for checking in with yourself today.')
      setTags([])
      setNote('')
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your entry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">How are you feeling today?</h1>
      <p className="mt-1 text-sm text-gray-600">There's no wrong answer. Just check in honestly with yourself.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div>
          <label className="text-sm font-medium text-gray-700">Your mood right now</label>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMoodScale(opt.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${
                  moodScale === opt.value
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-gray-200 bg-white hover:border-brand-300'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Anything affecting how you feel? (optional)</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  tags.includes(tag)
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-brand-100 hover:text-brand-800'
                }`}
              >
                {TAG_LABELS[tag]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomTag()
                }
              }}
              placeholder="Add your own tag…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">A short note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="A few words about your day…"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save my check-in'}
        </button>
      </form>
    </div>
  )
}
