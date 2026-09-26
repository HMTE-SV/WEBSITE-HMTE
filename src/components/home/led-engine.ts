/*
 * Mesin papan LED P10 untuk beranda.
 *
 * Papan fisik yang ditiru: panel running text satu warna (amber) yang biasa
 * dirakit mahasiswa elektro dari modul P10. Setiap titik punya kecerahan
 * 0..1; titik menyala hampir seketika dan padam dengan jejak redup
 * (afterglow), seperti LED yang dimultipleks. Huruf dan foto tidak
 * digambar sebagai huruf/foto: keduanya dicacah ke kisi titik yang sama,
 * jadi apa pun yang tampil di papan tunduk pada fisika yang sama.
 *
 * Tidak bergantung React. Komponen pembungkusnya ada di LedBoard.tsx.
 */

export type LedScene =
  /** Sapuan kolom saat papan dinyalakan. */
  | { kind: 'boot'; duration?: number }
  /** Teks diam, diskalakan agar muat. `\n` memecah baris. */
  | { kind: 'text'; text: string; hold?: number }
  /** Foto dicetak sebagai kecerahan titik. */
  | { kind: 'image'; src: string; hold?: number; focalX?: number; focalY?: number }
  /** Teks berjalan dari kanan ke kiri; `speed` dalam kolom per detik. */
  | { kind: 'marquee'; text: string; speed?: number }
  /** Angka yang menghitung naik ke `to`. */
  | { kind: 'count'; to: number; duration?: number; hold?: number }

export type LedBoardOptions = {
  /** Jarak antartitik dalam piksel CSS. */
  pitch: number
  family: string
  weight?: number
}

type Raster = { cols: number; rows: number; data: Float32Array }
type LineRaster = { width: number; rows: number; data: Float32Array }

const ENTER_MS = 460
const EXIT_MS = 260
const RISE_TAU = 0.028
const DECAY_TAU = 0.17

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)
const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/* ---------- Pencacah ---------- */

function scratch(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D tidak tersedia')
  return { canvas, context }
}

/*
 * Alfa antialias → titik. Papan pendek (< 16 baris) dicacah 1-bit: di ukuran
 * itu titik setengah-nyala membuat huruf yang bersebelahan lebur jadi satu.
 * Papan tinggi memakai ambang lembut supaya lengkungnya tetap bulat.
 */
function alphaToDots(pixels: Uint8ClampedArray, count: number, rows: number) {
  const data = new Float32Array(count)
  const binary = rows < 16
  for (let index = 0; index < count; index += 1) {
    const alpha = pixels[index * 4 + 3] / 255
    data[index] = binary ? (alpha >= 0.5 ? 1 : 0) : smooth(0.22, 0.58, alpha)
  }
  return data
}

/** Pecah teks jadi dua baris seimbang di spasi yang paling dekat ke tengah. */
function splitBalanced(text: string) {
  const middle = text.length / 2
  let best = -1
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === ' ' && (best < 0 || Math.abs(index - middle) < Math.abs(best - middle))) best = index
  }
  return best < 0 ? null : [text.slice(0, best), text.slice(best + 1)]
}

function fitScale(context: CanvasRenderingContext2D, lines: string[], cols: number, rows: number) {
  let widest = 1
  let ascent = 0
  let descent = 0
  lines.forEach((line) => {
    const metrics = context.measureText(line)
    widest = Math.max(widest, metrics.width)
    ascent = Math.max(ascent, metrics.actualBoundingBoxAscent)
    descent = Math.max(descent, metrics.actualBoundingBoxDescent)
  })
  const blockHeight = (ascent + descent) * 1.28 * (lines.length - 1) + ascent + descent
  return Math.min((cols - 2) / widest, (rows - 2) / blockHeight)
}

