import Image from 'next/image'

const galleryItems = [
  { src: '/assets/ugm_socialization.png', alt: 'Kegiatan sosialisasi akademik TRE' },
  { src: '/assets/robotics_prestige.png', alt: 'Kegiatan prestasi robotika mahasiswa' },
  { src: '/assets/smart_grid_dashboard.png', alt: 'Dashboard teknologi smart grid' },
]

export function GalleryStrip() {
  return (
    <section className="bg-cloud py-16 md:py-20">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Galeri</p>
            <h2 className="mt-3 text-3xl font-black text-navy md:text-5xl">
              Arsip kegiatan.
            </h2>
          </div>
          <a href="/galeri" className="text-sm font-black text-navy underline decoration-gold decoration-4 underline-offset-4">
            Buka galeri
          </a>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {galleryItems.map((item) => (
            <figure className="overflow-hidden rounded-[8px] border-2 border-navy bg-cloud shadow-[6px_6px_0_#062657]" key={item.src}>
              <Image src={item.src} alt={item.alt} width={900} height={600} className="aspect-[4/3] w-full object-cover" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
