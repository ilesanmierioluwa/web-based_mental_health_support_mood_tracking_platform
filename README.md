# MoodPath — Web-Based Mental Health Support & Mood Tracking Platform

An academic prototype for a self-monitoring and early-awareness tool. Users log
daily mood entries and private journal reflections, view mood trends over time,
access curated self-help resources, and — via a keyword-based risk detection
engine — concerning entries are responsibly escalated to a human counsellor/support
contact.

> **Important:** This platform is a **self-monitoring and early-awareness tool,
> NOT a diagnostic or treatment system**. It never diagnoses, and it complements —
> it does not replace — professional mental health care and crisis services.

## Tech Stack

- **Backend:** Node.js + Express + Mongoose (MongoDB Atlas)
- **Encryption:** AES-256-GCM field-level encryption (`crypto`) for journal
  content, mood notes, and counsellor notes
- **Auth:** JWT + bcrypt, optional TOTP MFA (`speakeasy`)
- **Frontend:** React (Vite) + Tailwind CSS + Recharts
- **Notifications:** Nodemailer (email) + in-app dashboard alerts as a
  non-email-dependent fallback (NFR3)

## Repository Structure

```
/project-root
  /client      React frontend (Vite)
  /server
    /config      db connection, seed script
    /models      User, MoodEntry, JournalEntry, ResourceItem, RiskKeyword,
                 RiskKeywordHistory, Escalation, CounsellorNote, InAppAlert, AuditLog
    /controllers
    /routes
    /middlewares auth, roleCheck
    /services    encryption, riskDetection, escalation, notification,
                 mood, recommendation, audit
    server.js
```

## Getting Started

1. Configure `server/.env` (copy the template, set `MONGODB_URI` to your Atlas
   connection string and `ENCRYPTION_KEY` to a 64-char hex string).
2. Install dependencies:

   ```bash
   npm install --prefix server
   npm install --prefix client
   ```

3. Seed the starter data (risk keywords, resource library, demo accounts):

   ```bash
   npm run seed
   ```

4. Run the servers (from the project root):

   ```bash
   npm run server   # API on http://localhost:5000
   npm run client   # app on http://localhost:5173
   ```

### Demo accounts (seeded)

| Role       | Email                        | Password          |
|------------|------------------------------|-------------------|
| Admin      | admin@moodplatform.test      | AdminPass123!     |
| Counsellor | counsellor@moodplatform.test | CounsellorPass123! |

## Safety Design (read before use)

- **Keyword detection is a blunt, imperfect triage aid.** It produces false
  positives and false negatives. Escalation always routes to a human decision
  maker (the counsellor queue), never an automated "response pretending to be care".
- **Tier 3 phrase list is intentionally NOT hand-built.** Only a safe demo
  placeholder (`DEMO_TIER3_TEST_PHRASE`) is seeded so the escalation flow can be
  demonstrated. A real deployment must source and maintain this list with the
  institution's counselling unit / qualified professionals.
- **Counsellors see only the specific escalated entry**, never a user's full
  journal (enforced in code, every view is audit-logged).
- **"Get Help Now" is always visible** on every screen, independent of detection.
- **Data rights:** users can export their own data and genuinely delete their
  account (only a minimal record of an in-flight support review is retained).

> Before any deployment beyond a supervised academic demo, confirm current,
> verified crisis-line/counselling contact details with your institution, and
> run the system in partnership with qualified mental health professionals.

## Testing

Backend endpoints were verified with `curl` and the full user/counsellor/admin
flow was verified in a headless browser (no console errors). No automated E2E
suite is included by design (scope decision).
