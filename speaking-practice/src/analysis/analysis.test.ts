import { describe, expect, it } from 'vitest'
import { countFillers, fillerRanges, totalFillers } from './fillers'
import { computeMetrics, mattr } from './metrics'
import { analysePauses, isSilentFor, type EnergySample } from './pauses'
import { buildReport } from './report'

/** Build an energy timeline at 20 Hz from alternating loud/quiet spans. */
function timeline(spans: { ms: number; loud: boolean }[]): EnergySample[] {
  const out: EnergySample[] = []
  let t = 0
  for (const span of spans) {
    for (let i = 0; i < span.ms; i += 50) {
      out.push({ t, rms: span.loud ? 0.09 : 0.002 })
      t += 50
    }
  }
  return out
}

describe('mattr', () => {
  it('is 1 when every word is distinct', () => {
    expect(mattr(['um', 'dois', 'tres', 'quatro'])).toBe(1)
  })

  it('is low when a word dominates', () => {
    expect(mattr(Array(40).fill('igual'))).toBeCloseTo(1 / 40, 5)
  })

  it('does not fall just because the text is longer', () => {
    // Same variety, different lengths — MATTR should stay comparable, unlike
    // plain type-token ratio.
    const unit = ['casa', 'porta', 'rua', 'carro', 'arvore']
    const short = Array.from({ length: 12 }, (_, i) => unit[i % 5]!)
    const long = Array.from({ length: 200 }, (_, i) => unit[i % 5]!)
    expect(Math.abs(mattr(short) - mattr(long))).toBeLessThan(0.35)
  })

  it('ignores case and accents', () => {
    expect(mattr(['Casa', 'casa', 'CASA'])).toBeCloseTo(1 / 3, 5)
  })
})

describe('fillers', () => {
  it('counts Portuguese crutches', () => {
    const text = 'Isto é tipo complicado, pronto, basicamente tipo não sei.'
    expect(totalFillers(text, 'pt')).toBe(4)
    expect(countFillers(text, 'pt')[0]).toEqual({ phrase: 'tipo', count: 2 })
  })

  it('counts English crutches', () => {
    const text = 'It is like, you know, basically like a big deal, actually.'
    expect(totalFillers(text, 'en')).toBe(5)
  })

  it('does not match inside longer words', () => {
    // "atualmente" contains no filler; "praticamente" must not match "mente".
    expect(totalFillers('Praticamente atualmente tipologia', 'pt')).toBe(0)
  })

  it('returns non-overlapping highlight ranges in order', () => {
    const text = 'tipo isto é basicamente tipo assim'
    const ranges = fillerRanges(text, 'pt')
    expect(ranges.length).toBe(3)
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.start).toBeGreaterThanOrEqual(ranges[i - 1]!.end)
    }
  })
})

describe('analysePauses', () => {
  it('finds a long pause between two bursts of speech', () => {
    const samples = timeline([
      { ms: 2000, loud: true },
      { ms: 1500, loud: false },
      { ms: 2000, loud: true },
    ])
    const result = analysePauses(samples)
    expect(result.longPauses).toBe(1)
    expect(result.longestPauseMs).toBeGreaterThan(1200)
    expect(result.speakingMs).toBeGreaterThan(3000)
  })

  it('ignores short gaps between words', () => {
    const samples = timeline([
      { ms: 2000, loud: true },
      { ms: 250, loud: false },
      { ms: 2000, loud: true },
    ])
    expect(analysePauses(samples).longPauses).toBe(0)
  })

  it('does not count leading silence as a pause', () => {
    const samples = timeline([
      { ms: 3000, loud: false },
      { ms: 2000, loud: true },
    ])
    expect(analysePauses(samples).longPauses).toBe(0)
  })

  it('handles an empty or tiny timeline', () => {
    expect(analysePauses([]).longPauses).toBe(0)
    expect(analysePauses([{ t: 0, rms: 0.5 }]).speakingMs).toBe(0)
  })
})

