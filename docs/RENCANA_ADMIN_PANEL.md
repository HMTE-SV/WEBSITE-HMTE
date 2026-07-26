# Rencana Rework Admin Panel & Integrasi Firebase

> Status: **rencana**, belum dikerjakan. Disusun 2026-07-25 setelah audit kode yang ada.
> Dokumen ini adalah rujukan untuk sesi kerja berikutnya.

---

## 0. Batasan yang sudah pasti

Tiga jawaban dari Reeyza (2026-07-25) yang mengunci beberapa keputusan:

| Fakta | Konsekuensi |
|---|---|
| **Paket Firebase masih Spark (gratis)** | Cloud Functions **tidak tersedia**. Cloud Storage kemungkinan besar juga tidak (wajib Blaze untuk proyek yang dibuat setelah Okt 2024). Kuota keras: **50.000 read/hari**, 20.000 write/hari, 1 GiB Firestore. |
| **ImageKit belum ada** | Perlu dibuat. Tapi karena Storage praktis tertutup, hosting gambar eksternal bukan lagi preferensi — sudah jadi keharusan. |
| **Panel dipakai minimal 1 orang per divisi** (±9 orang) | Peran editor per-bidang naik dari "kalau sempat" jadi **wajib**. Sembilan orang dengan hak tulis penuh ke satu kolam data yang sama adalah resep kecelakaan. |
| **Superadmin ada 2**: satu developer, satu manajerial PH | Angka yang sehat. Pastikan keduanya bisa saling memulihkan akses — jangan sampai satu-satunya yang bisa menambah admin adalah orang yang sudah lulus. |
| **Penulis berita berbasis peran, bisa lintas divisi** | Satu peran per orang tidak cukup lagi — orang bisa sekaligus penulis *dan* pengurus bidang. Model peran berubah dari satu nilai jadi **daftar peran** (§5.3). |

### 0.1 Apa yang gugur karena Spark, dan penggantinya

| Rencana awal | Kenapa gugur | Gantinya (tetap gratis) |
|---|---|---|
| Firebase Cloud Storage untuk gambar | Wajib Blaze; tanpa Functions juga tidak ada resize | **ImageKit** (§4) |
| Extension "Resize Images" | Jalan di Cloud Functions | Transformasi on-the-fly ImageKit lewat query string |
| Cloud Function terjadwal untuk terbit otomatis | Butuh Blaze | **Evaluasi saat baca**: query `where('publishAt', '<=', now)`. Justru lebih sederhana — tidak ada cron yang bisa gagal diam-diam. |
| Cloud Function terjadwal untuk backup | Butuh Blaze | **GitHub Actions** (gratis) memanggil route handler ekspor |
| Cloud Function untuk set custom claims | Butuh Blaze | **Firebase Admin SDK di route handler Next.js** — lihat catatan penting di bawah |

> **Catatan penting yang sering disalahpahami:** Firebase **Admin SDK ≠ Cloud Functions**. Admin SDK adalah pustaka Node yang jalan di server *kita sendiri* (route handler Next.js di Vercel), bukan di infrastruktur Firebase. Admin SDK **tidak butuh Blaze**. Jadi custom claims, verifikasi ID token, dan endpoint upload bertanda tangan semuanya tetap bisa dikerjakan di paket Spark.

### 0.2 Kuota read jadi kendala nyata

Dengan Spark, batas **50.000 read/hari** berlaku. Sekarang situs publik membaca Firestore langsung di setiap render SSR (temuan P1), dan `/berita` bahkan `force-dynamic`. Satu kunjungan bisa menghabiskan puluhan read.

Artinya **caching (D6) naik dari "sebaiknya" jadi "wajib"**. Tanpa itu, situs bisa mati di tengah hari saat kuota habis — tepat di hari paling ramai, misalnya saat pengumuman penting terbit.

---

## 1. Ringkasan

Panel admin yang ada sekarang **tidak buruk**. Fondasinya justru cukup benar — terutama Firestore Rules-nya. Yang bermasalah adalah: separuh model data tidak punya UI, strategi gambar terbelah dua dan saling bertentangan, tidak ada test untuk satu-satunya lapisan keamanan yang benar-benar menjaga data, dan ada satu ketidaksinkronan yang bisa membuat halaman publik kosong begitu data dipindah ke Firestore.

Jadi rencananya **bukan tulis ulang dari nol**. Rules dan pola fallback data yang sudah ada layak dipertahankan. Yang perlu dikerjakan adalah menutup lubang, menyelesaikan yang setengah jadi, dan membuang yang mati.

---

## 2. Hasil audit

### 2.1 Yang sudah benar — jangan dibongkar

| Hal | Bukti | Kenapa layak dipertahankan |
|---|---|---|
| Firestore Rules berbasis peran | `firestore.rules` | Default-deny di akhir, pemisahan `superadmin`/`editor`/`viewer`, validasi field ketat untuk aspirasi publik (panjang pesan, mode anonim, `internalNotes` wajib kosong), dan penjagaan integritas `createdAt` lewat `keepsCreatedAt()`. Ini pekerjaan yang benar. |
| Fallback ke data lokal | `src/lib/organization-data.ts:70` | Kalau Firebase belum dikonfigurasi atau tidak ada divisi aktif, situs jatuh ke `src/data/*.ts`. Artinya situs **tidak pernah kosong** karena Firestore mati atau belum diisi. Pola ini harus dipertahankan dan diperluas. |
| `fieldOverrides` di indeks | `firestore.indexes.json` | `articles.content`, `announcements.body`, `aspirations.message`, `aspirations.internalNotes` dikeluarkan dari indeks. Ini keputusan yang tepat — teks panjang yang diindeks membengkakkan biaya penyimpanan tanpa guna. |
| Converter + helper timestamp | `src/lib/firebase/firestore.ts` | Satu tempat untuk `createdAt`/`updatedAt`, konsisten dengan yang divalidasi rules. |
| Unit test validasi | `src/lib/admin/*.test.ts` | Aspirasi, form konten, media, dan organization-crud sudah punya test. |
| NIM tidak pernah masuk tipe publik | `src/types/content.ts:73` | Hasil sesi 2026-07-25. Ada regression guard di `src/data/leaders.test.ts`. |

