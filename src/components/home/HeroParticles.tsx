'use client'

import { useEffect, useRef } from 'react'

/*
 * Pusaran cahaya di sekeliling logo kabinet (canvas, tanpa pustaka).
 *
 * Saat halaman dibuka, butir cahaya tersebar di langit lalu berkumpul jadi
 * orbit miring di sekeliling logo, meninggalkan jejak. Setelah itu orbitnya
 * berputar terus; bidangnya ikut miring mengikuti pointer (desktop) atau
 * kemiringan ponsel (HP), lewat --hx/--hy yang ditulis HomeMotion di hero.
 * Mengetuk logo meledakkan butirnya keluar lalu menariknya kembali. Sesekali
 * bintang jatuh melintas. Berhenti saat hero tak terlihat atau tab
 * disembunyikan; tidak berjalan sama sekali bila gerakan dikurangi.
 */

type Particle = {
  band: number
  glow: boolean
  angle: number
  speed: number
  size: number
  color: string
  startX: number
  startY: number
  delay: number
  lift: number
  kick: number
}

type Meteor = { x: number; y: number; vx: number; vy: number; born: number }

/** Titik cahaya lembut yang dirender sekali per warna, lalu cukup ditempel (lebih murah dari shadowBlur). */
function makeGlow(color: string) {
  const sprite = document.createElement('canvas')
  sprite.width = 32
  sprite.height = 32
  const context = sprite.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, `rgba(${color},1)`)
    gradient.addColorStop(0.25, `rgba(${color},0.55)`)
    gradient.addColorStop(1, `rgba(${color},0)`)
    context.fillStyle = gradient
    context.fillRect(0, 0, 32, 32)
  }
  return sprite
}