describe('isSilentFor', () => {
  const threshold = 0.012

  it('is true after sustained quiet', () => {
    const samples = timeline([
      { ms: 3000, loud: true },
      { ms: 3000, loud: false },
    ])
    expect(isSilentFor(samples, 2500, threshold)).toBe(true)
  })

  it('is false while the user is still talking', () => {
    const samples = timeline([
      { ms: 3000, loud: false },
      { ms: 3000, loud: true },
    ])
    expect(isSilentFor(samples, 2500, threshold)).toBe(false)
  })

  it('is false before enough time has elapsed to judge', () => {
    expect(isSilentFor(timeline([{ ms: 800, loud: false }]), 2500, threshold)).toBe(
      false,
    )
  })
})

describe('computeMetrics', () => {
  it('derives a plausible rate from known speech', () => {
    // 60 words over 30s of speech = 120 wpm.
    const text = Array.from({ length: 60 }, (_, i) => `palavra${i}`).join(' ')
    const energy = timeline([{ ms: 30_000, loud: true }])
    const m = computeMetrics({ text, lang: 'pt', energy, durationMs: 30_000 })
    expect(m.words).toBe(60)
    expect(m.wpm).toBeGreaterThan(110)
    expect(m.wpm).toBeLessThan(130)
    expect(m.wpmBand).toBeGreaterThan(0)
  })

  it('falls back to wall-clock time when there is no audio', () => {
    const text = Array.from({ length: 30 }, () => 'palavra').join(' ')
    const m = computeMetrics({ text, lang: 'pt', energy: [], durationMs: 60_000 })
    expect(m.wpm).toBe(30)
  })

  it('survives an empty answer', () => {
    const m = computeMetrics({ text: '', lang: 'pt', energy: [], durationMs: 0 })
    expect(m.words).toBe(0)
    expect(m.wpm).toBe(0)
    expect(Number.isFinite(m.mattr)).toBe(true)
  })
})

describe('buildReport', () => {
  it('asks for more speech rather than judging a stub', () => {
    const m = computeMetrics({ text: 'Sim.', lang: 'pt', energy: [], durationMs: 1000 })
    const report = buildReport(m, 'pt')
    expect(report).toHaveLength(1)
    expect(report[0]!.id).toBe('empty')
  })

  it('never produces an overall score, and always caveats the pace', () => {
    const text = Array.from({ length: 120 }, (_, i) => `palavra${i % 40}`).join(' ')
    const energy = timeline([{ ms: 50_000, loud: true }])
    const report = buildReport(
      computeMetrics({ text, lang: 'pt', energy, durationMs: 50_000 }),
      'pt',
    )
    expect(report.some((i) => /score|nota|pontua/i.test(i.label))).toBe(false)
    expect(report.find((i) => i.id === 'pace')?.caveat).toBeTruthy()
  })

  it('hides pace and pauses for a typed session', () => {
    // Typing 60 words in 4 seconds would read as ~900 wpm — meaningless as a
    // speaking metric, so it must not be reported at all.
    const text = Array.from({ length: 60 }, (_, i) => `palavra${i}`).join(' ')
    const m = computeMetrics({ text, lang: 'pt', energy: [], durationMs: 4000 })
    expect(m.spoken).toBe(false)

    const report = buildReport(m, 'pt')
    expect(report.find((i) => i.id === 'pace')).toBeUndefined()
    expect(report.find((i) => i.id === 'pauses')).toBeUndefined()
    expect(report.find((i) => i.id === 'written')).toBeDefined()
    // Vocabulary and fillers still work on typed text.
    expect(report.find((i) => i.id === 'variety')).toBeDefined()
  })

  it('reports pace for a spoken session', () => {
    const text = Array.from({ length: 60 }, (_, i) => `palavra${i}`).join(' ')
    const m = computeMetrics({
      text,
      lang: 'pt',
      energy: timeline([{ ms: 30_000, loud: true }]),
      durationMs: 30_000,
    })
    expect(m.spoken).toBe(true)
    expect(buildReport(m, 'pt').find((i) => i.id === 'pace')).toBeDefined()
  })

  it('flags heavy filler use', () => {
    const text = `${Array(20).fill('tipo').join(' ')} ${Array(80).fill('palavra').join(' ')}`
    const report = buildReport(
      computeMetrics({
        text,
        lang: 'pt',
        energy: timeline([{ ms: 40_000, loud: true }]),
        durationMs: 40_000,
      }),
      'pt',
    )
    expect(report.find((i) => i.id === 'fillers')?.verdict).toBe('watch')
  })
})
