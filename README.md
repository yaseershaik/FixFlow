# FixFlow

A privacy-first consumer grievance tracking platform that helps users document complaints, track response deadlines, organize evidence, and prepare escalation-ready legal notices.

[![Live Demo](https://img.shields.io/badge/Live_App-getfixflow.vercel.app-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://getfixflow.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase Postgres](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-57%2F57_Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

- **Live Application**: [https://getfixflow.vercel.app](https://getfixflow.vercel.app)
- **GitHub Repository**: [https://github.com/yaseershaik/FixFlow](https://github.com/yaseershaik/FixFlow)

> **Demo Sandbox**: Click *"Try Live Demo (1-Click)"* on the landing page or sign in with `demo@fixflow.app` / `demo123`.  
> *(Sandbox environment only. Do not enter real personal information. Demo data is automatically purged.)*

---

## Screenshots

| Active Complaints Dashboard | Chronological Dispute Timeline |
| :---: | :---: |
| ![Dashboard Overview](docs/screenshots/02-dashboard.jpg) | ![Complaint Timeline](docs/screenshots/03-complaint-timeline.jpg) |
| **Statutory Legal Notice Generator** | **Mobile Experience** |
| ![Formal Escalation Letter](docs/screenshots/04-escalation-letter.png) | ![Mobile View](docs/screenshots/05-mobile-view.jpg) |

---

## The Problem

When consumers face service delays, rejected refunds, or defective goods, communication is usually scattered across WhatsApp messages, emails, SMS alerts, call notes, and customer support tickets. 

Key details like reference numbers, promised resolution dates, and agent commitments are easily forgotten. When companies fail to resolve the issue, consumers lack a clear, organized paper trail to escalate their grievance to nodal officers or consumer redressal forums (such as NCH 1915 or e-Daakhil), often letting valid claims lapse past statutory limitation periods.

---

## Why I Built It

I built FixFlow to explore how a real-world consumer problem could be converted into a structured software system—from capturing unstructured complaint data to tracking deadlines, protecting user data, and generating actionable escalation documents. It is a production-oriented portfolio project exploring full-stack engineering, security best practices, and AI-assisted product workflows.

---

## What FixFlow Does

FixFlow provides an organized, owner-controlled tracking layer for service disputes:

1. **Capture Details**: Log complaints with company name, reference number, purchase date, amount, and promised resolution date.
2. **Build the Timeline**: Record every call, email, or promise update chronologically with notes and evidence attachments.
3. **Monitor Deadlines**: Highlight overdue items and track the commonly applicable 2-year limitation window under Section 69 of the Consumer Protection Act, 2019, as an informational reminder.
4. **Surface Next Actions**: Clear distinction between issues waiting on the company vs. items where user action is required.
5. **Generate Escalation Notices**: Produce a formal legal demand letter pre-filled with dispute history in one click.

---

## Key Features

- **Dispute Lifecycle State Machine**: Enforces structured lifecycle transitions (`open` → `waiting` → `action_needed` → `resolved` → `closed`).
- **Statutory Limitation Advisory**: Tracks the commonly applicable two-year limitation period under Section 69 of the Consumer Protection Act, 2019, as an informational reminder rather than legal advice.
- **1-Click Legal Notice Generator**: Pre-formats dispute details and relief demanded into a formal notice suitable for company grievance officers, NCH (Dial 1915), or e-Daakhil.
- **Offline Heuristic Text Extraction**: Regex-based parser extracts merchant names, ticket numbers, dispute amounts, and dates from pasted communication without cloud API latency or cost.
- **Evidence Management**: Securely attach invoices, repair job-sheets, and screenshots with magic-byte file signature verification.
- **Search & Quick Filters**: Search complaints across merchant names, docket numbers, and notes with real-time status counters.
- **Resource Quotas & Demo Sandbox**: Tiered usage limits with automatic 2-hour TTL data cleanup on demo accounts to prevent storage exhaustion.

---

## How It Works

FixFlow uses a modern Next.js App Router architecture deployed on Vercel's global edge network, paired with a Supabase PostgreSQL database via connection pooling.

```mermaid
flowchart LR
    User["User Client (Browser / Mobile)"] --> NextApp["Next.js 14 App Router (Vercel)"]
    NextApp --> EdgeMW["Edge Middleware (HMAC Auth)"]
    EdgeMW --> Logic["API & Business Logic"]
    Logic --> DB[("Supabase PostgreSQL (Pooler)")]
    Logic -.-> AI["Optional Cloud LLM (Gemini / OpenAI)"]
```

### Architectural Decisions
- **Edge Token Verification**: HMAC-SHA256 session signatures are verified at the Edge runtime with Web Crypto APIs before requests hit database layers.
- **IPv4 Connection Pooling**: Routes serverless queries through Supabase's transaction pooler (port 6543) to guarantee reliable connectivity across serverless environments.
- **Hybrid Rendering**: Statically pre-rendered educational and legal guides (`SSG`) for fast load times, combined with authenticated server-rendered routes (`SSR`) for private dispute management.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Next.js Route Handlers, Edge Middleware |
| **Database & ORM** | PostgreSQL (Supabase), Prisma ORM (Connection Pooler) |
| **Authentication** | Stateless HMAC-SHA256 session cookies, scrypt (RFC 7914) password hashing |
| **AI / Heuristics** | Built-in offline regex parser; optional adapters for Google Gemini and OpenAI |
| **Testing** | Vitest, Node.js HTTP test suites |
| **Deployment** | Vercel (Edge Network) |

---

## Security & Verification

FixFlow includes a project-authored automated security test suite covering authentication, authorization, user isolation, session handling, input validation, upload validation, path traversal protection, rate limiting, and related attack vectors.

- **57 / 57 Vitest unit and integration tests passing**
- **40 / 40 project-authored automated security test cases passing**
- **0 TypeScript compilation errors** (`npx tsc --noEmit`)
- **Production build verified** (`npm run build`)

### Core Engineering Controls
- **Stateless HMAC-SHA256 Sessions**: Cryptographically signed edge cookies; tamper-evident and expiration-checked without database overhead.
- **scrypt Key Derivation**: Passwords hashed using native `crypto.scryptSync` (16-byte random salt, N=16384) with constant-time verification (`crypto.timingSafeEqual`).
- **User-Scoped Queries**: Prisma queries enforce tenant isolation by scoping records to the authenticated session's `userId`.
- **Magic-Byte Upload Inspection**: Validates genuine file signatures for PNG, JPG, and PDF uploads to prevent MIME spoofing.
- **Path-Traversal Neutralization**: Normalized path handling prevents directory traversal on attachment endpoints.
- **Sliding-Window Rate Limiting**: In-memory rate limiting applied to login, registration, and extraction routes.
- **Defense-in-Depth Headers**: Injected via Edge Middleware: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and `Referrer-Policy`.

---

## Local Development

### 1. Clone & Install
```bash
git clone https://github.com/yaseershaik/FixFlow.git
cd FixFlow
npm install
```

### 2. Configure Environment
Create a `.env` file based on `.env.example`:
```ini
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
SESSION_SECRET="your-64-character-random-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Seed
```bash
npm run prisma:generate
npm run prisma:push
npm run db:seed
```

### 4. Start the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and sign in with `demo@fixflow.app` / `demo123`.

---

## Testing

```bash
# Run the complete test suite (57 automated tests)
npm test
```

---

## Project Structure

```text
FixFlow/
├── docs/
│   └── screenshots/         # Application screenshots
├── prisma/
│   └── schema.prisma        # Database schema & indexes
├── public/                  # Static assets & verification files
├── scripts/                 # Database seed & test utilities
├── src/
│   ├── app/                 # Next.js App Router (pages & API routes)
│   │   ├── api/             # Auth, complaints, attachments, export, extraction
│   │   ├── blog/            # Pre-rendered consumer rights guides
│   │   ├── dashboard/       # Dispute overview & quick filters
│   │   ├── issues/          # Complaint details, timeline, and notice generator
│   │   └── settings/        # Account settings & usage telemetry
│   ├── components/          # Reusable UI components & providers
│   ├── lib/                 # Auth, DB client, quotas, extraction heuristics
│   └── middleware.ts        # Edge security & route protection
└── tests/                   # Vitest unit, lifecycle, and security test suites
```

---

## License

MIT License — Copyright (c) 2026 Yaseer Shaik