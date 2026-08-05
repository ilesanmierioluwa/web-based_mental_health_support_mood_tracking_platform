const Escalation = require('../models/Escalation');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

// ---------------------------------------------------------------------------
// Escalation workflow (Module 7).
//
// - Tier 3: create escalation, immediately notify the counsellor contact via
//   email AND in-app alert, and the user-facing supportive panel is shown by
//   the frontend (it does not depend on the counsellor side at all).
// - Tier 2: create escalation for the counsellor dashboard queue without
//   interrupting the user's session. As a safer default we still surface
//   supportive resources to the user regardless of tier (documented choice).
// - Tier 1: logged for trend purposes only, no escalation.
// ---------------------------------------------------------------------------

async function handleJournalRisk({ journalEntry, userId, tier, matchedCategory }) {
  if (tier < 2) return { escalated: false };

  const escalation = new Escalation({
    journal_entry_id: journalEntry._id,
    user_id: userId,
    tier,
    status: 'pending',
    matched_category: matchedCategory || null,
  });
  await escalation.save();

  await auditService.logAudit({
    userId,
    action: 'escalation.created',
    targetTable: 'escalations',
    targetId: escalation._id,
    metadata: { tier, category: matchedCategory },
  });

  const counsellorEmail = process.env.COUNSELLOR_EMAIL || '';

  if (tier === 3) {
    const notificationResult = await notificationService.sendEscalationNotification({
      userId,
      escalationId: escalation._id,
      tier,
      counsellorEmail,
      subject: 'URGENT: A student may need immediate support',
      text: `A journal entry has been escalated at the highest concern tier.\n\nEntry ID: ${journalEntry._id}\nTier: 3\nConcern category: ${matchedCategory || 'unknown'}\nLogged at: ${journalEntry.created_at.toISOString()}\n\nPlease review this entry in the counsellor dashboard and reach out to the user as soon as possible.`,
    });
    return { escalated: true, escalation, notification: notificationResult };
  }

  // Tier 2
  await notificationService.createInAppAlert(
    userId,
    escalation._id,
    'One of your journal entries has been flagged for a member of the support team to review. This is to make sure you get support if you need it.'
  );

  return { escalated: true, escalation };
}

module.exports = { handleJournalRisk };
