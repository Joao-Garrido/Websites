export type Lang = 'pt' | 'en'

/**
 * The "move" a question makes. Every probe is tagged with one, and personas are
 * defined as weight distributions over these — that is what makes an interviewer
 * sound different from a curious friend without any model behind it.
 */
export type Move =
  | 'concretize'
  | 'challenge'
  | 'personalize'
  | 'simplify'
  | 'quantify'
  | 'prioritize'
  | 'hypothesize'
  | 'contrast'

export const MOVES: Move[] = [
  'concretize',
  'challenge',
  'personalize',
  'simplify',
  'quantify',
  'prioritize',
  'hypothesize',
  'contrast',
]

export type CategoryId =
  | 'general'
  | 'work'
  | 'tech'
  | 'ideas'
  | 'personal'
  | 'culture'
  | 'opinions'

export type Difficulty = 1 | 2 | 3

export interface Category {
  id: CategoryId
  emoji: string
  label: Record<Lang, string>
}

export interface Topic {
  id: string
  lang: Lang
  category: CategoryId
  difficulty: Difficulty
  /** The line shown in the reel. */
  prompt: string
  /** 4–6 hand-written follow-ups specific to this topic. */
  probes: string[]
  /** Useful words/expressions, surfaced in the debrief. */
  vocab?: string[]
  /** Structure hint, e.g. 'PREP: Ponto, Razão, Exemplo, Ponto'. */
  framework?: string
}

export interface Probe {
  id: string
  lang: Lang
  move: Move
  text: string
}

/** Uses `{x}` as the slot for a phrase lifted from what the user actually said. */
export interface EchoTemplate {
  id: string
  lang: Lang
  move: Move
  text: string
}

export type PersonaId =
  | 'friend'
  | 'interviewer'
  | 'devil'
  | 'journalist'
  | 'skeptic'

export interface Persona {
  id: PersonaId
  emoji: string
  label: Record<Lang, string>
  blurb: Record<Lang, string>
  /** Relative weights over moves; need not sum to 1. */
  weights: Record<Move, number>
  /** How strongly this persona favours echo questions (0–1). */
  echoBias: number
  tts: { rate: number; pitch: number }
}

export type ModeId = 'flash' | 'conversation' | 'interview' | 'debate' | 'story'

export interface Mode {
  id: ModeId
  emoji: string
  label: Record<Lang, string>
  blurb: Record<Lang, string>
  /** Number of app turns; 1 means a single prompt then done (flash). */
  turns: number
  /** Seconds allowed per answer before the app nudges. 0 = untimed. */
  turnSeconds: number
  usesPersona: boolean
}
