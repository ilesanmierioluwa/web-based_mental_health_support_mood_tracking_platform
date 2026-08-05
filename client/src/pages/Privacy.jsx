export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy &amp; How This Works</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: August 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900">Plain-language summary</h2>
          <p className="mt-2">
            This platform is a <strong>self-monitoring and early-awareness tool</strong>. It is not a diagnostic or
            treatment system, and it never tries to diagnose you or label your experiences.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">What data is collected</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your name and email address (for your account).</li>
            <li>Mood check-ins: a mood level, optional tags, and an optional short note.</li>
            <li>Private journal entries you write.</li>
            <li>Records of escalated entries and support actions (audit trail).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">How your journal is protected</h2>
          <p className="mt-2">
            Journal content is <strong>encrypted at rest</strong> and is only shown to you by default. Even the support
            team cannot browse your full journal — they can only see a specific entry if it has been escalated.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">The automated safety scan</h2>
          <p className="mt-2">
            When you save a journal entry, an automated keyword system scans the text. This scan is a blunt, imperfect
            aid — it is <strong>not a human reviewer</strong>, and it can make mistakes (both missing concerning language
            and flagging harmless language). It never acts on its own.
          </p>
          <p className="mt-2">Depending on what the scan finds, an entry may be classified as:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li><strong>No concern</strong> — stored privately, nothing happens.</li>
            <li><strong>Lower concern</strong> — logged for trend purposes only.</li>
            <li><strong>Moderate concern</strong> — added to a support team queue for a human to review.</li>
            <li><strong>High concern</strong> — the specific entry is immediately shown to your institution's support
              contact so a human can reach out to you, and you'll see supportive options in the app.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Who is notified, and what they see</h2>
          <p className="mt-2">
            Only your institution's designated counsellor/support contact is notified, and only about the specific
            escalated entry — never your whole journal. Every time a support person views or acts on an entry, that
            action is recorded in an audit log.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Your data rights</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Export:</strong> you can download your own mood and journal data at any time.</li>
            <li><strong>Delete:</strong> you can delete your account and all of your data. The only exception is a
              minimal record of an active/ongoing support review, which is retained solely so the support team can
              complete that review.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Important limitations</h2>
          <p className="mt-2">
            This platform complements — it never replaces — professional care and crisis services. If you are in
            immediate danger, please contact emergency services or your institution's counselling unit directly. In a
            real deployment, this system must be run in partnership with qualified mental health professionals.
          </p>
        </section>
      </div>
    </div>
  )
}