### 2.2 Lubang keamanan & operasional

| # | Temuan | Lokasi | Dampak |
|---|---|---|---|
| **K1** | **Tidak ada `storage.rules`**, dan `firebase.json` tidak mendaftarkan storage sama sekali | `firebase.json` | Bucket Storage berjalan dengan aturan default dari Console — tidak masuk version control, tidak pernah di-review, tidak bisa di-deploy ulang. Kalau default-nya masih "any signed-in user", siapa pun yang bisa login Firebase bisa menulis ke bucket. |
| **K2** | **Tidak ada App Check** | — | Form aspirasi publik menulis langsung ke Firestore dari browser. Tanpa App Check, siapa pun bisa membanjiri collection `aspirations` dengan skrip. Sudah dicatat di `FIREBASE_SETUP.md §11` tapi belum dikerjakan. |
| **K3** | Rules memanggil `get()` berulang untuk cek peran | `firestore.rules` fungsi `hasRole()` | `isEditor()` → `hasRole()` → `hasActiveAdminProfile()` yang memanggil `exists()` + `get()` tiga kali, lalu satu `get()` lagi. Firestore membatasi **10 akses dokumen per evaluasi** dan setiap akses **dihitung sebagai read berbayar**. Boros dan rapuh. |
| **K4** | Otorisasi hanya di sisi klien | `src/components/admin/AdminAuthGuard.tsx` | Tidak ada middleware, tidak ada session cookie. Halaman admin tetap dikirim ke siapa pun; yang benar-benar menjaga data hanya Firestore Rules. Ini **sah** untuk pola SPA Firebase — tapi konsekuensinya rules jadi satu-satunya benteng, dan sekarang rules **tidak punya satu pun test**. |
| **K5** | Rules tidak memvalidasi bentuk field untuk konten | `firestore.rules` | Untuk `articles`, `leaders`, `programs`, dll. yang dicek hanya `status` dan timestamp. Editor bisa menulis field apa pun dengan tipe apa pun. Risikonya rendah (editor memang dipercaya) tapi satu typo di kode bisa merusak dokumen tanpa penolakan. |

### 2.3 Lubang fungsional

| # | Temuan | Lokasi | Dampak |
|---|---|---|---|
| **F1 — BLOCKER** | **`programs.months` hilang saat lewat Firestore** | `src/types/firestore.ts` (`ProgramDocument` tanpa `months`) + `src/lib/organization-data.ts:128` (mapping tidak menyalinnya) | Halaman `/agenda` yang baru **sepenuhnya bergantung** pada `months: number[]`. Begitu program dipindah ke Firestore, peta dua belas bulan jadi kosong total. **Ini akibat langsung rework agenda 2026-07-25 — harus dibereskan sebelum migrasi data apa pun.** |
| **F2** | **`/admin/events` menyunting data yang tidak dipakai halaman publik** | `src/app/admin/(protected)/events/` | Setelah rework hari ini, `/agenda` membaca `programs`, bukan `events`. Menu "Agenda" di panel kini mengelola collection yang tidak muncul di mana pun. **Juga akibat perubahan hari ini.** |
| **F3** | **`divisions`, `programs`, `partners` tidak punya UI admin sama sekali** | `src/data/admin-nav.ts` | Collection, tipe, dan rules-nya sudah ada, dan situs publik membacanya. Tapi separuh data organisasi hanya bisa diubah lewat Firebase Console — tidak bisa diserahkan ke pengurus non-teknis. |
| **F4** | Dua strategi gambar yang bertentangan | `src/lib/firebase/storage.ts` vs `AdminGalleryManager.tsx` | `storage.ts` (`uploadImageToStorage`, `deleteImageFromStorage`) **tidak dipanggil di mana pun** — kode mati. Yang benar-benar jalan: galeri minta pengurus **paste URL ImageKit manual** (`validateGalleryImageUrl`). Harus dipilih satu. |
| **F5** | `date` bertipe string, bukan Timestamp | `EventDocument.date`, `AnnouncementDocument.date` | Tidak bisa diurutkan atau difilter "yang akan datang". `"Februari"` dan `"Maret, Juni, September"` tidak bisa dibandingkan. |
| **F6** | `/admin/settings` masih placeholder kosong | `src/app/admin/(protected)/settings/page.tsx` | Teks footer, kontak, sosial media, nama kabinet — semuanya masih hardcode di `src/data/site-content.ts`. |
| **F7** | Tidak ada UI kelola admin user | — | Menambah pengurus baru harus buat dokumen `adminUsers/{uid}` manual di Console. Untuk organisasi yang gantian kepengurusan tiap tahun, ini tidak berkelanjutan. |
| **F8** | Tidak ada jejak audit | — | Kalau ada berita terhapus atau data pengurus berubah, tidak ada catatan siapa dan kapan. Untuk panel yang dipakai bergantian belasan orang, ini penting. |
| **F9** | `reactStrictMode: false` | `next.config.ts:16` | Biasanya dimatikan untuk menutupi bug double-render, bukan karena memang tidak dibutuhkan. Perlu dinyalakan lagi dan bug aslinya diperbaiki. |

### 2.4 Biaya & performa

| # | Temuan | Dampak |
|---|---|---|
| **P1** | Situs publik memakai **Firebase Web SDK dari Server Component** | Setiap render SSR = read Firestore langsung, tanpa cache lintas-request. `/berita` bahkan `force-dynamic`. Satu kunjungan bisa jadi puluhan read. Kuota gratis Firestore 50.000 read/hari akan terkuras jauh lebih cepat dari perkiraan. |
| **P2** | Tidak ada revalidasi on-demand | Tidak ada mekanisme "publish di panel → halaman publik ikut berubah" selain menunggu request berikutnya. |

---

## 3. Keputusan arsitektur yang perlu diambil

Enam keputusan ini menentukan bentuk pekerjaan berikutnya. Rekomendasiku ada di tiap poin, tapi keputusan akhir di tangan kamu.

