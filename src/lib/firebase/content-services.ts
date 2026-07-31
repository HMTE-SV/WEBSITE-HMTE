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
  writeBatch,
  where,
  type DocumentData,
  type QueryConstraint,
  type WriteBatch,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './client'
import { createFirestoreConverter, withCreateTimestamps, withUpdateTimestamp } from './firestore'
import {
  buildAuditSummary,
  getChangedFields,
  isAuditedContentCollection,
  toAuditSnapshot,
} from '@/lib/admin/content-audit'
import { readAdminClaims } from '@/lib/admin/claims'
import { mediaSlotDefinitions } from '@/data/media-slots'
import { getPageDefinition, isPageKey, type PageContent } from '@/lib/page-content'
import type { SiteSettings } from '@/lib/site-settings'
import type {
  AnnouncementDocument,
  ArticleDocument,
  AuditAction,
  AuditLogDocument,
  AuditSnapshot,
  AuditedContentCollectionName,
  ContentRevisionDocument,
  FirestoreCollectionName,
  FirestoreDocument,
  GalleryDocument,
  MediaDocument,
  PublishableDocument,
} from '@/types/firestore'

export type CreateDocumentInput<T extends FirestoreDocument> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateDocumentInput<T extends FirestoreDocument> = Partial<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>

type AuditActor = Pick<ContentRevisionDocument, 'actorUid' | 'actorEmail' | 'actorRole'>
type MutationOptions = { auditAction?: AuditAction }

function buildPublicMediaProjection(media: MediaDocument | null) {
  const isActive = media?.status === 'active'

  return {
    mediaUrl: isActive ? media.url : '',
    mediaAlt: isActive ? media.alt : '',
    mediaWidth: isActive ? media.width : 0,
    mediaHeight: isActive ? media.height : 0,
    focalPointX: isActive ? media.focalPointX : 50,
    focalPointY: isActive ? media.focalPointY : 50,
  }
}

async function requireAuditActor(): Promise<AuditActor> {
  const user = getFirebaseAuth().currentUser

  if (!user) {
    throw new Error('Sesi admin sudah berakhir. Masuk ulang sebelum menyimpan perubahan.')
  }

  const token = await user.getIdTokenResult()
  const { role } = readAdminClaims(token.claims as Record<string, unknown>)

  if (!role || role === 'viewer') {
    throw new Error('Akun ini tidak mempunyai hak untuk mengubah konten.')
  }

  return {
    actorUid: user.uid,
    actorEmail: user.email || '',
    actorRole: role,
  }
}

function addAuditEntries(
  batch: WriteBatch,
  actor: AuditActor,
  entityType: AuditedContentCollectionName,
  entityId: string,
  action: AuditAction,
  before: AuditSnapshot | null,
  after: AuditSnapshot | null,
) {
  const db = getFirebaseDb()
  const revisionRef = doc(collection(db, 'contentRevisions'))
  const auditRef = doc(collection(db, 'auditLogs'))
  const changedFields = getChangedFields(before, after)
  const common = {
    ...actor,
    action,
    changedFields,
    entityId,
    entityType,
  }

  batch.set(
    revisionRef,
    withCreateTimestamps({ ...common, before, after }) as DocumentData,
  )
  batch.set(
    auditRef,
    withCreateTimestamps({
      ...common,
      revisionId: revisionRef.id,
      summary: buildAuditSummary(action, entityType, entityId),
    } satisfies Omit<AuditLogDocument, 'id' | 'createdAt' | 'updatedAt'>) as DocumentData,
  )
}

