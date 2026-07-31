import type { Lang } from '../content/types'
import type { Metrics } from './metrics'

export type Verdict = 'good' | 'watch' | 'info'

export interface Insight {
  id: string
  label: string
  value: string
  /** Short, actionable sentence. Never a score out of ten. */
  note: string
  verdict: Verdict
  /** Optional caveat shown in smaller text — used where the data is weak. */
  caveat?: string
}

const T = {
  pt: {
    pace: 'Ritmo',
    paceSlow: 'Devagar. Podes ganhar energia sem atropelar as palavras.',
    paceGood: 'Bom ritmo de conversa.',
    paceFast: 'Rápido. Abranda nas ideias que queres que fiquem.',
    paceEstimate: 'Estimativa: a transcrição perde algumas palavras.',
    pauses: 'Pausas longas',
    pausesNone: 'Discurso corrido, sem paragens a procurar palavras.',
    pausesFew: 'Algumas pausas — normal, e até dão ênfase.',
    pausesMany: 'Muitas paragens. Respira em vez de preencher.',
    fillers: 'Muletas',
    fillersNone: 'Quase sem muletas. Nota-se.',
    fillersSome: 'Aparecem, mas não dominam.',
    fillersMany: 'Estão a roubar espaço às tuas ideias.',
    variety: 'Variedade de vocabulário',
    varietyLow: 'Vocabulário repetitivo. Procura sinónimos e imagens.',
    varietyOk: 'Vocabulário variado.',
    varietyHigh: 'Vocabulário muito rico.',
    hedging: 'Hesitação',
    hedgingNone: 'Falaste com convicção.',
    hedgingSome: 'Alguns "acho que". Assume mais as afirmações.',
    hedgingMany: 'Muito "talvez" e "se calhar". Corta-os e ganha força.',
    words: 'palavras',
    perMin: 'ppm',
    length: 'Extensão',
    writtenNote:
      'Sessão escrita: não dá para medir ritmo nem pausas. Fala para veres essas métricas.',
    repeatNote: (w: string, n: number) =>
      `Repetiste "${w}" ${n} vezes — vale a pena variar.`,
    disfluency: 'Hesitações sonoras (estimativa)',
    disfluencyCaveat:
      'O reconhecimento de voz remove a maior parte dos "hum". O número real é maior — confia mais nas pausas.',
    nothing: 'Fala um pouco mais para eu conseguir dizer algo de útil.',
  },
  en: {
    pace: 'Pace',
    paceSlow: 'Slow. You can add energy without rushing the words.',
    paceGood: 'Good conversational pace.',
    paceFast: 'Fast. Slow down on the ideas you want to land.',
    paceEstimate: 'Estimate: the transcript loses some words.',
    pauses: 'Long pauses',
    pausesNone: 'Continuous delivery, no hunting for words.',
    pausesFew: 'A few pauses — normal, and they add emphasis.',
    pausesMany: 'A lot of stopping. Breathe instead of filling.',
    fillers: 'Filler words',
    fillersNone: 'Almost no fillers. It shows.',
    fillersSome: 'They appear, but they do not dominate.',
    fillersMany: 'They are crowding out your ideas.',
    variety: 'Vocabulary range',
    varietyLow: 'Repetitive vocabulary. Reach for synonyms and images.',
    varietyOk: 'Varied vocabulary.',
    varietyHigh: 'Very rich vocabulary.',
    hedging: 'Hedging',
    hedgingNone: 'You spoke with conviction.',
    hedgingSome: 'A few "I think"s. Own your claims more.',
    hedgingMany: 'Lots of "maybe" and "sort of". Cut them and gain force.',
    words: 'words',
    perMin: 'wpm',
    length: 'Length',
    writtenNote:
      'Written session: pace and pauses cannot be measured. Speak to see those.',
    repeatNote: (w: string, n: number) =>
      `You said "${w}" ${n} times — worth varying.`,
    disfluency: 'Audible hesitations (estimate)',
    disfluencyCaveat:
      'Speech recognition strips most "um"s. The real number is higher — trust the pauses instead.',
    nothing: 'Speak a bit more so I can tell you something useful.',
  },
} as const

