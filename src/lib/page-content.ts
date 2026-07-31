export const pageKeys = ['home', 'contact'] as const
export type PageKey = (typeof pageKeys)[number]
export type PageFieldType = 'text' | 'textarea' | 'url'

export type PageContentFieldDefinition = {
  key: string
  label: string
  type: PageFieldType
  help?: string
}

export type PageContentSectionDefinition = {
  id: string
  label: string
  description: string
  lockedPosition?: boolean
  fields: PageContentFieldDefinition[]
  mediaSlotKeys: string[]
  defaults: Record<string, string>
}

export type PageDefinition = {
  key: PageKey
  label: string
  path: string
  description: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  sections: PageContentSectionDefinition[]
}

export type PageContentSection = {
  id: string
  label: string
  visible: boolean
  order: number
  fields: Record<string, string>
}

export type PageContent = {
  pageKey: PageKey
  seoTitle: string
  seoDescription: string
  sections: PageContentSection[]
  /** Pilihan media privat saat draft; URL publik tetap diproyeksikan melalui mediaSlots. */
  mediaAssignments: Record<string, string>
}

const text = (key: string, label: string, help?: string): PageContentFieldDefinition => ({ key, label, type: 'text', help })
const area = (key: string, label: string, help?: string): PageContentFieldDefinition => ({ key, label, type: 'textarea', help })
const url = (key: string, label: string, help?: string): PageContentFieldDefinition => ({ key, label, type: 'url', help })

