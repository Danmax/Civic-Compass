# Civic Compass security and privacy

Civic Compass treats political responses and generated profiles as sensitive
personal information.

## Current controls

- Assessments are anonymous by default and do not request identity or location.
- Unsaved responses remain in React memory and are discarded when the page closes.
- Optional browser saves require a user-provided passphrase.
- Saved profiles use PBKDF2-SHA256 with 250,000 iterations and AES-256-GCM.
- The passphrase is never written to storage and cannot be recovered.
- Account passwords are hashed server-side with Node `crypto.scrypt` before being
  stored in MySQL.
- Login sessions use opaque random tokens stored in HTTP-only cookies. MySQL stores
  only SHA-256 hashes of those session tokens.
- Password changes revoke existing sessions so the user must log in again.
- Account deletion requires password confirmation and cascades user-owned sessions
  and saved assessment profiles through database foreign keys.
- The application sends a restrictive Content Security Policy and headers that
  prevent framing, MIME sniffing, unnecessary browser permissions, and referrer
  leakage.
- Assessment answers are not sent to the server unless the user explicitly submits
  an anonymous research copy from the results screen.
- Anonymous research copies include answers, importance settings, scores, optional
  accuracy rating, and a hashed user-agent string for basic duplicate analysis.
  They do not include name, email, passphrase, raw IP address, or local encrypted
  profile data.
- Logged-in account profile saves include answers, importance settings, scores,
  confidence, and profile metadata associated with the authenticated user.
- Database credentials must stay in `.env.local` or hosting environment variables.
  Do not commit live secrets. Server-side database helpers must not be imported by
  client components.
- `npm run verify` performs a full dependency audit followed by a production build.

## Administration portal

The administration portal is login-protected and reads aggregate MySQL metrics.
Bias review actions are persisted with audit events. Most content editing screens
are still read-only prototypes. CSRF protection, broader request validation, and
rate limiting are required before expanding administrative mutations.

## Reporting a concern

Do not include real assessment responses, credentials, or other sensitive data in a
security report. Describe the affected route, expected behavior, and reproduction
steps with synthetic data.
