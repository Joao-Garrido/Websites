import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'telemovel-criancas',
    2,
    'Com que idade é que uma criança deve ter telemóvel?',
    [
      'O que é que muda exatamente a partir dessa idade?',
      'Qual é o argumento mais forte de quem daria mais cedo?',
      'Como é que os pais aplicariam essa regra na prática?',
      'E tu, com que idade tiveste o primeiro?',
    ],
    ['ecrãs', 'dependência', 'supervisão', 'pressão dos pares'],
  ],
  [
    'redes-sociais',
    2,
    'As redes sociais fizeram mais bem ou mais mal?',
    [
      'Separa-me isso: a quem fizeram bem e a quem fizeram mal?',
      'Como é que medirias esse balanço?',
      'O que é que perderíamos se desaparecessem amanhã?',
      'Quanto tempo passaste nelas ontem?',
    ],
    ['algoritmo', 'polarização', 'atenção', 'comunidade'],
  ],
  [
    'ia-arte',
    3,
    'Arte feita por IA é arte?',
    [
      'O que é que estás a assumir sobre o que faz uma coisa ser arte?',
      'Isso muda se não souberes que foi IA?',
      'Quem é o autor, na tua definição?',
      'Onde é que puseste a linha, e porquê aí?',
    ],
    ['autoria', 'intenção', 'originalidade', 'ofício'],
  ],
  [
    'privacidade',
    3,
    'Já desistimos da privacidade — e ainda bem?',
    [
      'O que é que trocaste por conveniência, em concreto?',
      'Quem é que sofre mais com a perda de privacidade?',
      'Que dado teu é que nunca darias?',
      'Isto era diferente há vinte anos?',
    ],
    ['vigilância', 'consentimento', 'dados', 'conveniência'],
  ],
  [
    'carro-autonomo',
    2,
    'Confiarias a tua vida a um carro autónomo?',
    [
      'Que número te convenceria de que é seguro?',
      'Quem é responsável quando há um acidente?',
      'Porque é que aceitamos erro humano melhor do que erro de máquina?',
      'E se fosse o teu filho no carro?',
    ],
    ['risco', 'responsabilidade', 'estatística', 'confiança'],
  ],
  [
    'ecra-tempo',
    1,
    'Consegues estar uma hora sem olhar para o telemóvel?',
    [
      'Quando foi a última vez que aconteceu por acaso?',
      'O que é que sentes nos primeiros dez minutos?',
      'O que é que estás mesmo à espera que apareça?',
      'Que regra criarias para ti se tivesses de criar uma?',
    ],
    ['distração', 'hábito', 'notificações', 'foco'],
  ],
  [
    'tecnologia-desapareceu',
    2,
    'Uma tecnologia que desapareceu e faz falta',
    [
      'O que é que ela fazia que a substituta não faz?',
      'Foi substituída porquê — era pior ou dava menos dinheiro?',
      'Isso é saudade ou é mesmo melhor?',
      'Que tecnologia de hoje vai desaparecer a seguir?',
    ],
    ['obsolescência', 'nostalgia', 'progresso'],
  ],
  [
    'trabalho-algoritmo',
    3,
    'Aceitarias ser avaliado por um algoritmo no trabalho?',
    [
      'Em que é que isso seria melhor do que um chefe humano?',
      'O que é que um algoritmo nunca veria em ti?',
      'Que garantias exigirias antes de aceitar?',
      'Isso já te acontece hoje sem saberes?',
    ],
    ['avaliação', 'viés', 'transparência', 'recurso'],
  ],
  [
    'internet-crianca',
    2,
    'A internet que conheceste em criança versus a de hoje',
    [
      'O que era melhor, concretamente?',
      'Isso é nostalgia ou consegues defendê-lo com factos?',
      'O que é que é claramente melhor hoje?',
      'Que internet queres para a próxima geração?',
    ],
    ['web aberta', 'plataformas', 'anonimato'],
  ],
  [
    'desligar',
    2,
    'Devia existir o direito legal a desligar fora de horas?',
    [
      'Como é que isso se aplicaria a quem trabalha por turnos ou por conta própria?',
      'Quem seria contra, e com que argumento?',
      'Já respondeste a mensagens de trabalho depois das dez da noite?',
      'Como é que se fiscaliza uma lei dessas?',
    ],
    ['direito a desligar', 'disponibilidade', 'legislação'],
  ],
  [
    'anonimato',
    3,
    'A internet devia exigir identidade real?',
    [
      'Quem é que perderia a voz se isso acontecesse?',
      'Que problema é que isso resolveria mesmo?',
      'Já disseste online algo que não dirias com o teu nome?',
      'Como é que isso funciona em países onde já se tentou?',
    ],
    ['anonimato', 'responsabilização', 'dissidência'],
  ],
  [
    'dependencia',
    2,
    'De que aplicação é que não conseguias mesmo prescindir?',
    [
      'O que farias sem ela, em concreto?',
      'Isso é dependência ou é só útil?',
      'Quanto pagarias por ela se fosse preciso?',
      'O que é que ela sabe sobre ti?',
    ],
    ['dependência', 'utilidade', 'alternativa'],
  ],
]

export default buildTopics('pt', 'tech', SPECS)
