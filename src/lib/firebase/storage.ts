import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebaseStorage } from './client'

type UploadImageInput = {
  file: File
  folder: 'article-covers' | 'gallery'
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${baseName || 'image'}.${extension}`
}

export async function uploadImageToStorage({ file, folder }: UploadImageInput) {
  const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`
  const storageRef = ref(getFirebaseStorage(), path)
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  })
  const downloadUrl = await getDownloadURL(snapshot.ref)

  return {
    downloadUrl,
    path,
  }
}

export async function deleteImageFromStorage(path: string) {
  await deleteObject(ref(getFirebaseStorage(), path))
}
