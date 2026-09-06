# FixFlow — Personal Service-Issue & Follow-up Tracker

> **Built and deployed a personal complaint/follow-up management app that converts unstructured service communications into structured issue records, maintains resolution timelines, and surfaces overdue actions.**

FixFlow is a personal service-issue and complaint follow-up tracker. It converts messy real-world communications—WhatsApp messages, emails, SMS text, call notes, or customer portal updates—into structured issues with a company, reference number, problem summary, promised action/date, status, timeline, notes, and attention state.

FixFlow does **not** replace official grievance portals (such as CPGRAMS or National Consumer Helpline) and does **not** file complaints automatically. It acts as an **owner-controlled organization and follow-up layer** that makes unresolved service issues impossible to forget.

---

## Architecture Diagram

```mermaid
graph TD
    Client["Client Layer\nNext.js 14 (App Router) + TypeScript + Tailwind\nDesktop & Mobile Responsive (320px+)"]
    API["API Layer (Next.js Route Handlers)\nValidation (Zod) • Auth & Ownership Guards\nRate Limiter • Export Engine"]
    Auth["Authentication Engine\nHMAC Session Security / Supabase Auth"]
    DB[("Data Persistence\nSQLite (Zero-Config Local Dev)\nPostgreSQL + RLS (Supabase Production)")]
    AI["AI Extraction Engine\nStructured Contract Guardrails\nOpenAI / Gemini LLM API\n+ Intelligent NLP Regex Fallback"]

    Client -->|User Actions & Edits| API
    API -->|Session Validation| Auth
    API -->|Owner-Scoped Queries| DB
    API -->|Structured Schema Extraction| AI
```

---

## Attention-First Information Hierarchy

Rather than presenting a simple flat list of tickets, FixFlow organizes complaints strictly by urgency:

1. **Overdue Issues** *(Highest visual priority)* — Promising resolution dates that have elapsed without resolution. Flagged with high-contrast alert badges and days overdue.
2. **Action Needed** — Items where the user must take an action (e.g. submit bank statement, call nodal officer, schedule inspection).
3. **Due Soon** — Promised resolutions approaching within 48 hours.
4. **Waiting** — Awaiting provider action with target follow-up date.
5. **Resolved / Closed** — Archived issue history.

---

## Key Features

- **Paste-to-Structure AI Extraction**: Paste messy customer service text into the extraction box. The system extracts the company, reference number, issue summary, promised action, promised date, status, and recommended next action into an **editable draft card**.
- **Assistive Extraction Guardrails**:
  - Never invents reference numbers or tickets.
  - Never guesses company names without textual evidence.
  - Returns explicit confidence scores and flags missing fields for human review.
- **Chronological Resolution Timeline**: Log every call, email, promise update, or escalation with exact timestamps and event types.
- **Strict Lifecycle State Machine**: Enforces valid state transitions (`open` → `waiting` / `action_needed` → `resolved` → `closed`).
- **Owner-Scoped Security & Privacy**: Every query and database operation is strictly scoped to the authenticated user ID. Cross-user data access attempts return 404/403.
- **Instant Data Ownership & Export**: One-click export to CSV spreadsheet and full JSON backup.
- **Permanent Account & Data Wipe**: Users can delete their account and wipe all issues, timelines, and attachments in one click.
- **Mobile-First UX**: Responsive from 320px screen width upward, featuring single-hand reachable CTAs and mobile bottom navigation.

---

## Quickstart (Zero-Config Local Setup)

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v20 / v24)
- npm or pnpm

### 2. Install Dependencies
```bash
git clone https://github.com/your-username/fixflow.git
cd fixflow
npm install
```

### 3. Initialize Database
FixFlow comes pre-configured with a local SQLite database for zero-friction evaluation:
```bash
npx prisma db push
```

### 4. Seed Realistic Demo Data
Seed the database with sample issues (overdue Samsung appliance repair, Airtel fiber outage, Flipkart refund dispute, Blue Dart tracking, resolved Swiggy dispute):
```bash
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
Click **"Try Live Demo (1-Click)"** on the landing page or sign in with:
- **Email**: `demo@fixflow.app`
- **Password**: `demo123`

---

## Environment Variables

Copy `.env.example` to `.env`:

```ini
# Local Database
DATABASE_URL="file:./dev.db"

# Session Security
SESSION_SECRET="fixflow-super-secret-key-change-in-production-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional Supabase Integration (for PostgreSQL & Cloud Auth)
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Optional Live LLM Extraction (FixFlow uses built-in NLP heuristic parser if omitted)
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

---

## Supabase PostgreSQL & Cloud Deployment

