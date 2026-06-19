# Manual Installation & Configuration Guide

Follow these steps to configure and boot the DevForge AI project in your local development environment.

---

## 📋 Prerequisites

Ensure you have the following software installed:
- **Node.js**: Version 18.0.0 or higher.
- **npm**: Version 8.0.0 or higher.
- **MongoDB Atlas account** (or local MongoDB Community server running on port 27017).

---

## 🛠️ Step 1: Environment Settings Setup

Create a `.env` file inside the `server/` directory:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://devforgeadmin:Nani1220@devforge-cluster.rcqn2lc.mongodb.net/devforge?retryWrites=true&w=majority&appName=devforge-cluster
JWT_SECRET=devforge_local_jwt_secret_token_12345
ENCRYPTION_KEY=9a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p
CLIENT_URL=http://localhost:5173
GITHUB_CLIENT_ID=mock_github_client_id
GITHUB_CLIENT_SECRET=mock_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
GEMINI_API_KEY=mock_gemini_api_key
```

### Key Parameter Definitions:
- `MONGO_URI`: MongoDB connection string. You can use your MongoDB Atlas link or a local database string (`mongodb://localhost:27017/devforge`).
- `JWT_SECRET`: Secret key used to sign and verify authorization tokens.
- `ENCRYPTION_KEY`: A 32-character key used for AES-256-CBC token encryption (do not change length).
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: Credentials generated from a GitHub OAuth Application.
- `GEMINI_API_KEY`: API key for Gemini. If set to `mock_gemini_api_key`, the backend automatically runs in simulation mode, generating premium mock profiles.

---

## 🏗️ Step 2: Database Setup & Seeding

Before launching, seed the database with realistic statistics to populate the Admin Dashboard:
1. Open a terminal in the root of the project.
2. Run the database seeding command:
   ```bash
   node server/scratch/seed_demo_data.js
   ```
3. Run the automated validation script to verify connection logic:
   ```bash
   node server/scratch/verify_phase3.js
   ```

---

## 🚀 Step 3: Run the Servers

To start DevForge AI locally, launch both the backend Express server and the frontend Vite React server.

### A. Run Express Backend
Open a terminal and run:
```bash
cd server
npm install
npm run dev
```
The server will boot on `http://localhost:5000`. You should see:
```text
MongoDB Connected
DevForge AI Server is running on port 5000
```

### B. Run React Frontend
Open another terminal and run:
```bash
cd client
npm install
npm run dev
```
The frontend will boot on `http://localhost:5173`. Open this URL in your web browser.

---

## 🎯 Step 4: Accessing the Admin Panel
1. On the login page, enter any nickname in the **Simulated Username** field (e.g. `avinash`).
2. Select **Admin Manager** as the role.
3. Click **Bypass Login (Enter Dashboard)**.
4. Click the **Admin Console** button in the header to explore user management, moderation desk, cost savings analytics, device breakouts, and system health checks!
