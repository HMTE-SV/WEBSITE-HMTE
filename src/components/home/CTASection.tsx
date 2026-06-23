import Link from 'next/link'

export function CTASection() {
  return (
    <section className="bg-navy py-16 text-cloud md:py-20">
      <div className="container-page grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-black uppercase text-gold">Terhubung</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">
            Punya informasi, aspirasi, atau kolaborasi?
          </h2>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-haze">
            Kirimkan lewat kanal resmi agar bisa ditindaklanjuti oleh pengurus HMTE.
          </p>
        </div>
        <Link href="/kontak" className="w-fit rounded-[8px] border-2 border-gold bg-gold px-5 py-3 text-sm font-black text-ink shadow-[5px_5px_0_#020f27]">
          Kontak HMTE
        </Link>
      </div>
    </section>
  )
}