async function addPageMediaSlotWrites(
  batch: WriteBatch,
  actor: AuditActor,
  content: PageContent,
) {
  const definition = getPageDefinition(content.pageKey)
  const assignments = content.mediaAssignments ?? {}
  const allowedKeys = new Set(definition.sections.flatMap((section) => section.mediaSlotKeys))
  const definitions = mediaSlotDefinitions.filter((slot) => allowedKeys.has(slot.key))
  const db = getFirebaseDb()
  const slotSnapshots = await Promise.all(definitions.map((slot) => getDoc(doc(db, 'mediaSlots', slot.key))))
  const changes = definitions
    .map((slot, index) => ({ slot, snapshot: slotSnapshots[index] }))
    .filter(({ slot, snapshot }) => (snapshot.exists() ? String(snapshot.data().mediaId ?? '') : '') !== (assignments[slot.key] ?? ''))

  if (changes.length === 0) return
  if (actor.actorRole !== 'superadmin') {
    throw new Error('Pilihan gambar halaman hanya dapat diterbitkan oleh superadmin.')
  }

  const mediaIds = [...new Set(changes.map(({ slot }) => assignments[slot.key]).filter(Boolean))]
  const mediaSnapshots = await Promise.all(mediaIds.map((mediaId) => getDoc(doc(db, 'media', mediaId))))
  const mediaById = new Map<string, MediaDocument | null>(mediaIds.map((mediaId, index) => {
    const snapshot = mediaSnapshots[index]
    return [mediaId, snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as MediaDocument) : null]
  }))

  for (const { slot, snapshot } of changes) {
    const mediaId = assignments[slot.key] ?? ''
    const media = mediaId ? mediaById.get(mediaId) ?? null : null
    if (mediaId && (!media || media.status !== 'active')) {
      throw new Error(`Media untuk slot ${slot.label} tidak ditemukan atau sudah diarsipkan.`)
    }

    const data = {
      slotKey: slot.key,
      label: slot.label,
      description: slot.description,
      fallbackUrl: slot.fallbackUrl,
      mediaId,
      ...buildPublicMediaProjection(media),
    }
    const slotRef = doc(db, 'mediaSlots', slot.key)
    const payload = snapshot.exists() ? withUpdateTimestamp(data) : withCreateTimestamps(data)

    if (snapshot.exists()) batch.update(slotRef, payload as DocumentData)
    else batch.set(slotRef, payload as DocumentData)
    addAuditEntries(
      batch,
      actor,
      'mediaSlots',
      slot.key,
      snapshot.exists() ? 'update' : 'create',
      toAuditSnapshot(snapshot.exists() ? snapshot.data() : null),
      toAuditSnapshot(data),
    )
  }
}

function applyPublicationTimestamp(
  collectionName: FirestoreCollectionName,
  data: Record<string, unknown>,
  payload: DocumentData,
  currentData?: DocumentData,
) {
  if (!['announcements', 'articles', 'gallery'].includes(collectionName) || !('status' in data)) {
    return
  }

  if (data.status === 'published') {
    if (currentData?.status !== 'published' || !currentData?.publishedAt) {
      payload.publishedAt = serverTimestamp()
    }
  } else {
    payload.publishedAt = null
  }
}

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
  applyPublicationTimestamp(collectionName, data as Record<string, unknown>, payload)

  if (!isAuditedContentCollection(collectionName)) {
    const documentRef = await addDoc(collection(getFirebaseDb(), collectionName), payload)
    return documentRef.id
  }

  const actor = await requireAuditActor()
  const db = getFirebaseDb()
  const documentRef = doc(collection(db, collectionName))
  const batch = writeBatch(db)
  const after = toAuditSnapshot(data as Record<string, unknown>)

  batch.set(documentRef, payload)
  addAuditEntries(batch, actor, collectionName, documentRef.id, 'create', null, after)
  await batch.commit()
  return documentRef.id
}

