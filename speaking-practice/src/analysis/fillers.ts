import type { Lang } from '../content/types'

/**
 * Lexical fillers — real words used as crutches. These survive speech-to-text,
 * so counting them is reasonably reliable.
 */
export const FILLERS: Record<Lang, string[]> = {
  pt: [
    'tipo',
    'pronto',
    'basicamente',
    'ou seja',
    'quer dizer',
    'portanto',
    'digamos',
    'sei lá',
    'no fundo',
    'à partida',
    'na verdade',
  ],
  en: [
    'like',
    'you know',
    'basically',
    'actually',
    'i mean',
    'sort of',
    'kind of',
    'literally',
    'right',
    'so yeah',
    'to be honest',
  ],
}

/**
 * Non-lexical disfluencies. Chrome strips most of these from the *final*
 * transcript, so counts derived from final text badly understate reality.
 * We count them but always label the result as an estimate.
 */
export const DISFLUENCIES: Record<Lang, string[]> = {
  pt: ['hum', 'hmm', 'ahm', 'ah', 'eh', 'ãh'],
  en: ['um', 'uh', 'umm', 'uhh', 'er', 'ah', 'hmm'],
}

export interface FillerHit {
  phrase: string
  count: number
}

function countPhrase(haystack: string, phrase: string): number {
  // Word-boundary-ish matching that tolerates punctuation around the phrase.
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'giu')
  return (haystack.match(re) ?? []).length
}

export function countFillers(text: string, lang: Lang): FillerHit[] {
  return FILLERS[lang]
    .map((phrase) => ({ phrase, count: countPhrase(text, phrase) }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function countDisfluencies(text: string, lang: Lang): FillerHit[] {
  return DISFLUENCIES[lang]
    .map((phrase) => ({ phrase, count: countPhrase(text, phrase) }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function totalFillers(text: string, lang: Lang): number {
  return countFillers(text, lang).reduce((n, h) => n + h.count, 0)
}

/** Ranges to highlight filler phrases in the transcript, non-overlapping. */
export function fillerRanges(
  text: string,
  lang: Lang,
): { start: number; end: number; phrase: string }[] {
  const ranges: { start: number; end: number; phrase: string }[] = []
  for (const phrase of FILLERS[lang]) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'giu')
    for (const m of text.matchAll(re)) {
      if (m.index === undefined) continue
      ranges.push({ start: m.index, end: m.index + m[0].length, phrase })
    }
  }
  ranges.sort((a, b) => a.start - b.start)
  // Drop overlaps so rendering stays simple; longer phrases win by arriving first.
  const out: typeof ranges = []
  let cursor = -1
  for (const r of ranges) {
    if (r.start >= cursor) {
      out.push(r)
      cursor = r.end
    }
  }
  return out
}
