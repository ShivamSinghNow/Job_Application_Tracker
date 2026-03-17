# Job Tracker

An AI-powered job application tracker that lets you paste a job posting URL, automatically extracts all relevant details using Claude, and scores how well your resume fits the role — all from a single cyberpunk-themed dashboard.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [How It Works](#how-it-works)
- [Design & Theming](#design--theming)

---

## Overview

Job Tracker solves a common pain point: keeping tabs on dozens of job applications while understanding how well each role actually fits your background. Instead of manually copying details from job postings into a spreadsheet, you upload your resume once, paste a URL, and the app does the rest — extracting the company, role, location, salary, requirements, and generating a personalized fit analysis against your resume.

---

## Features

### AI-Powered Job Extraction
Paste any job posting URL and Claude (`claude-sonnet-4-20250514`) fetches the page, parses the HTML, and extracts structured data: company name, role title, location, salary range, requirements, nice-to-haves, and a plain-English summary.

### Resume Fit Scoring
Your uploaded resume is compared against each job posting. The AI returns a 0–100 fit score, three bullet points explaining the score, and 3–5 actionable improvement suggestions (resume tweaks, projects to build, skills to learn, certifications to consider). Jobs scoring 90+ get a "perfect match" designation with no improvements needed.

### Application Pipeline Tracking
Every job moves through a status pipeline: **Saved → Applied → Phone Screen → Technical → Final Round → Offer / Rejected**. Status changes persist instantly via API calls.

### Interactive Job Detail Pages
Each tracked job has a dedicated detail page with a fit score progress bar, a requirements checklist (check them off as you review), improvement suggestions, and a personal notes section that auto-saves on blur.

### Resume Management
Upload a PDF resume and the app extracts its text content using `pdf-parse`. Only one resume is stored at a time — uploading a new one replaces the previous. The resume must be uploaded before you can start tracking jobs, since every fit analysis depends on it.

### Three-Step Loading Indicator
When adding a job, a visual stepper walks through the process: **Fetching page → Extracting details → Scoring fit**, so you always know where things stand.

### Cyberpunk Dark Theme
The dark mode features a full cyberpunk aesthetic: neon cyan and magenta color palette, glowing borders and text shadows, a subtle background grid pattern, hover-triggered glitch effects on headings and icons, and pulsing animations for loading states. Light mode is clean and minimal by contrast.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router) | Server-side rendering for the dashboard and detail pages, API routes for the backend, Turbopack for fast dev builds |
| **Language** | TypeScript 5 | Type safety across the full stack — shared types between API routes and components |
| **UI Library** | React 19 | Latest React with concurrent features |
| **Styling** | Tailwind CSS 4 | Utility-first CSS with custom CSS variables for the dual light/dark theme system |
| **Components** | shadcn/ui + Radix UI | Accessible, unstyled primitives (Select, Checkbox, Dropdown, Progress) composed into custom styled components |
| **Database** | SQLite via Prisma 6 | Zero-config local database — no external services needed. Prisma handles schema migrations and type-safe queries |
| **AI** | Anthropic Claude (claude-sonnet-4-20250514) | High-quality structured data extraction from raw HTML and nuanced resume fit analysis |
| **PDF Parsing** | pdf-parse | Extracts raw text from uploaded PDF resumes |
| **Theming** | next-themes | Light/dark/system theme switching with `class` strategy and no transition flash |
| **Icons** | Lucide React | Consistent icon set across the UI |

---

## Architecture & Design Decisions

### Why SQLite Instead of Postgres?
This is a personal productivity tool, not a multi-tenant SaaS. SQLite keeps the setup to zero — no Docker containers, no connection strings, no hosted database. The `dev.db` file lives right in the `prisma/` directory. If you ever need to scale, Prisma makes swapping to Postgres a one-line change in `schema.prisma`.

### Why Server-Side Rendering for the Dashboard?
The home page (`/`) and job detail pages (`/jobs/[id]`) are server-rendered. The database queries run on the server, and the data is passed to client components as props. This means the page loads with data already present — no loading spinners on initial render. Client-side state then takes over for interactions (status changes, deletes, adding new jobs).

### Why Store JSON Arrays as Strings in SQLite?
SQLite doesn't have a native JSON column type. Requirements, fit reasoning, and potential improvements are stored as `JSON.stringify()`'d strings and parsed back on read. Prisma's type system handles this at the API boundary so components always receive proper arrays.

### Why a Single Resume Model?
The design intentionally stores only one resume at a time. Uploading a new resume deletes the previous one (`deleteMany` then `create`). This keeps the UX simple — your fit scores always reflect your current resume. A multi-resume system would add complexity around which version to score against.

### Why Fetch HTML Instead of Using a Job Board API?
Job board APIs (LinkedIn, Indeed) are restrictive and require OAuth or paid access. Fetching raw HTML and using Claude to parse it works with any URL from any job board, company career page, or even a plain text posting. The HTML is truncated to 50,000 characters to stay within token limits.

### Robust JSON Extraction from AI Responses
Claude occasionally wraps JSON in markdown code fences or adds surrounding text. The `extractJSON` utility handles this gracefully: it first tries direct `JSON.parse`, then strips markdown fences, then finds the first `{...}` or `[...]` block. This makes the extraction resilient without fragile prompt engineering.

### The `Frontend/` Directory
The `Frontend/` folder is a separate Next.js project used during initial UI prototyping and design exploration. It contains hardcoded sample data and served as a reference implementation. The main application lives entirely within `src/` and the `tsconfig.json` excludes `Frontend/` from compilation.

### Prisma Client Singleton
The Prisma client uses the standard Next.js singleton pattern (`globalForPrisma`) to prevent creating multiple database connections during hot module replacement in development.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (comes with Node.js)
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/Job_Application_Tracker.git
cd Job_Application_Tracker
```

2. **Install dependencies**

```bash
npm install
```

This also runs `prisma generate` automatically via the `postinstall` script.

3. **Set up environment variables**

```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
DATABASE_URL="file:./dev.db"
```

4. **Initialize the database**

```bash
npx prisma migrate dev
```

This creates the SQLite database file at `prisma/dev.db` and applies all migrations.

5. **Start the development server**

```bash
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### Usage

1. **Upload your resume** — Click the "Upload PDF" button and select your resume PDF. The text content is extracted and stored for fit analysis.

2. **Track a job** — Paste a job posting URL into the input field and click "Track Job" (or press Enter). The app fetches the page, extracts job details, and scores your resume fit. This typically takes 10–15 seconds.

3. **Review your applications** — The dashboard table shows all tracked jobs with their fit scores and statuses. Click any row to expand a quick preview, or click the role name to open the full detail page.

4. **Update status** — Use the status dropdown on any row to move a job through your pipeline (Saved → Applied → Phone Screen → Technical → Final → Offer/Rejected).

5. **Add notes** — On the job detail page, use the notes section to jot down interview prep, recruiter contacts, or follow-up reminders. Notes auto-save when you click away.

6. **Check off requirements** — On the detail page, use the requirements checklist to track which qualifications you meet.

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── jobs/
│   │   │   ├── route.ts              # GET all jobs, POST new job (with AI enrichment)
│   │   │   └── [id]/route.ts         # PATCH status/notes, DELETE job
│   │   └── resume/
│   │       └── route.ts              # GET/POST/DELETE resume
│   ├── jobs/[id]/page.tsx            # Job detail page (server-rendered)
│   ├── page.tsx                      # Dashboard home (server-rendered)
│   ├── layout.tsx                    # Root layout with theme provider
│   └── globals.css                   # Theme variables, neon effects, glitch animations
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (badge, button, card, etc.)
│   ├── dashboard.tsx                 # Client-side state management wrapper
│   ├── job-tracker-dashboard.tsx     # Main dashboard UI (table, URL input, resume upload)
│   ├── job-detail-view.tsx           # Full job detail page UI
│   ├── glitch-text.tsx               # Cyberpunk glitch hover effects
│   ├── fit-badge.tsx                 # Fit score badge component
│   ├── status-select.tsx             # Status dropdown component
│   ├── resume-upload.tsx             # Resume upload component
│   └── theme-provider.tsx            # next-themes provider wrapper
│
├── lib/
│   ├── enrichment.ts                 # AI pipeline: fetch URL → extract job → score fit
│   ├── prisma.ts                     # Prisma client singleton
│   ├── types.ts                      # Shared TypeScript types and constants
│   └── utils.ts                      # Utility functions (cn for class merging)
│
prisma/
├── schema.prisma                     # Database schema (Resume + Application models)
├── dev.db                            # SQLite database file (gitignored in production)
└── migrations/                       # Prisma migration history
```

---

## API Reference

### Jobs

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/jobs` | — | Returns all applications, newest first |
| `POST` | `/api/jobs` | `{ "url": "https://..." }` | Fetches job page, extracts data via AI, scores resume fit, creates application |
| `PATCH` | `/api/jobs/:id` | `{ "status": "APPLIED" }` and/or `{ "notes": "..." }` | Updates status and/or notes |
| `DELETE` | `/api/jobs/:id` | — | Deletes an application |

### Resume

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/resume` | — | Returns `{ hasResume, id, filename, contentLength, createdAt }` |
| `POST` | `/api/resume` | `FormData` with `file` field (PDF only) | Extracts text, replaces existing resume |
| `DELETE` | `/api/resume` | — | Removes all stored resumes |

### Status Values

`SAVED` · `APPLIED` · `PHONE_SCREEN` · `TECHNICAL` · `FINAL` · `OFFER` · `REJECTED`

---

## Database Schema

```prisma
model Resume {
  id        String   @id @default(cuid())
  filename  String
  content   String              // Extracted text from the PDF
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Application {
  id                    String   @id @default(cuid())
  url                   String
  company               String
  role                  String
  location              String
  salaryRange           String?  // Null if not listed
  summary               String   // AI-generated plain-English description
  requirements          String   // JSON array of key qualifications
  potentialImprovements String   // JSON array of actionable suggestions
  fitScore              Int      // 0–100 score from AI
  fitReasoning          String   // JSON array of 3 reasoning bullets
  status                String   @default("SAVED")
  notes                 String?  // User's personal notes
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## How It Works

### The Enrichment Pipeline

When you paste a URL and click "Track Job", three things happen sequentially:

**1. Page Fetch**
The server fetches the raw HTML from the job posting URL with a generic User-Agent header. The HTML is truncated to 50,000 characters to stay within Claude's context window.

**2. Job Data Extraction**
The HTML is sent to Claude with a structured prompt asking it to extract: company, role, location, salary range, requirements, nice-to-haves, and a summary. Claude returns a JSON object. The `extractJSON` utility handles edge cases where the response includes markdown fences or extra text.

**3. Resume Fit Scoring**
The extracted job data and the stored resume text are sent to Claude in a second request. Claude returns a fit score (0–100), exactly three reasoning bullets explaining the score, and 3–5 improvement suggestions. For near-perfect matches (score >= 90), it returns a single "perfect match" message instead.

The combined data is stored in the database and returned to the client, where it appears in the dashboard table.

### Data Flow

```
User pastes URL
       ↓
POST /api/jobs { url }
       ↓
enrichJob(url)
  ├── getResumeContent()       → Loads latest resume from DB
  ├── extractJobData(url)      → Fetches HTML, sends to Claude, parses JSON
  └── scoreResumeFit(job, resume) → Sends both to Claude, parses JSON
       ↓
prisma.application.create()    → Stores everything in SQLite
       ↓
JSON response → Client updates table
```

---

## Design & Theming

The app supports three theme modes via `next-themes`: **Light**, **Dark** (Cyber), and **System**.

### Light Mode
Clean, minimal design with a near-white background, black text, and muted accent colors. The neon colors are toned down to `oklch(0.5 ...)` values for comfortable readability.

### Dark Mode (Cyber)
A full cyberpunk aesthetic built with CSS custom properties:

- **Pure black base** (`oklch(0.05 0 0)`) for maximum neon contrast
- **Neon cyan** (`oklch(0.85 0.2 195)`) — primary accent, borders, headings, glows
- **Neon magenta** (`oklch(0.75 0.25 330)`) — secondary accent, links, highlights
- **Neon green** (`oklch(0.8 0.22 145)`) — success states, high fit scores, offer status
- **Neon orange** (`oklch(0.8 0.2 50)`) — warnings, medium fit scores, improvement cards

### Visual Effects (Dark Mode Only)
- **Neon glow** — Box shadows with multiple spread layers on cards and borders
- **Text glow** — Multi-layer text shadows on headings
- **Cyber grid** — Subtle background grid pattern using linear gradients
- **Glitch effects** — Hover-triggered skew and clip-path animations with cyan/magenta color splits
- **Neon pulse** — Pulsing box-shadow animation on the loading indicator
- **Ambient orbs** — Large blurred gradient circles fixed in the background corners

All cyberpunk effects are scoped behind `.dark` so they have zero impact on light mode rendering.

---

## License

MIT
