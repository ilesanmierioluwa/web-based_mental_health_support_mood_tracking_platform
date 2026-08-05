import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function GetHelpNow() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Get help now"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-300"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Get Help Now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">You are not alone.</h2>
            <p className="mt-1 text-sm text-gray-600">
              If you are struggling right now, please reach out. Support is available, and asking for help is a sign of
              strength.
            </p>
            <div className="mt-4 space-y-3 rounded-xl bg-brand-50 p-4 text-sm text-gray-700">
              <p>
                <strong>Your campus counselling unit</strong>
                <br />
                <span className="text-gray-500">
                  (Please confirm the current contact for your institution's counselling unit and add it here for your
                  deployment.)
                </span>
              </p>
              <p>
                <strong>Talk to someone you trust</strong>
                <br />
                A trusted friend, family member, or lecturer can help you take the next step.
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <Link
                to="/get-help-now"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Open Get Help Now page
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
