const { executeGeminiCall } = require('./geminiService');
const scorePrompt = require('../prompts/scorePrompt');
const PortfolioAudit = require('../models/PortfolioAudit');

/**
 * Audit portfolio markdown and record the scores in the database
 * 
 * @param {string} portfolioId - Target portfolio document ID
 * @param {string} portfolioText - Current portfolio markdown content
 * @param {string} userId - User identifier
 * @returns {Promise<object>} - Scorecard and audit object
 */
async function auditPortfolio(portfolioId, portfolioText, userId) {
  if (!portfolioId || !portfolioText) {
    throw new Error('Portfolio ID and markdown content are required for scoring');
  }

  try {
    console.log(`Running portfolio score audit for portfolio: ${portfolioId}...`);
    
    // Compile prompt
    const promptText = scorePrompt.buildPrompt(portfolioText);

    // Call Gemini
    const result = await executeGeminiCall({
      userId,
      feature: 'portfolio-score',
      promptText,
      version: scorePrompt.VERSION,
      rawInput: { portfolioId, textLength: portfolioText.length },
      isJson: true
    });

    // Save score result to the PortfolioAudit collection
    const newAudit = new PortfolioAudit({
      portfolioId,
      overall: result.overall || 0,
      ats: result.ats || 0,
      content: result.content || 0,
      seo: result.seo || 0,
      projects: result.projects || 0,
      feedback: result.feedback || []
    });
    await newAudit.save();

    return newAudit;

  } catch (error) {
    console.error('Portfolio score audit service failure:', error);
    throw new Error(`Portfolio auditing failed: ${error.message}`);
  }
}

module.exports = {
  auditPortfolio
};
