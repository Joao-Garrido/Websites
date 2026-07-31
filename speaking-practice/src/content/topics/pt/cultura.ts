import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'livro-marcou',
    1,
    'Um livro ou filme que mudou a maneira como vês uma coisa',
    [
      'Que ideia é que ele mudou, em concreto?',
      'Recomendarias a toda a gente ou só a certas pessoas?',
      'Voltaste a ele depois? Aguentou?',
      'Que crítica lhe fazes hoje?',
    ],
    ['enredo', 'personagem', 'perspetiva'],
  ],
  [
    'obra-sobrevalorizada',
    2,
    'Uma obra famosa que achas sobrevalorizada',
    [
      'Porque é que achas que toda a gente gosta?',
      'Qual é a parte que reconheces como boa?',
      'O que recomendarias em vez dela?',
      'Isso já te causou uma discussão?',
    ],
    ['sobrevalorizado', 'consenso', 'gosto'],
  ],
  [
    'musica',
    1,
    'A música que te leva sempre a um sítio ou a uma pessoa',
    [
      'Onde é que te leva, exatamente?',
      'Quantos anos tinhas nessa altura?',
      'Ouves de propósito ou evitas?',
      'A música é boa, ou só significa muito?',
    ],
    ['memória', 'nostalgia', 'associação'],
  ],
  [
    'cultura-portuguesa',
    2,
    'O que explicarias sobre Portugal a quem nunca cá veio?',
    [
      'Qual é o mal-entendido mais comum sobre o país?',
      'O que é que te irrita quando os outros dizem?',
      'Onde os levarias primeiro, e porquê aí?',
      'O que é que Portugal faz melhor do que quase toda a gente?',
    ],
    ['identidade', 'estereótipo', 'hospitalidade'],
  ],
  [
    'series',
    1,
    'Vemos demasiadas séries?',
    [
      'Quantas horas por semana, honestamente?',
      'O que é que deixaste de fazer por causa disso?',
      'Qual é a defesa de ver muito?',
      'Que série te deu mesmo alguma coisa?',
    ],
    ['maratona', 'entretenimento', 'tempo'],
  ],
  [
    'artista-obra',
    3,
    'Consegues separar a obra do artista?',
    [
      'Dá-me um caso concreto e decide sobre ele.',
      'Onde é que a linha muda: crime, opinião, comportamento?',
      'Importa se o artista já morreu?',
      'E se o dinheiro ainda for para ele?',
    ],
    ['separar', 'boicote', 'legado', 'ética'],
  ],
  [
    'traducao',
    2,
    'Vale a pena ler traduzido ou perde-se demasiado?',
    [
      'Já leste o mesmo livro nas duas línguas?',
      'O que é que se perde exatamente?',
      'E o que é que uma tradução às vezes ganha?',
      'Isso muda com o tipo de livro?',
    ],
    ['tradução', 'original', 'nuance'],
  ],
  [
    'humor',
    3,
    'Há temas sobre os quais não se deve fazer humor?',
    [
      'Dá-me a tua linha, com um exemplo.',
      'Importa quem faz a piada?',
      'Já riste de algo que sabias que não devias?',
      'Como é que respondes a quem diz que é tudo permitido?',
    ],
    ['humor', 'limite', 'contexto', 'ofensa'],
  ],
  [
    'museu',
    2,
    'Os museus deviam devolver o que foi levado?',
    [
      'Onde é que traças a linha no tempo?',
      'E se o país de origem não tiver condições para conservar?',
      'Quem é o dono legítimo de um objeto com dois mil anos?',
      'Como é que isto tem sido resolvido na prática?',
    ],
    ['restituição', 'património', 'colonialismo'],
  ],
  [
    'gosto-culpado',
    1,
    'Um gosto de que tens vergonha e não devias',
    [
      'Porque é que tens vergonha?',
      'Quem é que te julgaria?',
      'O que é que ele te dá que outra coisa não dá?',
      'Assumirias isso numa mesa de jantar?',
    ],
    ['gosto', 'julgamento', 'prazer'],
  ],
  [
    'algoritmo-gosto',
    3,
    'Os algoritmos estão a estreitar aquilo de que gostamos?',
    [
      'Quando foi a última vez que descobriste algo fora do que te recomendaram?',
      'Como é que medirias esse estreitamento?',
      'Qual é a defesa dos algoritmos?',
      'O que fazes para fugir disso?',
    ],
    ['recomendação', 'bolha', 'descoberta', 'curadoria'],
  ],
  [
    'classico',
    2,
    'O que faz de uma obra um clássico?',
    [
      'Dá-me algo de hoje que será clássico daqui a cinquenta anos.',
      'Quem decide isso?',
      'Há clássicos que já não merecem o lugar?',
      'Isso é qualidade ou é hábito coletivo?',
    ],
    ['cânone', 'duração', 'crítica'],
  ],
]

export default buildTopics('pt', 'culture', SPECS)
