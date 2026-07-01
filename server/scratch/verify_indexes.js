require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const ResumeVersion = require('../models/ResumeVersion');
const PortfolioVersion = require('../models/PortfolioVersion');
const PortfolioShare = require('../models/PortfolioShare');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const PortfolioAnalytics = require('../models/PortfolioAnalytics');
const Notification = require('../models/Notification');
const GitHubSyncSuggestion = require('../models/GitHubSyncSuggestion');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/devforge';

async function run() {
  try {
    console.log(`Connecting to MongoDB at: ${mongoURI.split('@').pop()}`);
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB. Syncing and validating indexes...');

    const modelsToVerify = [
      { name: 'User', model: User, required: ['aiBudget.month_1'] },
      { name: 'Portfolio', model: Portfolio, required: ['userId_1_isDeleted_1', 'userId_1_draftStatus_1'] },
      { name: 'ResumeVersion', model: ResumeVersion, required: ['userId_1_isLatest_1', 'userId_1_checksum_1'] },
      { name: 'PortfolioVersion', model: PortfolioVersion, required: ['portfolioId_1_versionNumber_-1'] },
      { name: 'PortfolioAnalytics', model: PortfolioAnalytics, required: ['portfolioId_1_date_1'] },
      { name: 'Notification', model: Notification, required: ['createdAt_1'] }
    ];

    let overallSuccess = true;

    for (const item of modelsToVerify) {
      console.log(`\nVerifying indexes for model: ${item.name}...`);
      
      // Force index synchronization
      await item.model.syncIndexes();

      // Retrieve compiled indexes
      const indexes = await item.model.collection.listIndexes().toArray();
      const indexNames = indexes.map(idx => idx.name);
      
      console.log(`Found indexes: ${JSON.stringify(indexNames)}`);

      const missing = item.required.filter(reqName => !indexNames.includes(reqName));
      if (missing.length > 0) {
        console.error(`❌ Missing required indexes on ${item.name}: ${missing.join(', ')}`);
        overallSuccess = false;
      } else {
        console.log(`✅ All required indexes verified for ${item.name}.`);
        
        // Extra validation checks (uniqueness, TTLs, etc.)
        if (item.name === 'ResumeVersion') {
          const uniqueChecksumIdx = indexes.find(idx => idx.name === 'userId_1_checksum_1');
          if (!uniqueChecksumIdx || !uniqueChecksumIdx.unique) {
            console.error('❌ Index userId_1_checksum_1 on ResumeVersion is NOT configured as unique.');
            overallSuccess = false;
          } else {
            console.log('✅ Checked unique checksum constraint.');
          }
        }

        if (item.name === 'PortfolioAnalytics') {
          const uniqueDateIdx = indexes.find(idx => idx.name === 'portfolioId_1_date_1');
          if (!uniqueDateIdx || !uniqueDateIdx.unique) {
            console.error('❌ Index portfolioId_1_date_1 on PortfolioAnalytics is NOT configured as unique.');
            overallSuccess = false;
          } else {
            console.log('✅ Checked daily unique analytics record constraint.');
          }
        }

        if (item.name === 'Notification') {
          const ttlIdx = indexes.find(idx => idx.name === 'createdAt_1');
          if (!ttlIdx || ttlIdx.expireAfterSeconds !== 15552000) {
            console.error(`❌ Index createdAt_1 on Notification has invalid TTL: ${ttlIdx?.expireAfterSeconds}s (expected 15552000s).`);
            overallSuccess = false;
          } else {
            console.log('✅ Checked 180-day alert TTL constraint.');
          }
        }
      }
    }

    if (overallSuccess) {
      console.log('\n🎉 ALL V2.1 DATABASE INDEXES VERIFIED SUCCESSFULLY! 🎉');
      process.exit(0);
    } else {
      console.error('\n❌ Index verification failed. Please inspect errors above.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Index verification encountered an exception:', err);
    process.exit(1);
  }
}

run();
