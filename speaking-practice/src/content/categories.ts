import type { Category } from './types'

export const CATEGORIES: Category[] = [
  {
    id: 'general',
    emoji: '✦',
    label: { pt: 'Geral', en: 'General' },
  },
  {
    id: 'work',
    emoji: '◆',
    label: { pt: 'Trabalho e carreira', en: 'Work & career' },
  },
  {
    id: 'tech',
    emoji: '◈',
    label: { pt: 'Tecnologia e sociedade', en: 'Tech & society' },
  },
  {
    id: 'ideas',
    emoji: '◇',
    label: { pt: 'Ideias e filosofia', en: 'Ideas & philosophy' },
  },
  {
    id: 'personal',
    emoji: '❋',
    label: { pt: 'Pessoal e histórias', en: 'Personal & stories' },
  },
  {
    id: 'culture',
    emoji: '◐',
    label: { pt: 'Cultura e media', en: 'Culture & media' },
  },
  {
    id: 'opinions',
    emoji: '◉',
    label: { pt: 'Opiniões fortes', en: 'Strong opinions' },
  },
]

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)
