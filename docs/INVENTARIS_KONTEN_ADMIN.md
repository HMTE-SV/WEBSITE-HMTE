# Inventaris Konten untuk Panel Admin HMTE

> Status: audit working tree per 1 Agustus 2026.
> Cakupan: seluruh halaman publik, konten global, gambar, metadata, dan kebutuhan riwayat perubahan.
> Tujuan: menjadi acuan saat memperluas panel admin agar pengurus dapat mengubah isi website tanpa menyunting kode.

## 1. Cara membaca dokumen

Status yang dipakai:

| Status | Arti |
|---|---|
| **Sudah ada** | Sudah mempunyai UI di panel admin dan tersimpan di Firestore/ImageKit. |
| **Sebagian** | Sebagian field sudah dikelola panel, tetapi masih ada isi terkait yang tertanam di kode atau alurnya belum lengkap. |
| **Belum ada** | Masih berupa konstanta/file statis dan perlu dipindahkan ke model konten panel. |
| **Otomatis** | Diturunkan dari data lain dan tidak perlu diketik manual. |
| **Tetap di kode** | Menyangkut perilaku, keamanan, route, atau tata letak; bukan konten editorial biasa. |

Prinsip pemisahan:

- Panel mengelola **isi**: teks, gambar, tautan, urutan, status tampil, identitas kabinet, dan metadata SEO.
- Kode mengelola **perilaku**: layout, animasi, breakpoint, rumus jadwal, sanitasi HTML, hak akses, validasi, dan route handler.
- Pengurus boleh mengubah label dan memilih tujuan navigasi yang sudah tersedia. Pembuatan route baru tetap memerlukan perubahan kode.
- Semua gambar yang dikelola panel harus menyimpan URL, `fileId`, teks alternatif, keterangan, ukuran, dan kredit/izin publikasi. File disajikan melalui ImageKit, bukan disimpan sebagai blob di Firestore.

## 2. Ringkasan kondisi saat ini

### Sudah tersedia di panel

| Modul | Isi yang sudah dapat diubah |
|---|---|
| Pengaturan situs | Identitas lembaga/kabinet, kanal resmi, navigasi, tombol header, footer, dan SEO global dengan alur draft/terbit. |
| Halaman situs | Copy, SEO, urutan section, visibilitas, dan slot gambar Beranda/Kontak dengan alur draft/terbit/restore. |
| Berita | Judul, slug, kategori, ringkasan, isi rich text, sampul, status draft/published/archived. |
| Pengumuman | Judul, ringkasan, isi, tanggal berlaku, status. |
| Galeri | Tambah/edit/hapus item, gambar, judul, alt, caption, urutan, dan status draft/published/archived. |
| Kepengurusan | Nama, jabatan, bidang, foto, angkatan, bio, Instagram, LinkedIn, email internal, urutan, status aktif. |
| Divisi | Kode, nama, nama pendek, deskripsi, urutan, status aktif. |
| Program kerja | Nama, bidang, deskripsi singkat, pola, bulan rencana, tanggal pasti, label tanggal, ringkasan, tujuan, tahapan, sumber/tautan, penanggung jawab, sorotan, urutan, status aktif. |
| Aspirasi | Melihat kiriman, mengubah status penanganan, dan catatan internal. |

### Kekurangan utama untuk target "semua konten bisa diubah"

1. Editor halaman reusable sudah tersedia untuk Beranda dan Kontak; halaman publik lain masih perlu didaftarkan bertahap.
2. Media library dan slot gambar global sudah tersedia. Seluruh slot yang terdaftar sudah dikonsumsi halaman publik dengan fallback aman.
3. Metadata SEO Beranda dan Kontak sudah mengikuti versi terbit; halaman lain masih statis atau otomatis dari record.
5. Galeri sudah mendukung edit item lama, tombol naik/turun, dan lifecycle status. Kredit, tanggal kegiatan, relasi divisi/program, serta pratinjau responsif masih perlu ditambahkan.
6. Sebagian copy halaman masih menyebut identitas/periode secara statis dan perlu dipindahkan saat editor halaman terkait dibuat. Header, footer, CTA Instagram, dan halaman kontak sudah memakai pengaturan global.
7. Riwayat revisi dan pemulihan snapshot sudah tersedia di `/admin/history` untuk collection publik yang diaudit.

