const VERSION = 'v1';

/**
 * Builds the prompt for the Gemini portion of the hybrid ATS analyzer.
 * @param {string} portfolioText - Developer portfolio markdown
 * @param {string} jobDescription - Target job requirements
 * @returns {string} - The prompt string
 */
function buildPrompt(portfolioText, jobDescription) {
  return `You are an expert ATS (Applicant Tracking System) audit filter. Evaluate the developer's portfolio content against the target job description to grade match quality and compile missing keyword audits.

Strict JSON format requirements:
{
  "score": 75, // Integer from 0 to 100 representing content alignment (will form 40% of their final ATS grade)
  "strengths": [
    "Excellent projects highlighting core front-end skills.",
    "Clear structure and layout matching target developer stack."
  ], // 2-3 bullet items
  "weaknesses": [
    "Lacks concrete demonstration of testing or CI/CD pipelines.",
    "Needs more impact metrics in project showcase descriptions."
  ], // 2-3 bullet items
  "missingKeywords": ["TypeScript", "Jest", "CI/CD", "Next.js"] // Core keywords lacking in portfolio
}

Be realistic and objective in your analysis.

Developer Portfolio:
${portfolioText}

Target Job Description:
${jobDescription}`;
}

module.exports = {
  VERSION,
  buildPrompt
};
