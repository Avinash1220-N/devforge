/**
 * Parses Markdown text and returns a structured V2.1 structuredData JSON profile.
 * 
 * @param {string} markdown - The raw markdown text
 * @returns {object} - Mapped structuredData JSON profile
 */
function parseMarkdownToStructuredData(markdown) {
  const result = {
    personalInfo: {
      photoUrl: '',
      fullName: 'Developer',
      title: 'Software Engineer',
      headline: '',
      summary: '',
      availability: 'Open to Work',
      resumeUrl: ''
    },
    socials: {
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
    },
    skills: [],
    education: [],
    experience: [],
    projects: [],
    activities: [],
    achievements: [],
    certifications: [],
    publications: [],
    customSections: []
  };

  if (!markdown) return result;

  const lines = markdown.split('\n');
  let currentSection = '';
  let currentProject = null;
  let currentJob = null;
  let currentEdu = null;
  let introLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. Check for Name (H1)
    if (line.startsWith('# ') && !line.startsWith('##')) {
      result.personalInfo.fullName = line.replace('# ', '').trim();
      continue;
    }

    // 2. Check for Section Headers (H2)
    if (line.startsWith('## ')) {
      const headerText = line.replace('## ', '').trim().toLowerCase();

      // Push prior buffers
      if (currentProject) { result.projects.push(currentProject); currentProject = null; }
      if (currentJob) { result.experience.push(currentJob); currentJob = null; }
      if (currentEdu) { result.education.push(currentEdu); currentEdu = null; }

      if (headerText.includes('skill')) {
        currentSection = 'skills';
      } else if (headerText.includes('project')) {
        currentSection = 'projects';
      } else if (headerText.includes('experience') || headerText.includes('work') || headerText.includes('employment')) {
        currentSection = 'experience';
      } else if (headerText.includes('education') || headerText.includes('academic')) {
        currentSection = 'education';
      } else if (headerText.includes('certificat')) {
        currentSection = 'certifications';
      } else if (headerText.includes('publication')) {
        currentSection = 'publications';
      } else if (headerText.includes('get in touch') || headerText.includes('contact')) {
        currentSection = 'contact';
      } else {
        currentSection = 'custom';
        result.customSections.push({
          sectionTitle: line.replace('## ', '').trim(),
          contentMarkdown: ''
        });
      }
      continue;
    }

    // 3. Check for Subsections (H3)
    if (line.startsWith('### ')) {
      const subheaderText = line.replace('### ', '').trim();

      if (currentSection === 'projects') {
        if (currentProject) result.projects.push(currentProject);
        currentProject = {
          title: subheaderText,
          description: '',
          techStack: [],
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
        };
      } else if (currentSection === 'experience') {
        if (currentJob) result.experience.push(currentJob);
        
        let role = subheaderText;
        let company = 'Company';
        if (subheaderText.toLowerCase().includes(' at ')) {
          const parts = subheaderText.split(/ at /i);
          role = parts[0].trim();
          company = parts[1].trim();
        } else if (subheaderText.includes(' - ')) {
          const parts = subheaderText.split(' - ');
          company = parts[0].trim();
          role = parts[1].trim();
        }

        currentJob = {
          role,
          company,
          location: '',
          websiteUrl: '',
          logoUrl: '',
          employmentType: 'Full-Time',
          startDate: '',
          endDate: '',
          description: '',
          skillsUsed: [],
          metrics: []
        };
      } else if (currentSection === 'education') {
        if (currentEdu) result.education.push(currentEdu);
        currentEdu = {
          degree: subheaderText,
          institution: 'Institution',
          specialization: '',
          location: '',
          cgpa: '',
          percentage: '',
          coursework: [],
          websiteUrl: '',
          logoUrl: '',
          startDate: '',
          endDate: '',
          description: '',
          tags: []
        };
      }
      continue;
    }

    // 4. Parse content elements
    if (currentSection === '') {
      introLines.push(line);
    } else if (currentSection === 'skills') {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const rawLine = line.substring(2).trim();
        if (rawLine.includes(':')) {
          const parts = rawLine.split(':');
          const categoryName = parts[0].replace(/[\*\_\-\#]/g, '').trim();
          const skillNames = parts[1].split(',').map(s => s.trim()).filter(Boolean);
          
          skillNames.forEach(skillName => {
            result.skills.push({
              name: skillName,
              category: mapCategoryName(categoryName),
              level: 'Intermediate'
            });
          });
        } else {
          result.skills.push({
            name: rawLine,
            category: 'Tools',
            level: 'Intermediate'
          });
        }
      }
    } else if (currentSection === 'projects' && currentProject) {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const rawLine = line.substring(2).trim();
        
        // Match tech stack
        if (rawLine.toLowerCase().startsWith('tech:') || rawLine.toLowerCase().startsWith('technologies:')) {
          const techText = rawLine.replace(/^(tech|technologies)\s*:\s*/i, '').trim();
          currentProject.techStack = techText.split(',').map(t => t.trim()).filter(Boolean);
        }
        // Match metrics
        else if (rawLine.toLowerCase().startsWith('metrics:')) {
          // Flag for potential nested metrics lines
        } 
        // Match links
        else if (rawLine.toLowerCase().startsWith('links:')) {
          const linksText = rawLine.replace(/^links\s*:\s*/i, '').trim();
          // Extract links matching [Text](URL)
          const linkMatches = linksText.match(/\[.*?\]\((.*?)\)/g);
          if (linkMatches) {
            linkMatches.forEach(match => {
              const urlMatch = match.match(/\[.*?\]\((.*?)\)/);
              if (urlMatch) {
                const url = urlMatch[1];
                if (url.includes('github.com')) currentProject.githubUrl = url;
                else if (url.includes('youtube.com') || url.includes('vimeo')) currentProject.videoDemoUrl = url;
                else currentProject.liveUrl = url;
              }
            });
          }
        }
        else if (rawLine.includes(':') && (rawLine.match(/%/)||rawLine.match(/\d/))) {
          // Guess it's a metric
          const parts = rawLine.split(':');
          currentProject.metrics.push({
            label: parts[0].trim(),
            value: parts[1].trim()
          });
        }
        else {
          currentProject.description += (currentProject.description ? ' ' : '') + rawLine;
        }
      } else {
        currentProject.description += (currentProject.description ? ' ' : '') + line;
      }
    } else if (currentSection === 'experience' && currentJob) {
      if (line.startsWith('*Duration:') || line.toLowerCase().includes('duration:')) {
        const datesText = line.replace(/.*duration\s*:\s*/i, '').replace(/[\*\_]/g, '').trim();
        const parts = datesText.split(' - ');
        currentJob.startDate = parts[0]?.trim() || '';
        currentJob.endDate = parts[1]?.trim() || '';
      }
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        const rawLine = line.substring(2).trim();
        if (rawLine.startsWith('**') && rawLine.includes(':')) {
          // Metric item
          const parts = rawLine.split(':');
          currentJob.metrics.push({
            label: parts[0].replace(/[\*\_\-]/g, '').trim(),
            value: parts[1].replace(/[\*\_\-]/g, '').trim()
          });
        } else {
          currentJob.description += (currentJob.description ? '\n' : '') + rawLine;
        }
      } else {
        if (!currentJob.startDate && line.match(/20\d\d/)) {
          currentJob.endDate = line;
        } else {
          currentJob.description += (currentJob.description ? '\n' : '') + line;
        }
      }
    } else if (currentSection === 'education' && currentEdu) {
      if (line.startsWith('**') && line.endsWith('**')) {
        currentEdu.institution = line.replace(/[\*\_]/g, '').trim();
      } else if (line.startsWith('*') && line.endsWith('*')) {
        const parts = line.replace(/[\*\_]/g, '').split(' - ');
        currentEdu.startDate = parts[0]?.trim() || '';
        currentEdu.endDate = parts[1]?.trim() || '';
      } else if (line.startsWith('- Grade:') || line.toLowerCase().includes('grade')) {
        const gradeText = line.replace(/.*grade\s*:\s*/i, '').trim();
        if (gradeText.toLowerCase().includes('cgpa')) {
          currentEdu.cgpa = gradeText.replace(/cgpa/i, '').trim();
        } else {
          currentEdu.percentage = gradeText.replace(/%/g, '').trim();
        }
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        currentEdu.description += (currentEdu.description ? '\n' : '') + line.substring(2).trim();
      } else {
        currentEdu.description += (currentEdu.description ? '\n' : '') + line;
      }
    } else if (currentSection === 'certifications') {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const rawLine = line.substring(2).trim();
        // Parse: **Cert Name** issued by *Issuer* (Date)
        const nameMatch = rawLine.match(/\*\*(.*?)\*\*/);
        const issuerMatch = rawLine.match(/issued by \*(.*?)\*/i);
        const linkMatch = rawLine.match(/\[.*?\]\((.*?)\)/);

        if (nameMatch) {
          result.certifications.push({
            name: nameMatch[1],
            issuer: issuerMatch ? issuerMatch[1] : 'Issuer',
            issueDate: rawLine.match(/\((.*?)\)/) ? rawLine.match(/\((.*?)\)/)[1] : '',
            verificationLink: linkMatch ? linkMatch[1] : ''
          });
        }
      }
    } else if (currentSection === 'publications') {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const rawLine = line.substring(2).trim();
        // Parse: *"Title"* by Authors, published in *Conference* (Year) - [Link](URL)
        const titleMatch = rawLine.match(/\*\"(.*?)\"\*/);
        const authorsMatch = rawLine.match(/by\s+(.*?),/i);
        const confMatch = rawLine.match(/published in \*(.*?)\*/i);
        const linkMatch = rawLine.match(/\[.*?\]\((.*?)\)/);

        if (titleMatch) {
          result.publications.push({
            title: titleMatch[1],
            authors: authorsMatch ? authorsMatch[1].split(',').map(a => a.trim()) : [],
            conferenceOrJournal: confMatch ? confMatch[1] : '',
            paperUrl: linkMatch ? linkMatch[1] : '',
            year: rawLine.match(/\((\d{4})\)/) ? parseInt(rawLine.match(/\((\d{4})\)/)[1]) : undefined
          });
        }
      }
    } else if (currentSection === 'contact') {
      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        result.personalInfo.email = emailMatch[0];
      }

      const linkMatch = line.match(/\[.*?\]\((.*?)\)/);
      if (linkMatch) {
        const url = linkMatch[1];
        if (url.includes('linkedin.com')) result.socials.linkedinUrl = url;
        else if (url.includes('github.com')) result.socials.githubUrl = url;
        else if (url.includes('leetcode.com')) result.socials.leetCode = url;
        else result.socials.portfolioWebsite = url;
      }

      if (line.toLowerCase().includes('phone') || line.toLowerCase().includes('call')) {
        result.personalInfo.phone = line.replace(/.*phone\s*:\s*/i, '').trim();
      } else if (line.toLowerCase().includes('location') || line.toLowerCase().includes('address')) {
        result.personalInfo.location = line.replace(/.*location\s*:\s*/i, '').trim();
      }
    } else if (currentSection === 'custom') {
      const idx = result.customSections.length - 1;
      result.customSections[idx].contentMarkdown += (result.customSections[idx].contentMarkdown ? '\n' : '') + line;
    }
  }

  // Push final buffers
  if (currentProject) result.projects.push(currentProject);
  if (currentJob) result.experience.push(currentJob);
  if (currentEdu) result.education.push(currentEdu);

  // Parse intros
  if (introLines.length > 0) {
    result.personalInfo.headline = introLines[0];
    result.personalInfo.summary = introLines.slice(1).join(' ');
  }

  return result;
}

function mapCategoryName(cat) {
  const c = cat.toLowerCase().trim();
  if (c.includes('lang')) return 'Languages';
  if (c.includes('frame') || c.includes('library')) return 'Frameworks';
  if (c.includes('db') || c.includes('data')) return 'Databases';
  if (c.includes('cloud')) return 'Cloud';
  if (c.includes('devops') || c.includes('ops')) return 'DevOps';
  if (c.includes('ai') || c.includes('ml') || c.includes('learn')) return 'AI / ML';
  if (c.includes('soft') || c.includes('people')) return 'Soft Skills';
  return 'Tools';
}

module.exports = {
  parseMarkdownToStructuredData
};