## 3. Konten global yang muncul di banyak halaman

| Area | Field panel yang diperlukan | Status sekarang | Muncul di |
|---|---|---|---|
| Identitas lembaga | `siteName`, `organizationName`, `programName`, `facultyName`, `universityName` | Sudah ada; konsumsi halaman dilakukan bertahap | Metadata, header, footer, hero, halaman kontak. |
| Identitas kabinet | `cabinetName`, `periodLabel`, `agendaYear`, `tagline`, `closingCheer` | Sudah ada; konsumsi halaman dilakukan bertahap | Beranda, kepengurusan, agenda, pengumuman, galeri, kontak, profil pengurus, program. |
| Logo utama HMTE | Gambar dan alt | Sudah ada melalui slot `brand.logo.primary`; varian terang/gelap belum ada | Header semua halaman, footer, hero, admin, fallback kartu pengurus. |
| Logo kabinet | Gambar, alt, nama kredit, status aktif | Sudah ada melalui slot `cabinet.logo` dan metadata media | Entry beranda, footer, kepengurusan, fallback profil pengurus. |
| Favicon | File SVG/PNG dan alt administratif | Sudah ada melalui slot `brand.favicon` | Tab browser dan ikon penerbit berita. |
| Navbar | Label, kelompok, urutan, tujuan, visibilitas | Sudah ada melalui tab Header | Semua halaman publik. |
| Tombol header | Label dan tujuan | Sudah ada melalui tab Header | Semua halaman publik. |
| Footer masthead | Catatan lembaga, logo yang tampil, alamat/konteks | Sudah ada; logo melalui slot media | Semua halaman publik. |
| Kolom footer | Judul kolom, label tautan, URL, urutan, buka tab baru, status aktif | Sudah ada melalui tab Footer | Semua halaman publik. |
| Kanal resmi | Instagram, email, website, LinkedIn, X | Sudah ada melalui tab Kanal resmi | Footer, CTA beranda, kontak. |
| SEO global | URL situs, nama situs, title default, description default, locale | Sudah ada melalui tab SEO | Seluruh metadata. |
| Kartu Open Graph | Judul, deskripsi, logo/gambar, URL tampilan | Sudah ada; teks/URL dari pengaturan dan gambar dari slot `seo.default-og` | Pratinjau tautan WhatsApp dan media sosial. |
| Teks 404 | Kicker, judul, penjelasan, dua tombol | Belum ada | Route yang tidak ditemukan. |

### Struktur panel global yang sudah diterapkan

- **Pengaturan > Identitas:** identitas lembaga dan kabinet.
- **Pengaturan > Kanal resmi:** Instagram, email, website, LinkedIn, dan X.
- **Pengaturan > Header:** tombol, label, urutan, submenu, dan visibilitas menu.
- **Pengaturan > Footer:** masthead, kolom tautan, sumber URL kanal, tab baru, dan visibilitas.
- **Pengaturan > SEO:** URL, nama, judul, deskripsi, dan locale global.
- **Media > Penempatan situs:** logo HMTE, logo kabinet, favicon, dan gambar Open Graph.

Perubahan pada `/admin/settings` disimpan terlebih dahulu ke `siteSettingsDrafts/site`. Tombol **Terbitkan ke website** menulis versi publik ke `settings/site` secara atomik dan kedua dokumen tercatat di riwayat revisi. Draft tidak dapat dibaca pengunjung.

## 4. Inventaris per halaman

### 4.1 Beranda — `/`

Beranda adalah halaman dengan jumlah konten statis dan gambar hardcode paling banyak.

Status implementasi: editor tersedia di `/admin/pages/home`. Copy, metadata SEO, urutan/visibilitas section, dan 17 slot gambar tersimpan sebagai draft lalu diterbitkan ke `pageContents/home`. Layout, animasi, route, serta perhitungan data tetap di kode.

