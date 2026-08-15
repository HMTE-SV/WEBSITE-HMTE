// Modul ini sudah kosong dan tidak di-import siapa pun.
//
// Isinya dulu mengirim beacon ke http://localhost:8787/log dari Hero dan
// LandingEntryChoice, sisa sesi debug race condition pintu masuk. Instrumentasi
// itu ikut terkirim ke produksi: tiap pengunjung menembak localhost dari halaman
// HTTPS (diblokir sebagai mixed content) sambil membawa scrollY dan state
// interaksinya.
//
// File fisiknya belum bisa dihapus karena watcher `next dev` mengunci file di
// Windows. Hapus dengan `del src\lib\debug-entry.ts` setelah dev server mati.
export {}
