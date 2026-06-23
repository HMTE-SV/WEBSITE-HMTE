import Link from 'next/link'
import { divisions } from '@/data/divisions'

export function DivisionsGrid() {
  return (
    <section className="section-band bg-paper py-16 md:py-20">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Bidang</p>
            <h2 className="mt-3 text-3xl font-black text-navy md:text-5xl">
              Delapan bidang kerja HMTE.
            </h2>
          </div>
          <Link href="/divisi" className="text-sm font-black text-navy underline decoration-gold decoration-4 underline-offset-4">
            Lihat semua
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {divisions.map((division) => (
            <article className="playful-card p-5" key={division.code}>
              <span className="inline-flex rounded-[8px] bg-gold px-2.5 py-1 text-xs font-black text-ink">
                {division.shortName}
              </span>
              <h3 className="mt-4 text-xl font-black text-navy">{division.name}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate">
                {division.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