| Bagian | Field yang harus dapat diubah | Gambar | Status sekarang |
|---|---|---|---|
| Layar pilihan masuk | Status situs, periode, eyebrow, judul, deskripsi, dua pilihan masuk, teks bantuan keyboard, teks konfirmasi | Logo HMTE dan logo kabinet | Sudah ada |
| Hero scroll | Nama lembaga, konteks, tagline, label CTA, tujuan CTA | Daftar 6 foto, alt, urutan, fokus/crop | Sudah ada; perilaku scroll tetap di kode |
| Tentang HMTE | Identitas kabinet, periode, konteks, kicker, dua baris judul, paragraf pembuka | Slot foto per bab dan alt | Sudah ada |
| Bab "Siapa kami" | Label, judul, isi | Dapat memakai slot foto bab | Sudah ada |
| Bab "Visi" | Label, judul, isi | Dapat memakai slot foto bab | Sudah ada |
| Bab "Misi" | Label, judul, isi | Dapat memakai slot foto bab | Sudah ada |
| Penutup Tentang | Baris penutup dan caption kabinet | Foto penutup bila digunakan | Sudah ada |
| Ruang kabar | Kicker, judul kondisi terisi/kosong, lead kondisi terisi/kosong, label tombol, empty-state copy | Sampul berasal dari berita | Sudah ada |
| Isi ruang kabar | Artikel, kategori, sampul, penerbit, tanggal | Sampul artikel | Sudah ada melalui modul Berita |
| Struktur kabinet | Judul, judul redup, lead, label tombol | Visual mengikuti divisi/pengurus | Sudah ada |
| Isi struktur kabinet | Divisi, pengurus, dan program yang aktif | Foto pengurus | Sudah ada melalui modul Organisasi |
| Dinding dokumentasi | Kicker, judul, penjelasan, quote, label statistik, tombol | 6 foto, alt, caption, urutan, crop | Sudah ada |
| CTA penutup | Tiga fragmen judul, isi, label kanal, nilai kanal, dua tombol dan tujuannya | Tidak ada saat ini | Sudah ada |

Catatan penting:

- Enam file kegiatan/kabinet saat ini dipakai ulang pada hero, Tentang HMTE, dinding dokumentasi, kontak, dan visual divisi. Panel harus memakai **slot media bernama**, bukan mengganti satu URL global tanpa tahu dampaknya.
- Data `partnersIntro` dan `partnerTiles` masih ada di `src/data/site-content.ts`, tetapi komponen `Partners` tidak dirender oleh beranda saat ini. Tandai sebagai **konten dorman**, bukan bagian halaman aktif.

### 4.2 Berita — `/berita`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Title dan description halaman | Belum ada |
| Hero | Overline, judul dua gaya, paragraf pembuka | Belum ada |
| Label statistik | Artikel, Kanal, Arsip | Belum ada; angkanya otomatis |
| Petunjuk scroll | Label dan tujuan anchor | Belum ada |
| Sorotan | Nomor bagian, judul, deskripsi, label "Baca artikel" | Belum ada; artikel terpilih otomatis dari urutan feed |
| Feed | Judul, filter/kategori, empty state, label navigasi/paginasi | Sebagian |
| Kategori berita | Key stabil, label publik, urutan, status aktif | Belum ada; masih konfigurasi kode |
| Empty/error state | Judul dan isi untuk arsip kosong atau Firestore gagal | Belum ada |

Field artikel yang harus tersedia:

- judul;
- slug/URL;
- kategori;
- ringkasan;
- isi rich text;
- sampul, alt, fokus/crop, dan kredit;
- penerbit/byline;
- status draft, published, archived;
- waktu terbit;
- tanggal pembaruan;
- program/divisi terkait bila diperlukan;
- SEO title, SEO description, dan gambar sosial opsional.

Status: field inti sudah ada. `publisher` belum mempunyai input panel, waktu baca sebaiknya tetap dihitung otomatis, dan SEO khusus artikel belum tersedia.

