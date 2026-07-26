import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * `storageBucket` sengaja tidak ada di sini. Firebase Storage tidak dipakai
 * sama sekali — paket Spark menutupnya, dan gambar disajikan ImageKit. Kalau
 * bucket ikut diwajibkan, situs akan jatuh ke data lokal cuma karena satu
 * variabel yang tidak pernah dipakai belum diisi.
 */
const firebaseEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let cachedApp: FirebaseApp | null = null

function getMissingFirebaseEnv() {
  return Object.entries(firebaseEnv)
    .filter(([, value]) => !value)
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`)
}

export function hasFirebaseConfig() {
  return getMissingFirebaseEnv().length === 0
}

export function getFirebaseConfig(): FirebaseOptions {
  const missing = getMissingFirebaseEnv()

  if (missing.length > 0) {
    throw new Error(
      `Firebase belum dikonfigurasi. Isi ${missing.join(', ')} di .env.local. Lihat FIREBASE_SETUP.md.`,
    )
  }

  return firebaseEnv as FirebaseOptions
}

export function getFirebaseClientApp(): FirebaseApp {
  if (cachedApp) {
    return cachedApp
  }

  cachedApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig())
  return cachedApp
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseClientApp())
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseClientApp())
}
