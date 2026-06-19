const crypto = require('crypto');

/**
 * Computes a SHA-256 hash string for caching invalidation keys
 * @param {object} params - Cache parameters
 * @param {string} params.feature - The name of the AI feature
 * @param {string} params.model - The AI model name
 * @param {string} params.version - The prompt version
 * @param {any} params.input - The prompt input variables
 * @returns {string} - The SHA-256 hex string
 */
function generateCacheKey({ feature, model, version, input }) {
  try {
    const serializedInput = typeof input === 'object' ? JSON.stringify(input) : String(input);
    const payload = JSON.stringify({
      feature,
      model,
      version,
      input: serializedInput
    });
    
    return crypto.createHash('sha256').update(payload).digest('hex');
  } catch (error) {
    console.error('Failed to generate cache key hash:', error);
    // Return a random hash on failure to prevent crashing
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = {
  generateCacheKey
};