### 4.3 Detail berita — `/berita/[slug]`

| Bagian | Sumber/field | Status sekarang |
|---|---|---|
| Metadata dan Open Graph | Judul, ringkasan, sampul artikel | Sebagian otomatis |
| Hero artikel | Kategori, judul, ringkasan, penerbit, tanggal, waktu baca | Sebagian |
| Media utama | Sampul, alt, caption/kredit | Sampul sudah ada; caption masih otomatis |
| Isi | Rich text artikel | Sudah ada |
| Catatan redaksi | Label dan isi | Belum ada; statis |
| Artikel terkait | Aturan jumlah, judul bagian, label tautan | Data otomatis; copy statis |

Jangan jadikan label antarmuka seperti "Penerbit", "Terbit", dan "Waktu baca" sebagai field per artikel. Simpan sebagai copy template halaman atau kamus antarmuka global.

### 4.4 Pengumuman — `/pengumuman`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Title dan description | Belum ada |
| Hero | Kicker, judul, lead | Belum ada |
| Ringkasan papan | Label tiga statistik dan periode | Sebagian; angka otomatis, periode masih hardcode |
| Bagian aktif | Judul dan penjelasan | Belum ada |
| Bagian arsip | Judul dan penjelasan | Belum ada |
| Empty/error state | Seluruh copy kondisi kosong/gagal | Belum ada |
| CTA aspirasi | Judul, isi, label tombol, tujuan | Belum ada |
| Item pengumuman | Judul, ringkasan, isi lengkap, tanggal berlaku, prioritas, status | Sudah ada |

Aturan aktif/arsip berdasarkan tanggal, zona waktu, dan urutan harus tetap di kode. Panel hanya mengubah data pengumumannya.

### 4.5 Agenda — `/agenda`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Title dan description | Belum ada; nama kabinet masih hardcode |
| Hero | Eyebrow/periode, judul, catatan cara membaca | Sebagian; tahun dari settings, copy lain statis |
| Label statistik | Program terjadwal, bertanggal pasti, bulan terpadat | Belum ada; nilai otomatis |
| Papan agenda | Nama program, deskripsi, bidang, bulan, tanggal, pola, status aktif | Sudah ada melalui Program Kerja |
| Empty state | Judul dan isi | Belum ada |
| Program belum terjadwal | Judul dan penjelasan | Belum ada; jumlah/daftar otomatis |

Tidak ada gambar konten pada halaman agenda saat ini. Rumus bulan terpadat, pemilahan jadwal, dan posisi visual harus tetap di kode.

### 4.6 Galeri — `/galeri`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Title dan description | Belum ada |
| Hero | Kicker, judul, lead, label jumlah sorotan | Belum ada; jumlah otomatis |
| Header arsip | Periode, judul, deskripsi urutan | Belum ada |
| Item galeri | Gambar, judul, alt, caption, kredit, urutan, status | Edit, gambar, judul, alt, caption, urutan, dan status sudah ada; kredit belum ada |
| Empty/error state | Judul dan isi | Belum ada |

Perbaikan wajib pada modul Galeri:

- ~~edit item lama, bukan hanya tambah/hapus;~~ selesai;
- ~~drag-and-drop atau tombol naik/turun untuk `order`;~~ tombol naik/turun tersedia;
- ~~draft/published/archived;~~ selesai;
- simpan kredit, tanggal kegiatan, divisi/program terkait, dan status izin publikasi;
- hapus file ImageKit secara sadar atau tandai file yatim;
- pratinjau desktop/mobile sebelum terbit.

### 4.7 Kepengurusan — `/kepengurusan`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Title dan description | Belum ada |
| Hero | Label kabinet/periode, judul, lead, label statistik | Sebagian; angka otomatis |
| Logo kabinet | Gambar dan alt | Belum ada |
| Papan bidang | Judul, penjelasan, label jumlah ruang | Belum ada; isi divisi sudah dinamis |
| Kartu bidang | Nama, nama pendek, deskripsi, urutan, visual bidang | Sebagian; visual belum dapat diedit |
| Direktori | Nama, jabatan, angkatan, bidang, urutan, status aktif | Sudah ada |
| Pencarian/filter | Placeholder, empty state, label tombol | Belum ada |

