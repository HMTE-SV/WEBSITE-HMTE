# Next.js Migration Notes

Branch: `nextjs-migration`

Worktree: `D:\Agentic-Project\WESBITE-HMTE3-nextjs`

## Scope

This migration keeps the existing static HMTE visual design intact. The current Next.js app renders the legacy `index.html` body and runs the preserved inline script from a client component. This keeps the first migration focused on framework structure, build tooling, and deployment readiness before deeper component/data refactors.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

Local dev URL:

```text
http://127.0.0.1:3000
```

## Verification Performed

- `npm run lint` passes.
- `npm run build` passes.
- `GET /` returns `200`.
- `GET /assets/hmte-mark.svg` returns `200`.
- Chrome headless screenshots were generated for desktop and mobile.
- Chrome DevTools Protocol smoke checks confirmed:
  - active news tab initializes as `berita-utama`,
  - switching to the `prestasi` tab updates the active tab,
  - clicking a member card opens the member modal.

## Intentional Constraints

- No Firebase/database work yet.
- No visual redesign.
- Existing CSS class names and static markup are preserved.
- Static asset URLs remain compatible through `public/assets`.

## Known Follow-Up

- Refactor the legacy HTML into real React components section by section after visual parity is accepted.
- Move repeated news and leadership data into typed local data modules before introducing Firebase.
- `npm audit --omit=dev` currently reports a moderate PostCSS advisory through the installed Next.js dependency. The suggested forced fix would downgrade Next.js to an old major version, so it was not applied.
