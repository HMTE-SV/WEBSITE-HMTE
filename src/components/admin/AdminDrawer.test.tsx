// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AdminDrawer } from './AdminDrawer'

function DrawerFixture({ isDirty = false }: { isDirty?: boolean }) {
  return (
    <AdminDrawer isDirty={isDirty} onClose={() => undefined} title="Sunting data">
      <input aria-label="Input pertama" />
      <input aria-label="Input kedua" />
    </AdminDrawer>
  )
}

describe('AdminDrawer focus management', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('menjaga fokus input ketika parent merender ulang setelah form menjadi dirty', async () => {
    await act(async () => root.render(<DrawerFixture />))

    const secondInput = document.querySelector<HTMLInputElement>('[aria-label="Input kedua"]')
    secondInput?.focus()

    await act(async () => root.render(<DrawerFixture isDirty />))

    expect(document.activeElement).toBe(secondInput)
  })
})
