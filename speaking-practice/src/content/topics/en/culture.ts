import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'book-changed',
    1,
    'A book or film that changed how you see something',
    [
      'What idea did it change, concretely?',
      'Would you recommend it to everyone or only to certain people?',
      'Did you return to it later? Did it hold up?',
      'What criticism do you have of it now?',
    ],
    ['plot', 'character', 'perspective'],
  ],
  [
    'overrated',
    2,
    'A famous work you think is overrated',
    [
      'Why do you think everyone else likes it?',
      'What part of it do you recognise as good?',
      'What would you recommend instead?',
      'Has this ever started an argument?',
    ],
    ['overrated', 'consensus', 'taste'],
  ],
  [
    'song',
    1,
    'The song that always takes you to a place or a person',
    [
      'Where exactly does it take you?',
      'How old were you then?',
      'Do you play it on purpose or avoid it?',
      'Is the song good, or does it just mean a lot?',
    ],
    ['memory', 'nostalgia', 'association'],
  ],
  [
    'your-country',
    2,
    'What would you explain about your country to someone who has never been?',
    [
      'What is the most common misunderstanding about it?',
      'What annoys you when outsiders say it?',
      'Where would you take them first, and why there?',
      'What does your country do better than almost anyone?',
    ],
    ['identity', 'stereotype', 'hospitality'],
  ],
  [
    'too-much-tv',
    1,
    'Do we watch too much television?',
    [
      'How many hours a week, honestly?',
      'What did you stop doing because of it?',
      'What is the defence of watching a lot?',
      'Which series actually gave you something?',
    ],
    ['binge', 'entertainment', 'time'],
  ],
  [
    'art-artist',
    3,
    'Can you separate the art from the artist?',
    [
      'Give me a concrete case and decide about it.',
      'Where does the line move: crime, opinion, behaviour?',
      'Does it matter if the artist is dead?',
      'What if the money still goes to them?',
    ],
    ['separate', 'boycott', 'legacy', 'ethics'],
  ],
  [
    'translation',
    2,
    'Is it worth reading in translation, or is too much lost?',
    [
      'Have you read the same book in both languages?',
      'What exactly gets lost?',
      'And what does a translation sometimes gain?',
      'Does it depend on the kind of book?',
    ],
    ['translation', 'original', 'nuance'],
  ],
  [
    'comedy-limits',
    3,
    'Are there subjects comedy should not touch?',
    [
      'Give me your line, with an example.',
      'Does it matter who tells the joke?',
      'Have you laughed at something you knew you should not?',
      'How do you answer someone who says nothing is off limits?',
    ],
    ['comedy', 'limits', 'context', 'offence'],
  ],
  [
    'museums',
    2,
    'Should museums return what was taken?',
    [
      'Where do you draw the line in time?',
      'What if the country of origin cannot conserve it?',
      'Who legitimately owns a two-thousand-year-old object?',
      'How has this been resolved in practice?',
    ],
    ['restitution', 'heritage', 'colonialism'],
  ],
  [
    'guilty-pleasure',
    1,
    'Something you enjoy and are embarrassed about but should not be',
    [
      'Why the embarrassment?',
      'Who would judge you?',
      'What does it give you that nothing else does?',
      'Would you admit it at a dinner table?',
    ],
    ['taste', 'judgement', 'pleasure'],
  ],
  [
    'algorithm-taste',
    3,
    'Are algorithms narrowing what we like?',
    [
      'When did you last find something outside what was recommended to you?',
      'How would you measure that narrowing?',
      'What is the defence of algorithms?',
      'What do you do to escape it?',
    ],
    ['recommendation', 'bubble', 'discovery', 'curation'],
  ],
  [
    'classic',
    2,
    'What makes a work a classic?',
    [
      'Name something from today that will be a classic in fifty years.',
      'Who decides that?',
      'Are there classics that no longer deserve the place?',
      'Is that quality, or is it collective habit?',
    ],
    ['canon', 'endurance', 'criticism'],
  ],
]

export default buildTopics('en', 'culture', SPECS)
