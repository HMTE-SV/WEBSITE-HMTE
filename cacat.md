# cacat.md — Audit Visual & Kode Landing Page

Audit tanggal 2026-07-02, branch `alpha-dev`, dev server lokal (`next dev`), dicek di desktop (~914–1087px), tablet (768px), dan mobile (375px). Severity: **KRITIS** (merusak pengalaman/kepercayaan), **SEDANG** (terlihat jelas, menurunkan kualitas), **MINOR** (polish).

---

## 1. Hero (`#hero`, `src/components/site/Hero.tsx`)

- **KRITIS — Tidak ada navigasi sama sekali di viewport pertama.** Header (`header.tre-header`) berada di DOM *setelah* hero (posisi ~968px dari atas), dan floating nav (`landing-nav-stage`) baru jadi fixed setelah scroll. Pengunjung yang baru mendarat melihat satu layar penuh tanpa satu pun link. Saran: tampilkan nav (boleh varian transparan) sejak load, atau pindahkan header ke atas hero.
- **SEDANG — Hero 100vh terasa seperti splash screen, bukan hero.** Isinya hanya photo wall di ~35% atas + logo raster di tengah bawah. Tidak ada headline, tagline, CTA, atau scroll cue. Ruang kosong gelap sangat besar antara photo wall dan logo, dan di bawah logo. Pengunjung baru tidak mendapat jawaban "situs apa ini, untuk siapa, mau ngapain".
- **SEDANG — Photo wall hanya 5 foto unik di-tile 32 kali** (`robotics_prestige` ×7, `ugm_socialization` ×7, `semiconductor_career`/`smart_grid_dashboard`/`solar_village` ×6). Repetisinya terlihat dalam satu layar — foto cleanroom dan antena yang sama muncul berulang di 4 baris. Saran: minimal 12–15 foto unik, atau kecilkan area wall.
- **MINOR — Logo hero (`/assets/logo-hmte.svg`) adalah LCP tapi lazy-load.** Next melempar warning berulang di console. Tambahkan `priority` pada `<Image>` di `Brand.tsx`.
- **MINOR — Foto wall adalah gambar AI-generated** yang juga dipakai ulang sebagai cover artikel (lihat §3). Untuk situs himpunan, foto kegiatan asli jauh lebih kredibel.

## 2. Navigasi (`Header.tsx`, `landing-nav-stage`)

- **SEDANG — Panel menu mobile semi-transparan.** Saat menu dibuka, teks halaman di belakangnya tembus dan bertabrakan visual dengan item menu (terlihat "Kirim data resmi HMTE" menembus panel, "Aspirasi" menimpa teks "Jujur / Valid"). Beri background opaque atau backdrop-blur pekat.
- **MINOR — Chevron pada "Organisasi" dan "Kabar" di menu mobile tidak berfungsi** — submenu selalu ter-expand, chevron hanya dekorasi yang menjanjikan collapse.
- **MINOR — Menu mobile tidak menutup saat scroll** dan tetap terbuka menutupi konten.
- Dropdown desktop (Organisasi/Kabar) berfungsi baik, menutup di outside click. ✓

## 3. Kabar & Berita (`#stats`, `NewsAgenda.tsx`)

- **SEDANG — Judul menjanjikan "agenda", kontennya tidak ada.** "Kabar kegiatan **dan agenda** HMTE" — tapi section hanya berisi berita; tidak ada satu pun item agenda/event. Tambahkan strip agenda atau ubah judul.
- **SEDANG — Gambar artikel duplikat bersebelahan.** Semua artikel di `src/data/articles.ts` memutar 5 gambar yang sama, sehingga featured article dan kartu "Berita Terkini" pertama menampilkan foto identik untuk artikel berbeda (terlihat di tab Berita Utama: foto ruang kuliah dobel dalam satu layar). Minimal atur agar satu view tidak menampilkan gambar kembar.
- **MINOR — Tablist kategori terpotong tanpa affordance.** Di lebar ~914px tab terakhir terpotong ("P…"), di mobile "Kabar A…" — `overflow-x: auto` tapi tanpa fade/panah/scrollbar, pengguna tidak tahu bisa digeser.
- **MINOR — 8 tab kategori untuk konten placeholder itu over-taxonomy** — beberapa kategori isinya artikel yang sama diputar ulang. Kurangi tab sampai data riil ada.
- **MINOR — Konten placeholder tidak relevan:** artikel "Budaya Minum Jamu" di landing himpunan teknik elektro menurunkan kredibilitas placeholder.
- **MINOR — id section `#stats`** untuk section berita adalah sisa layout lama (anchor menyesatkan).

