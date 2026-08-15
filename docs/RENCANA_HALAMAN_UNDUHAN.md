# Rencana: Halaman Unduhan (`/unduhan`)

**Status:** siap dikerjakan · **Dasar:** commit `371a353` (`feat/admin-v7`) · **Disusun:** 14 Agustus 2026

Dokumen ini ditulis supaya bisa dieksekusi berurutan tanpa menebak. Setiap tahap
punya berkas yang disentuh, isi yang diharapkan, dan cara membuktikan tahap itu
selesai. Baca **Bagian 1 (Batasan)** sampai habis sebelum menulis baris pertama —
empat di antaranya adalah jebakan yang sudah pernah memakan korban.

---

## 0a. Keadaan repo saat kamu masuk

Baca ini dulu kalau kamu agen yang baru membuka repo ini.

- **Branch:** `feat/admin-v7`, HEAD di `371a353`, pohon kerja **bersih**. Nama
  lokalnya menyesatkan — branch ini melacak `origin/alpha-dev`, jadi `git push`
  mendarat di `alpha-dev`, bukan di branch bernama sama.
- **Jangan sentuh branch `wip/admin-v7-uncommitted` (`2ff80d1`).** Isinya
  redesign admin v7 yang sengaja diparkir dan belum ditinjau. Jangan di-merge,
  jangan di-cherry-pick, jangan dijadikan rujukan gaya.
- **`.env.local` sudah terisi** dan Firestore bisa dihubungi dari lokal.
  **Jangan pernah mem-`commit` berkas itu**, jangan menyalin isinya ke berkas
  lain, dan jangan mencetak nilainya ke log atau ke ringkasan.
- Direktori yang muncul sebagai *untracked* — `.codex-remote-attachments/`,
  `.next-stale-v7-check/`, `.recovery-residual-20260810/` — adalah sisa alat dan
  sisa pemulihan. Abaikan; jangan dihapus, jangan di-commit.
- Mungkin ada dev server yang masih hidup di port 3000 atau 3001 dari sesi
  sebelumnya. Kalau perilakunya aneh, hapus `.next` dan nyalakan ulang.
- Dokumen rencana ini sendiri belum di-commit. Silakan ikut sertakan di commit
  pertama.

Kalau ada yang bertentangan antara rencana ini dan apa yang kamu temukan di
kode, **kode yang menang** — laporkan selisihnya, jangan diam-diam menyesuaikan
rencana.

---

## 0. Konteks: kenapa ini dibangun ulang, bukan diperbaiki

Fitur ini **pernah ada** dan hilang seluruhnya dalam insiden penghapusan sekitar
10 Agustus 2026. Bukan rusak — tidak ada.

Bukti bahwa ia pernah ada, dari manifest build yang tersisa sebagai objek git
menggantung (`git cat-file -p aeba0ac2e562b4af2828e68d41ca01181e91ae47`):

```
"/admin/(protected)/downloads/page": "app/admin/(protected)/downloads/page.js",
"/unduhan/page": "app/unduhan/page.js"
```

Yang sudah dipastikan **tidak ada** di pohon kerja sekarang:

- rute `src/app/unduhan/` dan `src/app/admin/(protected)/downloads/`
- `src/lib/downloads.ts`, `src/lib/downloads-data.ts`
- `src/components/admin/AdminDownloadsManager.tsx`
- koleksi `downloads` di `firestore.rules` dan di `src/types/firestore.ts`
- direktori `public/assets/unduhan/` beserta seluruh berkas dokumennya
- `scripts/migrate-navigation.ts` (ikut hilang; navigasi kini disunting lewat panel)

Pemulihan dari git sudah dicoba dan **gagal**: `git fsck` menemukan 83 blob
menggantung tetapi **nol dangling commit**, dan seluruh blob itu artefak build
(bundel webpack, manifest), bukan berkas sumber. Tidak ada `.patch`/`.diff` yang
tersimpan. Kesimpulan: tulis ulang.

Rancangan aslinya terekam di catatan memori `unduhan-page` dan dipakai sebagai
dasar rencana ini, jadi bentuk akhirnya tetap sama dengan yang dulu disetujui.

