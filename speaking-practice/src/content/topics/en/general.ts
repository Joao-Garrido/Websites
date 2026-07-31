import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'sunday',
    1,
    'Your perfect Sunday, start to finish',
    [
      'What time do you wake up, and is that a choice or a habit?',
      'Is anyone else in this Sunday, or are you alone?',
      'What would ruin the whole day?',
      'How many Sundays like that have you had this year?',
    ],
    ['unwind', 'ritual', 'switch off', 'no plans'],
  ],
  [
    'changed-mind',
    2,
    'Something you changed your mind about in the last five years',
    [
      'What exactly did you believe before?',
      'What was the moment or the person that shook it?',
      'Was it hard to admit? Why?',
      'What do you suspect you will change your mind about next?',
    ],
    ['reconsider', 'admit', 'turning point', 'stubbornness'],
    'Before → Jolt → After',
  ],
  [
    'bad-advice',
    2,
    'The worst advice you were ever given with good intentions',
    [
      'Who gave it, and why did you think they knew?',
      'Did you actually follow it?',
      'Was it wrong, or just wrong for you?',
      'What would you tell someone in that situation today?',
    ],
    ['well-meaning', 'conventional wisdom', 'tailored'],
  ],
  [
    'expensive-thing',
    1,
    'The best expensive thing you ever bought — was it worth it?',
    [
      'How long did you hesitate before buying?',
      'How did you justify it to yourself?',
      'Do you still use it?',
      'What was your worst expensive purchase?',
    ],
    ['worth it', 'splurge', 'regret', 'cost per use'],
  ],
  [
    'learned-late',
    2,
    'Something everyone seems to know that you learned embarrassingly late',
    [
      'How did you find out you did not know?',
      'Were you embarrassed or did you find it funny?',
      'Why had nobody told you?',
      'What do you still suspect you do not know?',
    ],
    ['blind spot', 'taken for granted', 'admit ignorance'],
  ],
  [
    'city',
    2,
    'The city you live in: what would you change first?',
    [
      'Who would that change hurt?',
      'Why has it not been done already?',
      'Roughly what would it cost?',
      'What does your city already do better than others?',
    ],
    ['urban planning', 'transit', 'housing', 'public space'],
  ],
  [
    'free-hours',
    1,
    'If you were handed four free hours right now, what would you really do?',
    [
      'Is that what you would do, or what you would like to say you would do?',
      'What stops you doing it in a normal week?',
      'When did you last have those four hours?',
      'What if it were four weeks instead of four hours?',
    ],
    ['free time', 'priorities', 'excuses'],
  ],
  [
    'small-habit',
    1,
    'A small habit that changed your day',
    [
      'How long have you been doing it?',
      'What happens on the days you skip it?',
      'How did it start?',
      'What habit did you try that never stuck?',
    ],
    ['routine', 'consistency', 'trigger'],
  ],
  [
    'quiet-disagreement',
    3,
    'A common opinion you disagree with but never argue about in public',
    [
      'Why do you not defend it out loud?',
      'What is the social cost of saying it?',
      'Who would agree with you in private?',
      'What would change your position?',
    ],
    ['consensus', 'self-censorship', 'unpopular'],
  ],
  [
    'first-time',
    2,
    'The first time you did something alone and it went wrong',
    [
      'How old were you?',
      'What exactly went wrong?',
      'Did anyone help you afterwards?',
      'Did you try again? How did that go?',
    ],
    ['independence', 'mess up', 'try again'],
    'Setup → What went wrong → What you learned',
  ],
  [
    'object',
    1,
    'An object you would never throw away',
    [
      'How did it come to you?',
      'Is it worth anything to anyone else?',
      'Where is it right now, this minute?',
      'If the place burned down and you could save one thing, is it that?',
    ],
    ['sentimental value', 'heirloom', 'attachment'],
  ],
  [
    'luck',
    3,
    'How much of who you are today is luck?',
    [
      'Give me a concrete piece of luck in your life.',
      'Is it comfortable or uncomfortable to think that way?',
      'How do you tell luck apart from merit?',
      'Does that change how you judge people with less?',
    ],
    ['chance', 'merit', 'privilege', 'circumstance'],
  ],
]

export default buildTopics('en', 'general', SPECS)
