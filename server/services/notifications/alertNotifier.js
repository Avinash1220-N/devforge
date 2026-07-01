const Notification = require('../../models/Notification');

/**
 * Dispatches a new notification to a specific user.
 * 
 * @param {string} userId - User identifier
 * @param {object} params - Notification info
 * @param {string} params.title - Alert title
 * @param {string} params.message - Alert content
 * @param {string} params.type - Alert event classification
 * @param {string} [params.actionUrl] - Client redirect URL path
 * @returns {Promise<object>} - Saved Notification document
 */
async function sendNotification(userId, { title, message, type, actionUrl }) {
  try {
    const alert = new Notification({
      userId,
      title,
      message,
      type,
      actionUrl,
      isRead: false
    });
    await alert.save();
    return alert;
  } catch (err) {
    console.error('[Notification Service] Failed to send alert:', err.message);
    throw err;
  }
}

/**
 * Returns the count of unread notifications for a user.
 */
async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

/**
 * Marks all notifications as read for a user.
 */
async function markAllAsRead(userId) {
  const now = new Date();
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: now } }
  );
  return { success: true, readAt: now };
}

/**
 * Marks a specific notification as read.
 */
async function markNotificationAsRead(notificationId, userId) {
  const now = new Date();
  const alert = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true, readAt: now } },
    { new: true }
  );
  return alert;
}

module.exports = {
  sendNotification,
  getUnreadCount,
  markAllAsRead,
  markNotificationAsRead
};
