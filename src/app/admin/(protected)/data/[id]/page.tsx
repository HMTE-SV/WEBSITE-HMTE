import { AdminContentFormPage } from '@/components/admin/AdminContentFormPage'

type EditPublicDataPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditPublicDataPage({ params }: EditPublicDataPageProps) {
  const { id } = await params
  return <AdminContentFormPage documentId={id} kind="publicData" />
}
