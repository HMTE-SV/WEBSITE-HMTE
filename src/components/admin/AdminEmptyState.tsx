type AdminEmptyStateProps = {
  body: string
  kicker?: string
  title: string
}

export function AdminEmptyState({ body, kicker = 'Belum ada data', title }: AdminEmptyStateProps) {
  return (
    <section className="admin-empty-state">
      <span className="admin-kicker">{kicker}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </section>
  )
}
