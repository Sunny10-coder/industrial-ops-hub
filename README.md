# industrial-ops-hub

Unified industrial operations hub combining safety observation workflows and warehouse workforce operations in one modern mobile + web app.

## Why Expo for this repo

Flutter is not available in this environment, so this MVP is delivered with **Expo (React Native + Web)** as a single codebase for iOS/Android/Web while keeping the same product requirements: shared shell, role-aware navigation, safety + workforce modules, and responsive web/phone UX.

## Included MVP capabilities

- Role-aware auth gate (System Admin, Manager, Assistant Manager, Safety Officer, Supervisor, Engineer)
- Hub home with light GitHub Student Pack-inspired card layout and interactive module cards
- Safety module:
  - Create/list/view observations
  - Lifecycle transitions (Draft → Submitted → Assigned → Open → In Progress → Closeout → Verification → Closed/Reopened)
  - Appeals with evidence references
  - Photo attachment reference field
  - Simple dashboard chart rows
- Workforce module:
  - Shift schedule cards with required color accents
    - Morning (7–4) yellow
    - Afternoon (12–9) orange
    - Night (9–6) cyan
  - Attendance check-in flow
  - Leave request basics (annual/sick/comp-off/emergency)
- Reports module with executive snapshot + PDF/Excel export hooks
- Shared responsive shell (desktop sidebar + mobile bottom nav)
- Seed/demo data so UI is immediately populated without backend secrets

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file from example (do not use real secrets in source control):

```bash
cp .env.example .env
```

3. Run the app:

```bash
npm run start
```

Then press:

- `w` for web
- `a` for Android emulator/device
- `i` for iOS simulator (macOS)

Direct web launch:

```bash
npm run web
```

## Notes

- This repo intentionally uses **example-only env patterns**.
- Supabase wiring can be added behind current demo services without changing UI structure.
