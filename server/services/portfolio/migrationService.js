const User = require('../../models/User');

// Helper to map skill name to preset categories
const SKILL_CATEGORY_MAP = {
  // Languages
  'javascript': 'Languages', 'typescript': 'Languages', 'python': 'Languages', 'go': 'Languages', 
  'golang': 'Languages', 'rust': 'Languages', 'c++': 'Languages', 'java': 'Languages', 
  'ruby': 'Languages', 'php': 'Languages', 'c': 'Languages', 'html': 'Languages', 'css': 'Languages',
  // Frameworks
  'react': 'Frameworks', 'react.js': 'Frameworks', 'next.js': 'Frameworks', 'vue': 'Frameworks', 
  'vue.js': 'Frameworks', 'angular': 'Frameworks', 'svelte': 'Frameworks', 'express': 'Frameworks', 
  'express.js': 'Frameworks', 'django': 'Frameworks', 'flask': 'Frameworks', 'fastapi': 'Frameworks',
  // Databases
  'mongodb': 'Databases', 'postgresql': 'Databases', 'mysql': 'Databases', 'sqlite': 'Databases', 
  'redis': 'Databases', 'cassandra': 'Databases', 'dynamodb': 'Databases',
  // Cloud & DevOps
  'aws': 'Cloud', 'azure': 'Cloud', 'gcp': 'Cloud', 'docker': 'DevOps', 'kubernetes': 'DevOps', 
  'jenkins': 'DevOps', 'gitlab': 'DevOps', 'ci/cd': 'DevOps', 'terraform': 'DevOps',
  // AI / ML
  'tensorflow': 'AI / ML', 'pytorch': 'AI / ML', 'keras': 'AI / ML', 'opencv': 'AI / ML', 
  'mediapipe': 'AI / ML', 'numpy': 'AI / ML', 'pandas': 'AI / ML', 'scikit-learn': 'AI / ML',
  // Tools
  'git': 'Tools', 'github': 'Tools', 'jira': 'Tools', 'agile': 'Tools', 'scrum': 'Tools', 'vscode': 'Tools'
};

// Helper to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapSkillCategory(skillName) {
  if (!skillName) return 'Tools';
  const normalized = skillName.toLowerCase().trim();
  
  // Try exact match first
  if (SKILL_CATEGORY_MAP[normalized]) {
    return SKILL_CATEGORY_MAP[normalized];
  }
  
  // Sort keys by length descending to match longer keywords first (e.g. 'react' before 'c')
  const sortedKeys = Object.keys(SKILL_CATEGORY_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    // If key is short (<= 2 chars), use word boundary regex to avoid false positives (e.g. 'c' in 'custom')
    if (key.length <= 2) {
      const regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'i');
      if (regex.test(normalized)) {
        return SKILL_CATEGORY_MAP[key];
      }
    } else {
      if (normalized.includes(key)) {
        return SKILL_CATEGORY_MAP[key];
      }
    }
  }
  return 'Tools';
}

/**
 * Migrates a legacy Phase 1-3 portfolio document to V2.1 structuredData format.
 * 
 * @param {object} portfolioDoc - The Portfolio Mongoose document instance
 * @returns {Promise<boolean>} - True if migration was applied, false otherwise
 */