/**
 * Turn metrics into a handful of honest, actionable tiles.
 *
 * Deliberately no overall score: a single number invites optimising the number
 * instead of the speaking, and none of these signals are precise enough to
 * justify one.
 */
export function buildReport(m: Metrics, lang: Lang): Insight[] {
  const t = T[lang]
  const out: Insight[] = []

  if (m.words < 15) {
    return [
      {
        id: 'empty',
        label: '—',
        value: `${m.words} ${t.words}`,
        note: t.nothing,
        verdict: 'info',
      },
    ]
  }

  // Pace and pauses come from the microphone. In written mode there is no
  // microphone, so reporting them would just be measuring typing speed.
  if (m.spoken) {
    // 130–160 wpm is the comfortable conversational band.
    out.push({
      id: 'pace',
      label: t.pace,
      value: `${m.wpm} ±${m.wpmBand} ${t.perMin}`,
      note: m.wpm < 110 ? t.paceSlow : m.wpm > 175 ? t.paceFast : t.paceGood,
      verdict: m.wpm < 110 || m.wpm > 175 ? 'watch' : 'good',
      caveat: t.paceEstimate,
    })

    // Normalised per minute of speech so long answers are not punished.
    const minutes = Math.max(m.speakingMs / 60_000, 0.2)
    const pausesPerMin = m.longPauses / minutes
    out.push({
      id: 'pauses',
      label: t.pauses,
      value: String(m.longPauses),
      note:
        pausesPerMin < 1
          ? t.pausesNone
          : pausesPerMin < 4
            ? t.pausesFew
            : t.pausesMany,
      verdict: pausesPerMin >= 4 ? 'watch' : 'good',
    })
  } else {
    out.push({
      id: 'written',
      label: t.length,
      value: `${m.words} ${t.words}`,
      note: t.writtenNote,
      verdict: 'info',
    })
  }

  // Fillers — per 100 words; above ~3 they become noticeable to a listener.
  out.push({
    id: 'fillers',
    label: t.fillers,
    value: `${m.fillers} (${m.fillersPer100}/100)`,
    note:
      m.fillersPer100 < 1
        ? t.fillersNone
        : m.fillersPer100 < 3
          ? t.fillersSome
          : t.fillersMany,
    verdict: m.fillersPer100 >= 3 ? 'watch' : 'good',
  })

  out.push({
    id: 'variety',
    label: t.variety,
    value: `${Math.round(m.mattr * 100)}%`,
    note: m.mattr < 0.6 ? t.varietyLow : m.mattr < 0.78 ? t.varietyOk : t.varietyHigh,
    verdict: m.mattr < 0.6 ? 'watch' : 'good',
  })

  if (m.hedges > 0) {
    out.push({
      id: 'hedging',
      label: t.hedging,
      value: String(m.hedges),
      note: m.hedges >= 5 ? t.hedgingMany : m.hedges >= 2 ? t.hedgingSome : t.hedgingNone,
      verdict: m.hedges >= 5 ? 'watch' : 'good',
    })
  }

  const repeat = m.topRepeats[0]
  if (repeat) {
    out.push({
      id: 'repeat',
      label: `"${repeat.word}"`,
      value: `×${repeat.count}`,
      note: t.repeatNote(repeat.word, repeat.count),
      verdict: 'info',
    })
  }

  if (m.disfluenciesEstimate > 0) {
    out.push({
      id: 'disfluency',
      label: t.disfluency,
      value: `≥${m.disfluenciesEstimate}`,
      note: '',
      verdict: 'info',
      caveat: t.disfluencyCaveat,
    })
  }

  return out
}
