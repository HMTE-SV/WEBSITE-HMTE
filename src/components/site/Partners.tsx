// Komponen mati: seksi "Koordinasi, relasi, dan ruang kolaborasi" tidak lagi
// dirender di beranda dan file ini tidak di-import dari mana pun.
//
// Datanya SENGAJA tidak ikut dibuang. `partnersIntro` dan `partnerTiles` di
// src/data/site-content.ts memuat delapan relasi yang benar-benar ada di
// struktur organisasi, dan itu isi, bukan perancah. Kalau seksinya mau
// dihidupkan lagi, bahannya masih utuh di sana.
//
// File fisiknya belum bisa dihapus karena watcher `next dev` mengunci file di
// Windows. Hapus dengan `del src\components\site\Partners.tsx` setelah dev
// server dimatikan.
export {}