### D1 — Peran admin: dokumen Firestore atau custom claims?

- **Sekarang:** peran disimpan di `adminUsers/{uid}`, dibaca ulang oleh rules lewat `get()` setiap operasi (temuan K3).
- **Alternatif:** simpan peran di **custom claims** token Firebase Auth. Rules cukup baca `request.auth.token.role` — **nol read, nol biaya, tidak kena batas 10 akses**.
- **Biayanya:** custom claims hanya bisa di-set dari server → butuh Firebase Admin SDK (lihat D2). Perubahan peran juga baru berlaku setelah token di-refresh (maksimal 1 jam, atau paksa refresh).
- **Rekomendasi:** **pindah ke custom claims**, tetap simpan dokumen `adminUsers` sebagai sumber data yang bisa dibaca UI (nama, email, status aktif). Claims untuk otorisasi, dokumen untuk tampilan.

### D2 — Tambah Firebase Admin SDK? → **SUDAH DIPUTUSKAN: ya**

- `FIREBASE_SETUP.md §5` sekarang menyarankan **jangan** menambah Admin SDK sampai ada kebutuhan server. Kebutuhan itu sekarang sudah ada, minimal lima:
  1. Set custom claims (D1)
  2. `verifyIdToken()` untuk mengamankan route handler kita sendiri
  3. Endpoint upload ImageKit bertanda tangan (§4)
  4. Revalidasi on-demand yang aman (P2)
  5. Script seed/migrasi data lokal → Firestore
- **Tidak butuh Blaze** — lihat catatan di §0.1. Ini yang membuat seluruh rencana tetap jalan di Spark.
- Service account key masuk env server (`FIREBASE_SERVICE_ACCOUNT_JSON`), **tanpa** prefix `NEXT_PUBLIC_`. Perbarui `FIREBASE_SETUP.md §5` yang sekarang justru melarangnya.

### D3 — Otorisasi halaman admin: tetap klien saja, atau tambah middleware?

- **Sekarang:** klien saja (K4). Shell admin dikirim ke siapa pun, data dijaga rules.
- **Rekomendasi:** **tetap klien, tapi wajibkan test rules.** Menambah session cookie + middleware menggandakan kompleksitas auth tanpa menambah keamanan data yang berarti — karena rules tetap benteng terakhir. Yang benar-benar kurang bukan middleware, tapi **test**. Pakai `@firebase/rules-unit-testing` + Firebase Emulator, dan jadikan test rules bagian dari `npm test`.

### D4 — `events` vs `programs`

Ini menyelesaikan F2. Dua model ini sebenarnya **bukan duplikat** — keduanya punya guna berbeda:

| | `programs` | `events` |
|---|---|---|
| Artinya | Rencana kerja tahunan per bidang | Kejadian nyata bertanggal |
| Waktu | `months: number[]` (bulan rencana) | `startAt: Timestamp` (tanggal pasti) |
| Sumber | Buku Panduan | Diisi pengurus sepanjang tahun |
| Tampil di | Peta tahun `/agenda` | Daftar "Agenda terdekat" |

**KEPUTUSAN: pertahankan keduanya.** Reeyza menyerahkan pilihannya, jadi ini alasanku.

Sempat kupertimbangkan menghapus `events` supaya panel lebih sederhana untuk 15+ pemakai non-teknis — dan itu argumen yang serius. Tapi ada satu hal yang menentukan: **peta tahun tidak bisa menjawab pertanyaan yang paling sering ditanyakan mahasiswa.** `programs` hanya bisa berkata *"Februari"*. Yang orang butuhkan adalah *"Rapat Anggota, 14 Februari 2027, 15.30, Ruang Sidang SV"*. Menghapus `events` berarti situs himpunan tidak pernah bisa menjawab "kapan tepatnya?".

Keberatan terbesar terhadap `events` adalah risiko basi — kegiatan tiga bulan lalu masih nangkring di halaman depan, dan itu lebih buruk daripada tidak ada bagian agenda sama sekali. Tapi itu bisa **diselesaikan lewat query, bukan lewat disiplin manusia**: `where('startAt', '>=', now)`. Kegiatan lewat hilang sendiri tanpa ada yang perlu ingat menghapusnya. Kalau tidak ada kegiatan mendatang, bagian itu **menyembunyikan diri**, bukan menampilkan kotak kosong.

Dengan risiko basi hilang, tinggal manfaatnya. Jadi dipertahankan, dengan perubahan berikut:

- `date: string` → **`startAt: Timestamp`** + `endAt?: Timestamp` (F5)
- tambah `programId?: string` — menautkan kejadian ke rencana induknya
- tambah `divisionCode` — untuk pembatasan lingkup (§5.3)
- `/agenda` menampilkan **peta dua belas bulan** (dari `programs`) **+ "Agenda terdekat"** (dari `events`, maksimal 6, otomatis tersaring)
- menu panel: "Agenda" → **"Kegiatan Bertanggal"**, plus menu baru **"Program Kerja"**

### D7 — Identitas login → **SUDAH DIPUTUSKAN: opsi A, email + password** *(2026-07-26)*

> "iya tolong pake email"

Login pakai **email asli + password**. `username` tetap disimpan di profil sebagai handle byline dan nama tampilan panel, tapi **bukan kredensial**. Konsekuensi yang menguntungkan: reset password mandiri lewat email bawaan Firebase, collection `usernames` **tidak jadi dibuat**, dan halaman login tidak perlu langkah lookup.

Catatan pelaksanaan: `username` tetap harus unik untuk byline — validasi keunikannya di halaman kelola user (Fase 2), bukan di rules, karena tanpa collection `usernames` rules tidak punya cara memeriksanya.

Riwayat pertimbangan (disimpan supaya keputusan ini tidak diulang dari nol):

> "yang login ke admin itu username + pw"

Ada satu kendala teknis yang harus kusampaikan sekarang: **Firebase Auth tidak mengenal username.** Yang tersedia hanya email+password, nomor telepon, penyedia OAuth, dan anonim. Tidak ada primitif "username". Jadi ini harus dipilih sadar:

**Opsi A — Email + password, "username" hanya nama tampilan.** *(rekomendasiku — dipilih)*
Kredensial login pakai email asli. `username` tetap ada sebagai handle untuk byline berita dan tampilan panel.
- Firebase mengirim **email reset password sendiri** — pengurus yang lupa password bisa pulih tanpa merepotkan siapa pun.
- Nol kode tambahan.

**Opsi B — Username sungguhan, dipetakan ke email sintetis.**
Pemakai mengetik username; aplikasi membaca `usernames/{username}` untuk mendapat email tersembunyi (`budi@admin.hmte.internal`), lalu login seperti biasa. Rules: `allow get: if true; allow list: if false;` — jadi orang bisa memverifikasi satu username tapi tidak bisa mengunduh daftar semuanya.
- **Harga yang dibayar: tidak ada reset password mandiri.** Setiap orang lupa password, salah satu dari dua superadmin harus turun tangan manual.

**Opsi C — Custom token, password disimpan sendiri.** **Tidak kusarankan.** Artinya kita yang bertanggung jawab atas hashing dan penyimpanan password. Untuk organisasi mahasiswa tanpa tim keamanan, itu risiko yang tidak sepadan dengan kenyamanan mengetik username.

**Kenapa aku menyarankan A:** dengan 15+ orang yang berganti tiap tahun, **seseorang pasti lupa password** — dan itu akan sering. Di opsi B, setiap kejadian itu jadi pekerjaan manual superadmin. Situs himpunan yang admin-nya terkunci sampai developernya sempat membalas WhatsApp bukan situs yang bisa diandalkan.

Kalau kamu tetap ingin username, ambil **B tapi tetap wajibkan email pemulihan** disimpan di profil, supaya reset masih mungkin dilakukan.

### D5 — Strategi gambar → **SUDAH DIPUTUSKAN: ImageKit**

Spark menutup Firebase Storage, jadi pilihannya mengecil jadi satu yang masuk akal. Lihat §4.

### D6 — Caching halaman publik → **WAJIB, bukan opsional**

Dengan kuota Spark 50.000 read/hari (§0.2), ini bukan lagi optimasi.

- **Rekomendasi:** ganti pembacaan langsung dengan ISR. Bungkus fetch data dalam `unstable_cache` bertag (`articles`, `organization`, `gallery`, …), pasang `revalidate` wajar (misal 300 detik), lalu panel memanggil route handler `/api/revalidate` yang menjalankan `revalidateTag()` setiap kali ada publish. Hasilnya: pembaca tidak menyentuh Firestore sama sekali, tapi perubahan tetap muncul dalam hitungan detik.
- Hapus `export const dynamic = 'force-dynamic'` dari `src/app/berita/page.tsx`.

---

## 4. Strategi gambar

### 4.1 Koreksi premis

> "pakai gdrive untuk gambar untuk menghemat space di firestore"

**Firestore tidak pernah menyimpan gambar, dan memang tidak bisa.** Batasnya 1 MiB per dokumen, dan biayanya dihitung dari jumlah read/write plus byte teks — bukan dari file. Implementasi sekarang sudah benar: yang masuk Firestore hanya **URL + metadata**, sekitar 200 byte per gambar. Seribu foto galeri ≈ 200 KB di Firestore. Itu bukan masalah, dan tidak akan pernah jadi masalah.

Jadi yang sebenarnya perlu diputuskan bukan "bagaimana menghemat Firestore", tapi **"di mana file gambarnya disimpan dan disajikan"** — itu produk yang sama sekali berbeda, dengan biaya **bandwidth**, bukan biaya database.

Pertanyaan yang benar: **siapa yang menyajikan foto ke browser mahasiswa, dan berapa ongkosnya?**

### 4.2 Kenapa Google Drive bukan tempat menyajikan gambar

Aku tidak menyarankan Drive sebagai penyaji gambar, dan alasannya konkret:

- **Tidak ada endpoint gambar langsung yang resmi.** Trik `drive.google.com/uc?export=view&id=` dan `lh3.googleusercontent.com/d/<id>` tidak pernah didokumentasikan Google sebagai API publik, dan sudah beberapa kali diubah atau diblokir. Situs yang bergantung padanya rusak tanpa peringatan.
- **Drive melakukan throttling pada file yang ramai.** Justru foto yang paling sering dilihat yang paling cepat kena. Saat acara besar dan situs ramai, galeri berpotensi balas 403.
- **Tidak ada resize, WebP, atau kontrol cache.** `next/image` harus dipakai dengan `unoptimized`. Artinya foto 4 MB langsung dari kamera dikirim utuh ke HP mahasiswa. Ini justru **jauh lebih mahal** daripada masalah yang mau dihemat.
- **Izin berbagi rapuh.** Satu salah klik di folder bisa membuat semua foto 404 sekaligus — atau sebaliknya, membocorkan isi folder yang tidak dimaksudkan publik.
- **Kuota Drive menyatu dengan akun Google**, termasuk Gmail. Galeri yang penuh bisa membuat email pengurus berhenti masuk.

### 4.3 Keputusan: ImageKit menyajikan, Drive mengarsipkan

**Drive tetap dipakai — tapi untuk perannya yang benar.**

| Lapisan | Alat | Isinya |
|---|---|---|
| **Etalase** (dibaca browser) | **ImageKit** | Versi web yang sudah dioptimalkan |
| **Gudang** (dibaca manusia) | **Google Drive** | Master resolusi penuh, mentahan dokumentasi |
| **Katalog** | **Firestore** | URL + metadata + tautan balik ke Drive |

Kenapa ImageKit:

- **Sudah setengah terpasang.** `ik.imagekit.io` ada di `next.config.ts` remotePatterns **dan** di `validateGalleryImageUrl`. Pekerjaan yang tersisa paling sedikit.
- Free tier **20 GB bandwidth + 20 GB storage per bulan** — jauh di atas kebutuhan situs himpunan.
- CDN sungguhan, dengan **transformasi on-the-fly**: `?tr=w-800,q-80,f-webp` mengubah foto 4 MB jadi 80 KB tanpa menyentuh file aslinya.
- Punya API upload bertanda tangan, jadi pengurus bisa upload **dari panel**, bukan paste URL manual seperti sekarang.

