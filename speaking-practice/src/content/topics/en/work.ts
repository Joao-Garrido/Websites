import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'remote-colleagues',
    2,
    'Has remote work made us worse colleagues?',
    [
      'What exactly is lost when you do not share a space?',
      'If you had to argue for mandatory office days, what is your best case?',
      'Who loses more in remote work — juniors or seniors?',
      'How would you measure whether a remote team is worse off?',
    ],
    ['in person', 'asynchronous', 'trust', 'onboarding'],
    'PREP: Point, Reason, Example, Point',
  ],
  [
    'best-boss',
    2,
    'The best manager you ever had — what did they do differently?',
    [
      'Give me one concrete thing they did every week.',
      'Was that personality or method?',
      'How did they react when you got something wrong?',
      'Can you do the same for others today?',
    ],
    ['leadership', 'trust', 'feedback', 'delegate'],
  ],
  [
    'when-to-quit',
    2,
    'When should you quit a job?',
    [
      'What is the sign you can no longer ignore?',
      'Have you ever left too late?',
      'And leaving too early — what does that cost?',
      'How do you tell a bad patch from a bad place?',
    ],
    ['breaking point', 'stagnation', 'timing'],
  ],
  [
    'useless-meeting',
    1,
    'The most useless meeting you have ever sat through',
    [
      'How many people were there and how many were needed?',
      'Why did nobody cancel it?',
      'What would have saved it?',
      'How do you decide today whether to attend a meeting?',
    ],
    ['agenda', 'waste', 'decision'],
  ],
  [
    'salary-talk',
    3,
    'Should we talk openly about salaries?',
    [
      'Who benefits from the current silence?',
      'Have you ever asked a colleague what they earn? How did it go?',
      'What problems would transparency create?',
      'How does this work at companies that already do it?',
    ],
    ['transparency', 'pay equity', 'negotiation', 'taboo'],
  ],
  [
    'expensive-mistake',
    2,
    'The most expensive mistake you made at work',
    [
      'What did it cost, in money or in time?',
      'How did you tell people?',
      'How did the people above you react?',
      'What did you change in your process afterwards?',
    ],
    ['own it', 'damage control', 'lesson'],
    'STAR: Situation, Task, Action, Result',
  ],
  [
    'ai-job',
    3,
    'Will AI take your job or make it better?',
    [
      'What part of your work could already be automated today?',
      'What still needs a person, and why?',
      'How would you measure whether it made you more productive?',
      'In ten years, what is left of your role?',
    ],
    ['automation', 'reskilling', 'productivity', 'judgement'],
  ],
  [
    'ambition',
    3,
    'Is ambition a virtue or a trap?',
    [
      'Where is the line between ambition and greed?',
      'Do you know someone who paid dearly for being ambitious?',
      'And someone who paid for not being?',
      'How would you describe your own ambition today?',
    ],
    ['drive', 'sacrifice', 'balance'],
  ],
  [
    'hard-feedback',
    2,
    'The harshest feedback you received that turned out to be right',
    [
      'Who gave it and how?',
      'What was your first reaction, honestly?',
      'How long did it take you to accept it?',
      'What did you concretely change?',
    ],
    ['criticism', 'defensive', 'blind spot'],
    'STAR: Situation, Task, Action, Result',
  ],
  [
    'talent-effort',
    2,
    'Talent or effort: which matters more in your field?',
    [
      'Give me an example of a talented person who fell away.',
      'How do you spot talent early?',
      'Is it different in other professions?',
      'Where do you put yourself on that scale?',
    ],
    ['talent', 'discipline', 'deliberate practice'],
  ],
  [
    'saying-no',
    2,
    'The last time you should have said no and said yes',
    [
      'Why did you say yes?',
      'What did it cost you?',
      'How would you say no today, in the right words?',
      'Is there someone around you who says no well?',
    ],
    ['boundaries', 'overcommit', 'decline'],
  ],
  [
    'linear-career',
    3,
    'The linear career is over — or is that just a story we tell?',
    [
      'Has your own career been linear?',
      'Who still benefits from a linear career?',
      'What evidence would change your mind?',
      'What would you tell a twenty-year-old today?',
    ],
    ['career path', 'transition', 'stability'],
  ],
]

export default buildTopics('en', 'work', SPECS)
