import type { Lang } from '../content/types'
import { normalise, tokenize, repeatedWords } from '../engine/keywords'
import { hedgeCount } from '../engine/reactive'
import { countDisfluencies, totalFillers } from './fillers'
import { analysePauses, type EnergySample } from './pauses'

export interface Metrics {
  words: number
  /** Words per minute over time actually spent speaking. */
  wpm: number
  /** ± band around wpm, because speech-to-text drops words. */
  wpmBand: number
  fillers: number
  fillersPer100: number
  /** Estimate only — recognisers strip most non-lexical disfluencies. */
  disfluenciesEstimate: number
  hedges: number
  /** Moving-average type-token ratio, 0–1. Length-independent. */
  mattr: number
  avgSentenceWords: number
  longPauses: number
  longestPauseMs: number
  speakingMs: number
  totalMs: number
  topRepeats: { word: string; count: number }[]
  /**
   * False when the answer was typed. Pace and pause figures are meaningless
   * then — they would measure typing speed — so the report hides them.
   */
  spoken: boolean
}

/**
 * Moving-Average Type-Token Ratio. Plain TTR falls as text gets longer, which
 * would punish the user for talking more — MATTR does not.
 */
export function mattr(words: string[], window = 50): number {
  const normed = words.map(normalise).filter(Boolean)
  if (normed.length === 0) return 0
  if (normed.length <= window) {
    return new Set(normed).size / normed.length
  }

  const counts = new Map<string, number>()
  let distinct = 0
  let sum = 0
  let windows = 0

  for (let i = 0; i < normed.length; i++) {
    const word = normed[i]!
    const c = counts.get(word) ?? 0
    counts.set(word, c + 1)
    if (c === 0) distinct++

    if (i >= window) {
      const out = normed[i - window]!
      const oc = counts.get(out)!
      counts.set(out, oc - 1)
      if (oc === 1) distinct--
    }

    if (i >= window - 1) {
      sum += distinct / window
      windows++
    }
  }

  return windows ? sum / windows : 0
}

function sentences(text: string): string[] {
  return text
    .split(/[.!?…]+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export interface MetricsInput {
  text: string
  lang: Lang
  energy: EnergySample[]
  /** Wall-clock duration of the answer, used when there is no energy data. */
  durationMs: number
}

export function computeMetrics(input: MetricsInput): Metrics {
  const { text, lang, energy, durationMs } = input
  const words = tokenize(text)
  const wordCount = words.length

  const pauses = analysePauses(energy)
  const spoken = energy.length > 0
  // Prefer measured speaking time; fall back to wall clock in written mode.
  const speakingMs = pauses.speakingMs > 0 ? pauses.speakingMs : durationMs
  const minutes = speakingMs / 60_000

  const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0
  const fillers = totalFillers(text, lang)
  const disfluencies = countDisfluencies(text, lang).reduce(
    (n, h) => n + h.count,
    0,
  )

  const sents = sentences(text)
  const avgSentenceWords = sents.length
    ? Math.round(
        sents.reduce((n, s) => n + tokenize(s).length, 0) / sents.length,
      )
    : 0

  return {
    words: wordCount,
    wpm,
    // The recogniser typically drops 5–12% of words; widen the band on short
    // samples where a couple of missed words swing the rate a lot.
    wpmBand: Math.max(5, Math.round(wpm * (wordCount < 60 ? 0.16 : 0.09))),
    fillers,
    fillersPer100: wordCount ? +((fillers / wordCount) * 100).toFixed(1) : 0,
    disfluenciesEstimate: disfluencies,
    hedges: hedgeCount(text, lang),
    mattr: +mattr(words).toFixed(3),
    avgSentenceWords,
    longPauses: pauses.longPauses,
    longestPauseMs: pauses.longestPauseMs,
    speakingMs,
    totalMs: pauses.totalMs || durationMs,
    topRepeats: repeatedWords(text, lang, 4).slice(0, 3),
    spoken,
  }
}

/** Merge per-turn metrics into one session-level view. */
export function combineMetrics(
  parts: { text: string; energy: EnergySample[]; durationMs: number }[],
  lang: Lang,
): Metrics {
  const text = parts.map((p) => p.text).join(' ')
  // Re-base each turn's timeline so pauses are not invented between turns.
  let offset = 0
  const energy: EnergySample[] = []
  for (const part of parts) {
    const span = part.energy.length
      ? (part.energy[part.energy.length - 1]?.t ?? 0)
      : part.durationMs
    for (const s of part.energy) energy.push({ t: s.t + offset, rms: s.rms })
    offset += span
  }
  const durationMs = parts.reduce((n, p) => n + p.durationMs, 0)
  return computeMetrics({ text, lang, energy, durationMs })
}
