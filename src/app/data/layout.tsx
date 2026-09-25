/*
 * /data seharusnya tinggal di src/app/(situs)/data, tapi berkasnya terkunci
 * saat rute publik dipindahkan ke kelompok (situs). Sampai bisa dipindah,
 * halaman ini meminjam layout kelompok itu supaya perilakunya sama.
 */
export { default } from '../(situs)/layout'
