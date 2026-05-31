import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
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
  const documentRef = await addDoc(collection(getFirebaseDb(), collectionName), payload)
  return documentRef.id
}

export async function updateContentDocument<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  id: string,
  data: UpdateDocumentInput<T>,
) {
  const payload = withUpdateTimestamp(data) as DocumentData
  await updateDoc(doc(getFirebaseDb(), collectionName, id), payload)
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

export function listPublishedGalleryItems(maxItems?: number) {
  return listPublishedDocuments<GalleryDocument>('gallery', 'order', maxItems)
}
