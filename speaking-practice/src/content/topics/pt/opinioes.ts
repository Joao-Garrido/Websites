import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'semana-4-dias',
    2,
    'A semana de quatro dias devia ser a norma',
    [
      'Como é que isso funciona em hospitais, restaurantes ou fábricas?',
      'Quem paga a diferença?',
      'Que resultados existem de quem já experimentou?',
      'Qual é o argumento mais forte contra?',
    ],
    ['produtividade', 'horário', 'piloto', 'setor'],
    'PREP: Ponto, Razão, Exemplo, Ponto',
  ],
  [
    'rendimento-basico',
    3,
    'Devia existir um rendimento básico incondicional',
    [
      'De onde vem o dinheiro, em concreto?',
      'O que responderias a quem diz que as pessoas deixariam de trabalhar?',
      'Que experiências reais conheces?',
      'Isto substitui ou soma-se ao que já existe?',
    ],
    ['incondicional', 'financiamento', 'incentivo', 'pobreza'],
  ],
  [
    'voto-obrigatorio',
    2,
    'O voto devia ser obrigatório',
    [
      'Como é que responderias a quem diz que é uma liberdade?',
      'Que países o fazem e com que resultados?',
      'O que muda no resultado das eleições?',
      'Qual seria a sanção, e é justa?',
    ],
    ['abstenção', 'dever cívico', 'legitimidade'],
  ],
  [
    'carne',
    3,
    'Comer carne será visto como inaceitável daqui a cinquenta anos',
    [
      'O que teria de acontecer para isso ser verdade?',
      'Comes carne? Isso influencia a tua resposta?',
      'Qual é a comparação histórica mais honesta?',
      'E quem vive de criar gado?',
    ],
    ['ética animal', 'ambiente', 'mudança de norma'],
  ],
  [
    'universidade',
    2,
    'A universidade deixou de valer a pena para muita gente',
    [
      'Para quem é que ainda vale claramente?',
      'Que números usarias para defender isso?',
      'O que substituiria a universidade?',
      'Isso é diferente em Portugal e nos Estados Unidos?',
    ],
    ['retorno', 'dívida', 'competências', 'sinalização'],
  ],
  [
    'telemoveis-escola',
    2,
    'Telemóveis deviam ser proibidos nas escolas',
    [
      'Proibidos como, e quem fiscaliza?',
      'O que dizem os professores que já viveram os dois cenários?',
      'E se houver uma emergência?',
      'Onde é que a proibição falharia?',
    ],
    ['proibição', 'concentração', 'aplicação prática'],
  ],
  [
    'turismo',
    3,
    'O turismo está a destruir Lisboa e o Porto',
    [
      'Dá-me um número que sustente isso.',
      'Quem beneficia do turismo e não pode ser ignorado?',
      'Que política concreta proporias amanhã?',
      'Onde é que outra cidade resolveu isto bem?',
    ],
    ['alojamento local', 'habitação', 'gentrificação', 'sazonalidade'],
    'PREP: Ponto, Razão, Exemplo, Ponto',
  ],
  [
    'redes-menores',
    2,
    'As redes sociais deviam ser proibidas a menores de dezasseis anos',
    [
      'Como é que se verifica a idade sem destruir a privacidade de todos?',
      'Qual é a evidência mais forte a favor?',
      'E os miúdos que encontram lá a sua comunidade?',
      'Que alternativa existe a uma proibição?',
    ],
    ['verificação de idade', 'proteção', 'liberdade'],
  ],
  [
    'nuclear',
    3,
    'A energia nuclear é indispensável para o clima',
    [
      'E os resíduos e o custo de construção?',
      'Que país é o teu melhor exemplo?',
      'Quanto tempo demora uma central a ficar pronta?',
      'O que responderias a quem prefere só renováveis?',
    ],
    ['descarbonização', 'base', 'resíduos', 'custo'],
  ],
  [
    'trabalho-identidade',
    3,
    'Damos demasiada importância ao trabalho na nossa identidade',
    [
      'O que responderias a quem ama o que faz?',
      'Isso é um luxo de quem tem escolha?',
      'Como te apresentarias sem falar da profissão?',
      'Isto é diferente entre gerações?',
    ],
    ['identidade', 'vocação', 'equilíbrio'],
  ],
  [
    'heranca',
    3,
    'As grandes heranças deviam ser fortemente tributadas',
    [
      'Onde começa "grande"?',
      'E a casa de família ou a empresa familiar?',
      'Qual é o argumento moral mais forte do outro lado?',
      'Como é que isso funciona nos países que já o fazem?',
    ],
    ['herança', 'mérito', 'desigualdade', 'fiscalidade'],
  ],
  [
    'carros-cidade',
    2,
    'Os centros das cidades deviam ser livres de carros',
    [
      'E quem tem mobilidade reduzida ou precisa de carga?',
      'Que cidade é o teu exemplo?',
      'Quanto tempo demoraria a transição?',
      'Quem perde com isso, e como se compensa?',
    ],
    ['peatonal', 'mobilidade', 'comércio local', 'transição'],
  ],
]

export default buildTopics('pt', 'opinions', SPECS)