### Satu catatan tentang production

Navbar production memuat CTA **UNDUHAN**. Deployment production dibuat dari kode
sebelum insiden, jadi di sana halamannya kemungkinan masih hidup. Begitu branch
ini di-deploy tanpa `/unduhan`, **CTA itu berubah jadi 404**. Karena itu Tahap 7
(navigasi) wajib, bukan opsional, dan urutan deploy tidak boleh dibalik.

---

## 1. Batasan yang tidak boleh dilanggar

### B1 — Pemisahan murni/server itu wajib, bukan gaya

Dua berkas, dan jangan pernah digabung:

| Berkas | Sifat | Boleh impor |
|---|---|---|
| `src/lib/downloads.ts` | **MURNI** | tidak ada `node:*`, tidak ada `firebase/*`, tidak ada `server-only` |
| `src/lib/downloads-data.ts` | **SERVER SAJA** | diawali `import 'server-only'`, boleh `node:fs`, boleh Firestore |

`downloads.ts` diimpor oleh komponen klien (panel admin) **dan** oleh server
**dan** oleh tes. `downloads-data.ts` memakai `node:fs`.

**Jebakan yang sudah pernah terjadi:** mengambil satu tetapan saja dari
`downloads-data.ts` ke dalam komponen klien akan menggagalkan build halaman itu —
webpack tidak bisa menyelesaikan skema `node:`. Pesan errornya menunjuk ke berkas
lain dan sulit dilacak. Kalau butuh sebuah tetapan di kedua sisi, tempatnya di
`downloads.ts`.

Preseden yang sudah ada di repo dan harus ditiru bentuknya:
`src/lib/site-settings.ts` (murni) + `src/lib/site-settings-data.ts` (server), dan
`src/lib/program-schedule.ts` yang dijaga murni dengan alasan sama.

**Peringatan khusus — jangan menyalin letak `SITE_SETTINGS_ID`.**
`AdminSettingsManager.tsx:13` mengimpor `SITE_SETTINGS_ID` dari
`@/lib/site-settings-data`, dan itu **aman hanya karena kebetulan**:
`site-settings-data.ts` tidak memuat satu pun impor `node:*`. `downloads-data.ts`
akan memuat `node:fs`, jadi impor serupa dari panel klien langsung merobohkan
build. Karena itu `DOWNLOADS_ID` **wajib tinggal di `downloads.ts` yang murni**.
Inilah persis kecelakaan yang sudah pernah terjadi di fitur ini sebelumnya —
mengambil satu tetapan saja dari sisi server.

### B2 — Ukuran berkas DIBACA DARI DISK, tidak pernah diketik

Tidak ada field ukuran di Firestore. Ukuran dihitung saat halaman dirender,
dengan `fs.stat` atas berkas di `public/`.

Konsekuensi yang disengaja: berkas yang belum ada di disk **otomatis** turun
statusnya jadi "Menyusul". Artinya halaman ini secara struktural tidak bisa
memuat tautan mati ke `public/`. Jangan merusak sifat ini dengan menyimpan
ukuran atau ketersediaan sebagai data.

### B3 — Audit itu berpasangan; setengah saja = semua simpan gagal

`writeContentDocumentAtId()` menulis dokumen **dan** log audit dalam satu
`writeBatch`. Kalau `downloads` didaftarkan di `auditedContentCollections`
(`src/types/firestore.ts:37`) tetapi **tidak** ditambahkan ke
`isAuditedEntityType()` (`firestore.rules:167`), rules menolak tulisan audit,
seluruh batch gugur, dan **setiap penyimpanan gagal** dengan pesan permission
yang menyesatkan.

**Keputusan untuk rencana ini: `downloads` TIDAK diaudit.** Isinya daftar
tautan, bukan konten redaksional, dan riwayat revisinya tidak sepadan dengan
kerumitannya. Jadi:

- **JANGAN** tambahkan `'downloads'` ke `auditedContentCollections`
- **JANGAN** tambahkan `'downloads'` ke `isAuditedEntityType()`

Kalau kelak audit diinginkan, ubah **keduanya dalam satu commit**.

