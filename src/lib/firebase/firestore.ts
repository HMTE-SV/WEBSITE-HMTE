import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
  serverTimestamp,
} from 'firebase/firestore'
import type { FirestoreDocument } from '@/types/firestore'

export function createFirestoreConverter<T extends FirestoreDocument>(): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: WithFieldValue<T>): DocumentData {
      const data = { ...(modelObject as object) } as Record<string, unknown>
      delete data.id
      return data
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return {
        id: snapshot.id,
        ...snapshot.data(options),
      } as T
    },
  }
}

export function withCreateTimestamps<T extends object>(data: T) {
  return {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

export function withUpdateTimestamp<T extends object>(data: T) {
  return {
    ...data,
    updatedAt: serverTimestamp(),
  }
}
