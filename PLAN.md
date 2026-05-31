# HMTE Website Next.js + Firebase Roadmap

This plan turns the current migrated Next.js shell into a functional HMTE website with public content pages, admin login, content management, and Firebase-backed data.

## Current State

- The static HMTE website has been migrated into a Next.js App Router project.
- The public design is still preserved through the legacy `index.html` markup and `css/hmte.css`.
- Legacy client interactions are still run through `src/app/legacy-interactions.tsx`.
- The website currently has no real database, no admin login, and no per-section TSX components yet.

## Guiding Principles

- Preserve the current public visual design unless a phase explicitly says otherwise.
- Migrate incrementally: one section or feature at a time.
- Keep data typed and centralized before connecting Firebase.
- Do not add speculative features.
- Every phase must end with `npm run lint` and `npm run build`.
- For visual phases, verify in browser at desktop and mobile sizes.

## Phase 1: Componentize the Public Page

Goal: replace the legacy HTML blob with real TSX sections while preserving the current design.

Tasks:

- Create `src/components/site/Header.tsx`.
- Create `src/components/site/Hero.tsx`.
- Create `src/components/site/NewsAgenda.tsx`.
- Create `src/components/site/Gallery.tsx`.
- Create `src/components/site/KabinetSection.tsx`.
- Create `src/components/site/LeadershipDirectory.tsx`.
- Create `src/components/site/Partners.tsx`.
- Create `src/components/site/CTA.tsx`.
- Create `src/components/site/Footer.tsx`.
- Replace `dangerouslySetInnerHTML` in `src/app/page.tsx` with composed components.
- Keep existing CSS class names to avoid visual drift.

Success criteria:

- Homepage visually matches the current website.
- Header navigation works.
- News tabs work.
- Leadership directory filter/search/view toggle works.
- Member modal works.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 2: Move Static Data Into Typed Modules

Goal: remove hardcoded repeated content from components and prepare data for Firebase.

Tasks:

- Create `src/data/site-content.ts`.
- Create `src/data/articles.ts`.
- Create `src/data/events.ts`.
- Create `src/data/announcements.ts`.
- Create `src/data/leaders.ts`.
- Create `src/data/divisions.ts`.
- Create `src/data/programs.ts`.
- Define TypeScript types in `src/types/content.ts`.
- Update public components to read from local typed data.

Success criteria:

- No visual change.
- Public content still renders correctly.
- TypeScript catches invalid content shapes.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 3: Public Routing

Goal: expand the site from one homepage into real public pages.

Routes:

- `/`
- `/berita`
- `/berita/[slug]`
- `/agenda`
- `/pengumuman`
- `/galeri`
- `/kepengurusan`
- `/divisi`
- `/program-kerja`
- `/aspirasi`
- `/kontak`

Tasks:

- Create route pages under `src/app`.
- Add shared page intro/layout patterns.
- Add article detail rendering from local data.
- Add agenda and announcement listing pages.
- Add simple 404 handling for invalid article slugs.

Success criteria:

- Every route loads.
- Article detail pages work by slug.
- Navigation links point to real pages where appropriate.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 4: Firebase Project Setup

Goal: prepare Firebase Auth, Firestore, and Storage integration.

Tasks:

- Create Firebase project manually in Firebase Console.
- Enable Firebase Authentication.
- Enable Cloud Firestore.
- Enable Cloud Storage.
- Add Firebase web app config to `.env.local`.
- Create `src/lib/firebase/client.ts`.
- Create `src/lib/firebase/admin.ts` only if server-side Admin SDK is needed.
- Add `.env.example` with required variable names.
- Document setup in `README.md` or `FIREBASE_SETUP.md`.

Environment variables:

