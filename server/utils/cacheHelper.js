const GeminiCache = require('../models/GeminiCache');

/**
 * Checks if a cached response exists for the given hash key
 * @param {string} hash - The SHA-256 cache key
 * @returns {Promise<any|null>} - The cached object or null
 */
async function getCachedResponse(hash) {
  try {
    const cacheEntry = await GeminiCache.findOne({ hash });
    if (cacheEntry) {
      console.log(`[Cache Hit] Serving response for hash: ${hash.substring(0, 8)}...`);
      return cacheEntry.response;
    }
    return null;
  } catch (error) {
    console.error('Failed to query cache entry:', error);
    return null;
  }
}

/**
 * Saves an AI response to the cache collection
 * @param {string} hash - The SHA-256 cache key
 * @param {any} response - The content payload to cache
 * @returns {Promise<void>}
 */
async function saveCachedResponse(hash, response) {
  try {
    await GeminiCache.findOneAndUpdate(
      { hash },
      { hash, response, createdAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`[Cache Write] Saved response for hash: ${hash.substring(0, 8)}...`);
  } catch (error) {
    console.error('Failed to save cache entry:', error);
  }
}

module.exports = {
  getCachedResponse,
  saveCachedResponse
};
