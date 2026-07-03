import Image from 'next/image'
import Link from 'next/link'
import { heroActivityImages } from '@/data/site-content'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'

type HMTEMomentumProps = {
  divisions: Division[]
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

export function HMTEMomentum({ divisions, leadersByDivision, programsByDivision }: HMTEMomentumProps) {
  const members = Object.values(leadersByDivision).flat()
  const programs = Object.values(programsByDivision).flat()
  const activePrograms = programs.filter((program) => program.status === 'Sedang Berjalan')

  const stats = [
    { value: divisions.length, label: 'bidang bergerak bersama' },
    { value: members.length, label: 'pengurus dalam satu periode' },
    { value: programs.length, label: 'program kerja terdata' },
    { value: activePrograms.length, label: 'sedang berjalan sekarang' },
  ]

  return (
    <section className="hmte-momentum" id="hmte-dalam-gerak">
      <div className="hmte-momentum-shell">
        <header className="hmte-momentum-head">
          <span className="hmte-momentum-eyebrow">HMTE dalam gerak</span>
          <h2>Organisasi terasa hidup ketika dampaknya terlihat.</h2>
          <p>
            Bukan deretan logo mitra. Ini potret skala kerja HMTE—siapa yang bergerak, apa yang dikerjakan,
            dan momen yang lahir dari prosesnya.
          </p>
        </header>

        <div className="hmte-momentum-stats" aria-label="HMTE dalam angka">
          {stats.map((stat, index) => (
            <div className="hmte-momentum-stat" key={stat.label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="hmte-momentum-moments">
          <div className="hmte-momentum-caption">
            <span>Momen yang dibangun bersama</span>
            <Link href="/galeri">Buka galeri lengkap <span aria-hidden="true">→</span></Link>
          </div>
          <div className="hmte-momentum-strip">
            {heroActivityImages.map((image, index) => (
              <figure key={image.src}>
                <Image src={image.src} alt={image.alt} fill sizes="(max-width: 700px) 74vw, 32vw" />
                <figcaption>{String(index + 1).padStart(2, '0')} / HMTE</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="hmte-momentum-live">
          <span>Sedang berjalan</span>
          <div>
            {activePrograms.slice(0, 4).map((program) => (
              <p key={program.name}>{program.name}</p>
            ))}
          </div>
          <Link href="/program-kerja">Lihat seluruh program kerja</Link>
        </div>
      </div>
    </section>
  )
}
