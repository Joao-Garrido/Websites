import type { CategoryId, EchoTemplate, Lang, Probe, Topic } from './types'
import { PT_TOPICS } from './topics/pt'
import { EN_TOPICS } from './topics/en'
import {
  PT_ACKS,
  PT_CLOSER,
  PT_ECHO,
  PT_PROBES,
  PT_REACTIVE,
} from './probes/pt'
import {
  EN_ACKS,
  EN_CLOSER,
  EN_ECHO,
  EN_PROBES,
  EN_REACTIVE,
} from './probes/en'

export type ReactiveKey = keyof typeof PT_REACTIVE

export interface LangPack {
  topics: Topic[]
  probes: Probe[]
  echo: EchoTemplate[]
  reactive: Record<ReactiveKey, readonly string[]>
  closer: string
  acks: readonly string[]
}

const PACKS: Record<Lang, LangPack> = {
  pt: {
    topics: PT_TOPICS,
    probes: PT_PROBES,
    echo: PT_ECHO,
    reactive: PT_REACTIVE,
    closer: PT_CLOSER,
    acks: PT_ACKS,
  },
  en: {
    topics: EN_TOPICS,
    probes: EN_PROBES,
    echo: EN_ECHO,
    reactive: EN_REACTIVE,
    closer: EN_CLOSER,
    acks: EN_ACKS,
  },
}

export function pack(lang: Lang): LangPack {
  return PACKS[lang]
}

export function topicsFor(lang: Lang, category: CategoryId | 'all'): Topic[] {
  const all = PACKS[lang].topics
  return category === 'all' ? all : all.filter((t) => t.category === category)
}

export function topicById(id: string): Topic | undefined {
  return PT_TOPICS.find((t) => t.id === id) ?? EN_TOPICS.find((t) => t.id === id)
}

export * from './types'
export { CATEGORIES } from './categories'
export { MODES, getMode } from './modes'
export { PERSONAS, getPersona } from './personas'
