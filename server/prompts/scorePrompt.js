const VERSION = 'v1';

/**
 * Builds the prompt to audit and score a portfolio.
 * @param {string} portfolioText - The portfolio markdown text
 * @returns {string} - The prompt string
 */
function buildPrompt(portfolioText) {
  return `You are a developer portfolio auditor. Review the following portfolio markdown and run a comprehensive quality audit. Score each metric from 0 to 100 and provide constructive improvement items.

Metrics to evaluate:
- content: Readability, clarity, professional tone, spelling.
- projects: Descriptions, stack listings, repository references.
- skills: Coverage, categorization, relevance.
- seo: Potential SEO health, tag layouts, headers.
- ats: Suitability for resume parsing machines.

Strict JSON format requirements:
{
  "overall": 85, // Integer from 0 to 100 representing weighted score: content(30%), projects(30%), skills(20%), seo(10%), ats(10%)
  "content": 80,
  "projects": 90,
  "skills": 85,
  "seo": 75,
  "ats": 80,
  "feedback": [
    "Add more action-oriented bullet points to the experience description.",
    "Mention SEO keywords like React, Next.js in headers to improve ranking.",
    "Add actual repository or live links to projects."
  ] // 2-3 specific feedback items
}

Be analytical and constructive.

Developer Portfolio Markdown:
${portfolioText}`;
}

module.exports = {
  VERSION,
  buildPrompt
};
