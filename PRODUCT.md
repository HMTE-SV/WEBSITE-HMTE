# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Mahasiswa TRE SV UGM dan anggota HMTE** yang ingin cepat tahu kabar, kegiatan, program kerja, dan siapa pengurusnya. Sebagian besar membuka dari HP, sering lewat tautan di Instagram atau grup chat.
- **Orang luar yang ingin mengenal HMTE**: mahasiswa baru, alumni, sponsor/mitra, dosen, dan pihak departemen. Mereka menilai kredibilitas dan keaktifan kabinet.

Beranda melayani keduanya secara seimbang (dikonfirmasi 2026-09-26): kesan pertama untuk orang luar, lalu jalan cepat ke informasi untuk mahasiswa.

## Product Purpose

Website resmi Himpunan Mahasiswa Teknik Elektro, Teknologi Rekayasa Elektro, Sekolah Vokasi UGM. Situs ini adalah rumah informasi kabinet yang sedang menjabat: siapa HMTE, apa yang sedang terjadi (berita, agenda, pengumuman), siapa pengurusnya, dan apa program kerjanya. Berhasil bila pengunjung pulang dengan kesan organisasi yang hidup dan kredibel, dan mahasiswa menemukan info yang dicari tanpa bertanya di grup.

## Positioning

Satu-satunya kanal resmi HMTE TRE SV UGM di luar Instagram (@hmteugm). Isinya dikelola pengurus lewat panel admin sendiri (Firestore), jadi selalu mencerminkan kabinet yang aktif, saat ini Kabinet Abya Vistara periode 2026/2027.

## Operating Context

- Konten (teks tiap seksi, urutan seksi, navigasi, slot media) diatur pengurus lewat panel admin; beranda membacanya dari Firestore dan diperbarui lewat revalidasi.
- Gambar disajikan lewat ImageKit.
- Bisa dipasang sebagai aplikasi (PWA) di HP.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, CSS biasa di `css/`; di-deploy ke Vercel.
- Tidak boleh menambah layanan berbayar atau library berat.
- Tidak menyentuh file env/secret.
- Teks, data pengurus, dan isi seksi berasal dari admin/data dan tidak boleh diubah atau dikarang. Urutan dan perwujudan seksi beranda boleh dirombak (dikonfirmasi 2026-09-26), selama semua isi yang sama tetap ada.

## Brand Commitments

- Warna utama navy #011f4b, dengan aksen emas (#F5B82E) yang sudah dipakai di seluruh situs.
- Font: Geist (display), Plus Jakarta Sans (teks), JetBrains Mono (aksen kecil saja).
- Logo HMTE dan logo Kabinet Abya Vistara.
- Slogan: "Elektro... Satu!!!"
- Nada: resmi tapi hidup. Boleh berani dalam motion dan komposisi, tapi tidak norak, tidak meme, tidak berantakan, karena dosen dan departemen tetap ikut menilai (dikonfirmasi 2026-09-26: aturan "advisor-safe" dilonggarkan, bukan dihapus).

## Evidence on Hand

- Foto asli kabinet dan kegiatan di `public/assets/abya-vistara/` dan slot media ImageKit.
- Data pengurus, divisi, dan program kerja nyata dari Firestore.
- Berita yang sudah terbit.
- Belum ada testimoni, angka prestasi, atau mitra yang terverifikasi; jangan dikarang.

## Product Principles

1. Isi nyata di atas dekorasi: tiap efek harus membawa isi kabinet, bukan menggantikannya.
2. Terasa hidup: pengunjung harus merasakan organisasi yang sedang bergerak, bukan profil statis.
3. Jempol dulu: sebagian besar pengunjung datang dari HP, jadi semua bisa dijangkau dan dibaca dengan satu tangan.
4. Kredibel di depan dosen: berani, tapi tetap rapi dan resmi.

## Accessibility & Inclusion

Target sentuh minimal 44px, teks terbaca tanpa perlu menunggu animasi, dan `prefers-reduced-motion` dihormati.
