import { describe, expect, it } from 'vitest'
import { getPersona, pack } from '../content'
import { topicsFor } from '../content'
import type { Topic } from '../content/types'
import { extractPhrase, repeatedWords } from './keywords'
import { makeRng, pickWeighted } from './random'
import { detectReactive } from './reactive'
import { selectQuestion, type SelectContext } from './probeSelector'

const ptTopic = topicsFor('pt', 'work')[0]!
const enTopic = topicsFor('en', 'work')[0]!

function ctx(over: Partial<SelectContext> = {}): SelectContext {
  return {
    lang: 'pt',
    topic: ptTopic,
    persona: getPersona('journalist'),
    mode: 'conversation',
    turnIndex: 1,
    totalTurns: 6,
    usedKeys: new Set(),
    recentKeys: new Set(),
    rng: makeRng(42),
    ...over,
  }
}

describe('content integrity', () => {
  it('has topics in both languages across every category', () => {
    for (const lang of ['pt', 'en'] as const) {
      const all = topicsFor(lang, 'all')
      expect(all.length).toBeGreaterThanOrEqual(80)
      for (const topic of all) {
        expect(topic.lang).toBe(lang)
        expect(topic.prompt.length).toBeGreaterThan(8)
        expect(topic.probes.length).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('has unique topic ids', () => {
    const ids = [...topicsFor('pt', 'all'), ...topicsFor('en', 'all')].map(
      (t: Topic) => t.id,
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a universal probe pool and echo templates per language', () => {
    for (const lang of ['pt', 'en'] as const) {
      const p = pack(lang)
      expect(p.probes.length).toBeGreaterThanOrEqual(50)
      expect(p.echo.length).toBeGreaterThanOrEqual(15)
      // Every echo template must have a slot, or it is not an echo.
      for (const e of p.echo) expect(e.text).toContain('{x}')
    }
  })
})

describe('pickWeighted', () => {
  it('never returns a zero-weight item', () => {
    const rng = makeRng(7)
    const items = [
      { id: 'a', w: 0 },
      { id: 'b', w: 5 },
      { id: 'c', w: 0 },
    ]
    for (let i = 0; i < 200; i++) {
      expect(pickWeighted(items, (x) => x.w, rng)?.id).toBe('b')
    }
  })

  it('returns undefined when everything is zero', () => {
    expect(pickWeighted([{ w: 0 }], (x) => x.w, makeRng(1))).toBeUndefined()
  })
})

describe('extractPhrase', () => {
  it('ignores answers too short to quote', () => {
    expect(extractPhrase('Sim, claro.', 'pt')).toBeNull()
  })

  it('lifts a content phrase out of a real answer', () => {
    const phrase = extractPhrase(
      'Para mim o que importa mesmo é a liberdade de horário porque consigo organizar o dia como quero',
      'pt',
    )
    expect(phrase).not.toBeNull()
    expect(phrase!.text.length).toBeGreaterThan(3)
    // Must not be pure stopwords.
    expect(phrase!.text).not.toMatch(/^(o|a|de|que|para)\b/i)
  })

  it('works in English too', () => {
    const phrase = extractPhrase(
      'I think the biggest thing is schedule flexibility because I can organise my whole day around deep work',
      'en',
    )
    expect(phrase).not.toBeNull()
  })
})

describe('repeatedWords', () => {
  it('flags a content word used too often', () => {
    const text = 'liberdade e liberdade e mais liberdade porque liberdade importa'
    const repeats = repeatedWords(text, 'pt', 4)
    expect(repeats[0]?.word).toBe('liberdade')
    expect(repeats[0]?.count).toBe(4)
  })

  it('ignores stopwords however often they appear', () => {
    const text = 'que que que que que que'
    expect(repeatedWords(text, 'pt', 4)).toHaveLength(0)
  })
})

describe('detectReactive', () => {
  const base = { lang: 'pt' as const, durationMs: 20_000, turnIndex: 1 }

  it('treats an empty answer as silence', () => {
    expect(detectReactive({ ...base, text: '   ' })?.trigger).toBe('silence')
  })

  it('flags a very short answer', () => {
    expect(detectReactive({ ...base, text: 'Acho que sim, mais nada.' })?.trigger).toBe(
      'tooShort',
    )
  })

  it('flags hedging when it becomes a pattern', () => {
    const text =
      'acho que talvez seja assim, se calhar não sei bem, mas acho que provavelmente resulta ' +
      'em muitos casos concretos que já vi acontecer no meu trabalho durante bastante tempo'
    const hit = detectReactive({ ...base, text })
    expect(['hedging', 'noExample']).toContain(hit?.trigger)
  })

  it('catches an absolute and reports the word', () => {
    const text =
      'Isto acontece sempre em todas as equipas onde trabalhei e continuará a acontecer ' +
      'porque a estrutura das organizações modernas empurra as pessoas nessa direção'
    const hit = detectReactive({ ...base, text })
    expect(hit).not.toBeNull()
    if (hit?.trigger === 'absolutes') expect(hit.slot).toBe('sempre')
  })

  it('says nothing when the answer is solid', () => {
    const text =
      'Em 2019 mudei de equipa e passei a trabalhar com a Marta em Lisboa. ' +
      'Quando comecei, tínhamos 4 pessoas e um prazo de três meses. ' +
      'Lembro-me de uma reunião em janeiro onde decidimos cortar metade do âmbito, ' +
      'e isso salvou o projeto porque entregámos a tempo com qualidade.'
    expect(detectReactive({ ...base, text })).toBeNull()
  })

  it('uses English lists for English answers', () => {
    // Long enough that `tooShort` does not fire, so hedging is what is left.
    const text =
      'I guess maybe it works, sort of, I am not sure, I suppose it depends a lot on the team ' +
      'and on the particular week you happen to be looking at. In 2021 we tried it with 6 people ' +
      'in the Lisbon office and the results were genuinely mixed across the whole quarter.'
    const hit = detectReactive({ ...base, lang: 'en', text })
    expect(hit?.trigger).toBe('hedging')
  })

  it('does not fire tooShort on a full answer', () => {
    const text = Array.from({ length: 40 }, (_, i) => `palavra${i}`).join(' ')
    const hit = detectReactive({ ...base, text })
    expect(hit?.trigger).not.toBe('tooShort')
  })
})

describe('selectQuestion', () => {
  it('opens with a topic-specific question', () => {
    const q = selectQuestion(ctx({ turnIndex: 0 }))
    expect(q.source).toBe('topic')
    expect(ptTopic.probes).toContain(q.text)
  })

  it('always closes with the closer', () => {
    const q = selectQuestion(ctx({ turnIndex: 5, totalTurns: 6 }))
    expect(q.source).toBe('closer')
    expect(q.text).toBe(pack('pt').closer)
  })

  it('reacts to a short answer instead of asking something generic', () => {
    const q = selectQuestion(
      ctx({ lastAnswer: { text: 'Sim.', durationMs: 2000 } }),
    )
    expect(q.source).toBe('reactive')
  })

  it('never repeats a question within a session', () => {
    const used = new Set<string>()
    const rng = makeRng(99)
    // Substantial answers, so the reactive layer does not fire on every turn
    // and the topic/universal/echo layers get exercised too.
    const answers = [
      'A liberdade de horário conta muito para mim porque consigo organizar o dia inteiro à minha maneira e trabalhar quando rendo mais. Em 2022 mudei para uma equipa distribuída entre Lisboa e Berlim e passei a começar às sete da manhã.',
      'No escritório antigo tínhamos reuniões a mais e pouco tempo de foco, o que destruía qualquer hipótese de trabalho profundo. Lembro-me de uma terça-feira em que tive cinco reuniões seguidas e não escrevi uma única linha de código.',
      'Quando mudei de equipa em 2021 percebi que a confiança do chefe muda tudo na forma como as pessoas se organizam sozinhas. O João nunca perguntava onde eu estava, perguntava o que é que estava bloqueado e isso mudou o meu ano.',
      'Ainda assim reconheço que os juniores perdem imenso sem alguém ao lado para aprender por osmose durante os primeiros meses. A Rita entrou em setembro remoto e demorou o dobro do tempo a ficar autónoma comparada com quem entrou presencial.',
    ]

    for (let turn = 1; turn < 5; turn++) {
      const q = selectQuestion(
        ctx({
          turnIndex: turn,
          usedKeys: used,
          rng,
          lastAnswer: { text: answers[turn - 1]!, durationMs: 30_000 },
        }),
      )
      expect(used.has(q.key)).toBe(false)
      used.add(q.key)
    }
    expect(used.size).toBe(4)
  })

  it('produces an echo question that quotes the user', () => {
    // journalist has the highest echoBias; force the echo branch with a seed
    // sweep so the test does not depend on one lucky rng value.
    const answer =
      'O que mudou mesmo foi a liberdade de horário, porque consigo encaixar o trabalho profundo de manhã cedo. ' +
      'Em 2023 comecei a bloquear as primeiras três horas do dia e a Marta fez o mesmo na equipa dela, ' +
      'o que na prática duplicou aquilo que conseguimos entregar em cada sprint.'
    let sawEcho = false
    for (let seed = 1; seed < 60 && !sawEcho; seed++) {
      const q = selectQuestion(
        ctx({
          rng: makeRng(seed),
          lastAnswer: { text: answer, durationMs: 30_000 },
        }),
      )
      if (q.source === 'echo') {
        sawEcho = true
        expect(q.text).not.toContain('{x}')
      }
    }
    expect(sawEcho).toBe(true)
  })

  it('respects persona weights — the friend never quantifies', () => {
    const friend = getPersona('friend')
    expect(friend.weights.quantify).toBe(0)

    const rng = makeRng(5)
    const answer =
      'Foi uma altura estranha da minha vida porque estava a mudar de casa e de trabalho ao mesmo tempo.'
    for (let i = 0; i < 40; i++) {
      const q = selectQuestion(
        ctx({
          persona: friend,
          rng,
          turnIndex: 2,
          lastAnswer: { text: answer, durationMs: 25_000 },
        }),
      )
      if (q.source === 'universal' || q.source === 'echo') {
        expect(q.move).not.toBe('quantify')
      }
    }
  })

  it('assigns a side in debate mode and makes you switch later', () => {
    const open = selectQuestion(ctx({ mode: 'debate', turnIndex: 0 }))
    expect(open.source).toBe('scripted')
    expect(open.text).toContain(ptTopic.prompt)

    const flip = selectQuestion(ctx({ mode: 'debate', turnIndex: 4 }))
    expect(flip.source).toBe('scripted')
    expect(flip.text).toMatch(/contrário/i)
  })

  it('walks the narrative arc in story mode', () => {
    const arc = [0, 1, 2, 3].map(
      (i) => selectQuestion(ctx({ mode: 'story', turnIndex: i })).source,
    )
    expect(arc).toEqual(['scripted', 'scripted', 'scripted', 'scripted'])
  })

  it('leaves conversation mode entirely to the engine', () => {
    const q = selectQuestion(ctx({ mode: 'conversation', turnIndex: 0 }))
    expect(q.source).not.toBe('scripted')
  })

  it('still closes scripted modes with the closer', () => {
    const q = selectQuestion(ctx({ mode: 'debate', turnIndex: 5, totalTurns: 6 }))
    expect(q.source).toBe('closer')
  })

  it('works end to end in English', () => {
    const q = selectQuestion(
      ctx({ lang: 'en', topic: enTopic, turnIndex: 0 }),
    )
    expect(enTopic.probes).toContain(q.text)
  })
})
