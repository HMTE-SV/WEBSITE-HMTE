// Modul ini sudah kosong dan tidak di-import siapa pun.
//
// Isinya dulu daftar nama program sorotan per bidang, dan /program-kerja
// mencocokkan program dengan daftar itu lewat namanya. Kopling lewat nama
// membuat sorotan lenyap tanpa satu pun pesan begitu pengurus mengganti "TORSI"
// jadi "TORSI 2026" lewat panel.
//
// Penggantinya field `featured` pada dokumen program, yang bisa dicentang dari
// /admin/programs. Lihat ProgramDocument di src/types/firestore.ts.
//
// File fisiknya belum bisa dihapus karena watcher `next dev` mengunci file di
// Windows. Hapus dengan `del src\data\featured-programs.ts` setelah dev server
// mati.
export {}
