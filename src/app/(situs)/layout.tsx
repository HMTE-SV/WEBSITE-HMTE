import { BottomNav } from '@/components/site/BottomNav'

/*
 * Kelompok rute situs publik. Tanda kurung membuat nama folder ini tidak
 * masuk ke URL: /berita tetap /berita. Gunanya memisahkan halaman publik dari
 * /admin, supaya apa pun yang hanya milik situs (BottomNav hari ini, nanti
 * mungkin shell aplikasi untuk login/acara) cukup dipasang sekali di sini.
 *
 * Catatan: /data masih tinggal di src/app/data (berkasnya terkunci saat
 * pemindahan) dan meminjam layout ini lewat src/app/data/layout.tsx.
 */
export default function SitusLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
