import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { getFirebaseDb } from './client'
import { createFirestoreConverter, withCreateTimestamps, withUpdateTimestamp } from './firestore'
import type {
  AnnouncementDocument,
  ArticleDocument,
  EventDocument,
  FirestoreCollectionName,
  FirestoreDocument,
  GalleryDocument,
  PublishableDocument,
} from '@/types/firestore'

export type CreateDocumentInput<T extends FirestoreDocument> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateDocumentInput<T extends FirestoreDocument> = Partial<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>

function getCollection<T extends FirestoreDocument>(collectionName: FirestoreCollectionName) {
  return collection(getFirebaseDb(), collectionName).withConverter(createFirestoreConverter<T>())
}

export async function listContentDocuments<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  constraints: QueryConstraint[] = [],
) {
  const snapshot = await getDocs(query(getCollection<T>(collectionName), ...constraints))
  return snapshot.docs.map((documentSnapshot) => documentSnapshot.data())
}

/**
 * Versi langganan dari `listContentDocuments`.
 *
 * Panel dipegang beberapa pengurus sekaligus, dan dengan `getDocs` sekali jalan
 * dua orang yang bekerja bersamaan tidak pernah melihat perubahan satu sama
 * lain sampai halamannya dimuat ulang. Yang lebih berbahaya: keduanya bisa
 * mengedit baris yang sama dari kondisi awal berbeda tanpa sadar.
 *
 * Mengembalikan fungsi berhenti berlangganan. Wajib dipanggil saat komponen
 * dilepas, kalau tidak listener-nya menumpuk tiap kali menu dibuka.
 */
export function subscribeToContentDocuments<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  handlers: {
    onData: (documents: T[]) => void
    onError: (error: Error) => void
  },
  constraints: QueryConstraint[] = [],
) {
  return onSnapshot(
    query(getCollection<T>(collectionName), ...constraints),
    (snapshot) => handlers.onData(snapshot.docs.map((documentSnapshot) => documentSnapshot.data())),
    (error) => handlers.onError(error),
  )
}

export async function getContentDocument<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  id: string,
) {
  const snapshot = await getDoc(doc(getCollection<T>(collectionName), id))
  return snapshot.exists() ? snapshot.data() : null
}

export async function createContentDocument<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  data: CreateDocumentInput<T>,
) {
  const payload = withCreateTimestamps(data) as DocumentData

  if (
    ['announcements', 'events', 'articles', 'gallery'].includes(collectionName) &&
    'status' in data
  ) {
    payload.publishedAt = data.status === 'published' ? serverTimestamp() : null
  }

  const documentRef = await addDoc(collection(getFirebaseDb(), collectionName), payload)
  return documentRef.id
}

export async function updateContentDocument<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  id: string,
  data: UpdateDocumentInput<T>,
) {
  const payload = withUpdateTimestamp(data) as DocumentData
  const documentRef = doc(getFirebaseDb(), collectionName, id)

  if (
    ['announcements', 'events', 'articles', 'gallery'].includes(collectionName) &&
    'status' in data
  ) {
    if (data.status === 'published') {
      const currentDocument = await getDoc(documentRef)
      const currentData = currentDocument.data()

      if (currentData?.status !== 'published' || !currentData.publishedAt) {
        payload.publishedAt = serverTimestamp()
      }
    } else {
      payload.publishedAt = null
    }
  }

  await updateDoc(documentRef, payload)
}

/**
 * Menulis dokumen pada id yang sudah ditentukan, membuat kalau belum ada.
 *
 * Dipakai `leaderContacts`, yang idnya harus sama persis dengan id dokumen
 * `leaders` pasangannya. `addDoc` tidak bisa dipakai karena ia selalu mengarang
 * id sendiri.
 *
 * `exists` dikirim pemanggil, bukan dibaca ulang di sini, supaya satu daftar
 * yang sudah diambil tidak berubah jadi satu pembacaan tambahan per simpan.
 * Bedanya penting: rules menuntut `createdAt` yang baru saat membuat, dan
 * `createdAt` yang tidak berubah saat memperbarui.
 */
export async function writeContentDocumentAtId<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  id: string,
  data: CreateDocumentInput<T>,
  exists: boolean,
) {
  const documentRef = doc(getFirebaseDb(), collectionName, id)

  if (exists) {
    await updateDoc(documentRef, withUpdateTimestamp(data) as DocumentData)
    return
  }

  await setDoc(documentRef, withCreateTimestamps(data) as DocumentData)
}

export async function deleteContentDocument(collectionName: FirestoreCollectionName, id: string) {
  await deleteDoc(doc(getFirebaseDb(), collectionName, id))
}

export async function setContentStatus(
  collectionName: FirestoreCollectionName,
  id: string,
  status: PublishableDocument['status'],
) {
  await updateDoc(doc(getFirebaseDb(), collectionName, id), {
    status,
    publishedAt: status === 'published' ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  })
}

export function listPublishedDocuments<T extends PublishableDocument>(
  collectionName: FirestoreCollectionName,
  orderField = 'publishedAt',
  maxItems?: number,
) {
  const constraints: QueryConstraint[] = [where('status', '==', 'published'), orderBy(orderField, 'desc')]

  if (maxItems) {
    constraints.push(limit(maxItems))
  }

  return listContentDocuments<T>(collectionName, constraints)
}

export function listPublishedAnnouncements(maxItems?: number) {
  return listPublishedDocuments<AnnouncementDocument>('announcements', 'publishedAt', maxItems)
}

export function listPublishedEvents(maxItems?: number) {
  return listPublishedDocuments<EventDocument>('events', 'publishedAt', maxItems)
}

export function listPublishedArticles(maxItems?: number) {
  return listPublishedDocuments<ArticleDocument>('articles', 'publishedAt', maxItems)
}

export async function isArticleSlugAvailable(slug: string, excludedDocumentId?: string) {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'articles'), where('slug', '==', slug), limit(2)),
  )

  return snapshot.docs.every((documentSnapshot) => documentSnapshot.id === excludedDocumentId)
}

export function listPublishedGalleryItems(maxItems?: number) {
  return listPublishedDocuments<GalleryDocument>('gallery', 'order', maxItems)
}
