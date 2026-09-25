import { useSyncExternalStore } from 'react'
import { STORY_MEDIA_QUERY } from '@/lib/hero-media'

/*
 * Apakah beranda sedang memakai versi "layar lebar di browser" — cerita scroll
 * (Hero.tsx, GetToKnow.tsx) — atau versi HP/mode aplikasi.
 *
 * Tampil/sembunyinya diputuskan CSS lewat kueri yang sama; hook ini hanya
 * dipakai untuk menyalakan efek JS yang memang milik salah satu versi, supaya
 * versi yang tersembunyi tidak ikut menghitung tiap frame.
 */

function subscribe(onChange: () => void) {
  const media = window.matchMedia(STORY_MEDIA_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot() {
  return window.matchMedia(STORY_MEDIA_QUERY).matches
}

// Server tidak tahu lebar layar; efek JS memang hanya berjalan di klien.
function getServerSnapshot() {
  return false
}

export function useStoryMedia() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
