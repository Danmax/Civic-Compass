# Civic Compass

Civic Compass is a neutral political values assessment prototype built with Next.js, React, TypeScript, and Tailwind CSS. It helps users explore their views across multiple civic dimensions without reducing the result to a single party label.

## Features

- Quick quiz for a preview profile
- Full randomized assessment
- Multi-axis political profile results
- Optional party-alignment reveal
- Political compass, radar chart, score cards, confidence meter, and issue breakdowns
- Transparent answer-by-answer scoring view
- Educational context for each issue area
- Anonymous-by-default experience
- Optional encrypted local profile saving
- Optional account login and server-side saved assessment history
- Admin portal prototype for question governance, scoring review, analytics, version management, and bias review

## Privacy Position

The prototype is designed around privacy and transparency:

- No account is required to complete the assessment.
- Results are stored only in the browser unless the user chooses to save them.
- Saved profiles are encrypted locally with a passphrase.
- Political profile data should never be sold, shared, or used for advertising.
- Scoring should remain explainable and reviewable by the user.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React icons
- MySQL via `mysql2`

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the production build:

```bash
npm start
```

Create a local environment file before using database-backed routes:

```bash
cp .env.example .env.local
```

Then set `DB_PASSWORD` in `.env.local`. The MySQL health endpoint is available at
`/api/db/health` and runs a server-side `SELECT 1` check.

Create the database tables with:

```bash
mysql -h srv2104.hstgr.io -u u130206374_civicAdmin -p u130206374_civic < sql/001_create_assessment_profiles.sql
mysql -h srv2104.hstgr.io -u u130206374_civicAdmin -p u130206374_civic < sql/002_create_users_sessions_profiles.sql
```

The `/api/profiles` endpoint stores opt-in anonymous assessment snapshots for
aggregate question-quality review.

Account routes:

- `/account` - login, signup, logout, and saved assessment history
- `/api/auth/signup` - create an account and session
- `/api/auth/login` - create a session for an existing account
- `/api/auth/logout` - revoke the current session
- `/api/auth/me` - return the current session user
- `/api/account/profiles` - list or save authenticated assessment profiles

Run verification:

```bash
npm run verify
```

## Project Structure

- `app/page.tsx` - main assessment, quiz flow, results, and profile UI
- `app/account/page.tsx` - account login, signup, and saved profile history UI
- `app/data.ts` - dimensions, categories, questions, answer choices, and scoring weights
- `app/admin/page.tsx` - admin portal prototype
- `app/globals.css` - application styling and responsive layout
- `lib/auth.ts` - password hashing, session cookies, and user lookup helpers
- `lib/db.ts` - server-only MySQL connection pool
- `next.config.ts` - Next.js configuration and browser security headers
- `SECURITY.md` - security notes and implementation caveats

## Admin Portal

The admin portal is currently a frontend prototype. It includes:

- Question health monitoring
- Skip-rate and polarization signals
- Editorial and bias review queues
- Assessment version management
- Scoring sandbox
- Category coverage checks
- Educational content review cards
- Anonymous analytics summaries
- User feedback management

Before production use, the admin portal should be backed by authenticated APIs, role-based access control, audit logs, server-side validation, CSRF protection, and rate limiting.

## Prototype Caveats

- Analytics values are illustrative.
- Percentiles are illustrative and not demographic predictions.
- The admin portal does not yet persist edits to a backend.
- Anonymous research snapshots are persisted only when a user explicitly submits
  one from the results screen.
- Account-saved assessment history is persisted only for logged-in users who
  explicitly choose to save a profile to their account.
- Educational reading entries are placeholders for curated source links.
- Party alignment is an optional estimate based on issue responses, not a definitive label.

## Design Goals

- Neutral and transparent
- Educational rather than persuasive
- Easy to complete
- Respectful of diverse viewpoints
- Privacy-preserving by default
- Explainable scoring with no hidden logic
