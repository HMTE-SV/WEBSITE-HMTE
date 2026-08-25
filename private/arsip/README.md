# Berkas arsip privat

Berkas di folder ini **tidak** dilayani sebagai aset statis. Ia hidup di luar
`public/`, dan satu-satunya jalan keluarnya adalah
`/api/arsip/berkas/<projectId>/<documentId>` yang memeriksa kuki kode akses
lebih dahulu. Karena itu tidak ada URL yang bisa ditebak, dan menyalin tautannya
ke orang lain tidak membuat berkasnya ikut terbuka.

## Dua hal yang harus disadari

1. **Folder ini ikut ke dalam git.** Vercel membangun dari repo, jadi berkas
   yang tidak di-commit tidak akan ada di server. Artinya siapa pun yang punya
   akses ke repo punya akses ke berkas ini, tanpa perlu kode apa pun. Kalau
   dokumennya lebih sensitif daripada daftar orang yang boleh mengakses repo,
   simpan sebagai **tautan eksternal privat** (ImageKit/Drive) — ia tetap
   melewati gerbang yang sama, tetapi berkasnya tidak menetap di repo.

2. **Jangan pernah memindahkan berkas ini ke `public/`.** Begitu ada di sana,
   ia punya URL statis permanen dan gerbangnya tidak berlaku lagi.

## Cara memakai

Simpan berkasnya di sini, lalu di panel admin isi jalurnya relatif ke akar repo:

```
private/arsip/open-house-2026/laporan-keuangan.pdf
```