### B4 — `path` berasal dari editor, jadi harus dikurung sebelum masuk `fs`

`path` adalah string yang diketik pengurus di panel, lalu dipakai membaca disk.
Tanpa penjagaan, isian `../../.env.local` membuat server membaca berkas di luar
`public/`.

Aturan yang harus ditegakkan di `downloads.ts` (murni, jadi ikut teruji):

1. tolak string yang memuat `..`
2. tolak yang diawali `/` atau memuat `:` (jalur absolut / drive Windows)
3. normalkan pemisah `\` menjadi `/`
4. wajib berawalan `assets/unduhan/`
5. resolusi akhir harus tetap berada di dalam `public/assets/unduhan` — periksa
   ulang dengan `path.resolve()` di `downloads-data.ts`, jangan percaya
   validasi string saja

Item yang gagal validasi diperlakukan sebagai **"Menyusul"**, bukan error yang
merobohkan halaman.

### B5 — Panel mengelola DAFTAR, bukan BERKAS

Belum ada unggah berkas non-gambar dari panel. ImageKit hanya untuk gambar.

Artinya: berkas PDF/DOCX/ZIP masuk lewat repo (`public/assets/unduhan/`) dan
butuh deploy. Berkas besar (mis. buku panduan 52 MB) **tidak** masuk repo —
didaftarkan sebagai jenis `external` yang menunjuk ke Google Drive.

Jangan membangun UI unggah berkas di tahap ini. Kalau nanti dibuat, itu pekerjaan
terpisah dengan penyimpanannya sendiri.

### B6 — Tulis berkas dalam UTF-8

Sesi sebelumnya kehilangan karakter non-ASCII: `×` jadi `-`, `↑`/`↓` hilang, `·`
jadi `/`. Semua berkas baru ditulis UTF-8. Kalau memakai PowerShell, jangan
`Set-Content` tanpa `-Encoding utf8`. Setelah selesai, jalankan pemeriksaan di
Tahap 9.

### B7 — Halaman publik tidak boleh roboh saat Firestore mati

Ikuti pola `getSiteSettings()`: cek `hasFirebaseConfig()` dulu, bungkus
pembacaan dengan `try/catch`, pulangkan daftar kosong saat gagal. Halaman
menampilkan `EmptyState`, bukan layar error.

---

## 2. Model data

Ditetapkan di sini supaya tidak ada dua tahap yang mengarang bentuk berbeda.

### Dokumen Firestore: `downloads/index` (dokumen tunggal)

Satu dokumen berisi seluruh daftar — bukan satu dokumen per berkas. Daftarnya
pendek, selalu dibaca utuh, dan urutannya ditentukan manual; memecahnya cuma
menambah operasi baca berbayar. Pola ini sama dengan `settings/site`.

```
downloads/index
  items: DownloadItem[]
  updatedBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
```

### Tipe di `src/lib/downloads.ts`

```ts
export const DOWNLOADS_ID = 'index'
export const DOWNLOADS_PUBLIC_DIR = 'assets/unduhan'

export type DownloadKind = 'file' | 'external'
export type DownloadStatus = 'ready' | 'pending' | 'hidden'
export type DownloadCategory = 'brand' | 'dokumen' | 'template' | 'lainnya'

export type DownloadItem = {
  id: string
  title: string
  description: string
  category: DownloadCategory
  kind: DownloadKind
  path: string          // kind 'file': relatif ke public/, mis. 'assets/unduhan/logo-hmte.zip'
  externalUrl: string   // kind 'external': URL penuh
  format: string        // 'PDF' | 'DOCX' | 'ZIP' | 'PNG' | ... (cap format, huruf besar)
  status: DownloadStatus
  order: number
}