Jumlah unsur, anggota, dan program selalu dihitung otomatis dari record aktif.

### 4.8 Indeks divisi — `/divisi`

Route ini hanya melakukan redirect permanen ke `/kepengurusan`. Tidak ada konten yang perlu dikelola panel. Target redirect tetap di kode karena termasuk arsitektur route.

### 4.9 Detail divisi — `/divisi/[slug]`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Dibentuk dari nama dan deskripsi divisi | Otomatis |
| Hero | Nama, nama pendek, deskripsi, nomor/urutan | Sudah ada |
| Visual hero | Gambar latar per divisi, alt/dekoratif, fokus/crop | Belum ada |
| Statistik | Anggota, program, jumlah berkala | Otomatis |
| Daftar anggota | Data pengurus aktif bidang | Sudah ada |
| Daftar program | Data program aktif bidang | Sudah ada |
| Copy template | Label kembali, judul panel, label tombol | Belum ada |

Tambahkan field media pada divisi: `heroImage`, `heroImageAlt`, `heroImagePosition`, dan kredit/izin. Saat ini delapan visual divisi dipetakan langsung ke enam foto statis.

### 4.10 Profil pengurus — `/pengurus/[slug]`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Nama, jabatan, bidang | Otomatis |
| Profil | Nama, jabatan, bidang, angkatan, bio | Sudah ada |
| Potret | Foto, alt yang diturunkan dari nama, fokus/crop | Sebagian; foto sudah ada, crop belum ada |
| Sosial publik | Instagram dan LinkedIn | Sudah tersimpan; pastikan benar-benar dirender jika dikehendaki |
| Fallback bio | Template kalimat dan periode | Belum ada; masih hardcode |
| Fallback foto | Logo kabinet dan inisial | Logo belum dapat diedit |
| Rekan/program terkait | Diturunkan dari bidang | Otomatis |
| Copy template | Judul bagian dan label navigasi | Belum ada |

Email pengurus tetap bersifat internal dan tidak boleh masuk payload halaman publik. NIM tidak boleh menjadi field publik.

### 4.11 Program kerja — `/program-kerja`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Title dan description | Belum ada; jumlah program masih hardcode di description |
| Papan tahun | Eyebrow kabinet/periode, judul, intro, label statistik | Sebagian; data/tahun dinamis, copy statis |
| Katalog | Judul, lead, placeholder pencarian, label filter/status/view, empty state | Belum ada |
| Isi program | Seluruh record program aktif | Sudah ada |
| Sorotan | Flag `featured` | Sudah ada |

### 4.12 Detail program — `/program-kerja/[slug]`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Nama dan deskripsi singkat | Otomatis |
| Hero | Nama, deskripsi, bidang, status sorotan | Sudah ada |
| Jadwal | Bulan rencana, tanggal mulai/selesai, label manual, pola | Sudah ada |
| Narasi | Ringkasan panjang dan tujuan | Sudah ada |
| Tahapan | Judul, waktu, keterangan, urutan | Sudah ada |
| Penanggung jawab | Pilihan pengurus bidang | Sudah ada |
| Berkas/tautan | Label, URL, catatan, urutan | Sudah ada |
| Program terkait | Diturunkan dari bidang | Otomatis |
| Empty state/copy template | Rincian menyusul, judul panel, catatan jadwal | Belum ada |

Tidak ada gambar khusus program pada desain aktif. Jangan menambah field sampul sebelum ada tempat tampil dan kebutuhan editorial yang jelas.

### 4.13 Aspirasi — `/aspirasi`

