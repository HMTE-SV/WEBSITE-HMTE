'use client'

import { useState } from 'react'
import { aspirationCategories, validateAspirationInput } from '@/lib/admin/aspiration-validation'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { createContentDocument } from '@/lib/firebase/content-services'
import type { AspirationDocument } from '@/types/firestore'

export function AspirationForm() {
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFeedback('')

    const validation = validateAspirationInput({
      category,
      isAnonymous,
      message,
      senderEmail,
      senderName,
    })

    if (!validation.success) {
      setError(validation.errors.join(' '))
      return
    }

    if (!hasFirebaseConfig()) {
      setError('Firebase belum dikonfigurasi. Form aspirasi belum bisa menerima kiriman.')
      return
    }

    setIsSubmitting(true)

    try {
      await createContentDocument<AspirationDocument>('aspirations', {
        category,
        internalNotes: '',
        isAnonymous,
        message: message.trim(),
        senderEmail: isAnonymous ? '' : senderEmail.trim(),
        senderName: isAnonymous ? '' : senderName.trim(),
        status: 'submitted',
      })
      setCategory('')
      setMessage('')
      setSenderName('')
      setSenderEmail('')
      setIsAnonymous(false)
      setFeedback('Aspirasi berhasil dikirim. Terima kasih sudah bersuara.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal mengirim aspirasi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="public-form aspiration-form" onSubmit={handleSubmit} aria-describedby="aspiration-form-help">
      <div className="aspiration-form-heading">
        <div>
          <span>Form aspirasi</span>
          <strong>Semua kolom bertanda wajib perlu dilengkapi.</strong>
        </div>
        <b aria-hidden="true">HMTE / 26–27</b>
      </div>
      <p className="sr-only" id="aspiration-form-help">
        Pilih kategori dan tulis aspirasi minimal 20 karakter. Nama wajib diisi kecuali mode anonim aktif.
      </p>
      <div className="public-form-grid">
        <label htmlFor="aspiration-category">
          <span>Kategori <b>Wajib</b></span>
          <select
            id="aspiration-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            <option value="">Pilih kategori</option>
            {aspirationCategories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="aspiration-name">
          <span>Nama <b>{isAnonymous ? 'Dinonaktifkan' : 'Wajib'}</b></span>
          <input
            id="aspiration-name"
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
            disabled={isAnonymous}
            required={!isAnonymous}
            autoComplete="name"
            placeholder={isAnonymous ? 'Mode anonim aktif' : 'Nama lengkap'}
          />
        </label>
      </div>
      <label htmlFor="aspiration-email">
        <span>Email <b>Opsional</b></span>
        <input
          id="aspiration-email"
          type="email"
          value={senderEmail}
          onChange={(event) => setSenderEmail(event.target.value)}
          disabled={isAnonymous}
          autoComplete="email"
          placeholder={isAnonymous ? 'Mode anonim aktif' : 'nama@email.com'}
        />
      </label>
      <label htmlFor="aspiration-message">
        <span>Aspirasi <b>Wajib · min. 20 karakter</b></span>
        <textarea
          id="aspiration-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={7}
          minLength={20}
          required
          placeholder="Jelaskan situasi, dampak, dan tindak lanjut yang diharapkan."
        />
        <small>{message.length} karakter</small>
      </label>
      <label className="public-check-row">
        <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
        <span>
          <strong>Kirim sebagai anonim</strong>
          <small>Nama dan email tidak disertakan dalam kiriman.</small>
        </span>
      </label>
      {error ? (
        <p className="admin-form-error aspiration-form-feedback" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? <p className="admin-form-success aspiration-form-feedback" role="status">{feedback}</p> : null}
      <div className="aspiration-form-submit">
        <p>Periksa kembali isi sebelum dikirim.</p>
        <button className="admin-primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Mengirim...' : 'Kirim aspirasi'}
        </button>
      </div>
    </form>
  )
}