Kenapa Drive tetap masuk: pengurus Kominfo **memang sudah terbiasa** menyimpan dokumentasi di Drive, dan master resolusi penuh memang perlu disimpan di suatu tempat yang tidak dibayar per-GB. Registry media menyimpan `archiveUrl` yang menunjuk ke file Drive-nya, jadi jejaknya tidak putus.

### 4.4 Kalau tetap mau Drive-only

Bisa, dan aku akan kerjakan kalau kamu memutuskan begitu — tapi ini konsekuensinya:

- Wajib lewat proxy sendiri: route handler `/api/image/[fileId]` yang mengambil file dari Drive pakai service account, lalu men-cache di edge dengan `Cache-Control` panjang. Tanpa proxy, throttling dan link rusak jadi masalah rutin.
- Tetap **tidak ada resize**. Harus ditambah `sharp` di server untuk mengecilkan gambar saat proxy — artinya menulis ulang sebagian ImageKit dengan tangan.
- Total kerjanya **lebih besar** daripada memakai ImageKit, dan hasilnya lebih lambat.

### 4.5 Kenapa Firebase Storage gugur

Ini sempat jadi kandidat karena integrasinya paling rapi — rules-nya sekeluarga dengan Firestore. Tapi paket **Spark** menutup dua pintu sekaligus:

- Proyek yang dibuat setelah sekitar Oktober 2024 **mewajibkan Blaze** untuk Cloud Storage.
- Meski Storage bisa dipakai, ia **tidak punya transformasi gambar bawaan**. Extension "Resize Images" jalan di Cloud Functions — juga wajib Blaze. Artinya foto akan disajikan pada ukuran aslinya, yaitu masalah yang justru mau kita hindari.

**Konsekuensi konkret:** Firebase Storage tidak dipakai sama sekali. Maka `src/lib/firebase/storage.ts` dan `getFirebaseStorage()` **dihapus**, bukan diperbaiki. Ini sekaligus menyelesaikan K1 dan F4 — tidak ada bucket yang perlu dijaga kalau tidak ada bucket yang dipakai, dan tidak ada dua strategi gambar yang bertentangan kalau yang mati sudah dibuang.

Cek juga apakah `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` masih perlu diwajibkan di `hasFirebaseConfig()` (`src/lib/firebase/client.ts`) — kalau Storage tidak dipakai, syarat itu bisa dilepas.

### 4.6 Menyiapkan ImageKit → **AKUN SUDAH ADA (2026-07-26)**

Akun terdaftar, ID **`jk001122`**, endpoint `https://ik.imagekit.io/jk001122`.

| Langkah | Status |
|---|---|
| 1. Daftar akun Free | ✅ selesai |
| 2. Ambil endpoint + public key + private key | ✅ selesai |
| 3. `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` & `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` di `.env.local` | ✅ ditambahkan |
| 3b. `IMAGEKIT_PRIVATE_KEY` di `.env.local` (server saja, **tanpa** prefix `NEXT_PUBLIC_`) | ✅ diisi Reeyza sendiri |
| 4. `next.config.ts` remotePatterns dibatasi ke `pathname: '/jk001122/**'` | ✅ selesai |
| 5. Struktur folder `/berita`, `/galeri`, `/divisi`, `/pengurus` di dashboard ImageKit | ⬜ belum |
| 6. Salin ketiga env ke dashboard Vercel (Production/Preview/Development) saat deploy | ⬜ belum |

Sisa pekerjaan ImageKit ada di **Fase 1 item 10** (route handler `/api/imagekit/auth` + collection `media`), yang bergantung pada Admin SDK (item 6) — jadi tetap dikerjakan setelah Fase 0, bukan sekarang.

**Alur upload dari panel** (semuanya jalan di Spark):

```
Panel  ──1── POST /api/imagekit/auth   (kirim Firebase ID token)
                    │
                    ├─ Admin SDK verifyIdToken() → pastikan admin aktif
                    └─ tanda tangani {token, expire, signature} dengan private key
                    │
Panel  ──2── upload langsung ke ImageKit pakai tanda tangan tadi
Panel  ──3── simpan {url, width, height, alt, ...} ke collection `media`
```

File tidak pernah melewati server kita — hanya tanda tangannya. Jadi tidak ada batas ukuran body serverless yang perlu dikhawatirkan.

### 4.7 Yang tetap harus dikerjakan

1. Naikkan `media-validation.ts` dari pemeriksaan byte jadi pemeriksaan **dimensi**. Foto 5 MB yang lolos hari ini tetap merusak performa; yang benar-benar penting adalah lebar piksel.
2. **Wajibkan `alt` diisi manual** sebelum gambar bisa disimpan. Sekarang `alt` disalin otomatis dari `title` di `AdminGalleryManager`, dan itu menghasilkan alt text yang buruk — judul foto dan deskripsi foto adalah dua hal berbeda.
3. Sediakan preset transformasi terpusat (mis. `IMAGEKIT_PRESETS.card`, `.hero`, `.thumb`) supaya ukuran tidak ditulis manual berserakan di komponen.

---

## 5. Apa saja yang masuk database

### 5.1 Collection yang sudah ada — perlu diperbaiki

