import { useEffect, useRef, useState } from 'react'
import type { Topic } from '../content/types'

/**
 * The slot-machine reel. Cycles through decoy topics before settling on the
 * real one — the anticipation is most of why spinning feels good.
 */
export function TopicReel({
  topic,
  pool,
  spinToken,
  eyebrow,
}: {
  topic: Topic | null
  pool: Topic[]
  /** Incremented by the parent on every spin to retrigger the animation. */
  spinToken: number
  eyebrow: string
}) {
  const [display, setDisplay] = useState<string>(topic?.prompt ?? '')
  const [spinning, setSpinning] = useState(false)
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      setDisplay(topic?.prompt ?? '')
      return
    }
    if (!topic) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || pool.length < 3) {
      setDisplay(topic.prompt)
      return
    }

    setSpinning(true)
    let step = 0
    const total = 11
    let timer: number

    const tick = () => {
      step++
      if (step >= total) {
        setDisplay(topic.prompt)
        setSpinning(false)
        return
      }
      const decoy = pool[Math.floor(Math.random() * pool.length)]
      setDisplay(decoy?.prompt ?? topic.prompt)
      // Ease out: each frame lingers a little longer than the last.
      timer = window.setTimeout(tick, 45 + step * step * 2.2)
    }
    timer = window.setTimeout(tick, 45)
    return () => window.clearTimeout(timer)
  }, [spinToken, topic, pool])

  return (
    <section className="flex min-h-[9.5rem] flex-col items-center justify-center gap-3 text-center sm:min-h-[11rem]">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-fg-faint">
        {eyebrow}
      </p>
      <p
        aria-live="polite"
        className={cxReel(spinning)}
        style={{ transition: 'opacity 140ms, transform 220ms var(--ease-settle)' }}
      >
        {display || '—'}
      </p>
    </section>
  )
}

function cxReel(spinning: boolean): string {
  return [
    'font-display text-balance text-3xl leading-[1.15] sm:text-[2.6rem]',
    spinning ? 'text-fg-dim opacity-70 blur-[0.4px]' : 'text-fg opacity-100 scale-100',
  ].join(' ')
}
