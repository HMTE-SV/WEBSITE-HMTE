import 'server-only'

import { cache } from 'react'
import { listPublishedGalleryItems } from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import type { GalleryDocument } from '@/types/firestore'

/*
 * Sumber galeri untuk halaman publik.
 *
 * Yang digantikan bukan sekadar sumber data yang kosong. /galeri sebelumnya
 * menyusun isinya dari `getAllArticles()` yang di-dedup berdasarkan
 * `article.image`, jadi "arsip visual kegiatan" sebenarnya kumpulan sampul
 * berita. Setelah sampul kosong mulai digambar sebagai bidang abstrak, halaman
 * itu akan memajang gambar generatif sebagai dokumentasi kegiatan.
 *
 * Sekarang isinya collection `gallery`, yang memang dikelola pengurus lewat
 * panel, lengkap dengan urutan dan keterangan yang mereka tentukan sendiri.
 */

export type PublicGalleryItem = {
  id: string
  imageUrl: string
  alt: string
  caption: string
  title: string
}

function toPublicGalleryItem(document: GalleryDocument): PublicGalleryItem {
  return {
    // `alt` kosong bukan kesalahan yang boleh ditambal dengan judul begitu saja:
    // judul sering berupa nama acara, bukan deskripsi gambar. Tapi alt kosong
    // pada gambar bermakna lebih buruk lagi bagi pembaca layar, jadi judul
    // dipakai sebagai cadangan terakhir.
    alt: document.alt || document.title,
    caption: document.caption || '',
    id: document.id,
    imageUrl: document.imageUrl,
    title: document.title,
  }
}

export const getPublishedGalleryItems = cache(async (): Promise<PublicGalleryItem[]> => {
  if (!hasFirebaseConfig()) return []

  const documents = await listPublishedGalleryItems()
  return documents.filter((document) => Boolean(document.imageUrl)).map(toPublicGalleryItem)
})