| Bagian | Field yang harus dapat diubah | Status sekarang |
|---|---|---|
| Metadata | Title dan description | Belum ada |
| Hero | Kicker, judul, lead | Belum ada |
| Panduan | Daftar langkah, urutan, teks | Belum ada |
| Pengantar form | Label, judul, isi, catatan kanal lain | Belum ada |
| Kategori aspirasi | Label kategori, urutan, status aktif | Belum ada; masih konfigurasi kode |
| Label/help form | Label field, placeholder, bantuan, pesan berhasil/gagal | Belum ada |
| Kiriman pengguna | Kategori, isi, identitas/anonim | Sudah masuk Firestore |
| Penanganan internal | Status dan catatan internal | Sudah ada di admin |

Validasi minimum, mode anonim, pembatasan data pribadi, dan aturan keamanan tetap di kode/rules. Admin boleh mengubah copy penjelas, tetapi tidak boleh melemahkan validasinya lewat CMS.

### 4.14 Kontak — `/kontak`

Status implementasi: editor tersedia di `/admin/pages/contact`. Seluruh copy yang terlihat, metadata SEO, urutan/visibilitas tiga section, dan slot `contact.featured` mengikuti draft/versi terbit. Identitas organisasi serta URL kanal tetap diturunkan dari Pengaturan global agar tidak diduplikasi.

| Bagian | Field yang harus dapat diubah | Gambar | Status sekarang |
|---|---|---|---|
| Metadata | Title dan description | — | Sudah ada |
| Hero | Eyebrow kabinet, judul, lead, petunjuk scroll | — | Sudah ada |
| Kartu pos | Catatan, penerima, konteks lembaga, periode, cap/label | Elemen grafis di kode | Sudah ada |
| Pengantar kanal | Eyebrow, judul, lead | — | Sudah ada |
| Kanal Instagram/X | Label jenis, judul, isi, URL, CTA | Foto kegiatan, alt, crop | Sudah ada; URL/handle dari Pengaturan global |
| Kanal aspirasi | Label, judul, isi, tujuan, CTA | — | Sudah ada |
| Kanal website/LinkedIn | Label, judul, isi, URL, akun, CTA | — | Sudah ada; URL dari Pengaturan global |
| Penutup P.S. | Judul dan isi | — | Sudah ada |

Halaman ini harus membaca semua identitas kabinet dan kanal dari Settings/Channels. Jangan menyimpan `Abya Vistara`, `2026/2027`, dan `@hmteugm` untuk kedua kalinya di dokumen halaman kontak.

### 4.15 Halaman tidak ditemukan — `404`

Field: kode tampilan, kicker, judul, penjelasan, label/tujuan tombol utama, dan label/tujuan tombol sekunder. Status: belum ada.

### 4.16 Route nonkonten

| Route | Keputusan |
|---|---|
| `/lab/backdrop` | Alat pengembangan visual. Jangan masukkan ke CMS publik. |
| `/admin/*` | Antarmuka kerja, bukan konten publik. Copy kritis seperti peringatan keamanan tetap di kode. |
| `/api/*` | Endpoint sistem. Tidak dikelola panel. |
| `/sitemap.xml` | Dibentuk otomatis dari route dan data yang published. |
| `/robots.txt` | Kebijakan teknis; tetap di kode. |

## 5. Daftar slot gambar yang perlu dibuat

Gunakan ID slot yang stabil agar satu gambar dapat diganti tanpa menyunting komponen.

| Slot | Jumlah | Pemakaian |
|---|---:|---|
| `brand.logo.primary` | 1–2 varian | Header, footer, hero, fallback. |
| `brand.favicon` | 1 | Browser dan ikon penerbit. |
| `cabinet.logo` | 1 | Entry, footer, kepengurusan, fallback profil. |
| `home.hero.1`–`home.hero.6` | 6 | Hero scroll dan wallpaper. |
| `home.about.1`–`home.about.5` | 5 | Bab Tentang HMTE. |
| `home.moment.1`–`home.moment.6` | 6 | Dinding dokumentasi beserta caption. |
| `contact.featured` | 1 | Kartu kanal Instagram pada halaman kontak. |
| `division.{code}.hero` | 1 per divisi | Hero detail divisi dan kartu bidang. |
| `article.{id}.cover` | 0–1 per artikel | Daftar dan detail berita. |
| `leader.{id}.portrait` | 0–1 per pengurus | Direktori dan profil. |
| `gallery.{id}.image` | 1 per item | Halaman galeri. |
| `seo.defaultOgImage` | 1 | Pratinjau tautan global. |

