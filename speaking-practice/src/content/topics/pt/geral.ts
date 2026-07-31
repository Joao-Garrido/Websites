import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'domingo',
    1,
    'O domingo perfeito, do princípio ao fim',
    [
      'A que horas acordas, e isso é escolha ou hábito?',
      'Há alguém nesse domingo, ou é sozinho?',
      'O que é que estragaria esse dia por completo?',
      'Quantos domingos assim tiveste este ano?',
    ],
    ['ócio', 'ritual', 'desligar', 'sem planos'],
  ],
  [
    'mudar-ideias',
    2,
    'Uma coisa em que mudaste de ideias nos últimos cinco anos',
    [
      'O que é que pensavas antes, exatamente?',
      'Qual foi o momento ou a pessoa que abanou isso?',
      'Custou-te admitir? Porquê?',
      'Há alguma coisa em que suspeitas que vais mudar de ideias a seguir?',
    ],
    ['rever', 'admitir', 'ponto de viragem', 'teimosia'],
    'Antes → Choque → Depois',
  ],
  [
    'conselho-mau',
    2,
    'O pior conselho que já te deram com boas intenções',
    [
      'Quem to deu, e porque é que achavas que sabia do assunto?',
      'Chegaste a segui-lo?',
      'Porque é que era mau — estava errado ou só não era para ti?',
      'Que conselho darias hoje a quem estivesse nessa situação?',
    ],
    ['bem-intencionado', 'senso comum', 'à medida'],
  ],
  [
    'coisa-cara',
    1,
    'A melhor coisa cara que compraste — e valeu a pena?',
    [
      'Quanto tempo hesitaste antes de comprar?',
      'Como é que justificaste a ti próprio?',
      'Ainda a usas hoje?',
      'Qual foi a pior compra cara que fizeste?',
    ],
    ['valer a pena', 'investimento', 'arrependimento', 'custo por uso'],
  ],
  [
    'aprender-tarde',
    2,
    'Uma coisa que toda a gente parece saber e tu só aprendeste tarde',
    [
      'Como é que descobriste que não sabias?',
      'Sentiste vergonha ou achaste graça?',
      'Porque é que ninguém te tinha dito?',
      'O que é que ainda suspeitas que não sabes?',
    ],
    ['lacuna', 'dado adquirido', 'admitir ignorância'],
  ],
  [
    'cidade',
    2,
    'A cidade onde vives: o que mudarias primeiro?',
    [
      'Quem é que essa mudança prejudicaria?',
      'Porque é que ainda não foi feito?',
      'Quanto custaria, mais ou menos?',
      'O que é que essa cidade já faz melhor do que as outras?',
    ],
    ['urbanismo', 'transportes', 'habitação', 'espaço público'],
  ],
  [
    'tempo-livre',
    1,
    'Se te dessem quatro horas livres agora, o que farias mesmo?',
    [
      'Isso é o que farias ou o que gostavas de dizer que farias?',
      'O que é que te impede de o fazer numa semana normal?',
      'Quando foi a última vez que tiveste essas quatro horas?',
      'E se fossem quatro semanas em vez de quatro horas?',
    ],
    ['tempo livre', 'prioridades', 'desculpas'],
  ],
  [
    'ritual',
    1,
    'Um hábito pequeno que mudou o teu dia',
    [
      'Há quanto tempo o fazes?',
      'O que acontece nos dias em que falhas?',
      'Como é que começou?',
      'Que hábito tentaste criar e não pegou?',
    ],
    ['rotina', 'consistência', 'gatilho'],
  ],
  [
    'discordar',
    3,
    'Uma opinião comum com que não concordas mas nunca discutes em público',
    [
      'Porque é que não a defendes em voz alta?',
      'Qual é o custo social de a defenderes?',
      'Quem é que concordaria contigo em privado?',
      'O que te faria mudar de posição?',
    ],
    ['consenso', 'autocensura', 'impopular'],
  ],
  [
    'primeira-vez',
    2,
    'A primeira vez que fizeste algo sozinho e correu mal',
    [
      'Quantos anos tinhas?',
      'O que é que correu mal exatamente?',
      'Alguém te ajudou a seguir?',
      'Fizeste outra vez? Correu como?',
    ],
    ['autonomia', 'falhar', 'tentar de novo'],
    'Contexto → O que correu mal → O que aprendeste',
  ],
  [
    'objeto',
    1,
    'Um objeto que nunca deitarias fora',
    [
      'Como é que veio parar às tuas mãos?',
      'Vale alguma coisa para outra pessoa?',
      'Onde é que ele está agora, neste momento?',
      'Se ardesse tudo e só pudesses salvar um, era esse?',
    ],
    ['valor sentimental', 'herança', 'apego'],
  ],
  [
    'sorte',
    3,
    'Quanto do que és hoje se deve a sorte?',
    [
      'Dá-me um exemplo de sorte concreta na tua vida.',
      'É confortável ou desconfortável pensar assim?',
      'Como é que distingues sorte de mérito?',
      'Isso muda a forma como julgas quem tem menos?',
    ],
    ['acaso', 'mérito', 'privilégio', 'contexto'],
  ],
]

export default buildTopics('pt', 'general', SPECS)
