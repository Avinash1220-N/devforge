require('dotenv').config({ path: '../.env' }); // Load from parent env if running in scratch/
const mongoose = require('mongoose');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const PortfolioAudit = require('../models/PortfolioAudit');
const GeminiCache = require('../models/GeminiCache');
const AIUsage = require('../models/AIUsage');

const { executeGeminiCall } = require('../services/geminiService');
const { analyzeAtsScore } = require('../services/atsService');
const { auditPortfolio } = require('../services/portfolioScore');

async function runVerification() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/devforge';
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  // Create a temporary mock user for testing
  let testUser = await User.findOne({ githubId: 'verify_test_user' });
  if (!testUser) {
    testUser = new User({
      githubId: 'verify_test_user',
      name: 'Verification Tester',
      email: 'verify@test.com'
    });
    await testUser.save();
  }

  // Create a temporary mock portfolio for testing
  let testPortfolio = await Portfolio.findOne({ userId: testUser._id });
  if (testPortfolio) {
    await Portfolio.deleteOne({ _id: testPortfolio._id });
  }
  testPortfolio = new Portfolio({
    userId: testUser._id,
    markdown: '# Verification Tester\n\n## Skills\n- Python, TensorFlow, React\n\n## Projects\n### Sign Recognition\nBuilt gesture system.',
    theme: 'DarkPro'
  });
  await testPortfolio.save();

  console.log('\n======================================================');
  console.log('🧪 VERIFYING AI CACHE MECHANICS');
  console.log('======================================================');
  
  const cacheTestInput = { query: 'verify_caching_key_' + Math.random() };
  
  // Wipe cache for this specific input to guarantee clean run
  // First execution: expect cacheHit = false
  console.log('Execution 1 (Querying API/Mock)...');
  const res1 = await executeGeminiCall({
    userId: testUser._id,
    feature: 'rewrite',
    promptText: 'Rewrite this sentence: Code works.',
    version: 'v1_verify',
    rawInput: cacheTestInput,
    isJson: false
  });
  
  // Find usage log for execution 1
  const usage1 = await AIUsage.findOne({ userId: testUser._id, feature: 'rewrite' }).sort({ createdAt: -1 });
  console.log(`- Result: "${res1}"`);
  console.log(`- Cache Hit status logged: ${usage1.cacheHit}`);
  
  // Second execution: expect cacheHit = true
  console.log('Execution 2 (Querying Cache)...');
  const res2 = await executeGeminiCall({
    userId: testUser._id,
    feature: 'rewrite',
    promptText: 'Rewrite this sentence: Code works.',
    version: 'v1_verify',
    rawInput: cacheTestInput,
    isJson: false
  });
  
  const usage2 = await AIUsage.findOne({ userId: testUser._id, feature: 'rewrite' }).sort({ createdAt: -1 });
  console.log(`- Result: "${res2}"`);
  console.log(`- Cache Hit status logged: ${usage2.cacheHit}`);

  if (usage1.cacheHit === false && usage2.cacheHit === true) {
    console.log('✅ SUCCESS: AI Cache hit/miss cycle resolved correctly!');
  } else {
    console.error('❌ FAILURE: Cache did not invalidate or load matching hashes.');
  }

  console.log('\n======================================================');
  console.log('🧪 VERIFYING HYBRID ATS KEYWORD MATCHER');
  console.log('======================================================');
  
  const testPortfolioText = `# Skills\n- Python, TensorFlow, JavaScript\n- React, Node.js`;
  const testJobDescription = `Requirements:\n- Strong knowledge of Python and TensorFlow.\n- Must be familiar with Docker container scripting and AWS cloud deployments.`;
  
  console.log('Evaluating portfolio against job requirements...');
  const atsResult = await analyzeAtsScore(testPortfolioText, testJobDescription, testUser._id);
  
  console.log(`- Combined ATS Score: ${atsResult.score}/100`);
  console.log(`- Keyword score: ${atsResult.keywordScore}%`);
  console.log(`- Gemini score: ${atsResult.geminiScore}%`);
  console.log(`- Strengths: ${JSON.stringify(atsResult.strengths)}`);
  console.log(`- Weaknesses: ${JSON.stringify(atsResult.weaknesses)}`);
  console.log(`- Missing Keywords: ${JSON.stringify(atsResult.missingKeywords)}`);

  const hasDocker = atsResult.missingKeywords.includes('Docker');
  const hasAws = atsResult.missingKeywords.includes('Aws') || atsResult.missingKeywords.includes('AWS');

  if (hasDocker && hasAws) {
    console.log('✅ SUCCESS: Missing keywords "Docker" and "AWS" detected consistently!');
  } else {
    console.error('❌ FAILURE: Token matching failed to list Docker/AWS as missing.');
  }

  console.log('\n======================================================');
  console.log('🧪 VERIFYING PORTFOLIO AUDIT HISTORY LOGGING');
  console.log('======================================================');
  
  // Clean existing audits
  await PortfolioAudit.deleteMany({ portfolioId: testPortfolio._id });
  
  console.log('Executing Audit 1...');
  await auditPortfolio(testPortfolio._id, testPortfolio.markdown, testUser._id);
  
  console.log('Modifying portfolio...');
  testPortfolio.markdown += '\nAdded details.';
  await testPortfolio.save();
  
  console.log('Executing Audit 2...');
  await auditPortfolio(testPortfolio._id, testPortfolio.markdown, testUser._id);
  
  const auditLogsCount = await PortfolioAudit.countDocuments({ portfolioId: testPortfolio._id });
  console.log(`- Total audit documents logged: ${auditLogsCount}`);
  
  if (auditLogsCount === 2) {
    console.log('✅ SUCCESS: Multiple audits recorded in PortfolioAudit collection!');
  } else {
    console.error(`❌ FAILURE: Audit history counts mismatched: expected 2, got ${auditLogsCount}`);
  }

  // Cleanup testing documents
  console.log('\nCleaning up verification records...');
  await User.deleteOne({ _id: testUser._id });
  await Portfolio.deleteOne({ _id: testPortfolio._id });
  await PortfolioAudit.deleteMany({ portfolioId: testPortfolio._id });
  
  console.log('Closing DB connection...');
  await mongoose.disconnect();
  console.log('Done.');
}

runVerification().catch(err => {
  console.error('Verification script crashed:', err);
  mongoose.disconnect();
});
