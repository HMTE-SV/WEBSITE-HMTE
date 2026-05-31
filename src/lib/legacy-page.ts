import { readFileSync } from 'node:fs'
import path from 'node:path'

export function readLegacyScript() {
  const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/)

  if (!scriptMatch) {
    throw new Error('Unable to extract legacy script from index.html')
  }

  return scriptMatch[1]
}
