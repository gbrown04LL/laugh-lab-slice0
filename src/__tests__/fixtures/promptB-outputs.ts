import { PromptBOutput } from '@/lib/llm/promptB';

/**
 * Mock Prompt B outputs for testing
 */

export const mockPromptBBasic: PromptBOutput = {
  summary: {
    headline: 'Sharp dialogue with solid character dynamics',
    oneLineVerdict: 'Your setup-payoff game is strong, but Act 2 needs more density to maintain momentum.',
    benchmarkShow: 'Brooklyn Nine-Nine',
  },
  strengths: {
    paragraphs: [
      'Your character voices are incredibly distinct. Alice has a wonderfully dry delivery that reminds me of Dina from Superstore - every line lands with that perfect deadpan timing. The banter in the opening scene (lines 10-25) flows naturally without feeling forced.',
      'The callback structure is working beautifully. That payoff at line 50 got a genuine laugh because you set it up so elegantly at line 10. This kind of setup-payoff architecture shows you understand comedy structure at a fundamental level.',
    ],
    highlights: [
      {
        line: 10,
        quote: 'A simple joke',
        why: 'Perfect example of economy - not a wasted word',
      },
      {
        line: 50,
        quote: 'A callback joke',
        why: 'Excellent callback that rewards attentive viewers',
      },
    ],
  },
  opportunities: {
    paragraphs: [
      'The middle section (lines 60-100) feels a bit sparse. You\'re averaging about 1 joke per 5 minutes here, which is below the Brooklyn Nine-Nine benchmark of 2-2.5 LPM. This is fixable - look for moments where characters are just moving plot forward and see if you can add character-specific reactions.',
      'Character balance is slightly off - Alice is carrying 67% of the jokes while Bob only has 33%. This isn\'t necessarily wrong if Alice is your lead, but make sure Bob gets at least one big laugh in Act 2 to keep the ensemble feeling balanced.',
    ],
    prioritizedFixes: [
      {
        location: 'Lines 60-100',
        issue: 'Pacing soft spot in middle section',
        fix: 'Add 3-4 jokes in this section, focusing on character reactions rather than plot exposition',
        impact: 'high',
      },
      {
        location: 'Bob\'s scenes',
        issue: 'Bob is underutilized comedically',
        fix: 'Give Bob at least one complex callback or running gag in Act 2',
        impact: 'medium',
      },
    ],
  },
  coachNote:
    'You have a really solid foundation here. The jokes you do have are working - that\'s the hardest part. Now it\'s about strategic placement. Focus your next pass on that middle section (lines 60-100) and you\'ll see the script jump from good to great. Start by reading through and marking every place a character could react with their specific POV.',
  punchUpSuggestions: [
    {
      originalLine: 30,
      originalText: 'Another joke',
      suggestions: [
        { text: 'An even better joke with a twist', technique: 'Subversion' },
        { text: 'A callback to earlier setup', technique: 'Callback' },
      ],
    },
    {
      originalLine: 70,
      originalText: 'Some exposition line',
      suggestions: [
        { text: 'Exposition with character-specific spin', technique: 'Character voice' },
        { text: 'Exposition with unexpected detail', technique: 'Specificity' },
      ],
    },
  ],
};

export const mockPromptBError: PromptBOutput = {
  summary: {
    headline: 'Needs significant structural work',
    oneLineVerdict: 'The script has potential but requires major revisions to reach professional standards.',
    benchmarkShow: 'Early draft territory',
  },
  strengths: {
    paragraphs: [
      'You\'ve started with a concept, which is the most important first step. Every great script starts somewhere.',
    ],
    highlights: [],
  },
  opportunities: {
    paragraphs: [
      'The script currently has very few jokes, which makes it difficult to analyze as a comedy. Focus on adding intentional comedic moments throughout.',
      'Character development needs work - we need more distinct voices and perspectives to create comedy opportunities.',
    ],
    prioritizedFixes: [
      {
        location: 'Throughout',
        issue: 'Low joke density',
        fix: 'Add comedic moments every 2-3 pages',
        impact: 'high',
      },
      {
        location: 'Character introductions',
        issue: 'Unclear character voices',
        fix: 'Define each character\'s comedic perspective and POV',
        impact: 'high',
      },
    ],
  },
  coachNote:
    'This is a starting point. Don\'t be discouraged - all great scripts go through many drafts. Focus on adding more jokes and defining your characters\' unique voices. Come back with a revised version and we\'ll help you refine it.',
  punchUpSuggestions: [],
};

export const mockPromptBHighScore: PromptBOutput = {
  summary: {
    headline: 'Professional-grade comedy with exceptional timing',
    oneLineVerdict: 'This is spec-ready work with sophisticated joke architecture and pitch-perfect character voices.',
    benchmarkShow: 'The Good Place / Arrested Development',
  },
  strengths: {
    paragraphs: [
      'This is exceptional work. Your LPM is hitting 3.5+ laughs per minute with high-complexity jokes, which puts you in the 95th percentile. The multi-layered callbacks show a deep understanding of comedy architecture.',
      'Every character has a distinct voice and comedic perspective. The ensemble balance is perfect - everyone gets moments to shine without anyone dominating. This is incredibly difficult to pull off and you\'ve nailed it.',
      'The escalation throughout is masterful. You build from simple setups to complex payoffs, rewarding viewers who pay attention. The button at the end (line 100) is a perfect example of sophisticated comedy writing.',
    ],
    highlights: [
      {
        line: 10,
        quote: 'Complex setup',
        why: 'Multi-layered setup that pays off three times',
      },
      {
        line: 50,
        quote: 'High complexity payoff',
        why: 'Brilliant callback with misdirection',
      },
      {
        line: 100,
        quote: 'Another advanced joke',
        why: 'Perfect button that recontextualizes the entire scene',
      },
    ],
  },
  opportunities: {
    paragraphs: [
      'Honestly, this is in great shape. The only minor note is you might consider one more emotional beat in Act 2 to give the comedy even more weight, but that\'s a taste thing.',
    ],
    prioritizedFixes: [
      {
        location: 'Act 2 middle',
        issue: 'Could use one emotional grounding moment',
        fix: 'Consider adding a brief sincere beat around line 60 to raise the stakes',
        impact: 'medium',
      },
    ],
  },
  coachNote:
    'This is professional-level work. You should be proud of this. If you\'re looking to sell this, focus on making sure the emotional arc is as strong as the comedy. You\'ve got the jokes - now make sure we care about these characters. This is ready to show people.',
  punchUpSuggestions: [
    {
      originalLine: 75,
      originalText: 'Good line',
      suggestions: [
        { text: 'Even better line with a surprise', technique: 'Misdirection' },
        { text: 'Meta-commentary version', technique: 'Self-awareness' },
      ],
    },
  ],
};