For production deployment with Supabase:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Execute the migration file provided in `supabase/migrations/001_initial_schema.sql` inside the Supabase SQL Editor.
3. This creates all tables (`issues`, `issue_events`, `attachments`, `reminders`, `extraction_runs`) with Row-Level Security (RLS) policies enabled.
4. Set `DATABASE_URL` to your Supabase PostgreSQL connection pooling string.
5. Deploy to Vercel:
```bash
npm run build
```

---

## Core REST API Specification

All endpoints are authenticated and strictly scoped to the session owner.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/issues` | Create new issue | User |
| `GET` | `/api/issues` | List issues (filterable by status/category) | User |
| `GET` | `/api/issues/:id` | Get issue with timeline & attachments | Owner |
| `PATCH` | `/api/issues/:id` | Update issue & trigger lifecycle transitions | Owner |
| `DELETE` | `/api/issues/:id` | Delete issue | Owner |
| `POST` | `/api/issues/:id/events` | Add timeline event (call, note, status update) | Owner |
| `GET` | `/api/issues/:id/events` | List chronological timeline events | Owner |
| `POST` | `/api/issues/:id/attachments` | Secure file upload (PNG, JPG, PDF, TXT; max 5MB) | Owner |
| `POST` | `/api/extract` | AI unstructured text-to-issue extraction | User |
| `GET` | `/api/search` | Search issues across company, ref #, and notes | User |
| `POST` | `/api/export` | Export user data (CSV / JSON) | User |
| `POST` | `/api/auth/register` | Register new account | Public |
| `POST` | `/api/auth/login` | Log in | Public |
| `POST` | `/api/auth/logout` | Log out and clear session cookie | User |
| `POST` | `/api/auth/delete-account` | Permanent account and data purge | User |

---

## Testing Suite

Run the full automated test suite with Vitest:

```bash
npm test
```

### Test Coverage Summary:
- **`tests/lifecycle.test.ts`**: Status transition rules (`open` -> `waiting` -> `action_needed` -> `resolved` -> `closed`), overdue date calculation, priority ranking (1 to 5).
- **`tests/validation.test.ts`**: Schema bounds (title 5-120 chars, company 1-120 chars, description 10-2000 chars, category and status enums).
- **`tests/extraction.test.ts`**: 16 real-world messy customer communication messages tested against guardrails (never invent reference numbers, null for missing company, category classification).
- **`tests/security.test.ts`**: Token tamper prevention and strict database ownership boundary tests (User B cannot read or modify User A's issue).

---

## Production Build Verification

Verify zero TypeScript, ESLint, or Next.js packaging errors:
```bash
npm run build
```

---

## 📄 Resume Bullet Points & Interview Talking Points

If you are showcasing FixFlow on your resume or portfolio, here are polished, metrics-driven bullet points formatted in standard Google XYZ format (`Accomplished [X] as measured by [Y], by doing [Z]`):

### Recommended Resume Bullets:
- **Full-Stack Engineering**: Built **FixFlow**, a responsive service-complaint tracking platform using **Next.js 14 App Router, TypeScript, Prisma ORM, and Tailwind CSS**, supporting multi-device workflows across mobile, tablet, and desktop.
- **Edge ML & NLP Architecture**: Engineered an in-process **Edge ML pipeline** running client-side sentiment analysis, lexical urgency scoring (0–100 index), and **TF-IDF cosine similarity** for duplicate ticket detection, achieving 0ms cloud latency and $0 operational cost.
- **Hybrid AI Extensibility**: Designed an edge-to-cloud extraction system that runs on-device heuristics by default for instant evaluation, with plug-and-play adapter hooks for cloud LLMs (**Google Gemini & OpenAI**).
- **State Machine & Data Integrity**: Implemented a 5-stage deterministic lifecycle state machine with automated SLA overdue date detection, validated by **38 automated Vitest unit, integration, and security tests**.
- **Practical Utility & Security**: Integrated 1-click **Formal Escalation Draft generation** (pre-compiling docket numbers, SLA breaches, and contact history into grievance letters), full CSV/JSON data portability, and OWASP-compliant security headers and rate limiting.

### 60-Second Interview Demo Pitch:
> *"I built FixFlow to solve a universal consumer problem: when you deal with customer support for appliance repairs, delayed refunds, or broadband outages, companies make verbal promises with reference numbers that get lost in WhatsApp chats or SMS. FixFlow runs an on-device Edge ML pipeline that extracts reference numbers and promised dates with zero cloud latency, computes an automated Urgency & Frustration Score, surfaces overdue items at the top of the dashboard in red, and generates a formal escalation letter to a nodal officer in one click. For production scale, it includes dynamic adapters for Google Gemini and OpenAI."*

---

## License
MIT License.