function rasterText(text: string, cols: number, rows: number, family: string, weight: number): Raster {
  const { context } = scratch(cols, rows)
  const probe = 100
  context.font = `${weight} ${probe}px ${family}`
  let lines = text.split('\n')
  // Papan sempit: dua baris bila itu membuat huruf jauh lebih besar (mis. sorakan di HP).
  if (lines.length === 1 && rows >= 20) {
    const split = splitBalanced(text)
    if (split && fitScale(context, split, cols, rows) > fitScale(context, lines, cols, rows) * 1.15) lines = split
  }

  let widest = 1
  let ascent = 0
  let descent = 0
  lines.forEach((line) => {
    const metrics = context.measureText(line)
    widest = Math.max(widest, metrics.width)
    ascent = Math.max(ascent, metrics.actualBoundingBoxAscent)
    descent = Math.max(descent, metrics.actualBoundingBoxDescent)
  })
  const lineHeight = (ascent + descent) * 1.28
  const blockHeight = lineHeight * (lines.length - 1) + ascent + descent
  // Sisakan satu titik tepi di tiap sisi, seperti bingkai papan sungguhan.
  const scale = Math.min((cols - 2) / widest, (rows - 2) / blockHeight)
  const size = probe * scale

  context.clearRect(0, 0, cols, rows)
  context.font = `${weight} ${size}px ${family}`
  context.fillStyle = '#fff'
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  const top = (rows - blockHeight * scale) / 2
  lines.forEach((line, index) => {
    const baseline = top + (ascent + index * lineHeight) * scale
    context.fillText(line, cols / 2, Math.round(baseline))
  })

  const pixels = context.getImageData(0, 0, cols, rows).data
  return { cols, rows, data: alphaToDots(pixels, cols * rows, rows) }
}

function rasterLine(text: string, rows: number, family: string, weight: number): LineRaster {
  const probe = scratch(1, 1).context
  probe.font = `${weight} 100px ${family}`
  const metrics = probe.measureText('HMTEgy')
  const glyphHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
  const size = (100 * (rows - 2)) / glyphHeight
  probe.font = `${weight} ${size}px ${family}`
  const width = Math.ceil(probe.measureText(text).width) + 2

  const { context } = scratch(width, rows)
  context.font = `${weight} ${size}px ${family}`
  context.fillStyle = '#fff'
  context.textBaseline = 'alphabetic'
  const ascent = (metrics.actualBoundingBoxAscent * size) / 100
  context.fillText(text, 1, Math.round(1 + ascent))
  const pixels = context.getImageData(0, 0, width, rows).data
  return { width, rows, data: alphaToDots(pixels, width * rows, rows) }
}

const imageCache = new Map<string, Promise<HTMLImageElement>>()

function loadImage(src: string) {
  let pending = imageCache.get(src)
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.decoding = 'async'
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`Gagal memuat ${src}`))
      image.src = src
    })
    imageCache.set(src, pending)
  }
  return pending
}

function rasterImage(image: HTMLImageElement, cols: number, rows: number, focalX: number, focalY: number): Raster {
  const { context } = scratch(cols, rows)
  const scale = Math.max(cols / image.naturalWidth, rows / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const x = (cols - width) * (focalX / 100)
  const y = (rows - height) * (focalY / 100)
  context.drawImage(image, x, y, width, height)

  const pixels = context.getImageData(0, 0, cols, rows).data
  const count = cols * rows
  const luma = new Float32Array(count)
  const sorted: number[] = []
  for (let index = 0; index < count; index += 1) {
    const offset = index * 4
    const value = (0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2]) / 255
    luma[index] = value
    sorted.push(value)
  }
  // Rentangkan kontras dari persentil 4..97 supaya foto redup tetap terbaca di papan.
  sorted.sort((a, b) => a - b)
  const low = sorted[Math.floor(count * 0.04)] ?? 0
  const high = sorted[Math.floor(count * 0.97)] ?? 1
  const span = Math.max(high - low, 0.08)
  const data = new Float32Array(count)
  for (let index = 0; index < count; index += 1) {
    data[index] = clamp01((luma[index] - low) / span) ** 1.35
  }
  return { cols, rows, data }
}

/* ---------- Papan ---------- */

type Playback = { index: number; start: number }

export class LedBoardEngine {
  private context: CanvasRenderingContext2D
  private options: Required<LedBoardOptions>
  private cssWidth = 1
  private cssHeight = 1
  private dpr = 1
  cols = 1
  rows = 1
  private originX = 0
  private originY = 0