export type DownloadsIndex = {
  items: DownloadItem[]
  updatedBy: string
}
```

Arti `status` dalam bahasa panel:

| Nilai | Label panel | Perilaku publik |
|---|---|---|
| `ready` | Siap | tampil dan bisa diunduh **jika** berkasnya ada di disk |
| `pending` | Menyusul | tampil sebagai slot kelabu, tidak bisa diklik |
| `hidden` | Disembunyikan | tidak dirender sama sekali di halaman publik |

`ready` adalah **niat**, bukan jaminan. Ketersediaan sebenarnya ditentukan disk
(lihat B2), dan `ready` yang berkasnya tidak ada turun jadi `pending` saat render.

### Tipe hasil resolusi (dipulangkan `downloads-data.ts`)

```ts
export type ResolvedDownload = DownloadItem & {
  available: boolean
  sizeLabel: string   // '2,4 MB' | '—' saat tidak tersedia
  href: string        // '/assets/unduhan/x.pdf' | externalUrl | ''
}
```

### Fungsi murni yang wajib ada di `downloads.ts`

| Fungsi | Tugas |
|---|---|
| `defaultDownloadsIndex` | tetapan `{ items: [], updatedBy: '' }` |
| `normalizeDownloadsIndex(raw: unknown): DownloadsIndex` | tahan dokumen cacat/`null`; buang item tanpa `id`/`title`; paksa enum ke nilai sah; urutkan menurut `order` |
| `isSafeDownloadPath(path: string): boolean` | penjagaan B4 |
| `formatFileSize(bytes: number): string` | `1024` → `'1,0 KB'`; pemisah desimal **koma** (Indonesia) |
| `makeDownloadId(): string` | id unik untuk baris baru |
| `validateDownloads(items): DownloadsValidationIssue[]` | lihat di bawah |

```ts
export type DownloadsValidationIssue = {
  itemId: string      // WAJIB — panel memakainya untuk membuka paksa baris yang salah
  field: string
  message: string
}
```

`itemId` ada justru supaya panel bisa membuka baris terlipat yang menahan
penyimpanan. Jangan hilangkan.

Aturan validasi minimum: `title` tidak kosong; `kind: 'file'` wajib `path` yang
lolos `isSafeDownloadPath`; `kind: 'external'` wajib `externalUrl` berawalan
`https://`; `format` tidak kosong.

---

## 3. Tahap 1 — Fondasi murni

**Berkas baru:** `src/lib/downloads.ts`, `src/lib/downloads.test.ts`

Isi sesuai Bagian 2. Tidak ada impor Firebase, `node:*`, atau `server-only`.

Tes (vitest, jalankan `npm run test:unit`) minimal menutup:

- `normalizeDownloadsIndex(null)` → `defaultDownloadsIndex`
- dokumen dengan `items` bukan larik → tidak melempar
- item dengan `status`/`kind`/`category` ngawur → jatuh ke nilai sah
- `isSafeDownloadPath` menolak: `'../secret'`, `'/etc/passwd'`, `'C:/x'`,
  `'assets/unduhan/../../.env.local'`, `'public/assets/unduhan/x.pdf'`
- `isSafeDownloadPath` menerima `'assets/unduhan/panduan.pdf'`
- `formatFileSize` memakai koma desimal
- `validateDownloads` memulangkan `itemId` yang benar untuk tiap pelanggaran

**Selesai bila:** `npm run test:unit` hijau, dan `downloads.ts` tidak memuat
string `node:`, `firebase`, atau `server-only`.

---

## 4. Tahap 2 — Pendaftaran koleksi & rules

**Berkas disunting:** `src/types/firestore.ts`, `firestore.rules`

1. Tambah `downloads: 'downloads',` ke objek `firestoreCollections`
   (`src/types/firestore.ts:8`), jaga urutan alfabetis di sekitarnya.
2. Tambah tipe dokumennya di berkas yang sama. Perhatikan impornya — berkas ini
   memang sudah mengimpor tipe dari `@/lib/*` (lihat `SiteSettings` di
   `src/types/firestore.ts:3`), jadi polanya sudah ada:

```ts
import type { DownloadItem } from '@/lib/downloads'

export type DownloadsDocument = FirestoreDocument & {
  items: DownloadItem[]
  updatedBy: string
}
```

3. **JANGAN** menyentuh `auditedContentCollections` (lihat B3).
4. Tambah blok rules **sebelum** `match /{document=**}`:

