import type { Lang, ModeId, PersonaId } from '../content/types'
import type { Metrics } from '../analysis/metrics'

export interface Turn {
  speaker: 'app' | 'user'
  text: string
  ms: number
}

export interface SessionRecord {
  id: string
  startedAt: number
  lang: Lang
  mode: ModeId
  topicId: string
  topicPrompt: string
  personaId?: PersonaId
  turns: Turn[]
  metrics: Metrics
  /** Key into IndexedDB, when audio was captured. */
  audioKey?: string
}

export interface Settings {
  lang: Lang
  mode: ModeId
  personaId: PersonaId
  category: string
  ttsEnabled: boolean
  saveAudio: boolean
  /** End a turn automatically after this much silence. 0 disables it. */
  silenceMs: number
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'pt',
  mode: 'conversation',
  personaId: 'friend',
  category: 'all',
  ttsEnabled: true,
  saveAudio: true,
  silenceMs: 2500,
}