  private current = new Float32Array(1)
  private target = new Float32Array(1)
  private grid: HTMLCanvasElement | null = null
  private sprite: HTMLCanvasElement | null = null

  private scenes: LedScene[] = []
  private loop = false
  private playback: Playback = { index: 0, start: 0 }
  private seeds = new Float32Array(1)
  private rasters = new Map<string, Raster | LineRaster>()
  private images = new Map<string, HTMLImageElement>()
  private lastTick = 0
  private settledFrames = 0

  constructor(private canvas: HTMLCanvasElement, options: LedBoardOptions) {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D tidak tersedia')
    this.context = context
    this.options = { weight: 700, ...options }
  }

  setPitch(pitch: number) {
    if (pitch === this.options.pitch) return
    this.options.pitch = pitch
    this.resize(this.cssWidth, this.cssHeight, this.dpr)
  }

  resize(width: number, height: number, dpr: number) {
    this.cssWidth = Math.max(1, width)
    this.cssHeight = Math.max(1, height)
    this.dpr = dpr
    const { pitch } = this.options
    this.cols = Math.max(4, Math.floor(this.cssWidth / pitch))
    this.rows = Math.max(4, Math.floor(this.cssHeight / pitch))
    this.originX = (this.cssWidth - (this.cols - 1) * pitch) / 2
    this.originY = (this.cssHeight - (this.rows - 1) * pitch) / 2

    this.canvas.width = Math.round(this.cssWidth * dpr)
    this.canvas.height = Math.round(this.cssHeight * dpr)
    const count = this.cols * this.rows
    this.current = new Float32Array(count)
    this.target = new Float32Array(count)
    this.seeds = new Float32Array(count)
    for (let index = 0; index < count; index += 1) {
      // Urutan kilau yang tetap per titik: hash, bukan Math.random, agar stabil antar-resize.
      const hash = Math.sin(index * 12.9898 + 78.233) * 43758.5453
      this.seeds[index] = hash - Math.floor(hash)
    }
    this.rasters.clear()
    this.buildSprites()
    this.settledFrames = 0
  }

  private buildSprites() {
    const { pitch } = this.options
    const dpr = this.dpr

    // Kisi titik padam: digambar sekali, lalu disalin tiap frame.
    const grid = document.createElement('canvas')
    grid.width = this.canvas.width
    grid.height = this.canvas.height
    const gridContext = grid.getContext('2d')
    if (gridContext) {
      gridContext.scale(dpr, dpr)
      gridContext.fillStyle = 'rgba(38, 72, 138, 0.42)'
      const radius = pitch * 0.3
      for (let row = 0; row < this.rows; row += 1) {
        for (let col = 0; col < this.cols; col += 1) {
          gridContext.beginPath()
          gridContext.arc(this.originX + col * pitch, this.originY + row * pitch, radius, 0, Math.PI * 2)
          gridContext.fill()
        }
      }
      // Sambungan antarmodul P10 (32 × 16 titik): celah gelap tipis di dalam papan.
      gridContext.fillStyle = 'rgba(0, 4, 14, 0.85)'
      for (let col = 32; col < this.cols; col += 32) {
        gridContext.fillRect(this.originX + (col - 0.5) * pitch - 0.5, 0, 1, this.cssHeight)
      }
      for (let row = 16; row < this.rows; row += 16) {
        gridContext.fillRect(0, this.originY + (row - 0.5) * pitch - 0.5, this.cssWidth, 1)
      }
    }
    this.grid = grid

    // Satu titik menyala dengan pendarnya, disalin dengan alfa = kecerahan.
    const size = Math.ceil(pitch * 2.4 * dpr)
    const sprite = document.createElement('canvas')
    sprite.width = size
    sprite.height = size
    const spriteContext = sprite.getContext('2d')
    if (spriteContext) {
      const center = size / 2
      const halo = spriteContext.createRadialGradient(center, center, 0, center, center, center)
      halo.addColorStop(0, 'rgba(255, 214, 120, 0.55)')
      halo.addColorStop(0.28, 'rgba(245, 184, 46, 0.26)')
      halo.addColorStop(1, 'rgba(245, 184, 46, 0)')
      spriteContext.fillStyle = halo
      spriteContext.fillRect(0, 0, size, size)
      const core = spriteContext.createRadialGradient(center, center, 0, center, center, pitch * 0.4 * dpr)
      core.addColorStop(0, '#fff3cf')
      core.addColorStop(0.45, '#ffd05a')
      core.addColorStop(1, '#f5b82e')
      spriteContext.fillStyle = core
      spriteContext.beginPath()
      spriteContext.arc(center, center, pitch * 0.38 * dpr, 0, Math.PI * 2)
      spriteContext.fill()
    }
    this.sprite = sprite
  }

