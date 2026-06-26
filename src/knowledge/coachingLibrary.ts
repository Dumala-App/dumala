export type CoachingLibraryCategory =
  | 'formation'
  | 'attacking'
  | 'defending'
  | 'principle'
  | 'case-study';

export type CoachingLibraryVisual = {
  kind: 'illustration' | 'photo-diagram';
  diagramId: string;
  brief: string;
};

export type CoachingLibraryItem = {
  id: string;
  category: CoachingLibraryCategory;
  title: string;
  summary: string;
  visual: CoachingLibraryVisual;
  learningPoints: readonly string[];
  coachingNotes?: readonly string[];
  tags: readonly string[];
};

export const COACHING_LIBRARY_CATEGORY_LABELS: Record<CoachingLibraryCategory, string> = {
  formation: 'Formations',
  attacking: 'Attack',
  defending: 'Defense',
  principle: 'Principles',
  'case-study': 'Tactical Models'
};

export const COACHING_LIBRARY_ITEMS: readonly CoachingLibraryItem[] = [
  {
    id: 'formation-4-3-3',
    category: 'formation',
    title: '4-3-3',
    summary: 'Balanced attacking shape with strong wing occupation, a clear pressing front, and natural triangles around the ball.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-4-3-3',
      brief: '4-3-3 pitch diagram with wide forwards, single striker, three midfield lanes, and fullback overlap arrows.'
    },
    learningPoints: [
      'Best for teams with fast wide players',
      'Needs midfield discipline when both fullbacks advance',
      'Useful for high press or controlled possession'
    ],
    coachingNotes: [
      'Use the winger, fullback, and number 8 as the main wide triangle.',
      'Keep the holding midfielder connected to the center backs during attacks.'
    ],
    tags: ['width', 'pressing', 'triangles']
  },
  {
    id: 'formation-4-2-3-1',
    category: 'formation',
    title: '4-2-3-1',
    summary: 'Stable modern shape that protects central areas while keeping a creator between midfield and attack.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-4-2-3-1',
      brief: '4-2-3-1 diagram showing double pivot cover, number 10 pocket, and winger-to-fullback support lines.'
    },
    learningPoints: [
      'Strong against counter attacks through the center',
      'Works well with one playmaker behind the striker',
      'Can become passive if the striker is isolated'
    ],
    coachingNotes: [
      'Let one pivot step forward while the other guards the central counter lane.',
      'Give the number 10 clear reference points for when to receive and when to press.'
    ],
    tags: ['double pivot', 'number 10', 'central cover']
  },
  {
    id: 'formation-3-5-2',
    category: 'formation',
    title: '3-5-2',
    summary: 'Central overload system using wingbacks for width and two forwards to pin center backs.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-3-5-2',
      brief: '3-5-2 wingback map with back-three cover, two strikers, and midfield overload zones.'
    },
    learningPoints: [
      'Excellent for teams with athletic wingbacks',
      'Creates numerical strength in midfield',
      'Wide defensive transitions must be rehearsed'
    ],
    coachingNotes: [
      'Train the outside center back to defend wide spaces when the wingback is high.',
      'Use split striker movement to open passing lanes into midfield runners.'
    ],
    tags: ['wingbacks', 'central overload', 'two strikers']
  },
  {
    id: 'formation-4-4-2',
    category: 'formation',
    title: '4-4-2',
    summary: 'Simple, teachable structure for compact defending, direct attacks, and paired striker movement.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-4-4-2',
      brief: '4-4-2 compact block diagram with two banks of four, striker press cues, and crossing channels.'
    },
    learningPoints: [
      'Easy for developing teams to understand',
      'Good for mid-block defending',
      'Can be outnumbered against three-player midfields'
    ],
    coachingNotes: [
      'Keep horizontal distances short between fullback, wide midfielder, center midfielder, and striker.',
      'Use the front two to screen passes into the opponent pivot.'
    ],
    tags: ['compact block', 'direct play', 'front two']
  },
  {
    id: 'formation-3-4-3',
    category: 'formation',
    title: '3-4-3',
    summary: 'Aggressive back-three shape that keeps three forwards high while wingbacks provide the main width in possession.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-3-4-3',
      brief: '3-4-3 diagram with front-three press, two central midfielders, wingback width, and back-three cover.'
    },
    learningPoints: [
      'Useful for pressing with three players across the opponent back line',
      'Wingbacks must balance attacking width with recovery runs',
      'Central midfield can be outnumbered if distances stretch'
    ],
    coachingNotes: [
      'Train the nearest center back to defend wide channels behind the wingback.',
      'Use the front three to screen central passes before jumping to press.'
    ],
    tags: ['front three', 'wingbacks', 'pressing']
  },
  {
    id: 'formation-4-1-4-1',
    category: 'formation',
    title: '4-1-4-1',
    summary: 'Compact midfield-heavy structure with a holding midfielder screening the defense and two lines protecting central space.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-4-1-4-1',
      brief: '4-1-4-1 diagram showing a single pivot, four-player midfield line, lone striker, and wide support lanes.'
    },
    learningPoints: [
      'Strong for protecting central passing lanes',
      'Works well for controlled mid-block defending',
      'The lone striker needs support from midfield runners'
    ],
    coachingNotes: [
      'Give the holding midfielder clear rules for when to step out and when to screen.',
      'Ask wide midfielders to recover goal-side before pressing forward.'
    ],
    tags: ['single pivot', 'mid-block', 'screening']
  },
  {
    id: 'formation-5-3-2',
    category: 'formation',
    title: '5-3-2',
    summary: 'Defensively secure back-five system that protects the box and keeps two forwards ready for counter attacks.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-5-3-2',
      brief: '5-3-2 diagram with wingback cover, three center backs, compact midfield three, and two-striker counter threat.'
    },
    learningPoints: [
      'Excellent for defending leads or facing strong wide teams',
      'Two forwards can occupy center backs during counters',
      'Requires wingbacks who can travel long distances repeatedly'
    ],
    coachingNotes: [
      'Keep the midfield three narrow enough to protect the half-spaces.',
      'Use early forward passes into the front two after regains.'
    ],
    tags: ['back five', 'counter attack', 'box protection']
  },
  {
    id: 'formation-4-3-1-2',
    category: 'formation',
    title: '4-3-1-2',
    summary: 'Narrow diamond shape built around central combinations, a dedicated playmaker, and two forwards attacking split channels.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-4-3-1-2',
      brief: '4-3-1-2 diamond diagram with three central midfielders, number 10 pocket, and two split strikers.'
    },
    learningPoints: [
      'Creates central overloads against two-player midfields',
      'Good for teams with a true number 10',
      'Needs fullbacks to provide most of the attacking width'
    ],
    coachingNotes: [
      'Train the outside central midfielders to cover fullback advances.',
      'Use the number 10 to connect midfield possession into striker runs.'
    ],
    tags: ['diamond', 'number 10', 'central overload']
  },
  {
    id: 'formation-4-4-1-1',
    category: 'formation',
    title: '4-4-1-1',
    summary: 'Balanced defensive shape with a second striker or attacking midfielder linking the front line to the midfield block.',
    visual: {
      kind: 'illustration',
      diagramId: 'formation-4-4-1-1',
      brief: '4-4-1-1 diagram showing two banks of four, a second striker between the lines, and one central forward.'
    },
    learningPoints: [
      'Keeps the defensive clarity of 4-4-2 with more connection between lines',
      'Useful when one forward is better as a creator than a box striker',
      'Can press like a 4-4-2 or drop into a 4-5-1'
    ],
    coachingNotes: [
      'Give the second striker clear marking responsibility against the opponent pivot.',
      'Use wide midfielders as the first outlet when the team wins the ball.'
    ],
    tags: ['second striker', 'two banks', 'link player']
  },
  {
    id: 'attack-types',
    category: 'attacking',
    title: 'Attack Types',
    summary: 'A comparison of common ways teams create chances: circulation, transition, wide isolation, and direct target play.',
    visual: {
      kind: 'illustration',
      diagramId: 'attack-types',
      brief: 'Attacking transition storyboard comparing possession build-up, quick counter, wide overload, and direct target play.'
    },
    learningPoints: [
      'Possession: circulate until a gap opens',
      'Quick counter: attack before the opponent resets',
      'Out wide: isolate a winger or overlapping fullback',
      'Direct play: find a striker early and attack second balls'
    ],
    coachingNotes: [
      'Choose the attack type based on player strengths and opponent spacing.',
      'Train the first forward pass after regain as a repeatable team habit.'
    ],
    tags: ['build-up', 'counter', 'wide overload', 'direct play']
  },
  {
    id: 'defense-types',
    category: 'defending',
    title: 'Defense Types',
    summary: 'A reference for deciding where and how the team should apply pressure without losing compactness.',
    visual: {
      kind: 'illustration',
      diagramId: 'defense-types',
      brief: 'Defensive block comparison showing high press, half press, man-oriented marking, and low block zones.'
    },
    learningPoints: [
      'High press: win the ball near goal but protect space behind',
      'Half press: guide play into traps near midfield',
      'Man to man: deny easy options but requires stamina',
      'Low block: protect the box and counter into open space'
    ],
    coachingNotes: [
      'Define the first pressing trigger before choosing the block height.',
      'Keep the back line and midfield line connected when the first press is beaten.'
    ],
    tags: ['high press', 'mid-block', 'low block', 'marking']
  },
  {
    id: 'tactical-principles',
    category: 'principle',
    title: 'Tactical Principles',
    summary: 'Core ideas coaches can reuse across formations, including spacing, protection, pressing, and off-ball movement.',
    visual: {
      kind: 'illustration',
      diagramId: 'tactical-principles',
      brief: 'Coaching whiteboard with compactness, width, depth, rest-defense, pressing trigger, and third-man run icons.'
    },
    learningPoints: [
      'Create width to stretch the opponent',
      'Keep rest-defense behind attacks',
      'Use pressing triggers after poor touches or backward passes',
      'Use third-man runs to break tight marking'
    ],
    coachingNotes: [
      'Use principles as the bridge between drills and match instructions.',
      'Review one principle at a time so players can connect it to game moments.'
    ],
    tags: ['width', 'rest-defense', 'pressing trigger', 'third-man run']
  },
  {
    id: 'spain-barcelona-positional-play',
    category: 'case-study',
    title: 'Spain 2008-2012 / Barcelona positional play',
    summary: 'Patient circulation, positional spacing, and short passing to control tempo and create central superiority.',
    visual: {
      kind: 'photo-diagram',
      diagramId: 'spain-barcelona-positional-play',
      brief: 'Rondo-style possession map with midfield triangles and false-nine central overload.'
    },
    learningPoints: [
      'Maintain clean passing angles around the ball',
      'Use positional spacing to stretch compact defensive blocks',
      'Control tempo before accelerating into the final action'
    ],
    tags: ['positional play', 'false nine', 'tempo']
  },
  {
    id: 'germany-2014-transition-pressure',
    category: 'case-study',
    title: 'Germany 2014 transition pressure',
    summary: 'Aggressive counter-pressing, quick vertical attacks, and coordinated midfield occupation after turnovers.',
    visual: {
      kind: 'photo-diagram',
      diagramId: 'germany-2014-transition-pressure',
      brief: 'Counter-pressing map showing immediate pressure after losing possession and vertical release runs.'
    },
    learningPoints: [
      'Surround the ball quickly after possession loss',
      'Use vertical runs once the counter-press wins the ball',
      'Keep midfield distances short enough to prevent easy exits'
    ],
    tags: ['counter-press', 'verticality', 'transition']
  },
  {
    id: 'italy-classic-defensive-block',
    category: 'case-study',
    title: 'Italy classic defensive block',
    summary: 'Disciplined defensive spacing, patient protection of central lanes, and selective counter attacks.',
    visual: {
      kind: 'photo-diagram',
      diagramId: 'italy-classic-defensive-block',
      brief: 'Compact backline and midfield screen with pressing trap arrows near the touchline.'
    },
    learningPoints: [
      'Protect central spaces before chasing wide passes',
      'Move as a unit when the ball travels across the pitch',
      'Counter only when the first forward pass is clean'
    ],
    tags: ['compactness', 'central protection', 'counter attack']
  },
  {
    id: 'liverpool-gegenpressing-era',
    category: 'case-study',
    title: 'Liverpool gegenpressing era',
    summary: 'Fast pressure after possession loss, explosive wide service, and high-energy attacking transitions.',
    visual: {
      kind: 'photo-diagram',
      diagramId: 'liverpool-gegenpressing-era',
      brief: 'Front-three press shape, fullback high lanes, and ball-side overload after turnover.'
    },
    learningPoints: [
      'Press immediately with the closest players after a turnover',
      'Use fullbacks as major chance creators from advanced zones',
      'Attack quickly while the opponent is disorganized'
    ],
    tags: ['gegenpress', 'fullbacks', 'front three']
  }
];
