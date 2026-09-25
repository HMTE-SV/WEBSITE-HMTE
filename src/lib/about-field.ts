/*
 * Medan energi di belakang seksi "Tentang HMTE": cincin orbit, partikel biru
 * dan emas, lalu kilatan emas saat semuanya mengerucut ke logo.
 *
 * Dipakai dua versi seksi itu. Di layar lebar `p` adalah kemajuan scroll
 * cerita (GetToKnow.tsx); di HP `p` adalah posisi geser antarbab
 * (AboutDeck.tsx). Gambarnya sama, jadi kedua versi terasa satu keluarga.
 */

export type FieldParticle = {
  angle: number
  orbit: number
  speed: number
  size: number
  gold: boolean
  spin: number
}

export type FieldFrame = {
  width: number
  height: number
  dpr: number
  /** Kemajuan cerita 0..1; konvergensi ke logo terjadi di 0,7–0,9. */
  p: number
  /** Detik berjalan, untuk putaran pelan yang tidak bergantung scroll. */
  time: number
  /** Geser pusat karena posisi kursor (-1..1); 0 di layar sentuh. */
  pointerX?: number
  pointerY?: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const seg = (p: number, from: number, to: number) => clamp01((p - from) / (to - from))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const bell = (p: number, center: number, width: number) => Math.exp(-((p - center) ** 2) / (2 * width * width))

export function createFieldParticles(count: number): FieldParticle[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: (index / count) * Math.PI * 2,
    orbit: 0.16 + ((index * 29) % 47) / 88,
    speed: 0.12 + (index % 6) * 0.02,
    size: 0.7 + (index % 5) * 0.4,
    gold: index % 7 === 0,
    spin: index % 2 === 0 ? 1 : -1,
  }))
}

export function drawAboutField(context: CanvasRenderingContext2D, particles: FieldParticle[], frame: FieldFrame) {
  const { width: stageW, height: stageH, dpr, p, time } = frame
  const pointerX = frame.pointerX ?? 0
  const pointerY = frame.pointerY ?? 0

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, stageW, stageH)

  const cx = stageW * 0.5 + pointerX * 10
  const cy = stageH * 0.47 + pointerY * 8
  const scale = Math.min(stageW, stageH)
  const conv = easeInOutCubic(seg(p, 0.7, 0.9))
  const flare = bell(p, 0.885, 0.075)
  const calm = 1 - 0.5 * seg(p, 0.93, 1)

  const ambient = context.createRadialGradient(cx, cy, 0, cx, cy, scale * (0.52 + flare * 0.22))
  ambient.addColorStop(0, `rgba(17, 96, 182, ${0.18 + flare * 0.16})`)
  ambient.addColorStop(0.5, 'rgba(6, 54, 116, 0.08)')
  ambient.addColorStop(1, 'rgba(0, 13, 36, 0)')
  context.fillStyle = ambient
  context.fillRect(0, 0, stageW, stageH)

  for (let ring = 0; ring < 6; ring += 1) {
    const radius = scale * (0.14 + ring * 0.07) * (1 - conv * 0.82)
    const rotation = time * (ring % 2 === 0 ? 0.12 : -0.09) + p * Math.PI * (1.2 + ring * 0.06)
    const squeeze = 0.58 + conv * 0.3
    context.beginPath()
    for (let point = 0; point <= 100; point += 1) {
      const angle = (point / 100) * Math.PI * 2
      const wobble = Math.sin(angle * 3 + time * 0.9 + ring) * scale * 0.008 * (1 - conv)
      const x = cx + Math.cos(angle + rotation) * (radius + wobble)
      const y = cy + Math.sin(angle + rotation) * (radius + wobble) * squeeze
      if (point === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.strokeStyle = ring % 3 === 0
      ? `rgba(245, 184, 46, ${(0.05 + conv * 0.1) * calm})`
      : `rgba(93, 169, 239, ${0.07 * calm})`
    context.lineWidth = ring % 3 === 0 ? 1.1 : 0.7
    context.stroke()
  }

  const particleFade = 1 - seg(p, 0.92, 0.985)
  particles.forEach((particle) => {
    const angle = particle.angle + time * particle.speed * particle.spin + p * Math.PI * 1.6
    const orbit = scale * particle.orbit * (1 - conv * 0.93)
    const x = cx + Math.cos(angle) * orbit
    const y = cy + Math.sin(angle) * orbit * (0.6 + conv * 0.35)
    const alpha = (particle.gold ? 0.75 : 0.5) * calm * (0.5 + conv * 0.5) * particleFade
    if (alpha <= 0.01) return
    context.beginPath()
    context.arc(x, y, particle.size * (1 - conv * 0.4), 0, Math.PI * 2)
    context.fillStyle = particle.gold
      ? `rgba(245, 184, 46, ${alpha})`
      : `rgba(152, 207, 255, ${alpha})`
    context.fill()
  })

  if (flare > 0.02) {
    const burst = context.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.36)
    burst.addColorStop(0, `rgba(245, 184, 46, ${0.4 * flare})`)
    burst.addColorStop(0.4, `rgba(245, 184, 46, ${0.12 * flare})`)
    burst.addColorStop(1, 'rgba(245, 184, 46, 0)')
    context.fillStyle = burst
    context.fillRect(0, 0, stageW, stageH)
  }
}
