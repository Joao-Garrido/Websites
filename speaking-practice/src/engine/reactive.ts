import type { Lang } from '../content/types'
import { normalise, repeatedWords, tokenize } from './keywords'

export type ReactiveTrigger =
  | 'tooShort'
  | 'noExample'
  | 'hedging'
  | 'absolutes'
  | 'repetition'
  | 'tooLong'
  | 'silence'

export interface ReactiveHit {
  trigger: ReactiveTrigger
  /** Word to inject into `{x}`, when the line has a slot. */
  slot?: string
  /** Higher wins when several triggers fire at once. */
  priority: number
}

const HEDGES: Record<Lang, string[]> = {
  pt: [
    'acho que',
    'se calhar',
    'talvez',
    'não sei bem',
    'mais ou menos',
    'de certa forma',
    'em princípio',
    'não tenho a certeza',
    'suponho',
    'parece-me',
  ],
  en: [
    'i guess',
    'sort of',
    'kind of',
    'maybe',
    'i think',
    'not sure',
    'i suppose',
    'more or less',
    'in a way',
    'probably',
  ],
}

const ABSOLUTES: Record<Lang, string[]> = {
  pt: ['sempre', 'nunca', 'toda a gente', 'ninguém', 'tudo', 'nada', 'jamais'],
  en: ['always', 'never', 'everyone', 'nobody', 'everything', 'nothing'],
}

/** Markers that signal a concrete anecdote rather than abstraction. */
const NARRATIVE: Record<Lang, string[]> = {
  pt: [
    'quando',
    'ontem',
    'uma vez',
    'lembro',
    'aconteceu',
    'estava',
    'fomos',
    'disse',
    'ano passado',
    'na altura',
  ],
  en: [
    'when',
    'yesterday',
    'once',
    'remember',
    'happened',
    'was',
    'we went',
    'said',
    'last year',
    'back then',
  ],
}

const FILLER_ONLY = /^[\s.,!?…]*$/

function hasNumber(text: string): boolean {
  return /\d/.test(text)
}

/** A capitalised word that is not sentence-initial reads as a name/place. */
function hasProperNoun(text: string): boolean {
  const words = text.split(/\s+/)
  return words.some(
    (w, i) => i > 0 && /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]{2,}/.test(w),
  )
}

function countOccurrences(haystack: string, needles: string[]): number {
  let n = 0
  for (const needle of needles) {
    let from = 0
    for (;;) {
      const at = haystack.indexOf(needle, from)
      if (at === -1) break
      n++
      from = at + needle.length
    }
  }
  return n
}

export interface ReactiveInput {
  text: string
  lang: Lang
  /** How long the user spoke, in milliseconds. */
  durationMs: number
  /** Turn index, 0-based — the first turn is judged more gently. */
  turnIndex: number
}

/**
 * Decide whether the user's answer itself warrants a specific response, rather
 * than a generic follow-up. Returns the highest-priority hit, or null.
 */
export function detectReactive(input: ReactiveInput): ReactiveHit | null {
  const { text, lang, durationMs, turnIndex } = input
  const lower = ` ${text.toLowerCase()} `
  const words = tokenize(text)
  const wordCount = words.length

  const hits: ReactiveHit[] = []

  if (!text.trim() || FILLER_ONLY.test(text)) {
    return { trigger: 'silence', priority: 100 }
  }

  // Silence is judged by what was said, not by how long the mic was open.
  if (wordCount < 25) {
    hits.push({ trigger: 'tooShort', priority: 90 - turnIndex })
  }

  if (durationMs > 90_000 && wordCount > 150) {
    hits.push({ trigger: 'tooLong', priority: 70 })
  }

  const hedgeCount = countOccurrences(lower, HEDGES[lang])
  // One hedge is normal speech; three is a pattern worth naming.
  if (hedgeCount >= 3) {
    hits.push({ trigger: 'hedging', priority: 65 })
  }

  const absolute = ABSOLUTES[lang].find((a) => lower.includes(` ${a} `))
  if (absolute) {
    hits.push({ trigger: 'absolutes', slot: absolute, priority: 60 })
  }

  // Only worth asking for an example once the answer is long enough that its
  // abstractness is a choice rather than brevity.
  if (wordCount >= 40) {
    const narrative = countOccurrences(lower, NARRATIVE[lang])
    if (!hasNumber(text) && !hasProperNoun(text) && narrative === 0) {
      hits.push({ trigger: 'noExample', priority: 75 })
    }
  }

  const repeats = repeatedWords(text, lang, 4)
  const topRepeat = repeats[0]
  if (topRepeat && wordCount >= 40) {
    hits.push({
      trigger: 'repetition',
      slot: topRepeat.word,
      priority: 55 + Math.min(topRepeat.count, 8),
    })
  }

  if (!hits.length) return null
  hits.sort((a, b) => b.priority - a.priority)
  return hits[0]!
}

/** Exposed for the analysis layer so both use the same lists. */
export function hedgeCount(text: string, lang: Lang): number {
  return countOccurrences(` ${text.toLowerCase()} `, HEDGES[lang])
}

export function absoluteCount(text: string, lang: Lang): number {
  const lower = ` ${text.toLowerCase()} `
  return ABSOLUTES[lang].filter((a) => lower.includes(` ${a} `)).length
}

export { HEDGES, ABSOLUTES }
export { normalise }
