'use client'

import { useCallback, useSyncExternalStore } from 'react'

/*
 * Preferensi kecil yang menetap: lebar rel, kelompok menu yang terlipat.
 *
 * Dibaca lewat useSyncExternalStore, BUKAN lewat useState + useEffect. Pola
 * useEffect merender sekali dengan nilai bawaan lalu menimpanya setelah
 * hidrasi, jadi pengurus yang menciutkan rel akan melihat rel melebar sekejap
 * di setiap perpindahan halaman. Kedipan itu terbaca sebagai panel yang lupa
 * pilihannya.
 */

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Perubahan dari tab lain ikut didengar supaya dua tab tidak berselisih.
  window.addEventListener('storage', listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/*
 * Singgahan hasil parse, dan alasannya bukan kecepatan.
 *
 * useSyncExternalStore memanggil getSnapshot di setiap render dan membandingkan
 * hasilnya dengan Object.is. JSON.parse memulangkan objek BARU tiap panggilan,
 * jadi tanpa singgahan ini setiap preferensi bertipe larik atau objek akan
 * terbaca "selalu berubah" dan React merender tanpa henti sampai layar mati.
 *
 * Kuncinya teks mentahnya sendiri: selama teks di localStorage tidak berubah,
 * rujukan yang sama dipulangkan.
 */
const parsed = new Map<string, { raw: string; value: unknown }>()

function readSnapshot<T>(key: string, fallback: T): T {
  let raw: string | null

  try {
    raw = window.localStorage.getItem(key)
  } catch {
    // Mode privat dan penyimpanan penuh sama-sama melempar di sini. Kehilangan
    // preferensi jauh lebih ringan daripada panel yang gagal render.
    return fallback
  }

  if (raw === null) return fallback

  const cached = parsed.get(key)
  if (cached && cached.raw === raw) return cached.value as T

  try {
    const value = JSON.parse(raw) as T
    parsed.set(key, { raw, value })
    return value
  } catch {
    return fallback
  }
}

/**
 * Nilai bawaan bertipe objek atau larik WAJIB berupa tetapan tingkat modul.
 * Nilai bawaan dipakai apa adanya sebagai potret server dan sebagai potret saat
 * kuncinya belum pernah ditulis; larik baru di tiap render menghidupkan kembali
 * persoalan Object.is yang dijelaskan di atas.
 */
export function useLocalPreference<T>(key: string, fallback: T): [T, (value: T) => void] {
  const getSnapshot = useCallback(() => readSnapshot(key, fallback), [key, fallback])
  const getServerSnapshot = useCallback(() => fallback, [fallback])

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Sengaja diabaikan; lihat readSnapshot.
      }

      // Singgahan dibuang, bukan diperbarui: pembacaan berikutnya akan mengisi
      // ulang dari teks yang baru ditulis, jadi hanya ada satu jalur kebenaran.
      parsed.delete(key)
      emit()
    },
    [key],
  )

  return [value, setValue]
}
