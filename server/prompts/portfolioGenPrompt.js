const VERSION = 'v1';

/**
 * Builds the prompt to translate structured user data into portfolio Markdown.
 * @param {object} parsedData - Structured profile JSON
 * @returns {string} - The prompt string
 */
function buildPrompt(parsedData) {
  return `You are an expert technical portfolio writer. Convert the following structured developer profile JSON into a clean, beautifully formatted Markdown file for their portfolio.

Follow this exact Markdown formatting structure:

# [Full Name]
[A professional developer tagline, e.g. "Full-Stack Software Engineer specializing in scalable cloud architectures"]

[A concise, compelling 2-3 sentence professional summary about their interests, background, and what they bring to the table.]

## Skills
- Languages: [List languages, e.g. JavaScript, Python]
- Technologies & Tools: [List frameworks, libraries, cloud platforms, e.g. React.js, Express, AWS, Docker]

## Projects
### [Project Title 1]
[Provide a professional, impact-driven description of what was built and why. Explain the problem solved.]
- **Tech**: [Comma-separated tech tools used, e.g. Node.js, Mongoose, Tailwind CSS]
- [GitHub Repository]([Optional link if available, otherwise mock link like https://github.com/username/project])

### [Project Title 2]
...

## Experience
### [Role Name]
[Company Name] - Duration: [Dates]
- [Detailed, result-oriented bullet point starting with an action verb, specifying metrics or technical details where possible]
- [Detailed, result-oriented bullet point]

## Education
### [Degree Name]
- [School Name]
- [Year/Duration]

---
Ensure the text is professional, clean, has excellent ATS readiness, and uses impact statements (e.g. "Implemented... resulting in..."). Do not include any HTML tags. Return only the raw Markdown content.

Developer Profile JSON:
${JSON.stringify(parsedData, null, 2)}`;
}

module.exports = {
  VERSION,
  buildPrompt
};
