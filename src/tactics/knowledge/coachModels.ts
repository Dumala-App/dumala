import type { StrategyContext } from '../strategyContext';
import type { StrategyTag } from './strategyTags';

export type CoachModel = {
  id: string;
  coachName: string;
  modelName: string;
  era?: string;
  clubs?: string[];
  summary: string;
  tacticalThemes: string[];
  principles: StrategyTag[];
  preferredContexts: Partial<StrategyContext>;
  strategyBoosts: {
    strategyId: string;
    points: number;
    reason: string;
  }[];
  strategyPenalties?: {
    strategyId: string;
    points: number;
    reason: string;
  }[];
  references: {
    label: string;
    url: string;
    sourceType: 'official' | 'education' | 'analysis' | 'encyclopedia' | 'book' | 'video';
  }[];
  status: 'draft' | 'reviewed' | 'active';
};

/**
 * Boost and penalty magnitudes are deliberately small and bounded. A lens is a
 * tie-breaker on top of formation, context, and format scoring, not a way to
 * override it, so any single entry stays within these limits and the engine
 * caps the combined lens contribution per card (see LENS_MAX_CONTRIBUTION).
 */
export const LENS_POINT_MIN = 1;
export const LENS_POINT_MAX = 3;

export const getActiveCoachModels = (): readonly CoachModel[] => (
  COACH_MODELS.filter(model => model.status === 'active')
);

export const findCoachModelById = (id: string): CoachModel | undefined => (
  COACH_MODELS.find(model => model.id === id && model.status === 'active')
);

