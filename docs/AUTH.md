# Authentication Architecture Documentation - DevForge AI

DevForge AI implements a secure, SaaS-oriented authentication engine that utilizes GitHub OAuth, HttpOnly Session Cookies, and AES token encryption.

---

## 1. Authentication Flow Diagram

```
User (Browser)               DevForge Backend               GitHub API
    |                              |                            |
    |---- 1. Click Login --------->|                            |
    |                             Redirect to OAuth URL         |
    |---- 2. Authenticate ------------------------------------->|
    |                                                           |
    |<--- 3. Redirect with Code --|<----------------------------|
    |                              |                            |
    |                              |-- 4. Swap Code for Token ->|
    |                              |<-- Returns Access Token ---|
    |                              |                            |
    |                              |-- 5. Fetch User details -->|
    |                              |<-- Returns User details ---|
    |                              |                            |
    |                              |-- 6. Encrypt Token (AES)   |
    |                              |-- 7. Find/Create User Doc  |
    |                              |-- 8. Sign JWT Session      |
    |                              |-- 9. Set HttpOnly Cookie   |
    |<--- 10. Redirect to Home ----|                            |
```

---

## 2. Security Implementations

### HttpOnly Cookies
To defend against Cross-Site Scripting (XSS) attacks, user sessions are not stored in `localStorage` or `sessionStorage`. Instead:
- The server sets a JWT session token in an `HttpOnly` and `SameSite=Lax` cookie named `token`.
- The cookie's `Secure` flag is automatically enabled in production environments.
- Browser scripts cannot read this cookie, blocking token leakage.
- Frontend requests to the backend configure `withCredentials: true` to automatically forward the session cookie.

### Token Encryption (AES-256-CBC)
If our database is compromised, storing raw GitHub tokens allows attackers to write to users' repositories. To prevent this:
- GitHub access tokens are encrypted using AES-256-CBC via a 32-character hex key stored in `ENCRYPTION_KEY`.
- The encrypted ciphertext is stored in the database.
- The `githubAccessToken` field has `select: false` configured on the user schema. It is excluded from standard queries unless explicitly requested during deployment routines.
- Source code references: [encrypt.js](file:///c:/Users/nania/OneDrive/Desktop/MY DETAILS/INTERN/WEB/Projects/PROTFOLIO/server/utils/encrypt.js)

---

## 3. Developer Mock Login (Simulation Mode)
To let evaluators run the workspace without configuring GitHub client IDs and secrets:
- The server exposes a developmental mock login endpoint: `POST /api/auth/mock-login`.
- Evaluators enter a simulated username and select a role (`user` or `admin`).
- The server signs a valid session token, sets the cookie, and permits full editing, parsing, and deployment simulation.
- This endpoint is automatically disabled in production mode (`process.env.NODE_ENV === 'production'`).
