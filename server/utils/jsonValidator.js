/**
 * Sanitizes and parses JSON returned by LLMs.
 * Removes markdown block markers (```json ... ```) and repairs minor formatting errors.
 * 
 * @param {string} rawText - The raw response string from Gemini
 * @returns {object} - The parsed JS object
 */
function cleanAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  let cleaned = rawText.trim();

  // 1. Remove markdown fences (e.g. ```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  cleaned = cleaned.trim();

  // 2. Fix trailing commas before closing braces/brackets
  // Example: {"score": 85, } -> {"score": 85}
  cleaned = cleaned.replace(/,\s*([\]\}])/g, '$1');

  // 3. Attempt JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Initial JSON.parse failed. Raw text:', rawText);
    
    // Attempt second-tier cleaning: extracting the first '{' and last '}'
    try {
      const startIndex = cleaned.indexOf('{');
      const endIndex = cleaned.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const sliced = cleaned.substring(startIndex, endIndex + 1);
        const fixedSliced = sliced.replace(/,\s*([\]\}])/g, '$1');
        return JSON.parse(fixedSliced);
      }
    } catch (sliceError) {
      console.error('Fallback slice JSON parse failed:', sliceError);
    }

    throw new Error(`JSON parsing failed: ${error.message}`);
  }
}

module.exports = {
  cleanAndParseJson
};
