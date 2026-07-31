import type { Mode, ModeId } from './types'

export const MODES: Mode[] = [
  {
    id: 'flash',
    emoji: '⚡',
    label: { pt: 'Relâmpago', en: 'Flash' },
    blurb: {
      pt: 'Um tema, 60 segundos, sem preparação. Gravado e analisado.',
      en: 'One topic, 60 seconds, no prep. Recorded and analysed.',
    },
    turns: 1,
    turnSeconds: 60,
    usesPersona: false,
  },
  {
    id: 'conversation',
    emoji: '💬',
    label: { pt: 'Conversa', en: 'Conversation' },
    blurb: {
      pt: 'Vai e vem com alguém que te ouve e responde ao que disseste.',
      en: 'Back and forth with someone who listens and responds to you.',
    },
    turns: 6,
    turnSeconds: 90,
    usesPersona: true,
  },
  {
    id: 'interview',
    emoji: '💼',
    label: { pt: 'Entrevista', en: 'Interview' },
    blurb: {
      pt: 'Perguntas de entrevista, com dicas de estrutura STAR.',
      en: 'Interview-style questions, with STAR structure hints.',
    },
    turns: 6,
    turnSeconds: 120,
    usesPersona: false,
  },
  {
    id: 'debate',
    emoji: '⚔️',
    label: { pt: 'Debate', en: 'Debate' },
    blurb: {
      pt: 'Recebes um lado para defender — provavelmente o que não escolherias.',
      en: 'You get a side to defend — probably not the one you would pick.',
    },
    turns: 6,
    turnSeconds: 90,
    usesPersona: false,
  },
  {
    id: 'story',
    emoji: '📖',
    label: { pt: 'História', en: 'Story' },
    blurb: {
      pt: 'Uma história pessoal, guiada pelo arco: contexto, tensão, desfecho.',
      en: 'A personal story, guided by the arc: setup, tension, resolution.',
    },
    turns: 5,
    turnSeconds: 120,
    usesPersona: false,
  },
]

export const MODE_BY_ID = new Map<ModeId, Mode>(MODES.map((m) => [m.id, m]))

export function getMode(id: ModeId): Mode {
  const m = MODE_BY_ID.get(id)
  if (!m) throw new Error(`Unknown mode: ${id}`)
  return m
}