## 4. Bidang & Divisi (`#pillars`, `KabinetSection.tsx`)

- **SEDANG — Kontradiksi jumlah bidang.** Lead section: "terdiri dari **tujuh bidang**" (`site-content.ts:93`), sedangkan stat besar di bawahnya: "**08 BIDANG** — Delapan bidang… (termasuk Pengurus Harian)" (`site-content.ts:100`). Pilih satu framing (mis. "PH + 7 bidang").
- **MINOR — Deskripsi kartu terpotong ellipsis di tengah kata** ("kesekretariatan…", "informas…", "memperkua…"). Line-clamp memotong kasar; tulis deskripsi 1 kalimat pendek yang pasti muat.
- **MINOR — Ghost number tidak konsisten:** kartu KOMINFO–KEWIRUS bernomor 01–07, kartu PH tidak bernomor; nomor juga sebagian tertutup judul.
- **MINOR — Pola warna kartu membentuk stripe, bukan checkerboard.** Kolom 1 & 3 selalu navy, kolom 2 & 4 selalu putih → kartu gelap terlihat lebih "berat" padahal semua bidang peer setara.
- **MINOR — Redundansi struktur:** grid bidang ini dan Direktori Kepengurusan tepat di bawahnya menyajikan taxonomy 8 bidang yang sama dua kali. Tombol "Lihat Anggota" hanya scroll ke direktori — ekspektasi wajar dari label itu adalah langsung melihat anggota.

## 5. Direktori Kepengurusan (`#kurikulum`, `LeadershipDirectory.tsx`)

- **MINOR — Anchor/naming stale:** section direktori ber-id `kurikulum` dengan class `tre-curriculum`; CTA "Kirim data" ber-id `daftar`. Link `#kurikulum` yang dibagikan akan menyesatkan.
- **MINOR — Window chrome dobel + cliché:** frame luar "DIREKTORI KEPENGURUSAN HMTE" punya header sendiri, lalu di dalamnya ada lagi header dengan traffic-light macOS (●●●) yang murni dekorasi. Satu chrome cukup; traffic light palsu adalah pola template yang tidak menambah apa pun.
- **MINOR — State toggle grid/list tidak sinkron:** setelah memilih list view lalu pindah ke tab "Program Kerja", konten tampil grid tapi toggle masih menunjukkan list aktif.
- **MINOR (mobile) — Chip role wrap dua baris** ("WAKIL KETUA HIMPUNAN", "SEKRETARIS UMUM I") dan "8 ANGGOTA" patah baris — layout list mobile terasa sesak.
- Interaksi inti (ganti bidang, tab proker, modal anggota, search) berfungsi. ✓ Data masih dummy + avatar placeholder — dicatat, menunggu data resmi.

## 6. Alumni & Mitra (`#mitra`, `Partners.tsx`)

- **KRITIS — Bahasa manajemen proyek bocor ke halaman publik.** Stat "8 NODE JEJARING / 1 TERKONFIRMASI / 7 PERLU DIKUNCI", chip status kartu "PERLU CEK / INDIKASI / PUBLIK AWAL / PERLU KANAL", copy "Detail final tetap menunggu data resmi" (`site-content.ts:108`), dan `<em>Perlu dikunci</em>` (`Partners.tsx:56`). Ini status internal tim, bukan informasi untuk pengunjung — merusak kesan "situs resmi yang selesai". Sembunyikan section sampai datanya siap, atau tulis ulang sebagai deskripsi jejaring tanpa status.
- **SEDANG — Kartu jejaring hampir kosong:** hanya nomor + judul + chip + titik warna, tanpa logo/deskripsi/link, tapi section memakan ~1.400px. Nilai informasinya belum sebanding dengan ruangnya.

## 7. CTA (`#daftar`, `CTA.tsx`)

