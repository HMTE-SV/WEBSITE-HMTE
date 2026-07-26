import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseDb } from './client'
import { isAdminRole, type AdminUser } from '@/types/admin'

export async function getAdminUserProfile(uid: string): Promise<AdminUser | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'adminUsers', uid))

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  if (
    data.uid !== uid ||
    typeof data.email !== 'string' ||
    typeof data.active !== 'boolean' ||
    !isAdminRole(data.role)
  ) {
    throw new Error('Profil admin tidak valid. Periksa dokumen adminUsers di Firestore.')
  }

  return {
    uid,
    email: data.email,
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
    role: data.role,
    active: data.active,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}
