import { readFileSync } from 'node:fs'
import path from 'node:path'

export function readLegacyScript() {
  const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/)

  if (!scriptMatch) {
    throw new Error('Unable to extract legacy script from index.html')
  }

  return stripLegacyData(scriptMatch[1])
}

function replaceBlock(script: string, startMarker: string, endMarker: string, replacement: string) {
  const start = script.indexOf(startMarker)
  const end = script.indexOf(endMarker, start)

  if (start < 0 || end < 0) {
    throw new Error(`Unable to replace legacy data block: ${startMarker}`)
  }

  return `${script.slice(0, start)}${replacement}${script.slice(end)}`
}

function stripLegacyData(script: string) {
  const withoutNewsData = replaceBlock(
    script,
    '    /* Data Berita & Agenda',
    '    function renderNews',
    "    /* Data Berita & Agenda */\n    const newsData = window.__HMTE_LEGACY_DATA__.newsData;\n\n",
  )
  const withoutLeadersData = replaceBlock(
    withoutNewsData,
    '    /* Data Kepengurusan HMTE',
    '    let currentBidang',
    "    /* Data Kepengurusan HMTE */\n    const kepData = window.__HMTE_LEGACY_DATA__.kepData;\n\n",
  )

  return replaceBlock(
    withoutLeadersData,
    '    /* Data Program Kerja',
    '    function getRoleClass',
    "    /* Data Program Kerja */\n    const prokerData = window.__HMTE_LEGACY_DATA__.prokerData;\n\n",
  )
}