export const pageDefinitions: Record<PageKey, PageDefinition> = {
  home: {
    key: 'home',
    label: 'Beranda',
    path: '/',
    description: 'Pembuka interaktif, cerita HMTE, ruang kabar, struktur, dokumentasi, dan CTA.',
    defaultSeoTitle: 'HMTE TRE SV UGM - Elektro... Satu!!!',
    defaultSeoDescription: 'Website resmi HMTE TRE SV UGM untuk informasi organisasi, kegiatan mahasiswa, program kerja, prestasi, dan kolaborasi.',
    sections: [
      {
        id: 'hero',
        label: 'Pembuka interaktif',
        description: 'Layar pilihan masuk dan pengalaman scroll sebelum navigasi utama.',
        lockedPosition: true,
        mediaSlotKeys: Array.from({ length: 6 }, (_, index) => `home.hero.${index + 1}`),
        fields: [
          text('heroTitle', 'Judul aksesibilitas'), text('brandLabel', 'Label identitas'), text('systemStatus', 'Status sistem'),
          text('arrivalTitle', 'Judul pilihan masuk'), area('arrivalBody', 'Penjelasan pilihan masuk'),
          text('quickKicker', 'Kicker jalur cepat'), text('quickTitle', 'Judul jalur cepat'), area('quickBody', 'Penjelasan jalur cepat'),
          text('storyKicker', 'Kicker jalur cerita'), text('storyTitle', 'Judul jalur cerita'), area('storyBody', 'Penjelasan jalur cerita'),
          text('footerLine', 'Catatan bawah'), text('footerHint', 'Petunjuk keyboard'),
          text('confirmKicker', 'Status konfirmasi'), text('confirmTitle', 'Judul konfirmasi'), text('confirmBody', 'Isi konfirmasi'),
          text('storyLabel', 'Label pengalaman'), text('scrollGuide', 'Petunjuk scroll'),
        ],
        defaults: {
          heroTitle: 'Himpunan Mahasiswa Teknik Elektro', brandLabel: 'Situs resmi HMTE', systemStatus: 'Siap dibuka',
          arrivalTitle: 'Masuk sesuai kebutuhanmu.', arrivalBody: 'Buka kabar terbaru sekarang, atau ikuti cerita kabinet melalui pengalaman scroll. Keduanya menuju situs HMTE yang sama.',
          quickKicker: 'Butuh cepat?', quickTitle: 'Langsung ke berita', quickBody: 'Lewati pembuka dan lihat kabar terbaru.',
          storyKicker: 'Punya waktu?', storyTitle: 'Ikuti cerita HMTE', storyBody: 'Gulir pelan untuk membuka pembuka interaktif.',
          footerLine: 'Tidak ada pilihan yang salah.', footerHint: 'Gunakan tombol Tab dan Enter jika kamu memakai keyboard.',
          confirmKicker: 'Jalur cepat aktif', confirmTitle: 'Membuka kabar HMTE', confirmBody: 'Informasi terbaru sudah di depan.',
          storyLabel: 'Cerita HMTE', scrollGuide: 'Gulir untuk membuka cerita',
        },
      },
      {
        id: 'about', label: 'Tentang HMTE', description: 'Prolog dan tiga bab cerita HMTE.',
        mediaSlotKeys: Array.from({ length: 5 }, (_, index) => `home.about.${index + 1}`),
        fields: [
          text('kicker', 'Kicker'), text('introLabel', 'Label bab pembuka'), text('titleLine1', 'Judul baris 1'), text('titleLine2', 'Judul baris 2'), area('body', 'Paragraf pembuka'),
          text('step1Label', 'Bab 1 · label'), text('step1Title', 'Bab 1 · judul'), area('step1Body', 'Bab 1 · isi'),
          text('step2Label', 'Bab 2 · label'), text('step2Title', 'Bab 2 · judul'), area('step2Body', 'Bab 2 · isi'),
          text('step3Label', 'Bab 3 · label'), text('step3Title', 'Bab 3 · judul'), area('step3Body', 'Bab 3 · isi'),
          text('finaleLine', 'Penutup utama'), text('finaleCaption', 'Caption penutup'), text('scrollHint', 'Petunjuk scroll'),
        ],
        defaults: {
          kicker: 'Tentang HMTE', introLabel: 'Pembuka', titleLine1: 'Rumah untuk', titleLine2: 'bertumbuh bersama.',
          body: 'HMTE adalah organisasi kemahasiswaan resmi di bawah Program Studi Teknologi Rekayasa Elektro, Sekolah Vokasi, Universitas Gadjah Mada.',
          step1Label: 'Siapa kami', step1Title: 'Wadah mahasiswa Teknologi Rekayasa Elektro.', step1Body: 'HMTE menjadi ruang pengembangan diri, penyaluran aspirasi, forum diskusi, dan inkubator gagasan yang melengkapi proses pendidikan formal mahasiswa.',
          step2Label: 'Visi', step2Title: 'Nyaman. Inovatif. Produktif.', step2Body: 'Menjadikan HMTE sebagai rumah bertumbuh yang nyaman, inovatif, dan produktif untuk berkembang bersama, serta memberikan kontribusi dan dampak yang lebih luas bagi anggota, lingkungan kampus, dan masyarakat.',
          step3Label: 'Misi', step3Title: 'Terbuka. Relevan. Kolaboratif. Berdampak.', step3Body: 'Membangun lingkungan yang suportif dan inklusif; mengoptimalkan media informasi; menghadirkan pengembangan diri yang relevan; memberi pengalaman organisasi yang bermakna bagi mahasiswa baru; serta mendorong program kolaboratif yang berdampak.',
          finaleLine: 'Abya Vistara.', finaleCaption: 'Kabinet HMTE · Periode {{period}}', scrollHint: 'Scroll · cerita berlanjut',
        },
      },
      {
        id: 'news', label: 'Ruang kabar', description: 'Copy kondisi arsip terisi dan kosong.', mediaSlotKeys: [],
        fields: [
          text('kicker', 'Kicker'), text('publishedTitle', 'Judul saat ada berita'), area('publishedLead', 'Lead saat ada berita'), text('publishedAction', 'Tombol indeks berita'),
          text('emptyTitle', 'Judul saat kosong'), area('emptyLead', 'Lead saat kosong'), text('emptyIndexAction', 'Tombol indeks saat kosong'), area('emptyBody', 'Isi empty state'),
          text('emptyPrimaryAction', 'Tombol program'), text('emptySecondaryAction', 'Tombol agenda'), text('storyAction', 'Label baca berita'), text('relatedLabel', 'Label berita lain'),
        ],
        defaults: {
          kicker: 'Ruang kabar HMTE', publishedTitle: 'Yang sedang berjalan di HMTE.', publishedLead: 'Catatan resmi kegiatan, prestasi, dan peluang mahasiswa Teknologi Rekayasa Elektro — diverifikasi pengurus sebelum diterbitkan.', publishedAction: 'Semua berita',
          emptyTitle: 'Arsip kabar sedang disiapkan.', emptyLead: 'Publikasi resmi kegiatan, prestasi, peluang, dan gagasan mahasiswa akan hadir setelah informasinya diverifikasi oleh pengurus.', emptyIndexAction: 'Lihat agenda',
          emptyBody: 'Berita yang masih berstatus draft tidak tampil di sini. Sementara menunggu, program kerja dan agenda kabinet sudah bisa dibaca lengkap.', emptyPrimaryAction: 'Jelajahi program kerja', emptySecondaryAction: 'Buka agenda', storyAction: 'Baca cerita', relatedLabel: 'Cerita lain',
        },
      },
      {
        id: 'organization', label: 'Struktur kabinet', description: 'Pengantar switchboard organisasi.', mediaSlotKeys: [],
        fields: [text('kicker', 'Kicker sebelum jumlah'), text('title', 'Judul utama'), text('mutedTitle', 'Judul redup'), area('lead', 'Lead'), text('action', 'Tombol indeks')],
        defaults: { kicker: 'Struktur kabinet', title: 'Pengurus Harian', mutedTitle: ' & departemen', lead: '{{cabinet}} menyatukan Pengurus Harian dan tujuh departemen. Delapan unsur ini bergerak selaras, dengan Pengurus Harian sebagai pusat koordinasi dan penjaga arah organisasi.', action: 'Susunan lengkap' },
      },
      {
        id: 'momentum', label: 'Dinding dokumentasi', description: 'Judul, label foto, kutipan, dan CTA galeri.',
        mediaSlotKeys: Array.from({ length: 6 }, (_, index) => `home.moment.${index + 1}`),
        fields: [
          text('kicker', 'Kicker'), text('title', 'Judul'), area('lead', 'Lead'), area('quote', 'Kutipan tengah'), text('quoteCaption', 'Caption kutipan'),
          ...Array.from({ length: 6 }, (_, index) => text(`photoLabel${index + 1}`, `Label foto ${index + 1}`)),
          text('statsIntro', 'Awalan statistik'), text('divisionLabel', 'Label jumlah unsur'), text('programLabel', 'Label jumlah program'), text('memberLabel', 'Label jumlah pengurus'), text('memberEmpty', 'Teks bila pengurus kosong'), text('galleryAction', 'Tombol galeri'),
        ],
        defaults: {
          kicker: 'Ruang dokumentasi', title: 'Foto resmi akan menempati ruang ini.', lead: 'Visual yang tampil saat ini masih sementara. Dokumentasi aktual {{cabinet}} periode {{period}} akan dipasang setelah aset dan izin publikasinya tersedia.', quote: 'Dokumentasi resmi akan ditempatkan di ruang ini.', quoteCaption: '{{cabinet}} · Periode {{period}}',
          photoLabel1: 'Kebersamaan anggota', photoLabel2: 'Kabinet di kampus', photoLabel3: 'Permainan kelompok', photoLabel4: 'Kegiatan luar ruang', photoLabel5: 'Jaket himpunan', photoLabel6: 'Pengurus 2026/2027',
          statsIntro: 'Kabinet ini bergerak melalui', divisionLabel: 'unsur organisasi', programLabel: 'program kerja', memberLabel: 'nama pengurus telah tercatat.', memberEmpty: 'Daftar nama pengurus menunggu data resmi berikutnya.', galleryAction: 'Buka galeri lengkap',
        },
      },
      {
        id: 'cta', label: 'CTA penutup', description: 'Ajakan aspirasi dan kontak sebelum footer.', mediaSlotKeys: [],
        fields: [text('titleLine1', 'Judul baris 1'), text('titleMuted', 'Judul redup'), text('titleLine3', 'Judul baris 3'), area('body', 'Isi'), text('channelLabel', 'Label kanal'), text('primaryAction', 'Tombol utama'), url('primaryHref', 'Tujuan tombol utama'), text('secondaryAction', 'Tombol kedua'), url('secondaryHref', 'Tujuan tombol kedua')],
        defaults: { titleLine1: 'Terhubung', titleMuted: 'dengan', titleLine3: 'HMTE', body: 'Punya ide, pertanyaan, atau ajakan kolaborasi? HMTE TRE SV UGM terbuka untuk mahasiswa, alumni, dan mitra. Sampaikan aspirasimu atau hubungi pengurus lewat kanal resmi.', channelLabel: 'Kanal resmi', primaryAction: 'Sampaikan aspirasi', primaryHref: '/aspirasi', secondaryAction: 'Hubungi pengurus', secondaryHref: '/kontak' },
      },
    ],
  },
  contact: {
    key: 'contact', label: 'Kontak', path: '/kontak', description: 'Hero kartu pos, pilihan kanal, dan catatan penutup.',
    defaultSeoTitle: 'Kontak HMTE TRE SV UGM', defaultSeoDescription: 'Kanal resmi HMTE Program Studi Teknologi Rekayasa Elektro Sekolah Vokasi UGM.',
    sections: [
      {
        id: 'hero', label: 'Hero kartu pos', description: 'Judul, lead, dan teks kartu pos pembuka.', lockedPosition: true, mediaSlotKeys: [],
        fields: [text('eyebrow', 'Eyebrow'), text('titleLine1', 'Judul baris 1'), text('titleEmphasis', 'Judul beraksen'), area('lead', 'Lead'), text('hint', 'Petunjuk anchor'), area('postcardNote', 'Catatan kartu pos'), text('recipientLabel', 'Label penerima'), text('stampTop', 'Teks stempel atas'), text('stampMain', 'Teks stempel utama'), text('stampBottom', 'Teks stempel bawah'), text('postmarkCity', 'Kota cap pos')],
        defaults: { eyebrow: 'Kanal resmi', titleLine1: 'Apa kabar?', titleEmphasis: 'Ceritakan.', lead: 'Temukan kanal HMTE untuk periode {{period}}, atau gunakan formulir aspirasi di website untuk menyampaikan masukan kepada pengurus.', hint: 'Tiga cara mengirim', postcardNote: 'Untuk {{organization}}, {{cabinet}}.', recipientLabel: 'Kepada:', stampTop: 'HMTE · SV UGM', stampMain: 'TRE', stampBottom: 'Elektro Satu', postmarkCity: 'Yogyakarta' },
      },
      {
        id: 'channels', label: 'Pilihan kanal', description: 'Instagram, aspirasi, dan website resmi.', mediaSlotKeys: ['contact.featured'],
        fields: [
          text('kicker', 'Kicker'), text('titleLine1', 'Judul baris 1'), text('titleLine2', 'Judul baris 2'), text('titleEmphasis', 'Judul beraksen'), area('lead', 'Lead'),
          text('instagramKicker', 'Instagram · kicker'), text('instagramTitle', 'Instagram · judul'), area('instagramBody', 'Instagram · isi'), text('instagramAction', 'Instagram · aksi'), text('instagramImageLine1', 'Instagram · caption 1'), text('instagramImageLine2', 'Instagram · caption 2'),
          text('aspirationKicker', 'Aspirasi · kicker'), text('aspirationTitle', 'Aspirasi · judul'), area('aspirationBody', 'Aspirasi · isi'), text('aspirationAction', 'Aspirasi · aksi'), text('aspirationAddress', 'Aspirasi · penerima'),
          text('websiteKicker', 'Website · kicker'), area('websiteBody', 'Website · isi'), text('websiteAction', 'Website · aksi'),
        ],
        defaults: {
          kicker: 'Pilih jalur kirim', titleLine1: 'Tiga cara agar', titleLine2: 'pesanmu', titleEmphasis: 'sampai.', lead: 'Dua kanal publik berasal dari buku panduan; formulir aspirasi tersedia sebagai fitur website.',
          instagramKicker: 'Kartu pos publik', instagramTitle: 'Instagram', instagramBody: 'Akun Instagram resmi yang dikelola pengurus HMTE.', instagramAction: 'Kunjungi profil', instagramImageLine1: 'Salam dari', instagramImageLine2: 'Elektro!',
          aspirationKicker: 'Surat tertutup', aspirationTitle: 'Kanal Aspirasi', aspirationBody: 'Gunakan formulir internal website untuk menyampaikan aspirasi akademik, fasilitas, organisasi, atau kesejahteraan, dengan nama atau secara anonim.', aspirationAction: 'Tulis suratmu', aspirationAddress: 'u.p. Pengurus HMTE',
          websiteKicker: 'Kanal web resmi', websiteBody: 'Website resmi HMTE.', websiteAction: 'Buka situs resmi',
        },
      },
      {
        id: 'postscript', label: 'Catatan penutup', description: 'Pesan singkat setelah daftar kanal.', mediaSlotKeys: [],
        fields: [text('mark', 'Penanda'), text('titlePrefix', 'Judul biasa'), text('titleEmphasis', 'Judul beraksen'), area('body', 'Isi')],
        defaults: { mark: 'P.S.', titlePrefix: 'Gunakan kanal yang paling sesuai untuk', titleEmphasis: 'pesan atau kebutuhanmu.', body: 'Rincian respons dan tindak lanjut dapat dikonfirmasi langsung kepada pengurus melalui kanal resmi.' },
      },
    ],
  },
}

