# Kode akses arsip

Sebagian arsip HMTE tidak untuk konsumsi umum. Dokumen ini menjelaskan cara
sistemnya bekerja, apa yang benar-benar dilindungi, dan apa yang tidak.

## Bentuk yang dipilih

Ada dua tingkat sifat:

| Tingkat | Yang terlihat publik | Yang dilindungi |
|---|---|---|
| **Project privat** | Tidak ada. Hanya jumlahnya, sebagai "arsip terbatas". | Judul, deskripsi, periode, seluruh dokumen. |
| **Dokumen privat** di project publik | Judul, keterangan, format. | Alamat berkas dan isinya. |

Kode akses dipasang **per project**. Satu kode membuka project privat sekaligus
dokumen privat di dalam project publik yang sama.

## Bagaimana rahasianya benar-benar tertutup

Ini bagian yang paling mudah salah, jadi ditulis eksplisit.

Halaman publik dirender server memakai **SDK klien tanpa sesi**. Firestore tidak
bisa membedakan pembaca server dari pembaca browser, jadi apa pun yang bisa
dibaca halaman `/arsip` bisa dibaca pengunjung mana pun langsung dari Firestore.
Karena itu isi privat tidak boleh tinggal di dokumen yang sama.

Penyimpanannya dipecah tiga:

| Tempat | Isi | Siapa yang boleh membaca |
|---|---|---|
| `downloads/index` | Salinan publik yang sudah disaring | Siapa pun |
| `downloadsPrivate/index` | **Dokumen induk**, isinya lengkap | Akun admin; publik hanya lewat Admin SDK setelah kode terbukti |
| `archiveAccess/{projectId}` | Turunan scrypt kode akses | **Tidak ada** — hanya Admin SDK |

Panel admin menulis induknya, lalu menulis salinan publiknya lewat
`redactDownloadsIndexForPublic()` di `src/lib/downloads.ts`. Fungsi itu satu-
satunya yang boleh memutuskan apa yang keluar ke publik, dan ia diuji ketat —
lihat `src/lib/downloads.test.ts`.

Berkas privat tinggal di **`private/arsip/`**, di luar `public/`, sehingga tidak
punya URL statis. Satu-satunya jalan keluarnya
`/api/arsip/berkas/{projectId}/{documentId}`, yang memeriksa kuki sesi lebih
dahulu. Tautan eksternal privat juga diteruskan lewat rute yang sama, bukan
diberikan alamat aslinya — alamat yang sudah sampai ke tangan orang tidak bisa
dicabut lagi, sedangkan gerbangnya bisa.

## Alur membuka

1. Pengunjung memasukkan kode di `/arsip`.
2. `POST /api/arsip/buka` mencocokkan kode ke seluruh catatan `archiveAccess`
   dengan scrypt, lalu menerbitkan kuki `hmte_arsip` — JWT HS256 berisi daftar
   id project yang terbuka, `httpOnly`, berlaku **8 jam**.
3. Halaman meminta isinya ke `GET /api/arsip/terbuka`. Daftar project yang boleh
   dibaca datang dari kuki, bukan dari permintaan — pemanggil tidak bisa
   menyebut id sendiri.
4. Berkasnya diambil lewat rute berkas, yang memeriksa kuki yang sama.

`POST /api/arsip/kunci` menutup sesi lebih awal. Tombolnya ada di halaman, dan
ia memang perlu ada: komputer bersama itu nyata.

## Yang perlu disiapkan sebelum jalan

Fitur ini **gagal tertutup**: kalau salah satu dari dua hal berikut kosong,
arsip privat tidak bisa dibuka sama sekali, dan tidak ada yang bocor.

1. `ARCHIVE_ACCESS_SECRET` — kunci penanda tangan kuki, minimal 32 karakter.
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
2. `FIREBASE_SERVICE_ACCOUNT` — isi privat hanya bisa dibaca lewat Admin SDK.
   Sudah terpasang di Vercel; untuk mencoba lokal, `vercel env pull`.

Lalu, satu kali saja:

```
npm run migrate:arsip -- --dry-run   # lihat rencananya
npm run migrate:arsip                # pecah downloads/index jadi induk + salinan
firebase deploy --only firestore:rules
```

Semua project lama ditandai **publik**. Sifat privat dipasang satu per satu dari
panel; menebak sebaliknya akan menghilangkan arsip dari halaman tanpa ada yang
meminta.

## Batasnya

Ini penjaga yang jujur, bukan brankas. Yang tidak dilindunginya:

- **Orang yang sudah memegang kode.** Ia bisa mengunduh dan meneruskan berkasnya
  ke siapa pun. Tidak ada sistem yang bisa mencegah itu.
- **Siapa pun yang punya akses ke repo**, untuk berkas di `private/arsip/`.
  Folder itu ikut ke git karena Vercel membangun dari repo. Kalau dokumennya
  lebih sensitif daripada daftar orang yang boleh membuka repo, simpan sebagai
  tautan eksternal privat.
- **Sesi yang sudah berjalan saat kode dicabut.** Kuki bertanda tangan tidak
  dicatat di server, jadi ia baru mati saat kedaluwarsa — paling lama 8 jam.
  Mengganti `ARCHIVE_ACCESS_SECRET` memutus semuanya seketika.
- **Kode yang lupa.** Yang tersimpan hanya sidik jarinya. Kode tidak bisa
  dilihat lagi, hanya diganti.

Pembatas percobaan di `/api/arsip/buka` disimpan di memori proses. Di Vercel tiap
instance punya hitungannya sendiri, jadi ia memperlambat penebak, bukan
menghentikannya; pertahanan utamanya tetap biaya scrypt per percobaan. Pakai kode
yang panjang, bukan `12345678`.
