# HMTE Website

Next.js App Router workspace for the HMTE TRE SV UGM website. The project contains the public site, the admin surface, and the current Firebase integration foundation.

## Current Scope

- Public routes for homepage, berita, agenda, pengumuman, galeri, kepengurusan, divisi, program kerja, aspirasi, and kontak.
- Protected admin routes for managing articles, announcements, events, gallery items, leaders, and aspirations.
- Firebase client helpers and typed content modules prepared for the production data flow.

## Development

Install dependencies:

```powershell
npm install
```

Run the local dev server:

```powershell
npm run dev
```

Core checks:

```powershell
npm run lint
npm test
npx tsc --noEmit
```

Full verification helper:

```powershell
scripts\codex-verify.cmd
```

This helper runs lint, tests, typecheck, and production build in sequence.

## Project References

- [`PLAN.md`](./PLAN.md): implementation roadmap and recent progress notes.
- [`HMTE_CONTEXT.md`](./HMTE_CONTEXT.md): confirmed product direction and communication goals.
- [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md): local Firebase setup and deployment notes.
- [`hmte-complete-overview.md`](./hmte-complete-overview.md): broader repo and design overview.

## Repo Layout

- [`src/app`](./src/app): App Router pages and layouts.
- [`src/components`](./src/components): public and admin UI components.
- [`src/data`](./src/data): local typed sample content.
- [`src/lib`](./src/lib): admin validation/CRUD logic and Firebase helpers.
- [`scripts`](./scripts): local verification helpers.

## Environment

Copy `.env.example` to `.env.local` and fill in the `NEXT_PUBLIC_FIREBASE_*` variables before testing Firebase-backed flows. Keep `.env.local` uncommitted.
