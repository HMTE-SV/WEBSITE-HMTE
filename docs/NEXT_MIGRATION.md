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
- `npm run start -- --hostname 127.0.0.1 --port 3001` serves the production build.
- `GET /` returns `200` on the production server.
- `GET /assets/hmte-mark.svg` and `GET /assets/ugm_socialization.png` return `200`.
- Chrome headless screenshots were generated for desktop and mobile from the production server.
- Chrome DevTools Protocol smoke checks on the production server confirmed:
  - document title is `HMTE TRE SV UGM - Elektro... Satu!!!`,
  - active news tab initializes as `berita-utama`,
  - switching to the `prestasi` tab updates the active tab,
  - clicking a member card opens the member modal,
  - no runtime errors were captured during the smoke check.

## Intentional Constraints

- No Firebase/database work yet.
- No visual redesign.
- Existing CSS class names and static markup are preserved.
- Static asset URLs remain compatible through `public/assets`.
- Dependency versions are pinned to the versions used during verification.

## Known Follow-Up

- Refactor the legacy HTML into real React components section by section after visual parity is accepted.
- Move repeated news and leadership data into typed local data modules before introducing Firebase.
- `npm audit --omit=dev` currently reports a moderate PostCSS advisory through the installed Next.js dependency. The suggested forced fix would downgrade Next.js to an old major version, so it was not applied.
