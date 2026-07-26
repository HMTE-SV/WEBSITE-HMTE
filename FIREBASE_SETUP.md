# Firebase Setup

This project uses Firebase Authentication and Cloud Firestore. Dynamic images are referenced from ImageKit so the
website does not require Firebase Storage or the Blaze billing plan.

## 1. Create Firebase Project

1. Open the Firebase Console.
2. Create a new project for the HMTE website.
3. Add a Web App inside the project.
4. Copy the Web App config values.

## 2. Enable Services

Enable these Firebase products:

- Authentication
- Cloud Firestore

For Authentication, enable the Email/Password sign-in provider. Other providers can be added later if HMTE needs them.

## 3. Configure Local Environment

Create `.env.local` from `.env.example`:

```txt
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Fill each value from the Firebase Web App config.

Do not commit `.env.local`. The repository already ignores `.env*.local`.

## 4. Client Helper

Firebase client access is centralized in:

```txt
src/lib/firebase/client.ts
```

Use these helpers when building Firebase-backed features:

- `getFirebaseClientApp()`
- `getFirebaseAuth()`
- `getFirebaseDb()`
- `hasFirebaseConfig()`

The helpers initialize Firebase lazily. This keeps `next build` from crashing before runtime environment variables are available.

## 5. Admin SDK

Do not add Firebase Admin SDK until a server-side feature needs it. Admin SDK requires private service account credentials, so it should be introduced only when the server-side authorization model is defined.

## 6. Initial Admin Account

For the current admin login foundation:

1. Open Firebase Console.
2. Go to Authentication.
3. Add an Email/Password user for the first HMTE admin.
4. Use that email and password at `/admin/login`.

The role model is defined in code as:

```txt
superadmin
editor
viewer
```

Create the matching `adminUsers/{uid}` document described in section 8 before signing in. Authentication without an
active admin profile is rejected by both the admin interface and Firestore Rules.

## 7. Deployment Notes

When deploying to Vercel or Firebase App Hosting, add the same `NEXT_PUBLIC_FIREBASE_*` variables in the hosting provider environment settings.

Production must deploy Firestore security rules and indexes before admin content management is considered ready:

```powershell
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

The default project alias in `.firebaserc` points to `website-hmte-svugm`. Confirm the active account and project in
the CLI before deploying.

## 8. Admin authorization

Authentication alone does not grant admin access. Every admin must also have a document at:

```txt
adminUsers/{firebase-auth-uid}
```

Required fields:

```txt
uid: string (must match the document ID and Firebase Authentication UID)
email: string
displayName: string
role: "superadmin" | "editor" | "viewer"
active: true
```

Firestore Rules enforce the following model:

- `superadmin`: all admin content plus settings and admin-user management.
- `editor`: content and organization CRUD, gallery references, and aspiration follow-up.
- `viewer`: read-only access to admin content.
- public visitors: only published content and active organization records; aspirations can only be created.

## 9. Image references

The gallery manager accepts HTTPS ImageKit URLs and stores the URL plus metadata in Firestore. ImageKit private keys
must never use the `NEXT_PUBLIC_` prefix. A signed ImageKit upload endpoint can be added later without changing the
Firestore content model.

## 10. Berita dan editor artikel

Berita disimpan di collection `articles`. Artikel baru selalu dapat disimpan sebagai `draft`, kemudian diterbitkan
dari form editor atau daftar berita. Halaman publik hanya membaca dokumen dengan `status: "published"`.

Field utama yang dikelola panel:

```txt
title, slug, excerpt, content, category, coverImage, status
createdAt, updatedAt, publishedAt
```

`content` berisi HTML terbatas dari rich-text editor. HTML disanitasi kembali sebelum ditampilkan di halaman publik.
Cover dan gambar di dalam artikel menggunakan URL HTTPS ImageKit atau Firebase Storage; file gambar tidak disimpan
di dalam dokumen Firestore.

Query publik memakai composite index `status + publishedAt` yang didefinisikan di `firestore.indexes.json`.

## 11. Aspirasi Spam Strategy

The public aspiration form writes to the `aspirations` collection. Before production launch, deploy Firestore rules so public users can only create documents and cannot list existing aspirations.

Recommended spam controls for production:

- Add Firebase App Check for the web app.
- Add a per-device or per-IP rate limit through a server-side endpoint before accepting public submissions.
- Keep admin-only `internalNotes` write access restricted to authenticated admins.