| Collection | Perubahan yang diperlukan |
|---|---|
| `programs` | **Tambah `months: number[]`** (F1, blocker). Tambah `slug` supaya URL stabil saat nama diubah. |
| `events` | `date: string` → **`startAt: Timestamp`** + `endAt?: Timestamp` (F5). Tambah `programId?: string` (D4), `divisionCode?`. |
| `announcements` | `date: string` → **`publishAt: Timestamp`**. Tambah `pinned: boolean`, `expiresAt?: Timestamp` (pengumuman kedaluwarsa hilang sendiri). |
| `articles` | **Tambah `authorUid` — wajib, bukan opsional.** Seluruh pembatasan peran `penulis` (§5.3) bergantung padanya. Tambah juga `authorName`, `tags: string[]`, `coverMediaId`. Ganti `readTime: string` jadi hitungan otomatis dari jumlah kata. |
| `gallery` | Ganti `imageUrl` jadi `mediaId` yang menunjuk registry media. Tambah `eventId?`, `takenAt?`. Wajibkan `alt` tidak kosong. |
| `leaders` | **Jangan pernah tambah `studentId`/NIM** — lihat `src/types/content.ts:73`. Tambah `period: string` (mis. `"2026/2027"`) supaya pengurus periode lama bisa diarsipkan, bukan dihapus. |
| `divisions` | Tambah `visual` (mediaId untuk foto bidang), `backdropVariant` untuk latar hero. |
| `partners` | Tambah `logoMediaId`, `tier`. |
| `aspirations` | Sudah baik. Tambah `assignedTo?: uid` dan `resolvedAt?: Timestamp`. |
| `adminUsers` | `role: AdminRole` → **`roles: AdminRole[]`** (§5.3). Tambah `divisionCode?`, `username`, `lastLoginAt`. |
| `usernames` *(baru, hanya kalau D7 opsi B dipilih)* | `usernames/{username}` → `{ uid, email }`. Rules: `allow get: if true; allow list: if false;` |
| `settings` | Definisikan isinya — sekarang masih kosong (§5.2). |

### 5.2 Collection baru

**`media`** — registry gambar terpusat. Ini kuncinya supaya gambar bisa dipakai ulang lintas berita/galeri/bidang, dan supaya file yatim bisa ditemukan.

```
media/{mediaId}
  provider     'imagekit' | 'firebase' | 'external'
  url          string        // URL siap saji
  archiveUrl   string?       // tautan master di Google Drive
  path         string?       // path di provider, untuk penghapusan
  alt          string        // WAJIB, tidak boleh kosong
  credit       string?       // fotografer
  width        number
  height       number
  bytes        number
  mimeType     string
  uploadedBy   uid
  createdAt    Timestamp
```

**`auditLog`** — jejak perubahan (F8). Panel dipakai bergantian belasan orang dan kepengurusan berganti tiap tahun.

```
auditLog/{logId}
  actorUid      string
  actorEmail    string
  action        'create' | 'update' | 'delete' | 'publish' | 'unpublish'
  collection    string
  documentId    string
  documentTitle string        // disalin, supaya tetap terbaca setelah dokumen dihapus
  changedKeys   string[]      // nama field saja, BUKAN isinya
  createdAt     Timestamp
```

> Catatan privasi: `auditLog` menyimpan **nama field yang berubah**, bukan isi sebelum/sesudah. Menyimpan isi lama berarti aspirasi yang sudah dihapus tetap hidup di log — justru melanggar ekspektasi pengirimnya.

**`settings/site`** — dokumen tunggal (F6), memindahkan yang sekarang hardcode di `src/data/site-content.ts`:

```
settings/site
  cabinetName      'Abya Vistara'
  period           '2026/2027'
  contactEmail, instagram, website
  footerColumns[]
  addressLines[]
  heroTagline
  featureFlags     { aspirationsOpen: bool, galleryEnabled: bool }
```

### 5.3 Model peran — **wajib, dan berubah bentuk**

Sekarang: satu field `role` bernilai `superadmin` / `editor` / `viewer`. Dua hal membuat ini tidak cukup lagi:

1. **Satu orang bisa punya lebih dari satu peran.** Perwakilan IPTEK bisa sekaligus penulis berita *dan* pengelola program kerja bidangnya. Satu nilai enum tidak bisa menampung itu.
2. **Lingkup dan kemampuan adalah dua sumbu berbeda.** "Boleh menulis berita" dan "boleh mengurus bidang IPTEK" bukan tingkatan pada tangga yang sama.

**Rancangan: daftar peran + satu lingkup bidang.**

```
adminUsers/{uid}
  roles         AdminRole[]        // bisa lebih dari satu
  divisionCode  DivisionCode?      // lingkup, bukan peran
  active        boolean
  username      string             // handle untuk byline
  ...
```

| Peran | Boleh |
|---|---|
| `superadmin` | Semuanya + kelola user + settings. **2 orang**: satu developer, satu manajerial PH. |
| `redaktur` | Menerbitkan dan menyunting **semua** berita, pengumuman, galeri. Pintu redaksi — **Kominfo + PH** (diputuskan 2026-07-26). |
| `penulis` | Menulis dan menyunting **draf miliknya sendiri**. Tidak bisa menerbitkan. Tidak bisa menyentuh draf orang lain. **Semua divisi dapat peran ini.** |
| `pengurus_bidang` | Mengelola `programs`, `events`, `leaders` **bidangnya sendiri** (ditentukan `divisionCode`). Semua divisi dapat peran ini. |
| `viewer` | Baca saja. |

**Sebaran peran yang disepakati (2026-07-26):**

- **Setiap divisi** dapat perwakilan dengan `['penulis', 'pengurus_bidang']` + `divisionCode` masing-masing. Semua divisi punya kepentingan di situs, jadi tidak ada divisi yang cuma jadi penonton.
- **Kominfo dan PH** naik ke `redaktur` — merekalah pintu terbit.
- Contoh: perwakilan KOMINFO dapat `['redaktur', 'pengurus_bidang']` + `divisionCode: 'KOMINFO'`. Perwakilan IPTEK dapat `['penulis', 'pengurus_bidang']` + `divisionCode: 'IPTEK'`.

**Kenapa pintu terbit tetap dipisah walau semua divisi boleh menulis.** Semua orang boleh menulis draf; yang membedakan hanya siapa yang menekan tombol terbit. Tanpa pemisahan ini, sembilan orang bisa menerbitkan langsung ke halaman depan tanpa satu pun mata kedua — dan artikel yang sudah terbit bisa disunting diam-diam. Pemisahan ini bukan soal kepercayaan, tapi soal ada tidaknya jejak dan proses.

