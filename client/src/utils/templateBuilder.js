import { parseMarkdown } from './markdownParser';

/**
 * Compiles a self-contained, responsive HTML portfolio page.
 * @param {string} rawMarkdown - The user's portfolio markdown
 * @param {string} themeName - Theme key (Modern, Professional, DarkPro, Futuristic)
 * @param {string} portfolioId - The portfolio's MongoDB ID
 * @param {string} serverUrl - Backend API server base URL for analytics and contact
 * @returns {string} - Complete HTML file string
 */
export function buildPortfolioHtml(rawMarkdown, themeName = 'DarkPro', portfolioId = 'mock_id', serverUrl = 'http://localhost:5000') {
  const data = parseMarkdown(rawMarkdown);
  
  // Choose theme variables and classes
  let bodyClass = '';
  let themeStyles = '';
  let themeHeader = '';
  let themeHero = '';
  let themeSkills = '';
  let themeProjects = '';
  let themeExperience = '';
  let themeEducation = '';
  let themeContact = '';
  let themeFooter = '';

  const cleanServerUrl = serverUrl.replace(/\/$/, '');

  // 1. MODERN THEME (Light, clean, startup-style, gradients)
  if (themeName === 'Modern') {
    bodyClass = 'bg-slate-50 text-slate-800 antialiased font-sans';
    themeStyles = `
      .theme-btn { @apply bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow; }
      .theme-card { @apply bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300; }
      .theme-pill { @apply bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-3 py-1 rounded-full text-sm font-medium; }
      .text-accent { @apply text-indigo-600; }
      .bg-accent-gradient { @apply bg-gradient-to-r from-indigo-600 to-violet-600; }
    `;
  }
  // 2. PROFESSIONAL THEME (Corporate, navy/slate, classic elegance)
  else if (themeName === 'Professional') {
    bodyClass = 'bg-white text-slate-900 antialiased';
    themeStyles = `
      .theme-btn { @apply bg-slate-900 text-white hover:bg-slate-800 px-5 py-2 rounded font-medium transition-all; }
      .theme-card { @apply bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-all duration-200; }
      .theme-pill { @apply bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider; }
      .text-accent { @apply text-slate-900; }
      .bg-accent-gradient { @apply bg-slate-900; }
    `;
  }
  // 3. DARK PRO THEME (Developer dark theme, charcoal & cyan)
  else if (themeName === 'DarkPro') {
    bodyClass = 'bg-slate-950 text-slate-100 antialiased';
    themeStyles = `
      .theme-btn { @apply bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]; }
      .theme-card { @apply bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-emerald-500/30 transition-all duration-300; }
      .theme-pill { @apply bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-mono; }
      .text-accent { @apply text-emerald-400; }
      .bg-accent-gradient { @apply bg-gradient-to-r from-emerald-400 to-teal-500; }
    `;
  }
  // 4. FUTURISTIC THEME (Glassmorphism, deep dark, pink & purple neon glow)
  else if (themeName === 'Futuristic') {
    bodyClass = 'bg-[#030014] text-slate-200 antialiased';
    themeStyles = `
      .theme-btn { @apply bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white hover:opacity-90 px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:scale-[1.02]; }
      .theme-card { @apply backdrop-blur-md bg-white/5 border border-white/10 hover:border-pink-500/30 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)]; }
      .theme-pill { @apply bg-pink-500/10 text-pink-300 border border-pink-500/20 px-3 py-1 rounded-full text-xs; }
      .text-accent { @apply text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400; }
      .bg-accent-gradient { @apply bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500; }
    `;
  }

  // --- Dynamic HTML Section Templates ---
  
  // Header / Navigation
  themeHeader = `
    <header class="sticky top-0 z-50 backdrop-blur-lg ${themeName === 'Modern' ? 'bg-white/80 border-b border-slate-100' : themeName === 'Professional' ? 'bg-white/95 border-b border-slate-200' : themeName === 'DarkPro' ? 'bg-slate-950/80 border-b border-slate-900' : 'bg-[#030014]/80 border-b border-white/5'}">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="#" class="text-xl font-bold tracking-tight text-accent">${data.name}</a>
        <nav class="hidden md:flex items-center gap-6">
          <a href="#about" class="hover:text-accent transition-colors">About</a>
          ${data.skills.length > 0 ? `<a href="#skills" class="hover:text-accent transition-colors">Skills</a>` : ''}
          ${data.projects.length > 0 ? `<a href="#projects" class="hover:text-accent transition-colors">Projects</a>` : ''}
          ${data.experience.length > 0 ? `<a href="#experience" class="hover:text-accent transition-colors">Experience</a>` : ''}
          <a href="#contact" class="hover:text-accent transition-colors">Contact</a>
        </nav>
        <a href="#contact" class="theme-btn text-sm px-4 py-2">Get in Touch</a>
      </div>
    </header>
  `;

  // Hero Section
  let backgroundDecorations = '';
  if (themeName === 'Modern') {
    backgroundDecorations = `
      <div class="absolute top-1/4 left-1/4 -z-10 w-96 h-96 bg-indigo-200 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
      <div class="absolute top-1/3 right-1/4 -z-10 w-96 h-96 bg-violet-200 rounded-full filter blur-3xl opacity-30 animate-pulse-slow" style="animation-delay: 2s;"></div>
    `;
  } else if (themeName === 'DarkPro') {
    backgroundDecorations = `
      <div class="absolute top-10 left-10 -z-10 w-72 h-72 bg-emerald-500/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
      <div class="absolute bottom-10 right-10 -z-10 w-72 h-72 bg-teal-500/5 rounded-full filter blur-3xl animate-pulse-slow" style="animation-delay: 3s;"></div>
    `;
  } else if (themeName === 'Futuristic') {
    backgroundDecorations = `
      <div class="absolute top-20 left-1/3 -z-10 w-[500px] h-[500px] bg-purple-900/15 rounded-full filter blur-[120px] animate-pulse-slow"></div>
      <div class="absolute top-40 right-1/4 -z-10 w-[400px] h-[400px] bg-pink-900/10 rounded-full filter blur-[120px] animate-pulse-slow" style="animation-delay: 4s;"></div>
      <div class="absolute bottom-10 left-10 -z-10 w-[300px] h-[300px] bg-cyan-900/10 rounded-full filter blur-[100px]"></div>
    `;
  }

  themeHero = `
    <section id="about" class="relative overflow-hidden py-20 md:py-32">
      ${backgroundDecorations}
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Hi, I'm <span class="text-accent">${data.name}</span>
        </h1>
        <p class="text-xl md:text-2xl font-medium mb-8 text-slate-500 dark:text-slate-400">
          ${data.tagline}
        </p>
        <p class="text-lg leading-relaxed max-w-2xl mx-auto mb-10 text-slate-600 dark:text-slate-350">
          ${data.about.replace(/\n/g, '<br>')}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <a href="#projects" class="theme-btn">View Projects</a>
          <a href="#contact" class="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-medium transition-all">Contact Me</a>
        </div>
      </div>
    </section>
  `;

  // Skills Section
  if (data.skills.length > 0) {
    themeSkills = `
      <section id="skills" class="py-16 border-t ${themeName === 'Modern' ? 'border-slate-100 bg-slate-50/50' : themeName === 'Professional' ? 'border-slate-200' : themeName === 'DarkPro' ? 'border-slate-900 bg-slate-950/50' : 'border-white/5'}">
        <div class="max-w-4xl mx-auto px-4">
          <h2 class="text-2xl md:text-3xl font-bold mb-10 text-center text-accent">Technical Skills</h2>
          <div class="flex flex-wrap justify-center gap-3">
            ${data.skills.map(skill => `<span class="theme-pill">${skill}</span>`).join('\n')}
          </div>
        </div>
      </section>
    `;
  }

  // Projects Section
  if (data.projects.length > 0) {
    themeProjects = `
      <section id="projects" class="py-20">
        <div class="max-w-6xl mx-auto px-4">
          <h2 class="text-2xl md:text-3xl font-bold mb-4 text-center text-accent">Featured Projects</h2>
          <p class="text-slate-500 dark:text-slate-400 text-center mb-12 max-w-md mx-auto">A showcase of projects built using modern technologies.</p>
          <div class="grid md:grid-cols-2 gap-8">
            ${data.projects.map(project => {
              const techPills = project.tech.map(t => `<span class="px-2.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 dark:text-slate-300 font-medium">${t}</span>`).join('');
              const githubBtn = project.link ? `
                <a href="${project.link}" target="_blank" class="github-link inline-flex items-center text-sm font-medium text-accent hover:underline gap-1 mt-4" data-project="${project.title}">
                  View Repository 
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              ` : '';
              
              return `
                <div class="theme-card p-6 flex flex-col justify-between">
                  <div>
                    <h3 class="text-xl font-bold mb-2 text-slate-800 dark:text-slate-150">${project.title}</h3>
                    <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">${project.description.replace(/\n/g, '<br>')}</p>
                  </div>
                  <div>
                    <div class="flex flex-wrap gap-1.5">${techPills}</div>
                    ${githubBtn}
                  </div>
                </div>
              `;
            }).join('\n')}
          </div>
        </div>
      </section>
    `;
  }

  // Experience Section
  if (data.experience.length > 0) {
    themeExperience = `
      <section id="experience" class="py-20 border-t ${themeName === 'Modern' ? 'border-slate-100 bg-slate-50/50' : themeName === 'Professional' ? 'border-slate-200' : themeName === 'DarkPro' ? 'border-slate-900 bg-slate-950/50' : 'border-white/5'}">
        <div class="max-w-4xl mx-auto px-4">
          <h2 class="text-2xl md:text-3xl font-bold mb-12 text-center text-accent">Work Experience</h2>
          <div class="space-y-12 relative before:absolute before:top-2 before:bottom-2 before:left-4 md:before:left-1/2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            ${data.experience.map((job, index) => {
              const bulletsHtml = job.bullets.map(b => `<li class="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">${b}</li>`).join('');
              const isEven = index % 2 === 0;
              
              return `
                <div class="relative flex flex-col md:flex-row items-stretch gap-8 md:gap-0">
                  <!-- Dot indicator -->
                  <div class="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-accent-gradient -translate-x-[7px] top-1.5 ring-4 ring-white dark:ring-slate-950"></div>
                  
                  <!-- Left spacer / block -->
                  <div class="w-full md:w-1/2 pl-12 md:pl-0 md:pr-12 md:text-right ${isEven ? 'md:order-1' : 'md:order-2'}">
                    <span class="text-xs font-mono text-slate-400 font-bold">${job.duration}</span>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">${job.role}</h3>
                    <h4 class="text-sm font-semibold text-accent mb-2">${job.company}</h4>
                  </div>
                  
                  <!-- Right content / list block -->
                  <div class="w-full md:w-1/2 pl-12 md:pl-12 ${isEven ? 'md:order-2' : 'md:order-1'}">
                    <ul class="list-disc list-inside md:list-none pl-0">
                      ${bulletsHtml}
                    </ul>
                  </div>
                </div>
              `;
            }).join('\n')}
          </div>
        </div>
      </section>
    `;
  }

  // Education Section
  if (data.education.length > 0) {
    themeEducation = `
      <section id="education" class="py-16 border-t ${themeName === 'Modern' ? 'border-slate-100' : themeName === 'Professional' ? 'border-slate-200' : themeName === 'DarkPro' ? 'border-slate-900 bg-slate-950/20' : 'border-white/5'}">
        <div class="max-w-4xl mx-auto px-4">
          <h2 class="text-2xl md:text-3xl font-bold mb-10 text-center text-accent">Education</h2>
          <div class="grid md:grid-cols-2 gap-6">
            ${data.education.map(edu => `
              <div class="theme-card p-5">
                <span class="text-xs text-accent font-semibold">${edu.year || ''}</span>
                <h3 class="text-lg font-bold text-slate-800 dark:text-slate-250 mt-1">${edu.degree}</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm">${edu.school}</p>
              </div>
            `).join('\n')}
          </div>
        </div>
      </section>
    `;
  }

  // Contact Section
  themeContact = `
    <section id="contact" class="py-20 border-t ${themeName === 'Modern' ? 'border-slate-100 bg-indigo-50/20' : themeName === 'Professional' ? 'border-slate-200' : themeName === 'DarkPro' ? 'border-slate-900 bg-slate-950/80' : 'border-white/5'}">
      <div class="max-w-4xl mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-bold mb-4 text-center text-accent">Get In Touch</h2>
        <p class="text-slate-500 dark:text-slate-400 text-center mb-10 max-w-sm mx-auto">Have an exciting opportunity or question? Drop me a message!</p>
        
        <div class="grid md:grid-cols-12 gap-8 items-start">
          <!-- Info Column -->
          <div class="md:col-span-4 space-y-6">
            ${data.contact.email ? `
              <div class="flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-accent">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <h4 class="text-xs text-slate-400 font-bold uppercase">Email</h4>
                  <a href="mailto:${data.contact.email}" class="text-sm font-semibold hover:underline">${data.contact.email}</a>
                </div>
              </div>
            ` : ''}

            ${data.contact.phone ? `
              <div class="flex items-center gap-3">
                <div class="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-accent">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <div>
                  <h4 class="text-xs text-slate-400 font-bold uppercase">Phone</h4>
                  <span class="text-sm font-semibold">${data.contact.phone}</span>
                </div>
              </div>
            ` : ''}

            <!-- Social Links -->
            <div class="pt-4 flex gap-3">
              ${data.contact.github ? `
                <a href="${data.contact.github}" target="_blank" class="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-600 dark:text-slate-400 hover:text-accent">
                  GitHub
                </a>
              ` : ''}
              ${data.contact.linkedin ? `
                <a href="${data.contact.linkedin}" target="_blank" class="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-600 dark:text-slate-400 hover:text-accent">
                  LinkedIn
                </a>
              ` : ''}
            </div>
          </div>

          <!-- Form Column -->
          <form id="contactForm" class="md:col-span-8 space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label for="form_name" class="block text-xs font-bold text-slate-400 uppercase mb-1">Name</label>
                <input type="text" id="form_name" name="name" required class="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-accent">
              </div>
              <div>
                <label for="form_email" class="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input type="email" id="form_email" name="email" required class="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-accent">
              </div>
            </div>
            <div>
              <label for="form_message" class="block text-xs font-bold text-slate-400 uppercase mb-1">Message</label>
              <textarea id="form_message" name="message" rows="4" required class="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-accent"></textarea>
            </div>
            <button type="submit" id="formSubmitBtn" class="theme-btn w-full">Send Message</button>
            <p id="formStatus" class="text-xs text-center font-medium mt-2 hidden"></p>
          </form>
        </div>
      </div>
    </section>
  `;

  // Footer Section
  themeFooter = `
    <footer class="py-10 border-t ${themeName === 'Modern' ? 'border-slate-100 bg-slate-50' : themeName === 'Professional' ? 'border-slate-200' : themeName === 'DarkPro' ? 'border-slate-900' : 'border-white/5'} text-center text-sm text-slate-400">
      <div class="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>&copy; ${new Date().getFullYear()} ${data.name}. All rights reserved.</div>
        <div class="flex items-center gap-1 text-xs">
          Built with 
          <a href="https://github.com/nana-sir/PROTFOLIO" target="_blank" class="text-accent font-bold hover:underline">DevForge AI</a>
        </div>
      </div>
    </footer>
  `;

  // Dynamic Page Output
  return `<!DOCTYPE html>
<html lang="en" class="${themeName === 'DarkPro' || themeName === 'Futuristic' ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.name} - Developer Portfolio</title>
  
  <!-- Tailwind CSS v4 CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
    
    :root {
      font-family: 'Inter', sans-serif;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Outfit', sans-serif;
    }
    
    /* Standalone overrides from compilation definitions */
    ${themeStyles}
    
    html {
      scroll-behavior: smooth;
    }
  </style>

  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            heading: ['Outfit', 'sans-serif'],
            mono: ['Fira Code', 'monospace']
          }
        }
      }
    }
  </script>
</head>
<body class="${bodyClass}">

  ${themeHeader}
  
  <main>
    ${themeHero}
    ${themeSkills}
    ${themeProjects}
    ${themeExperience}
    ${themeEducation}
    ${themeContact}
  </main>

  ${themeFooter}

  <!-- DevForge AI Analytics Integration Script -->
  <script>
    const SERVER_URL = '${cleanServerUrl}';
    const PORTFOLIO_ID = '${portfolioId}';
    
    // Log Page View
    async function logView() {
      try {
        await fetch(SERVER_URL + '/api/analytics/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolioId: PORTFOLIO_ID,
            type: 'view',
            referrer: document.referrer || 'Direct'
          })
        });
      } catch (err) {
        console.warn('Analytics ping failed:', err.message);
      }
    }
    
    // Log GitHub Click
    async function logGitHubClick(projectName) {
      try {
        await fetch(SERVER_URL + '/api/analytics/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolioId: PORTFOLIO_ID,
            type: 'github_click',
            referrer: projectName || 'Link'
          })
        });
      } catch (err) {
        console.warn('Analytics GitHub click ping failed:', err.message);
      }
    }

    // Trigger View on Load
    window.addEventListener('DOMContentLoaded', () => {
      logView();
      
      // Track clicks on github link classes
      document.querySelectorAll('.github-link').forEach(link => {
        link.addEventListener('click', (e) => {
          const name = link.getAttribute('data-project') || 'Repo Link';
          logGitHubClick(name);
        });
      });
    });

    // Form Handling
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('formSubmitBtn');
    const statusText = document.getElementById('formStatus');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';
        statusText.className = 'text-xs text-center font-medium mt-2';
        statusText.classList.remove('hidden');
        
        const name = document.getElementById('form_name').value;
        const email = document.getElementById('form_email').value;
        const message = document.getElementById('form_message').value;

        try {
          const res = await fetch(SERVER_URL + '/api/portfolios/' + PORTFOLIO_ID + '/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
          });
          
          if (res.ok) {
            statusText.innerText = 'Message sent successfully!';
            statusText.classList.add('text-emerald-500');
            form.reset();
            
            // Log submission in Analytics Event
            await fetch(SERVER_URL + '/api/analytics/ping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                portfolioId: PORTFOLIO_ID,
                type: 'contact_submit',
                referrer: 'Contact Form'
              })
            });
          } else {
            throw new Error('Server rejected form');
          }
        } catch (err) {
          statusText.innerText = 'Failed to send message. Please try again.';
          statusText.classList.add('text-red-500');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Send Message';
        }
      });
    }
  </script>
</body>
</html>`;
}
