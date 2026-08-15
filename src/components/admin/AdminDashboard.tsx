'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { where } from 'firebase/firestore'
import { useAdminSession } from './AdminSessionContext'
import { canAdminWrite } from '@/data/admin-nav'
import { countContentDocuments, listContentDocuments } from '@/lib/firebase/content-services'
import { buildProgramSchedule, getAgendaYear } from '@/lib/program-schedule'
import type { ProgramDocument } from '@/types/firestore'

/*
 * Dasbor: satu-satunya halaman admin yang boleh memakai kartu (Larangan 5 di
 * docs/DESIGN_ADMIN.md membolehkannya di sini, dan cuma di sini). Isinya
 * dirancang untuk pengurus yang datang untuk MENERBITKAN SATU HAL lalu pergi:
 * sapaan yang menyebut namanya, hitungan yang menjawab "seberapa penuh
 * pekerjaanku", jalan pintas ke tiga pekerjaan tersering, dan agenda bulan ini
 * supaya ia tidak perlu membuka /admin/programs hanya untuk tahu itu.
 */

type Counts = {
  articlesTotal: number
  articlesPublished: number
  articlesDraft: number
  announcements: number
  leadersActive: number
  programs: number
}

type CountsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; counts: Counts }

type AgendaState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: Array<{ program: ProgramDocument; label: string; precision: string }> }

async function loadCounts(): Promise<Counts> {
  const [articlesTotal, articlesPublished, articlesDraft, announcements, leadersActive, programs] =
    await Promise.all([
      countContentDocuments('articles'),
      countContentDocuments('articles', [where('status', '==', 'published')]),
      countContentDocuments('articles', [where('status', '==', 'draft')]),
      countContentDocuments('announcements'),
      countContentDocuments('leaders', [where('active', '==', true)]),
      countContentDocuments('programs'),
    ])

  return { articlesTotal, articlesPublished, articlesDraft, announcements, leadersActive, programs }
}

async function loadAgenda() {
  const programsList = await listContentDocuments<ProgramDocument>('programs')
  const year = getAgendaYear()
  const currentMonth = new Date().getUTCMonth() + 1

  return programsList
    .map((program) => ({ program, schedule: buildProgramSchedule(program, year) }))
    .filter(({ schedule }) => schedule.months.includes(currentMonth))
    .sort((first, second) => {
      if (first.schedule.precision !== second.schedule.precision) {
        return first.schedule.precision === 'exact' ? -1 : 1
      }
      return first.program.name.localeCompare(second.program.name, 'id-ID')
    })
    .map(({ program, schedule }) => ({ program, label: schedule.label, precision: schedule.precision }))
}

