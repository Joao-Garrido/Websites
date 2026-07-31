import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'good-life',
    3,
    'What is a life well lived?',
    [
      'Is that your definition or the one you inherited?',
      'Would you recognise a life well lived if you saw one?',
      'Can someone live well and be unhappy?',
      'Are you living that way today?',
    ],
    ['purpose', 'meaning', 'legacy', 'contentment'],
  ],
  [
    'free-will',
    3,
    'Do we actually have free will?',
    [
      'If we did not, what would change in practice?',
      'How does that affect the idea of blame?',
      'What proof would you accept either way?',
      'Do you live as though you have it?',
    ],
    ['determinism', 'responsibility', 'choice'],
  ],
  [
    'good-lie',
    2,
    'Is there such a thing as a good lie?',
    [
      'Give me one you have told.',
      'Where do you draw the line?',
      'Would you want to be lied to in those circumstances?',
      'Does leaving something out count as lying?',
    ],
    ['honesty', 'omission', 'intent', 'harm'],
  ],
  [
    'fairness',
    3,
    'What is fair: the same for everyone, or more for those with less?',
    [
      'Apply that to a concrete case you know.',
      'Who decides who has less?',
      'What is the strongest argument on the other side?',
      'Where does it break down in practice?',
    ],
    ['equality', 'equity', 'redistribution', 'merit'],
  ],
  [
    'happiness-goal',
    2,
    'Is happiness a good goal for a life?',
    [
      'What would you chase instead?',
      'Have you ever been happy and unsatisfied at once?',
      'How would you measure your own happiness?',
      'Does that change with age?',
    ],
    ['happiness', 'meaning', 'satisfaction', 'pursuit'],
  ],
  [
    'tradition',
    3,
    'When is a tradition worth keeping after it stops making sense?',
    [
      'Give me a concrete tradition and decide about it.',
      'Who loses if it ends?',
      'How do you tell tradition from inertia?',
      'Which of your traditions will you pass on?',
    ],
    ['tradition', 'continuity', 'ritual', 'inertia'],
  ],
  [
    'mortality',
    3,
    'Does knowing we will die make life better?',
    [
      'How does that change what you do this week?',
      'Would you want to live five hundred years?',
      'When did you last think about this?',
      'What would you say to someone who disagrees?',
    ],
    ['mortality', 'urgency', 'meaning'],
  ],
  [
    'success',
    2,
    'Define success without mentioning money or status',
    [
      'Is that hard? Why?',
      'Do you know anyone who fits that definition?',
      'How would you know you got there?',
      'Has that definition changed in ten years?',
    ],
    ['success', 'recognition', 'fulfilment'],
  ],
  [
    'own-opinions',
    3,
    'How many of your opinions are actually yours?',
    [
      'Pick one and trace where it came from.',
      'How would you test whether an opinion is yours?',
      'Is that a problem, or is that just how thinking works?',
      'Which of your opinions has survived being attacked?',
    ],
    ['influence', 'critical thinking', 'provenance'],
  ],
  [
    'forgiveness',
    3,
    'Are some things unforgivable?',
    [
      'Give me an example, no names needed.',
      'Is forgiving for the forgiver or the forgiven?',
      'Is forgiving the same as forgetting?',
      'Has anyone forgiven you something big?',
    ],
    ['forgiveness', 'resentment', 'repair'],
  ],
  [
    'progress',
    3,
    'Is the world getting better or worse?',
    [
      'What indicator would you use to decide?',
      'Are you talking about the world or your world?',
      'What is the strongest data point against your position?',
      'Does that change what you do day to day?',
    ],
    ['progress', 'indicators', 'pessimism', 'perspective'],
  ],
  [
    'suffering',
    3,
    'Does suffering teach you anything, or is it just suffering?',
    [
      'Did you learn something you could only learn that way?',
      'Would you recommend that suffering to someone?',
      'Are you rationalising it to make it bearable?',
      'Where does that idea become dangerous?',
    ],
    ['adversity', 'resilience', 'rationalise'],
  ],
]

export default buildTopics('en', 'ideas', SPECS)