const COLORS = ['226,246,255', '170,225,255', '120,185,255', '255,214,140']
const GATHER_START = 0.45
const GATHER_TIME = 1.7

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const box = canvas?.parentElement ?? null
    const hero = box?.closest<HTMLElement>('.av-hero') ?? null
    const emblem = box?.querySelector<HTMLElement>('.av-emblem') ?? null
    const context = canvas?.getContext('2d')
    if (!canvas || !box || !hero || !emblem || !context) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = context
    const paper = canvas
    const frameBox = box
    const heroBox = hero
    const mark = emblem

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let visible = true
    let lastTime = 0
    const born = performance.now()
    // Satu denyut kecil tepat saat butir selesai berkumpul, lalu ketukan pengguna.
    let burstAt = born + (GATHER_START + GATHER_TIME + 0.55) * 1000
    let burstPower = 0.45
    let tiltX = 0
    let tiltY = 0
    const meteors: Meteor[] = []
    let nextMeteor = born + 4200
    const glows = new Map(COLORS.map((color) => [color, makeGlow(color)]))

    function build() {
      const count = width < 640 ? 170 : 260
      particles = Array.from({ length: count }, () => {
        const halo = Math.random() < 0.22
        const roll = Math.random()
        return {
          band: halo ? 1.4 + Math.random() * 1.3 : 0.86 + (Math.random() + Math.random() - 1) * 0.16,
          glow: !halo && Math.random() < 0.3,
          angle: Math.random() * Math.PI * 2,
          speed: 0,
          size: halo ? 0.6 + Math.random() * 1 : 1 + Math.random() * 1.8,
          color: roll < 0.08 ? COLORS[3] : roll < 0.32 ? COLORS[2] : roll < 0.62 ? COLORS[1] : COLORS[0],
          startX: Math.random() * width,
          startY: Math.random() * height * 0.85,
          delay: Math.random() * 0.8,
          lift: (Math.random() - 0.5) * 0.16,
          kick: 0.55 + Math.random() * 0.9,
        }
      }).map((particle) => ({ ...particle, speed: (0.34 + Math.random() * 0.36) / Math.pow(particle.band, 1.5) }))
    }

    function resize() {
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      width = frameBox.clientWidth
      height = frameBox.clientHeight
      paper.width = Math.round(width * ratio)
      paper.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (!particles.length) build()
    }

    function burst(power: number) {
      burstAt = performance.now()
      burstPower = power
      mark.classList.remove('is-pop')
      void mark.offsetWidth
      mark.classList.add('is-pop')
    }

    function draw(now: number) {
      frame = 0
      const dt = Math.min(0.05, (now - (lastTime || now)) / 1000)
      lastTime = now
      const t = (now - born) / 1000

      // Pusat orbit = pusat logo (logo ikut bergeser karena parallax/tilt).
      const frameRect = frameBox.getBoundingClientRect()
      const markRect = mark.getBoundingClientRect()
      const cx = markRect.left + markRect.width / 2 - frameRect.left
      const cy = markRect.top + markRect.height / 2 - frameRect.top
      const radius = markRect.width * 0.8

      const hx = parseFloat(heroBox.style.getPropertyValue('--hx')) || 0
      const hy = parseFloat(heroBox.style.getPropertyValue('--hy')) || 0
      tiltX += (hx - tiltX) * 0.08
      tiltY += (hy - tiltY) * 0.08
      const flatten = 0.3 + tiltY * 0.14
      const roll = -0.12 + tiltX * 0.3
      const cosRoll = Math.cos(roll)
      const sinRoll = Math.sin(roll)

      const sinceBurst = (now - burstAt) / 1000
      const blast = sinceBurst < 0 ? 0 : sinceBurst < 0.16 ? sinceBurst / 0.16 : Math.exp(-(sinceBurst - 0.16) * 2.6)
      const gathering = t < GATHER_START + GATHER_TIME + 1

      // Jejak: pudarkan isi canvas sedikit tiap bingkai, bukan menghapusnya.
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = `rgba(0,0,0,${gathering || blast > 0.2 ? 0.16 : 0.32})`
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      for (const particle of particles) {
        particle.angle += particle.speed * dt * (1 + blast * burstPower * 5)
        const ox = Math.cos(particle.angle) * particle.band * radius
        const oy = Math.sin(particle.angle) * particle.band * radius * flatten + particle.lift * radius
        let x = cx + ox * cosRoll - oy * sinRoll
        let y = cy + ox * sinRoll + oy * cosRoll
        const depth = (Math.sin(particle.angle) + 1) / 2

        if (blast > 0.001) {
          const dx = x - cx
          const dy = y - cy
          const length = Math.hypot(dx, dy) || 1
          const push = blast * burstPower * particle.kick * radius * 1.6
          x += (dx / length) * push
          y += (dy / length) * push
        }

        let alpha = 0.25 + depth * 0.75
        const progress = Math.min(1, Math.max(0, (t - GATHER_START - particle.delay) / GATHER_TIME))
        if (progress < 1) {
          const eased = 1 - Math.pow(1 - progress, 3)
          x = particle.startX + (x - particle.startX) * eased
          y = particle.startY + (y - particle.startY) * eased
          alpha *= 0.35 + eased * 0.65
        }

        const size = particle.size * (0.65 + depth * 0.6)
        if (particle.glow) {
          const glow = glows.get(particle.color)
          const spread = size * 7
          if (glow) {
            ctx.globalAlpha = alpha * 0.55
            ctx.drawImage(glow, x - spread / 2, y - spread / 2, spread, spread)
            ctx.globalAlpha = 1
          }
        }
        ctx.fillStyle = `rgba(${particle.color},${alpha.toFixed(3)})`
        if (size < 1.3) {
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
        } else {
          ctx.beginPath()
          ctx.arc(x, y, size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Bintang jatuh sesekali di langit bagian atas.
      if (now > nextMeteor) {
        const leftward = Math.random() < 0.5
        meteors.push({
          x: width * (leftward ? 0.55 + Math.random() * 0.4 : 0.05 + Math.random() * 0.4),
          y: height * Math.random() * 0.25,
          vx: (leftward ? -1 : 1) * (420 + Math.random() * 260),
          vy: 170 + Math.random() * 120,
          born: now,
        })
        nextMeteor = now + 5200 + Math.random() * 5200
      }
      for (let index = meteors.length - 1; index >= 0; index--) {
        const meteor = meteors[index]
        const life = (now - meteor.born) / 1000
        if (life > 0.9) {
          meteors.splice(index, 1)
          continue
        }
        const hx2 = meteor.x + meteor.vx * life
        const hy2 = meteor.y + meteor.vy * life
        const tail = 0.22
        const gradient = ctx.createLinearGradient(hx2, hy2, hx2 - meteor.vx * tail, hy2 - meteor.vy * tail)
        const fade = life < 0.15 ? life / 0.15 : 1 - (life - 0.15) / 0.75
        gradient.addColorStop(0, `rgba(235,248,255,${(0.9 * fade).toFixed(3)})`)
        gradient.addColorStop(1, 'rgba(120,185,255,0)')
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(hx2, hy2)
        ctx.lineTo(hx2 - meteor.vx * tail, hy2 - meteor.vy * tail)
        ctx.stroke()
      }

      if (visible && !document.hidden) frame = requestAnimationFrame(draw)
    }

    function start() {
      if (!frame && visible && !document.hidden) {
        lastTime = 0
        frame = requestAnimationFrame(draw)
      }
    }

    function onVisibility() {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      } else start()
    }

    function onPress(event: PointerEvent) {
      if (event.button !== 0) return
      burst(1)
    }

    resize()
    const resizer = new ResizeObserver(resize)
    resizer.observe(frameBox)
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    })
    watcher.observe(heroBox)
    document.addEventListener('visibilitychange', onVisibility)
    mark.addEventListener('pointerdown', onPress)
    start()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      resizer.disconnect()
      watcher.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      mark.removeEventListener('pointerdown', onPress)
      mark.classList.remove('is-pop')
    }
  }, [])

  return <canvas className="av-particles" ref={canvasRef} aria-hidden="true" />
}
