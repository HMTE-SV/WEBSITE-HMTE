'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent, KeyboardEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { LogoMark } from '@/components/site/Brand'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { formatCabinetTitle } from '@/lib/site-settings'
import styles from './LandingEntryChoice.module.css'

export type LandingEntryMode = 'choice' | 'experience' | 'skip'

type TransitionPhase = 'idle' | 'covering' | 'confirming' | 'revealing'

type LandingEntryChoiceProps = {
  activeIndex: number
  mode: LandingEntryMode
  onChooseExperience: () => void
  onSkipStart: () => void
  totalSlides: number
}

function jumpToNews({ focus = false }: { focus?: boolean } = {}) {
  const target = document.getElementById('kabar')
  if (!target) return

  const headerOffset = window.innerWidth <= 680 ? 64 : 72
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset
  const root = document.documentElement
  const previousScrollBehavior = root.style.scrollBehavior

  root.style.scrollBehavior = 'auto'
  window.scrollTo(0, top)
  root.style.scrollBehavior = previousScrollBehavior

  if (focus) {
    const heading = document.getElementById('news-deck-title')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }
}

function ArrowIcon({ down = false }: { down?: boolean }) {
  return (
    <svg className={styles.actionIcon} viewBox="0 0 24 24" aria-hidden="true">
      {down ? (
        <>
          <path d="M12 4v15" />
          <path d="m6.5 13.5 5.5 5.5 5.5-5.5" />
        </>
      ) : (
        <>
          <path d="M4 12h15" />
          <path d="m13.5 6.5 5.5 5.5-5.5 5.5" />
        </>
      )}
    </svg>
  )
}

