require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const PortfolioAudit = require('../models/PortfolioAudit');
const AIUsage = require('../models/AIUsage');
const GeminiCache = require('../models/GeminiCache');
const Analytic = require('../models/Analytic');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const ContactMessage = require('../models/ContactMessage');

async function seedData() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/devforge';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  console.log('\nCleaning existing mock data (emails matching *@mockforge.com)...');
  const mockUsers = await User.find({ email: /@mockforge\.com$/ });
  const mockUserIds = mockUsers.map(u => u._id);

  const mockPortfolios = await Portfolio.find({ userId: { $in: mockUserIds } });
  const mockPortfolioIds = mockPortfolios.map(p => p._id);

  await User.deleteMany({ _id: { $in: mockUserIds } });
  await Portfolio.deleteMany({ _id: { $in: mockPortfolioIds } });
  await PortfolioAudit.deleteMany({ portfolioId: { $in: mockPortfolioIds } });
  await AIUsage.deleteMany({ userId: { $in: mockUserIds } });
  await Analytic.deleteMany({ portfolioId: { $in: mockPortfolioIds } });
  await AnalyticsEvent.deleteMany({ portfolioId: { $in: mockPortfolioIds } });
  await ContactMessage.deleteMany({ portfolioId: { $in: mockPortfolioIds } });

  console.log('Cleaned up existing mock datasets successfully.');

  console.log('\nCreating 20 mock users...');
  const users = [];
  
  // 1. Admin
  const admin = new User({
    githubId: 'mock_admin_showcase',
    name: 'Avinash Manager',
    email: 'avinash@mockforge.com',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
    role: 'admin'
  });
  users.push(admin);

  // 2. 19 developers
  const devNames = [
    'Aarav Sharma', 'Aditi Rao', 'Bhavya Patel', 'Chaitanya Reddy', 'Deepika Padukone',
    'Emma Watson', 'John Doe', 'Jane Smith', 'Liam Neeson', 'Sophia Loren',
    'Muhammad Khan', 'Yuki Tanaka', 'Elena Petrova', 'Carlos Santana', 'Amara Diallo',
    'Oliver Twist', 'Lucas Silva', 'Mia Wong', 'Noah Miller'
  ];

  for (let i = 0; i < devNames.length; i++) {
    const name = devNames[i];
    const username = name.toLowerCase().replace(/\s+/g, '_');
    users.push(new User({
      githubId: `mock_user_${username}`,
      name,
      email: `${username}@mockforge.com`,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
      role: 'user'
    }));
  }

  await User.insertMany(users);
  console.log(`Successfully created ${users.length} users (1 Admin, 19 Users).`);

  console.log('\nCreating 30 portfolios...');
  const portfolios = [];
  const themes = ['Modern', 'Professional', 'DarkPro', 'Futuristic'];

  // Add 1-2 portfolios per user to get 30 portfolios
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    // Main portfolio
    portfolios.push(createMockPortfolio(user, 1, themes[i % themes.length]));
    
    // Add secondary portfolio for first 10 users to reach 30 portfolios total
    if (i < 10) {
      portfolios.push(createMockPortfolio(user, 2, themes[(i + 2) % themes.length]));
    }
  }

  await Portfolio.insertMany(portfolios);
  console.log(`Successfully created ${portfolios.length} portfolios.`);

  console.log('\nCreating 50 AI requests logs...');
  const aiLogs = [];
  const features = ['portfolio-generate', 'resume-parse', 'project-summary', 'ats-score', 'rewrite', 'career-fit'];
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];

  for (let i = 0; i < 50; i++) {
    const user = users[i % users.length];
    const feature = features[i % features.length];
    const tokens = Math.floor(Math.random() * 4000) + 800; // 800 to 4800 tokens
    const responseTime = Math.floor(Math.random() * 900) + 150; // 150 to 1050 ms
    const cacheHit = Math.random() < 0.4; // 40% cache hit rate
    const dayOffset = Math.floor(Math.random() * 14); // spread over last 14 days
    const createdAt = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);

    aiLogs.push(new AIUsage({
      userId: user._id,
      feature,
      tokensUsed: tokens,
      responseTime,
      model: models[i % models.length],
      cacheHit,
      createdAt
    }));
  }

  await AIUsage.insertMany(aiLogs);
  console.log(`Successfully created ${aiLogs.length} AI usage logs.`);

  console.log('\nCreating 100 Analytics views and click events...');
  const analyticsSummaries = [];
  const analyticsEvents = [];
  
  const countries = ['United States', 'India', 'Germany', 'United Kingdom', 'Canada', 'Australia', 'Japan'];
  const devices = ['Desktop', 'Mobile', 'Tablet'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const referrers = ['Direct', 'GitHub', 'LinkedIn', 'Google', 'Twitter'];

  for (let i = 0; i < portfolios.length; i++) {
    const portfolio = portfolios[i];
    
    // Accumulate total metrics
    const views = Math.floor(Math.random() * 150) + 10;
    const clicks = Math.floor(Math.random() * (views * 0.4)) + 2;
    const downloads = Math.floor(Math.random() * (views * 0.2)) + 1;
    const submissions = Math.floor(Math.random() * 5);

    analyticsSummaries.push(new Analytic({
      portfolioId: portfolio._id,
      views,
      githubClicks: clicks,
      resumeDownloads: downloads,
      contactSubmissions: submissions
    }));

    // Create detailed time-series events (approx 3 events per portfolio, totaling ~90 events)
    const eventCount = Math.floor(Math.random() * 4) + 2;
    for (let e = 0; e < eventCount; e++) {
      const dayOffset = Math.floor(Math.random() * 14);
      const timestamp = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
      
      analyticsEvents.push(new AnalyticsEvent({
        portfolioId: portfolio._id,
        type: ['view', 'github_click', 'resume_download'][e % 3],
        country: countries[Math.floor(Math.random() * countries.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        timestamp
      }));
    }
  }

  await Analytic.insertMany(analyticsSummaries);
  await AnalyticsEvent.insertMany(analyticsEvents);
  console.log(`Successfully created ${analyticsSummaries.length} Analytics summaries & ${analyticsEvents.length} Analytics events.`);

  console.log('\nCreating 20 contact inquiry messages...');
  const messages = [];
  const userEmails = ['hiring@techcorp.com', 'recruit@startuphub.io', 'avocado@dev.com', 'engineer@google.com'];
  const questionTexts = [
    'Impressive portfolio! Are you open to freelance projects?',
    'Hi, we are looking for a full stack developer for our team. Let us know if you are open to opportunities.',
    'I loved the layout of your projects. Let us schedule a brief call this week!',
    'Hello, do you have experience with Kubernetes container scaling?'
  ];

  for (let i = 0; i < 20; i++) {
    const portfolio = portfolios[i % portfolios.length];
    messages.push(new ContactMessage({
      portfolioId: portfolio._id,
      name: `Recruiter #${i + 1}`,
      email: userEmails[i % userEmails.length],
      message: questionTexts[i % questionTexts.length],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
    }));
  }

  await ContactMessage.insertMany(messages);
  console.log(`Successfully created ${messages.length} ContactMessages.`);

  console.log('\nClosing MongoDB connection...');
  await mongoose.disconnect();
  console.log('Seeding completed successfully!');
}

function createMockPortfolio(user, indexNum, themeName) {
  const rating = Math.floor(Math.random() * 25) + 70; // 70 to 95
  return new Portfolio({
    userId: user._id,
    title: indexNum === 1 ? `${user.name} - Software Engineer Portfolio` : `${user.name} - Lab Projects`,
    theme: themeName,
    markdown: `# ${user.name}\n\n## Professional Summary\nPassionate full stack developer specializing in highly interactive layouts.\n\n## Tech Stack\n- Frontend: React, Redux, Tailwind\n- Backend: Node, Express, MongoDB\n\n## Projects\n### DevForge AI Showcase\nAutomated SaaS builder.`,
    score: {
      overall: rating,
      design: rating - 2,
      content: rating + 3,
      seoScore: rating - 1,
      projectsScore: rating + 1,
      feedback: ['Add more metrics to describe project impacts.', 'Include structured JSON-LD data.']
    },
    parsedData: {
      name: user.name,
      email: user.email,
      skills: ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB'],
      education: [{ school: 'State University', degree: 'Computer Science B.S.', year: '2025' }],
      projects: [{ title: 'SaaS Platform', description: 'Automated portfolio deployments', techStack: ['React', 'Node'] }]
    },
    deploymentUrl: `https://${user.githubId.replace('mock_user_', '')}.github.io/devforge-portfolio`,
    githubRepoName: 'devforge-portfolio'
  });
}

seedData().catch(err => {
  console.error('Seeder crashed:', err);
  mongoose.disconnect();
});
