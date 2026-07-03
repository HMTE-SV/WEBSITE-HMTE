'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/site/Brand'
import { getToKnowContent } from '@/data/site-content'

const SCENE_COUNT = 4

function CinemaCanvas({ activeScene }: { activeScene: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef(activeScene)

  useEffect(() => {
    sceneRef.current = activeScene
  }, [activeScene])

  useEffect(() => {
    const canvasElement = canvasRef.current
    if (!canvasElement) return
    const drawingContext = canvasElement.getContext('2d')
    if (!drawingContext) return
    const canvas: HTMLCanvasElement = canvasElement
    const context: CanvasRenderingContext2D = drawingContext
    const section = canvas.closest<HTMLElement>('.about-cinema')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: 0.5, y: 0.5 }
    const particles = Array.from({ length: 72 }, (_, index) => ({
      angle: (index / 72) * Math.PI * 2,
      orbit: 0.18 + ((index * 17) % 53) / 100,
      speed: 0.14 + (index % 7) * 0.018,
      size: 0.7 + (index % 5) * 0.42,
      phase: (index * 0.61803398875) % 1,
    }))
    let width = 0
    let height = 0
    let frame = 0

    function resize() {
      const bounds = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(bounds.width, 1)
      height = Math.max(bounds.height, 1)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function draw(timestamp: number) {
      const time = reducedMotion ? 0 : timestamp * 0.00035
      const scene = sceneRef.current
      const progress = Number.parseFloat(section?.style.getPropertyValue('--cinema-progress') || '0')
      const centerX = width * (0.5 + (pointer.x - 0.5) * 0.08)
      const centerY = height * (0.48 + (pointer.y - 0.5) * 0.06)
      const scale = Math.min(width, height)

      context.clearRect(0, 0, width, height)

      const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 0.58)
      glow.addColorStop(0, `rgba(19, 112, 205, ${0.22 + scene * 0.025})`)
      glow.addColorStop(0.45, 'rgba(6, 61, 127, 0.09)')
      glow.addColorStop(1, 'rgba(0, 13, 36, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)

      for (let ring = 0; ring < 9; ring += 1) {
        const radius = scale * (0.1 + ring * 0.055)
        const rotation = time * (ring % 2 === 0 ? 1 : -0.72) + progress * Math.PI * (1.4 + ring * 0.05)
        const squeeze = 0.56 + scene * 0.1
        context.beginPath()

        for (let point = 0; point <= 120; point += 1) {
          const angle = (point / 120) * Math.PI * 2
          const pulse = Math.sin(angle * (2 + scene) + time * 3 + ring) * scale * 0.009
          const x = centerX + Math.cos(angle + rotation) * (radius + pulse)
          const y = centerY + Math.sin(angle + rotation) * (radius + pulse) * squeeze
          if (point === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }

        context.strokeStyle = ring % 3 === 0
          ? `rgba(245, 184, 46, ${0.08 + ring * 0.006})`
          : `rgba(93, 169, 239, ${0.08 + ring * 0.008})`
        context.lineWidth = ring % 3 === 0 ? 1.25 : 0.7
        context.stroke()
      }

      particles.forEach((particle, index) => {
        const direction = index % 2 === 0 ? 1 : -1
        const angle = particle.angle + time * particle.speed * direction + progress * Math.PI * 1.8
        const radius = scale * particle.orbit
        const topology = 0.54 + scene * 0.1
        const wave = Math.sin(angle * (scene + 1) + particle.phase * 8) * scale * 0.018
        const x = centerX + Math.cos(angle) * (radius + wave)
        const y = centerY + Math.sin(angle) * radius * topology
        context.beginPath()
        context.arc(x, y, particle.size, 0, Math.PI * 2)
        context.fillStyle = index % 9 === 0 ? 'rgba(245, 184, 46, 0.78)' : 'rgba(152, 207, 255, 0.52)'
        context.fill()
      })

      if (!reducedMotion) frame = window.requestAnimationFrame(draw)
    }

    function handlePointer(event: PointerEvent) {
      pointer.x += (event.clientX / window.innerWidth - pointer.x) * 0.12
      pointer.y += (event.clientY / window.innerHeight - pointer.y) * 0.12
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener('pointermove', handlePointer, { passive: true })
    resize()
    draw(0)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointer)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return <canvas ref={canvasRef} className="about-cinema-canvas" aria-hidden="true" />
}

export function GetToKnow() {
  const [activeScene, setActiveScene] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const activeSceneRef = useRef(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return
    let frame = 0

    function update() {
      frame = 0
      if (!section) return
      const bounds = section.getBoundingClientRect()
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1)
      const progress = Math.min(1, Math.max(0, -bounds.top / travel))
      const nextScene = Math.min(SCENE_COUNT - 1, Math.floor(progress * SCENE_COUNT))
      section.style.setProperty('--cinema-progress', progress.toFixed(4))

      if (nextScene !== activeSceneRef.current) {
        activeSceneRef.current = nextScene
        setActiveScene(nextScene)
      }
    }

    function handleScroll() {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  function goToScene(index: number) {
    const section = sectionRef.current
    if (!section) return
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: section.offsetTop + (travel * index) / (SCENE_COUNT - 1),
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  const scenes = [
    {
      label: 'HMTE TRE SV UGM',
      title: 'Tempat energi mahasiswa bertemu.',
      body: 'Satu ruang bersama untuk bertumbuh, mencoba hal baru, dan membawa gagasan menjadi gerakan yang terasa.',
    },
    ...getToKnowContent.steps.map((step) => ({ label: step.label, title: step.title, body: step.body })),
  ]

  return (
    <section
      ref={sectionRef}
      className="about-cinema"
      id="tentang"
      data-scene={activeScene}
      aria-labelledby="about-cinema-title"
    >
      <div className="about-cinema-stage">
        <CinemaCanvas activeScene={activeScene} />
        <div className="about-cinema-tone" aria-hidden="true" />

        <div className="about-cinema-frames" aria-hidden="true">
          <figure className="about-cinema-frame about-cinema-frame--one">
            <Image src="/assets/robotics_prestige.png" alt="" fill sizes="30vw" />
          </figure>
          <figure className="about-cinema-frame about-cinema-frame--two">
            <Image src="/assets/ugm_socialization.png" alt="" fill sizes="26vw" />
          </figure>
          <figure className="about-cinema-frame about-cinema-frame--three">
            <Image src="/assets/solar_village.png" alt="" fill sizes="24vw" />
          </figure>
        </div>

        <div className="about-cinema-mark" aria-hidden="true">
          <LogoMark width={330} height={98} className="about-cinema-logo" />
          <span>{getToKnowContent.period}</span>
        </div>

        <header className="about-cinema-meta">
          <strong>{getToKnowContent.identity}</strong>
          <p>{getToKnowContent.context}</p>
        </header>

        <div className="about-cinema-scenes">
          {scenes.map((scene, index) => (
            <article
              className={`about-cinema-scene about-cinema-scene--${index}${index === activeScene ? ' is-active' : ''}`}
              aria-hidden={index !== activeScene}
              key={scene.label}
            >
              <span>{scene.label}</span>
              <h2 id={index === 0 ? 'about-cinema-title' : undefined}>{scene.title}</h2>
              <p>{scene.body}</p>
            </article>
          ))}
        </div>

        <nav className="about-cinema-nav" aria-label="Navigasi cerita Tentang HMTE">
          {scenes.map((scene, index) => (
            <button
              type="button"
              className={index === activeScene ? 'is-active' : undefined}
              onClick={() => goToScene(index)}
              aria-label={`Buka bagian ${scene.label}`}
              aria-current={index === activeScene ? 'step' : undefined}
              key={scene.label}
            >
              <i aria-hidden="true" />
              <span>{scene.label}</span>
            </button>
          ))}
        </nav>

        <p className="about-cinema-scroll">Scroll untuk mengubah medan</p>
      </div>
    </section>
  )
}
