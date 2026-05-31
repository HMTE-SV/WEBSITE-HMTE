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
    <form className="public-form" onSubmit={handleSubmit}>
      <div className="public-form-grid">
        <label>
          Kategori
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Pilih kategori</option>
            {aspirationCategories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nama
          <input value={senderName} onChange={(event) => setSenderName(event.target.value)} disabled={isAnonymous} />
        </label>
      </div>
      <label>
        Email
        <input
          type="email"
          value={senderEmail}
          onChange={(event) => setSenderEmail(event.target.value)}
          disabled={isAnonymous}
        />
      </label>
      <label>
        Aspirasi
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} />
      </label>
      <label className="public-check-row">
        <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
        Kirim sebagai anonim
      </label>
      {error ? (
        <p className="admin-form-error" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? <p className="admin-form-success">{feedback}</p> : null}
      <button className="admin-primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Mengirim...' : 'Kirim aspirasi'}
      </button>
    </form>
  )
}
