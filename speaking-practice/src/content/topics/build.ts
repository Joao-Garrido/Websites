import type { CategoryId, Difficulty, Lang, Topic } from '../types'

/**
 * Compact authoring tuple so topic files stay readable:
 *   [slug, difficulty, prompt, probes, vocab?, framework?]
 */
export type TopicSpec = [
  slug: string,
  difficulty: Difficulty,
  prompt: string,
  probes: string[],
  vocab?: string[],
  framework?: string,
]

export function buildTopics(
  lang: Lang,
  category: CategoryId,
  specs: TopicSpec[],
): Topic[] {
  return specs.map(([slug, difficulty, prompt, probes, vocab, framework]) => ({
    id: `${lang}-${category}-${slug}`,
    lang,
    category,
    difficulty,
    prompt,
    probes,
    ...(vocab ? { vocab } : {}),
    ...(framework ? { framework } : {}),
  }))
}
