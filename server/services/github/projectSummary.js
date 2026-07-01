const { executeGeminiCall } = require('../ai/geminiService');
const projectSummaryPrompt = require('../../prompts/projectSummaryPrompt');

/**
 * Summarize a repository using a fallback metadata chain
 * 
 * @param {object} repo - GitHub repository details
 * @param {string} repo.name - Repository name
 * @param {string} [repo.description] - Description string
 * @param {string[]} [repo.topics] - Topic tag strings
 * @param {string[]} [repo.languages] - Coded language listings
 * @param {string} [repo.readme] - Raw README markdown text content
 * @param {string} userId - User identifier
 * @returns {Promise<object>} - Optimized title, description summary, and tech tags
 */
async function summarizeRepository(repo, userId) {
  if (!repo || !repo.name) {
    throw new Error('Repository details with at least a project name are required');
  }

  try {
    // Fallback logic check: Compile what content is available
    const fallbackDetails = {
      name: repo.name,
      description: repo.description || '',
      topics: repo.topics || [],
      languages: repo.languages || [],
      readme: repo.readme || ''
    };

    // If description is missing, try compiling list from languages and topics
    if (!fallbackDetails.description && fallbackDetails.topics.length === 0 && !fallbackDetails.readme) {
      fallbackDetails.description = `A development repository cataloged under ${fallbackDetails.name} language framework stacks.`;
    }

    console.log(`Generating AI summary for repository: ${repo.name} using metadata fallbacks...`);

    // Compile prompt
    const promptText = projectSummaryPrompt.buildPrompt(fallbackDetails);

    // Call Gemini
    const result = await executeGeminiCall({
      userId,
      feature: 'project-summary',
      promptText,
      version: projectSummaryPrompt.VERSION,
      rawInput: { name: repo.name, hasReadme: !!repo.readme, descLength: (repo.description || '').length },
      isJson: true
    });

    return {
      title: result.title || repo.name,
      summary: result.summary || repo.description || 'Developed a public software utility.',
      technologies: result.technologies || repo.languages || []
    };

  } catch (error) {
    console.error(`Repository summary failed for ${repo.name}:`, error);
    
    // Safety Fallback: Return a clean structured mock representing the repository metadata
    // if the LLM crashes, so the importer never fails completely.
    return {
      title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      summary: repo.description || 'A software engineering repository detailing development files.',
      technologies: repo.languages && repo.languages.length > 0 ? repo.languages : ['Software']
    };
  }
}

module.exports = {
  summarizeRepository
};