- **KRITIS — CTA utama landing ditujukan ke pengurus internal, bukan pengunjung.** "Kirim data resmi HMTE.", "Website ini siap menjadi draft resmi… masih perlu dikunci bersama pengurus" (`site-content.ts:151`), tombol "Kirim data resmi" & "Lihat checklist". Penutup landing publik seharusnya mengajak pengunjung (gabung, aspirasi, kontak, ikuti IG) — copy versi sekarang adalah pesan proyek.
- **MINOR — Baris "Prinsip data · Jujur / Valid / Siap isi"** (`site-content.ts:153`): label dan nilai mono dempet tanpa jarak jelas, dan di desktop menyentuh tepi kanan area konten.

## 8. Footer (`Footer.tsx`, `site-content.ts:222–226`)

- **SEDANG — Teks kontak menyatu:** "Email resmi — segeraSekretariat — segera" tampil sebagai satu baris nyambung. Penyebab: dua `<span class="ftr-pending">` inline di kolom Kontak, sedangkan `.ftr-pending` (css/hmte.css:6388) tidak punya `display:block` seperti link di atasnya.
- **SEDANG — Placeholder "— segera" di kontak publik.** Kalau email/sekretariat belum ada, lebih baik barisnya tidak dirender daripada menampilkan janji "segera".
- **MINOR — Label status internal di footer:** "TERKONFIRMASI · INDIKASI PUBLIK · PERLU KONFIRMASI" (`site-content.ts:164`) tercetak di bar bawah footer publik. Ganti dengan credit/link biasa atau hapus.

## 9. Lintas halaman / responsive

- **SEDANG — Tinggi layout berubah-ubah saat gambar lazy-load** (total tinggi halaman bergeser ±1.500px selama sesi scroll) — pasang `width/height`/aspect-ratio yang konsisten pada gambar artikel agar tidak ada layout shift saat scroll.
- **MINOR — Lede paragraf terlalu panjang di mobile:** intro berita ~7 baris ukuran besar memenuhi hampir satu layar sebelum konten muncul.
- Tidak ada horizontal overflow di 375/768/914px. ✓ Tidak ada error console/network yang gagal. ✓

---

## 10. Kode mati / pengisi repositori

Tracked di git (kandidat hapus):

| # | Item | Alasan |
|---|------|--------|
| 1 | `src/components/site/Gallery.tsx` | Tidak diimport siapa pun sejak gallery section di-drop (commit `f1d3a18f`). |
| 2 | `galleryIntro` & `galleryPhotos` di `src/data/site-content.ts:57-88` | Hanya dikonsumsi Gallery.tsx yang sudah mati. |
| 3 | Blok CSS `.tre-gallery` / `.gallery-*` di `css/hmte.css` (~1244–1509) + `.gallery-bento` (~6477) | Style untuk section yang sudah tidak ada (~300 baris). |
| 4 | Folder `assets/` di root (10 file: logo, badge, 5 PNG AI) | Duplikat byte-identik dari `public/assets/`; runtime hanya membaca `public/assets/`. `accreditation-badge.svg` bahkan tidak dipakai di mana pun. |
| 5 | `public/assets/hmte-mark.svg`, `public/assets/Logo HMTE 6.svg`, `public/assets/tre-mark.svg`, `public/assets/tre-wordmark.svg` | Tidak direferensikan kode mana pun (hanya disebut di docs lama). |
| 6 | `audit/newsroom/*.png` (3 screenshot) | Artefak audit sesi lama yang ikut tercommit. |

Lokal saja (sudah gitignored, tidak masuk repo — hapus kalau mau workspace bersih): `verification/` (6,3MB, termasuk sisa Chrome profile), `.codex-run/` (12,8MB, 304 file), `outputs/`, `.impeccable/`, `.next-local/`.

Catatan non-hapus: dependency `package.json` sudah ramping (firebase/next/react saja) — tidak ada dependency mati.

---

## Prioritas eksekusi yang disarankan

1. Bersihkan semua bahasa internal/status proyek dari halaman publik (§6, §7, §8) — satu sumber: `src/data/site-content.ts`.
2. Munculkan navigasi di viewport pertama + beri hero headline & CTA (§1).
3. Perbaiki footer kontak menyatu & placeholder "segera" (§8).
4. Selaraskan copy 7 vs 8 bidang (§4).
5. Hapus dead code tabel §10 (aman, tidak mengubah tampilan).
6. Sisanya (tab overflow, truncation, traffic lights, menu mobile transparan) sebagai polish batch.
