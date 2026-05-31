import { AdminEmptyState } from './AdminEmptyState'
import { AdminShell } from './AdminShell'

type AdminCollectionPageProps = {
  activeHref: string
  description: string
  emptyBody: string
  emptyTitle: string
  kicker: string
  title: string
}

export function AdminCollectionPage({
  activeHref,
  description,
  emptyBody,
  emptyTitle,
  kicker,
  title,
}: AdminCollectionPageProps) {
  return (
    <AdminShell activeHref={activeHref} description={description} kicker={kicker} title={title}>
      <div className="admin-toolbar">
        <span>Firestore belum tersambung</span>
        <button type="button" disabled>
          Tambah data
        </button>
      </div>
      <AdminEmptyState body={emptyBody} title={emptyTitle} />
    </AdminShell>
  )
}
