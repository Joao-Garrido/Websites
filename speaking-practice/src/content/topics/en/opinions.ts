import { buildTopics, type TopicSpec } from '../build'

const SPECS: TopicSpec[] = [
  [
    'four-day-week',
    2,
    'The four-day week should be the norm',
    [
      'How does that work in hospitals, restaurants or factories?',
      'Who pays the difference?',
      'What results exist from places that tried it?',
      'What is the strongest argument against?',
    ],
    ['productivity', 'schedule', 'pilot', 'sector'],
    'PREP: Point, Reason, Example, Point',
  ],
  [
    'basic-income',
    3,
    'There should be an unconditional basic income',
    [
      'Where does the money come from, concretely?',
      'What do you say to someone who thinks people would stop working?',
      'What real trials do you know of?',
      'Does this replace or add to what already exists?',
    ],
    ['unconditional', 'funding', 'incentive', 'poverty'],
  ],
  [
    'compulsory-voting',
    2,
    'Voting should be compulsory',
    [
      'How do you answer someone who says it is a freedom?',
      'Which countries do it, and with what results?',
      'What changes in the election outcome?',
      'What would the penalty be, and is it fair?',
    ],
    ['turnout', 'civic duty', 'legitimacy'],
  ],
  [
    'eating-meat',
    3,
    'Eating meat will be seen as unacceptable in fifty years',
    [
      'What would have to happen for that to be true?',
      'Do you eat meat? Does that shape your answer?',
      'What is the most honest historical comparison?',
      'And what about the people who raise livestock for a living?',
    ],
    ['animal ethics', 'environment', 'shifting norms'],
  ],
  [
    'university',
    2,
    'University has stopped being worth it for many people',
    [
      'For whom is it still clearly worth it?',
      'What numbers would you use to defend that?',
      'What would replace university?',
      'Is this different in Europe and in the United States?',
    ],
    ['return on investment', 'debt', 'skills', 'signalling'],
  ],
  [
    'phones-schools',
    2,
    'Phones should be banned in schools',
    [
      'Banned how, and who enforces it?',
      'What do teachers who have seen both say?',
      'What about emergencies?',
      'Where would the ban fail?',
    ],
    ['ban', 'concentration', 'enforcement'],
  ],
  [
    'overtourism',
    3,
    'Tourism is destroying the cities we love',
    [
      'Give me a number that supports that.',
      'Who benefits from tourism and cannot be ignored?',
      'What concrete policy would you propose tomorrow?',
      'Where has another city solved this well?',
    ],
    ['short-term rentals', 'housing', 'gentrification', 'seasonality'],
    'PREP: Point, Reason, Example, Point',
  ],
  [
    'under-16',
    2,
    'Social media should be banned for under-sixteens',
    [
      'How do you verify age without destroying everyone else’s privacy?',
      'What is the strongest evidence in favour?',
      'What about the kids who find their community there?',
      'What alternative is there to a ban?',
    ],
    ['age verification', 'protection', 'freedom'],
  ],
  [
    'nuclear',
    3,
    'Nuclear power is indispensable for the climate',
    [
      'What about the waste and the construction cost?',
      'Which country is your best example?',
      'How long does a plant take to come online?',
      'What do you say to someone who wants renewables only?',
    ],
    ['decarbonisation', 'baseload', 'waste', 'cost'],
  ],
  [
    'work-identity',
    3,
    'We give work far too much space in our identity',
    [
      'What do you say to someone who loves what they do?',
      'Is that a luxury of people who have a choice?',
      'How would you introduce yourself without mentioning your job?',
      'Is this different between generations?',
    ],
    ['identity', 'vocation', 'balance'],
  ],
  [
    'inheritance',
    3,
    'Large inheritances should be taxed heavily',
    [
      'Where does "large" begin?',
      'What about the family home or the family business?',
      'What is the strongest moral argument on the other side?',
      'How does this work in countries that already do it?',
    ],
    ['inheritance', 'merit', 'inequality', 'taxation'],
  ],
  [
    'car-free',
    2,
    'City centres should be car-free',
    [
      'What about people with reduced mobility or deliveries?',
      'Which city is your example?',
      'How long would the transition take?',
      'Who loses, and how do you compensate them?',
    ],
    ['pedestrianised', 'mobility', 'local business', 'transition'],
  ],
]

export default buildTopics('en', 'opinions', SPECS)
