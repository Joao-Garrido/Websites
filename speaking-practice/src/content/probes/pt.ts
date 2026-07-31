import type { EchoTemplate, Move, Probe } from '../types'

/** Compact authoring format: [move, ...texts] */
const RAW: [Move, ...string[]][] = [
  [
    'concretize',
    'Dá-me um exemplo concreto disso.',
    'Consegues descrever uma situação específica em que isso aconteceu?',
    'Isso soa abstrato. Como é que se parece na prática?',
    'Descreve-me uma cena: onde estavas, quem estava lá?',
    'Qual foi a última vez que viste isso a acontecer?',
    'Dá-me um caso em que correu bem e outro em que correu mal.',
    'Se eu estivesse a ver por cima do teu ombro, o que via?',
    'O que é que uma pessoa faria de forma diferente por causa disso?',
    'Consegues dar-me um número, uma data ou um nome?',
  ],
  [
    'challenge',
    'Qual é o argumento mais forte contra o que acabaste de dizer?',
    'Quem discordaria de ti, e porquê?',
    'E se estivesses errado? O que é que isso implicaria?',
    'Isso não é conveniente demais para ti?',
    'Não estarás a confundir causa com consequência?',
    'Que provas te fariam mudar de ideias?',
    'Isso funciona para ti — funciona para quem não tem as tuas condições?',
    'Parece-me que estás a assumir uma coisa sem a dizer. O quê?',
    'Se isso fosse assim tão óbvio, porque é que ainda não é a norma?',
    'Convence-me do contrário do que acabaste de defender.',
  ],
  [
    'personalize',
    'Quando é que isso te aconteceu a ti?',
    'Como é que te sentiste nesse momento?',
    'O que é que isso mudou na maneira como vives hoje?',
    'Qual foi a primeira vez que pensaste assim?',
    'O que é que dirias ao teu eu de há cinco anos sobre isto?',
    'Isso custou-te alguma coisa? O quê?',
    'Alguém te fez mudar de ideias sobre isto? Quem?',
    'De que é que te arrependes nesta história?',
  ],
  [
    'simplify',
    'Explica isso a alguém de dez anos.',
    'Resume isso numa frase.',
    'Se só pudesses usar palavras simples, como o dirias?',
    'Qual é a ideia central, tirando tudo o resto?',
    'Como explicarias isso a alguém que nunca ouviu falar do tema?',
    'Dá-me a versão de vinte segundos.',
  ],
  [
    'quantify',
    'Como é que medirias se isso é verdade?',
    'Que número tornaria isso indiscutível?',
    'Quanto é "muito", em concreto?',
    'Que dados terias de ver para ficares convencido?',
    'Qual foi o impacto real — consegues estimá-lo?',
    'Quanto tempo é que isso demorou, ao certo?',
    'Se tivesses de apostar dinheiro na tua previsão, quanto apostavas?',
  ],
  [
    'prioritize',
    'Se só pudesses manter uma dessas ideias, qual era?',
    'O que é que corta primeiro, se tiveres de cortar?',
    'Qual é a parte que realmente importa e qual é o ruído?',
    'Por onde começarias amanhã de manhã?',
    'Se tivesses metade do tempo, o que ficava de fora?',
    'Ordena-me isso: o mais importante primeiro.',
  ],
  [
    'hypothesize',
    'E se o oposto fosse verdade?',
    'O que teria de mudar no mundo para isso deixar de ser um problema?',
    'Imagina que tens recursos ilimitados. O que fazias?',
    'E daqui a dez anos, como é que isto se parece?',
    'Se pudesses mudar uma regra, qual mudavas?',
    'O que é o pior que pode acontecer se seguirmos por aí?',
    'E se tivesses de resolver isso sem dinheiro nenhum?',
  ],
  [
    'contrast',
    'Em que é que isso é diferente de há dez anos?',
    'Como é que isso funciona noutro país que conheças?',
    'Qual é a diferença entre isso e a alternativa óbvia?',
    'Isso é novo, ou é uma coisa antiga com outro nome?',
    'Quem faz isto melhor do que nós, e o que fazem de diferente?',
    'Em que é que a tua geração vê isto de forma diferente da anterior?',
  ],
]

