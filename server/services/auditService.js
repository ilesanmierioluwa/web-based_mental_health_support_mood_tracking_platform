const AuditLog = require('../models/AuditLog');

async function logAudit({
  userId = null,
  action,
  targetTable = '',
  targetId = '',
  ipAddress = '',
  metadata = {},
}) {
  const entry = new AuditLog({
    user_id: userId,
    action,
    target_table: targetTable,
    target_id: String(targetId || ''),
    ip_address: ipAddress || '',
    metadata,
  });
  await entry.save();
  return entry;
}

module.exports = { logAudit };
