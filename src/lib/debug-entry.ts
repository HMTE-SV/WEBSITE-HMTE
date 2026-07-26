'use client'

// #region debug
const ENTRY_DEBUG_SESSION = 'hmte-entry-race-716866'
const ENTRY_DEBUG_URL = 'http://localhost:8787/log'

export function debugEntry(
  msg: string,
  data: Record<string, unknown> = {},
  hypothesisId: string | null = null,
) {
  const payload = JSON.stringify({
    sessionId: ENTRY_DEBUG_SESSION,
    msg,
    data,
    hypothesisId,
  })

  if (navigator.sendBeacon?.(ENTRY_DEBUG_URL, payload)) return
  fetch(ENTRY_DEBUG_URL, { method: 'POST', body: payload }).catch(() => {})
}
// #endregion