```
    /*
     * Daftar berkas unduhan. Terbaca publik karena /unduhan dirender server dan
     * Firestore tidak bisa membedakan pembaca server dari pembaca browser.
     *
     * Tidak diaudit: isinya daftar tautan, bukan konten redaksional. Kalau audit
     * kelak ditambahkan, `downloads` harus masuk auditedContentCollections DAN
     * isAuditedEntityType() dalam satu perubahan — setengahnya membuat setiap
     * simpan gagal karena batch audit ditolak.
     */
    match /downloads/{documentId} {
      allow read: if true;
      allow create: if isEditor() && hasValidWriteTimestamps();
      allow update: if isEditor() && keepsCreatedAt();
      allow delete: if isSuperadmin();
    }
```

**Berkas baru:** `tests/rules/downloads.test.ts`, meniru bentuk
`tests/rules/content.test.ts` dan memakai `tests/rules/helpers.ts`.

Kasus yang harus diuji: pengunjung anonim boleh baca; anonim tidak boleh tulis;
`viewer` tidak boleh tulis; `editor` boleh create+update; `editor` tidak boleh
delete; `superadmin` boleh delete; update yang mengubah `createdAt` ditolak.

**Selesai bila:** `npm run test:rules` hijau.
**Prasyarat:** perintah itu butuh **Java (JDK)** untuk emulator Firestore. Kalau
Java tidak ada, tulis tesnya tetap, laporkan bahwa ia belum dijalankan — jangan
diam-diam melewatinya.

---

## 5. Tahap 3 — Lapisan server

**Berkas baru:** `src/lib/downloads-data.ts`

```ts
import 'server-only'
import { cache } from 'react'
import { stat } from 'node:fs/promises'
import path from 'node:path'
```

Dua ekspor:

```ts
export const getDownloadsIndex = cache(async (): Promise<DownloadsIndex> => { ... })
export const getPublicDownloads = cache(async (): Promise<ResolvedDownload[]> => { ... })
```

`getDownloadsIndex`: ikuti persis pola `src/lib/site-settings-data.ts` — cek
`hasFirebaseConfig()`, panggil `getContentDocument<DownloadsDocument>('downloads', DOWNLOADS_ID)`,
lewatkan ke `normalizeDownloadsIndex`, `try/catch` dengan `console.warn` dan
pulangkan `defaultDownloadsIndex` saat gagal.

`getPublicDownloads`:

1. buang item `status === 'hidden'`
2. untuk `kind: 'external'` → `available: true`, `sizeLabel: '—'`, `href: externalUrl`
3. untuk `kind: 'file'`:
   - kalau `!isSafeDownloadPath(item.path)` → `available: false`
   - `const abs = path.join(process.cwd(), 'public', item.path)`
   - **periksa ulang**: `path.resolve(abs)` harus berawalan
     `path.resolve(process.cwd(), 'public', DOWNLOADS_PUBLIC_DIR)`; kalau tidak,
     `available: false`
   - `stat(abs)` di dalam `try/catch`; gagal → `available: false`
   - berhasil → `sizeLabel: formatFileSize(stats.size)`, `href: '/' + item.path`
4. item `status: 'ready'` yang `available: false` **dipulangkan dengan
   `status: 'pending'`** — inilah penurunan otomatis dari B2

**Selesai bila:** `npx tsc --noEmit` bersih, dan `downloads-data.ts` tidak pernah
diimpor dari berkas ber-`'use client'` (dibuktikan di Tahap 9).

---

## 6. Tahap 4 — Halaman publik `/unduhan`

**Berkas baru:** `src/app/unduhan/page.tsx`
**Berkas baru:** `css/downloads.css` — impor di `src/app/layout.tsx` mengikuti
pola impor CSS yang sudah ada di sana.

Kerangka wajib mengikuti `src/app/galeri/page.tsx`:

```tsx
export const revalidate = 300
export const metadata: Metadata = { title: ..., description: ... }

export default async function DownloadsPage() {
  let items: ResolvedDownload[] = []
  let loadError = false
  try { items = await getPublicDownloads() } catch { loadError = true }

  return (
    <PublicPageFrame activeHref="/unduhan">
      ...
    </PublicPageFrame>
  )
}
```

Yang harus ada di tampilan:

