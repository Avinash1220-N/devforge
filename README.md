# DevForge AI - Intelligent Portfolio Generator & SaaS Ecosystem

DevForge AI is a production-ready, feature-rich SaaS platform designed for software engineers. It enables users to connect their GitHub profiles, upload PDF resumes, parse data with intelligent AI extractors, compare portfolios against target Job Descriptions using a hybrid ATS parser, professionalize writing with sentence rewriters, track portfolio traffic telemetry, and deploy static layouts to GitHub Pages with one click.

Additionally, DevForge AI exposes a full-featured Administrator control panel to trace telemetry latencies, moderate accounts, evaluate cache cost-efficiency metrics, analyze DAU/MAU operations metrics, and audit system adjustments.

---

## 🚀 Key Architectural Pillars

1. **GitHub OAuth & Decryption**: Secure cookie-based sessions with JWT tokens and AES-256-CBC encryption for raw access tokens.
2. **AI Suite (Gemini Core)**:
   - Resilient prompt definitions separation.
   - Response hashing & caching (SHA-256) saving compute costs.
   - Clean JSON validator layers stripping markdown wrapper fences.
   - 5MB boundary ceilings protecting pipelines from overflow.
3. **ATS Suitability Grade**: Hybrid tokenizer matching (60% weight) + semantic intelligence grading (40% weight).
4. **Moderator & Admin Panel**:
   - RBAC system with lockguards (cannot demote/suspend self or last administrator).
   - Auto audit trail registration.
   - Real-time MongoDB, GitHub API, and Gemini response latency telemetry.
   - DAU/MAU trends monitoring.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, Vite, Lucide SVGs.
- **Backend**: Node.js, Express.js, Multer, Express Rate Limit.
- **Database**: MongoDB Atlas, Mongoose (indexing & TTL cleanup).
- **Integrations**: GitHub OAuth API, Gemini LLM (Google AI SDK).

---

## 📂 Project Directory Structure

```
PROTFOLIO/
├── client/                     # Frontend Vite + React SPA
│   ├── src/
│   │   ├── components/
│   │   │   └── admin/          # Admin Control Tabs
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── UsersManagement.jsx
│   │   │       ├── PortfoliosManagement.jsx
│   │   │       ├── AIUsageManagement.jsx
│   │   │       ├── AnalyticsManagement.jsx
│   │   │       ├── SystemHealth.jsx
│   │   │       └── AdminAuditLogs.jsx
│   │   ├── utils/
│   │   │   ├── api.js          # REST Client (Axios)
│   │   │   └── templateBuilder.js # Portfolio HTML Theme Engine
│   │   └── App.jsx             # Shell routing and main workspace
├── server/                     # Backend Express REST server
│   ├── middleware/             # Auth, RBAC, Rate limiters, and Error handlers
│   ├── models/                 # Mongoose schemas (TTL, Compound Indices)
│   ├── prompts/                # Dedicated folder for AI prompt versioning
│   ├── routes/                 # REST endpoints (Portfolios, AI, Deploy, Admin)
│   ├── services/               # Core business services (Gemini, ATS, pdf-parse)
│   ├── utils/                  # Encryptors, Validators, Loggers
│   └── server.js               # Express application bootstrap
└── docs/                       # Complete structural specifications
```

---

## 🛠️ Quick Start Configuration

Detailed step-by-step setup guides are provided in [docs/INSTALL.md](file:///c:/Users/nania/OneDrive/Desktop/MY DETAILS/INTERN/WEB/Projects/PROTFOLIO/docs/INSTALL.md). 

### 1. Environment Configurations
Configure a `.env` file under the `/server` directory containing:
```ini
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/devforge
JWT_SECRET=your_jwt_secret_token_key
ENCRYPTION_KEY=32_character_aes_encryption_key
CLIENT_URL=http://localhost:5173
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GEMINI_API_KEY=your_gemini_api_key_or_mock
```

### 2. Startup Commands
Open two terminals:

**Backend Launch**:
```bash
cd server
npm install
npm run dev
```

**Frontend Launch**:
```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` to access the workspace. Use **Bypass Developer Test Mode** and choose **Admin Manager** role to instantly explore the populated dashboard metrics!

---

## 🧪 Seeding & Verification Scripts

- **Seed Mock Analytics**: Populate database with 20 users, 30 portfolios, and 100+ telemetry events:
  ```bash
  node server/scratch/seed_demo_data.js
  ```
- **Run Phase 3 Validation Suite**: Test guards, DAU calculations, and caches:
  ```bash
  node server/scratch/verify_phase3.js
  ```