export const COACH_MODELS: readonly CoachModel[] = [
  {
    id: 'guardiola-barcelona-2008-2012',
    coachName: 'Pep Guardiola',
    modelName: 'Barcelona positional play',
    era: '2008-2012',
    clubs: ['Barcelona'],
    summary: 'Possession-oriented positional play using central superiority, width, counter-pressing, and false-nine movement.',
    tacticalThemes: ['positional play', 'false nine', 'central overload', 'counter-press'],
    principles: ['positional-play', 'false-nine', 'central-overload', 'counter-press', 'third-man', 'width'],
    preferredContexts: {
      matchState: 'balanced',
      riskLevel: 'balanced',
      teamCondition: 'fresh'
    },
    strategyBoosts: [
      { strategyId: 'attack-possession-game', points: 3, reason: 'Controlled possession and positional spacing fit the model.' },
      { strategyId: 'attack-third-man-combinations', points: 3, reason: 'Third-player movement breaks compact midfield lines.' },
      { strategyId: 'attack-false-nine-overload', points: 3, reason: 'False-nine movement can create central superiority.' },
      { strategyId: 'defense-counter-press', points: 3, reason: 'Immediate pressure after loss protects attacking structure.' },
      { strategyId: 'defense-high-press', points: 2, reason: 'Winning the ball high keeps play in the opponent half.' },
      { strategyId: 'defense-cover-shadow-press', points: 2, reason: 'Pressing with cover shadows closes the central route this model wants shut.' }
    ],
    strategyPenalties: [
      { strategyId: 'defense-low-block', points: 3, reason: 'Dropping deep removes the high platform this model presses from.' },
      { strategyId: 'attack-long-ball-counter', points: 3, reason: 'Bypassing midfield gives away the central control the model is built on.' }
    ],
    references: [
      { label: 'FIFA Training Centre', url: 'https://www.fifatrainingcentre.com/en/', sourceType: 'education' },
      { label: 'Pep Guardiola profile', url: 'https://en.wikipedia.org/wiki/Pep_Guardiola', sourceType: 'encyclopedia' }
    ],
    status: 'active'
  },
  {
    id: 'guardiola-manchester-city',
    coachName: 'Pep Guardiola',
    modelName: 'Manchester City control and rest-defense',
    clubs: ['Manchester City'],
    summary: 'Flexible build-up structures, inverted fullbacks or hybrid defenders, sustained territory pressure, and strong rest-defense.',
    tacticalThemes: ['inverted fullback', 'box midfield', 'press-resistant build-up', 'rest-defense'],
    principles: ['inverted-fullback', 'box-midfield', 'build-up', 'rest-defense', 'half-space', 'counter-press'],
    preferredContexts: {
      matchState: 'balanced',
      riskLevel: 'balanced'
    },
    strategyBoosts: [
      { strategyId: 'attack-inverted-fullback-build', points: 3, reason: 'Inverted fullbacks help create midfield control.' },
      { strategyId: 'attack-press-resistant-build', points: 3, reason: 'Controlled build-up can bait and escape pressure.' },
      { strategyId: 'attack-rotation-box-midfield', points: 3, reason: 'Box midfield structures create stable support angles.' },
      { strategyId: 'defense-rest-defense', points: 3, reason: 'Rest-defense protects against counters after territorial pressure.' },
      { strategyId: 'defense-counter-press', points: 3, reason: 'Winning the ball back inside five seconds sustains territory.' },
      { strategyId: 'defense-cover-shadow-press', points: 2, reason: 'Shadow-pressing the pivot keeps the opponent playing backwards.' },
      { strategyId: 'defense-half-press', points: 2, reason: 'A controlled mid-block holds shape when the press is not on.' }
    ],
    strategyPenalties: [
      { strategyId: 'attack-long-ball-counter', points: 3, reason: 'Direct bypass play abandons the controlled build-up this model needs.' },
      { strategyId: 'defense-low-block', points: 2, reason: 'A deep block concedes the territory the model is designed to hold.' }
    ],
    references: [
      { label: 'Manchester City', url: 'https://www.mancity.com/', sourceType: 'official' },
      { label: 'Pep Guardiola profile', url: 'https://en.wikipedia.org/wiki/Pep_Guardiola', sourceType: 'encyclopedia' }
    ],
    status: 'active'
  },
  {
    id: 'mourinho-pragmatic-transition',
    coachName: 'Jose Mourinho',
    modelName: 'Compact block and transition attack',
    clubs: ['Porto', 'Chelsea', 'Inter', 'Real Madrid'],
    summary: 'Opponent-specific plans built around compact defending, central protection, fast counters, and game-state control.',
    tacticalThemes: ['compact block', 'transition attack', 'central protection', 'game management'],
    principles: ['compact-block', 'transition-attack', 'counter', 'screening', 'discipline'],
    preferredContexts: {
      matchState: 'protect-lead',
      riskLevel: 'safe'
    },
    strategyBoosts: [
      { strategyId: 'defense-low-block', points: 3, reason: 'Compact protection can reduce central access.' },
      { strategyId: 'defense-pressing-from-front-two', points: 2, reason: 'Front-two screening can block the opponent pivot.' },
      { strategyId: 'attack-quick-counter', points: 3, reason: 'Fast transition attacks exploit opponents after regains.' },
      { strategyId: 'attack-long-ball-counter', points: 2, reason: 'Direct counters can release pressure quickly.' },
      { strategyId: 'defense-compact-4-5-1', points: 3, reason: 'Two banks with a lone outlet is the model\'s default protective shape.' },
      { strategyId: 'defense-zonal-block', points: 2, reason: 'Zonal discipline keeps the block intact against rotation.' },
      { strategyId: 'defense-back-five-shift', points: 2, reason: 'An extra defender secures the box when protecting a result.' }
    ],
    strategyPenalties: [
      { strategyId: 'attack-possession-game', points: 3, reason: 'Possession without a direct route is not how this model creates chances.' },
      { strategyId: 'defense-high-press', points: 3, reason: 'A sustained high press opens the space behind that this model protects.' },
      { strategyId: 'attack-inverted-fullback-build', points: 2, reason: 'Inverting fullbacks weakens the counter-cover this model keeps wide.' }
    ],
    references: [
      { label: 'Jose Mourinho profile', url: 'https://en.wikipedia.org/wiki/Jos%C3%A9_Mourinho', sourceType: 'encyclopedia' }
    ],
    status: 'active'
  },
  {
    id: 'ancelotti-flexible-player-fit',
    coachName: 'Carlo Ancelotti',
    modelName: 'Flexible player-first structure',
    clubs: ['Milan', 'Real Madrid'],
    summary: 'Flexible role design that adapts the structure around available player qualities, playmakers, and elite attackers.',
    tacticalThemes: ['role adaptation', 'diamond midfield', 'deep playmaker', 'balanced control'],
    principles: ['player-fit', 'central-overload', 'third-man', 'positional-play', 'direct'],
    preferredContexts: {
      matchState: 'balanced',
      riskLevel: 'balanced'
    },
    strategyBoosts: [
      { strategyId: 'attack-third-man-combinations', points: 2, reason: 'Playmaker-led combinations can progress through midfield.' },
      { strategyId: 'attack-rotation-box-midfield', points: 2, reason: 'Central support structures suit playmaker teams.' },
      { strategyId: 'attack-quick-counter', points: 2, reason: 'Attacker freedom can turn regains into direct chances.' },
      { strategyId: 'defense-zonal-block', points: 3, reason: 'A balanced zonal block asks less of attackers who are kept fresh to attack.' },
      { strategyId: 'defense-half-press', points: 2, reason: 'Mid-block pressing balances protection with a platform to build from.' },
      { strategyId: 'defense-rest-defense', points: 2, reason: 'Leaving cover behind the ball lets creative players commit forward safely.' }
    ],
    strategyPenalties: [
      { strategyId: 'defense-man-to-man', points: 2, reason: 'Man-marking schemes remove the role flexibility this model depends on.' }
    ],
    references: [
      { label: 'Carlo Ancelotti profile', url: 'https://en.wikipedia.org/wiki/Carlo_Ancelotti', sourceType: 'encyclopedia' }
    ],
    status: 'active'
  },
  {
    id: 'wenger-arsenal-attacking-fluency',
    coachName: 'Arsene Wenger',
    modelName: 'Technical attacking fluency',
    clubs: ['Arsenal'],
    summary: 'Technical development, attacking expression, quick combinations, and fluid movement through wide and central spaces.',
    tacticalThemes: ['combination play', 'technical expression', 'wide-central rotation', 'attacking fluency'],
    principles: ['combinations', 'third-man', 'width', 'transition', 'positional-play'],
    preferredContexts: {
      matchState: 'balanced',
      riskLevel: 'balanced'
    },
    strategyBoosts: [
      { strategyId: 'attack-third-man-combinations', points: 3, reason: 'Quick combinations support attacking fluency.' },
      { strategyId: 'attack-blindside-runners', points: 2, reason: 'Blind-side movement rewards creative attackers.' },
      { strategyId: 'attack-overload-to-isolate', points: 2, reason: 'Wide isolation can free expressive attacking players.' },
      { strategyId: 'defense-half-press', points: 3, reason: 'A high-ish mid-block wins the ball early enough to attack immediately.' },
      { strategyId: 'defense-counter-press', points: 2, reason: 'Pressing straight after loss keeps the attack alive rather than resetting.' },
      { strategyId: 'defense-zonal-block', points: 2, reason: 'Zonal organisation keeps the shape intact without man-oriented chasing.' }
    ],
    strategyPenalties: [
      { strategyId: 'defense-low-block', points: 3, reason: 'Sitting deep surrenders the attacking initiative this model is built around.' },
      { strategyId: 'attack-long-ball-counter', points: 2, reason: 'Direct play cuts out the combination game the model wants to produce.' }
    ],
    references: [
      { label: 'Arsene Wenger profile', url: 'https://en.wikipedia.org/wiki/Ars%C3%A8ne_Wenger', sourceType: 'encyclopedia' }
    ],
    status: 'active'
  },
  {
    id: 'ferguson-manchester-united-tempo',
    coachName: 'Sir Alex Ferguson',
    modelName: 'Tempo, wing play, and late pressure',
    clubs: ['Manchester United'],
    summary: 'Role clarity, wide attacks, tempo changes, set-piece pressure, squad freshness, and late-game attacking momentum.',
    tacticalThemes: ['wing play', 'late pressure', 'set-piece pressure', 'tempo shift'],
    principles: ['wing-play', 'crossing', 'set-piece', 'transition-attack', 'high-press'],
    preferredContexts: {
      matchState: 'chasing-goal',
      matchPhase: 'last-15',
      riskLevel: 'aggressive'
    },
    strategyBoosts: [
      { strategyId: 'attack-out-wide', points: 3, reason: 'Wide attacks can create pressure and crossing volume.' },
      { strategyId: 'attack-set-piece-pressure', points: 3, reason: 'Late pressure often produces set-piece and second-ball chances.' },
      { strategyId: 'defense-counter-press', points: 3, reason: 'Counter-pressing sustains pressure when chasing.' },
      { strategyId: 'defense-high-press', points: 2, reason: 'Pushing the line up turns late pressure into repeated attacks.' },
      { strategyId: 'defense-wide-trap', points: 2, reason: 'Trapping wide wins the ball in the areas this model attacks from.' }
    ],
    strategyPenalties: [
      { strategyId: 'defense-low-block', points: 3, reason: 'Dropping deep kills the tempo and late pressure this model wins with.' },
      { strategyId: 'attack-possession-game', points: 2, reason: 'Slow circulation blunts the tempo changes the model relies on.' }
    ],
    references: [
      { label: 'Alex Ferguson profile', url: 'https://en.wikipedia.org/wiki/Alex_Ferguson', sourceType: 'encyclopedia' }
    ],
    status: 'active'
  }
];
