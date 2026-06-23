import Link from 'next/link'
import { articleCategories } from '@/data/articles'
import { events } from '@/data/events'

const latestArticles = articleCategories['berita-utama'].latest.slice(0, 3)

export function NewsAgenda() {
  return (
    <section className="section-band bg-paper py-16 md:py-20">
      <div className="container-page grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Berita</p>
              <h2 className="mt-3 text-3xl font-black text-navy md:text-5xl">
                Kabar terbaru.
              </h2>
            </div>
            <Link href="/berita" className="text-sm font-black text-navy underline decoration-gold decoration-4 underline-offset-4">
              Semua berita
            </Link>
          </div>
          <div className="mt-8 grid gap-4">
            {latestArticles.map((article) => (
              <article className="rounded-[8px] border-2 border-navy bg-cloud p-5" key={article.title}>
                <span className="text-xs font-black uppercase text-joy-coral-700">{article.category}</span>
                <h3 className="mt-2 text-xl font-black text-navy">{article.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate">{article.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
        <aside className="playful-card-gold p-6">
          <p className="text-sm font-black uppercase text-ink">Agenda</p>
          <div className="mt-5 grid gap-4">
            {events.slice(0, 3).map((event) => (
              <article className="rounded-[8px] border-2 border-navy bg-cloud p-4" key={event.id}>
                <span className="text-xs font-black text-joy-mint-700">{event.date}</span>
                <h3 className="mt-1 text-lg font-black text-navy">{event.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate">{event.excerpt}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
