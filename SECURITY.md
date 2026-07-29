# Civic Compass security and privacy

Civic Compass treats political responses and generated profiles as sensitive
personal information.

## Current controls

- Assessments are anonymous by default and do not request identity or location.
- Unsaved responses remain in React memory and are discarded when the page closes.
- Optional browser saves require a user-provided passphrase.
- Saved profiles use PBKDF2-SHA256 with 250,000 iterations and AES-256-GCM.
- The passphrase is never written to storage and cannot be recovered.
- The application sends a restrictive Content Security Policy and headers that
  prevent framing, MIME sniffing, unnecessary browser permissions, and referrer
  leakage.
- No assessment answer is sent to a server, advertiser, analytics provider,
  campaign, political party, or other third party in the current implementation.
- `npm run verify` performs a full dependency audit followed by a production build.

## Administration portal

The current administration portal is a static interface using demonstration data.
It has no database access and cannot mutate question or user records. Authentication,
role-based access control, audit logs, CSRF protection, request validation, and rate
limiting are required before connecting it to administrative APIs.

## Reporting a concern

Do not include real assessment responses, credentials, or other sensitive data in a
security report. Describe the affected route, expected behavior, and reproduction
steps with synthetic data.
