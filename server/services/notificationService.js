const InAppAlert = require('../models/InAppAlert');

// ---------------------------------------------------------------------------
// Notification service.
//
// NFR3: escalation notifications must not silently fail. Primary channel is
// email via the Brevo (Sendinblue) HTTP API; if it is not configured or fails,
// an in-app dashboard alert is always created as a non-email-dependent
// fallback.
// ---------------------------------------------------------------------------

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Attempt to send an email through the Brevo API.
 * Resolves with { success: boolean, error?: string }. Never throws -- callers
 * rely on the boolean to know whether to rely on the in-app fallback.
 */
async function sendEmail(to, subject, text) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderMail = process.env.BREVO_SENDER_MAIL;
    if (!apiKey || !senderMail) {
      return { success: false, error: 'Brevo not configured (BREVO_API_KEY / BREVO_SENDER_MAIL missing)' };
    }

    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderMail },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return { success: false, error: `Brevo responded ${response.status}: ${body.slice(0, 200)}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Create an in-app dashboard alert for a user. This channel does not depend
 * on email delivery at all.
 */
async function createInAppAlert(userId, escalationId, message) {
  const alert = new InAppAlert({
    user_id: userId,
    escalation_id: escalationId || null,
    message,
  });
  await alert.save();
  return alert;
}

/**
 * Send a tier escalation notification. Always creates the in-app alert
 * (NFR3 fallback) and also tries email to the designated counsellor contact.
 * Returns { inApp: true, email: { success, error? } }.
 */
async function sendEscalationNotification({ userId, escalationId, tier, counsellorEmail, subject, text }) {
  const inApp = await createInAppAlert(
    userId,
    escalationId,
    tier === 3
      ? 'A member of our support team has been notified to check in with you. Your wellbeing matters.'
      : 'One of your journal entries has been flagged for a member of the support team to review. This is to make sure you get support if you need it.'
  );

  let email = { success: false, error: 'no recipient provided' };
  if (counsellorEmail) {
    email = await sendEmail(counsellorEmail, subject, text);
  }

  return { inApp, email };
}

module.exports = { sendEmail, createInAppAlert, sendEscalationNotification };
