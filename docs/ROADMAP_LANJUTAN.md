# Roadmap Lanjutan: Rework Halaman Publik & Admin Panel

> Disusun 2026-07-27. Dokumen ini adalah **rencana eksekusi**, ditujukan untuk sesi kerja berikutnya.
> Melengkapi, bukan menggantikan, `docs/RENCANA_ADMIN_PANEL.md`. Dokumen itu tetap jadi rujukan untuk
> keputusan arsitektur Firebase (§0 sampai §5 di sana masih berlaku seluruhnya).

---

## 0. Konteks

Tiga pekerjaan digabung jadi satu roadmap karena saling bersinggungan di model data:

1. **`/agenda` salah menggambarkan waktu.** Program yang dijadwalkan "Januari" digambar sebagai blok
   emas penuh selebar kolom Januari. Secara visual itu berarti *"berlangsung 1 sampai 31 Januari"*,
   padahal yang benar adalah *"direncanakan di suatu titik dalam Januari"*. Program `Berkala`
   memperparahnya: dua belas kotak menyala sekaligus sehingga papan jadi dinding emas yang tidak
   membawa informasi apa pun.
2. **`/kepengurusan` dan `/program-kerja` adalah daftar yang menyamar jadi grid.** Keduanya baris
   bertumpuk: 71 orang disembunyikan di balik tab yang hanya menampilkan satu bidang (PH cuma 5 orang,
   sisa layar kosong), dan 37 program jadi 37 baris ledger seragam tanpa penanda visual.
3. **Admin panel dan backend belum selesai.** Fase 1 ke atas di `RENCANA_ADMIN_PANEL.md` belum dikerjakan.

### 0.1 Keputusan yang mengunci roadmap ini (2026-07-27)

| Pertanyaan | Keputusan |
|---|---|
| Dari mana tanggal pasti program datang? | **Diisi di admin panel.** Tambah `startDate`/`endDate` opsional pada `programs`. `months` tetap ada sebagai rencana dari Buku Panduan. |
| Aset visual untuk grid baru? | **Belum ada, jadi tipografi dulu.** Grid tidak boleh bergantung pada foto. Slot media ditambahkan belakangan tanpa merombak layout. |
| Urutan kerja? | **Tampilan dulu, backend menyusul.** Bagian A dikerjakan di atas `src/data/*.ts`, Bagian B menyusul. |

### 0.2 Konsekuensi urutan "tampilan dulu"

Bagian A dikerjakan **memakai data lokal** `src/data/*.ts`. Karena `getOrganizationData()`
(`src/lib/organization-data.ts:99`) sudah punya pola fallback lokal ke Firestore, halaman publik yang
dirombak di Bagian A **otomatis ikut jalan** begitu Bagian B memindahkan data ke Firestore. Syaratnya
satu: setiap field baru wajib ditambahkan di **tiga tempat sekaligus**.

```
src/types/content.ts          (tipe publik)
src/types/firestore.ts        (dokumen Firestore)
src/lib/organization-data.ts  (mapping dokumen ke tipe publik)
```

Melewatkan salah satunya menghasilkan bug yang persis sama dengan **F1** di `RENCANA_ADMIN_PANEL.md`,
yaitu `months` hilang saat lewat Firestore. Itu preseden yang sudah pernah terjadi di repo ini, jangan
diulang.

### 0.3 Koreksi terhadap `RENCANA_ADMIN_PANEL.md`

Temuan **F3** di sana ("`divisions`, `programs`, `partners` tidak punya UI admin sama sekali")
**sudah tidak akurat**. `AdminOrganizationManager` (`src/components/admin/AdminOrganizationManager.tsx:57`)
punya pengalih `kind` untuk `leaders | divisions | programs`, dan ketiganya sudah bisa di-CRUD. Masalah
sebenarnya: semuanya **terkubur di balik satu menu bernama "Kepengurusan"** (`src/data/admin-nav.ts:50`),
jadi pengurus non-teknis tidak akan pernah menemukannya.

Yang benar-benar belum punya UI hanyalah **`partners`**. Perbaiki pernyataan F3 saat menyentuh dokumen itu.

---

## 1. Urutan eksekusi

| # | Pekerjaan | Bergantung pada | Status |
|---|---|---|---|
| **A1** | Model jadwal program + rework `/agenda` | tidak ada | ✅ **selesai 2026-07-27** |
| **A2** | Rework `/kepengurusan` | tidak ada, boleh paralel dengan A1 | ✅ **selesai 2026-07-27** |
| **A3** | Rework `/program-kerja` | A1, memakai komponen rail yang sama | ✅ **selesai 2026-07-27** |
| **B1** | Pisah menu admin + form jadwal program | A1, butuh field baru | ⬜ berikutnya |
| **B2** | Firebase Admin SDK | tidak ada | ⬜ |
| **B3** | `roles[]` + `divisionCode` via custom claims | B2 | ⬜ |
| **B4** | ISR + `revalidateTag` | B2 | ⬜ |
| **B5** | ImageKit + collection `media` | B2 | ⬜ |
| **B6** | Script seed idempoten | B2, A1 | ⬜ |
| **B7** | Pembatasan per-bidang + kelola user | B3 | ⬜ |
| **B8** | Settings, Partners CRUD, audit log | B3 | ⬜ |

A1 dan A3 berurutan karena A3 memakai ulang komponen rail dari A1. A2 bebas, bisa dikerjakan kapan saja.

### 1.1 Catatan pelaksanaan Bagian A (2026-07-27)

Empat hal yang menyimpang dari rencana, semuanya disengaja:

1. **`normalizeProgramMonths()` dipindah**, bukan di-import dari `organization-data.ts` seperti tertulis
   di A1.3. Berkas itu menarik Firebase SDK, dan `ProgramRail` dipakai komponen klien, jadi
   meng-import-nya akan menyeret seluruh Firebase ke bundle browser. Fungsinya sekarang tinggal di
   `program-schedule.ts` yang murni, dan `organization-data.ts` yang meng-import dari sana.