```txt
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Success criteria:

- Firebase client initializes without crashing build.
- Missing environment variables fail clearly in development.
- No secrets are committed.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 5: Admin Authentication

Goal: allow HMTE admins to log in and access protected admin pages.

Routes:

- `/admin/login`
- `/admin`

Tasks:

- Build admin login page.
- Add Firebase email/password login.
- Add logout.
- Add auth state handling.
- Protect `/admin` routes from unauthenticated users.
- Add admin role model.

Initial roles:

```txt
superadmin
editor
viewer
```

Success criteria:

- Unauthenticated users cannot access `/admin`.
- Admin can log in and log out.
- Invalid login shows a clear error.
- Auth loading state is visible.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 6: Admin Dashboard Shell

Goal: create a usable admin area before CRUD features.

Routes:

- `/admin`
- `/admin/announcements`
- `/admin/events`
- `/admin/articles`
- `/admin/gallery`
- `/admin/leaders`
- `/admin/settings`

Tasks:

- Add admin sidebar/topbar.
- Add dashboard cards for content counts.
- Add empty states.
- Add route-level loading states where useful.
- Add role-aware navigation.

Success criteria:

- Admin dashboard is navigable.
- Layout works on desktop and mobile.
- Empty states are clear.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 7: Firestore Content Model

Goal: define Firestore collections and security expectations.

Collections:

```txt
announcements
events
articles
gallery
leaders
divisions
programs
partners
aspirations
adminUsers
settings
```

Core content status:

```txt
draft
published
archived
```

Tasks:

- Define TypeScript types for Firestore documents.
- Create Firestore converter helpers.
- Create read/write service functions.
- Add timestamp handling.
- Add slug helper for articles.

Success criteria:

- Content types match the planned admin UI.
- Public reads only consume published content.
- Admin services support create, update, delete, and publish status.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 8: CRUD for Pengumuman, Agenda, and Berita

Goal: make the three most important HMTE content types editable from admin.

Admin routes:

- `/admin/announcements/new`
- `/admin/announcements/[id]`
- `/admin/events/new`
- `/admin/events/[id]`
- `/admin/articles/new`
- `/admin/articles/[id]`

Tasks:

- Add announcement list/create/edit/delete.
- Add event list/create/edit/delete.
- Add article list/create/edit/delete.
- Add draft/published toggle.
- Add form validation.
- Add confirmation dialog before delete.
- Add success/error feedback.

Success criteria:

- Admin can create, edit, publish, unpublish, and delete content.
- Public pages show only published content.
- Draft content never appears publicly.
- Invalid forms cannot be submitted.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 9: Media Upload and Gallery

Goal: allow admins to upload and manage images.

Tasks:

- Add Firebase Storage upload helper.
- Add image validation.
- Add max file size.
- Add cover image upload for articles.
- Add gallery image upload.
- Add delete image flow.
- Store image metadata in Firestore.

Recommended validation:

```txt
type: image/jpeg, image/png, image/webp
max size: 3MB for article covers, 5MB for gallery
```

Success criteria:

- Admin can upload article cover images.
- Admin can upload gallery images.
- Public pages render uploaded images.
- Upload errors are clear.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 10: Kepengurusan, Divisi, Program Kerja

Goal: make organizational data manageable without code edits.

Tasks:

- Add CRUD for leaders.
- Add CRUD for divisions.
- Add CRUD for programs.
- Support ordering/sorting.
- Support active/inactive status.
- Connect homepage leadership directory to Firestore data.

Success criteria:

- Admin can update leadership data.
- Public leadership directory still supports filter/search/modal.
- Admin can update divisions and programs.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 11: Aspirasi Mahasiswa

Goal: add a student-facing aspiration channel.

Public route:

- `/aspirasi`

Admin route:

- `/admin/aspirations`

Tasks:

- Add public aspiration form.
- Add optional anonymous mode.
- Add categories.
- Add admin list view.
- Add status updates.
- Add internal notes.

Aspiration statuses:

```txt
submitted
reviewed
discussed
in_progress
resolved
archived
```

Success criteria:

- Student can submit aspiration.
- Admin can view and update aspiration status.
- Public form does not expose admin-only notes.
- Spam/rate-limit strategy is documented.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 12: Security Rules

Goal: protect Firestore and Storage data.

Tasks:

- Write Firestore Security Rules.
- Write Storage Security Rules.
- Public can read only published content.
- Admin can write only when authenticated and authorized.
- Aspirations can be created publicly but not publicly listed.
- Add local rules documentation.

Success criteria:

- Non-admin cannot write content collections.
- Public cannot read drafts.
- Public cannot list aspirations.
- Admin can manage permitted content.
- Rules are documented.

## Phase 13: Production Polish

Goal: make the website ready for public use.

Tasks:

- Add metadata per page.
- Add Open Graph images.
- Add sitemap.
- Add robots.txt.
- Add loading states.
- Add error states.
- Add not-found pages.
- Improve accessibility.
- Check mobile layouts.
- Optimize images.

Success criteria:

- Lighthouse/manual checks are acceptable.
- All pages have meaningful metadata.
- Public pages work on mobile.
- No obvious layout overlap.
- `npm run lint` passes.
- `npm run build` passes.

## Phase 14: Deployment

Goal: deploy the website and document operations.

Recommended options:

- Vercel + Firebase for fastest Next.js workflow.
- Firebase App Hosting if the project should stay fully in Firebase/Google Cloud.

Tasks:

- Choose deployment target.
- Configure environment variables.
- Deploy preview.
- Test preview with real Firebase project.
- Deploy production.
- Document admin onboarding.
- Document content update workflow.

Success criteria:

- Production URL is live.
- Admin login works on production.
- Public content loads from Firebase.
- Firebase rules are deployed.
- Documentation explains how future HMTE admins update content.

## Suggested MVP Cut

If time is limited, build this first:

1. Phase 1: componentize public page.
2. Phase 2: typed local data.
3. Phase 4: Firebase setup.
4. Phase 5: admin auth.
5. Phase 6: dashboard shell.
6. Phase 8: CRUD for pengumuman, agenda, berita.
7. Phase 12: security rules for those collections.
8. Phase 14: deploy.

This MVP gives HMTE a functional website with admin-managed announcements, events, and articles. Gallery, leadership, aspirations, alumni, and partner management can follow after the core content workflow is stable.
