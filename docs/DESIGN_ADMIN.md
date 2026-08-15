# Sistem Desain Panel Admin HMTE

**Register:** product (desain MELAYANI tugas) · **Tema:** Control Room terang · **Disusun:** 14 Agustus 2026

Dokumen ini mengikat. Setiap halaman admin dibangun dari kosakata di sini, bukan
dari pola yang kebetulan sudah ada di berkas tetangga. Kalau sebuah kebutuhan
tidak tercakup, tambahkan ke dokumen ini dulu, baru pakai — jangan mengarang
komponen sekali pakai.

---

## 1. Untuk siapa ini dibangun

> Seorang pengurus mahasiswa membuka panel ini jam 11 malam setelah kuliah, atau
> di sela dua kelas dari laptop pinjaman. Ia lelah, buru-buru, dan takut merusak
> situs yang dilihat dosen. Ia datang untuk **menerbitkan satu hal**, lalu pergi.

Tiga pertanyaan yang harus terjawab dalam satu pandang, di halaman mana pun:

1. **Aku di mana?** — jejak lokasi, satu baris, selalu di tempat yang sama.
2. **Apa yang bisa kukerjakan di sini?** — satu tindakan utama, selalu di sudut
   yang sama.
3. **Tadi berhasil tidak?** — umpan balik eksplisit, tidak pernah senyap.

Kalau sebuah keputusan desain tidak membantu salah satu dari ketiganya, ia
dekorasi. Buang.

### Prinsip

1. **Penyuntingan harus terasa fokus dan selesai.** Menyunting satu item memakai
   **dialog terpusat** dengan judul, isi yang menggulir, dan tombol simpan yang
   selalu terlihat. Daftar tetap hadir sebagai konteks redup di belakangnya.
2. **Kosakata yang sama di semua layar.** Tombol simpan berbentuk sama di 13
   halaman. Chip status berbentuk sama. Baris daftar berbentuk sama. Kalau dua
   tempat berbeda, salah satunya salah.
3. **Kepadatan itu keramahan.** Pengurus mengelola 71 nama dan 37 program.
   Baris rapat yang terbaca mengalahkan kartu longgar yang memaksa menggulir.
4. **Tidak ada keadaan yang tak dirancang.** Kosong, memuat, galat, tanpa izin —
   keempatnya dirancang, bukan disisakan.
5. **Aman untuk dicoba.** Tindakan merusak selalu bisa dibatalkan atau
   dikonfirmasi. Pengurus yang takut mengklik tidak akan memakai panelnya.

---

## 2. Token

Ditulis sekali di `css/admin.css`, dilingkupi `.adm`. Jangan mengulang nilai
mentah di berkas lain; kalau butuh nilai baru, tambahkan tokennya di sini.

Warna merek yang sudah berjalan dipertahankan apa adanya — navy `#011f4b`,
gold `#F5B82E`. Yang dibangun di sini lapisan permukaan di atasnya.

```css
.adm {
  /* Permukaan — tiga tingkat, tidak lebih */
  --adm-canvas:      #f1f5fb;   /* latar area kerja */
  --adm-surface:     #ffffff;   /* kartu, baris, laci */
  --adm-sunken:      #f5f8fc;   /* isian input, bidang kosong */

  /* Rel navigasi */
  --adm-rail:        #ffffff;
  --adm-rail-deep:   #082653;
  --adm-rail-ink:    #173455;
  --adm-rail-muted:  #71839d;

  /* Teks — dua tingkat cukup, tiga sudah bikin ragu */
  --adm-ink:         #081b33;   /* ≥ 12:1 di atas surface */
  --adm-muted:       #61738f;   /* ≥ 4.5:1 di atas surface — JANGAN diterangkan */

  /* Garis */
  --adm-line:        #e3e0d9;
  --adm-line-strong: #cfcbc2;

  /* Aksi & status */
  --adm-accent:      #01356f;   /* aksi utama, pilihan aktif */
  --adm-accent-ink:  #ffffff;
  --adm-focus:       #2b6cb0;
  --adm-ok:          #1f6b45;
  --adm-warn:        #8a5a10;
  --adm-danger:      #a32c2c;

  /* Bentuk */
  --adm-r-sm: 6px;  --adm-r-md: 10px;  --adm-r-lg: 14px;

  /* Bayangan — dua saja */
  --adm-shadow-1: 0 1px 2px rgba(16, 35, 58, .06);
  --adm-shadow-2: 0 8px 24px rgba(16, 35, 58, .10);

  /* Lapis */
  --adm-z-sticky: 10; --adm-z-rail: 20; --adm-z-scrim: 30;
  --adm-z-drawer: 40; --adm-z-toast: 50;
}
```

**Kontras wajib diperiksa, bukan dikira-kira.** `--adm-muted` sudah dihitung
agar lolos 4.5:1 di atas `--adm-surface`. Jangan pernah menerangkannya "supaya
lebih halus" — teks abu terang di atas nyaris-putih adalah alasan nomor satu
antarmuka terasa sulit dibaca.

### Tipografi

Product register: **skala rem tetap, bukan `clamp()`**. Rasio 1.125–1.2.

