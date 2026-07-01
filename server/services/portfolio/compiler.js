/**
 * Compiles a structuredData JSON profile structure into clean, standard Markdown.
 * 
 * @param {object} data - The structuredData JSON profile
 * @param {object} [options] - Compiler configurations (custom CSS / theme Settings)
 * @returns {string} - Compiled Markdown output
 */
function compileStructuredDataToMarkdown(data, options = {}) {
  if (!data) return '';

  let markdown = '';

  // 1. Name & Headline
  const info = data.personalInfo || {};
  if (info.fullName) {
    markdown += `# ${info.fullName}\n`;
  } else {
    markdown += `# Developer\n`;
  }

  if (info.headline) {
    markdown += `${info.headline}\n\n`;
  } else if (info.title) {
    markdown += `${info.title}\n\n`;
  }

  if (info.summary) {
    markdown += `${info.summary}\n\n`;
  }

  // 2. Skills
  const skills = data.skills || [];
  if (skills.length > 0) {
    markdown += `## Technical Skills\n`;
    
    // Group skills by category
    const categories = {};
    skills.forEach(skill => {
      const cat = skill.category || 'Tools';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(skill.name);
    });

    for (const [category, names] of Object.entries(categories)) {
      markdown += `- **${category}**: ${names.join(', ')}\n`;
    }
    markdown += `\n`;
  }

  // 3. Experience
  const experience = data.experience || [];
  if (experience.length > 0) {
    markdown += `## Work Experience\n`;
    experience.forEach(exp => {
      markdown += `### ${exp.role} at ${exp.company}\n`;
      if (exp.startDate || exp.endDate) {
        const start = exp.startDate || '';
        const end = exp.endDate || 'Present';
        markdown += `*Duration: ${start} - ${end}*\n`;
      }
      
      if (exp.metrics && exp.metrics.length > 0) {
        markdown += `*Metrics*:\n`;
        exp.metrics.forEach(m => {
          markdown += `- **${m.label}**: ${m.value}\n`;
        });
      }

      if (exp.description) {
        // Print description lines as bullets or formatted blocks
        const lines = exp.description.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed) {
            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
              markdown += `${trimmed}\n`;
            } else {
              markdown += `- ${trimmed}\n`;
            }
          }
        });
      }
      markdown += `\n`;
    });
  }

  // 4. Projects
  const projects = data.projects || [];
  if (projects.length > 0) {
    markdown += `## Featured Projects\n`;
    projects.forEach(proj => {
      markdown += `### ${proj.title}\n`;
      markdown += `${proj.description}\n`;
      
      if (proj.techStack && proj.techStack.length > 0) {
        markdown += `- **Tech**: ${proj.techStack.join(', ')}\n`;
      }

      if (proj.metrics && proj.metrics.length > 0) {
        markdown += `- **Metrics**:\n`;
        proj.metrics.forEach(m => {
          markdown += `  - ${m.label}: ${m.value}\n`;
        });
      }

      const links = [];
      if (proj.githubUrl) links.push(`[GitHub Repository](${proj.githubUrl})`);
      if (proj.liveUrl) links.push(`[Live Showcase](${proj.liveUrl})`);
      if (proj.videoDemoUrl) links.push(`[Demo Video](${proj.videoDemoUrl})`);

      if (links.length > 0) {
        markdown += `- **Links**: ${links.join(' | ')}\n`;
      }
      markdown += `\n`;
    });
  }

  // 5. Education
  const education = data.education || [];
  if (education.length > 0) {
    markdown += `## Education\n`;
    education.forEach(edu => {
      markdown += `### ${edu.degree} in ${edu.specialization || 'Software Engineering'}\n`;
      markdown += `**${edu.institution}**\n`;
      if (edu.startDate || edu.endDate) {
        markdown += `*${edu.startDate || ''} - ${edu.endDate || ''}*\n`;
      }
      if (edu.cgpa) markdown += `- Grade: CGPA ${edu.cgpa}\n`;
      else if (edu.percentage) markdown += `- Grade: ${edu.percentage}%\n`;
      
      if (edu.description) {
        markdown += `${edu.description}\n`;
      }
      markdown += `\n`;
    });
  }

  // 6. Certifications
  const certifications = data.certifications || [];
  if (certifications.length > 0) {
    markdown += `## Certifications\n`;
    certifications.forEach(cert => {
      markdown += `- **${cert.name}** issued by *${cert.issuer}* (${cert.issueDate || ''})\n`;
      if (cert.verificationLink || cert.credentialUrl) {
        markdown += `  - [Credential Verification](${cert.verificationLink || cert.credentialUrl})\n`;
      }
    });
    markdown += `\n`;
  }

  // 7. Publications
  const publications = data.publications || [];
  if (publications.length > 0) {
    markdown += `## Publications\n`;
    publications.forEach(pub => {
      let line = `- *"${pub.title}"*`;
      if (pub.authors && pub.authors.length > 0) {
        line += ` by ${pub.authors.join(', ')}`;
      }
      if (pub.conferenceOrJournal) {
        line += `, published in *${pub.conferenceOrJournal}*`;
      }
      if (pub.year) {
        line += ` (${pub.year})`;
      }
      if (pub.paperUrl || pub.doi) {
        line += ` - [Paper Link](${pub.paperUrl || 'https://doi.org/' + pub.doi})`;
      }
      markdown += `${line}\n`;
    });
    markdown += `\n`;
  }

  // 8. Custom Sections
  const customSections = data.customSections || [];
  if (customSections.length > 0) {
    customSections.forEach(section => {
      markdown += `## ${section.sectionTitle}\n`;
      markdown += `${section.contentMarkdown}\n\n`;
    });
  }

  // 9. Social Links & Contact Fallback Info
  const socials = data.socials || {};
  const hasSocials = Object.values(socials).some(Boolean);

  if (info.email || info.phone || info.location || hasSocials) {
    markdown += `## Get In Touch\n`;
    if (info.email) markdown += `- Email: [${info.email}](mailto:${info.email})\n`;
    if (info.phone) markdown += `- Phone: ${info.phone}\n`;
    if (info.location) markdown += `- Location: ${info.location}\n`;
    
    if (socials.linkedinUrl) markdown += `- LinkedIn: [LinkedIn Profile](${socials.linkedinUrl})\n`;
    if (socials.githubUrl) markdown += `- GitHub: [GitHub Profile](${socials.githubUrl})\n`;
    if (socials.leetCode) markdown += `- LeetCode: [LeetCode Profile](${socials.leetCode})\n`;
    if (socials.medium) markdown += `- Medium: [Medium Profile](${socials.medium})\n`;
    
    markdown += `\n`;
  }

  return markdown.trim();
}

module.exports = {
  compileStructuredDataToMarkdown
};
