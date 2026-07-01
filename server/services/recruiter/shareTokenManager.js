const crypto = require('crypto');
const PortfolioShare = require('../../models/PortfolioShare');

/**
 * Hashes a password string using built-in crypto SHA-256.
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Creates a new secure shared link configuration.
 * 
 * @param {object} params - Share configs
 * @param {string} params.portfolioId - Portfolio ID
 * @param {string} [params.label] - Custom label
 * @param {string} [params.password] - Access password
 * @param {number} [params.expiresInDays] - Expire duration
 * @param {boolean} [params.isOneTime=false] - One-time access link
 * @returns {Promise<object>} - Shared link document
 */
async function createSharedLink({ portfolioId, label, password, expiresInDays, isOneTime = false }) {
  const shareToken = crypto.randomBytes(24).toString('hex');
  
  let expiresAt = null;
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  }

  const passwordHash = password ? hashPassword(password) : undefined;

  const newShare = new PortfolioShare({
    portfolioId,
    shareToken,
    label: label || 'Recruiter Link',
    passwordHash,
    expiresAt,
    isOneTime,
    hasBeenUsed: false,
    views: 0
  });

  await newShare.save();
  return newShare;
}

/**
 * Validates a recruiter token for access.
 * 
 * @param {string} shareToken - Access token
 * @param {string} [password] - Access password provided by user
 * @returns {Promise<object>} - Mapped status { valid: boolean, portfolioId: string, reason: string, requirePassword: boolean }
 */
async function validateShareToken(shareToken, password) {
  const share = await PortfolioShare.findOne({ shareToken });
  if (!share) {
    return { valid: false, reason: 'Invalid or missing share link token', requirePassword: false };
  }

  // 1. Expiry Check
  if (share.expiresAt && new Date() > share.expiresAt) {
    return { valid: false, reason: 'This recruiter link has expired', requirePassword: false };
  }

  // 2. One-Time Use Check
  if (share.isOneTime && share.hasBeenUsed) {
    return { valid: false, reason: 'This one-time access link has already been used', requirePassword: false };
  }

  // 3. Password Verification
  if (share.passwordHash) {
    if (!password) {
      return { valid: false, reason: 'Password verification required', requirePassword: true };
    }

    const hashedInput = hashPassword(password);
    if (hashedInput !== share.passwordHash) {
      return { valid: false, reason: 'Incorrect access password', requirePassword: true };
    }
  }

  // 4. Track View
  share.views = (share.views || 0) + 1;
  if (share.isOneTime) {
    share.hasBeenUsed = true;
  }
  await share.save();

  return {
    valid: true,
    portfolioId: share.portfolioId,
    shareLabel: share.label,
    requirePassword: false
  };
}

module.exports = {
  createSharedLink,
  validateShareToken,
  hashPassword
};
