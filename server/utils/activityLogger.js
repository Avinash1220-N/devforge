const UserActivity = require('../models/UserActivity');

/**
 * Log a user action to the database
 * @param {string} userId - User document ID
 * @param {string} action - Action key
 * @param {object} [metadata] - Optional metadata
 */
async function logActivity(userId, action, metadata = {}) {
  try {
    const log = new UserActivity({ userId, action, metadata });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to write UserActivity log:', err.message);
    return null;
  }
}

module.exports = logActivity;
