# Design QA — Pusat Arsip HMTE

## Target

- Referensi struktur: menu utama **Arsip** dengan submenu **Arsip Dokumen HMTE** dan **Template Dokumen**.
- Hasil: dua halaman publik yang terhubung, satu workspace admin berbasis project/folder, dan kontrol CTA navbar.

## Pemeriksaan visual dan interaksi

- Desktop `/arsip`: hierarki hero, pemilih jenis arsip, empty state, navbar, dan footer terbaca jelas tanpa overlap.
- Mobile 390 × 844: tidak ada horizontal overflow; hero, statistik, pemilih halaman, dan empty state tetap terbaca.
- Navbar: submenu Arsip menghasilkan `/arsip` dan `/template-dokumen`; tidak ada duplicate-key error.
- CTA kanan: label dan tujuan tetap dapat diedit; visibilitas menjadi kontrol terpisah dan nilai lama tetap kompatibel.
- Admin: project menjadi unit utama dan dokumen tampil di satu panel yang sama; penghapusan hanya berada di editor terfokus dengan konfirmasi.
- Data lama: item kelompok/event dimigrasikan menjadi project tanpa dibuang; kategori template dipisahkan dari arsip.

## Isu

- P0: tidak ada.
- P1: tidak ada.
- P2: tidak ada.
- P3: empty state publik akan terasa lebih hidup setelah project pertama diterbitkan.

final result: passed
