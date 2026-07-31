import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'vida-boa',
    3,
    'O que é uma vida bem vivida?',
    [
      'Isso é a tua definição ou a que herdaste?',
      'Conhecerias uma vida bem vivida se a visses?',
      'Alguém pode ter uma vida bem vivida e ser infeliz?',
      'Estás a viver assim hoje?',
    ],
    ['propósito', 'sentido', 'legado', 'contentamento'],
  ],
  [
    'livre-arbitrio',
    3,
    'Temos mesmo livre-arbítrio?',
    [
      'Se não tivéssemos, o que mudava na prática?',
      'Como é que isso afeta a ideia de culpa?',
      'Que prova aceitarias num sentido ou no outro?',
      'Vives como se tivesses?',
    ],
    ['determinismo', 'responsabilidade', 'escolha'],
  ],
  [
    'mentira-boa',
    2,
    'Existe mentira boa?',
    [
      'Dá-me uma que tenhas dito.',
      'Onde é que traças a linha?',
      'Preferias que te mentissem nessas circunstâncias?',
      'E a omissão conta como mentira?',
    ],
    ['honestidade', 'omissão', 'intenção', 'dano'],
  ],
  [
    'justica',
    3,
    'O que é justo: dar o mesmo a todos ou dar mais a quem tem menos?',
    [
      'Aplica isso a um caso concreto que conheças.',
      'Quem decide quem tem menos?',
      'Qual é o argumento mais forte do outro lado?',
      'Onde é que isso falha na prática?',
    ],
    ['igualdade', 'equidade', 'redistribuição', 'mérito'],
  ],
  [
    'felicidade-objetivo',
    2,
    'A felicidade é um bom objetivo de vida?',
    [
      'O que é que perseguirias em vez disso?',
      'Já foste feliz e insatisfeito ao mesmo tempo?',
      'Como é que medirias a tua felicidade?',
      'Isso muda com a idade?',
    ],
    ['felicidade', 'sentido', 'satisfação', 'perseguição'],
  ],
  [
    'tradicao',
    3,
    'Quando é que vale a pena manter uma tradição que já não faz sentido?',
    [
      'Dá-me uma tradição concreta e decide sobre ela.',
      'Quem sofre se ela acabar?',
      'Como é que se distingue tradição de inércia?',
      'Que tradição tua vais passar adiante?',
    ],
    ['tradição', 'continuidade', 'ritual', 'inércia'],
  ],
  [
    'morte',
    3,
    'Saber que vamos morrer torna a vida melhor?',
    [
      'Como é que isso muda o que fazes esta semana?',
      'Quererias viver quinhentos anos?',
      'Quando é que pensaste nisto pela última vez?',
      'Que argumento darias a quem discorda?',
    ],
    ['finitude', 'urgência', 'sentido'],
  ],
  [
    'sucesso',
    2,
    'Como defines sucesso sem falar em dinheiro nem em estatuto?',
    [
      'Isso é difícil? Porquê?',
      'Conheces alguém que encaixe nessa definição?',
      'Como é que sabes que lá chegaste?',
      'Essa definição mudou nos últimos dez anos?',
    ],
    ['sucesso', 'reconhecimento', 'realização'],
  ],
  [
    'opiniao-propria',
    3,
    'Quantas das tuas opiniões são mesmo tuas?',
    [
      'Escolhe uma e traça-lhe a origem.',
      'Como é que testarias se uma opinião é tua?',
      'Isso é problema ou é assim que funciona pensar?',
      'Que opinião tua já sobreviveu a ser atacada?',
    ],
    ['influência', 'pensamento crítico', 'origem'],
  ],
  [
    'perdao',
    3,
    'Há coisas imperdoáveis?',
    [
      'Dá-me um exemplo, sem nomes se preferires.',
      'Perdoar é para quem perdoa ou para quem é perdoado?',
      'Perdoar é o mesmo que esquecer?',
      'Já te perdoaram alguma coisa grande?',
    ],
    ['perdão', 'ressentimento', 'reparação'],
  ],
  [
    'progresso',
    3,
    'O mundo está a melhorar ou a piorar?',
    [
      'Que indicador usarias para decidir isso?',
      'Estás a falar do mundo ou do teu mundo?',
      'Qual é o dado mais forte contra a tua posição?',
      'Isso muda o que fazes no dia a dia?',
    ],
    ['progresso', 'indicadores', 'pessimismo', 'perspetiva'],
  ],
  [
    'sofrimento',
    3,
    'O sofrimento ensina alguma coisa, ou é só sofrimento?',
    [
      'Aprendeste alguma coisa que só se aprende assim?',
      'Recomendarias esse sofrimento a alguém?',
      'Não estarás a racionalizar para o tornar suportável?',
      'Onde é que essa ideia se torna perigosa?',
    ],
    ['adversidade', 'resiliência', 'racionalizar'],
  ],
]

export default buildTopics('pt', 'ideas', SPECS)
