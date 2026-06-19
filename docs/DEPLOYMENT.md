# Deployment Engine Documentation - DevForge AI

DevForge AI implements a one-click deployment system that compiles the developer's portfolio into a self-contained static page, pushes it to GitHub, and configures GitHub Pages.

---

## 1. Page Compilation

The portfolio is compiled inside the client using [templateBuilder.js](file:///c:/Users/nania/OneDrive/Desktop/MY DETAILS/INTERN/WEB/Projects/PROTFOLIO/client/src/utils/templateBuilder.js):
- **Tailwind CSS**: Embedded with the official Tailwind v4 CDN script to handle CSS-first compilation client-side.
- **Google Fonts**: Load Outfit and Inter fonts.
- **Bake-In Content**: Structured details (summary, skills, projects, experience, education, contact) are baked directly into the static HTML layout.
- **Analytics Client**: Injects tracking script that pings the backend on view loads and link clicks.
- **Contact Form Client**: Integrates form listeners that POST visitor messages directly back to the database.

---

## 2. One-Click GitHub Pages Flow

When a user clicks **One-Click Deploy** in the workspace:
1. The client packages the portfolio HTML and hits the backend endpoint:
   `POST /api/deploy/gh-pages`
2. The backend decrypts the user's saved GitHub access token.
3. The server checks if the target repository (e.g. `devforge-portfolio`) exists. If not, it calls:
   `POST https://api.github.com/user/repos`
4. The server commits the compiled `index.html` file using the GitHub Contents API:
   `PUT https://api.github.com/repos/{owner}/{repo}/contents/index.html`
   - Content is Base64-encoded.
   - If updating an existing file, the server first calls `GET` to retrieve the current file's `sha` and includes it in the payload.
5. The server configures GitHub Pages on the repository:
   `POST https://api.github.com/repos/{owner}/{repo}/pages`
   - Configures the source branch (typically `main`) and root path (`/`).
6. Returns the live deployment URL:
   `https://<username>.github.io/<repoName>/`
7. Saves the repository name and live URL in the user's Portfolio document.

---

## 3. Deployment Simulation (Mock Mode)
For development mock profiles:
- The system bypasses the GitHub API and creates a simulated URL: `https://<username>.github.io/<repoName>`.
- Links the portfolio and configures analytics logs so evaluators can preview the dashboard experience.
