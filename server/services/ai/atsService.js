const { executeGeminiCall } = require('./geminiService');
const atsPrompt = require('../../prompts/atsPrompt');

// A dictionary of common developer technology keywords to extract during tokenization
const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'go', 'golang', 'rust', 'c++', 'java', 'ruby', 'php',
  'react', 'next.js', 'vue', 'angular', 'svelte', 'express', 'node.js', 'django', 'flask', 'fastapi',
  'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'cassandra', 'dynamodb',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'ci/cd', 'testing', 'jest',
  'tensorflow', 'pytorch', 'keras', 'opencv', 'mediapipe', 'numpy', 'pandas', 'scikit-learn',
  'graphql', 'rest', 'api', 'html', 'css', 'tailwindcss', 'git', 'github', 'jira', 'agile',
  'scrum', 'devops', 'mlops', 'aws ecs', 'aws lambda', 'terraform'
];

/**
 * Executes a hybrid (60% Keyword matching + 40% LLM audit) suitability score analysis.
 * 
 * @param {string} portfolioText - Current portfolio markdown
 * @param {string} jobDescription - Target job requirements
 * @param {string} userId - User identifier
 * @returns {Promise<object>} - Scorecards, feedback list, and missing keywords
 */
async function analyzeAtsScore(portfolioText, jobDescription, userId) {
  if (!portfolioText || !jobDescription) {
    throw new Error('Portfolio content and job description are required for ATS analysis');
  }

  try {
    // 1. Calculate JS-based Tech Keyword Match (60% Weight)
    const normalizedPortfolio = portfolioText.toLowerCase();
    const normalizedJob = jobDescription.toLowerCase();

    // Find technology keywords mentioned in the job description
    const jobKeywords = TECH_KEYWORDS.filter(keyword => {
      const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
      return regex.test(normalizedJob);
    });

    let matchedKeywords = [];
    let keywordScore = 100;

    if (jobKeywords.length > 0) {
      matchedKeywords = jobKeywords.filter(keyword => {
        const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
        return regex.test(normalizedPortfolio);
      });
      keywordScore = Math.round((matchedKeywords.length / jobKeywords.length) * 100);
    }

    // 2. Calculate Gemini-based context suitability (40% Weight)
    console.log(`Matched ${matchedKeywords.length}/${jobKeywords.length} keywords. Querying Gemini for ATS analysis...`);
    const promptText = atsPrompt.buildPrompt(portfolioText, jobDescription);
    
    const geminiResult = await executeGeminiCall({
      userId,
      feature: 'ats-check',
      promptText,
      version: atsPrompt.VERSION,
      rawInput: { portfolioLength: portfolioText.length, jdLength: jobDescription.length },
      isJson: true
    });

    const geminiScore = geminiResult.score || 0;

    // 3. Compute hybrid score
    // Weighted: 60% Keyword Match, 40% Gemini audit evaluation
    const finalScore = Math.round((0.6 * keywordScore) + (0.4 * geminiScore));

    // Compile missing keywords from both algorithms to provide comprehensive feedback
    const missingInKeywords = jobKeywords.filter(k => !matchedKeywords.includes(k));
    const rawMissingFromGemini = geminiResult.missingKeywords || [];
    
    // Union the lists, unique list
    const combinedMissingKeywords = Array.from(new Set([
      ...missingInKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
      ...rawMissingFromGemini
    ])).slice(0, 8); // Cap at 8 missing keywords for clean layout

    return {
      score: finalScore,
      keywordScore,
      geminiScore,
      strengths: geminiResult.strengths || ['Good overall structure'],
      weaknesses: geminiResult.weaknesses || ['Could detail projects further'],
      missingKeywords: combinedMissingKeywords
    };

  } catch (error) {
    console.error('Hybrid ATS evaluation service failure:', error);
    throw new Error(`ATS analysis failed: ${error.message}`);
  }
}

// Utility to escape regex specials
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  analyzeAtsScore
};
