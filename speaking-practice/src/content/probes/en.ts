import type { EchoTemplate, Move, Probe } from '../types'

const RAW: [Move, ...string[]][] = [
  [
    'concretize',
    'Give me one concrete example.',
    'Can you describe a specific time that happened?',
    'That sounds abstract. What does it look like in practice?',
    'Set the scene for me: where were you, who was there?',
    'When was the last time you saw that happen?',
    'Give me a case where it worked and one where it did not.',
    'If I were watching over your shoulder, what would I see?',
    'What would someone actually do differently because of that?',
    'Can you give me a number, a date, or a name?',
  ],
  [
    'challenge',
    "What's the strongest case against what you just said?",
    'Who would disagree with you, and why?',
    'What if you are wrong? What would follow?',
    "Isn't that a little too convenient for you?",
    'Are you sure you are not mixing up cause and effect?',
    'What evidence would change your mind?',
    'That works for you — does it work for someone without your advantages?',
    'It sounds like you are assuming something you have not said. What?',
    'If it were that obvious, why is it not already the norm?',
    'Now argue the opposite of what you just defended.',
  ],
  [
    'personalize',
    'When did that happen to you?',
    'How did that feel in the moment?',
    'What did that change about how you live now?',
    'When did you first start thinking this way?',
    'What would you tell yourself five years ago about this?',
    'Did that cost you anything? What?',
    'Has anyone ever changed your mind on this? Who?',
    'What do you regret in that story?',
  ],
  [
    'simplify',
    'Explain that to a ten-year-old.',
    'Sum that up in one sentence.',
    'If you could only use plain words, how would you say it?',
    'What is the core idea, stripped of everything else?',
    'How would you explain this to someone who has never heard of it?',
    'Give me the twenty-second version.',
  ],
  [
    'quantify',
    'How would you measure whether that is true?',
    'What number would make that undeniable?',
    'How much is "a lot", concretely?',
    'What data would you need to see to be convinced?',
    'What was the actual impact — can you estimate it?',
    'How long did that take, exactly?',
    'If you had to bet money on your prediction, how much would you bet?',
  ],
  [
    'prioritize',
    'If you could keep only one of those, which?',
    'What gets cut first, if you have to cut?',
    'Which part actually matters and which part is noise?',
    'Where would you start tomorrow morning?',
    'If you had half the time, what would you drop?',
    'Rank those for me: most important first.',
  ],
  [
    'hypothesize',
    'What if the opposite were true?',
    'What would have to change for this to stop being a problem?',
    'Imagine you have unlimited resources. What do you do?',
    'What does this look like in ten years?',
    'If you could change one rule, which would it be?',
    'What is the worst that happens if we go down that road?',
    'What if you had to solve it with no money at all?',
  ],
  [
    'contrast',
    'How is that different from ten years ago?',
    'How does that work in another country you know?',
    'What is the difference between that and the obvious alternative?',
    'Is that new, or is it an old thing with a new name?',
    'Who does this better than us, and what do they do differently?',
    'How does your generation see this differently from the last one?',
  ],
]

let seq = 0
export const EN_PROBES: Probe[] = RAW.flatMap(([move, ...texts]) =>
  texts.map((text) => ({ id: `en-p${++seq}`, lang: 'en' as const, move, text })),
)

const RAW_ECHO: [Move, ...string[]][] = [
  [
    'concretize',
    'You mentioned {x}. Give me an example of that.',
    'You said {x} — what does that look like day to day?',
    'Let us go back to {x}. What does that mean concretely?',
  ],
  [
    'challenge',
    'You mentioned {x}. Is that a cause or a consequence?',
    'You said {x}. Who would say exactly the opposite?',
    'You are leaning hard on {x}. What if that does not hold?',
    'You mentioned {x}. Does that not contradict what you said earlier?',
  ],
  [
    'personalize',
    'You said {x}. Why did that matter to you?',
    'You mentioned {x}. Tell me the story behind it.',
    'When did {x} come into your life?',
  ],
  [
    'quantify',
    'You mentioned {x}. How would you measure that?',
    'You said {x} — how much, exactly?',
  ],
  [
    'prioritize',
    'Of everything you said, {x} sounded strongest. Do you agree?',
    'If you had to choose between {x} and the rest, what would you keep?',
  ],
  [
    'hypothesize',
    'What if {x} disappeared tomorrow?',
    'Imagine a world without {x}. What changes?',
  ],
  [
    'contrast',
    'You mentioned {x}. Was that the case ten years ago?',
    'How does {x} compare to the alternative?',
  ],
  ['simplify', 'Explain {x} to me as if I knew nothing about it.'],
]

let eseq = 0
export const EN_ECHO: EchoTemplate[] = RAW_ECHO.flatMap(([move, ...texts]) =>
  texts.map((text) => ({ id: `en-e${++eseq}`, lang: 'en' as const, move, text })),
)

export const EN_REACTIVE = {
  tooShort: [
    'You stopped there. Give me another minute on that.',
    'That was short. Expand.',
    'It feels like there is more there. Keep going.',
  ],
  noExample: [
    'That is abstract. Tell me about a real case.',
    'You have not given me an example yet. Give me one.',
    'That is all theory. Land me in a concrete situation.',
  ],
  hedging: [
    'You sounded unsure. Take a position: yes or no?',
    'That was full of "maybe". Tell me what you actually think.',
    'Drop the "I guess" and say the sentence again.',
  ],
  absolutes: [
    'You said "{x}". What is the exception?',
    'Careful with "{x}". Can you really defend that?',
  ],
  repetition: [
    'You came back to "{x}" several times. Define that word for me.',
    'Did you notice you repeated "{x}"? What do you really mean by it?',
  ],
  tooLong: [
    'Sum that up in two sentences.',
    'Good, but that was long. What is the essential part?',
  ],
  silence: [
    'No rush. Start wherever is easiest.',
    'Say whatever comes to mind, even if it is not tidy.',
  ],
} as const

export const EN_CLOSER = 'To close: sum up your position in twenty seconds.'

export const EN_ACKS = [
  'Right.',
  'I see.',
  'Hmm.',
  'Makes sense.',
  'Okay.',
  'Interesting.',
]
