import type { Persona, PersonaId } from './types'

/**
 * Weights are relative pulls, not probabilities. A 0 means "this persona never
 * makes that move". The selector normalises them at pick time.
 */
export const PERSONAS: Persona[] = [
  {
    id: 'friend',
    emoji: '☕',
    label: { pt: 'Amigo curioso', en: 'Curious friend' },
    blurb: {
      pt: 'Interessado, calmo, quer os detalhes e as histórias.',
      en: 'Interested, calm, wants the details and the stories.',
    },
    weights: {
      personalize: 5,
      concretize: 4,
      simplify: 2,
      contrast: 2,
      hypothesize: 2,
      prioritize: 1,
      challenge: 1,
      quantify: 0,
    },
    echoBias: 0.45,
    tts: { rate: 0.95, pitch: 1.0 },
  },
  {
    id: 'interviewer',
    emoji: '💼',
    label: { pt: 'Entrevistador', en: 'Interviewer' },
    blurb: {
      pt: 'Formal e estruturado. Quer resultados, números e decisões.',
      en: 'Formal and structured. Wants outcomes, numbers and decisions.',
    },
    weights: {
      quantify: 5,
      prioritize: 4,
      concretize: 4,
      personalize: 3,
      challenge: 2,
      contrast: 1,
      simplify: 1,
      hypothesize: 1,
    },
    echoBias: 0.3,
    tts: { rate: 1.0, pitch: 0.95 },
  },
  {
    id: 'devil',
    emoji: '🔥',
    label: { pt: 'Advogado do diabo', en: "Devil's advocate" },
    blurb: {
      pt: 'Discorda por desporto. Vai atacar a tua posição.',
      en: 'Disagrees for sport. Will attack your position.',
    },
    weights: {
      challenge: 6,
      hypothesize: 4,
      contrast: 3,
      quantify: 2,
      prioritize: 2,
      concretize: 2,
      simplify: 1,
      personalize: 0,
    },
    echoBias: 0.4,
    tts: { rate: 1.08, pitch: 0.92 },
  },
  {
    id: 'journalist',
    emoji: '🎙️',
    label: { pt: 'Jornalista', en: 'Journalist' },
    blurb: {
      pt: 'Segue o fio do que disseste. Pede factos e exemplos.',
      en: 'Follows your thread. Asks for facts and examples.',
    },
    weights: {
      concretize: 5,
      quantify: 3,
      contrast: 3,
      challenge: 3,
      personalize: 3,
      prioritize: 2,
      hypothesize: 1,
      simplify: 1,
    },
    echoBias: 0.7,
    tts: { rate: 1.0, pitch: 1.0 },
  },
  {
    id: 'skeptic',
    emoji: '🧊',
    label: { pt: 'Cético', en: 'Skeptic' },
    blurb: {
      pt: 'Seco e direto. Não aceita generalizações.',
      en: 'Dry and direct. Will not accept generalisations.',
    },
    weights: {
      challenge: 5,
      quantify: 4,
      concretize: 4,
      simplify: 3,
      prioritize: 2,
      hypothesize: 2,
      contrast: 1,
      personalize: 0,
    },
    echoBias: 0.35,
    tts: { rate: 0.98, pitch: 0.88 },
  },
]

export const PERSONA_BY_ID = new Map<PersonaId, Persona>(
  PERSONAS.map((p) => [p.id, p]),
)

export function getPersona(id: PersonaId): Persona {
  const p = PERSONA_BY_ID.get(id)
  if (!p) throw new Error(`Unknown persona: ${id}`)
  return p
}
