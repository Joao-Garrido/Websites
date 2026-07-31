import type { Lang, ModeId } from './types'

/**
 * Mode-specific framing.
 *
 * Conversation and Flash are driven entirely by the probe engine. The other
 * three modes have a shape of their own — a side you are assigned, a story arc
 * to walk, an interview structure to hold — so they get scripted turns that the
 * engine fills in around.
 *
 * `{topic}` is replaced with the topic prompt.
 */
/** Replaces the engine's question at these turn indices. */
type ModeScript = Record<number, string>

const SCRIPTS: Record<Lang, Partial<Record<ModeId, ModeScript>>> = {
  pt: {
    debate: {
      0: 'Vais defender esta posição: «{topic}». Não interessa se concordas — defende-a bem. Começa pelo teu argumento mais forte.',
      1: 'Certo. Agora dá-me um exemplo concreto que sustente isso.',
      4: 'Muda de lado. Defende agora exatamente o contrário, com a mesma convicção.',
    },
    story: {
      0: 'Conta-me esta história: «{topic}». Começa pelo cenário — onde estavas, quem estava lá, o que estava em jogo.',
      1: 'E depois, o que é que correu mal ou mudou? Leva-me ao momento de tensão.',
      2: 'Como é que se resolveu?',
      3: 'O que é que isso te deixou? Diz-me sem moralizar.',
    },
    interview: {
      0: 'Vamos a isto: «{topic}». Responde-me com estrutura — situação, tarefa, ação, resultado.',
      1: 'Qual era exatamente o teu papel, por oposição ao da equipa?',
    },
  },
  en: {
    debate: {
      0: 'You are arguing this position: "{topic}". It does not matter whether you agree — argue it well. Start with your strongest point.',
      1: 'Right. Now give me a concrete example that backs that up.',
      4: 'Switch sides. Now argue the exact opposite, with the same conviction.',
    },
    story: {
      0: 'Tell me this story: "{topic}". Start with the setup — where you were, who was there, what was at stake.',
      1: 'And then what went wrong, or changed? Take me to the moment of tension.',
      2: 'How did it resolve?',
      3: 'What did it leave you with? Tell me without moralising.',
    },
    interview: {
      0: 'Let us get into it: "{topic}". Answer with structure — situation, task, action, result.',
      1: 'What exactly was your role, as opposed to the team’s?',
    },
  },
}

export function scriptedTurn(
  lang: Lang,
  mode: ModeId,
  turnIndex: number,
  topicPrompt: string,
): string | null {
  const line = SCRIPTS[lang][mode]?.[turnIndex]
  return line ? line.replace('{topic}', topicPrompt) : null
}