export async function updateContentDocument<T extends FirestoreDocument>(
  collectionName: FirestoreCollectionName,
  id: string,
  data: UpdateDocumentInput<T>,
  options: MutationOptions = {},
) {
  const payload = withUpdateTimestamp(data) as DocumentData
  const documentRef = doc(getFirebaseDb(), collectionName, id)
  const currentDocument = await getDoc(documentRef)

  if (!currentDocument.exists()) {
    throw new Error(`Dokumen ${collectionName}/${id} tidak ditemukan.`)
  }

  const currentData = currentDocument.data()
  applyPublicationTimestamp(collectionName, data as Record<string, unknown>, payload, currentData)

  if (!isAuditedContentCollection(collectionName)) {
    await updateDoc(documentRef, payload)
    return
  }

  const actor = await requireAuditActor()
  const before = toAuditSnapshot(currentData)
  const after = toAuditSnapshot({ ...currentData, ...data } as Record<string, unknown>)
  const batch = writeBatch(getFirebaseDb())

  batch.update(documentRef, payload)
  addAuditEntries(
    batch,
    actor,
    collectionName,
    id,
    options.auditAction ?? 'update',
    before,
    after,
  )
  await batch.commit()
}

export async function swapGalleryOrder(first: GalleryDocument, second: GalleryDocument) {
  const actor = await requireAuditActor()
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const firstRef = doc(db, 'gallery', first.id)
  const secondRef = doc(db, 'gallery', second.id)
  const firstAfter = { ...first, order: second.order }
  const secondAfter = { ...second, order: first.order }

  batch.update(firstRef, withUpdateTimestamp({ order: second.order }) as DocumentData)
  batch.update(secondRef, withUpdateTimestamp({ order: first.order }) as DocumentData)
  addAuditEntries(batch, actor, 'gallery', first.id, 'update', toAuditSnapshot(first), toAuditSnapshot(firstAfter))
  addAuditEntries(batch, actor, 'gallery', second.id, 'update', toAuditSnapshot(second), toAuditSnapshot(secondAfter))
  await batch.commit()
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
  options: MutationOptions = {},
) {
  const documentRef = doc(getFirebaseDb(), collectionName, id)

  if (!isAuditedContentCollection(collectionName)) {
    if (exists) {
      await updateDoc(documentRef, withUpdateTimestamp(data) as DocumentData)
      return
    }

    await setDoc(documentRef, withCreateTimestamps(data) as DocumentData)
    return
  }

  const actor = await requireAuditActor()
  const currentDocument = exists ? await getDoc(documentRef) : null
  const currentData = currentDocument?.data() ?? null
  const before = toAuditSnapshot(currentData)
  const after = toAuditSnapshot({ ...(currentData ?? {}), ...data } as Record<string, unknown>)
  const payload = exists ? withUpdateTimestamp(data) : withCreateTimestamps(data)
  const batch = writeBatch(getFirebaseDb())

  if (exists) {
    batch.update(documentRef, payload as DocumentData)
  } else {
    batch.set(documentRef, payload as DocumentData)
  }

  addAuditEntries(
    batch,
    actor,
    collectionName,
    id,
    options.auditAction ?? (exists ? 'update' : 'create'),
    before,
    after,
  )
  await batch.commit()
}

/**
 * Menerbitkan draf pengaturan global sebagai satu transaksi atomik.
 *
 * Dokumen publik dan draf privat harus berubah bersamaan. Dua write terpisah
 * dapat meninggalkan panel bertanda "terbit" sementara situs masih memuat
 * versi lama ketika koneksi terputus di tengah proses.
 */