let seq = 0
export const PT_PROBES: Probe[] = RAW.flatMap(([move, ...texts]) =>
  texts.map((text) => ({ id: `pt-p${++seq}`, lang: 'pt' as const, move, text })),
)

/** `{x}` is replaced with a phrase lifted from the user's own answer. */
const RAW_ECHO: [Move, ...string[]][] = [
  [
    'concretize',
    'Falaste em {x}. Dá-me um exemplo disso.',
    'Disseste {x} — como é que isso se parece no dia a dia?',
    'Voltemos a {x}. O que é que isso significa em concreto?',
  ],
  [
    'challenge',
    'Falaste em {x}. Isso é causa ou consequência?',
    'Disseste {x}. E quem diria exatamente o contrário?',
    'Estás a apoiar-te muito em {x}. E se isso não se verificar?',
    'Mencionaste {x}. Isso não contradiz o que disseste antes?',
  ],
  [
    'personalize',
    'Disseste {x}. Porque é que isso foi importante para ti?',
    'Falaste em {x}. Conta-me a história por trás disso.',
    'Quando é que {x} entrou na tua vida?',
  ],
  [
    'quantify',
    'Falaste em {x}. Como é que medias isso?',
    'Disseste {x} — quanto, ao certo?',
  ],
  [
    'prioritize',
    'Entre tudo o que disseste, {x} pareceu-me o mais forte. Concordas?',
    'Se tivesses de escolher entre {x} e o resto, ficavas com quê?',
  ],
  [
    'hypothesize',
    'E se {x} desaparecesse amanhã?',
    'Imagina um mundo sem {x}. O que muda?',
  ],
  [
    'contrast',
    'Falaste em {x}. Isso era assim há dez anos?',
    'Como é que {x} se compara com a alternativa?',
  ],
  ['simplify', 'Explica-me {x} como se eu não soubesse nada do assunto.'],
]

let eseq = 0
export const PT_ECHO: EchoTemplate[] = RAW_ECHO.flatMap(([move, ...texts]) =>
  texts.map((text) => ({ id: `pt-e${++eseq}`, lang: 'pt' as const, move, text })),
)

/** Layer 3 — reactive lines, keyed by trigger. `{x}` where a word is injected. */
export const PT_REACTIVE = {
  tooShort: [
    'Ficaste-te por aí. Dá-me mais um minuto sobre isso.',
    'Isso foi curto. Desenvolve.',
    'Sinto que há mais para dizer aí. Continua.',
  ],
  noExample: [
    'Isso é abstrato. Conta-me um caso real.',
    'Ainda não me deste nenhum exemplo. Dá-me um.',
    'Tudo isso é teoria. Aterra-me numa situação concreta.',
  ],
  hedging: [
    'Soaste indeciso. Assume uma posição: sim ou não?',
    'Estás cheio de "talvez". Diz-me o que achas mesmo.',
    'Tira os "acho que" e repete a frase.',
  ],
  absolutes: [
    'Disseste "{x}". Qual é a exceção?',
    'Cuidado com o "{x}". Consegues mesmo defender isso?',
  ],
  repetition: [
    'Voltaste a "{x}" várias vezes. Define-me essa palavra.',
    'Reparaste que repetiste "{x}"? O que queres mesmo dizer com isso?',
  ],
  tooLong: [
    'Resume isso em duas frases.',
    'Boa, mas foi longo. Qual é o essencial?',
  ],
  silence: [
    'Sem pressa. Começa por onde te for mais fácil.',
    'Diz o que te vier à cabeça, mesmo que não esteja arrumado.',
  ],
} as const

/** Closing turn, always the same shape so the user learns to expect it. */
export const PT_CLOSER = 'Para terminar: resume a tua posição em vinte segundos.'

export const PT_ACKS = [
  'Certo.',
  'Estou a ver.',
  'Hmm.',
  'Faz sentido.',
  'Ok.',
  'Interessante.',
]
