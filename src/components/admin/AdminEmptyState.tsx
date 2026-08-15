/*
 * Bidang kosong MENGAJARI, bukan mengumumkan (docs/DESIGN_ADMIN.md §4).
 * "Belum ada data" tidak memberi tahu apa pun tentang apa yang seharusnya ada
 * di sini atau bagaimana membuatnya — jadi `title`/`body` di sini wajib diisi
 * kalimat yang menjelaskan itu, dan `action` adalah tombol yang membuat yang
 * pertama, bukan hiasan opsional.
 */

type AdminEmptyStateProps = {
  action?: React.ReactNode
  body: string
  /**
   * USANG — kicker huruf besar-kecil di atas tiap seksi adalah perancah AI
   * (Larangan §6.7). Masih diterima (dan diabaikan) supaya halaman admin lain
   * yang belum digarap ke sistem ini tidak ikut rusak. Jangan dipakai di
   * halaman baru.
   */
  kicker?: string
  title: string
}

export function AdminEmptyState({ action, body, title }: AdminEmptyStateProps) {
  return (
    <section className="adm-empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </section>
  )
}
