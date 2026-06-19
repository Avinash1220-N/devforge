const pdfParse = require('pdf-parse');
const { executeGeminiCall } = require('./geminiService');
const resumePrompt = require('../prompts/resumePrompt');

/**
 * Orchestrates text extraction and Gemini-based resume structuring
 * @param {Buffer} pdfBuffer - Uploaded raw file buffer
 * @param {string} userId - User identifier for usage logging
 * @returns {Promise<object>} - Structured resume data object
 */
async function parseResumePdf(pdfBuffer, userId) {
  if (!pdfBuffer) {
    throw new Error('PDF file buffer is required');
  }

  try {
    // 1. Extract raw text from PDF buffer
    console.log('Extracting raw text from uploaded PDF buffer...');
    const pdfData = await pdfParse(pdfBuffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim() === '') {
      throw new Error('No readable text content found in resume PDF');
    }

    // 2. Text clean-up (remove double spaces, excessive newlines, control characters)
    const cleanedText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/ +/g, ' ') // Reduce multiple spaces
      .replace(/\n\s*\n/g, '\n\n') // Reduce sequential empty lines
      .trim();

    console.log(`Extracted resume text length: ${cleanedText.length}. Running Gemini structuring...`);

    // 3. Compile prompt
    const promptText = resumePrompt.buildPrompt(cleanedText);

    // 4. Run Gemini call
    const structuredResult = await executeGeminiCall({
      userId,
      feature: 'resume-parse',
      promptText,
      version: resumePrompt.VERSION,
      rawInput: { textLength: cleanedText.length, sampleText: cleanedText.substring(0, 100) },
      isJson: true
    });

    return structuredResult;

  } catch (error) {
    console.error('Resume PDF parsing service failure:', error);
    throw new Error(`Resume parsing failed: ${error.message}`);
  }
}

module.exports = {
  parseResumePdf
};
