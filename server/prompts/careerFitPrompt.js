const VERSION = 'v1';

/**
 * Builds the prompt for the Career Role Fit analyzer.
 * @param {string[]} skills - Array of current skills
 * @param {string} targetRole - Target job title
 * @returns {string} - The prompt string
 */
function buildPrompt(skills, targetRole) {
  return `You are an expert tech recruiter and developer career coach. Analyze the developer's current skills against the target job role to calculate a readiness rating, identify missing technical skills, and provide a quick bulleted learning roadmap.

Strict JSON format requirements:
{
  "readiness": 85, // Integer from 0 to 100
  "missingSkills": ["Docker", "AWS", "MLOps"], // Max 5 crucial missing skills
  "roadmap": [
    "Learn MLOps basics, focusing on model registry and monitoring.",
    "Build a project deploying a model containerized with Docker to AWS ECS."
  ] // 2-3 specific, actionable steps
}

Ensure the roadmap is practical and directly addresses the missing skills.

Developer Context:
- Current Skills: ${JSON.stringify(skills)}
- Target Job Role: ${targetRole}`;
}

module.exports = {
  VERSION,
  buildPrompt
};
