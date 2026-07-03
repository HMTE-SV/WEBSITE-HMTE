'use client'

import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/site/Brand'
import { getToKnowContent } from '@/data/site-content'

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

        if (visibleEntry) {
          const index = Number((visibleEntry.target as HTMLElement).dataset.step)
          setActiveStep(index)
        }
      },
      { rootMargin: '-32% 0px -42%', threshold: [0.2, 0.5, 0.8] },
    )

    stepRefs.current.forEach((element) => {
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section className="landing-about" id="tentang" aria-labelledby="about-title">
      <div className="landing-about-shell">
        <aside className="landing-about-identity">
          <div className="landing-about-logo-wrap">
            <LogoMark width={330} height={98} className="landing-about-logo" />
          </div>
          <div className="landing-about-meta">
            <div>
              <span>{getToKnowContent.identity}</span>
              <strong>{getToKnowContent.period}</strong>
            </div>
            <p>{getToKnowContent.context}</p>
          </div>
          <div className="landing-about-progress" aria-hidden="true">
            {getToKnowContent.steps.map((step, index) => (
              <span className={index === activeStep ? 'is-active' : undefined} key={step.label} />
            ))}
          </div>
          <div className="landing-about-index" aria-hidden="true">
            <span>{String(activeStep + 1).padStart(2, '0')}</span>
            <span>{String(getToKnowContent.steps.length).padStart(2, '0')}</span>
          </div>
        </aside>

        <div className="landing-about-story">
          <header className="landing-about-intro">
            <span className="landing-eyebrow">Get to know us</span>
            <h2 id="about-title">Kenal dulu. Baru bergerak bersama.</h2>
          </header>

          {getToKnowContent.steps.map((step, index) => (
            <article
              ref={(element) => {
                stepRefs.current[index] = element
              }}
              className={index === activeStep ? 'landing-about-step is-active' : 'landing-about-step'}
              data-step={index}
              key={step.label}
            >
              <span>{String(index + 1).padStart(2, '0')} · {step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
