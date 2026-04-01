# Job Tracker

An AI-powered, multi-user job application tracker that lets you paste a job posting URL, automatically extracts all relevant details using Claude, and scores how well your resume fits the role — all from a single cyberpunk-themed dashboard. Built with Next.js 15, PostgreSQL on Neon, NextAuth v5 with OAuth, and deployed on Vercel.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Pipeline Flow Diagram](#pipeline-flow-diagram)
- [Database Schema](#database-schema)
- [Engineering Challenges](#engineering-challenges)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Design & Theming](#design--theming)

---

## Overview

Job Tracker solves a common pain point: keeping tabs on dozens of job applications while understanding how well each role actually fits your background. Instead of manually copying details from job postings into a spreadsheet, you upload your resume once, paste a URL, and the app does the rest — extracting the company, role, location, salary, requirements, and generating a personalized fit analysis against your resume.

What started as a single-user SQLite prototype evolved through multiple engineering milestones into a production-ready multi-user application with OAuth authentication, a PostgreSQL database on Neon, and a Vercel deployment — each step uncovering real-world engineering challenges documented in this README.

---

## Features

### AI-Powered Job Extraction
Paste any job posting URL and Claude (`claude-sonnet-4-20250514`) fetches the page, parses the HTML, and extracts structured data: company name, role title, location, salary range, requirements, nice-to-haves, and a plain-English summary.

### Resume Fit Scoring
Your uploaded resume is compared against each job posting. The AI returns a 0–100 fit score, three bullet points explaining the score, and 3–5 actionable improvement suggestions (resume tweaks, projects to build, skills to learn, certifications to consider). Jobs scoring 90+ get a "perfect match" designation with no improvements needed.

### Multi-User Authentication
Sign in with Google, GitHub, or email/password. NextAuth v5 handles OAuth flows, JWT sessions, and account linking. Each user has their own isolated set of applications and resume data.

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
| **Database** | PostgreSQL on Neon (via Prisma 6) | Serverless Postgres with branching and auto-scaling, migrated from SQLite for multi-user support |
| **Auth** | NextAuth v5 (Auth.js) + PrismaAdapter | JWT sessions, Google/GitHub OAuth, email/password with bcrypt, account linking |
| **AI** | Anthropic Claude (claude-sonnet-4-20250514) | High-quality structured data extraction from raw HTML and nuanced resume fit analysis |
| **PDF Parsing** | pdf-parse | Extracts raw text from uploaded PDF resumes |
| **Theming** | next-themes | Light/dark/system theme switching with `class` strategy and no transition flash |
| **Icons** | Lucide React | Consistent icon set across the UI |
| **Deployment** | Vercel | Zero-config Next.js hosting with serverless functions, preview deployments, and environment variable management |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL (Production)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────────────────────┐   │
│  │   Middleware  │───▶│              Next.js 15 App Router               │   │
│  │ (Auth Guard)  │    │                                                  │   │
│  └──────────────┘    │  ┌────────────────┐  ┌───────────────────────┐   │   │
│                       │  │  Server Pages   │  │    API Routes         │   │   │
│                       │  │                │  │                       │   │   │
│                       │  │  / (Landing)    │  │  /api/auth/[...next]  │   │   │
│                       │  │  /dashboard     │  │  /api/auth/register   │   │   │
│                       │  │  /jobs/[id]     │  │  /api/jobs            │   │   │
│                       │  │  /auth/signin   │  │  /api/jobs/[id]       │   │   │
│                       │  │  /auth/signup   │  │  /api/resume          │   │   │
│                       │  └────────────────┘  └───────────┬───────────┘   │   │
│                       └──────────────────────────────────┼───────────────┘   │
│                                                          │                   │
│  ┌───────────────────────────────────────────────────────┼───────────────┐   │
│  │                     Server-Side Libraries             │               │   │
│  │                                                       │               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────▼──────────┐    │   │
│  │  │  NextAuth v5  │  │  pdf-parse   │  │   Enrichment Pipeline  │    │   │
│  │  │  (JWT + OAuth)│  │  (PDF → Text)│  │   (Claude AI × 2)      │    │   │
│  │  └──────┬───────┘  └──────────────┘  └──────────┬──────────────┘    │   │
│  │         │                                        │                   │   │
│  │         │         ┌──────────────────┐           │                   │   │
│  │         │         │   Prisma ORM     │◀──────────┘                   │   │
│  │         └────────▶│   (Type-safe)    │                               │   │
│  │                   └────────┬─────────┘                               │   │
│  └────────────────────────────┼──────────────────────────────────────────┘   │
│                               │                                              │
└───────────────────────────────┼──────────────────────────────────────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                     │
           ▼                    ▼                     ▼
  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
  │  Neon Postgres   │ │  Google OAuth    │ │  Anthropic API  │
  │  (Database)      │ │  GitHub OAuth    │ │  (Claude)       │
  └─────────────────┘ └──────────────────┘ └─────────────────┘
```

### Key Design Decisions

**Why Server-Side Rendering for the Dashboard?**
The dashboard (`/dashboard`) and job detail pages (`/jobs/[id]`) are server-rendered. Database queries run on the server and data is passed to client components as props. Pages load with data already present — no loading spinners on initial render. Client-side state then takes over for interactions (status changes, deletes, adding new jobs).

**Why JWT Sessions Instead of Database Sessions?**
JWT sessions avoid an extra database query on every request. The token carries the user ID, and the middleware can validate it without touching the database. This keeps the auth layer stateless and fast.

**Why a Single Resume Model?**
The design intentionally stores only one resume at a time. Uploading a new resume deletes the previous one (`deleteMany` then `create`). This keeps the UX simple — your fit scores always reflect your current resume.

**Why Fetch HTML Instead of Using a Job Board API?**
Job board APIs (LinkedIn, Indeed) are restrictive and require OAuth or paid access. Fetching raw HTML and using Claude to parse it works with any URL from any job board, company career page, or even a plain text posting. The HTML is truncated to 50,000 characters to stay within token limits.

**Why `allowDangerousEmailAccountLinking`?**
Users who sign up with Google and later try GitHub (or vice versa) with the same email get an `OAuthAccountNotLinked` error. Since both Google and GitHub verify email addresses, enabling this flag is safe and prevents a confusing UX dead-end.

**Why Prisma Client Singleton?**
The Prisma client uses the standard Next.js singleton pattern (`globalForPrisma`) to prevent creating multiple database connections during hot module replacement in development.

---

## Pipeline Flow Diagram

This is the core AI enrichment pipeline that runs when a user pastes a job URL:

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                        USER ACTION                                   │
  │              Pastes job URL → clicks "Track Job"                     │
  └─────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                     POST /api/jobs { url }                           │
  │              Authenticated via JWT session cookie                     │
  └─────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                    enrichJob(url, userId)                             │
  │                                                                      │
  │  ┌────────────────────────────────────────────────────────────────┐  │
  │  │  STEP 1: Load Resume                                           │  │
  │  │  getResumeContent(userId) → Prisma query → resume text         │  │
  │  │  ⚠ Throws if no resume uploaded                                │  │
  │  └────────────────────────────────┬───────────────────────────────┘  │
  │                                   │                                  │
  │                                   ▼                                  │
  │  ┌────────────────────────────────────────────────────────────────┐  │
  │  │  STEP 2: Extract Job Data                                      │  │
  │  │                                                                │  │
  │  │  fetchUrl(url)                                                 │  │
  │  │    → HTTP GET with generic User-Agent                          │  │
  │  │    → Truncate HTML to 50,000 chars                             │  │
  │  │                                                                │  │
  │  │  Claude API Call #1 (temperature: 0)                           │  │
  │  │    → Send HTML with structured extraction prompt               │  │
  │  │    → extractJSON() parses response with 3-tier fallback:       │  │
  │  │        1. Direct JSON.parse                                    │  │
  │  │        2. Strip markdown code fences                           │  │
  │  │        3. Bracket extraction (first { to last })               │  │
  │  │                                                                │  │
  │  │  Output: { company, role, location, salary_range,              │  │
  │  │           requirements[], nice_to_haves[], summary }           │  │
  │  └────────────────────────────────┬───────────────────────────────┘  │
  │                                   │                                  │
  │                                   ▼                                  │
  │  ┌────────────────────────────────────────────────────────────────┐  │
  │  │  STEP 3: Score Resume Fit                                      │  │
  │  │                                                                │  │
  │  │  Claude API Call #2 (temperature: 0)                           │  │
  │  │    → Send resume text + extracted job data                     │  │
  │  │    → extractJSON() parses response                             │  │
  │  │                                                                │  │
  │  │  Output: { fit_score (0-100),                                  │  │
  │  │           fit_reasoning[3],                                    │  │
  │  │           potential_improvements[3-5] }                        │  │
  │  │                                                                │  │
  │  │  If fit_score >= 90:                                           │  │
  │  │    improvements = ["Perfect match — no improvements needed!"]  │  │
  │  └────────────────────────────────┬───────────────────────────────┘  │
  │                                   │                                  │
  └───────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                   prisma.application.create()                        │
  │        Store merged job data + fit score in PostgreSQL               │
  │   (requirements & improvements serialized as JSON strings)           │
  └─────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                     JSON Response → Client                           │
  │          Dashboard table updates with new application row            │
  │    (company, role, location, fit score badge, status dropdown)       │
  └──────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
  User clicks "Sign in with Google/GitHub"
         │
         ▼
  NextAuth → Redirect to OAuth provider
         │
         ▼
  Provider authenticates → callback to /api/auth/callback/[provider]
         │
         ▼
  PrismaAdapter creates/links User + Account rows in PostgreSQL
         │
         ▼
  JWT issued with user.id → stored as httpOnly session cookie
         │
         ▼
  Middleware reads cookie on every request:
    • Public routes (/, /auth/*) → pass through
    • API routes → pass through (APIs check auth internally)
    • Protected routes (/dashboard, /jobs/*) → redirect to /auth/signin if no token
    • Already logged in + hitting /auth/* → redirect to /dashboard
```

---

## Database Schema

The app uses 6 tables in PostgreSQL, managed by Prisma:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATABASE SCHEMA                              │
│                         (PostgreSQL on Neon)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐       ┌──────────────────┐                       │
│  │      users        │──────▶│    accounts       │                       │
│  │──────────────────│  1:N  │──────────────────│                       │
│  │ id          cuid │       │ id          cuid │                       │
│  │ name        str? │       │ userId      FK   │                       │
│  │ email       uniq │       │ provider    str  │                       │
│  │ password    str? │       │ providerAccountId│                       │
│  │ image       str? │       │ access_token  T? │                       │
│  │ emailVerified D? │       │ refresh_token T? │                       │
│  │ created_at   now │       │ id_token      T? │                       │
│  │ updated_at   upd │       └──────────────────┘                       │
│  └───────┬──────────┘                                                   │
│          │                  ┌──────────────────┐                       │
│          ├─────────────────▶│    sessions       │                       │
│          │            1:N  │──────────────────│                       │
│          │                  │ id          cuid │                       │
│          │                  │ sessionToken uniq│                       │
│          │                  │ userId      FK   │                       │
│          │                  │ expires     date │                       │
│          │                  └──────────────────┘                       │
│          │                                                              │
│          │                  ┌──────────────────┐                       │
│          ├─────────────────▶│    resumes         │                       │
│          │            1:N  │──────────────────│                       │
│          │                  │ id          cuid │                       │
│          │                  │ filename    str  │                       │
│          │                  │ content     text │  ◀── extracted PDF text │
│          │                  │ userId      FK   │                       │
│          │                  │ created_at   now │                       │
│          │                  │ updated_at   upd │                       │
│          │                  └──────────────────┘                       │
│          │                                                              │
│          │                  ┌───────────────────────────┐              │
│          └─────────────────▶│    applications             │              │
│                       1:N  │───────────────────────────│              │
│                             │ id                   cuid │              │
│                             │ url                  str  │              │
│                             │ company              str  │              │
│                             │ role                 str  │              │
│                             │ location             str  │              │
│                             │ salary_range         str? │              │
│                             │ summary              text │              │
│                             │ requirements         text │ ◀─ JSON str  │
│                             │ potential_improvements text│ ◀─ JSON str  │
│                             │ fit_score            int  │ ◀─ 0–100     │
│                             │ fit_reasoning        text │ ◀─ JSON str  │
│                             │ status               str  │ ◀─ pipeline  │
│                             │ notes                str? │              │
│                             │ userId               FK   │              │
│                             │ created_at           now  │              │
│                             │ updated_at           upd  │              │
│                             └───────────────────────────┘              │
│                                                                         │
│  ┌──────────────────────┐                                              │
│  │ verification_tokens   │  (for email verification, not yet used)      │
│  │──────────────────────│                                              │
│  │ identifier    str    │                                              │
│  │ token         str    │                                              │
│  │ expires       date   │                                              │
│  └──────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Status pipeline values:** `SAVED` · `APPLIED` · `PHONE_SCREEN` · `TECHNICAL` · `FINAL` · `OFFER` · `REJECTED`

---

## Engineering Challenges

Building this project involved a series of real-world engineering challenges across scaffolding, AI integration, database migrations, OAuth, and deployment. Each section below documents what went wrong, why, and how it was resolved.

### 1. Initial Scaffolding: Death by a Thousand Papercuts

The very first build session hit a gauntlet of tooling issues:

- **npm name validation:** `create-next-app` rejected the directory name `Job_Application_Tracker` because npm forbids capital letters and underscores in package names. Had to scaffold in a temp directory and copy files over.

- **Next.js version mismatch:** `create-next-app@latest` installed Next.js 16 instead of the requested 15. Had to redo scaffolding with an explicit `create-next-app@15` to pin the version.

- **Prisma v6 breaking changes:** Prisma 6 changed its default generator from `prisma-client-js` to `prisma-client` and moved the generated output from `node_modules/@prisma/client` to `src/generated/prisma`. Turbopack couldn't resolve the new path. Reverted to the classic `prisma-client-js` provider.

- **SQLite database path resolution:** `file:./dev.db` resolved differently between Prisma CLI (relative to `prisma/schema.prisma`) and Next.js runtime (relative to project root), creating two separate `.db` files. Removed the `prisma.config.ts` file and relied on classic Prisma behavior where paths resolve relative to the schema file directory.

- **pdf-parse web worker crash:** `pdf-parse` v3 tried to load a `pdf.worker.mjs` web worker incompatible with Turbopack's server environment. Downgraded to v1.1.1, which then had a different bug — it tries to load a test PDF file on import. Fixed by importing `pdf-parse/lib/pdf-parse.js` directly.

### 2. AI Response Parsing: Claude Doesn't Always Return JSON

The enrichment pipeline assumed Claude would return clean JSON. It didn't.

**Failure modes discovered:**
1. Claude wrapped JSON in markdown code fences (`` ```json ... ``` ``)
2. Claude returned natural language ("The page could not be loaded...") instead of JSON
3. Claude used the `fetch_url` tool-use pattern instead of responding with text

**Solution:** Built a 3-tier `extractJSON` utility:
1. Direct `JSON.parse` (ideal case)
2. Strip markdown code fence wrappers via regex
3. Find the first `{...}` or `[...]` block via bracket extraction

Also refactored the pipeline to fetch URLs server-side (bypassing Claude's tool-use pattern entirely) and pass raw HTML directly in the prompt. This eliminated an entire class of non-JSON responses.

### 3. Inconsistent Fit Scores: The Two-Temperature Problem

The same job URL scanned multiple times produced fit scores varying from 78% to 82%.

**Root cause:** The two-stage pipeline had `temperature: 0` set on `scoreResumeFit` (step 2) but not on `extractJobData` (step 1). The extraction step produced slightly different requirements and summaries each time, feeding different inputs into the deterministic scorer.

**Fix:** Set `temperature: 0` on both Claude API calls. Scores now reproduce identically for the same URL + resume combination.

### 4. SQLite to PostgreSQL Migration

The shift from a single-user SQLite app to a multi-user PostgreSQL app was a multi-step migration:

- **PostgreSQL installation:** Docker wasn't running, so fell back to a Homebrew install of PostgreSQL 16. Created the database, user, and configured the connection string.

- **Schema redesign:** Added 4 new auth tables (`users`, `accounts`, `sessions`, `verification_tokens`). Extended `resumes` and `applications` with a `userId` foreign key and cascade deletes. Every query now scopes by the authenticated user.

- **Column rename gotcha:** An earlier migration renamed `nice_to_haves` to `potential_improvements`. Prisma treated this as a drop + create, which fails with existing data. Had to write a manual `ALTER TABLE ... RENAME COLUMN` migration.

### 5. OAuth: Redirect URIs, Account Linking, and Missing Adapters

Setting up Google and GitHub OAuth surfaced three distinct issues:

**Redirect URI mismatch (Error 400):** Google OAuth returned `redirect_uri_mismatch` because the callback URL `http://localhost:3000/api/auth/callback/google` wasn't registered in Google Cloud Console. Same for GitHub — both providers require exact callback URLs.

**`OAuthAccountNotLinked` error:** A user who signed in with Google, then later tried GitHub with the same email, hit NextAuth's account linking protection. Since both providers verify email addresses, this was safely resolved with `allowDangerousEmailAccountLinking: true` on both providers.

**Foreign key constraint on resume upload:** After deploying auth, resume uploads failed with `Foreign key constraint violated on resumes_user_id_fkey`. The root cause was subtle: `auth.ts` was configured with JWT sessions but had no `PrismaAdapter`. When users signed in via OAuth, Auth.js created a JWT with the provider's user ID but never created a `User` row in the database. Adding `PrismaAdapter(prisma)` to the NextAuth config fixed it — the adapter ensures user records are created on first OAuth sign-in.

### 6. Vercel Deployment: Silent Crashes and Auth Misconfigurations

**Silent build crash:** The Vercel build log ended abruptly after `prisma generate` with zero error output. The culprit was `next build --turbopack` in the build script. Turbopack production builds were still experimental in Next.js 15.x and caused silent segfaults on Vercel. Removing `--turbopack` from the build command (keeping it on `dev` only) fixed the issue.

**Auth.js CSRF errors in production:** After deploying, all auth flows failed with CSRF validation errors. Two issues:
1. **Environment variable naming:** Auth.js v5 expects `AUTH_SECRET` (not the v4 name `NEXTAUTH_SECRET`). Renamed all env vars from `NEXTAUTH_*` to `AUTH_*`.
2. **Proxy trust:** Vercel sits behind a reverse proxy, so the `Host` header doesn't match the actual domain. Adding `trustHost: true` to the NextAuth config tells Auth.js to trust the `x-forwarded-host` header.

### 7. UI Integration: Two Worlds Collide

Integrating a cyberpunk UI prototype from a separate `Frontend/` directory created several conflicts:

- **Component library mismatch:** The existing project used `@base-ui/react` (shadcn v4 default) while the prototype used `@radix-ui/react-*`. Had to replace all `src/components/ui/` files and install the Radix packages.

- **TypeScript compilation leak:** The `Frontend/` directory's TypeScript files were being picked up by the compiler, causing build errors from prototype code. Fixed by adding `"Frontend"` to the `tsconfig.json` `exclude` array.

- **Persistent `whitespace-nowrap` bug:** The shadcn `TableCell` component had `whitespace-nowrap` baked into its styles. This caused text in expanded dashboard rows to overflow instead of wrapping. Required adding `whitespace-normal` overrides wherever table cells needed to display paragraphs of text.

- **Dark theme checkbox visibility:** Checkbox outlines were nearly invisible against the cyberpunk dark background because the default border color (`oklch(0.12)`) had almost no contrast. Changed to `border-white/60` for sufficient visibility.

### Challenge Timeline

| Phase | Challenge | Resolution |
|-------|-----------|------------|
| Scaffolding | npm name validation, Next.js 16 vs 15, Prisma v6 output path | Manual scaffolding, version pinning, classic provider |
| Scaffolding | SQLite path resolution, pdf-parse worker crash | Removed prisma.config.ts, imported pdf-parse submodule |
| AI Pipeline | Claude returning non-JSON responses | 3-tier `extractJSON` fallback, direct HTML injection |
| AI Pipeline | Fit scores varying ±4 points per scan | Set `temperature: 0` on both API calls |
| Database | SQLite → PostgreSQL migration | Homebrew Postgres, schema redesign, manual column rename |
| Auth | OAuth redirect URI mismatch | Register exact callback URLs in provider consoles |
| Auth | `OAuthAccountNotLinked` across providers | `allowDangerousEmailAccountLinking: true` |
| Auth | Missing PrismaAdapter → FK constraint violations | Added `PrismaAdapter(prisma)` to NextAuth config |
| Deployment | Turbopack silent crash on Vercel | Removed `--turbopack` from production build |
| Deployment | Auth.js CSRF errors | `AUTH_SECRET` env var + `trustHost: true` |
| UI | Component library mismatch | Replaced base-ui with Radix UI primitives |
| UI | TypeScript compiling prototype directory | Added `Frontend` to tsconfig exclude |
| UI | Table cell text overflow | Override `whitespace-nowrap` on expanded rows |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** (local install or a Neon account at [neon.tech](https://neon.tech))
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)
- **Google OAuth credentials** — create at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **GitHub OAuth credentials** — create at [GitHub Developer Settings](https://github.com/settings/developers)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/shivam-singh-git/Job_Application_Tracker.git
cd Job_Application_Tracker
```

2. **Install dependencies**

```bash
npm install
```

This also runs `prisma generate` automatically via the `postinstall` script.

3. **Set up the database**

If using Neon, create a project at [neon.tech](https://neon.tech) and copy the connection string. If using local PostgreSQL:

```bash
createdb job_tracker
```

4. **Set up environment variables**

Create a `.env` file in the project root:

```
DATABASE_URL="postgresql://user:password@host:5432/job_tracker"
AUTH_SECRET="your-random-secret-string"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxx"
```

Generate `AUTH_SECRET` with: `openssl rand -base64 32`

5. **Configure OAuth callback URLs**

In Google Cloud Console, add this authorized redirect URI:
```
http://localhost:3000/api/auth/callback/google
```

In GitHub Developer Settings, set the callback URL to:
```
http://localhost:3000/api/auth/callback/github
```

For production, replace `localhost:3000` with your Vercel domain.

6. **Run database migrations**

```bash
npx prisma migrate dev
```

7. **Start the development server**

```bash
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### Usage

1. **Sign up / Sign in** — Create an account with email/password, or sign in with Google or GitHub.
2. **Upload your resume** — Click "Upload PDF" and select your resume. The text content is extracted and stored for fit analysis.
3. **Track a job** — Paste a job posting URL and click "Track Job". The AI fetches the page, extracts details, and scores your fit (10–15 seconds).
4. **Review applications** — The dashboard table shows all tracked jobs with fit scores and statuses.
5. **Update status** — Use the status dropdown to move jobs through your pipeline.
6. **Add notes** — On the detail page, use the notes section for interview prep and follow-ups. Notes auto-save on blur.

### Production Build

```bash
npm run build
npm start
```

### Deploying to Vercel

1. Push your repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard (Settings → Environment Variables)
4. Update OAuth callback URLs to use your Vercel production domain
5. Deploy — Vercel auto-detects Next.js and handles the build

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler (GET/POST)
│   │   │   └── register/route.ts        # Email/password registration
│   │   ├── jobs/
│   │   │   ├── route.ts                 # GET all jobs, POST new job (with AI enrichment)
│   │   │   └── [id]/route.ts            # PATCH status/notes, DELETE job
│   │   └── resume/
│   │       └── route.ts                 # GET/POST/DELETE resume
│   ├── auth/
│   │   ├── signin/page.tsx              # Sign-in page (OAuth + credentials)
│   │   └── signup/page.tsx              # Sign-up page (OAuth + registration)
│   ├── dashboard/page.tsx               # Main dashboard (server-rendered, auth-gated)
│   ├── jobs/[id]/page.tsx               # Job detail page (server-rendered)
│   ├── page.tsx                         # Landing page (public)
│   ├── layout.tsx                       # Root layout (SessionProvider, ThemeProvider, fonts)
│   └── globals.css                      # Theme variables, neon effects, glitch animations
│
├── components/
│   ├── ui/                              # shadcn/ui primitives (badge, button, card, etc.)
│   ├── dashboard.tsx                    # Client-side dashboard state management
│   ├── job-tracker-dashboard.tsx        # Dashboard UI (table, URL input, resume upload)
│   ├── job-detail-view.tsx              # Full job detail page UI
│   ├── fit-badge.tsx                    # Color-coded fit score badge
│   ├── status-select.tsx                # Pipeline status dropdown
│   ├── resume-upload.tsx                # PDF upload with drag-and-drop
│   ├── glitch-text.tsx                  # Cyberpunk glitch hover effect
│   └── theme-provider.tsx               # next-themes wrapper
│
├── lib/
│   ├── auth.ts                          # NextAuth config (providers, adapter, callbacks)
│   ├── auth-helpers.ts                  # JWT decode for API route authentication
│   ├── enrichment.ts                    # AI pipeline: fetch URL → extract → score
│   ├── prisma.ts                        # Prisma client singleton
│   ├── types.ts                         # Shared types (JobData, FitScore, statuses)
│   └── utils.ts                         # cn() class merge utility
│
├── middleware.ts                         # Route protection (public vs auth-gated)
└── types/next-auth.d.ts                 # NextAuth session type augmentation

prisma/
├── schema.prisma                        # Database schema (6 models)
└── migrations/                          # PostgreSQL migration history

scripts/
└── create-auth-tables.sql               # Standalone SQL for manual auth table setup
```

---

## API Reference

All API routes (except `/api/auth/*`) require authentication via JWT session cookie.

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET/POST` | `/api/auth/[...nextauth]` | — | NextAuth handler (OAuth callbacks, session, CSRF) |
| `POST` | `/api/auth/register` | `{ name, email, password }` | Create account with email/password (bcrypt, 12 rounds) |

### Jobs

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/jobs` | — | Returns all applications for the authenticated user, newest first |
| `POST` | `/api/jobs` | `{ "url": "https://..." }` | Fetches job page, extracts data via AI, scores resume fit, creates application |
| `PATCH` | `/api/jobs/:id` | `{ "status": "APPLIED" }` and/or `{ "notes": "..." }` | Updates status and/or notes (ownership verified) |
| `DELETE` | `/api/jobs/:id` | — | Deletes an application (ownership verified) |

### Resume

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/resume` | — | Returns `{ hasResume, id, filename, contentLength, createdAt }` |
| `POST` | `/api/resume` | `FormData` with `file` field (PDF only) | Extracts text via pdf-parse, replaces existing resume |
| `DELETE` | `/api/resume` | — | Removes all stored resumes for the user |

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
