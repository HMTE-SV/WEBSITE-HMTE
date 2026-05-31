# Firebase Setup

This project is prepared for Firebase Authentication, Cloud Firestore, and Cloud Storage.

## 1. Create Firebase Project

1. Open the Firebase Console.
2. Create a new project for the HMTE website.
3. Add a Web App inside the project.
4. Copy the Web App config values.

## 2. Enable Services

Enable these Firebase products:

- Authentication
- Cloud Firestore
- Cloud Storage

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
- `getFirebaseStorage()`
- `hasFirebaseConfig()`

The helpers initialize Firebase lazily. This keeps `next build` from crashing before runtime environment variables are available.

## 5. Admin SDK

Do not add Firebase Admin SDK until a server-side feature needs it. Admin SDK requires private service account credentials, so it should be introduced only when the server-side authorization model is defined.

## 6. Deployment Notes

When deploying to Vercel or Firebase App Hosting, add the same `NEXT_PUBLIC_FIREBASE_*` variables in the hosting provider environment settings.

Production must also deploy Firestore and Storage security rules before admin content management is considered ready.
