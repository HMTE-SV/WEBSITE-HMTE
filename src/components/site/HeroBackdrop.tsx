import type { ReactNode } from 'react'

/*
 * Shared hero backdrop: the navy field, gold light and lit geometry that
 * /berita established, factored out so every page can wear the same clothes.
 *
 * Colour of the *field* lives in CSS (css/hero-backdrop.css) so it tracks the
 * design tokens. The *forms* live here as SVG.
 *
 * These forms are shaded volumes, not wireframes. That distinction is the
 * whole point: the original hero read as a large curved body catching light
 * because it was built from broad filled bands (a CSS box-shadow spread of
 * 8vw and 18vw at ~2% opacity), not from strokes. Every figure below is
 * therefore made of three ingredients:
 *
 *   1. halo  — very wide, very faint filled bands stepping outward, which is
 *              what gives the form its soft atmospheric mass
 *   2. body  — a radial gradient offset toward the light, so the surface is
 *              brighter where it faces the source and falls off away from it
 *   3. rim   — four concentric passes that widen as they fade, faking a soft
 *              specular edge; a single stroke can only ever look flat
 *
 * Do not "simplify" these back into single hairline strokes.
 */
export type HeroBackdropVariant = 'arc' | 'orbit' | 'dome' | 'crest' | 'drift'

export const heroBackdropVariants: HeroBackdropVariant[] = [
  'arc',
  'orbit',
  'dome',
  'crest',
  'drift',
]

export const heroBackdropLabels: Record<HeroBackdropVariant, string> = {
  arc: 'Arc — bola besar dari sudut kanan bawah, disinari dari kiri atas',
  orbit: 'Orbit — bola dari tepi kiri dengan satu bola kecil pendamping',
  dome: 'Dome — kubah yang naik dari bawah tengah',
  crest: 'Crest — bola dari sudut kanan atas, cahaya dari bawah kiri',
  drift: 'Drift — dua sapuan cahaya diagonal, tanpa bentuk padat',
}

const GOLD = '#f5b82e'

/** Widening, fading passes that read as a soft lit edge instead of a line. */
const RIM_PASSES = [
  { width: 30, opacity: 0.055 },
  { width: 11, opacity: 0.11 },
  { width: 3.6, opacity: 0.22 },
  { width: 1.3, opacity: 0.52 },
]

type LitSphereProps = {
  id: string
  cx: number
  cy: number
  r: number
  /** Light position within the sphere's bounding box, 0–1. */
  lx: number
  ly: number
  strength?: number
  halo?: boolean
}

function LitSphere({
  id,
  cx,
  cy,
  r,
  lx,
  ly,
  strength = 1,
  halo = true,
}: LitSphereProps) {
  const bodyId = `${id}-body`
  const rimId = `${id}-rim`

  return (
    <>
      <defs>
        <radialGradient id={bodyId} cx={lx} cy={ly} r="0.94">
          <stop offset="0%" stopColor="#a9caf4" stopOpacity={0.13 * strength} />
          <stop offset="24%" stopColor="#e6c88d" stopOpacity={0.055 * strength} />
          <stop offset="56%" stopColor="#2f5f9e" stopOpacity={0.032 * strength} />
          <stop offset="100%" stopColor="#02132f" stopOpacity="0" />
        </radialGradient>

        {/* Brightest where the surface turns toward the light, dark opposite. */}
        <linearGradient id={rimId} x1={lx} y1={ly} x2={1 - lx} y2={1 - ly}>
          <stop offset="0%" stopColor="#e2edff" stopOpacity={0.36 * strength} />
          <stop offset="28%" stopColor={GOLD} stopOpacity={0.2 * strength} />
          <stop offset="66%" stopColor="#7e9ec9" stopOpacity={0.05 * strength} />
          <stop offset="100%" stopColor="#02132f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {halo && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={r + 98}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.021 * strength}
            strokeWidth={190}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r + 276}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.014 * strength}
            strokeWidth={212}
          />
        </>
      )}

      <circle cx={cx} cy={cy} r={r} fill={`url(#${bodyId})`} />

      {RIM_PASSES.map(({ width, opacity }) => (
        <circle
          key={width}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${rimId})`}
          strokeOpacity={opacity * strength}
          strokeWidth={width}
        />
      ))}
    </>
  )
}

type LightSweepProps = {
  id: string
  cx: number
  cy: number
  rx: number
  ry: number
  angle: number
  strength?: number
}

/** A soft volume of light with no edge — used where a hard form is too heavy. */
function LightSweep({ id, cx, cy, rx, ry, angle, strength = 1 }: LightSweepProps) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#bed7ff" stopOpacity={0.1 * strength} />
          <stop offset="38%" stopColor="#eec983" stopOpacity={0.045 * strength} />
          <stop offset="100%" stopColor="#02132f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={`url(#${id})`}
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    </>
  )
}

function Arc() {
  return <LitSphere id="hb-arc" cx={1180} cy={905} r={650} lx={0.3} ly={0.16} />
}

function Orbit() {
  return (
    <>
      <LitSphere id="hb-orbit-main" cx={40} cy={430} r={530} lx={0.74} ly={0.26} />
      <LitSphere
        id="hb-orbit-moon"
        cx={1268}
        cy={158}
        r={134}
        lx={0.32}
        ly={0.28}
        strength={0.85}
        halo={false}
      />
    </>
  )
}

function Dome() {
  return <LitSphere id="hb-dome" cx={720} cy={1290} r={700} lx={0.36} ly={0.13} />
}

function Crest() {
  return (
    <>
      <LitSphere id="hb-crest" cx={1330} cy={-120} r={560} lx={0.32} ly={0.64} />
      <LightSweep
        id="hb-crest-sweep"
        cx={280}
        cy={780}
        rx={640}
        ry={200}
        angle={-18}
        strength={0.7}
      />
    </>
  )
}

/*
 * Sweeps are kept tall and overlapping through the middle of the canvas: this
 * variant also serves short header bands (the /kepengurusan masthead is 190px),
 * where "slice" crops to a thin horizontal strip through the vertical centre.
 */
function Drift() {
  return (
    <>
      <LightSweep id="hb-drift-a" cx={420} cy={170} rx={780} ry={250} angle={-22} />
      <LightSweep
        id="hb-drift-b"
        cx={1140}
        cy={520}
        rx={680}
        ry={250}
        angle={-14}
        strength={0.78}
      />
      <LightSweep
        id="hb-drift-c"
        cx={1330}
        cy={120}
        rx={430}
        ry={320}
        angle={12}
        strength={0.55}
      />
    </>
  )
}

const figures: Record<HeroBackdropVariant, () => ReactNode> = {
  arc: Arc,
  orbit: Orbit,
  dome: Dome,
  crest: Crest,
  drift: Drift,
}

type HeroBackdropProps = {
  variant?: HeroBackdropVariant
  /** Drops the ruled mesh for heroes that already carry their own texture. */
  mesh?: boolean
}

export function HeroBackdrop({ variant = 'arc', mesh = true }: HeroBackdropProps) {
  const Figure = figures[variant]

  return (
    <div
      className="hero-backdrop"
      data-variant={variant}
      data-mesh={mesh ? 'on' : 'off'}
      aria-hidden="true"
    >
      <svg
        className="hero-backdrop-figure"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <Figure />
      </svg>
    </div>
  )
}
