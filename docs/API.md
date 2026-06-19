# REST API Specifications

All endpoints are prefixed with `/api` and return responses formatted in JSON.

---

## 🔒 1. Authentication Module (`/api/auth`)

### `GET /auth/github/callback`
GitHub OAuth Redirect target. Exchanges code for session cookie JWT.

### `POST /auth/mock-login`
Creates a mock user or updates role for offline testing.
- **Request Body**:
  ```json
  {
    "username": "avinash",
    "role": "admin"
  }
  ```
- **Response**:
  ```json
  {
    "user": { "_id": "...", "githubId": "mock_avinash", "role": "admin" },
    "token": "JWT_TOKEN"
  }
  ```

### `GET /auth/me` [Protected]
Returns current authenticated profile details.

### `POST /auth/logout`
Clears session cookie token.

---

## 📄 2. AI Intelligence Module (`/api/ai`) [Protected]

### `POST /ai/parse-resume`
Extracts structured text from uploaded PDF resume. Limit: 5MB.
- **Request**: Multipart FormData (`resume` file).
- **Response**:
  ```json
  {
    "success": true,
    "parsedData": {
      "name": "...",
      "skills": ["React", "Python"],
      "projects": [],
      "experience": []
    }
  }
  ```

### `POST /ai/generate-portfolio`
Generates markdown draft using cached resume JSON details.

### `POST /ai/ats-score`
Computes match score against job description.
- **Request Body**:
  ```json
  {
    "portfolioText": "# Markdown ...",
    "jobDescription": "Requirements ..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "analysis": {
      "score": 85,
      "keywordScore": 90,
      "geminiScore": 80,
      "strengths": ["React experience"],
      "weaknesses": ["Missing AWS"],
      "missingKeywords": ["AWS", "Docker"]
    }
  }
  ```

---

## 🚀 3. Deployment Module (`/api/deploy`) [Protected]

### `POST /deploy/gh-pages`
Deploys static index HTML payload to GitHub Pages.
- **Request Body**:
  ```json
  {
    "portfolioId": "...",
    "repoName": "devforge-portfolio",
    "htmlContent": "<html>...</html>",
    "themeName": "DarkPro"
  }
  ```

---

## 🛡️ 4. Administration Module (`/api/admin`) [Protected, Admin-only]

### `GET /admin/stats`
Grouped stats trends. Returns:
```json
{
  "users": { "total": 20, "today": 1, "thisWeek": 5 },
  "portfolios": { "total": 30, "today": 2 },
  "ai": { "requests": 50, "cacheHitRate": 40.0 },
  "activity": { "dau": 2, "mau": 10 }
}
```

### `GET /admin/users`
Paginated search registry of users.
- **Query Params**: `page` (default 1), `limit` (default 10), `search` (optional).

### `PUT /admin/users/:id/role`
Updates role privilege flag. Safeguarded against demoting self or last administrator.
- **Request Body**: `{ "role": "admin" }`

### `PUT /admin/users/:id/status`
Suspends/activates accounts. Safeguarded against deactivating self or last administrator.
- **Request Body**: `{ "isActive": false }`

### `GET /admin/portfolios`
Paginated directory of active portfolios.

### `DELETE /admin/portfolios/:id`
Soft-deletes moderated portfolio (marks `isDeleted: true`).

### `GET /admin/cache`
Detailed hit rate and Estimated savings cache diagnostics.

### `GET /admin/ai-usage`
Detailed token usage breakdowns and timeline arrays.

### `GET /admin/analytics`
Breakouts of user devices, countries, and portfolio views leaderboard.

### `GET /admin/system`
Hardware checks returning MongoDB, GitHub, and Gemini latencies in milliseconds.
