import type { Metadata } from 'next'
import { ArchiveLibraryPage } from '@/components/site/ArchiveLibraryPage'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Arsip Dokumen HMTE TRE SV UGM',
  description: 'Arsip proposal, laporan, materi, dan dokumen kegiatan HMTE TRE SV UGM yang dikelompokkan berdasarkan project.',
}

export default function ArchivePage() {
  return <ArchiveLibraryPage type="archive" />
}
