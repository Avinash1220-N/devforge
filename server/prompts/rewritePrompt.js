const VERSION = 'v1';

/**
 * Builds the prompt to rewrite weak developer descriptions.
 * @param {string} text - The input paragraph/bullets to rewrite
 * @param {string} [role] - Optional target role context
 * @returns {string} - The prompt string
 */
function buildPrompt(text, role = '') {
  return `You are a professional resume writer specializing in developer portfolios. Rewrite the following weak text to make it professional, impact-driven, and recruiter-friendly.

Guidelines:
- Start with strong action verbs (e.g. Developed, Engineered, Optimized, Implemented).
- Specify technical details and mock quantitative achievements where logical (e.g. "...improving latency by 20%").
- Keep it concise and developer-focused.
${role ? `- Tailor the tone for a ${role} position.` : ''}
- Return ONLY the rewritten text, with no introduction, explanation, or quotes.

Weak Input Text:
${text}`;
}

module.exports = {
  VERSION,
  buildPrompt
};