Setiap slot minimal menyimpan:

```text
url
fileId
alt
caption
credit
consentStatus
focalPointX
focalPointY
width
height
updatedAt
updatedBy
```

Catatan: gambar yang hanya dekoratif boleh memiliki alt kosong, tetapi status dekoratif harus eksplisit. Gambar informatif wajib memiliki alt.

## 6. Model konten halaman yang direkomendasikan

Jangan membuat satu collection berbeda untuk setiap potongan teks. Gunakan dokumen halaman per locale/route dengan section yang bernama dan tervalidasi.

```text
siteSettings/site
navigation/header
navigation/footer
pages/home
pages/news-index
pages/announcements-index
pages/agenda
pages/gallery
pages/leadership
pages/programs-index
pages/aspirations
pages/contact
pages/not-found
seo/defaults
media/{mediaId}
```

Contoh prinsip bentuk dokumen:

```json
{
  "route": "/kontak",
  "status": "published",
  "seo": {
    "title": "Kontak HMTE TRE SV UGM",
    "description": "Kanal resmi HMTE..."
  },
  "sections": {
    "hero": {
      "eyebrow": "Kanal resmi",
      "title": "Apa kabar? Ceritakan.",
      "lead": "..."
    },
    "channels": []
  },
  "updatedAt": "server timestamp",
  "updatedBy": "uid"
}
```

Gunakan skema khusus per halaman di TypeScript/validator. Jangan menerima objek `sections` bebas tanpa daftar field karena typo dapat merusak halaman tanpa ditolak Firestore Rules.

## 7. Prioritas implementasi

### P0 — fondasi aman

1. Riwayat revisi dan audit actor untuk setiap create/update/delete/publish.
2. Media library dengan ImageKit `fileId`, metadata, pemakaian slot, dan pemeriksaan file yatim.
3. Draft, preview, publish, archive, dan restore yang seragam untuk semua konten.
4. Validasi schema per jenis dokumen dan pembatasan hak editor per bidang.

### P1 — hilangkan hardcode yang cepat basi

1. Sambungkan semua penyebutan kabinet/periode/kanal ke `settings/site`.
2. Tambahkan logo kabinet, foto beranda, foto kontak, dan visual divisi ke media slots.
3. Lengkapi header/footer dan kanal resmi.
4. Buat editor `/`, `/kontak`, serta SEO global.

### P2 — seluruh halaman indeks

1. Editor copy `/berita`, `/pengumuman`, `/agenda`, `/galeri`, `/kepengurusan`, dan `/program-kerja`.
2. Editor copy `/aspirasi`, kategori aspirasi, dan 404.
3. Lengkapi metadata lanjutan Galeri: kredit, tanggal kegiatan, relasi divisi/program, izin publikasi, dan preview.

### P3 — penyempurnaan editorial

1. Template copy untuk detail berita, divisi, pengurus, dan program.
2. SEO override per halaman/artikel.
3. Pratinjau responsif dan pemeriksaan tautan/alt sebelum publish.

## 8. Riwayat perubahan dan rollback dengan Git

### Fakta teknis

Git hanya dapat me-rollback data yang benar-benar pernah masuk ke repository. Saat ini penyimpanan panel menuju Firestore dan gambar menuju ImageKit. Menekan "Simpan" di panel **tidak otomatis membuat commit Git**, sehingga `git revert` tidak akan mengembalikan dokumen Firestore atau file ImageKit.

### Rekomendasi terkuat

Gunakan dua lapis pemulihan:

1. **Revisi cepat di aplikasi** — sebelum update/delete, simpan snapshot `before` dan `after` ke `contentRevisions` beserta `entityType`, `entityId`, `action`, `actorUid`, `actorEmail`, `timestamp`, dan `changeId`. Tombol "Pulihkan versi ini" bekerja langsung dari panel.
2. **Backup Git terjadwal** — GitHub Actions mengekspor seluruh collection publik menjadi JSON stabil ke repository privat, lalu membuat commit harian atau setiap ada batch perubahan. Simpan juga manifest ImageKit berisi URL, `fileId`, checksum, dan metadata; jangan commit binary gambar besar.