export async function publishSiteSettingsDraft(settings: SiteSettings, updatedBy: string) {
  const actor = await requireAuditActor()
  if (actor.actorRole !== 'superadmin') {
    throw new Error('Hanya superadmin yang boleh menerbitkan pengaturan situs.')
  }

  const db = getFirebaseDb()
  const publishedRef = doc(db, 'settings', 'site')
  const draftRef = doc(db, 'siteSettingsDrafts', 'site')
  const [publishedSnapshot, draftSnapshot] = await Promise.all([
    getDoc(publishedRef),
    getDoc(draftRef),
  ])
  const publishedData = { ...settings, updatedBy }
  const draftData = { ...settings, publicationState: 'published' as const, updatedBy }
  const publishedPayload = publishedSnapshot.exists()
    ? withUpdateTimestamp(publishedData)
    : withCreateTimestamps(publishedData)
  const draftPayload = draftSnapshot.exists()
    ? withUpdateTimestamp(draftData)
    : withCreateTimestamps(draftData)
  ;(draftPayload as DocumentData).lastPublishedAt = serverTimestamp()

  const batch = writeBatch(db)
  if (publishedSnapshot.exists()) batch.update(publishedRef, publishedPayload as DocumentData)
  else batch.set(publishedRef, publishedPayload as DocumentData)

  if (draftSnapshot.exists()) batch.update(draftRef, draftPayload as DocumentData)
  else batch.set(draftRef, draftPayload as DocumentData)

  addAuditEntries(
    batch,
    actor,
    'settings',
    'site',
    publishedSnapshot.exists() ? 'update' : 'create',
    toAuditSnapshot(publishedSnapshot.exists() ? publishedSnapshot.data() : null),
    toAuditSnapshot(publishedData),
  )
  addAuditEntries(
    batch,
    actor,
    'siteSettingsDrafts',
    'site',
    draftSnapshot.exists() ? 'update' : 'create',
    toAuditSnapshot(draftSnapshot.exists() ? draftSnapshot.data() : null),
    toAuditSnapshot(draftData),
  )
  await batch.commit()
}

/** Menerbitkan satu halaman beserta pilihan slot medianya dalam satu batch. */
export async function publishPageContentDraft(content: PageContent, updatedBy: string) {
  const actor = await requireAuditActor()
  if (!isPageKey(content.pageKey)) throw new Error('Halaman yang akan diterbitkan tidak dikenali.')

  const db = getFirebaseDb()
  const publishedRef = doc(db, 'pageContents', content.pageKey)
  const draftRef = doc(db, 'pageContentDrafts', content.pageKey)
  const [publishedSnapshot, draftSnapshot] = await Promise.all([
    getDoc(publishedRef),
    getDoc(draftRef),
  ])
  const publishedData = { ...content, updatedBy }
  const draftData = { ...content, publicationState: 'published' as const, updatedBy }
  const publishedPayload = publishedSnapshot.exists()
    ? withUpdateTimestamp(publishedData)
    : withCreateTimestamps(publishedData)
  const draftPayload = draftSnapshot.exists()
    ? withUpdateTimestamp(draftData)
    : withCreateTimestamps(draftData)
  ;(draftPayload as DocumentData).lastPublishedAt = serverTimestamp()

  const batch = writeBatch(db)
  if (publishedSnapshot.exists()) batch.update(publishedRef, publishedPayload as DocumentData)
  else batch.set(publishedRef, publishedPayload as DocumentData)
  if (draftSnapshot.exists()) batch.update(draftRef, draftPayload as DocumentData)
  else batch.set(draftRef, draftPayload as DocumentData)

  addAuditEntries(
    batch,
    actor,
    'pageContents',
    content.pageKey,
    publishedSnapshot.exists() ? 'update' : 'create',
    toAuditSnapshot(publishedSnapshot.exists() ? publishedSnapshot.data() : null),
    toAuditSnapshot(publishedData),
  )
  addAuditEntries(
    batch,
    actor,
    'pageContentDrafts',
    content.pageKey,
    draftSnapshot.exists() ? 'update' : 'create',
    toAuditSnapshot(draftSnapshot.exists() ? draftSnapshot.data() : null),
    toAuditSnapshot(draftData),
  )
  await addPageMediaSlotWrites(batch, actor, content)
  await batch.commit()
}

export async function deleteContentDocument(collectionName: FirestoreCollectionName, id: string) {
  const documentRef = doc(getFirebaseDb(), collectionName, id)

  if (!isAuditedContentCollection(collectionName)) {
    await deleteDoc(documentRef)
    return
  }

  const actor = await requireAuditActor()
  const currentDocument = await getDoc(documentRef)

  if (!currentDocument.exists()) {
    throw new Error(`Dokumen ${collectionName}/${id} tidak ditemukan.`)
  }

  const batch = writeBatch(getFirebaseDb())
  batch.delete(documentRef)
  addAuditEntries(
    batch,
    actor,
    collectionName,
    id,
    'delete',
    toAuditSnapshot(currentDocument.data()),
    null,
  )
  await batch.commit()
}