  /** Muat semua foto dan huruf yang dibutuhkan program sebelum dipakai. */
  async prepare(scenes: LedScene[]) {
    await Promise.all(
      scenes.map(async (scene) => {
        if (scene.kind !== 'image' || this.images.has(scene.src)) return
        try {
          this.images.set(scene.src, await loadImage(scene.src))
        } catch {
          // Foto yang gagal dimuat dilewati; papan tetap berjalan.
        }
      }),
    )
  }

  setProgram(scenes: LedScene[], loop: boolean, now: number) {
    this.scenes = scenes.filter((scene) => scene.kind !== 'image' || this.images.has(scene.src))
    this.loop = loop
    this.playback = { index: 0, start: now }
    this.settledFrames = 0
  }

  private textRaster(text: string) {
    const key = `t:${text}`
    let raster = this.rasters.get(key) as Raster | undefined
    if (!raster) {
      raster = rasterText(text, this.cols, this.rows, this.options.family, this.options.weight)
      this.rasters.set(key, raster)
    }
    return raster
  }

  private lineRaster(text: string) {
    const key = `l:${text}`
    let raster = this.rasters.get(key) as LineRaster | undefined
    if (!raster) {
      raster = rasterLine(text, this.rows, this.options.family, this.options.weight)
      this.rasters.set(key, raster)
    }
    return raster
  }

  private imageRaster(scene: Extract<LedScene, { kind: 'image' }>) {
    const key = `i:${scene.src}`
    let raster = this.rasters.get(key) as Raster | undefined
    if (!raster) {
      const image = this.images.get(scene.src)
      if (!image) return null
      try {
        raster = rasterImage(image, this.cols, this.rows, scene.focalX ?? 50, scene.focalY ?? 50)
      } catch {
        return null
      }
      this.rasters.set(key, raster)
    }
    return raster
  }

  private duration(scene: LedScene) {
    switch (scene.kind) {
      case 'boot':
        return scene.duration ?? 1100
      case 'text':
        return ENTER_MS + (scene.hold ?? 1800) + EXIT_MS
      case 'image':
        return 760 + (scene.hold ?? 2600) + EXIT_MS
      case 'marquee': {
        const line = this.lineRaster(scene.text)
        return ((this.cols + line.width) / (scene.speed ?? 26)) * 1000
      }
      case 'count':
        return (scene.duration ?? 1400) + (scene.hold ?? 1600)
    }
  }

  private isLast() {
    return !this.loop && this.playback.index >= this.scenes.length - 1
  }