export function AdminDashboard() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [countsState, setCountsState] = useState<CountsState>({ status: 'loading' })
  const [agendaState, setAgendaState] = useState<AgendaState>({ status: 'loading' })

  const refreshCounts = useCallback(async () => {
    setCountsState({ status: 'loading' })
    try {
      const counts = await loadCounts()
      setCountsState({ status: 'ready', counts })
    } catch (error) {
      setCountsState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Ringkasan belum dapat dimuat.',
      })
    }
  }, [])

  const refreshAgenda = useCallback(async () => {
    setAgendaState({ status: 'loading' })
    try {
      const items = await loadAgenda()
      setAgendaState({ status: 'ready', items })
    } catch (error) {
      setAgendaState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Agenda bulan ini belum dapat dimuat.',
      })
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshCounts()
      void refreshAgenda()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [refreshCounts, refreshAgenda])

  const monthName = useMemo(
    () => new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: 'Asia/Makassar' }).format(new Date()),
    [],
  )

  const readyCounts = countsState.status === 'ready' ? countsState.counts : null
  const totalPublication = readyCounts ? readyCounts.articlesTotal + readyCounts.announcements : 0
  const priorityTitle = readyCounts?.articlesDraft
    ? `${readyCounts.articlesDraft} draft menunggu tinjauan`
    : 'Buat publikasi berikutnya'
  const priorityCopy = readyCounts?.articlesDraft
    ? 'Rapikan naskah, periksa pratinjau, lalu terbitkan saat semuanya siap.'
    : 'Bagikan kabar terbaru organisasi melalui berita atau pengumuman.'
  const priorityHref = readyCounts?.articlesDraft ? '/admin/articles' : '/admin/articles/new'

  return (
    <div className="adm-dash">
      <section className="adm-dash-greeting">
        <span>{monthName} {getAgendaYear()} · Kabinet Abya Vistara</span>
        <h1>Selamat bekerja, {session.displayName?.split(' ')[0] || 'Reeyza'}.</h1>
        <p>
          {canWrite
            ? 'Satu ruang kerja untuk menyiapkan publikasi dan menjaga informasi organisasi tetap rapi.'
            : 'Mode peninjau aktif. Kamu dapat memeriksa seluruh konten tanpa mengubah data.'}
        </p>
      </section>

      {countsState.status === 'error' ? (
        <div className="adm-panel adm-dash-metric-error" role="alert">
          <p>{countsState.message}</p>
          <button className="adm-btn adm-btn--ghost" type="button" onClick={() => void refreshCounts()}>Coba lagi</button>
        </div>
      ) : (
        <section className="adm-dash-command" aria-label="Prioritas dan ruang publikasi">
          <article className="adm-dash-priority">
            <div>
              <span>Prioritas minggu ini</span>
              <h2>{countsState.status === 'loading' ? 'Menyiapkan ruang kerja…' : priorityTitle}</h2>
              <p>{countsState.status === 'loading' ? 'Mengambil status publikasi terbaru.' : priorityCopy}</p>
            </div>
            {canWrite ? <Link href={priorityHref}><span aria-hidden="true">↗</span> Mulai bekerja</Link> : null}
          </article>

          <article className="adm-dash-capacity">
            <span>Ruang publikasi</span>
            <div className="adm-dash-capacity-total">
              {countsState.status === 'loading' ? <div className="adm-skeleton" aria-hidden="true" /> : <strong>{totalPublication}</strong>}
              <p>bahan organisasi dikelola</p>
            </div>
            <dl>
              <div><dt>Draft</dt><dd>{readyCounts?.articlesDraft ?? '—'}</dd></div>
              <div><dt>Terbit</dt><dd>{readyCounts?.articlesPublished ?? '—'}</dd></div>
              <div><dt>Pengumuman</dt><dd>{readyCounts?.announcements ?? '—'}</dd></div>
            </dl>
          </article>
        </section>
      )}

      <section className="adm-dash-agenda adm-panel" aria-label="Agenda bulan ini">
        <header>
          <div>
            <span>Agenda bulan ini · {monthName}</span>
            <h2>Program yang siap diteruskan.</h2>
          </div>
          <div className="adm-dash-agenda-count">
            <strong>{agendaState.status === 'ready' ? agendaState.items.length : '—'}</strong>
            <small>kegiatan aktif</small>
          </div>
        </header>

        {agendaState.status === 'loading' ? (
          <div className="adm-dash-agenda-grid" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => <div className="adm-skeleton adm-dash-agenda-skeleton" key={index} />)}
          </div>
        ) : agendaState.status === 'error' ? (
          <div className="adm-dash-metric-error" role="alert">
            <p>{agendaState.message}</p>
            <button className="adm-btn adm-btn--ghost" type="button" onClick={() => void refreshAgenda()}>Coba lagi</button>
          </div>
        ) : agendaState.items.length === 0 ? (
          <div className="adm-empty">
            <h3>Belum ada program di {monthName}</h3>
            <p>Isi bulan atau tanggal pelaksanaan agar program muncul sebagai agenda kerja.</p>
            <Link className="adm-btn" href="/admin/programs">Buka Program Kerja</Link>
          </div>
        ) : (
          <div className="adm-dash-agenda-grid">
            {agendaState.items.slice(0, 8).map(({ program, label, precision }, index) => (
              <Link className={`adm-dash-agenda-card tone-${(index % 6) + 1}`} href="/admin/programs" key={program.id}>
                <span>{program.divisionCode} · {label}</span>
                <h3>{program.name}</h3>
                <p>{precision === 'exact' ? 'Jadwal sudah pasti' : 'Tanggal perlu dilengkapi'}</p>
                <b>Buka agenda ↗</b>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="adm-dash-shortcuts" aria-label="Jalan pintas">
        <Link href="/admin/pages"><span>01</span><strong>Halaman situs</strong><small>Atur copy dan struktur halaman</small></Link>
        <Link href="/admin/leaders"><span>02</span><strong>Kepengurusan</strong><small>{readyCounts?.leadersActive ?? '—'} pengurus aktif</small></Link>
        <Link href="/admin/media"><span>03</span><strong>Pustaka media</strong><small>Kelola gambar publik</small></Link>
        <Link href="/admin/history"><span>04</span><strong>Riwayat perubahan</strong><small>Periksa aktivitas terakhir</small></Link>
      </section>
    </div>
  )
}
