# AI Enhancement Engine Documentation - DevForge AI

DevForge AI implements a modular, service-oriented AI layer powered by Google's Gemini API to automate resume parsing, project compiling, ATS checks, and skill grading.

---

## 1. Directory Structure

- **[prompts/](file:///c:/Users/nania/OneDrive/Desktop/MY DETAILS/INTERN/WEB/Projects/PROTFOLIO/server/prompts)**: Prompt text factories isolating templates from execution loops. Each file declares a `VERSION` tag to handle cache invalidation.
- **[services/](file:///c:/Users/nania/OneDrive/Desktop/MY DETAILS/INTERN/WEB/Projects/PROTFOLIO/server/services)**: Encapsulates logical loops (ATS matching, resume text structuring, grading audits).
- **[utils/](file:///c:/Users/nania/OneDrive/Desktop/MY DETAILS/INTERN/WEB/Projects/PROTFOLIO/server/utils)**: Hash generators and JSON cleaning validators.

---

## 2. Implemented AI Pipelines

### 📄 Smart Resume Parser & Generator
- **Workflow**: Raw Resume PDF -> Text Extraction (`pdf-parse`) -> Text Clean-up (double spaces, formatting) -> Gemini JSON Structurer (`resumePrompt.js`) -> Saved `parsedData` in DB.
- **Generator**: Compiles the saved profile JSON using `portfolioGenPrompt.js` into ready-to-use portfolio Markdown.
- **Endpoint**: `POST /api/ai/parse-resume` and `POST /api/ai/generate-portfolio`.

### 🐙 GitHub AI Project Summarizer
- **Workflow**: Gathers repository metadata.
- **Fallback Chain**: README (up to 4000 characters) -> Public description -> Keyword topics -> Languages.
- **Synthesizer**: Runs details through `projectSummaryPrompt.js` using Gemini to output title, description summary, and tech stack tags.
- **Endpoint**: `POST /api/ai/project-summary`.

### 🛡️ Hybrid ATS suitabilty Scanner
- **60% Keyword Score**: Performs a JS-based token match between the portfolio text/skills and target Job Description.
- **40% Gemini Score**: Prompts Gemini via `atsPrompt.js` to evaluate contextual structure, readability, and depth.
- **Combined ATS Score**: Sum of weighted outputs. Identifies strengths, weaknesses, and missing tech keywords.
- **Endpoint**: `POST /api/ai/ats-score`.

### 🧠 Career Fit Coach & Skill Recommendations
- Takes user skills and target role.
- Computes readiness score, missing skill requirements, and returns a learning roadmap.
- **Endpoint**: `POST /api/ai/career-fit`.

### 📊 Quality Score Grader & Audits
- Audits portfolio layouts on five categories (Content, Projects, Skills, SEO, ATS suitability).
- Appends score logs to the `PortfolioAudit` collection to track progress.
- **Endpoint**: `POST /api/ai/portfolio-score` and `GET /api/ai/portfolio-audits/:portfolioId`.

---

## 3. Caching & Usage Tracking

### Prompt Hashing & Invalidation
To reduce Gemini costs, the cache key is computed via:
`Hash = SHA-256(feature + model + promptVersion + rawInputText)`
If prompt templates are modified (and the `VERSION` constant in prompt files is updated), old cache logs are automatically invalidated, preventing outdated caches.

### AI Usage Monitoring
Tracks token metadata and latency logs for dashboard statistics:
```json
{
  "userId": "User Mongoose ID",
  "feature": "ats-check",
  "tokensUsed": 1245,
  "responseTime": 420,
  "model": "gemini-1.5-flash",
  "cacheHit": false
}
```
Logs are saved in the `AIUsage` collection.
