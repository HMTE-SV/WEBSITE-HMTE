'use client'

import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/site/Brand'
import { getToKnowContent } from '@/data/site-content'

function AboutField({ activeStep }: { activeStep: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeStepRef = useRef(activeStep)

  useEffect(() => {
    activeStepRef.current = activeStep
  }, [activeStep])

  useEffect(() => {
    const canvasElement = canvasRef.current
    if (!canvasElement) return
    const drawingContext = canvasElement.getContext('2d')
    if (!drawingContext) return
    const canvas: HTMLCanvasElement = canvasElement
    const context: CanvasRenderingContext2D = drawingContext

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: 0.5, y: 0.5 }
    let width = 0
    let height = 0
    let frame = 0

    const particles = Array.from({ length: 38 }, (_, index) => ({
      phase: (index * 0.61803398875) % 1,
      lane: (index * 7) % 13,
      speed: 0.018 + (index % 5) * 0.004,
      radius: 0.8 + (index % 4) * 0.45,
    }))

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
      const time = reducedMotion ? 0 : timestamp * 0.00018
      const step = activeStepRef.current
      context.clearRect(0, 0, width, height)

      const halo = context.createRadialGradient(
        pointer.x * width,
        pointer.y * height,
        0,
        pointer.x * width,
        pointer.y * height,
        Math.max(width, height) * 0.62,
      )
      halo.addColorStop(0, `rgba(21, 112, 198, ${0.16 + step * 0.025})`)
      halo.addColorStop(0.48, 'rgba(3, 61, 125, 0.08)')
      halo.addColorStop(1, 'rgba(1, 19, 51, 0)')
      context.fillStyle = halo
      context.fillRect(0, 0, width, height)

      for (let lane = 0; lane < 13; lane += 1) {
        const laneY = ((lane + 0.7) / 13) * height
        const sway = Math.sin(time * (1.1 + step * 0.16) + lane * 0.72) * height * 0.055
        const pullX = (pointer.x - 0.5) * width * 0.19
        const pullY = (pointer.y - 0.5) * height * 0.16
        const gradient = context.createLinearGradient(0, laneY, width, laneY)
        gradient.addColorStop(0, 'rgba(68, 144, 222, 0)')
        gradient.addColorStop(0.42, `rgba(90, 164, 238, ${0.1 + lane * 0.004})`)
        gradient.addColorStop(0.72, 'rgba(245, 184, 46, 0.2)')
        gradient.addColorStop(1, 'rgba(245, 184, 46, 0)')

        context.beginPath()
        context.moveTo(-width * 0.08, laneY)
        context.bezierCurveTo(
          width * 0.25 + pullX,
          laneY + sway,
          width * 0.56 - pullX * 0.6,
          laneY - sway * 1.35 + pullY,
          width * 1.08,
          laneY + Math.sin(time + lane) * height * 0.025,
        )
        context.strokeStyle = gradient
        context.lineWidth = lane % 4 === 0 ? 1.4 : 0.72
        context.stroke()
      }

      particles.forEach((particle) => {
        const progress = (particle.phase + time * particle.speed * 14 + step * 0.07) % 1
        const x = progress * width
        const baseY = ((particle.lane + 0.7) / 13) * height
        const y = baseY + Math.sin(time * 5 + particle.lane * 0.72 + progress * 6) * height * 0.055
        context.beginPath()
        context.arc(x, y, particle.radius, 0, Math.PI * 2)
        context.fillStyle = particle.lane % 4 === 0 ? 'rgba(245, 184, 46, 0.72)' : 'rgba(142, 197, 250, 0.52)'
        context.fill()
      })

      if (!reducedMotion) frame = window.requestAnimationFrame(draw)
    }

    function handlePointer(event: PointerEvent) {
      pointer.x += (event.clientX / window.innerWidth - pointer.x) * 0.18
      pointer.y += (event.clientY / window.innerHeight - pointer.y) * 0.18
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

  return <canvas ref={canvasRef} className="about-field-canvas" aria-hidden="true" />
}

export function GetToKnow() {
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]

        if (visibleEntry) setActiveStep(Number((visibleEntry.target as HTMLElement).dataset.step))
      },
      { rootMargin: '-28% 0px -42%', threshold: [0.18, 0.48, 0.76] },
    )

    stepRefs.current.forEach((element) => {
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section className="about-field" id="tentang" aria-labelledby="about-field-title">
      <div className="about-field-stage">
        <AboutField activeStep={activeStep} />
        <div className="about-field-wash" aria-hidden="true" />

        <aside className="about-field-identity">
          <LogoMark width={250} height={74} className="about-field-logo" />
          <div>
            <strong>{getToKnowContent.identity}</strong>
            <span>{getToKnowContent.period}</span>
          </div>
          <p>{getToKnowContent.context}</p>
          <div className="about-field-meter" aria-hidden="true">
            {getToKnowContent.steps.map((item, index) => (
              <span className={index === activeStep ? 'is-active' : undefined} key={item.label} />
            ))}
          </div>
        </aside>
      </div>

      <div className="about-field-story">
        <header className="about-field-intro">
          <p>Get to know us</p>
          <h2 id="about-field-title">Kenal dulu. Baru bergerak bersama.</h2>
        </header>

        {getToKnowContent.steps.map((item, index) => (
          <article
            ref={(element) => {
              stepRefs.current[index] = element
            }}
            className={index === activeStep ? 'about-field-chapter is-active' : 'about-field-chapter'}
            data-step={index}
            key={item.label}
          >
            <div className="about-field-index">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.label}</strong>
            </div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
