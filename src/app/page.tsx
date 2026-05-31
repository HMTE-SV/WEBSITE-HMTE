import { readFileSync } from 'node:fs'
import path from 'node:path'
import { LegacyInteractions } from './legacy-interactions'

function readLegacyPage() {
  const html = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
  const pageMatch = html.match(/<body[^>]*>([\s\S]*?)<script>([\s\S]*?)<\/script>([\s\S]*?)<\/body>/)

  if (!pageMatch) {
    throw new Error('Unable to extract legacy page body and script from index.html')
  }

  return {
    body: `${pageMatch[1]}${pageMatch[3]}`.trim(),
    script: pageMatch[2],
  }
}

export default function Home() {
  const legacyPage = readLegacyPage()

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: legacyPage.body }} />
      <LegacyInteractions script={legacyPage.script} />
    </>
  )
}