2. **`formatScheduleShort()` ditambahkan**, tidak ada di rencana. Bentuk panjang ("Direncanakan Maret,
   Juni, September, Desember") membungkus dua baris di kartu program, dan footer yang lebih tinggi
   mendorong rail-nya naik. Rail yang tidak sebaris antar kartu kehilangan seluruh gunanya sebagai
   pembanding, jadi kartu memakai bentuk ringkas ("Mar · Jun · Sep · Des").
3. **Program berkala diurutkan ke bawah** di `/agenda`. Semuanya mulai Januari, jadi mengurutkan murni
   menurut awal band menaruh dua belas baris "setiap bulan" di kepala papan.
4. **Penanda jabatan inti diperluas** ke Kepala Divisi, bukan hanya tiga pejabat PH, supaya tiap pita
   bidang bisa dibaca sekilas "siapa yang memimpin ini". Ukuran kartu tetap seragam.

### 1.2 Rework visual Bagian A (2026-07-27, sore)

Bentuk visual yang dikirim pertama **ditolak**, dan alasannya sah. Seluruh Bagian A memakai hairline
1px sebagai satu-satunya alat struktur, lalu mengulanginya puluhan kali dalam satu layar. Ditambah
label mono 8px untuk hal yang bukan aksen kecil, yang melanggar aturan tipografi proyek ini sendiri.
Panduan register `brand` menamai keluarga ini secara eksplisit sebagai lane yang sudah jenuh:
*display serif + label mono kecil + pemisah bergaris + restraint monokrom*.

Penggantinya `css/ui-soft.css`, sistem permukaan yang dipakai bersama tiga halaman:

- Struktur dibawa **permukaan** (kartu putih membulat di atas latar cekung, bayangan sangat rendah
  bernada navy) dan **warna bidang**, bukan garis. Border sebagai pemisah antar kartu dilarang;
  garis hanya boleh di dalam satu kartu sebagai pemisah baris daftar, dan harus inset.
- **Delapan warna bidang** untuk wayfinding, konsisten di semua halaman. Seluruhnya lolos WCAG AA
  di atas putih (5.04:1 sampai 9.83:1), jadi aman dipakai sebagai warna teks.
- Teks terkecil 11px. Mono hanya untuk aksen sangat pendek.

Perubahan bentuk per halaman:

| Halaman | Dari | Jadi |
|---|---|---|
| `/kepengurusan` | 71 kartu nama bergaris | Daftar berkelompok per bidang, avatar bulat, jabatan inti ditandai avatar pejal |
| `/program-kerja` | Grid kartu bergaris + 37 rail mini | Bento (panel naratif + tegel angka), kartu lega, badge tanggal |
| `/agenda` | Matriks bergaris 37 baris | Dua belas tegel bulan sebagai satu-satunya visualisasi tahun, plus isi bulan terpilih sebagai daftar |

**Model waktu diganti** atas keputusan Reeyza: rail dua belas bulan per kartu dihapus seluruhnya
(`ProgramRail.tsx` dan `css/agenda-year.css` dihapus). Tiga puluh tujuh gambar garis kecil dalam satu
layar adalah sumber keramaiannya, dan tidak satu pun terbaca sekilas. Penggantinya `DateBadge.tsx`,
yang menjawab satu pertanyaan saja dengan angka yang terbaca. Visualisasi tahun sekarang cuma ada
sekali, di `/agenda`.

**`/divisi` sengaja tidak disentuh** atas keputusan Reeyza, setelah konsekuensinya disampaikan: situs
ini memang punya dua bahasa visual berdampingan.

Dua kegagalan kontras yang ketemu saat audit dan sudah diperbaiki: placeholder pencarian (3.28:1) dan
teks badge "Belum" (2.86:1). Keduanya gagal karena kontrasnya dihitung terhadap putih, padahal latar
sebenarnya adalah `rgba()` yang sudah dikomposit di atas latar cekung. `--sr-ink-faint` sekarang
ditandai haram untuk teks dan hanya boleh untuk chevron.

Dua bug lama yang ikut ketemu dan diperbaiki:

- **Detail baris `/agenda` terbuka permanen.** `.agenda-matrix-detail { display: grid }` mengalahkan
  `display: none` bawaan atribut `[hidden]`, jadi tombol buka/tutupnya tidak pernah berfungsi. Sudah
  ada sebelum rework ini.
- **Sel kosong grid tampil sebagai blok abu-abu.** Trik `gap` di atas latar gelap memunculkan sisa
  baris terakhir sebagai kartu rusak. Garis papan sekarang digambar lewat border kartu.

---

# BAGIAN A: Halaman publik

## A1. Model jadwal program + rework `/agenda`

### A1.1 Masalah yang diperbaiki

Papan sekarang punya **satu bahasa visual untuk tiga hal berbeda**. Kotak emas dipakai untuk program
bertanggal pasti, program yang cuma direncanakan di bulan itu, dan program berkala. Karena ketiganya
digambar sama, pembaca menyimpulkan yang paling harfiah: "berlangsung sebulan penuh".

Perbaikannya bukan menambah tanggal saja, tapi **memberi tiga tingkat kepastian tiga bentuk yang berbeda.**

### A1.2 Model data

Tambahkan dua field opsional. Jangan ganti `months`, karena itu tetap sumber rencana dari Buku Panduan,
dan sebagian besar program memang tidak akan pernah punya tanggal pasti.

`src/types/content.ts`, perluas `Program`:

```ts
export type Program = {
  name: string
  desc: string
  status: ProgramStatus          // 'Terjadwal' | 'Berkala', pola, bukan kepastian
  date: string                   // label manusia, mis. "Maret, Juni, September"
  months?: number[]              // rencana 1-12, dari buku panduan
  startDate?: string             // ISO 'YYYY-MM-DD', diisi pengurus saat sudah fix
  endDate?: string               // ISO 'YYYY-MM-DD', opsional; kegiatan sehari cukup startDate
}
```

`src/types/firestore.ts`: `ProgramDocument` dapat `startDate?: string` dan `endDate?: string`.

> **Kenapa string ISO, bukan `Timestamp`?** Program dijadwalkan pada *hari kalender*, bukan pada titik
> waktu. `Timestamp` membawa jam dan zona waktu yang tidak pernah dimiliki datanya, dan akan menggeser
> tanggal satu hari saat server berjalan di UTC. Itu bug yang mahal dilacak. `'2027-04-12'` tidak punya
> masalah itu. Ini juga berbeda dari `events.startAt` di `RENCANA_ADMIN_PANEL.md` D4, yang memang butuh
> jam karena menyatakan *"Rapat Anggota, 14 Februari, 15.30"*. Dua model itu tidak bertabrakan.

### A1.3 Berkas baru: `src/lib/program-schedule.ts`

Satu tempat untuk seluruh aritmetika jadwal, supaya `/agenda` dan `/program-kerja` menggambar hal yang
sama persis. Ini pusat dari A1, jadi kerjakan lebih dulu, lengkap dengan test.

```ts
export type SchedulePrecision = 'exact' | 'planned' | 'unscheduled'

export type ScheduleBand = {
  from: number        // fraksi tahun 0..1, tepi kiri
  to: number          // fraksi tahun 0..1, tepi kanan
  month: number       // 1-12, untuk penandaan
}

export type ProgramSchedule = {
  precision: SchedulePrecision
  isRecurring: boolean       // status === 'Berkala'
  months: number[]           // hasil normalizeProgramMonths
  bands: ScheduleBand[]      // yang digambar di rail
  startDate?: Date
  endDate?: Date
  dayCount?: number          // inklusif; 1 untuk kegiatan sehari
  label: string              // "12-14 April 2027" | "Direncanakan April" | "Belum dijadwalkan"
}
```

Fungsi yang harus ada:

| Fungsi | Tugas |
|---|---|
| `getAgendaYear()` | Tahun yang digambar papan. Ambil dari konstanta baru `agendaYear` di `src/data/site-content.ts` (nanti pindah ke `settings/site`, §5.2 rencana admin). **Wajib eksplisit**, karena tanpa ini garis "hari ini" dan validasi `startDate` tidak punya acuan. |
| `yearFraction(date, year)` | `(date - 1 Jan) / (1 Jan tahun berikutnya - 1 Jan)`. Pakai `Date.UTC` supaya tahun kabisat ikut benar dengan sendirinya. |
| `monthBand(month, year)` | `{ from, to }` dari `yearFraction` tanggal 1 bulan itu sampai tanggal 1 bulan berikutnya. |
| `buildProgramSchedule(program, year)` | Menghasilkan `ProgramSchedule`. Aturan: `startDate` valid dan jatuh di `year` menghasilkan `exact`; kalau tidak, `months` tidak kosong menghasilkan `planned`; kalau tidak, `unscheduled`. |
| `formatScheduleLabel(schedule)` | Label Indonesia. Rentang dalam bulan yang sama dipadatkan jadi `"12-14 April 2027"`, bukan `"12 April 2027 sampai 14 April 2027"`. |

Pakai ulang `normalizeProgramMonths()` yang **sudah ada** di `src/lib/organization-data.ts:56`. Jangan
tulis ulang.

**Kasus tepi yang wajib punya test** (`src/lib/program-schedule.test.ts`):

- `startDate` ada tapi tahunnya beda dari `getAgendaYear()`, harus turun ke `planned` dan tidak digambar
  di luar rail.
- `endDate` lebih awal dari `startDate`, abaikan `endDate` dan perlakukan sebagai kegiatan sehari.
- `startDate` yang bulannya tidak ada di `months`. Tanggal menang, dan `months` ikut ditambah agar
  penghitung bulan tidak bohong.
- Kegiatan sehari, sehingga `to - from` sangat kecil. Pastikan lebar minimum ditangani di CSS, bukan
  dengan memalsukan angka di sini.
- 29 Februari pada tahun kabisat.
- `months` kosong dan tanpa tanggal, hasilnya `unscheduled`.

### A1.4 Desain: "Garis tahun"

Papan tetap matriks dua belas bulan. Keputusan 2026-07-25 masih benar, karena sumbernya memang per
bulan. Yang berubah: **satu baris sekarang adalah garis kontinu, bukan dua belas kotak.** Perubahan
inilah yang memperbaiki keluhannya, karena posisi horizontal jadi berarti *waktu*, bukan sekadar
*kolom bulan*.

**Tiga bahasa visual, dan ini inti perbaikannya:**

```
                Jan   Feb   Mar   Apr   Mei   Jun   Jul   Ags   Sep   Okt   Nov   Des
              ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤

exact         ·····················▊·······································   Raker 26/27
                                    └ 12-14 April, balok emas pejal, selebar durasi asli

planned       ······╱╱╱╱╱╱·································································   Musta & Sertijab
                    └ Februari, arsir miring, tepi putus-putus, 45% opasitas

recurring     ─────•─────•─────•─────•─────•─────•─────•─────•─────•─────•─────•─────•   Evaluasi Bulanan
                   └ garis rambut sepanjang tahun + titik di tiap bulan yang aktif
```

| Tingkat | Bentuk | Alasan |
|---|---|---|
| **`exact`** | Balok emas pejal (`var(--hmte-gold)`), lebar sama dengan durasi sebenarnya, `min-width: 5px`, sudut 1px, tutup kiri-kanan navy 2px | Pejal berarti pasti. Kegiatan sehari jadi tanda tipis, persis yang diminta: **satu hari tidak boleh terlihat seperti satu bulan** |
| **`planned`** | Arsir 45 derajat `repeating-linear-gradient(45deg, transparent 0 3px, rgba(var(--hmte-gold-rgb), .38) 3px 6px)`, `border: 1px dashed rgba(var(--hmte-gold-rgb), .55)`, `opacity: .55` | Arsir berarti perkiraan. Membentang selebar bulan tapi terbaca kabur, jadi tidak lagi mengaku sebulan penuh |
| **`recurring`** | Garis rambut `1px rgba(var(--hmte-navy-rgb), .16)` sepanjang rail + titik emas diameter 5px di tengah tiap bulan aktif | Program berkala adalah *irama*, bukan blok. Dinding emas dua belas kotak hilang total |

**Yang wajib ada selain rail:**

1. **Garis "hari ini".** Hairline vertikal 2px emas melintasi seluruh papan di
   `left: calc(yearFraction(today) * 100%)`, dengan label `HARI INI` kecil di kepala. Hanya digambar
   kalau `getAgendaYear()` sama dengan tahun berjalan. Inilah yang membuat papan terasa hidup, bukan arsip.
2. **Legenda, wajib, bukan opsional.** Tiga swatch plus keterangan satu baris, di atas rail. Tanpa ini
   tiga bahasa visual tadi jadi teka-teki. Letakkan di kiri, sejajar dengan penghitung.
3. **Laci bulan.** Klik kepala bulan, panel terbuka di bawah rail. Isinya program bulan itu dibagi dua:
   **"Tanggal pasti"** (urut tanggal, tiap baris menyebut `"12-14 April"`) dan **"Belum ada tanggal"**.
   Di sinilah ketelitian tanggal benar-benar terpakai. Bulan yang terpilih menggelapkan sisa rail
   (`opacity: .35`) supaya fokusnya jelas.
4. **Penghitung dua angka.** Ganti `"37 program sepanjang tahun"` jadi `"37 program, 12 bertanggal pasti"`.
   Angka kedua adalah ukuran kemajuan pengisian data, sekaligus alasan pengurus mau membuka panel admin.
5. **Pita kepadatan bulan** yang sudah ada (`.agenda-ribbon`) dipertahankan sebagai kepala rail.
   Meteran isinya sekarang menghitung `exact` dan `planned` terpisah: bagian pejal untuk yang bertanggal,
   bagian arsir untuk yang belum.

**Geometri CSS** (`css/agenda-year.css`, ganti blok `.agenda-matrix-strip`):

```css
.agenda-rail {
  position: relative;
  height: 22px;
  /* Pembatas bulan digambar sebagai latar, bukan 12 elemen. 37 baris kali 12 kotak
     itu 444 node DOM tanpa guna. */
  background-image: repeating-linear-gradient(
    to right,
    rgba(var(--hmte-navy-rgb), .12) 0 1px,
    transparent 1px calc(100% / 12)
  );
}

.agenda-mark {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: calc(var(--from) * 100%);
  width: max(5px, calc((var(--to) - var(--from)) * 100%));
}
```

`--from` dan `--to` dikirim sebagai inline style dari React. Pola `CSSProperties` yang sudah dipakai
di `AgendaYear.tsx:134` untuk `--fill` sudah benar, jadi ikuti itu. `max()` menjamin kegiatan sehari
tetap terlihat **tanpa** memalsukan angka di lapisan data.

**Aksesibilitas.** Rail itu dekoratif, jadi `aria-hidden="true"`, seperti `.agenda-matrix-strip`
sekarang. Informasi sebenarnya harus tetap ada sebagai teks di `<small>` di bawah judul program,
memakai `formatScheduleLabel()`. Pola ini sudah benar di kode sekarang (`AgendaYear.tsx:186`), jadi
pertahankan.

**Responsif.** Di bawah 720px rail disembunyikan (aturannya sudah ada) dan baris jatuh ke label teks.
Laci bulan tetap jalan di mobile. Di layar sempit justru laci itu yang jadi antarmuka utama, jadi
jangan ikut disembunyikan.

### A1.5 Berkas yang disentuh

| Berkas | Perubahan |
|---|---|
| `src/lib/program-schedule.ts` | **baru**, seluruh aritmetika jadwal |
| `src/lib/program-schedule.test.ts` | **baru**, kasus tepi di A1.3 |
| `src/types/content.ts` | `Program` dapat `startDate?`, `endDate?` |
| `src/types/firestore.ts` | `ProgramDocument` dapat dua field yang sama |
| `src/lib/organization-data.ts` | Salin kedua field di mapping (sekitar baris 151). **Ini titik F1 terulang** |
| `src/data/site-content.ts` | `export const agendaYear = 2026` |
| `src/components/site/AgendaYear.tsx` | Rail menggantikan strip 12 kotak; tambah laci bulan, garis hari ini, legenda |
| `src/app/agenda/page.tsx` | Bangun `ProgramSchedule` per program; hitung `exact` lawan `planned` |
| `css/agenda-year.css` | `.agenda-rail`, `.agenda-mark`, `.agenda-legend`, `.agenda-drawer`, `.agenda-today` |
| `src/data/programs.ts` | Isi `startDate` untuk program yang tanggalnya memang sudah pasti, sisanya biarkan |

---

## A2. Rework `/kepengurusan`

### A2.1 Masalah

- **Tab menyembunyikan 66 dari 71 orang.** Halaman berjudul "Satu kabinet, 71 orang di dalamnya"
  tapi hanya menampilkan 5. Janji dan isinya bertolak belakang.
- **Layar kosong.** PH cuma 5 orang di grid 3 kolom, jadi dua baris terisi dan sisanya kosong sampai
  footer. Terlihat jelas di tangkapan layar sekarang.
- **Pencarian dilumpuhkan.** `LeadershipIndex.tsx:35` hanya mencari di bidang yang sedang aktif, dan
  `selectDivision()` mengosongkan query setiap ganti tab. Mencari "Syiffa" tanpa tahu bidangnya mustahil.
- Barisnya monogram, nama, jabatan. Itu daftar, bukan grid.

### A2.2 Desain: "Papan nama kabinet"

Semua 71 orang tampil sekaligus dalam satu grid kontinu, dikelompokkan per bidang dengan pita judul.
Chip bidang **menyaring**, bukan menyembunyikan. Bawaannya "Semua bidang".

**Satuan grid: kartu nama, potret 4:5, semua berukuran sama.**

```
┌──────────────────┐   Latar: kertas (--tre-paper-deep)
│ 01          PH   │   Garis: hairline 1px navy 14%, tepi bersebelahan menyatu
│                  │
│   ╭──────╮       │   Monogram hantu: "MA" di --fs-display-md, navy 7%,
│   │  MA  │ ← 7%  │   ditempatkan besar dan terpotong tepi kartu.
│   ╰──────╯       │   Ini penanda identitas kartu, pengganti foto yang
│                  │   tetap bekerja saat foto belum ada.
│ Mohammad Lutfi   │   Nama: --font-display 15px/600
│ ───────────      │   Rule emas 24px di bawah nama
│ KETUA UMUM       │   Jabatan: --font-mono 9px uppercase, tracking .07em
│ 2024          ↗  │   Angkatan + panah pojok
└──────────────────┘
```

- **Grid:** `repeat(auto-fill, minmax(184px, 1fr))`, jadi 6 kolom pada 1320px dan 2 pada mobile.
  71 kartu memenuhi halaman, sehingga masalah layar kosong hilang dengan sendirinya.
- **Semua kartu sama besar.** Ini menegakkan aturan yang sudah dipakai di `/divisi`: entitas sederajat
  tidak boleh dibedakan lewat ukuran. Ketua Umum, Sekjen, dan Bendahara ditandai **garis emas 2px di
  tepi atas kartu** plus label mikro `PENGURUS INTI`, bukan dengan kartu yang lebih besar. Hierarki di
  PH itu nyata dan boleh terlihat, tapi lewat penanda, bukan lewat luas.
- **Pita bidang:** setiap kelompok dibuka pita full-width bergaris. `PH · PENGURUS HARIAN` di mono kiri,
  `05 ANGGOTA` di kanan, garis navy 2px di bawahnya. Pita `position: sticky; top: <tinggi header>`
  sehingga saat menggulir selalu jelas sedang melihat bidang mana.
- **Interaksi tetap datar.** Tidak ada lift atau bayangan, karena bahasa halaman ini arsip cetak. Saat
  hover, monogram hantu berubah dari navy 7% ke emas 14% dan panah bergeser 2px. Itu saja.
- **Toolbar lengket** berisi pencarian dan jumlah hasil. Pencarian sekarang menjangkau **seluruh bidang**
  dan **tidak dikosongkan** saat chip diklik. Dua bug UX di A2.1 diperbaiki di sini.
- **Chip bidang** menyaring grid sekaligus menggulir ke pita bidang itu.

### A2.3 Berkas yang disentuh

| Berkas | Perubahan |
|---|---|
| `src/components/site/LeadershipIndex.tsx` | Tulis ulang: tab jadi chip penyaring, satu grid berpita, cari lintas bidang |
| `src/app/kepengurusan/page.tsx` | Kirim seluruh bidang sekaligus; `?divisi=` jadi filter awal, bukan tab awal |
| `css/org-pages.css` | Ganti `.roster-*` (baris 460 sampai 706) dengan `.plate-*`; buang `.roster-tabs` |

Pertahankan `getLeaderHref()` (`src/lib/organization-slugs.ts`) dan `getInitials()` yang sudah ada.
Slot foto masuk belakangan. Kartu sudah punya area monogram, jadi Bagian B5 tinggal menukar isinya
dengan `<Image>` tanpa mengubah kisi.

---

## A3. Rework `/program-kerja`

### A3.1 Masalah

- 37 baris ledger identik. Satu-satunya pembeda antar baris adalah teks, tidak ada sidik visual.
- Di layar lebar, kolom kanan (status, tanggal, "buka detail") terpisah jauh dari judulnya. Mata harus
  menyeberangi ruang kosong untuk memasangkan keduanya.
- `date` ditampilkan sebagai teks bebas (`"Maret, Juni, September, dan Desember"`) yang panjang dan
  tidak bisa dibandingkan antar program.

### A3.2 Desain: "Katalog kartu program"

Ledger jadi grid kartu. Yang membuatnya bukan grid generik: **setiap kartu diakhiri rail dua belas
bulan versi mini, komponen yang sama persis dengan `/agenda`.** Jadwal jadi sidik jari visual tiap
program, sehingga dua kartu tidak akan pernah terlihat sama, dan pembaca yang sudah membaca `/agenda`
langsung mengenali bahasanya.

```
┌────────────────────────────────────────┐
│ PH                                  03 │  Kepala: kode bidang + nomor urut (mono 9px)
├────────────────────────────────────────┤
│ SOTM                                   │  Nama: --font-display 19px/600
│                                        │
│ Agenda SOTM yang dijadwalkan empat     │  Deskripsi: 13px, dipotong 3 baris
│ kali dalam kalender kerja Pengurus     │  (-webkit-line-clamp: 3)
│ Harian.                                │
│                                        │
│ ─────•─────•─────•─────•───────────    │  ← RAIL MINI (tinggi 12px)
│ J F M A M J J A S O N D                │     bahasa visual identik dengan /agenda
│ ● BERKALA        Mar · Jun · Sep · Des │  Chip pola + label jadwal ringkas
└────────────────────────────────────────┘
```

- **Grid:** `repeat(auto-fill, minmax(304px, 1fr))`, jadi 4 kolom pada 1320px dan 1 pada mobile.
  Kartu bergaris hairline dengan tepi bersebelahan menyatu, membentuk papan bergaris seperti `/divisi`.
- **Tinggi seragam.** Deskripsi dipotong tiga baris supaya rail selalu duduk di garis dasar yang sama
  di semua kartu. Rail yang tidak sebaris merusak seluruh gunanya sebagai pembanding.
- **Label jadwal** memakai `formatScheduleLabel()` dari A1.3, bukan lagi `program.date` mentah.
  Program bertanggal pasti menampilkan `12-14 April`, yang belum menampilkan nama bulan saja.
- **Program bertanggal pasti** mendapat garis emas 2px di tepi atas kartu. Penanda ini sama dengan
  pengurus inti di A2, jadi kosakata visualnya konsisten lintas halaman.
- **Pita unggulan** (`.tix-grid`, 3 program bergambar) dipertahankan apa adanya di atas katalog.
  Gambarnya memang sudah ada dan bandnya sudah bekerja, jadi tidak ada alasan membongkarnya.
- **Penyaring:** bidang dan pola dipertahankan, tambah **"Punya tanggal pasti"**. Tambah pengurutan:
  urutan bidang (bawaan), abjad, bulan terdekat.

### A3.3 Berkas yang disentuh

| Berkas | Perubahan |
|---|---|
| `src/components/site/ProgramRail.tsx` | **baru**, rail bersama untuk `AgendaYear` dan `ProgramCatalog`. Prop `size: 'full' \| 'mini'` |
| `src/components/site/ProgramCatalog.tsx` | `.ledger-list` jadi grid kartu; tambah penyaring tanggal dan pengurutan |
| `css/org-pages.css` | Ganti `.ledger-row`, `.ledger-main`, `.ledger-side` (1803 sampai 1905) dengan `.pcard-*` |
| `css/agenda-year.css` | `.agenda-rail` dipakai bersama; varian mini lewat `--rail-height` |

> **Kerjakan `ProgramRail.tsx` sebagai bagian dari A1, bukan A3.** Kalau rail ditulis inline di
> `AgendaYear` dulu lalu disalin ke kartu, dua bahasa visual itu akan menyimpang dalam beberapa minggu.

---

# BAGIAN B: Admin panel & backend

Urutan di `RENCANA_ADMIN_PANEL.md` §6 tetap dipakai. Yang berubah hanya satu: **B1 naik ke depan**,
karena field jadwal dari A1 tidak ada gunanya sampai pengurus bisa mengisinya.

## B1. Pisah menu admin + form jadwal program

Dua hal sekaligus.

**a. Pecah menu.** `AdminOrganizationManager` sudah menangani tiga jenis (§0.3) tapi semuanya
tersembunyi di balik menu "Kepengurusan". Pecah `src/data/admin-nav.ts` jadi:

| Menu | Href | Isi |
|---|---|---|
| Kepengurusan | `/admin/leaders` | `kind='leaders'` |
| Program Kerja | `/admin/programs` | `kind='programs'` |
| Divisi | `/admin/divisions` | `kind='divisions'` |

Terima `kind` sebagai prop `AdminOrganizationManager`, bukan `useState` internal. Ganti juga nama menu
"Agenda" jadi **"Kegiatan Bertanggal"** (F2 dan D4).

**b. Form jadwal.** Di cabang `kind === 'programs'` (`AdminOrganizationManager.tsx:325`):

- **Pemilih dua belas kotak** menggantikan isian teks `months`. Komentar di
  `organization-crud.ts:72` sudah menjanjikan ini. Tata letak 6 kali 2, tiap kotak tombol toggle
  `aria-pressed`, tampilannya meminjam `.agenda-ribbon`.
- **Dua `<input type="date">`**: `startDate` dan `endDate`. Petunjuk: *"Kosongkan kalau tanggal belum
  fix. Kegiatan sehari cukup isi tanggal mulai."*
- **Validasi di `buildOrganizationPayload()`:** `endDate` lebih awal dari `startDate` ditolak dengan
  pesan. `startDate` di luar `agendaYear` diperingatkan, jangan ditolak, karena kegiatan lintas periode
  itu sah. Bulan `startDate` otomatis ditambahkan ke `months`.
- **Pratinjau rail** di bawah form, memakai rail yang sama, memperlihatkan bagaimana program itu akan
  tampil di `/agenda`. Ini yang mengubah pengisian tanggal dari kewajiban administratif jadi umpan
  balik langsung.

Perluas test `src/lib/admin/organization-crud.test.ts` untuk validasi tanggal.

## B2 sampai B8: Fondasi Firebase

Ikuti `RENCANA_ADMIN_PANEL.md` §6 Fase 1 sampai 4 apa adanya. Ringkasan urutan dan catatan tambahan:

| # | Pekerjaan | Rujukan | Catatan |
|---|---|---|---|
| **B2** | Firebase Admin SDK | D2, §8.1 | `FIREBASE_SERVICE_ACCOUNT_JSON` env server, **tanpa** `NEXT_PUBLIC_`. Perbarui `FIREBASE_SETUP.md §5` yang sekarang justru melarangnya |
| **B3** | `roles[]` + `divisionCode` ke custom claims | D1, §5.3 | Satu perubahan utuh: `src/types/admin.ts`, `admin-nav.ts`, `AdminAuthGuard`, `firestore.rules` |
| **B4** | ISR + `revalidateTag` | D6 | **Paling mendesak setelah B2.** Buang `force-dynamic` dari `src/app/berita/page.tsx`. Bungkus `getOrganizationData()` dengan `unstable_cache` bertag `organization` |
| **B5** | ImageKit + collection `media` | §4.6, §5.2 | Membuka slot foto di kartu A2 dan A3 |
| **B6** | Script seed idempoten | Fase 1 no. 11 | **Wajib menyertakan `startDate`/`endDate`.** Kalau tidak, A1 hilang saat migrasi, persis pengulangan F1 |
| **B7** | Pembatasan per-bidang + kelola user | §5.3, F7 | **Gerbang sebelum panel dibagikan ke 9 perwakilan** |
| **B8** | Settings, Partners CRUD, audit log | F6, F3, F8 | `partners` adalah satu-satunya collection yang benar-benar tanpa UI |

### B0. Blocker yang masih menggantung

**Test rules belum pernah dijalankan.** 35 kasus sudah ditulis di `tests/rules/` dan `npm test` sudah
memanggilnya, tapi emulator Firestore butuh **Java (JDK)** yang belum terpasang. Dengan D3 memutuskan
otorisasi tetap di sisi klien, rules adalah **satu-satunya** yang menjaga data, dan itu belum
terverifikasi sekali pun.

Pasang JDK dan jalankan `npm run test:rules` **sebelum B3**, karena B3 menulis ulang rules secara
menyeluruh. Menulis ulang benteng tunggal tanpa test yang bisa dijalankan adalah cara paling mudah
kehilangan data diam-diam.

---

## 2. Verifikasi

### Per bagian

**A1, `/agenda`**

1. `npm run test:unit` sampai `program-schedule.test.ts` hijau, termasuk seluruh kasus tepi A1.3.
2. Isi `startDate: '2026-04-12'` dan `endDate: '2026-04-14'` pada `Raker 26/27` di `src/data/programs.ts`.
3. Buka `http://localhost:3000/agenda`. Raker harus jadi **balok sempit** di pertengahan April, jelas
   berbeda dari arsir `Musta dan Sertijab` yang membentang selebar Februari.
4. `Evaluasi Bulanan` (`months: [1..12]`) harus jadi **garis plus dua belas titik**, bukan dinding emas.
5. Garis "hari ini" muncul di posisi yang benar (27 Juli kira-kira 56,7% lebar rail).
6. Klik kepala bulan, laci terbuka dan terbagi "Tanggal pasti" lawan "Belum ada tanggal".
7. Perkecil ke 700px. Rail hilang, label teks tetap menyebut jadwal yang sama, laci tetap bisa dibuka.

**A2, `/kepengurusan`**

1. Ke-71 orang tampil tanpa mengklik apa pun, tidak ada layar kosong sampai footer.
2. Cari `"Syiffa"` dari keadaan "Semua bidang", harus ketemu tanpa perlu tahu bidangnya.
3. Klik chip bidang, query pencarian **tidak** ikut terhapus.
4. Pita bidang lengket saat menggulir.
5. Ketua Umum bergaris emas atas, dan kartunya **sama besar** dengan yang lain.

**A3, `/program-kerja`**

1. 37 kartu, tinggi seragam, rail mini semuanya duduk di garis dasar yang sama.
2. Rail mini `SOTM` menunjukkan empat titik yang persis sama dengan barisnya di `/agenda`.
3. Penyaring "Punya tanggal pasti" menyisakan hanya program yang sudah diisi tanggalnya.

**B1, admin**

1. `npm run test:unit` sampai `organization-crud.test.ts` hijau termasuk validasi tanggal.
2. `/admin/programs` ada sebagai menu tersendiri.
3. Isi tanggal, pratinjau rail berubah seketika.
4. `endDate` sebelum `startDate` ditolak dengan pesan yang bisa dibaca.

### Menyeluruh

```
npm run lint
npm run test:unit
npm run test:rules      # butuh JDK, lihat B0
npm run build
```

Lalu telusuri dengan browser: `/agenda`, `/kepengurusan`, `/program-kerja`, `/divisi`, dan `/` pada
1440px dan 390px. Pastikan `/divisi` dan beranda **tidak** ikut berubah. `css/org-pages.css` dipakai
bersama, jadi mengganti `.roster-*` dan `.ledger-*` berisiko merembet.

> Catatan verifikasi: sesuai catatan `preview-verification`, jangan andalkan tangkapan layar beranda.
> Gunakan `curl` untuk memeriksa hasil SSR, dan buka halaman langsung di Chrome untuk yang visual.

---

## 3. Yang sengaja tidak dikerjakan

- **Mengganti `programs.months` dengan tanggal saja.** Sebagian besar program di Buku Panduan memang
  tidak punya tanggal, dan tidak akan pernah punya. Memaksakan tanggal berarti mengarang ketelitian
  yang tidak dimiliki sumbernya, yaitu kesalahan yang sedang diperbaiki, hanya arah sebaliknya.
- **Kalender hari 365 kotak.** Dengan 37 program yang mayoritas hanya punya bulan, 90% kotaknya kosong
  dan sisanya tebakan.
- **Foto di kartu pengurus.** Ditunda sampai B5 sesuai keputusan §0.1. Kisinya sudah menyediakan slot.
- **Menghapus `events`.** D4 sudah mengunci: `events` tetap ada untuk kejadian berjam, misalnya
  "Rapat Anggota, 14 Februari, 15.30". `startDate` pada `programs` menjawab pertanyaan berbeda, yaitu
  *"program ini jatuh di tanggal berapa"*, dan keduanya tidak saling menggantikan.

---

## 1.3 Penerapan permukaan lembut ke seluruh situs (2026-07-28)

Setelah `/kepengurusan`, `/program-kerja`, dan `/agenda` diterima, Reeyza minta bahasa yang sama
dipakai di semua kotak dan kisi: beranda, `/divisi`, `/berita`, dan sisanya. Ini membatalkan
keputusan sebelumnya yang mengecualikan `/divisi`.

**Cara penerapannya.** Halaman lain tidak dipindah ke kelas `.sfc` atau `.soft-*`. Yang dipinjam
hanya tokennya (`--sr-lg`, `--sr-shadow-1`, `--sr-shadow-2`, `--sr-ink-soft`, `--sr-pill`), jadi tiap
halaman tetap memakai kelasnya sendiri tapi radius, bayangan, dan tinta berasal dari satu sumber.
Menulis ulang markup delapan halaman demi keseragaman akan menukar risiko besar dengan hasil visual
yang sama.

**Pola yang dibongkar di mana-mana: `gap: 1px` di atas latar gelap.** Empat kisi memakainya untuk
memalsukan garis rambut antar sel (`.division-board`, `.newsroom-grid`, `.division-detail-switcher`,
`.org-switches`). Itu justru sumber kelelahan yang dikeluhkan: satu kerangka dibagi banyak sel, jadi
batasnya berlipat. Semuanya diganti jarak nyata (14 sampai 18px) plus sudut membulat dan bayangan
per kartu.

**Skala radius global dinaikkan.** `--radius-sm/md/lg/xl` di `css/hmte.css` naik dari 6/8/12/18 ke
10/14/20/26. Ini satu perubahan yang melembutkan tombol, kolom isian, dan kartu warisan sekaligus,
tanpa menyentuh ratusan aturan satu per satu.

**Ukuran teks terkecil ditegakkan.** Sapuan `7px`, `8px`, `9px`, `10px` menjadi `11px` di
`css/hmte.css`, `css/org-pages.css`, `css/landing-v3.css`, `css/landing-redesign.css`, dan
`css/landing-about-v5.css`. Beberapa label mono sebelumnya 7px, yang secara praktis tidak terbaca.

**Yang tidak diubah:**

- `/kontak`. Konsep kartu pos, sudut sikunya bagian dari metafora.
- Bagian bleed penuh (`.about-story`, `.moment-wall`, `.tre-cta`, `.org-switchboard`). Itu bidang
  halaman, bukan kartu, jadi membulatkannya justru salah baca.
- `css/admin-panel.css`. Panel admin bukan permukaan publik dan punya kepadatan sendiri.

**Sisa yang ketahuan selama sapuan ini:** `.window-body`, `.side-card`, `.partners-metrics`, dan
`.proker-board` di `css/hmte.css` sudah tidak dipakai satu pun berkas di `src/`. Belum dihapus supaya
perubahan ini tetap terbaca sebagai satu langkah visual.

---

## 1.4 Pelaksanaan Bagian B, langkah 1 sampai 3 dan 5 (2026-07-28)

Urutan yang dijalankan atas permintaan Reeyza: form program, pecah menu, unggah gambar, lalu ISR.
Langkah keamanan (B0 dan B3) belum dikerjakan karena masih menunggu JDK terpasang.

### B1a. Form jadwal program

`months` di `OrganizationFormValues` berubah dari `string` jadi `number[]`, diisi pemilih dua belas
kotak (`.admin-month-picker`). Isian teks "3, 6, 9, 12" dihapus dari panel. `parseProgramMonths()`
tetap diekspor, tapi sekarang hanya untuk jalur impor dan seed, bukan untuk panel.

Field baru `startDate` dan `endDate` sebagai `<input type="date">`. Keduanya disimpan sebagai string
kosong saat dikosongkan, **bukan dihilangkan dari payload**. Menghilangkan kunci pada `updateDoc`
berarti "jangan diubah", dan itu membuat tanggal yang batal mustahil dihapus.

Validasi dipisah jadi `validateOrganizationValues()` dengan dua tingkat:

| Tingkat | Kasus | Perilaku |
|---|---|---|
| `errors` | `endDate` < `startDate`, tanggal tidak sah, `endDate` tanpa `startDate`, nama kosong | simpan dibatalkan |
| `warnings` | tanggal di luar `agendaYear`, program tanpa bulan maupun tanggal | simpan tetap jalan |

Pembagian ini disengaja. Menolak kegiatan lintas periode akan memaksa pengurus mengarang tanggal,
dan tanggal karangan lebih buruk daripada kolom kosong yang jujur.

Dua turunan otomatis di `buildOrganizationPayload()`: bulan dari `startDate` ditambahkan ke `months`,
dan `date` (label manusia) diambil dari `buildProgramSchedule().label` kalau tidak diketik manual.

Pratinjau jadwal dihitung ulang tiap ketikan dan menampilkan tingkat kepastian yang akan dipakai
`/agenda`. `buildOrganizationPayload` ditulis ulang sebagai overload supaya `kind: 'programs'`
menghasilkan tipe `ProgramDocument`, bukan union yang harus dipaksa.

### B1b. Pecah menu

`AdminOrganizationManager` menerima `kind` sebagai prop. Tab internal dan `.admin-tabbar` dibuang.

| Menu | Href |
|---|---|
| Kepengurusan | `/admin/leaders` |
| Program Kerja | `/admin/programs` |
| Divisi | `/admin/divisions` |

Menu "Agenda" diganti "Kegiatan Bertanggal" karena `/agenda` publik sekarang digambar dari
`programs`, bukan dari collection `events`.

### B5. Unggah ImageKit

`POST /api/imagekit-auth` menerbitkan tanda tangan HMAC-SHA1 berumur 240 detik. Gerbangnya ID token
Firebase yang diverifikasi terhadap JWKS publik Google lewat `jose`
(`src/lib/firebase/verify-id-token.ts`), **tanpa** Admin SDK dan tanpa service account. Ini sah di
sini karena proyek tidak punya pendaftaran mandiri maupun anonymous auth, jadi akun Firebase hanya
dimiliki pengurus.

Berkas tidak melewati server kita. Browser mengirim langsung ke `upload.imagekit.io`.

`AdminImageField` dipakai tiga tempat: foto pengurus, cover berita, galeri. Isian URL tetap ada dan
tetap bisa diketik, karena gambar yang sudah di ImageKit tidak perlu diunggah ulang.

### B4. ISR dan revalidasi terarah

`force-dynamic` dibuang dari `/berita` dan `/berita/[slug]`, diganti `revalidate = 300` plus
`generateStaticParams()`. Tanpa `generateStaticParams`, rute dinamis tetap dirender per permintaan
dan `revalidate` tidak berlaku sama sekali.

`POST /api/revalidate` menerima nama kelompok (`articles` atau `organization`), bukan path bebas.
Path bebas dari klien berarti siapa pun yang punya akun bisa menyuruh server membangun ulang halaman
apa saja berulang kali. Dipanggil panel setelah simpan, ubah status, dan hapus.

**Temuan:** `announcements`, `events`, dan `gallery` sudah bisa dikelola dari panel, tapi halaman
publiknya (`/pengumuman`, `/galeri`) masih membaca data statis di `src/data`. Tidak ada satu pun
konsumen publik untuk ketiga collection itu. Karena itu keduanya tidak masuk daftar revalidasi.
Ini pekerjaan tersendiri yang belum ada di roadmap.

---

## 1.5 Bagian B0: verifikasi `firestore.rules` (2026-07-28)

JDK terpasang (`C:\Program Files\Java\jdk-26.0.2`). `npm run test:rules` akhirnya bisa jalan.

**Hasil: 49 tes lolos, 3 berkas** (bukan 35 seperti tertulis di §B0; angka itu salah hitung).
Emulator mengunduh `cloud-firestore-emulator-v1.21.0.jar` sekali lalu memakainya dari cache.
`firestore-debug.log` ditambahkan ke `.gitignore`.

**Catatan penting soal arsitektur.** §B0 menyebut "otorisasi tetap di sisi klien". Itu tidak akurat
dan sempat membuat risikonya terbaca lebih besar dari kenyataan. `hasActiveAdminProfile()` dievaluasi
**oleh Firestore**, bukan oleh browser: ia melakukan `get()` ke `adminUsers/$(uid)` dan memeriksa
`active` serta `role` di sisi server. Jadi lapisan datanya memang sudah dijaga server, dan sekarang
sudah terbukti. Yang benar-benar ada di klien hanyalah `AdminAuthGuard`, dan itu cuma mengatur menu
mana yang terlihat.

### Kebocoran yang ditemukan dan diperbaiki

`email` pengurus ikut disalin ke objek `Leader` di `organization-data.ts`, padahal tidak ada satu pun
halaman publik yang merendernya. Apa pun yang masuk objek itu ikut terserialisasi ke payload RSC dan
terbaca di source HTML. Ini pelanggaran terhadap aturan yang sudah ditulis sendiri di
`src/types/content.ts` soal NIM: tidak dirender bukan berarti tidak terkirim.

Perbaikannya bukan sekadar menghapus satu baris penyalinan, tapi **menghapus `email` dari tipe
`Leader`**. Selama field-nya masih ada di tipe, kebocoran yang sama tinggal satu baris jaraknya.
`LeaderDocument` tetap punya `email` karena panel admin memang mengeditnya, dan panel membaca dokumen
Firestore langsung, bukan lewat `getOrganizationData()`.

Belum ada data pengurus di Firestore saat ini (fallback ke `src/data` masih aktif), jadi tidak ada
email yang pernah benar-benar tersiar.

### Dua risiko yang MASIH terbuka

**1. `email` masih terbaca lewat Firestore langsung.** Aturan `leaders` memakai
`allow read: if isActivePublicRecord()`, dan rules Firestore tidak bisa menyaring per-field. Siapa pun
yang punya config Firebase publik (ada di bundle klien) bisa mengambil seluruh dokumen pengurus
beserta emailnya. Perbaikan yang benar adalah memindahkan `email` ke collection terpisah yang hanya
bisa dibaca `hasActiveAdminProfile()`. Murah dikerjakan **sekarang** karena collection-nya masih
kosong, dan berubah jadi migrasi data begitu 70+ pengurus dimasukkan.

**2. Setiap editor mahakuasa.** `isEditor()` memberi create, update, dan delete pada **semua**
collection. Satu perwakilan bidang bisa menghapus seluruh data pengurus, seluruh program, dan seluruh
berita. Ini B7, dan ia adalah **gerbang sebelum panel dibagikan ke sembilan perwakilan**, bukan
penyempurnaan yang bisa menyusul.

---

## 1.6 Menutup email dan membatasi per bidang (2026-07-28)

Dua risiko di §1.5 sudah ditutup. Tes rules naik dari 49 jadi **71**.

### Email pengurus

Collection baru `leaderContacts/{leaderId}`, idnya sama persis dengan dokumen `leaders`
pasangannya sehingga tidak butuh query maupun field penghubung. Rules-nya tidak punya `allow read`
publik sama sekali.

`email` dihapus dari `LeaderDocument`. Ini penting dibaca sebagai aturan, bukan sekadar perubahan:
**apa pun yang ada di `LeaderDocument` terbaca siapa pun** selama `active == true`, karena rules
Firestore tidak bisa menyaring per-field. `instagram` dan `linkedin` tetap di sana karena keduanya
memang akun publik.

Satu simpan pengurus sekarang menyentuh dua dokumen, dan Firestore tidak menjanjikan keduanya
berhasil bersamaan. Urutannya disengaja: dokumen pengurus dulu, kontak belakangan. Sisa dari
kegagalan adalah pengurus tanpa email, yang bisa diperbaiki dengan menyimpan ulang. Urutan terbalik
menyisakan email tanpa pemilik, dan tidak ada layar yang bisa menampilkannya.

Penghapusan pengurus ikut menghapus kontaknya. Firestore tidak punya cascade.

### Pembatasan per bidang

Kebijakan yang dipilih Reeyza: **editor hanya menyentuh pengurus dan program bidangnya sendiri.**
Berita tetap boleh ditulis semua editor. Divisi dan pengaturan khusus superadmin.

`adminUsers` dapat field `divisionCode`. Fungsi rules yang baru:

| Fungsi | Guna |
|---|---|
| `adminDivisionCode()` | bidang akun, lewat `.get('divisionCode', '')` karena superadmin tidak punya field itu dan akses field yang tidak ada menggagalkan seluruh evaluasi |
| `canManageDivision(code)` | superadmin bebas; editor harus cocok, dan string kosong selalu ditolak |
| `ownsDivisionChange()` | memeriksa **kedua sisi** perubahan |

Pemeriksaan dua arah itu yang menutup dua serangan sekaligus: menarik pengurus bidang lain ke bidang
sendiri, dan membuang anggota sendiri ke bidang orang lain. Keduanya punya tes.

Dokumen tanpa `divisionCode` dan editor tanpa bidang sama-sama jatuh ke string kosong dan **ditolak**,
bukan dianggap cocok. Data yatim urusan superadmin, bukan celah yang bisa diklaim editor mana pun.

`divisions` jadi superadmin saja. Kode divisi di sana yang menentukan batas wewenang semua editor,
jadi membiarkan editor mengubahnya sama dengan membiarkan mereka menggeser pagarnya sendiri.

### Halaman `/admin/users`

Superadmin bisa menetapkan role dan bidang tiap akun tanpa membuka konsol Firebase.

Halaman ini **tidak membuat akun**. Pembuatan akun Firebase Authentication butuh kewenangan yang
tidak dimiliki klien, dan `signInWithEmailAndPassword` dari SDK klien akan mengeluarkan superadmin
dari sesinya sendiri. Akun tetap dibuat di konsol, dokumen `adminUsers`-nya diatur di sini.

Panel juga menyesuaikan: editor hanya melihat baris bidangnya, pemilih divisinya terkunci, dan editor
yang belum ditugaskan mendapat pesan yang menjelaskan sebabnya alih-alih form yang pasti gagal.
Semua itu kenyamanan; yang benar-benar menjaga data tetap `firestore.rules`.

---

## 1.7 Seed Firestore dan panel realtime (2026-07-28)

### Diagnosis: kenapa panel terasa tidak berguna

Firestore praktis kosong: `divisions` 0, `leaders` 0, `programs` 0, `articles` 1.

Penyebab sebenarnya bukan realtime, melainkan gerbang di `organization-data.ts`: **kalau `divisions`
kosong, SELURUH data organisasi jatuh ke fallback `src/data`.** Jadi pengurus yang ditambahkan lewat
panel memang tersimpan, tapi tidak pernah dipakai halaman publik selama divisinya belum ada. Ini
jebakan yang tidak akan pernah terbaca dari gejalanya.

### `npm run seed`

`scripts/seed-firestore.ts`, memakai Admin SDK dengan `service-account.json` (sudah di `.gitignore`).

Idempoten karena **id dokumen diturunkan dari slug nama, bukan diarang Firestore**. Id acak dari
`addDoc` membuat script semacam ini mustahil diulang: jalankan dua kali, dapat dua Latif. Nama yang
kebetulan sama diberi akhiran angka, bukan dibiarkan saling menimpa.

`createdAt` tidak pernah ditimpa saat memperbarui. Rules menuntutnya tidak berubah, dan menimpanya
menghapus jejak kapan data itu pertama masuk.

`startDate` dan `endDate` ikut ditulis sebagai string kosong meski Buku Panduan tidak punya tanggal
pasti. Ini yang dimaksud peringatan B6: tanpa field itu, dokumen hasil seed dan dokumen buatan panel
punya bentuk berbeda, dan kolom tanggal jadi tidak bisa dikosongkan.

Ada `--dry-run`. Hasil jalan pertama: **8 divisi, 71 pengurus, 37 program**. Sudah diverifikasi
terbaca publik, dan `email` tidak ikut karena memang tidak lagi ada di `LeaderDocument`.

### Panel jadi realtime

`subscribeToContentDocuments()` menggantikan `listContentDocuments()` di `AdminOrganizationManager`
dan `AdminContentListPage`. Panel dipegang beberapa pengurus sekaligus; dengan `getDocs` sekali
jalan, dua orang yang bekerja bersamaan tidak pernah melihat perubahan satu sama lain sampai halaman
dimuat ulang, dan keduanya bisa mengedit baris yang sama dari kondisi awal berbeda.

Efek sampingnya seluruh `await loadItems()` setelah simpan dan hapus jadi tidak perlu: perubahan
sendiri kembali lewat listener yang sama.

### Soal "login tanpa Firestore"

Permintaannya: editor cukup login, tanpa dokumen `adminUsers` yang dibuat manual.

Menghapus pemeriksaannya bukan jawabannya. Dokumen itu **adalah** otorisasinya, dan tanpa itu rules
tidak punya cara membedakan editor dari orang asing, sehingga pembatasan per-bidang di §1.6 hangus.

Jawaban yang benar adalah **custom claims**: `role` dan `divisionCode` ditempelkan ke token, rules
membacanya lewat `request.auth.token` tanpa `get()` sama sekali. Lebih murah juga, karena tiap `get()`
di rules adalah satu operasi baca berbayar. Ini B3, dan blokirnya (service account) sudah hilang.

---

## 1.8 Custom claims: login tanpa dokumen Firestore (2026-07-28)

Menjawab §1.7. Wewenang pindah dari dokumen `adminUsers` ke custom claims di ID token.

### Yang berubah

**`firestore.rules`.** `hasActiveAdminProfile()` dan `adminDivisionCode()` tidak lagi memanggil
`get()`. Keduanya membaca `request.auth.token.get('role', '')` dan `.get('divisionCode', '')`.
Nilai bawaan dipakai, bukan akses field langsung: token tanpa claims adalah keadaan normal
(pengunjung biasa), dan akses field yang tidak ada membuat seluruh aturan gagal dievaluasi.

Akun nonaktif tidak mendapat `role` sama sekali, bukan role dengan bendera mati. Rules jadi cukup
bertanya sekali, tanpa bendera kedua yang bisa terlupa di salah satu cabang.

`adminUsers` sekarang `allow write: if false` untuk semua orang, superadmin termasuk. Dokumen yang
berubah tanpa claims yang ikut berubah adalah daftar yang berbohong soal wewenang.

**`src/lib/admin/claims.ts`.** Bentuk claims dan penerjemahannya, murni tanpa Firebase, 13 tes unit.
`buildAdminClaims()` dipakai rute API dan script sinkronisasi, jadi keduanya mustahil menyimpang.

**`src/lib/firebase/admin-app.ts`.** Admin SDK, `server-only`. Kredensial dari
`FIREBASE_SERVICE_ACCOUNT` (JSON atau base64), jatuh ke `service-account.json` untuk lokal. Base64
didahulukan karena `private_key` punya baris baru, dan sebagian panel env memotongnya diam-diam.

**`src/app/api/admin/accounts/route.ts`.** POST membuat akun, PATCH mengubah role/bidang/status.
Keduanya menyetel claims lebih dulu, baru dokumen direktorinya: kegagalan di tengah meninggalkan
wewenang yang benar dengan daftar yang tertinggal, bukan sebaliknya.

Kata sandi tidak pernah lewat sini. Akun dibuat dengan sandi acak yang tidak ditampilkan ke siapa
pun, lalu server menerbitkan tautan penyetelan sandi. Sandi yang diketik satu orang untuk dipakai
orang lain adalah sandi yang bocor sejak lahir.

Email yang sudah terdaftar dipakai ulang, bukan ditolak. Pengurus yang aksesnya pernah dicabut tetap
punya akun Firebase-nya, dan memaksa email baru untuk mengembalikan akses tidak masuk akal.

**`requireSuperadmin()`.** Berlapis dua, dan lapisan kedua bukan hiasan. Jalur utama membaca claims.
Akun tanpa claims masih boleh lewat kalau dokumen `adminUsers`-nya menyebut superadmin aktif, dibaca
dengan Admin SDK di server. Tanpa jalan itu, proyek yang baru pindah ke claims terkunci rapat: tidak
ada satu pun akun yang bisa membuat akun pertama.

**`getAdminSession()`** menggantikan `getAdminUserProfile()`. Sesi disusun dari token dan objek
pengguna Firebase, tanpa menyentuh Firestore. Token disegarkan paksa sekali di awal sesi, karena
claims baru tidak muncul di token lama sampai kedaluwarsa, dan tanpa itu editor yang baru ditugaskan
melihat panelnya menolak dia selama hampir satu jam tanpa sebab yang kelihatan.

Akun lama yang belum disinkronkan tetap bisa membuka panel lewat jalur cadangan, dengan spanduk
peringatan. Tanpa spanduk itu, gejalanya adalah bentuk kebingungan yang paling melelahkan: panel
terbuka lengkap, tiap simpan ditolak, tidak ada sebab yang kelihatan.

**`/admin/users`** kini membuat akun, realtime, dan seluruh perubahannya lewat API.

### Urutan penerapan, tidak boleh dibalik

```powershell
npm run sync:claims -- --dry-run
npm run sync:claims
npx firebase-tools deploy --only firestore:rules
```

Rules yang disebar lebih dulu akan mencabut akses semua akun serentak, termasuk superadmin yang
seharusnya memperbaiki keadaan. Sudah dijalankan 2026-07-28 untuk `admin@hmte.ugm.com` (superadmin);
penyebaran rules menyusul, dilakukan Reeyza.

### Verifikasi

`tsc` bersih, lint bersih, build sukses. 85 tes unit, 75 tes rules.

Dua tes rules baru yang menjaga seluruh pindahan ini tetap bermakna:

- dokumen `adminUsers` bertuliskan superadmin, tanpa claims, tetap ditolak Firestore. Kalau ini
  lolos, rules diam-diam masih membaca dokumen dan penghematannya tidak pernah terjadi.
- claims editor tanpa dokumen `adminUsers` sama sekali tetap bisa menulis program bidangnya. Kalau
  ini gagal, editor masih disandera dokumen buatan tangan, yaitu keluhan yang memulai semua ini.

---

## §1.9 Sinkronasi frontend-backend (2026-07-28)

### Penyebab "sudah dihapus tapi masih tampil"

`mergeLeaderRecords()` di `src/lib/organization-data.ts` menggabungkan roster lokal
`ASSET/anggota-hmte.md` dengan Firestore **sebagai gabungan himpunan**. Firestore hanya bisa
menambah dan menimpa, tidak pernah mengurangi. Akibatnya menghapus pengurus lewat panel tidak
berpengaruh apa pun: namanya masuk lagi dari roster pada render berikutnya.

Fungsinya diganti `enrichLeadersFromRoster()`. Arahnya sekarang satu jalan: Firestore menentukan
SIAPA, roster hanya mengisi kolom kosong milik orang yang sudah ada di Firestore.

Tiga akibat yang mengikat:

1. **`batch` sekarang field sungguhan.** Sebelumnya angkatan hanya hidup selama roster menaungi
   Firestore. Sekarang ada di `LeaderDocument`, di form `/admin/leaders`, dan di script seed.
2. **`npm run seed` tidak lagi menghidupkan yang sudah dihapus.** Dokumen yang hilang dari
   collection yang sudah terisi dianggap sengaja dihapus dan dilewati. Pakai `--allow-new` untuk
   memaksa. Dijalankan 2026-07-28: 70 diperbarui, 1 dilewati (tepat orang yang dihapus Reeyza).
3. **Seed tidak lagi mengosongkan field.** Nilai string kosong dibuang sebelum memperbarui dokumen
   yang sudah ada, karena roster tidak punya foto maupun bio dan `merge: true` tidak menolong:
   string kosong tetap sebuah nilai. Tanpa ini, satu kali seed ulang menghapus setiap foto yang
   sudah diunggah lewat panel.

Isian **LinkedIn** juga ditambahkan ke form pengurus. Payload sudah menulis `values.linkedin` sejak
awal padahal isiannya tidak pernah ada, jadi setiap penyimpanan diam-diam mengosongkannya.

### `/admin/settings` berfungsi

Dulu kerangka kosong bertuliskan "akan didefinisikan setelah model Firestore siap". Sekarang
mengelola `settings/site`: nama kabinet, periode, tahun papan agenda, tagline, Instagram, email,
konteks lembaga, dan semboyan penutup.

Yang dipindahkan ke sana adalah teks yang berulang di seluruh situs dan berganti bersamaan tepat
sekali setahun. Sebelum ini pergantian kepengurusan berarti menyunting kode lalu deploy ulang.

- `src/lib/site-settings.ts` murni tanpa Firebase, jadi `program-schedule` tetap boleh mengimpornya.
- `getSiteSettings()` **tidak pernah gagal**: dokumen belum ada, rules belum disebar, atau Firestore
  mati semuanya jatuh ke nilai bawaan yang sama persis dengan teks lama.
- Setiap field jatuh ke bawaan **satu per satu**, bukan seluruh objek. Dokumen setengah terisi
  adalah keadaan normal.
- `agendaYear` di luar 2000-2100 ditolak. Papan `/agenda` memakainya sebagai sumbu; satu nilai liar
  membuat seluruh program terbaca di luar tahun papan dan halamannya kosong tanpa error.
- `ProgramCatalog` menerima `year` sebagai prop. Ia berjalan di browser, dan membaca sendiri berarti
  satu permintaan Firestore per pengunjung untuk angka yang sudah diketahui server.

**Rules berubah:** `settings/site` kini `allow read: if true`. Dipisah per dokumen, bukan seluruh
collection, supaya dokumen pengaturan lain tidak ikut terbuka. Dua tes rules menjaga keduanya.

### Editor artikel

`window.prompt` dihapus seluruhnya. Menyisipkan gambar dulu berarti tiga kotak dialog beruntun yang
tidak bisa dibatalkan setengah jalan. Gantinya panel di dalam halaman, plus: unggah gambar langsung
(jalur yang sama dengan `AdminImageField`), menu apung di atas teks tersorot, `Ctrl+K` untuk tautan,
mode fokus layar penuh, blok kode, garis pemisah, dan penghitung kata plus waktu baca yang memakai
rumus yang sama dengan halaman publik.

Toolbar jadi lengket dan tombolnya dibesarkan dari 8px ke 10px. Batasnya tetap
`sanitizeArticleContent`: tidak ada tombol yang menghasilkan tag di luar daftar itu.

### `/divisi` dilebur ke `/kepengurusan`

Dua halaman indeks untuk ruangan yang sama, masing-masing dengan hero dan logo kabinet sendiri, dan
dua entri navigasi ("Pengurus & Departemen" dan "Pengurus") yang harus ditebak pengunjung.

Sekarang satu halaman, urutannya mengikuti cara orang bertanya: papan delapan bidang dulu, lalu
direktori orang yang bisa dicari. Rincian bidang tetap di `/divisi/[slug]`; yang dihapus halaman
daftarnya, bukan bidangnya.

`/divisi` jadi `permanentRedirect` (308), bukan dihapus. Alamat itu ada di kaki halaman versi lama,
di sitemap yang sudah dirayapi, dan di tautan yang sudah dibagikan.

`/api/revalidate` sekalian diperbaiki: kelompok `organization` sebelumnya tidak pernah menyegarkan
`/divisi/[slug]`, `/pengurus/[slug]`, maupun `/program-kerja/[slug]` karena rute dinamis butuh
`revalidatePath(path, 'page')`.

### Sampul berita

Berita tanpa sampul dulu memakai satu foto buatan mesin yang sama untuk semuanya. Satu gambar yang
berulang di seluruh feed lebih buruk daripada tidak ada gambar: pembaca membacanya sebagai "semua
berita ini tentang hal yang sama".

Gantinya `<ArticleCover>`, yang menggambar bidang abstrak dari `HeroBackdrop` ketika `coverImage`
kosong. Lima bentuk dasar dikali empat cerminan sumbu, dipilih dari hash slug, jadi dua puluh
kemungkinan yang deterministik. Deterministik itu syarat, bukan kemewahan: hasil yang berbeda antara
server dan browser membuat React melaporkan ketidakcocokan hidrasi di setiap kartu.

`og:image` dihilangkan kalau tidak ada sampul, karena tidak ada pengambil pratinjau tautan yang bisa
merender SVG kita.

### Yang masih terbuka

- `announcements`, `events`, `gallery` tetap tanpa konsumen publik. `/pengumuman` dan `/galeri`
  masih membaca `src/data`.
- Data berita statis di `src/data/articles.ts` yang menyuapi `NewsAgenda` di beranda masih memakai
  gambar buatan mesin. Itu isi contoh, bukan sampul cadangan, jadi di luar cakupan perbaikan ini.
- `AdminGalleryManager`, `AdminAspirationsManager`, `AdminDashboard` masih `getDocs`, bukan
  `onSnapshot`.