- hero dengan `<HeroBackdrop variant="dome" />` dan `className="... has-hero-backdrop"`.
  Kelima varian (`arc`, `orbit`, `dome`, `crest`, `drift`) sudah terpakai di
  halaman lain, jadi tidak ada yang "masih kosong" — `dome` dipilih karena paling
  jarang muncul. Varian di luar kelima nama itu membuat `figures[variant]`
  memulangkan `undefined` dan halaman gagal render.
- daftar **dikelompokkan per kategori**, urutan: Brand → Dokumen → Template → Lainnya;
  kategori tanpa item tidak dirender
- tiap baris memuat: judul, deskripsi, cap format, ukuran, dan aksi
- item `available` → `<a href={href} download>` untuk `kind: 'file'`; untuk
  `kind: 'external'` gunakan `<a href target="_blank" rel="noopener noreferrer">`
  dengan penanda visual bahwa ia keluar situs
- item `pending` → **bukan** tautan. Elemen non-interaktif berlabel "Menyusul".
  Jangan pakai `<a>` tanpa `href`, dan jangan pakai `<button disabled>` yang
  menyamar jadi tautan
- daftar kosong / `loadError` → `<EmptyState>` dengan dua pesan berbeda, tiru
  perbedaan pesan di `galeri/page.tsx:90-95`

Gaya visual mengikuti sistem yang sudah berlaku (`css/ui-soft.css`, token `--sr-*`):
struktur dari permukaan dan warna, bukan dari garis. Jangan memasang kerangka
tabel bergaris.

### Sitemap

**Berkas disunting:** `src/app/sitemap.ts`

Tambah `'/unduhan',` ke larik `staticRoutes` (`src/app/sitemap.ts:8-18`). Tanpa
ini halamannya tidak pernah didaftarkan ke mesin pencari — dan sitemap yang
kosong lulus semua tes tanpa mengeluh, seperti yang sudah pernah terjadi dengan
berita (lihat komentar di `sitemap.ts:21-26`).

Catatan sampingan, di luar lingkup: `/divisi` juga belum ada di `staticRoutes`.
Jangan diperbaiki di sini — sebutkan saja supaya tidak terlupa.

**Selesai bila:** `/unduhan` memulangkan 200 dan merender ketiga keadaan (ada
item, kosong, gagal muat) tanpa error di konsol server, dan `/sitemap.xml`
memuat URL `/unduhan`.

---

## 7. Tahap 5 — Panel `/admin/downloads`

**Berkas baru:** `src/app/admin/(protected)/downloads/page.tsx`
**Berkas baru:** `src/components/admin/AdminDownloadsManager.tsx`
**Berkas disunting:** `src/data/admin-nav.ts`

### Rute

Tiru `src/app/admin/(protected)/page.tsx`: bungkus dengan `<AdminShell>`,
`activeHref="/admin/downloads"`, `kicker="Publikasi"`, judul dan deskripsi
seperlunya.

### Menu admin

Di `src/data/admin-nav.ts`, sisipkan setelah entri `/admin/media`:

```ts
  {
    group: 'publikasi',
    href: '/admin/downloads',
    icon: 'page',
    label: 'Unduhan',
    roles: ['superadmin', 'editor', 'viewer'],
  },
```

Ikon `'page'` dipakai karena `AdminNavIcon` belum punya varian berkas, dan ikon
itu sudah ada (`AdminIcon.tsx:18`). Kalau mau ikon sendiri, tambahkan nama
barunya ke union `AdminNavIcon` (`src/data/admin-nav.ts:11`) **dan** satu baris
`if` di `AdminIcon.tsx`. Lupa langkah kedua tidak menghasilkan error: TypeScript
tetap lulus dan komponen jatuh ke ikon cadangan berbentuk gerigi di baris
terakhir berkas itu — jadi salahnya terlihat sebagai menu bergambar gerigi, bukan
sebagai kegagalan.

Perhatikan: `canAccessAdminPath()` bekerja otomatis dari daftar ini — tidak ada
tempat kedua yang perlu disentuh untuk izin.

### Komponen panel