export async function setContentStatus(
  collectionName: FirestoreCollectionName,
  id: string,
  status: PublishableDocument['status'],
) {
  await updateContentDocument<PublishableDocument>(collectionName, id, { status })
}

/** Memulihkan snapshot revision. Hanya UI superadmin yang menawarkan aksi ini. */
export async function restoreContentRevision(revisionId: string) {
  const revision = await getContentDocument<ContentRevisionDocument>('contentRevisions', revisionId)

  if (!revision) throw new Error('Revision yang dipilih tidak ditemukan.')

  const actor = await requireAuditActor()
  if (actor.actorRole !== 'superadmin') {
    throw new Error('Hanya superadmin yang boleh memulihkan revision.')
  }

  const snapshot = revision.after ?? revision.before
  if (!snapshot) throw new Error('Revision ini tidak mempunyai snapshot yang dapat dipulihkan.')

  const db = getFirebaseDb()
  const targetRef = doc(db, revision.entityType, revision.entityId)
  const currentDocument = await getDoc(targetRef)
  const currentData = currentDocument.exists() ? currentDocument.data() : null
  const payload = currentDocument.exists()
    ? withUpdateTimestamp(snapshot)
    : withCreateTimestamps(snapshot)

  applyPublicationTimestamp(revision.entityType, snapshot, payload as DocumentData, currentData ?? undefined)

  const batch = writeBatch(db)
  if (currentDocument.exists()) batch.update(targetRef, payload as DocumentData)
  else batch.set(targetRef, payload as DocumentData)

  addAuditEntries(
    batch,
    actor,
    revision.entityType,
    revision.entityId,
    'restore',
    toAuditSnapshot(currentData),
    toAuditSnapshot(snapshot),
  )
  if (revision.entityType === 'pageContents' && isPageKey(revision.entityId)) {
    await addPageMediaSlotWrites(batch, actor, snapshot as PageContent)
  }
  await batch.commit()
  return { entityType: revision.entityType, entityId: revision.entityId }
}

/*
 * Arahnya wajib eksplisit.
 *
 * Sebelumnya fungsi ini mengunci 'desc' untuk semua pemanggil. Itu benar untuk
 * tanggal terbit, dan salah untuk `gallery`, yang diurutkan dengan `order`
 * pilihan pengurus: item bernomor 1 justru muncul paling belakang.
 */
export function listPublishedDocuments<T extends PublishableDocument>(
  collectionName: FirestoreCollectionName,
  orderField: string,
  orderDirection: 'asc' | 'desc',
  maxItems?: number,
) {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    orderBy(orderField, orderDirection),
  ]

  if (maxItems) {
    constraints.push(limit(maxItems))
  }

  return listContentDocuments<T>(collectionName, constraints)
}

/*
 * Diurutkan dengan `date`, bukan `publishedAt`.
 *
 * `date` adalah tanggal berlakunya pengumuman, yang diisi pengurus. `publishedAt`
 * cuma mencatat kapan tombol terbit ditekan. Mengurutkan dengan yang kedua
 * berarti pengumuman deadline pekan depan yang diketik lebih dulu tenggelam di
 * bawah pengumuman rapat kemarin yang diketik belakangan.
 */
export function listPublishedAnnouncements(maxItems?: number) {
  return listPublishedDocuments<AnnouncementDocument>('announcements', 'date', 'desc', maxItems)
}

export function listPublishedArticles(maxItems?: number) {
  return listPublishedDocuments<ArticleDocument>('articles', 'publishedAt', 'desc', maxItems)
}

export async function isArticleSlugAvailable(slug: string, excludedDocumentId?: string) {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'articles'), where('slug', '==', slug), limit(2)),
  )

  return snapshot.docs.every((documentSnapshot) => documentSnapshot.id === excludedDocumentId)
}

export function listPublishedGalleryItems(maxItems?: number) {
  return listPublishedDocuments<GalleryDocument>('gallery', 'order', 'asc', maxItems)
}