| Peran | Ukuran | Bobot | Keluarga |
|---|---|---|---|
| Judul halaman | 1.375rem | 650 | `--font-display` |
| Judul seksi | 1.0625rem | 600 | `--font-display` |
| Badan / label | 0.875rem | 400–500 | `--font-body` |
| Sekunder | 0.8125rem | 400 | `--font-body` |
| Angka & kode | 0.8125rem | 500 | `--font-mono` |

`--font-mono` **hanya** untuk angka, hitungan, cap, dan id — aksen kecil, tidak
pernah untuk kalimat. Jangan pakai font display di label, tombol, atau data.

---

## 3. Anatomi kerangka

```
┌──────────┬────────────────────────────────────────────┐
│          │  jejak lokasi          [cari] [+ aksi] [👤] │  ← bar atas, 56px
│   REL    ├────────────────────────────────────────────┤
│  240px   │                                            │
│          │            AREA KERJA                      │
│  navy    │                                            │
│          │          ┌─────────────────┐      │
│          │          │ DIALOG EDITOR   │      │  ← terpusat
│  [user]  │          └─────────────────┘      │
└──────────┴───────────────────────────────────┴────────┘
```

### Rel (246px, bisa diciut ke 64px)

Dari atas ke bawah: kartu kabinet biru → kotak cari (`Ctrl K`) → kelompok menu
→ kartu pengguna yang menempel di dasar. Relnya putih; warna merek hidup pada
kartu kabinet, pilihan aktif, dan tindakan utama.

- Kelompok: **Workspace · Publikasi · Organisasi · Sistem** — sudah ada di
  `src/data/admin-nav.ts`, jangan diubah tanpa alasan.
- Setiap butir menu boleh membawa **hitungan** di sisi kanan (71 pengurus, 37
  program). Hitungan memakai `countContentDocuments()`, bukan mengunduh isi.
- Kelompok bisa dilipat. **Kelompok yang sedang dilipat tetap boleh dilipat walau
  memuat halaman aktif** — memaksanya terbuka membuat klik pengurus tidak
  menghasilkan apa-apa, dan tombol yang tidak menuruti klik selalu terbaca rusak.
  Tandai dengan titik pada judul kelompoknya.
- Lebar rel dan kelompok yang terlipat disimpan di `localStorage`. Keduanya
  kebiasaan, bukan data: yang menciutkan rel sekali berarti ia mau rel tercuit,
  bukan mau menciutkannya lagi di tiap halaman.

### Bar atas (56px, lengket)

Isinya **jejak lokasi satu baris** (`Control room / Berita`), lalu di kanan:
pencarian global, tombol aksi utama, dan chip pengguna.

**Tidak ada blok judul setinggi 168px.** Kerangka lama menaruh kicker + h1 +
deskripsi di puncak setiap halaman, sehingga yang pertama terlihat saat berpindah
menu adalah judul menu yang baru saja diklik — informasi yang sudah diketahui
pengurus. Pekerjaan dimulai lebih awal; judul hidup di jejak lokasi.

### Dialog editor terpusat

Penyuntingan record pendek terjadi di sini. Daftar tetap terlihat redup di
belakangnya, sementara dialog menjadi satu ruang kerja yang mudah dipindai.

- Buka: naik 12px dan memudar, 190ms, `ease-out-quart`. Latar gelap ber-blur halus.
- Tutup: Esc, klik latar, atau tombol tutup. Kalau ada perubahan belum tersimpan,
  **konfirmasi dulu** — jangan buang kerja orang tanpa bertanya.
- Fokus terperangkap di dalam laci selama terbuka; dikembalikan ke pemicunya saat
  tutup.
- Isi yang lebih panjang dari layar menggulir di dalam dialog; tombol simpan
  menempel di dasarnya, selalu terlihat.

Dialog konfirmasi merusak tetap lebih kecil dan hanya berisi keputusan yang
sedang diminta.

---

## 4. Kosakata komponen

Setiap komponen interaktif wajib punya tujuh keadaan: **default, hover, focus,
active, disabled, loading, error**. Mengirim setengahnya dianggap belum selesai.

| Komponen | Kelas | Catatan |
|---|---|---|
| Tombol utama | `.adm-btn` | navy pejal; satu per halaman |
| Tombol sekunder | `.adm-btn--ghost` | bergaris tipis |
| Tombol merusak | `.adm-btn--danger` | selalu minta konfirmasi |
| Baris daftar | `.adm-row` | tinggi 52px; bukan kartu |
| Chip status | `.adm-chip` | varian: draft / terbit / arsip / menyusul |
| Isian | `.adm-field` | label di atas, bantuan di bawah, galat menggantikan bantuan |
| Dialog editor | `.adm-editor-dialog` | lihat §3 |
| Bidang kosong | `.adm-empty` | lihat di bawah |
| Kerangka muat | `.adm-skeleton` | bukan spinner di tengah konten |
| Roti panggang | `.adm-toast` | sukses & galat, hilang sendiri 4 detik |

### Bidang kosong mengajari, bukan mengumumkan