`'use client'`. Tiru `AdminGalleryManager.tsx` untuk: `useAdminSession()`,
`canAdminWrite(session.role)` → `canWrite`, keadaan `isSaving`/`feedback`/`errors`,
dan gaya tombol `admin-primary-button` / `admin-secondary-button`.

Bentuk yang diminta (sesuai rancangan asli):

- **satu formulir, satu dokumen** — tidak ada alur draft/publish
- **baris terlipat**: kepala baris hanya nomor urut, nama, cap format, dan status.
  Isian muncul saat baris dibuka
- **pencarian** teks atas judul
- **saring status**: Semua / Siap / Menyusul / Disembunyikan
- **naik/turun** untuk mengubah `order`
- baris yang menahan penyimpanan **dibuka paksa dan diberi pita merah** —
  gunakan `itemId` dari `DownloadsValidationIssue`
- satu tombol simpan untuk seluruh dokumen

Penyimpanan memakai primitif yang sudah ada:

```ts
await writeContentDocumentAtId<DownloadsDocument>(
  'downloads',
  DOWNLOADS_ID,
  { items, updatedBy: session.email },
  exists,
)
```

`exists` diketahui dari hasil pembacaan awal (`getContentDocument` memulangkan
`null` bila belum ada). Salah menebak `exists` berarti rules menolak: `create`
menuntut `createdAt` baru, `update` menuntut `createdAt` yang tidak berubah.

Pola persisnya sudah ada dan harus ditiru, bukan dikarang ulang — lihat
`AdminSettingsManager.tsx:67` (`draftExists` sebagai state), `:81` (pembacaan
awal menentukan nilainya), dan `:161-166` (dipakai saat menulis, lalu disetel
`true`).

### Revalidasi — jangan dilewatkan

**Berkas disunting:** `src/app/api/revalidate/route.ts`

Tambah satu baris ke `revalidationTargets` (`route.ts:22-30`):

```ts
  downloads: ['/unduhan'],
```

Lalu di komponen panel, setelah penyimpanan berhasil:

```ts
import { requestRevalidation } from '@/lib/admin/revalidate'
// ...
await requestRevalidation('downloads')
```

**Kenapa ini wajib.** Halaman publik memakai `revalidate = 300`. Tanpa panggilan
ini, pengurus menyimpan lalu membuka `/unduhan` dan masih melihat daftar lama
sampai lima menit — persis keadaan yang komentar di `route.ts:8-12` sebut sebagai
"pengurus akan menyimpulkan panelnya rusak". Fitur akan terasa tidak bekerja
padahal datanya sudah tersimpan.

Dua hal teknis: `target` divalidasi terhadap kunci di peta itu, jadi memanggil
`requestRevalidation('downloads')` tanpa menambah kuncinya memulangkan **400**.
Dan `requestRevalidation` sengaja tidak pernah melempar — jangan bungkus dengan
`try/catch` yang menampilkan "gagal menyimpan", karena datanya memang sudah
tersimpan saat fungsi itu dipanggil.

Panel **mengimpor `src/lib/downloads.ts` saja**. Menyentuh `downloads-data.ts`
dari sini akan merobohkan build (B1).

**Selesai bila:** superadmin dan editor dapat menambah, menyunting, mengurutkan,
dan menyimpan; viewer melihat isinya tetapi seluruh kontrol tulis nonaktif;
menyimpan item cacat memunculkan pita merah pada baris yang tepat dan tidak
mengirim apa pun ke Firestore.

---

## 8. Tahap 6 — Berkas fisik

**Direktori baru:** `public/assets/unduhan/`

Isi awal boleh menyusul; halaman sudah tahan berkas kosong (B2). Yang penting
direktorinya ada supaya pemeriksaan jalur di Tahap 3 tidak selalu gagal.

Aturan penempatan:

- berkas kecil–menengah (< ~10 MB) → masuk repo di direktori ini
- berkas besar → **jangan** masuk repo; daftarkan sebagai `kind: 'external'`
  menunjuk Google Drive
- periksa `.gitignore` sebelum menambah berkas: baris `ASSET/` dan pola lain
  mungkin ikut menangkapnya. Kalau tertangkap, tambahkan pengecualian eksplisit,
  jangan longgarkan pola yang sudah ada

