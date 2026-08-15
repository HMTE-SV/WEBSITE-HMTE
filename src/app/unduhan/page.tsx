import { permanentRedirect } from 'next/navigation'

export default function LegacyDownloadsPage() {
  permanentRedirect('/arsip')
}
