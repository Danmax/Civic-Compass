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

Run verification:

```bash
npm run verify
```

## Project Structure

- `app/page.tsx` - main assessment, quiz flow, results, and profile UI
- `app/data.ts` - dimensions, categories, questions, answer choices, and scoring weights
- `app/admin/page.tsx` - admin portal prototype
- `app/globals.css` - application styling and responsive layout
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
- Educational reading entries are placeholders for curated source links.
- Party alignment is an optional estimate based on issue responses, not a definitive label.

## Design Goals

- Neutral and transparent
- Educational rather than persuasive
- Easy to complete
- Respectful of diverse viewpoints
- Privacy-preserving by default
- Explainable scoring with no hidden logic

