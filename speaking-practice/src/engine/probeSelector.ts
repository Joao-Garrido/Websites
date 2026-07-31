import { pack } from '../content'
import { scriptedTurn } from '../content/modeScripts'
import type { Lang, ModeId, Move, Persona, Topic } from '../content/types'
import { extractPhrase, forTemplate } from './keywords'
import { pick, pickWeighted } from './random'
import { detectReactive, type ReactiveInput } from './reactive'

export type QuestionSource =
  | 'topic'
  | 'universal'
  | 'reactive'
  | 'echo'
  | 'closer'
  | 'scripted'

export interface Question {
  text: string
  source: QuestionSource
  move?: Move
  /** Stable key used for the anti-repetition memory. */
  key: string
}

export interface SelectContext {
  lang: Lang
  topic: Topic
  persona: Persona
  /** Drives mode-specific scripted turns (debate sides, story arc, STAR). */
  mode: ModeId
  /** 0-based index of the app turn about to be spoken. */
  turnIndex: number
  totalTurns: number
  /** What the user said on the previous turn, if anything. */
  lastAnswer?: { text: string; durationMs: number }
  /** Question keys already used this session. */
  usedKeys: Set<string>
  /** Question keys seen in recent past sessions — softly avoided. */
  recentKeys: Set<string>
  rng: () => number
}

/**
 * Escalation curve. Early turns open things up, the middle pushes, the end
 * synthesises. These are multipliers applied on top of the persona weights.
 */
function stageBias(turnIndex: number, totalTurns: number): Partial<Record<Move, number>> {
  const progress = totalTurns <= 1 ? 0 : turnIndex / (totalTurns - 1)
  if (progress < 0.34) {
    return { concretize: 1.8, personalize: 1.6, simplify: 1.2, challenge: 0.4 }
  }
  if (progress < 0.7) {
    return { challenge: 1.8, hypothesize: 1.5, contrast: 1.4, quantify: 1.3 }
  }
  return { prioritize: 2.0, simplify: 1.6, quantify: 1.2, personalize: 0.6 }
}

function penalty(key: string, ctx: SelectContext): number {
  if (ctx.usedKeys.has(key)) return 0 // never repeat within a session
  if (ctx.recentKeys.has(key)) return 0.15 // strongly discourage across sessions
  return 1
}

/** The reactive layer — only consulted when there is a fresh answer to react to. */
function tryReactive(ctx: SelectContext): Question | null {
  const answer = ctx.lastAnswer
  if (!answer) return null

  const input: ReactiveInput = {
    text: answer.text,
    lang: ctx.lang,
    durationMs: answer.durationMs,
    turnIndex: ctx.turnIndex,
  }
  const hit = detectReactive(input)
  if (!hit) return null

  const lines = pack(ctx.lang).reactive[hit.trigger]
  // Only use a line we have not already said. Repeating a nudge word for word
  // is worse than letting another layer take the turn, so we bail instead.
  const fresh = lines.filter((l) => !ctx.usedKeys.has(`r:${hit.trigger}:${l}`))
  const line = pick(fresh, ctx.rng)
  if (!line) return null

  const text = hit.slot ? line.replace('{x}', hit.slot) : line
  return {
    text,
    source: 'reactive',
    key: `r:${hit.trigger}:${line}`,
  }
}

/** The echo layer — quote the user back to themselves. */
function tryEcho(ctx: SelectContext): Question | null {
  const answer = ctx.lastAnswer
  if (!answer) return null

  const phrase = extractPhrase(answer.text, ctx.lang)
  if (!phrase) return null

  const templates = pack(ctx.lang).echo
  const chosen = pickWeighted(
    templates,
    (t) => (ctx.persona.weights[t.move] ?? 1) * penalty(`e:${t.id}`, ctx),
    ctx.rng,
  )
  if (!chosen) return null

  return {
    text: chosen.text.replace('{x}', forTemplate(phrase.text, ctx.lang)),
    source: 'echo',
    move: chosen.move,
    key: `e:${chosen.id}`,
  }
}

/** Layer 1 — questions written for this specific topic. */
function tryTopic(ctx: SelectContext): Question | null {
  const candidates = ctx.topic.probes
    .map((text, i) => ({ text, key: `t:${ctx.topic.id}:${i}` }))
    .filter((c) => !ctx.usedKeys.has(c.key))
  const chosen = pick(candidates, ctx.rng)
  if (!chosen) return null
  return { text: chosen.text, source: 'topic', key: chosen.key }
}

/** Layer 2 — the universal Socratic pool, shaped by persona and stage. */
function tryUniversal(ctx: SelectContext): Question | null {
  const bias = stageBias(ctx.turnIndex, ctx.totalTurns)
  const probes = pack(ctx.lang).probes

  const chosen = pickWeighted(
    probes,
    (p) => {
      const base = ctx.persona.weights[p.move] ?? 0
      if (base <= 0) return 0
      return base * (bias[p.move] ?? 1) * penalty(`u:${p.id}`, ctx)
    },
    ctx.rng,
  )
  if (!chosen) return null
  return {
    text: chosen.text,
    source: 'universal',
    move: chosen.move,
    key: `u:${chosen.id}`,
  }
}

/**
 * Pick the next question.
 *
 * Order matters: a reactive hit always wins because responding to *what was
 * just said* is the strongest signal of listening. Then echo (persona-weighted),
 * then topic-specific, then the universal pool as the guaranteed fallback.
 */
export function selectQuestion(ctx: SelectContext): Question {
  const isLast = ctx.turnIndex >= ctx.totalTurns - 1
  if (isLast && ctx.totalTurns > 1) {
    return { text: pack(ctx.lang).closer, source: 'closer', key: 'closer' }
  }

  // Modes with a shape of their own take precedence: being assigned a side or
  // walked through a story arc is the point of those modes.
  const scripted = scriptedTurn(ctx.lang, ctx.mode, ctx.turnIndex, ctx.topic.prompt)
  if (scripted) {
    return {
      text: scripted,
      source: 'scripted',
      key: `s:${ctx.mode}:${ctx.turnIndex}`,
    }
  }

  // First turn has no answer to work with — always a topic question.
  if (ctx.turnIndex === 0) {
    return (
      tryTopic(ctx) ??
      tryUniversal(ctx) ?? {
        text: pack(ctx.lang).closer,
        source: 'closer',
        key: 'closer',
      }
    )
  }

  const reactive = tryReactive(ctx)
  if (reactive) return reactive

  if (ctx.rng() < ctx.persona.echoBias) {
    const echo = tryEcho(ctx)
    if (echo) return echo
  }

  // Alternate between hand-written and universal so a session never feels like
  // it is working through a list.
  const preferTopic = ctx.rng() < 0.45
  const first = preferTopic ? tryTopic(ctx) : tryUniversal(ctx)
  if (first) return first
  const second = preferTopic ? tryUniversal(ctx) : tryTopic(ctx)
  if (second) return second

  return { text: pack(ctx.lang).closer, source: 'closer', key: 'closer' }
}
