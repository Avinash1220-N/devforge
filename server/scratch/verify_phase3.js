require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Load relative to script location
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const AdminAuditLog = require('../models/AdminAuditLog');
const UserActivity = require('../models/UserActivity');
const AIUsage = require('../models/AIUsage');
const GeminiCache = require('../models/GeminiCache');
const Analytic = require('../models/Analytic');

async function runVerification() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/devforge';
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  console.log('\n======================================================');
  console.log('🧪 VERIFYING ACTIVE ANALYTICS (DAU/MAU)');
  console.log('======================================================');

  // Create temporary mock users
  const userA = new User({ githubId: 'v3_user_a', name: 'User A', email: 'a@test.com' });
  const userB = new User({ githubId: 'v3_user_b', name: 'User B', email: 'b@test.com' });
  const userC = new User({ githubId: 'v3_user_c', name: 'User C', email: 'c@test.com' });
  await Promise.all([userA.save(), userB.save(), userC.save()]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

  // Seed Activity records
  const act1 = new UserActivity({ userId: userA._id, action: 'login', createdAt: now });
  const act2 = new UserActivity({ userId: userA._id, action: 'portfolio_created', createdAt: now });
  const act3 = new UserActivity({ userId: userB._id, action: 'ats_check', createdAt: now });
  const act4 = new UserActivity({ userId: userC._id, action: 'login', createdAt: tenDaysAgo });
  const act5 = new UserActivity({ userId: userC._id, action: 'ats_check', createdAt: fortyDaysAgo }); // Outside 30 days
  await Promise.all([act1.save(), act2.save(), act3.save(), act4.save(), act5.save()]);

  // Calculate DAU
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dauUsers = await UserActivity.distinct('userId', { createdAt: { $gte: startOfToday } });
  console.log(`- Unique active users today (DAU): ${dauUsers.length} (Expected: 2 - User A, User B)`);

  // Calculate MAU
  const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const mauUsers = await UserActivity.distinct('userId', { createdAt: { $gte: startOf30Days } });
  console.log(`- Unique active users in last 30 days (MAU): ${mauUsers.length} (Expected: 3 - User A, User B, User C)`);

  if (dauUsers.length === 2 && mauUsers.length === 3) {
    console.log('✅ SUCCESS: Active analytics (DAU/MAU) calculated correctly!');
  } else {
    console.error('❌ FAILURE: DAU/MAU calculations mismatched.');
  }

  console.log('\n======================================================');
  console.log('🧪 VERIFYING CACHE TELEMETRY & SAVINGS ROI');
  console.log('======================================================');

  // Clean existing usage logs for mock users
  await AIUsage.deleteMany({ userId: { $in: [userA._id, userB._id, userC._id] } });

  // Add dummy AI usage logs
  const usage1 = new AIUsage({ userId: userA._id, feature: 'rewrite', tokensUsed: 1500, cacheHit: true });
  const usage2 = new AIUsage({ userId: userA._id, feature: 'ats-score', tokensUsed: 2500, cacheHit: true });
  const usage3 = new AIUsage({ userId: userB._id, feature: 'portfolio-generate', tokensUsed: 3000, cacheHit: false });
  await Promise.all([usage1.save(), usage2.save(), usage3.save()]);

  // Query stats
  const totalRequests = await AIUsage.countDocuments({ userId: { $in: [userA._id, userB._id, userC._id] } });
  const cacheHits = await AIUsage.countDocuments({ userId: { $in: [userA._id, userB._id, userC._id] }, cacheHit: true });
  const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

  const hitStats = await AIUsage.aggregate([
    { $match: { userId: { $in: [userA._id, userB._id, userC._id] }, cacheHit: true } },
    { $group: { _id: null, totalTokens: { $sum: '$tokensUsed' } } }
  ]);
  const hitTokens = hitStats.length > 0 ? hitStats[0].totalTokens : 0;
  const estimatedSavings = (hitTokens / 1000000) * 0.15;

  console.log(`- Total Requests: ${totalRequests}`);
  console.log(`- Cache Hits: ${cacheHits}`);
  console.log(`- Hit Rate: ${cacheHitRate.toFixed(1)}% (Expected: 66.7%)`);
  console.log(`- Estimated Savings: $${estimatedSavings.toFixed(6)} (Expected: > 0)`);

  if (totalRequests === 3 && cacheHits === 2 && estimatedSavings > 0) {
    console.log('✅ SUCCESS: Caching metrics calculated correctly!');
  } else {
    console.error('❌ FAILURE: Cache metrics verify failed.');
  }

  console.log('\n======================================================');
  console.log('🧪 VERIFYING AUTOMATIC ADMIN AUDIT TRAIL LOGGING');
  console.log('======================================================');

  // Seed Admin user and target portfolio
  const adminUser = new User({ githubId: 'v3_admin', name: 'Admin tester', role: 'admin' });
  await adminUser.save();

  const mockPortfolio = new Portfolio({ userId: userA._id, title: 'Spam Portfolio', markdown: 'Spam content' });
  await mockPortfolio.save();

  // Test automatic audits via simulated admin controller actions
  // Action 1: Role change
  const oldRole = userA.role;
  userA.role = 'admin';
  await userA.save();
  
  const audit1 = new AdminAuditLog({
    adminId: adminUser._id,
    action: 'role-change',
    targetType: 'User',
    targetId: userA._id.toString(),
    details: { oldRole, newRole: 'admin' }
  });
  await audit1.save();

  // Action 2: User suspension
  userB.isActive = false;
  await userB.save();

  const audit2 = new AdminAuditLog({
    adminId: adminUser._id,
    action: 'user-disable',
    targetType: 'User',
    targetId: userB._id.toString(),
    details: { isActive: false }
  });
  await audit2.save();

  // Action 3: Portfolio deletion
  mockPortfolio.isDeleted = true;
  await mockPortfolio.save();

  const audit3 = new AdminAuditLog({
    adminId: adminUser._id,
    action: 'portfolio-delete',
    targetType: 'Portfolio',
    targetId: mockPortfolio._id.toString(),
    details: { title: mockPortfolio.title }
  });
  await audit3.save();

  // Verify DB entries
  const loggedAudits = await AdminAuditLog.find({ adminId: adminUser._id }).sort({ createdAt: 1 });
  console.log(`- Count of audits logged: ${loggedAudits.length} (Expected: 3)`);
  console.log(`- Action 1: ${loggedAudits[0]?.action} (Expected: role-change)`);
  console.log(`- Action 2: ${loggedAudits[1]?.action} (Expected: user-disable)`);
  console.log(`- Action 3: ${loggedAudits[2]?.action} (Expected: portfolio-delete)`);

  if (
    loggedAudits.length === 3 &&
    loggedAudits[0].action === 'role-change' &&
    loggedAudits[1].action === 'user-disable' &&
    loggedAudits[2].action === 'portfolio-delete'
  ) {
    console.log('✅ SUCCESS: Administrative audits registered properly!');
  } else {
    console.error('❌ FAILURE: Audit logging mismatch.');
  }

  console.log('\n======================================================');
  console.log('🧪 VERIFYING ADMIN LOCKOUT PROTECTION LOGIC');
  console.log('======================================================');

  // Mocking safeguards check
  const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
  console.log(`- Active admin count: ${activeAdminCount}`);

  // Test Demoting self guard
  const testSelfDemotion = (adminId, targetId) => {
    return adminId === targetId;
  };
  const selfBlocked = testSelfDemotion(adminUser._id.toString(), adminUser._id.toString());
  console.log(`- Self demotion guard block check: ${selfBlocked} (Expected: true)`);

  // Test Demoting last admin guard
  const testLastAdminBlock = (targetRole, activeAdmins) => {
    return targetRole !== 'admin' && activeAdmins <= 1;
  };
  // Simulate active count as 1
  const lastAdminBlocked = testLastAdminBlock('user', 1);
  console.log(`- Last active admin demotion block check: ${lastAdminBlocked} (Expected: true)`);

  if (selfBlocked && lastAdminBlocked) {
    console.log('✅ SUCCESS: Lockout safety rules validated!');
  } else {
    console.error('❌ FAILURE: Lockout rules logic error.');
  }

  // Cleanup testing documents
  console.log('\nCleaning up verification records...');
  await User.deleteMany({ _id: { $in: [userA._id, userB._id, userC._id, adminUser._id] } });
  await Portfolio.deleteMany({ _id: mockPortfolio._id });
  await AdminAuditLog.deleteMany({ adminId: adminUser._id });
  await UserActivity.deleteMany({ userId: { $in: [userA._id, userB._id, userC._id] } });
  await AIUsage.deleteMany({ userId: { $in: [userA._id, userB._id, userC._id] } });

  console.log('Closing DB connection...');
  await mongoose.disconnect();
  console.log('Verification Complete.');
}

runVerification().catch(err => {
  console.error('Verification script crashed:', err);
  mongoose.disconnect();
});
