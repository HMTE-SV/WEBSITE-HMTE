import Link from 'next/link'
import { programsByDivision } from '@/data/programs'

const flagshipPrograms = Object.entries(programsByDivision)
  .flatMap(([division, programs]) =>
    programs.slice(0, 1).map((program) => ({
      ...program,
      division,
    })),
  )
  .slice(0, 4)

export function FlagshipPrograms() {
  return (
    <section className="bg-cloud py-16 md:py-20" id="unggulan">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="eyebrow">Program Unggulan</p>
          <h2 className="mt-3 text-3xl font-black text-navy md:text-5xl">
            Agenda utama yang membawa dampak langsung.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {flagshipPrograms.slice(0, 4).map((program) => (
            <article className="playful-card p-6" key={`${program.division}-${program.name}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-[8px] bg-navy px-2.5 py-1 text-xs font-black text-cloud">
                  {program.division}
                </span>
                <span className="rounded-[8px] bg-joy-sky-100 px-2.5 py-1 text-xs font-black text-navy">
                  {program.date}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-navy">{program.name}</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate">
                {program.desc}
              </p>
            </article>
          ))}
        </div>
        <Link href="/program-kerja" className="mt-8 inline-flex rounded-[8px] border-2 border-navy bg-gold px-5 py-3 text-sm font-black text-ink shadow-[4px_4px_0_#062657]">
          Buka Roadmap
        </Link>
      </div>
    </section>
  )
}
