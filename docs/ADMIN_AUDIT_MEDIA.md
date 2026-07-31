# Audit dan Media Admin HMTE

> Diimplementasikan 1 Agustus 2026. Dokumen ini menjelaskan perilaku operasional, bukan menggantikan `INVENTARIS_KONTEN_ADMIN.md`.

## Yang sudah tersedia

### Riwayat perubahan

- Route admin: `/admin/history`.
- Mutasi collection publik yang melewati `content-services.ts` menulis tiga operasi dalam satu batch:
  1. perubahan dokumen utama;
  2. snapshot `contentRevisions`;
  3. ringkasan `auditLogs`.
- Aksi yang dicatat: `create`, `update`, `delete`, dan `restore`.
- Identitas pelaku diambil dari Firebase Auth dan custom claims, bukan dari input form.
- Revision menyimpan field editorial sebelum/sesudah. `id`, `createdAt`, `updatedAt`, dan `publishedAt` tidak disalin ke snapshot.
- Restore hanya tersedia untuk superadmin dan selalu menghasilkan revision baru; riwayat lama tidak pernah ditimpa.

Collection yang dicatat:

```text
announcements
articles
divisions
gallery
leaders
media
mediaSlots
pageContents
pageContentDrafts
partners
programs
settings
```

Yang sengaja tidak masuk snapshot:

- `aspirations`;
- `leaderContacts`;
- `adminUsers`;
- seluruh secret dan token.

Alasannya: revision history ini dapat dibaca semua admin aktif. Data privat memerlukan audit privat dengan kebijakan akses/retensi terpisah.

### Pustaka media

- Route admin: `/admin/media`.
- Upload baru dari Pustaka Media, field gambar, dan editor berita otomatis terdaftar ke collection `media`.
- Metadata: ImageKit `fileId`, URL, folder/kategori, nama asli, MIME, ukuran, dimensi, alt, caption, kredit, izin publikasi, focal point, dan status aktif/arsip. Kategori media dapat dipindahkan dari inspector tanpa memindahkan binary ImageKit.
- Field gambar berita/pengurus/galeri dapat memilih ulang media aktif tanpa menempel URL manual. Pemilih membuka kategori yang sesuai konteks, menyediakan pencarian, dan hanya menampilkan 24 hasil awal.
- File yang diarsipkan tetap berada di ImageKit. Tidak ada penghapusan binary otomatis.

### Slot gambar

- Slot didefinisikan di `src/data/media-slots.ts` dengan key stabil dan fallback ke aset lama.
- Assignment disimpan di collection `mediaSlots`.
- Semua admin dapat melihat slot; hanya superadmin yang dapat mengubahnya.
- Slot mencakup brand, logo kabinet, hero/tentang/dokumentasi beranda, kontak, delapan visual divisi, dan Open Graph default.
- Dokumen slot menyimpan proyeksi publik yang aman: URL, alt, dimensi, dan focal point. Metadata pustaka media tetap tidak dapat dibaca publik.
- Perubahan metadata atau status media otomatis menyinkronkan seluruh slot yang memakai media tersebut.
- Komponen publik membaca slot melalui resolver terpusat dan kembali ke aset bawaan jika Firestore tidak tersedia atau slot belum diisi.
- Penyimpanan slot memicu revalidasi root layout, sehingga header, footer, favicon, metadata, dan halaman lain ikut diperbarui.

### Editor halaman

- Route indeks: `/admin/pages`; editor awal: `/admin/pages/home` dan `/admin/pages/contact`.
- Versi publik disimpan di `pageContents/{pageKey}`; progres privat di `pageContentDrafts/{pageKey}`.
- Editor dapat mengubah copy, SEO, urutan, dan visibilitas section. Viewer hanya membaca.
- Publish ditahan bila SEO melebihi batas, URL tombol tidak valid, atau field pada section yang tampil masih kosong. Draft tetap dapat disimpan belum lengkap.
- Editor halaman, pengaturan global, berita/pengumuman, galeri, dan metadata media memberi peringatan sebelum navigasi ketika ada perubahan lokal yang belum disimpan.
- Penugasan gambar melalui slot bernama tetap dibatasi untuk superadmin.
- Publish menulis dokumen publik, menandai draft sebagai terbit, menyinkronkan slot gambar yang berubah, dan membuat audit/revision dalam satu batch.
- Restore `pageContents` juga menyinkronkan kembali assignment slot gambar dari snapshot yang dipulihkan.

## Batas saat ini

Semua slot yang terdaftar di `src/data/media-slots.ts` sudah dibaca website publik. Copy dan struktur Beranda/Kontak sudah memakai editor halaman; halaman publik lain masih mengikuti inventaris dan dikerjakan bertahap.

Media lama yang sudah ada di ImageKit tidak otomatis muncul di library. Ia masuk ketika:

- diunggah ulang lewat panel; atau
- didaftarkan lewat migrasi/import yang tervalidasi pada fase berikutnya.

## Deploy

Setelah perubahan kode lolos verifikasi:

```powershell
npx.cmd firebase deploy --only firestore:rules,firestore:indexes --project <project-id>
```

Jangan menjalankan deploy ke project produksi sebelum project ID dan environment target dikonfirmasi.

## Pemeriksaan minimum

1. Buat artikel draft, lalu pastikan satu entry tampil di `/admin/history`.
2. Ubah judul artikel, periksa `changedFields` dan snapshot sebelum/sesudah.
3. Pulihkan revision sebagai superadmin dan pastikan halaman terkait direvalidasi.
4. Unggah gambar di `/admin/media`; pastikan record metadata muncul.
5. Pilih gambar yang sama dari field cover berita tanpa upload ulang.
6. Assign satu slot sebagai superadmin; editor dapat menyinkronkan proyeksi media tetapi tidak dapat mengganti assignment.
7. Pastikan gambar baru tampil pada halaman publik setelah revalidasi dan focal point mengikuti nilai panel.
8. Pastikan isi aspirasi dan email internal tidak pernah muncul di revision.