async function migrateV1ToV21(portfolioDoc) {
  // Check if already migrated
  if (portfolioDoc.structuredDataVersion === '2.1' && portfolioDoc.structuredData && portfolioDoc.structuredData.personalInfo && portfolioDoc.structuredData.personalInfo.fullName) {
    return false;
  }

  console.log(`Migrating legacy portfolio for user: ${portfolioDoc.userId}`);

  // Fetch associated user if possible to retrieve fallback details
  const user = await User.findById(portfolioDoc.userId);
  const userEmail = user ? user.email : '';
  const userName = user ? user.name : '';
  const userAvatar = user ? user.avatarUrl : '';

  const parsed = portfolioDoc.parsedData || {};

  // 1. Build Personal Info
  const personalInfo = {
    fullName: parsed.name || userName || portfolioDoc.title.replace(' - Professional Portfolio', '') || 'Developer',
    email: parsed.email || userEmail || '',
    title: portfolioDoc.title || 'Software Engineer',
    headline: parsed.tagline || 'Software Engineer',
    summary: parsed.summary || 'Passionate software engineer specializing in developer solutions.',
    availability: 'Open to Work',
    photoUrl: userAvatar || '',
    resumeUrl: ''
  };

  // 2. Build Socials (Extract from parsed contact if possible)
  const socials = {
    githubUrl: '',
    linkedinUrl: '',
    portfolioWebsite: '',
    leetCode: '',
    codeChef: '',
    codeforces: '',
    hackerRank: '',
    kaggle: '',
    medium: '',
    youtube: ''
  };

  // 3. Build Skills
  const skills = (parsed.skills || []).map(skillName => ({
    name: skillName,
    category: mapSkillCategory(skillName),
    level: 'Intermediate'
  }));

  // 4. Build Education
  const education = (parsed.education || []).map(edu => ({
    institution: edu.school || 'Institution',
    degree: edu.degree || 'Degree',
    specialization: '',
    location: '',
    cgpa: '',
    percentage: '',
    coursework: [],
    websiteUrl: '',
    logoUrl: '',
    startDate: '',
    endDate: edu.year || '',
    description: '',
    tags: []
  }));

  // 5. Build Experience
  const experience = (parsed.experience || []).map(exp => {
    // Attempt metrics extraction (e.g. "Reduced latency by 40%")
    const metrics = [];
    const cleanBullets = [];
    
    (exp.bullets || []).forEach(bullet => {
      const metricMatch = bullet.match(/(reduced|increased|optimized|served|saved|cut)\s+\w+\s+by\s+(\d+%|\d+\+?)/i);
      if (metricMatch) {
        metrics.push({
          label: bullet.split('by').shift().replace(/^\-\s*/, '').trim(),
          value: metricMatch[2]
        });
      }
      cleanBullets.push(bullet);
    });

    return {
      role: exp.role || 'Software Engineer',
      company: exp.company || 'Company',
      location: '',
      websiteUrl: '',
      logoUrl: '',
      employmentType: 'Full-Time',
      startDate: '',
      endDate: exp.duration || '',
      description: cleanBullets.join('\n'),
      skillsUsed: [],
      metrics
    };
  });

  // 6. Build Projects
  const projects = (parsed.projects || []).map(proj => ({
    title: proj.title || 'Project Name',
    description: proj.description || 'Description of the project accomplishments.',
    techStack: proj.techStack || [],
    githubUrl: '',
    liveUrl: '',
    videoDemoUrl: '',
    screenshots: [],
    architectureDiagramUrl: '',
    teamSize: 1,
    duration: '',
    role: '',
    metrics: [],
    recruiterSummary: '',
    resumeBullets: []
  }));

  // Assign V2.1 structuredData structure
  portfolioDoc.structuredData = {
    personalInfo,
    socials,
    skills,
    education,
    experience,
    projects,
    activities: [],
    achievements: [],
    certifications: [],
    publications: [],
    customSections: []
  };

  // Convert old SEO parameters
  if (portfolioDoc.seo) {
    portfolioDoc.seoSettings = {
      metaTitle: portfolioDoc.seo.title || personalInfo.title,
      metaDescription: portfolioDoc.seo.description || personalInfo.summary,
      openGraph: {
        title: portfolioDoc.seo.title || personalInfo.title,
        description: portfolioDoc.seo.description || personalInfo.summary,
        imageUrl: personalInfo.photoUrl
      },
      twitterCard: {
        title: portfolioDoc.seo.title || personalInfo.title,
        description: portfolioDoc.seo.description || personalInfo.summary,
        imageUrl: personalInfo.photoUrl
      },
      structuredDataJsonLd: portfolioDoc.seo.structuredData || '',
      canonicalUrl: ''
    };
  }

  // Update status tracks
  portfolioDoc.structuredDataVersion = '2.1';
  portfolioDoc.draftStatus = 'published'; // Default legacy portfolios to published
  
  // Track migration logs
  portfolioDoc.migrationHistory.push({
    from: '1.0',
    to: '2.1',
    migratedAt: new Date()
  });

  // Mark modified
  portfolioDoc.markModified('structuredData');
  portfolioDoc.markModified('seoSettings');
  portfolioDoc.markModified('migrationHistory');

  await portfolioDoc.save();
  console.log(`Successfully migrated legacy portfolio to V2.1 structure.`);
  return true;
}

module.exports = {
  migrateV1ToV21
};