**Dua aturan yang paling penting**, dan keduanya ditegakkan di rules — bukan sekadar disembunyikan di UI:

```
function roles()   { return request.auth.token.roles; }        // custom claims, 0 read
function div()     { return request.auth.token.divisionCode; }
function has(r)    { return r in roles(); }

// 1. Penulis hanya boleh menyentuh drafnya sendiri.
match /articles/{id} {
  allow create: if has('redaktur')
    || (has('penulis')
        && request.resource.data.status == 'draft'
        && request.resource.data.authorUid == request.auth.uid);

  allow update: if has('redaktur')
    || (has('penulis')
        && resource.data.authorUid == request.auth.uid
        && resource.data.status != 'published'
        && request.resource.data.status != 'published'
        && request.resource.data.authorUid == resource.data.authorUid);
}

// 2. Pengurus bidang hanya boleh menyentuh bidangnya sendiri.
match /programs/{id} {
  allow update: if has('superadmin')
    || (has('pengurus_bidang') && div() == resource.data.divisionCode);
}
```

Tiga detail di aturan artikel yang gampang terlewat, dan ketiganya penting:

- **`resource.data.status != 'published'`** — tanpa ini, penulis masih bisa *menyunting* artikel yang sudah terbit, cuma tidak bisa mengubah statusnya. Menyunting artikel terbit tanpa sepengetahuan redaksi sama berbahayanya dengan menerbitkannya.
- **`resource.data.authorUid == request.auth.uid`** — dengan belasan penulis, tanpa ini penulis A bisa mengubah draf penulis B.
- **`request.resource.data.authorUid == resource.data.authorUid`** — mencegah penulis mengalihkan kepemilikan draf ke dirinya sendiri, atau melemparnya ke orang lain.

**Catatan teknis custom claims:** batasnya 1000 byte. Array 2–3 nama peran pendek plus satu kode divisi jauh di bawah itu, aman. Tapi ingat perubahan peran **baru berlaku setelah token di-refresh** (maksimal 1 jam). Halaman kelola user harus memberi tahu ini, dan idealnya memaksa refresh token setelah peran diubah.

**Pengaman UI** (pelengkap rules, bukan pengganti): dialog konfirmasi ketik-ulang-judul sebelum menghapus, dan menu bidang lain disembunyikan sejak awal supaya tidak pernah jadi godaan.

**Rotasi kepengurusan.** Karena pemakainya berganti tiap tahun, halaman kelola admin (F7) wajib punya tombol **nonaktifkan**, bukan hapus. `active: false` menutup akses tanpa memutus jejak `auditLog` dan tanpa merusak `authorUid` di artikel lama — nama penulis di berita lama harus tetap terbaca meski orangnya sudah lulus.

**Soal dua superadmin.** Pastikan keduanya benar-benar bisa saling memulihkan akses. Skenario yang harus dihindari: superadmin developer lulus dan menghilang, sementara superadmin PH tidak pernah sekalipun membuka halaman kelola user. Masukkan ini ke serah-terima kepengurusan.

### 5.4 Yang **tidak** boleh masuk database

- **File gambar** — sudah dijelaskan di §4.1.
- **NIM / nomor mahasiswa** — sudah dicabut sampai ke akar pada 2026-07-25. Jangan dikembalikan.
- **Isi lama dokumen di audit log** — lihat catatan di §5.2.
- **Data yang tidak pernah berubah** (logo, ikon, teks legal) — biarkan di `src/data/*.ts` dan `/public`. Memindahkannya ke Firestore hanya menambah read tanpa manfaat.

---

## 6. Rencana bertahap

### Fase 0 — Perbaiki yang rusak *(blocker, kerjakan lebih dulu)* — **DIKERJAKAN 2026-07-26**

1. ✅ **Tambah `months` ke `ProgramDocument` + mapping** (F1). Tanpa ini, migrasi program ke Firestore mengosongkan `/agenda`. Ikut: `parseProgramMonths()`/`formatProgramMonths()` di `organization-crud.ts`, `normalizeProgramMonths()` di `organization-data.ts`, isian bulan di `AdminOrganizationManager`, dan lima test.
2. ✅ **Hapus** `src/lib/firebase/storage.ts` + `getFirebaseStorage()` (K1, F4). Ikut: `storagePath` dilepas dari `GalleryDocument`, `storageBucket` dilepas dari `hasFirebaseConfig()`, dan `firebasestorage.googleapis.com` dilepas dari `remotePatterns`.
3. ⚠️ Pasang **Firebase Emulator** + `@firebase/rules-unit-testing`, tulis test rules untuk tiap collection dan tiap peran. Masukkan ke `npm test` (K4). — Konfigurasi dan 35 kasus tes sudah ditulis di `tests/rules/`, `npm test` sudah menjalankannya. **Belum pernah dijalankan** karena emulator butuh Java dan JDK belum terpasang di mesin developer.
4. ✅ Nyalakan lagi `reactStrictMode` (F9).
5. ✅ Hapus kode yatim: `src/data/events.ts` dan tipe `EventItem`. Tipe sudah hilang; berkas `events.ts` dikosongkan dan dilepas dari git, tapi file fisiknya masih terkunci watcher `next dev` — hapus dengan `del src\data\events.ts` setelah dev server mati.

### Fase 1 — Fondasi server & kuota

6. Tambah Firebase Admin SDK (D2), perbarui `FIREBASE_SETUP.md §5` yang sekarang justru melarangnya.
7. Migrasi `role` → **`roles[]`** + `divisionCode`, dipindahkan ke **custom claims** (D1, §5.3). Menyentuh `src/types/admin.ts`, `src/data/admin-nav.ts`, `AdminAuthGuard`, dan `firestore.rules` sekaligus — kerjakan sebagai satu perubahan utuh, jangan setengah-setengah.
8. **ISR + `revalidateTag`** (D6). Dinaikkan dari Fase 3 karena kuota Spark 50.000 read/hari (§0.2) membuat ini mendesak, bukan penyempurnaan.
9. Aktifkan App Check untuk form aspirasi publik (K2).
10. Setup ImageKit + endpoint `/api/imagekit/auth` + collection `media` (§4.6, §5.2).
11. Script seed idempoten: `src/data/*.ts` → Firestore. **Wajib bisa dijalankan berulang tanpa menggandakan data.**

