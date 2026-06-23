import Link from 'next/link'
import { identity } from '@/data/organization'

export function AboutIntro() {
  return (
    <section className="bg-cloud py-16 md:py-20">
      <div className="container-page grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div>
          <p className="eyebrow">Tentang HMTE</p>
          <h2 className="mt-3 text-3xl font-black text-navy md:text-5xl">
            Organisasi mahasiswa untuk ruang belajar dan kontribusi.
          </h2>
        </div>
        <div className="grid gap-5 text-base font-semibold leading-relaxed text-graphite">
          <p>
            {identity.org} menjadi wadah mahasiswa {identity.program} untuk
            mengelola kegiatan, memperkuat kompetensi, dan menyambungkan
            kebutuhan mahasiswa dengan program studi.
          </p>
          <p>
            Website ini disiapkan sebagai kanal informasi resmi untuk profil
            organisasi, program kerja, berita, agenda, galeri, dan aspirasi.
          </p>
          <Link href="/divisi" className="w-fit rounded-[8px] border-2 border-navy bg-sand px-4 py-2 text-sm font-black text-navy shadow-[4px_4px_0_#062657]">
            Kenali Divisi
          </Link>
        </div>
      </div>
    </section>
  )
}