export function LandingEntryChoice({
  activeIndex,
  mode,
  onChooseExperience,
  onSkipStart,
  totalSlides,
}: LandingEntryChoiceProps) {
  const cabinetLogo = useMediaSlot('cabinet.logo')
  const settings = useSiteSettings()
  const { fields } = usePageSection('hero')
  const cabinetTitle = formatCabinetTitle(settings)
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle')
  const phaseRef = useRef<TransitionPhase>('idle')
  const timersRef = useRef<number[]>([])
  const entryRef = useRef<HTMLElement>(null)

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  function commitPhase(nextPhase: TransitionPhase) {
    phaseRef.current = nextPhase
    setTransitionPhase(nextPhase)
  }

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay)
    timersRef.current.push(timer)
  }

  /*
   * Timer transisi hidup di luar React. Kalau komponen dilepas di tengah fase
   * covering atau revealing, callback yang tersisa akan memanggil setState pada
   * komponen yang sudah mati.
   */
  useEffect(() => {
    return () => clearTimers()
  }, [])

  useEffect(() => {
    if (mode !== 'choice' || transitionPhase !== 'idle') return

    const focusTimer = window.setTimeout(() => {
      entryRef.current?.focus({ preventScroll: true })
    }, 80)

    return () => window.clearTimeout(focusTimer)
  }, [mode, transitionPhase])

  function finishTransition() {
    if (phaseRef.current !== 'revealing') return

    clearTimers()
    commitPhase('idle')
    jumpToNews({ focus: true })
  }

  function beginReveal() {
    if (phaseRef.current !== 'confirming') return

    commitPhase('revealing')
    schedule(() => finishTransition(), 900)
  }

  function completeCover() {
    if (phaseRef.current !== 'covering') return

    clearTimers()
    jumpToNews()
    commitPhase('confirming')
    // Ring + check finish drawing around 730ms; hold so the mark can settle.
    schedule(beginReveal, 1060)
  }

  function handleExperience() {
    if (phaseRef.current !== 'idle') return
    onChooseExperience()
  }

  function handleSkip(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    if (phaseRef.current !== 'idle') return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSkipStart()
      jumpToNews()
      window.requestAnimationFrame(() => jumpToNews({ focus: true }))
      return
    }

    clearTimers()
    commitPhase('covering')
    onSkipStart()
    schedule(() => completeCover(), 960)
  }

  function handleWaveAnimationEnd(event: AnimationEvent<SVGSVGElement>) {
    // The ribbon paths run their own trailing animations and bubble up here;
    // only the sweep on the <svg> itself marks the end of a phase.
    if (event.target !== event.currentTarget) return

    if (phaseRef.current === 'covering') {
      completeCover()
    } else if (phaseRef.current === 'revealing') {
      finishTransition()
    }
  }

  function handleEntryKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return

    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    ).filter((control) => control.offsetParent !== null)

    if (controls.length === 0) return

    const firstControl = controls[0]
    const lastControl = controls[controls.length - 1]
    const activeElement = document.activeElement

    if (event.shiftKey && (activeElement === firstControl || activeElement === event.currentTarget)) {
      event.preventDefault()
      lastControl.focus()
    } else if (!event.shiftKey && activeElement === lastControl) {
      event.preventDefault()
      firstControl.focus()
    }
  }

  const isDormant = mode !== 'choice' && transitionPhase === 'idle'

  const entryScreen = (
    <section
      ref={entryRef}
      className={styles.entryLayer}
      data-mode={mode}
      data-phase={transitionPhase}
      role="dialog"
      aria-modal={!isDormant}
      aria-label="Pilih cara membuka situs HMTE"
      aria-hidden={isDormant}
      tabIndex={-1}
      onKeyDown={handleEntryKeyDown}
    >
      <svg
        className={styles.transitionWave}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        onAnimationEnd={handleWaveAnimationEnd}
      >
        <g className={styles.coverGraphic}>
          <path
            className={styles.waveDeep}
            d="M-34 0H121C150 15 111 34 139 51C164 68 119 84 151 100H-34Z"
          />
          <path
            className={styles.waveGold}
            d="M113 0C143 15 104 34 132 51C157 68 112 84 145 100H153C121 84 166 68 141 51C113 34 152 15 122 0Z"
          />
          <path
            className={styles.waveBlue}
            d="M108 0C137 15 99 34 126 51C151 68 106 84 139 100H145C112 84 157 68 132 51C105 34 143 15 114 0Z"
          />
        </g>
        <g className={styles.revealGraphic}>
          <path
            className={styles.waveDeep}
            d="M-17 0C13 15-25 34 3 51C28 68-17 84 16 100H134V0Z"
          />
          <path
            className={styles.waveGold}
            d="M-10 0C20 15-18 34 10 51C35 68-10 84 23 100H16C-17 84 28 68 3 51C-25 34 13 15-17 0Z"
          />
          <path
            className={styles.waveBlue}
            d="M-4 0C26 15-12 34 16 51C41 68-4 84 29 100H23C-10 84 35 68 10 51C-18 34 20 15-10 0Z"
          />
        </g>
      </svg>

      <div className={styles.ambientGrid} aria-hidden="true" />
      <div className={styles.signalField} aria-hidden="true" />

      <header className={styles.entryHeader}>
        <div className={styles.brandLockup}>
          <LogoMark width={116} height={34} className={styles.entryLogo} priority />
          <span>
            {fields.brandLabel}
            <small>Periode {settings.periodLabel}</small>
          </span>
        </div>

        <div className={styles.systemStatus}>
          <i aria-hidden="true" />
          <span>{fields.systemStatus}</span>
        </div>
      </header>

      <main className={styles.arrival}>
        <div className={styles.cabinetMark}>
          <span aria-hidden="true" />
          <Image
            className={styles.cabinetLogo}
            src={cabinetLogo.url}
            alt={cabinetLogo.alt}
            width={180}
            height={180}
            priority
          />
        </div>

        <div className={styles.arrivalCopy}>
          <p className={styles.eyebrow}>{cabinetTitle} · {settings.periodLabel}</p>
          <h2>{fields.arrivalTitle}</h2>
          <p>{fields.arrivalBody}</p>
        </div>

        <div className={styles.actions} aria-label="Pilihan masuk situs">
          <a
            className={styles.primaryAction}
            href="#kabar"
            onClick={handleSkip}
            data-testid="entry-news"
          >
            <span className={styles.routeNumber}>01</span>
            <strong>
              <small>{fields.quickKicker}</small>
              {fields.quickTitle}
              <span>{fields.quickBody}</span>
            </strong>
            <ArrowIcon />
          </a>

          <button
            className={styles.secondaryAction}
            type="button"
            onClick={handleExperience}
            data-testid="entry-story"
          >
            <span className={styles.routeNumber}>02</span>
            <strong>
              <small>{fields.storyKicker}</small>
              {fields.storyTitle}
              <span>{fields.storyBody}</span>
            </strong>
            <ArrowIcon down />
          </button>
        </div>
      </main>

      <footer className={styles.entryFoot}>
        <span>{fields.footerLine}</span>
        <small>{fields.footerHint}</small>
      </footer>

      <div className={styles.newsConfirmation} role="status" aria-live="polite">
        <div className={styles.confirmMark}>
          <Image
            src={cabinetLogo.url}
            alt=""
            width={76}
            height={76}
          />
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle className={styles.confirmRing} cx="24" cy="24" r="20" />
            <path className={styles.confirmCheck} d="m14 24 7 7 14-16" />
          </svg>
        </div>
        <span>{fields.confirmKicker}</span>
        <strong>{fields.confirmTitle}</strong>
        <small>{fields.confirmBody}</small>
      </div>
    </section>
  )

  return (
    <>
      {transitionPhase !== 'idle' && typeof document !== 'undefined'
        ? createPortal(entryScreen, document.body)
        : entryScreen}

      {mode === 'experience' && (
        <div className={styles.storyOverlay}>
          <div className={styles.frameCorners} key={`frame-${activeIndex}`} aria-hidden="true" />
          <div className={styles.storyMeta} aria-hidden="true">
            <span>{fields.storyLabel}</span>
            <strong key={`count-${activeIndex}`}>
              {String(activeIndex + 1).padStart(2, '0')}
              <i>/</i>
              {String(totalSlides).padStart(2, '0')}
            </strong>
          </div>
          <div className={styles.scrollGuide} aria-hidden="true">
            <span>{fields.scrollGuide}</span>
            <i />
          </div>
        </div>
      )}
    </>
  )
}
