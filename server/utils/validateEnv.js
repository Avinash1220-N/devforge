/**
 * Validate that essential environment variables are configured before boot.
 * Exits the process with an error code if required variables are missing.
 */
function validateEnv() {
  const required = [
    { key: 'MONGO_URI', value: process.env.MONGO_URI },
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY }
  ];

  const missing = required.filter(item => !item.value || item.value.trim() === '');

  if (missing.length > 0) {
    console.error('\n======================================================');
    console.error('❌ CRITICAL ENVIRONMENT CONFIGURATION FAILURE');
    console.error('======================================================');
    console.error('The server cannot start because the following required variables are missing or empty:');
    missing.forEach(item => {
      console.error(`  - ${item.key}`);
    });
    console.error('\nPlease configure these inside server/.env before starting.');
    console.error('======================================================\n');
    process.exit(1);
  }

  // Check if credentials contain mock placeholders and warn
  const isMockGemini = process.env.GEMINI_API_KEY === 'mock_gemini_api_key' || process.env.GEMINI_API_KEY.includes('your_');
  if (isMockGemini) {
    console.warn('\n======================================================');
    console.warn('⚠️  WARNING: MOCK GEMINI API KEY DETECTED');
    console.warn('======================================================');
    console.warn('The GEMINI_API_KEY is configured with a mock string placeholder.');
    console.warn('AI services will run in Simulation Mode and return static mock outputs.');
    console.warn('======================================================\n');
  } else {
    console.log('✅ Environment configuration validated successfully.');
  }
}

module.exports = validateEnv;
