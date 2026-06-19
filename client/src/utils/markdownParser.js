/**
 * Parses markdown into structured portfolio data
 * @param {string} markdown - Raw markdown string
 * @returns {object} - Structured portfolio data
 */
export function parseMarkdown(markdown) {
  const result = {
    name: 'Developer',
    tagline: 'Software Engineer',
    about: '',
    skills: [],
    projects: [],
    experience: [],
    education: [],
    contact: {}
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

    // Check for Main Title (H1) -> Name
    if (line.startsWith('# ') && !line.startsWith('##')) {
      result.name = line.replace('# ', '').trim();
      continue;
    }

    // Check for Section Headers (H2)
    if (line.startsWith('## ')) {
      const headerText = line.replace('## ', '').trim().toLowerCase();
      
      // Save prior objects
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
      } else if (headerText.includes('contact') || headerText.includes('get in touch')) {
        currentSection = 'contact';
      } else {
        currentSection = headerText; // Other custom sections
      }
      continue;
    }

    // Check for Subsections (H3)
    if (line.startsWith('### ')) {
      const subheaderText = line.replace('### ', '').trim();

      if (currentSection === 'projects') {
        if (currentProject) result.projects.push(currentProject);
        currentProject = {
          title: subheaderText,
          description: '',
          tech: [],
          link: ''
        };
      } else if (currentSection === 'experience') {
        if (currentJob) result.experience.push(currentJob);
        
        // Parse company and role from H3 e.g., "Software Engineer at Google" or "Google - Software Engineer"
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
          duration: '',
          bullets: []
        };
      } else if (currentSection === 'education') {
        if (currentEdu) result.education.push(currentEdu);
        currentEdu = {
          degree: subheaderText,
          school: '',
          year: ''
        };
      }
      continue;
    }

    // Process lines based on current section
    if (currentSection === '') {
      // Intro lines before any H2
      introLines.push(line);
    } else if (currentSection === 'skills') {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        result.skills.push(line.substring(2).trim());
      } else if (line.startsWith('1. ') || line.startsWith('2. ')) {
        result.skills.push(line.substring(3).trim());
      } else if (!line.startsWith('#')) {
        // Support comma-separated line e.g., "Python, JS, React"
        const split = line.split(',');
        if (split.length > 1) {
          result.skills.push(...split.map(s => s.trim()).filter(Boolean));
        } else {
          result.skills.push(line);
        }
      }
    } else if (currentSection === 'projects') {
      if (currentProject) {
        // Look for links [Link Text](URL)
        const linkMatch = line.match(/\[.*?\]\((.*?)\)/);
        if (linkMatch && !currentProject.link) {
          currentProject.link = linkMatch[1];
        }

        // Look for tech stacks e.g. "Tech: React, Node" or "- Tech: ..."
        if (line.toLowerCase().includes('tech') || line.toLowerCase().includes('technologies')) {
          const techText = line.replace(/.*tech(nologies)?\s*:?\s*/i, '').trim();
          const cleanTech = techText.replace(/[\*\-\[\]\(\)]/g, ''); // strip markdown syntax
          currentProject.tech = cleanTech.split(',').map(t => t.trim()).filter(Boolean);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          // Bullet lines might be description or details
          const content = line.substring(2).trim();
          if (content.toLowerCase().startsWith('tech') || content.toLowerCase().startsWith('stack')) {
            const techText = content.replace(/.*(tech|stack)\s*:?\s*/i, '').trim();
            currentProject.tech = techText.split(',').map(t => t.trim()).filter(Boolean);
          } else {
            currentProject.description += (currentProject.description ? '\n' : '') + content;
          }
        } else {
          currentProject.description += (currentProject.description ? ' ' : '') + line;
        }
      }
    } else if (currentSection === 'experience') {
      if (currentJob) {
        // Look for duration e.g. "Duration: Jan 2022 - Present"
        if (line.toLowerCase().includes('duration') || line.toLowerCase().includes('date') || line.match(/20\d\d/)) {
          const dur = line.replace(/.*(duration|date|time)\s*:?\s*/i, '').trim();
          currentJob.duration = dur || line;
        }
        
        if (line.startsWith('- ') || line.startsWith('* ')) {
          currentJob.bullets.push(line.substring(2).trim());
        } else if (!line.toLowerCase().includes('duration') && !line.toLowerCase().includes('date')) {
          // If plain text before bullets, append to duration or context
          if (!currentJob.duration) currentJob.duration = line;
          else currentJob.bullets.push(line);
        }
      }
    } else if (currentSection === 'education') {
      if (currentEdu) {
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.substring(2).trim();
          if (content.match(/20\d\d/) || content.match(/\d{4}/)) {
            currentEdu.year = content;
          } else if (!currentEdu.school) {
            currentEdu.school = content;
          }
        } else {
          if (line.match(/20\d\d/) || line.match(/\d{4}/)) {
            currentEdu.year = line;
          } else if (!currentEdu.school) {
            currentEdu.school = line;
          }
        }
      }
    } else if (currentSection === 'contact') {
      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        result.contact.email = emailMatch[0];
      }
      
      const linkMatch = line.match(/\[.*?\]\((.*?)\)/);
      if (linkMatch) {
        const url = linkMatch[1];
        if (url.includes('linkedin.com')) result.contact.linkedin = url;
        else if (url.includes('github.com')) result.contact.github = url;
        else result.contact.website = url;
      } else {
        if (line.toLowerCase().includes('email')) {
          result.contact.emailText = line;
        } else if (line.toLowerCase().includes('phone') || line.toLowerCase().includes('call')) {
          result.contact.phone = line.replace(/.*phone\s*:?\s*/i, '').trim();
        }
      }
    }
  }

  // Push last elements
  if (currentProject) result.projects.push(currentProject);
  if (currentJob) result.experience.push(currentJob);
  if (currentEdu) result.education.push(currentEdu);

  // Set tagline and about from intro lines
  if (introLines.length > 0) {
    result.tagline = introLines[0];
    result.about = introLines.slice(1).join('\n');
  } else {
    result.about = 'Welcome to my professional developer showcase portfolio.';
  }

  return result;
}
