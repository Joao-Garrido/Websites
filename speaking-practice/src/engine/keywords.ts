import type { Lang } from '../content/types'

/**
 * Stopwords plus very common content words. A phrase made only of these is
 * worthless as an echo — "the thing" proves nothing about listening.
 */
const STOP: Record<Lang, Set<string>> = {
  pt: new Set(
    `a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela para com sem sob sobre entre ate após e ou mas que se quando onde como porque porquê qual quais quem cujo eu tu ele ela nos vos eles elas me te lhe nos vos lhes meu minha teu tua seu sua nosso nossa este esta esse essa aquele aquela isto isso aquilo ser estar ter haver fazer ir vir dar ver saber poder querer dizer ficar passar sou es e somos sao estou estas esta estamos estao tenho tens tem temos tem havia era eram foi foram sera serao muito pouco mais menos bem mal ja ainda sempre nunca talvez tambem so apenas mesmo assim entao depois antes agora hoje ontem amanha aqui ali la sim nao nada tudo todo toda todos todas outro outra coisa coisas pessoa pessoas gente vez vezes forma maneira tipo parte lado modo caso ponto facto acho sei bem digo tipo pronto ora epa sequer proprio propria bastante completamente totalmente realmente normalmente provavelmente exatamente simplesmente principalmente especialmente certamente obviamente claramente enquanto embora contudo porem alias sobretudo praticamente inclusive nomeadamente cerca perto longe cedo tarde devagar depressa melhor pior maior menor primeiro segundo ultimo proximo antigo novo velho grande pequeno certo errado dizia disse dizer fazia fiz feito tinha tive posso podia devia deve queria quis achava achei parece pareceu comecei comecar acabar acabei continuar continuei meus minhas teus tuas seus suas nossos nossas vosso vossa vossos vossas estes estas esses essas aqueles aquelas durante quase contra desde perante mediante conforme apesar atraves dentro fora acima abaixo alem aquem junto atras frente volta cada qualquer alguns algumas nenhum nenhuma varios varias muitos muitas poucos poucas ambos ambas tal tais mim ti si consigo comigo contigo connosco convosco fui foste fomos fostes era eras eramos estava estavas estavamos estive esteve estivemos tinhamos tiveste tivemos houve havera passei passou passamos deixei deixou ando andava vou vais vamos vem vens venho`.split(
      /\s+/,
    ),
  ),
  en: new Set(
    `the a an of to in on at for with without by from into over under between among and or but if when where how why what which who whom whose that this these those i you he she it we they me him her us them my your his its our their mine yours be am is are was were been being have has had do does did doing will would shall should can could may might must go goes went come came get got make made take took see saw know knew think thought say said want need very much many few more less most least well badly just still yet already always never sometimes also only even so then than because there here now today yesterday tomorrow yes no not nothing everything all every each other another thing things people person someone something time times way ways kind sort part side case point fact really actually basically like mean guess rather quite pretty fairly somewhat entirely completely totally really normally probably exactly simply mainly especially certainly obviously clearly whereas although though however besides moreover nearly almost close far early late better worse bigger smaller first second last next old new big small right wrong told tell telling started start starting keep kept stop stopped put putting seem seemed seems look looked looking feel felt talk talked talking during almost against since within outside above below beyond near behind front around each any some none several many much both such myself yourself himself herself itself ourselves themselves upon onto toward towards throughout despite unless until while whether either neither`.split(
      /\s+/,
    ),
  ),
}

/** Words that reliably start a noun phrase worth echoing back. */
const DETERMINERS: Record<Lang, Set<string>> = {
  pt: new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'meu', 'minha', 'este', 'esta']),
  en: new Set(['the', 'a', 'an', 'my', 'this', 'that', 'his', 'her', 'their']),
}

export function normalise(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}'-]/gu, '')
}

export function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean)
}

function isStop(word: string, lang: Lang): boolean {
  return STOP[lang].has(normalise(word))
}

export interface Phrase {
  text: string
  score: number
}

/**
 * Pull the most "quotable" short noun phrase out of what the user said.
 *
 * Heuristic, deliberately: score contiguous runs of non-stopwords by length,
 * rarity within the answer, and how late they appear — people put their real
 * point at the end. Returns null when nothing scores well enough, and callers
 * must fall back to a non-echo probe rather than quoting something silly.
 */
export function extractPhrase(text: string, lang: Lang): Phrase | null {
  const words = tokenize(text)
  if (words.length < 6) return null

  const runs: { words: string[]; end: number }[] = []
  let current: string[] = []

  words.forEach((word, i) => {
    if (isStop(word, lang) || word.length < 3) {
      if (current.length) {
        runs.push({ words: current, end: i })
        current = []
      }
    } else {
      current.push(word)
    }
  })
  if (current.length) runs.push({ words: current, end: words.length })

  const candidates: Phrase[] = []
  for (const run of runs) {
    // Cap at 3 words: longer quotes sound like the app is reading back a log.
    const span = run.words.slice(0, 3)
    if (span.length === 0) continue

    const lengthScore = Math.min(span.length, 3) * 1.1
    const wordScore = span.reduce(
      (acc, w) => acc + Math.min(w.length, 12) / 6,
      0,
    )
    // Later phrases weigh more, but never more than double the earliest.
    const position = 1 + run.end / Math.max(words.length, 1)

    candidates.push({
      text: span.join(' '),
      score: (lengthScore + wordScore) * position,
    })
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]!
  // Below this the phrase is a single short word — not worth quoting.
  return best.score >= 3 ? best : null
}

/**
 * Trim a determiner off the front so the phrase drops cleanly into a template
 * ("you mentioned the remote work" reads wrong; "remote work" reads right).
 */
export function forTemplate(phrase: string, lang: Lang): string {
  const words = phrase.split(' ')
  const first = words[0]
  if (words.length > 1 && first && DETERMINERS[lang].has(normalise(first))) {
    return words.slice(1).join(' ')
  }
  return phrase
}

/** Content words repeated suspiciously often, most repeated first. */
export function repeatedWords(
  text: string,
  lang: Lang,
  minCount = 4,
): { word: string; count: number }[] {
  const counts = new Map<string, { display: string; count: number }>()
  for (const word of tokenize(text)) {
    if (isStop(word, lang) || word.length < 4) continue
    const key = normalise(word)
    if (!key) continue
    const entry = counts.get(key)
    if (entry) entry.count++
    else counts.set(key, { display: word.toLowerCase(), count: 1 })
  }
  return [...counts.values()]
    .filter((e) => e.count >= minCount)
    .sort((a, b) => b.count - a.count)
    .map((e) => ({ word: e.display, count: e.count }))
}