Salah: "Belum ada data." Benar: satu kalimat apa yang akan muncul di sini, plus
tombol yang membuat yang pertama. Bidang kosong adalah tempat pengurus baru
belajar memakai panelnya.

### Fokus terlihat, selalu

`outline: 2px solid var(--adm-focus); outline-offset: 2px`. Jangan pernah
`outline: none` tanpa pengganti yang setara — panel ini dipakai dengan papan
ketik oleh orang yang buru-buru.

---

## 5. Gerak

150–250ms untuk hampir semua transisi. Pengguna sedang mengerjakan sesuatu;
jangan menyuruhnya menonton.

- Kurva: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). Tanpa pantulan.
- Gerak menyampaikan **keadaan**, bukan hiasan: dialog masuk, baris tersimpan
  berkedip sekali, roti panggang naik.
- **Tidak ada koreografi saat halaman dimuat.** Panel memuat ke dalam tugas.
- `@media (prefers-reduced-motion: reduce)` wajib untuk setiap animasi —
  biasanya jadi pudar-silang atau langsung.
- Jangan menganimasikan properti tata letak (`width`, `height`, `padding`).
  Pakai `transform`, `opacity`, atau `grid-template-rows`.

---

## 6. Larangan

Cocokkan-dan-tolak. Kalau kamu hendak menulis salah satu dari ini, tulis ulang
elemennya dengan struktur berbeda.

1. **Latar grid / mesh.** Ini keluhan eksplisit pemilik proyek. `.admin-dashboard`
   lama memakai garis 32px dan `.admin-sidebar::before` memakai mesh 28px.
   Keduanya dibuang, tidak diganti versi yang lebih halus. Latar adalah warna
   pejal.
2. **Garis aksen di satu sisi** (`border-left: 3px solid ...`). Penanda paling
   dikenali dari antarmuka buatan AI. Pakai chip, latar bernada, atau tidak
   sama sekali.
3. **Teks bergradien** (`background-clip: text`). Tidak pernah bermakna.
4. **Kartu di dalam kartu.** Selalu salah.
5. **Kartu sebagai jawaban malas.** Daftar memakai baris. Kartu hanya untuk
   ringkasan dasbor.
6. **Dialog tanpa fokus tugas.** Satu dialog hanya mengerjakan satu record;
   editor artikel dan halaman yang kompleks tetap memakai halaman penuh.
7. **Kicker huruf besar kecil-kecil di atas setiap seksi.** Sebagai label data
   di kartu ringkasan boleh; sebagai tata bahasa tiap seksi, itu perancah AI.
8. **Font display di label, tombol, atau data.**
9. **Aksen jenuh pada keadaan nonaktif.**
10. **Menemukan ulang afordansi baku** — scrollbar kustom, kontrol formulir aneh.

---

## 7. Penerapan per halaman

Ketiga belas rute memakai kerangka yang sama. Yang berbeda hanya isi area kerja.

| Rute | Bentuk | Catatan khusus |
|---|---|---|
| `/admin` | dasbor ringkasan | satu-satunya tempat kartu dibolehkan; sapaan + prioritas + hitungan + agenda bulan ini |
| `/admin/pages` | daftar baris | tautan ke penyunting per halaman |
| `/admin/announcements` | daftar + dialog | saring status |
| `/admin/articles` | daftar + laci | penyunting kaya tetap halaman penuh, bukan laci — isinya terlalu panjang |
| `/admin/gallery` | kisi gambar + dialog | kisi, bukan baris: isinya visual |
| `/admin/media` | kisi gambar + dialog | sama seperti galeri |
| `/admin/downloads` | daftar baris + dialog | baru dibangun; sesuaikan ke sistem ini |
| `/admin/leaders` | daftar baris + dialog | 71 baris — kepadatan penting, sediakan pencarian |
| `/admin/programs` | daftar baris + dialog | 37 baris |
| `/admin/divisions` | daftar baris + dialog | 8 baris |
| `/admin/aspirations` | kotak masuk | baca + ubah status; tidak ada pembuatan |
| `/admin/history` | lini masa | hanya baca |
| `/admin/users` | daftar baris + dialog | tindakan merusak → dialog konfirmasi |

Penyunting artikel (`AdminRichTextEditor`, 30KB) dan penyunting halaman
(`AdminPageEditor`, 22KB) adalah pengecualian yang sah: keduanya butuh lebar
penuh. Keduanya tetap memakai token, tombol, dan chip dari dokumen ini.

---

## 8. Cara memeriksa hasil

Sebelum menyebut sebuah halaman selesai:

- [ ] tujuh keadaan komponen ada, bukan setengahnya
- [ ] kosong, memuat, galat, tanpa izin — keempatnya terlihat benar
- [ ] seluruh alur bisa diselesaikan **hanya dengan papan ketik**, fokus selalu terlihat
- [ ] teks badan lolos 4.5:1; dihitung, bukan dikira
- [ ] tidak ada latar grid, tidak ada garis aksen samping, tidak ada kartu bersarang
- [ ] 1280px dan 768px keduanya utuh; rel menciut jadi laci di bawah 900px
- [ ] `prefers-reduced-motion` dihormati
- [ ] tombol simpan berbentuk sama dengan halaman lain