Mengapa tidak commit Git setiap klik simpan:

- satu sesi edit dapat menghasilkan banyak commit kecil dan sulit dibaca;
- dua admin yang menyimpan hampir bersamaan dapat menimbulkan konflik;
- kredensial GitHub tidak perlu berada di browser;
- kegagalan GitHub tidak boleh membuat penyimpanan editorial ikut gagal;
- rollback satu field lebih cepat dari revision store dibanding memulihkan seluruh ekspor repository.

### Bentuk backup yang disarankan

```text
content-backup/
  settings/site.json
  pages/home.json
  pages/contact.json
  articles/{id}.json
  announcements/{id}.json
  gallery/{id}.json
  divisions/{id}.json
  leaders/{id}.json
  programs/{id}.json
  media/manifest.json
  backup-manifest.json
```

Syarat agar diff Git bersih:

- urutkan dokumen berdasarkan ID;
- urutkan key JSON secara konsisten;
- ubah Firestore Timestamp menjadi ISO 8601;
- jangan masukkan token, email privat, isi aspirasi, atau kredensial;
- simpan repository backup sebagai private;
- restore harus melalui script tervalidasi dan membuat dry-run sebelum menulis Firestore.

### Tombol yang perlu tersedia di panel

- Simpan draft;
- Pratinjau;
- Terbitkan;
- Arsipkan;
- Lihat riwayat;
- Bandingkan versi;
- Pulihkan versi;
- Ekspor backup sekarang (superadmin);
- Unduh JSON satu item.

## 9. Konten yang tidak boleh ikut backup publik

- email internal pengurus;
- UID dan data akun admin;
- isi serta identitas pengirim aspirasi;
- catatan internal aspirasi;
- token Firebase, ImageKit private key, service account, atau secret revalidasi;
- log keamanan dan data pribadi lain.

Data tersebut memerlukan backup privat terpisah dengan akses lebih ketat dan kebijakan retensi yang jelas.

## 10. Checklist selesai untuk panel admin lengkap

- [ ] Seluruh route publik pada Bagian 4 mempunyai editor copy atau alasan eksplisit untuk tetap di kode.
- [ ] Tidak ada lagi nama kabinet, periode, dan kanal resmi aktif yang ditulis ulang di halaman.
- [ ] Semua gambar publik dapat ditemukan dari media library dan diketahui halaman pemakainya.
- [ ] Setiap gambar informatif mempunyai alt dan status izin publikasi.
- [ ] Header, footer, metadata, dan kartu Open Graph dapat diperbarui tanpa deploy kode.
- [x] Galeri dapat diedit dan diurutkan, bukan hanya ditambah/dihapus.
- [ ] Semua entitas mempunyai draft/publish/archive dan preview.
- [ ] Setiap perubahan mencatat pelaku, waktu, nilai lama, dan nilai baru.
- [ ] Restore satu versi telah diuji tanpa mengubah entitas lain.
- [ ] Ekspor Git terjadwal dan restore dry-run telah diuji.
- [ ] Backup tidak mengandung secret, aspirasi, atau data pribadi.
- [ ] Revalidasi mencakup halaman indeks dan seluruh route dinamis yang terdampak.

## 11. Sumber kode yang diaudit

- `src/app/**/page.tsx`, `layout.tsx`, `not-found.tsx`, dan `opengraph-image.tsx`;
- `src/components/site/*`;
- `src/data/site-content.ts`, `articles.ts`, `divisions.ts`, `programs.ts`, dan data organisasi terkait;
- `src/components/admin/*` dan `src/data/admin-nav.ts`;
- `src/types/content.ts` dan `src/types/firestore.ts`;
- pembaca Firestore untuk artikel, pengumuman, galeri, organisasi, dan settings;
- aset di `public/assets` serta referensi gambar yang dipakai komponen.
