# Contributing to FixFlow

Thank you for your interest in contributing to FixFlow! FixFlow is a privacy-first, zero-cost consumer rights and grievance tracking platform tailored for Indian consumers under the Consumer Protection Act, 2019.

## Code of Conduct

Please be respectful, constructive, and helpful to all contributors.

## Core Architectural Principles

1. **100% Free / Zero Cloud Cost**: FixFlow must remain operable without requiring paid external AI or cloud API keys. All core parsing, timeline calculation, and escalation drafting must function locally using rule-based and edge heuristics.
2. **Privacy First**: Sensitive consumer dispute documents, communications, and personal identifiers belong to the user. Do not leak telemetry or personal data to third-party endpoints.
3. **Simple, Accessible Language**: User-facing text must be jargon-free and easily understandable for ordinary consumers without technical or legal backgrounds.
4. **Resilience & Security**: Always validate inputs, enforce tenant data isolation, use scrypt password hashing, and sanitize files before writing to disk.

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or later

### Local Development Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/your-org/fixflow.git
   cd fixflow
   npm install
   ```

2. Set up the local database:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Log in with demo credentials:
   - Email: `demo@fixflow.app`
   - Password: `demo123`

## Testing and Verification

Before submitting a Pull Request, please ensure all checks pass:

```bash
# Run unit and integration tests
npm test

# Verify TypeScript types
npx tsc --noEmit

# Test production build
npm run build
```

## Pull Request Guidelines

- Describe what problem your change solves and reference any relevant issue numbers.
- Ensure all automated tests pass and add new tests for new utility or security logic.
- Keep commits atomic and clearly described.
