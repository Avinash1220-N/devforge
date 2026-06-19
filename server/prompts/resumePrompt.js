const VERSION = 'v1';

/**
 * Builds the prompt to parse raw resume text into structured JSON.
 * @param {string} resumeText - The cleaned text extracted from PDF
 * @returns {string} - The prompt string
 */
function buildPrompt(resumeText) {
  return `You are an expert ATS-ready resume parser. Analyze the following raw developer resume text and extract the details into a single structured JSON object.

Strict JSON format requirements:
{
  "name": "Full Name",
  "email": "email@example.com",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree (e.g., B.S. Computer Science)",
      "year": "Year (e.g., 2025 or 2022 - 2026)"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Brief description of what was built and its impact",
      "techStack": ["React", "Node.js", "MongoDB"]
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Role (e.g. Software Engineering Intern)",
      "duration": "Duration (e.g. June 2025 - Present)",
      "bullets": [
        "Accomplishment statement starting with action verb",
        "Accomplishment statement starting with action verb"
      ]
    }
  ]
}

Ensure the output is valid JSON, contains no comments, and strictly matches the keys above. Do not truncate experience or projects.

Raw Resume Text:
${resumeText}`;
}

module.exports = {
  VERSION,
  buildPrompt
};