### Fase 2 — Pembatasan lingkup & melengkapi panel

12. **Editor per-bidang** (§5.3) — rules + UI. Dinaikkan dari Fase 4: dengan 9 pemakai, ini pengaman, bukan penyempurnaan. Harus ada **sebelum** panel dibagikan ke perwakilan divisi.
13. **Kelola admin user** (F7): undang lewat email, atur peran + bidang, nonaktifkan. Tanpa ini, menambah 9 orang berarti 9 kali buat dokumen manual di Console.
14. CRUD **Program Kerja** (F3) — termasuk pemilih bulan visual 12 kotak, sejalan dengan peta tahun `/agenda`.
15. CRUD **Divisi** dan **Partner** (F3).
16. **Media Library** — grid, cari, pakai ulang, deteksi file yatim.
17. Isi halaman **Settings** (F6).
18. Ganti nama menu "Agenda" → "Kegiatan Bertanggal", perjelas pemisahan dari Program Kerja (D4, F2).

### Fase 3 — Alur terbit

19. Pratinjau draf lewat tautan bertanda tangan, tanpa harus publish.
20. Terbit terjadwal — **tanpa cron**: query `where('publishAt', '<=', now)` saat baca (§0.1). Perlu indeks komposit baru.
21. `/agenda` menampilkan peta tahun **plus** daftar kegiatan bertanggal terdekat (D4).
22. Antrean redaksi: daftar draf dari editor bidang yang menunggu ditinjau Kominfo.

### Fase 4 — Operasional

23. Penulisan `auditLog` + halaman pembacanya (F8).
24. Ekspor/backup ke JSON, dijalankan **GitHub Actions** (§0.1), bukan Cloud Function.

---

## 7. Urutan kerja

**Fase 0 adalah prasyarat mutlak** — terutama poin 1 dan 3. Poin 1 karena migrasi data tanpa itu akan mengosongkan halaman `/agenda` yang baru selesai dibangun. Poin 3 karena dengan D3 diputuskan "otorisasi tetap di klien", rules menjadi **satu-satunya** yang menjaga data — dan sesuatu yang menjaga data sendirian tidak boleh tanpa test.

**Fase 1 poin 8 (ISR) sebaiknya tidak ditunda.** Selama situs masih membaca Firestore di setiap render, kuota Spark 50.000 read/hari terus terkuras oleh traffic publik, dan itu bisa menghabiskan kuota tepat di hari paling ramai.

**Fase 2 poin 12 dan 13 adalah gerbang sebelum panel dibagikan.** Jangan berikan akses ke 9 perwakilan divisi sebelum pembatasan lingkup terpasang — sekali data rusak karena salah klik, memulihkannya jauh lebih mahal daripada membangun pembatasnya lebih dulu.

Sisanya bisa jalan paralel, kecuali poin 10 (ImageKit) yang memblokir poin 16 (media library).

---

## 8. Status keputusan

**Sudah terkunci (2026-07-25 & 2026-07-26):**

| | |
|---|---|
| Paket Firebase | **Spark** — Functions & Storage gugur (§0) |
| Hosting gambar | **ImageKit**, akun `jk001122` sudah aktif & env terpasang (§4.6) |
| Firebase Storage | **Tidak dipakai**, `storage.ts` dihapus (§4.5) |
| Admin SDK | **Ya** — tidak butuh Blaze (D2) |
| Peran | **`roles[]` + `divisionCode`**, via custom claims (§5.3) |
| Superadmin | **2 orang** — developer + manajerial PH |
| `events` | **Dipertahankan**, dipertegas jadi kejadian bertanggal (D4) |
| Caching | **Wajib**, dinaikkan ke Fase 1 (D6) |
| Login | **Email + password** (D7 opsi A). `usernames` batal dibuat |
| Deploy | **Vercel**, database tetap Firebase |
| `redaktur` | **Kominfo + PH**. Semua divisi dapat `penulis` + `pengurus_bidang` (§5.3) |

### 8.1 Konsekuensi keputusan deploy Vercel

- Kredensial Admin SDK dipasang sebagai **environment variable di dashboard Vercel**, bukan file JSON di repo. Simpan seluruh isi service account sebagai satu string di `FIREBASE_SERVICE_ACCOUNT_JSON`, lalu `JSON.parse()` saat inisialisasi. **Jangan pernah** pakai prefix `NEXT_PUBLIC_`.
- Pasang env untuk **ketiga environment** Vercel (Production, Preview, Development) atau login admin akan gagal khusus di preview deployment — gejala yang membingungkan kalau tidak disiapkan sejak awal.
- `revalidateTag()` bekerja penuh di Vercel, jadi rencana D6 jalan apa adanya tanpa penyesuaian.
- Tambahkan domain Vercel ke **Firebase Auth → Authorized domains**, kalau tidak login akan ditolak dari domain produksi.
- Jangan pakai `output: 'export'`; route handler `/api/imagekit/auth` dan `/api/revalidate` butuh server runtime.

**Tidak ada lagi keputusan yang menggantung.** Semua pertanyaan §8 terjawab per 2026-07-26 — rencana siap dieksekusi mulai Fase 0.

Sisa pekerjaan setup (bukan keputusan, tinggal dikerjakan):

- Buat struktur folder di dashboard ImageKit (§4.6 langkah 5).
- Salin env ImageKit + service account Firebase ke dashboard Vercel saat deploy (§8.1).

---

## 9. Rujukan

- `firestore.rules` — rules yang berlaku sekarang
- `FIREBASE_SETUP.md` — panduan setup (§5 perlu diperbarui setelah D2 diputuskan)
- `src/types/firestore.ts` — model dokumen saat ini
- `src/lib/organization-data.ts` — penggabungan data lokal + Firestore, dan pola fallback
- `docs/KEBUTUHAN_GAMBAR_HMTE.md` — kebutuhan aset gambar
