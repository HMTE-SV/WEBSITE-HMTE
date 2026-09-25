import type { Metadata } from 'next'
import { ArchiveLibraryPage } from '@/components/site/ArchiveLibraryPage'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Template Dokumen HMTE TRE SV UGM',
  description: 'Template surat, proposal, laporan, dan perangkat administrasi resmi HMTE TRE SV UGM.',
}

export default function DocumentTemplatesPage() {
  return <ArchiveLibraryPage type="template" />
}