---

## 9. Tahap 7 — Navigasi (data, bukan kode)

Menu situs publik dibaca dari Firestore `settings/site`, **bukan dari kode**.
Jangan menyunting `src/data/site-content.ts` — isinya cuma nilai cadangan yang
dipakai saat Firebase tidak terkonfigurasi.

Lakukan lewat panel: **`/admin/settings`** → bagian Navigasi → tambah menu.
Kode pendukungnya sudah ada (`AdminSettingsManager.tsx:119-135`).

Yang perlu dipastikan:

1. ada entri menuju `/unduhan` dengan `visible: true`
2. CTA header (`headerCtaHref`) — production sudah memakai label **UNDUHAN**.
   Pastikan `headerCtaHref` menunjuk `/unduhan`, bukan tujuan lama
3. **jangan deploy Tahap 1–6 tanpa tahap ini**, kalau tidak CTA production jadi 404

Sunting `src/data/site-content.ts` **hanya** kalau nilai cadangan juga perlu
menyebut `/unduhan` — opsional, dan tidak berpengaruh di production.

---

## 10. Tahap 8 — Verifikasi menyeluruh

Jalankan berurutan; semua harus lulus:

```bash
npx tsc --noEmit          # tipe bersih
npm run lint              # eslint
npm run test:unit         # vitest
npm run test:rules        # butuh Java/JDK
npm run build             # build produksi — penangkap utama pelanggaran B1
```

`npm run build` adalah pemeriksa terpenting. Pelanggaran B1 (`node:fs` bocor ke
bundel klien) sering lolos dari `tsc` dan `dev`, lalu baru meledak di sini.

Pemeriksaan manual di `npm run dev`:

| Uji | Harapan |
|---|---|
| `/unduhan` dengan Firestore hidup | daftar tampil, ukuran terisi dari disk |
| `/unduhan` dengan `.env.local` dikosongkan | `EmptyState`, bukan layar error |
| item `ready` yang berkasnya sengaja dihapus | otomatis tampil "Menyusul" |
| item `hidden` | tidak muncul sama sekali di halaman publik |
| `path` diisi `../../.env.local` lewat panel | ditolak validasi; kalau lolos, tetap `available: false` |
| `/admin/downloads` sebagai viewer | terbaca, seluruh kontrol tulis mati |
| simpan di panel, lalu muat ulang `/unduhan` **segera** | perubahan langsung terlihat, tidak menunggu 5 menit |
| `/sitemap.xml` | memuat URL `/unduhan` |

Pemeriksaan encoding (B6) — harus tidak memulangkan apa pun yang mencurigakan:

```bash
git diff --stat
git diff -U0 | grep -P '^-.*[^\x00-\x7F]'
```

Baris hasil `grep` berarti ada karakter non-ASCII yang hilang. Kembalikan.

---

## 11. Urutan commit yang disarankan

Jangan satu commit raksasa. Empat commit, tiap satu bisa berdiri sendiri:

1. `feat(unduhan): fondasi murni + tes` — Tahap 1
2. `feat(unduhan): koleksi downloads + rules + tes rules` — Tahap 2
3. `feat(unduhan): lapisan server + halaman publik` — Tahap 3, 4 (termasuk sitemap), 6
4. `feat(admin): panel pengelolaan unduhan` — Tahap 5 (termasuk revalidasi)

Branch: lanjutkan di `feat/admin-v7` (melacak `origin/alpha-dev`). Ingat nama
lokal dan nama remote berbeda — `git push` mendarat di `alpha-dev`.

---

## 12. Di luar lingkup

Jangan kerjakan sekarang, sebutkan saja kalau tergoda:

- unggah berkas non-gambar dari panel (butuh penyimpanan baru; ImageKit khusus gambar)
- penghitung unduhan / analitik
- versi berkas atau riwayat revisi daftar
- audit trail untuk `downloads` (lihat B3 — perlu perubahan berpasangan)
- redesign admin v7, yang terparkir di branch `wip/admin-v7-uncommitted` (`2ff80d1`)
