import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'remoto-colegas',
    2,
    'O trabalho remoto tornou-nos piores colegas?',
    [
      'O que é que se perde exatamente quando não se partilha um espaço?',
      'Se tivesses de defender o escritório obrigatório, qual era o teu melhor argumento?',
      'Quem é que sai a perder no remoto — os juniores ou os seniores?',
      'Como é que medirias se uma equipa remota está pior?',
    ],
    ['presencial', 'assíncrono', 'confiança', 'integração'],
    'PREP: Ponto, Razão, Exemplo, Ponto',
  ],
  [
    'melhor-chefe',
    2,
    'O melhor chefe que tiveste — o que fazia de diferente?',
    [
      'Dá-me uma coisa concreta que ele fazia todas as semanas.',
      'Isso era personalidade ou método?',
      'Como é que reagia quando erravas?',
      'Consegues fazer o mesmo pelos outros hoje?',
    ],
    ['liderança', 'confiança', 'feedback', 'delegar'],
  ],
  [
    'sair',
    2,
    'Quando é que se deve sair de um emprego?',
    [
      'Qual é o sinal que já não dá para ignorar?',
      'Já saíste tarde demais alguma vez?',
      'E sair cedo demais — qual é o custo?',
      'Como é que separas um mau período de um mau sítio?',
    ],
    ['ponto de rutura', 'estagnação', 'timing'],
  ],
  [
    'reunioes',
    1,
    'A reunião mais inútil em que já estiveste',
    [
      'Quantas pessoas estavam lá e quantas eram precisas?',
      'Porque é que ninguém a cancelou?',
      'O que a teria salvado?',
      'Como é que decides hoje se vais a uma reunião?',
    ],
    ['agenda', 'desperdício', 'decisão'],
  ],
  [
    'salario',
    3,
    'Devíamos falar abertamente de salários?',
    [
      'Quem beneficia do silêncio atual?',
      'Já perguntaste a um colega quanto ganha? Como correu?',
      'Que problemas é que a transparência criaria?',
      'Como é que isto funciona em empresas que já o fazem?',
    ],
    ['transparência', 'equidade', 'negociação', 'tabu'],
  ],
  [
    'erro-caro',
    2,
    'O erro mais caro que cometeste no trabalho',
    [
      'Quanto custou, em dinheiro ou em tempo?',
      'Como é que o comunicaste?',
      'Qual foi a reação de quem estava acima de ti?',
      'O que é que mudaste no teu processo depois disso?',
    ],
    ['assumir', 'contenção', 'lição'],
    'STAR: Situação, Tarefa, Ação, Resultado',
  ],
  [
    'ia-trabalho',
    3,
    'A IA vai tirar-te o emprego ou torná-lo melhor?',
    [
      'Que parte do teu trabalho é que já podia ser automatizada hoje?',
      'O que é que continua a exigir uma pessoa, e porquê?',
      'Como é que medias se te tornou mais produtivo?',
      'E daqui a dez anos, o que resta da tua função?',
    ],
    ['automação', 'requalificação', 'produtividade', 'julgamento'],
  ],
  [
    'ambicao',
    3,
    'A ambição é uma virtude ou uma armadilha?',
    [
      'Onde é que está a linha entre ambição e ganância?',
      'Conheces alguém que pagou caro por ser ambicioso?',
      'E alguém que pagou caro por não ser?',
      'Como é que descreverias a tua própria ambição hoje?',
    ],
    ['ambição', 'sacrifício', 'equilíbrio'],
  ],
  [
    'feedback-duro',
    2,
    'A crítica mais dura que recebeste e que estava certa',
    [
      'Quem ta deu e como?',
      'Qual foi a tua primeira reação, honestamente?',
      'Quanto tempo demoraste a aceitá-la?',
      'O que mudaste em concreto?',
    ],
    ['crítica', 'defensiva', 'ponto cego'],
    'STAR: Situação, Tarefa, Ação, Resultado',
  ],
  [
    'talento-esforco',
    2,
    'Talento ou esforço: o que pesa mais na tua área?',
    [
      'Dá-me um exemplo de alguém talentoso que ficou pelo caminho.',
      'Como é que se reconhece talento cedo?',
      'Isso é diferente noutras profissões?',
      'Onde é que tu te colocas nessa balança?',
    ],
    ['talento', 'disciplina', 'prática deliberada'],
  ],
  [
    'dizer-nao',
    2,
    'A última vez que devias ter dito que não e disseste que sim',
    [
      'Porque é que disseste que sim?',
      'O que é que isso te custou?',
      'Como é que dirias não hoje, com as palavras certas?',
      'Há alguém que diga não bem, à tua volta?',
    ],
    ['limites', 'sobrecarga', 'recusar'],
  ],
  [
    'carreira-linear',
    3,
    'A carreira linear acabou — ou é só uma história que contamos?',
    [
      'A tua carreira foi linear?',
      'Quem é que ainda beneficia de uma carreira linear?',
      'Que provas terias de ver para mudares de ideias?',
      'O que dirias a alguém de vinte anos hoje?',
    ],
    ['percurso', 'transição', 'estabilidade'],
  ],
]

export default buildTopics('pt', 'work', SPECS)