export function isPageKey(value: string): value is PageKey {
  return (pageKeys as readonly string[]).includes(value)
}

export function getPageDefinition(pageKey: PageKey) {
  return pageDefinitions[pageKey]
}

function safeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function editorialText(value: unknown, fallback: string) {
  return typeof value === 'string' ? value.trim() : fallback
}

export function getDefaultPageContent(pageKey: PageKey): PageContent {
  const definition = getPageDefinition(pageKey)
  return {
    pageKey,
    seoTitle: definition.defaultSeoTitle,
    seoDescription: definition.defaultSeoDescription,
    mediaAssignments: {},
    sections: definition.sections.map((section, order) => ({
      id: section.id, label: section.label, visible: true, order, fields: { ...section.defaults },
    })),
  }
}

export function normalizePageContent(raw: Record<string, unknown> | null | undefined, pageKey: PageKey): PageContent {
  const definition = getPageDefinition(pageKey)
  const defaults = getDefaultPageContent(pageKey)
  const rawSections = Array.isArray(raw?.sections) ? raw.sections : []
  const allowedSlots = new Set(definition.sections.flatMap((section) => section.mediaSlotKeys))
  const rawAssignments = raw?.mediaAssignments && typeof raw.mediaAssignments === 'object'
    ? raw.mediaAssignments as Record<string, unknown>
    : {}

  const normalizedSections = definition.sections.map((sectionDefinition, defaultOrder) => {
      const source = rawSections.find((item) => item && typeof item === 'object' && (item as Record<string, unknown>).id === sectionDefinition.id) as Record<string, unknown> | undefined
      const rawFields = source?.fields && typeof source.fields === 'object' ? source.fields as Record<string, unknown> : {}
      return {
        id: sectionDefinition.id,
        label: sectionDefinition.label,
        visible: typeof source?.visible === 'boolean' ? source.visible : true,
        order: sectionDefinition.lockedPosition ? defaultOrder : Number.isFinite(Number(source?.order)) ? Number(source?.order) : defaultOrder,
        fields: Object.fromEntries(sectionDefinition.fields.map((field) => [field.key, editorialText(rawFields[field.key], sectionDefinition.defaults[field.key] ?? '')])),
      }
    })
  const movable = normalizedSections
    .filter((section) => !definition.sections.find((item) => item.id === section.id)?.lockedPosition)
    .sort((first, second) => first.order - second.order)
  const orderedSections: PageContentSection[] = []
  let movableIndex = 0
  definition.sections.forEach((sectionDefinition, index) => {
    orderedSections[index] = sectionDefinition.lockedPosition
      ? normalizedSections.find((section) => section.id === sectionDefinition.id)!
      : movable[movableIndex++]
  })

  return {
    pageKey,
    seoTitle: safeText(raw?.seoTitle, defaults.seoTitle),
    seoDescription: safeText(raw?.seoDescription, defaults.seoDescription),
    mediaAssignments: Object.fromEntries(
      Object.entries(rawAssignments).filter((entry): entry is [string, string] => allowedSlots.has(entry[0]) && typeof entry[1] === 'string'),
    ),
    sections: orderedSections.map((section, order) => ({ ...section, order })),
  }
}

export function getPageSection(content: PageContent, sectionId: string) {
  const section = content.sections.find((item) => item.id === sectionId)
  if (!section) throw new Error(`Section ${content.pageKey}/${sectionId} tidak ditemukan.`)
  return section
}

export function pageField(content: PageContent, sectionId: string, fieldKey: string) {
  return getPageSection(content, sectionId).fields[fieldKey] ?? ''
}

export function interpolatePageText(value: string, variables: Record<string, string>) {
  return value.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key: string) => variables[key] ?? '')
}
