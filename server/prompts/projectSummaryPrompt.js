const VERSION = 'v1';

/**
 * Builds the prompt to summarize repository details using Gemini.
 * @param {object} repoDetails - Combined metadata and contents
 * @returns {string} - The prompt string
 */
function buildPrompt(repoDetails) {
  return `You are a technical project cataloger. Review the following repository details (name, description, topics, primary languages, and README text) and synthesize them into a professional project portfolio card.

Strict JSON format requirements:
{
  "title": "Clean Representative Project Title",
  "summary": "A 1-2 sentence developer-focused summary highlighting the engineering problem solved, the system architecture built, and the impact.",
  "technologies": ["React", "Express", "Python"]
}

Ensure the summary uses active, impact-oriented terms (e.g. "Developed a high-throughput... translating..."). Limit the technologies list to the actual key libraries/tools/languages detected in the README or files.

Repository Context:
- Name: ${repoDetails.name}
- Public Description: ${repoDetails.description || 'No direct description.'}
- Topics/Keywords: ${JSON.stringify(repoDetails.topics || [])}
- Primary Languages: ${JSON.stringify(repoDetails.languages || [])}
- README Content (partial/full):
${repoDetails.readme ? repoDetails.readme.substring(0, 4000) : 'No README file available.'}`;
}

module.exports = {
  VERSION,
  buildPrompt
};
