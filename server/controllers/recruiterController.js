const Portfolio = require('../models/Portfolio');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { createSharedLink, validateShareToken } = require('../services/recruiter/shareTokenManager');

/**
 * Generate a new secure shared link configuration.
 */
async function generateLink(req, res, next) {
  const { label, password, expiresInDays, isOneTime } = req.body;

  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found.' });
    }

    const shareLink = await createSharedLink({
      portfolioId: portfolio._id,
      label,
      password,
      expiresInDays,
      isOneTime
    });

    res.status(201).json({
      success: true,
      shareToken: shareLink.shareToken,
      url: `http://localhost:5173/recruiter/${shareLink.shareToken}`,
      label: shareLink.label,
      expiresAt: shareLink.expiresAt,
      isOneTime: shareLink.isOneTime
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validates token access and retrieves the compiled portfolio.
 */
async function accessPortfolio(req, res, next) {
  const { token } = req.params;
  const { password } = req.body; // Support POST password check

  try {
    const check = await validateShareToken(token, password);
    if (!check.valid) {
      if (check.requirePassword) {
        return res.status(401).json({ success: false, requirePassword: true, message: check.reason });
      }
      return res.status(403).json({ success: false, message: check.reason });
    }

    const portfolio = await Portfolio.findById(check.portfolioId).populate('userId', 'name email avatarUrl');
    if (!portfolio || portfolio.isDeleted) {
      return res.status(404).json({ success: false, message: 'Portfolio not found.' });
    }

    // Log recruiter view event (expired in 30 days via TTL index)
    const newEvent = new AnalyticsEvent({
      portfolioId: portfolio._id,
      type: 'recruiter_view',
      elementName: check.shareLabel || 'Recruiter Link',
      referrer: req.headers.referer || 'Direct',
      country: 'Local',
      deviceType: 'Desktop'
    });
    await newEvent.save();

    // Trigger Notification for the owner
    const { sendNotification } = require('../services/notifications/alertNotifier');
    await sendNotification(portfolio.userId, {
      title: 'Recruiter Visited Your Portfolio!',
      message: `A recruiter accessed your portfolio via shared link: "${check.shareLabel}".`,
      type: 'recruiter_view',
      actionUrl: '/workspace?tab=messages'
    });

    res.json({ success: true, portfolio });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateLink,
  accessPortfolio
};
