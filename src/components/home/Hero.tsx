import Link from 'next/link'
import { identity } from '@/data/organization'

export function Hero() {
  return (
    <section className="bg-navy text-cloud">
      <div className="container-page grid min-h-[calc(100dvh-5rem)] items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-3xl animate-rise">
          <p className="inline-flex rounded-[8px] bg-gold px-3 py-1 text-sm font-black text-ink">
            {identity.program} - {identity.faculty}
          </p>
          <h1 className="mt-6 text-5xl font-black leading-[0.98] text-cloud sm:text-6xl lg:text-7xl">
            HMTE TRE SV UGM
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-haze">
            Rumah organisasi mahasiswa elektro vokasi untuk belajar, berkarya,
            mengelola aspirasi, dan membangun jejaring yang bermanfaat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/program-kerja"
              className="rounded-[8px] border-2 border-gold bg-gold px-5 py-3 text-sm font-black text-ink shadow-[5px_5px_0_#020f27] transition hover:-translate-y-0.5"
            >
              Lihat Program
            </Link>
            <Link
              href="/kepengurusan"
              className="rounded-[8px] border-2 border-cloud px-5 py-3 text-sm font-black text-cloud transition hover:bg-cloud hover:text-navy"
            >
              Kepengurusan
            </Link>
          </div>
        </div>

        <div className="playful-card-gold p-5 text-ink">
          <p className="text-sm font-black uppercase">Kabinet aktif</p>
          <div className="mt-5 grid gap-3">
            {['Media organisasi', 'Program keilmuan', 'Aspirasi mahasiswa', 'Relasi dan prestasi'].map((item) => (
              <div className="rounded-[8px] border-2 border-navy bg-cloud px-4 py-3 font-extrabold" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
