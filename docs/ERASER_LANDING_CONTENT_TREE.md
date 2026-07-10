# HMTE Landing Content Tree

Tempel blok ini ke **Eraser → Insert → Diagram-as-code → Flow chart**.

Diagram memakai satu sampel yang benar untuk setiap card/slug berulang. Cabang dibuat independen agar garis tidak saling menyilang ketika dirender oleh Eraser.

```text
direction down
colorMode pastel
styleMode plain
typeface clean

Landing [shape: oval, label: "LANDING PAGE /", color: "#011f4b"]

LandingContent [label: "SECTION LANDING", color: blue] {
  NewsSection [label: "Kabar dan Kegiatan HMTE"]
  DivisionSection [label: "Bidang dan Divisi"]
  CTASection [label: "CTA"]
}

NewsBranch [label: "CABANG KABAR", color: green] {
  LatestNews [label: "Berita Terkini"]
  NewsPage [label: "Page /berita"]
  ArticleCard [label: "Card berita | Sosialisasi Praktik Industri Mahasiswa Teknologi Rekayasa Elektro (TRE) UGM", color: gray]
  ArticleSlug [label: "Slug page /berita/sosialisasi-praktik-industri-mahasiswa-teknologi-rekayasa-elektro-tre-ugm", color: orange]
}

DivisionBranch [label: "CABANG DIVISI — CONTOH IPTEK", color: green] {
  DivisionCard [label: "Card divisi | Ilmu Pengetahuan dan Teknologi (IPTEK)", color: gray]
  DivisionSlug [label: "Slug page /divisi/iptek", color: orange]

  ProgramList [label: "Program Kerja"]
  ProgramCard [label: "Card program | Workshop Embedded & IoT", color: gray]
  ProgramSlug [label: "Slug page /program-kerja/workshop-embedded-iot", color: orange]

  MemberList [label: "Daftar Anggota"]
  MemberCard [label: "Card anggota | Irfan Bachdim — Ketua Bidang", color: gray]
  MemberSlug [label: "Slug page profil /pengurus/irfan-bachdim", color: orange]
}

CTABranch [label: "CABANG CTA", color: green] {
  AspirationButton [label: "Button | Sampaikan Aspirasi", color: gray]
  AspirationPage [label: "Page /aspirasi"]
  ContactButton [label: "Button | Hubungi Pengurus", color: gray]
  ContactPage [label: "Page /kontak"]
}

Landing > NewsSection, DivisionSection, CTASection

NewsSection > LatestNews > NewsPage > ArticleCard > ArticleSlug

DivisionSection > DivisionCard > DivisionSlug
DivisionSlug > ProgramList, MemberList
ProgramList > ProgramCard > ProgramSlug
MemberList > MemberCard > MemberSlug

CTASection > AspirationButton > AspirationPage
CTASection > ContactButton > ContactPage

legend [position: bottom-left] {
  [color: blue, label: "Section di Landing"]
  [color: green, label: "Cabang konten"]
  [color: gray, label: "Card atau button"]
  [color: orange, label: "Slug page"]
}
```