  /** Isi `target` untuk adegan `scene` pada waktu `elapsed` (ms). */
  private paint(scene: LedScene, elapsed: number, final: boolean) {
    const { cols, rows, target } = this
    target.fill(0)
    const total = this.duration(scene)
    // Adegan terakhir tanpa putaran tidak pernah padam: ia jadi bingkai istirahat papan.
    const exiting = !final && elapsed > total - EXIT_MS

    switch (scene.kind) {
      case 'boot': {
        const sweep = (elapsed / total) * (cols + 10) - 5
        for (let col = 0; col < cols; col += 1) {
          const distance = sweep - col
          const level = distance >= 0 && distance < 5 ? 1 - distance / 5 : 0
          if (!level) continue
          for (let row = 0; row < rows; row += 1) target[row * cols + col] = level
        }
        return
      }
      case 'text':
      case 'count': {
        const text = scene.kind === 'text'
          ? scene.text
          : String(Math.round(scene.to * easeOutCubic(clamp01(elapsed / (scene.duration ?? 1400)))))
        const raster = this.textRaster(text)
        if (exiting) return
        // Tirai kolom kiri → kanan, seperti modul yang dinyalakan bergiliran.
        const reveal = scene.kind === 'count' ? cols : (elapsed / ENTER_MS) * cols
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols && col <= reveal; col += 1) {
            target[row * cols + col] = raster.data[row * cols + col]
          }
        }
        return
      }
      case 'image': {
        const raster = this.imageRaster(scene)
        if (!raster || exiting) return
        const progress = clamp01(elapsed / 760)
        for (let index = 0; index < target.length; index += 1) {
          if (this.seeds[index] < progress) target[index] = raster.data[index]
        }
        return
      }
      case 'marquee': {
        const line = this.lineRaster(scene.text)
        const offset = Math.floor(cols - (elapsed / 1000) * (scene.speed ?? 26))
        for (let col = 0; col < cols; col += 1) {
          const source = col - offset
          if (source < 0 || source >= line.width) continue
          for (let row = 0; row < rows; row += 1) target[row * cols + col] = line.data[row * line.width + source]
        }
        return
      }
    }
  }

  /** Maju satu frame. Mengembalikan false bila papan sudah diam dan loop boleh berhenti. */
  tick(now: number) {
    const dt = this.lastTick ? Math.min((now - this.lastTick) / 1000, 0.1) : 1 / 30
    this.lastTick = now
    if (!this.scenes.length) return false

    let scene = this.scenes[this.playback.index]
    let elapsed = now - this.playback.start
    // Adegan berjalan, bukan satu lompatan: jatuh ke adegan berikutnya bila waktunya habis.
    while (elapsed >= this.duration(scene) && !this.isLast()) {
      this.playback = {
        index: (this.playback.index + 1) % this.scenes.length,
        start: this.playback.start + this.duration(scene),
      }
      scene = this.scenes[this.playback.index]
      elapsed = now - this.playback.start
    }
    const final = this.isLast()
    this.paint(scene, final ? Math.min(elapsed, this.duration(scene)) : elapsed, final)

    const rise = 1 - Math.exp(-dt / RISE_TAU)
    const decay = 1 - Math.exp(-dt / DECAY_TAU)
    let moving = false
    for (let index = 0; index < this.current.length; index += 1) {
      const from = this.current[index]
      const to = this.target[index]
      const next = from + (to - from) * (to > from ? rise : decay)
      if (Math.abs(next - to) > 0.004) moving = true
      this.current[index] = Math.abs(next - to) < 0.004 ? to : next
    }
    this.draw()

    const timed = scene.kind === 'marquee' || (final ? elapsed < this.duration(scene) : true)
    this.settledFrames = moving || timed ? 0 : this.settledFrames + 1
    return this.settledFrames < 3
  }

  /** Bingkai akhir tanpa animasi, untuk "kurangi gerakan". */
  renderStill(sceneIndex: number) {
    const scene = this.scenes[Math.min(sceneIndex, this.scenes.length - 1)]
    if (!scene) return
    // Teks berjalan dibekukan dengan awal pesannya rata kiri, bukan dipotong jadi satu kata.
    const elapsed =
      scene.kind === 'marquee' ? (this.cols / (scene.speed ?? 26)) * 1000
        : scene.kind === 'count' ? Number.MAX_SAFE_INTEGER
          : this.duration(scene) / 2
    this.paint(scene, elapsed, true)
    this.current.set(this.target)
    this.draw()
  }

  private draw() {
    const { context, canvas, dpr } = this
    const { pitch } = this.options
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    if (this.grid) context.drawImage(this.grid, 0, 0)
    const sprite = this.sprite
    if (!sprite) return
    const half = sprite.width / 2
    for (let row = 0; row < this.rows; row += 1) {
      const y = (this.originY + row * pitch) * dpr - half
      for (let col = 0; col < this.cols; col += 1) {
        const level = this.current[row * this.cols + col]
        if (level < 0.03) continue
        context.globalAlpha = level
        context.drawImage(sprite, (this.originX + col * pitch) * dpr - half, y)
      }
    }
    context.globalAlpha = 1
  }
}
