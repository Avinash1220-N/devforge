require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { migrateV1ToV21 } = require('../services/portfolio/migrationService');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/devforge';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected.');

    // 1. Create a mock user
    console.log('Creating mock user...');
    const mockUser = new User({
      githubId: 'mock_legacy_user_id',
      name: 'Avinash Legacy',
      email: 'legacy@mockforge.com',
      avatarUrl: 'https://avatar.url/image.png'
    });
    await mockUser.save();

    // 2. Create a legacy (Phase 1-3) portfolio document
    console.log('Creating mock legacy portfolio...');
    const legacyPortfolio = new Portfolio({
      userId: mockUser._id,
      markdown: '# Avinash Legacy\n\n## Summary\nLegacy developer bio.',
      title: 'Avinash Legacy - Professional Portfolio',
      theme: 'DarkPro',
      seo: {
        title: 'Legacy Title Meta',
        description: 'Legacy Description Meta',
        keywords: ['legacy', 'test'],
        structuredData: '{ "@context": "https://schema.org" }'
      },
      parsedData: {
        name: 'Avinash Legacy Mapped',
        email: 'legacy-mapped@mockforge.com',
        skills: ['React.js', 'Python', 'Docker', 'CustomUnknownSkill'],
        education: [
          { school: 'Legacy University', degree: 'M.S. Software Engineering', year: '2024' }
        ],
        projects: [
          { title: 'Legacy Recognition App', description: 'Visual gesture tracking app.', techStack: ['Python', 'OpenCV'] }
        ],
        experience: [
          { company: 'Legacy Soft Inc', role: 'Staff ML Engineer', duration: '2022 - 2024', bullets: ['Developed algorithms.', 'Reduced latency by 45%'] }
        ]
      }
    });

    // Save bypassing validations if necessary, but standard save is fine since fields match schema
    // In Mongoose, saving schema with extra fields will ignore them, but our modified Portfolio Schema keeps legacy parsedData
    await legacyPortfolio.save();
    console.log('Mock legacy portfolio saved.');

    // 3. Run migration
    console.log('Running migration service...');
    const migrated = await migrateV1ToV21(legacyPortfolio);
    console.log(`Migration service result: ${migrated}`);

    // 4. Reload and assert mappings
    const reloaded = await Portfolio.findById(legacyPortfolio._id);

    console.log('\nDEBUG - reloaded structuredData.skills:', JSON.stringify(reloaded.structuredData.skills, null, 2));
    console.log('DEBUG - legacyPortfolio structuredData.skills:', JSON.stringify(legacyPortfolio.structuredData.skills, null, 2));

    console.log('\nValidating assertions...');
    let success = true;

    // Validate structuredDataVersion
    if (reloaded.structuredDataVersion !== '2.1') {
      console.error(`❌ Expected structuredDataVersion '2.1', got: ${reloaded.structuredDataVersion}`);
      success = false;
    }

    // Validate Personal Info
    const info = reloaded.structuredData.personalInfo;
    if (info.fullName !== 'Avinash Legacy Mapped') {
      console.error(`❌ Expected fullName 'Avinash Legacy Mapped', got: ${info.fullName}`);
      success = false;
    }
    if (info.email !== 'legacy-mapped@mockforge.com') {
      console.error(`❌ Expected email 'legacy-mapped@mockforge.com', got: ${info.email}`);
      success = false;
    }
    if (info.photoUrl !== 'https://avatar.url/image.png') {
      console.error(`❌ Expected photoUrl 'https://avatar.url/image.png', got: ${info.photoUrl}`);
      success = false;
    }

    // Validate Skills Categories
    const skills = reloaded.structuredData.skills;
    const reactSkill = skills.find(s => s.name === 'React.js');
    const pythonSkill = skills.find(s => s.name === 'Python');
    const dockerSkill = skills.find(s => s.name === 'Docker');
    const customSkill = skills.find(s => s.name === 'CustomUnknownSkill');

    if (!reactSkill || reactSkill.category !== 'Frameworks') {
      console.error(`❌ React.js skill should map to 'Frameworks'. Got: ${reactSkill?.category}`);
      success = false;
    }
    if (!pythonSkill || pythonSkill.category !== 'Languages') {
      console.error(`❌ Python skill should map to 'Languages'. Got: ${pythonSkill?.category}`);
      success = false;
    }
    if (!dockerSkill || dockerSkill.category !== 'DevOps') {
      console.error(`❌ Docker skill should map to 'DevOps'. Got: ${dockerSkill?.category}`);
      success = false;
    }
    if (!customSkill || customSkill.category !== 'Tools') {
      console.error(`❌ Unknown skill should map to default 'Tools'. Got: ${customSkill?.category}`);
      success = false;
    }

    // Validate Experience & Metrics Extraction
    const experience = reloaded.structuredData.experience[0];
    if (!experience || experience.company !== 'Legacy Soft Inc' || experience.role !== 'Staff ML Engineer') {
      console.error('❌ Mapped experience entry is corrupted or missing.');
      success = false;
    }
    if (experience.endDate !== '2022 - 2024') {
      console.error(`❌ Mapped endDate should equal duration '2022 - 2024'. Got: ${experience.endDate}`);
      success = false;
    }
    
    // Check metric extraction
    const latencyMetric = experience.metrics.find(m => m.value === '45%');
    if (!latencyMetric || !latencyMetric.label.includes('Reduced latency')) {
      console.error('❌ Expected metric mapping of "Reduced latency" to "45%" value was not extracted correctly.');
      console.log('Found metrics:', experience.metrics);
      success = false;
    }

    // Validate Projects
    const project = reloaded.structuredData.projects[0];
    if (!project || project.title !== 'Legacy Recognition App' || !project.techStack.includes('OpenCV')) {
      console.error('❌ Project mapping failed.');
      success = false;
    }

    // Validate SEO
    if (reloaded.seoSettings.metaTitle !== 'Legacy Title Meta' || reloaded.seoSettings.openGraph.title !== 'Legacy Title Meta') {
      console.error('❌ SEO parameters were not migrated correctly.');
      success = false;
    }

    // Validate Migration History
    if (reloaded.migrationHistory.length !== 1 || reloaded.migrationHistory[0].from !== '1.0' || reloaded.migrationHistory[0].to !== '2.1') {
      console.error('❌ Migration history log is invalid.');
      success = false;
    }

    // 5. Cleanup
    console.log('\nCleaning up mock records...');
    await User.findByIdAndDelete(mockUser._id);
    await Portfolio.findByIdAndDelete(reloaded._id);
    console.log('Cleanup completed.');

    if (success) {
      console.log('\n🎉 LEGACY SCHEMA MIGRATION VALIDATED SUCCESSFULLY! 🎉');
      process.exit(0);
    } else {
      console.error('\n❌ Legacy migration validation failed. Check assertions.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Migration verification encountered an exception:', err);
    process.exit(1);
  }
}

run();
