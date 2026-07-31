import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'kids-phones',
    2,
    'At what age should a child get a smartphone?',
    [
      'What exactly changes at that age?',
      'What is the strongest case for giving one earlier?',
      'How would parents actually enforce that rule?',
      'How old were you when you got your first?',
    ],
    ['screen time', 'dependence', 'supervision', 'peer pressure'],
  ],
  [
    'social-media',
    2,
    'Have social networks done more good than harm?',
    [
      'Split that for me: good for whom, harm to whom?',
      'How would you measure that balance?',
      'What would we lose if they vanished tomorrow?',
      'How long were you on them yesterday?',
    ],
    ['algorithm', 'polarisation', 'attention', 'community'],
  ],
  [
    'ai-art',
    3,
    'Is AI-generated art actually art?',
    [
      'What are you assuming about what makes something art?',
      'Does that change if you do not know it was AI?',
      'Who is the author, under your definition?',
      'Where did you put the line, and why there?',
    ],
    ['authorship', 'intent', 'originality', 'craft'],
  ],
  [
    'privacy',
    3,
    'We have already given up privacy — and is that fine?',
    [
      'What have you traded for convenience, concretely?',
      'Who suffers most from losing privacy?',
      'What piece of your data would you never hand over?',
      'Was this different twenty years ago?',
    ],
    ['surveillance', 'consent', 'data', 'convenience'],
  ],
  [
    'self-driving',
    2,
    'Would you trust a self-driving car with your life?',
    [
      'What number would convince you it is safe?',
      'Who is liable when there is a crash?',
      'Why do we accept human error more easily than machine error?',
      'What if your child were in the car?',
    ],
    ['risk', 'liability', 'statistics', 'trust'],
  ],
  [
    'hour-offline',
    1,
    'Can you go an hour without looking at your phone?',
    [
      'When did that last happen by accident?',
      'What do you feel in the first ten minutes?',
      'What are you actually waiting to appear?',
      'What rule would you set for yourself if you had to set one?',
    ],
    ['distraction', 'habit', 'notifications', 'focus'],
  ],
  [
    'lost-tech',
    2,
    'A technology that disappeared and is genuinely missed',
    [
      'What did it do that its replacement does not?',
      'Was it replaced because it was worse, or because it made less money?',
      'Is that nostalgia or is it actually better?',
      'Which of today’s technologies disappears next?',
    ],
    ['obsolescence', 'nostalgia', 'progress'],
  ],
  [
    'algorithmic-boss',
    3,
    'Would you accept being evaluated by an algorithm at work?',
    [
      'How would that be better than a human manager?',
      'What would an algorithm never see in you?',
      'What guarantees would you demand first?',
      'Does this already happen to you without you knowing?',
    ],
    ['performance review', 'bias', 'transparency', 'appeal'],
  ],
  [
    'old-internet',
    2,
    'The internet you grew up with versus the one we have now',
    [
      'What was concretely better?',
      'Is that nostalgia, or can you defend it with facts?',
      'What is clearly better today?',
      'What internet do you want for the next generation?',
    ],
    ['open web', 'platforms', 'anonymity'],
  ],
  [
    'right-to-disconnect',
    2,
    'Should there be a legal right to disconnect after hours?',
    [
      'How would that apply to shift workers or the self-employed?',
      'Who would oppose it, and with what argument?',
      'Have you answered work messages after ten at night?',
      'How do you enforce a law like that?',
    ],
    ['right to disconnect', 'availability', 'legislation'],
  ],
  [
    'real-names',
    3,
    'Should the internet require real identities?',
    [
      'Who would lose their voice if that happened?',
      'What problem would it really solve?',
      'Have you said something online you would not say under your name?',
      'How has this gone in countries that tried it?',
    ],
    ['anonymity', 'accountability', 'dissent'],
  ],
  [
    'one-app',
    2,
    'Which app could you genuinely not do without?',
    [
      'What would you concretely do without it?',
      'Is that dependence, or is it just useful?',
      'How much would you pay for it if you had to?',
      'What does it know about you?',
    ],
    ['dependence', 'utility', 'alternative'],
  ],
]

export default buildTopics('en', 'tech', SPECS)
