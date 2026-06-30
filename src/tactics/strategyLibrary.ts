import type { StrategyContextFit } from './strategyContext';
import type { StrategyTag } from './knowledge/strategyTags';

export type StrategyPhase = 'attack' | 'defense';

export type StrategySource = {
  label: string;
  url?: string;
};

export type TacticalStrategyCard = {
  id: string;
  phase: StrategyPhase;
  title: string;
  styleValue: string;
  intent: string;
  bestFor: string;
  details: readonly {
    label: string;
    value: string;
  }[];
  cues: readonly string[];
  watchout: string;
  formationFit: readonly StrategyTag[];
  opponentCounters: readonly StrategyTag[];
  tags: readonly StrategyTag[];
  contextFit?: StrategyContextFit;
  sourceModelIds?: readonly string[];
  status?: 'draft' | 'reviewed' | 'active';
  source?: StrategySource;
};

export const ATTACK_STRATEGY_CARDS: readonly TacticalStrategyCard[] = [
  {
    id: 'attack-quick-counter',
    phase: 'attack',
    title: 'Quick Counter',
    styleValue: 'Quick Counter',
    intent: 'Win the ball, play forward early, and attack before the opponent resets.',
    bestFor: 'Fast forwards, direct passers, and matches where space appears behind the back line.',
    details: [
      { label: 'Entry', value: 'First secure pass breaks forward' },
      { label: 'Target', value: 'Channels outside center backs' },
      { label: 'Support', value: 'Nearest 8 joins second wave' },
      { label: 'Finish', value: 'Early shot, cutback, or far-post run' }
    ],
    cues: ['First pass forward', 'Wide runner goes early', 'CF pins center backs'],
    watchout: 'Can isolate attackers if midfield support is late.',
    formationFit: ['front-three', 'two-striker', 'direct-outlet'],
    opponentCounters: ['high-line', 'wingback-space', 'slow-rest-defense'],
    tags: ['transition', 'verticality', 'pace'],
    contextFit: {
      matchState: ['protect-lead'],
      matchPhase: ['last-15'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['high-press', 'strong-midfield'],
      riskLevel: ['safe', 'balanced']
    },
    sourceModelIds: ['mourinho-pragmatic-transition', 'ferguson-manchester-united-tempo'],
    status: 'active'
  },
  {
    id: 'attack-possession-game',
    phase: 'attack',
    title: 'Possession Game',
    styleValue: 'Possession Game',
    intent: 'Control tempo with short passing, patient circulation, and overloads around the ball.',
    bestFor: 'Technically secure midfielders and games where you want to slow transitions.',
    details: [
      { label: 'Entry', value: 'Build through pivot triangles' },
      { label: 'Target', value: 'Free player between lines' },
      { label: 'Support', value: 'Fullbacks hold width for switches' },
      { label: 'Finish', value: 'Third-man run or low cutback' }
    ],
    cues: ['Create triangles', 'Switch after pressure', 'Fullbacks offer width'],
    watchout: 'Needs quick counter-pressing after turnovers.',
    formationFit: ['midfield-overload', 'single-pivot', 'double-pivot'],
    opponentCounters: ['low-block', 'narrow-midfield', 'front-two-screen'],
    tags: ['tempo', 'triangles', 'positional-play'],
    contextFit: {
      matchState: ['balanced'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['low-block', 'balanced'],
      riskLevel: ['balanced']
    },
    sourceModelIds: ['guardiola-barcelona-2008-2012', 'guardiola-manchester-city'],
    status: 'active'
  },
  {
    id: 'attack-third-man-combinations',
    phase: 'attack',
    title: 'Third-Man Combinations',
    styleValue: 'Third-Man Combinations',
    intent: 'Use bounce passes, lay-offs, and blind-side runners to break compact midfield lines.',
    bestFor: 'Teams with a reliable pivot, active attacking midfielders, and forwards who can set the ball under pressure.',
    details: [
      { label: 'Entry', value: 'Pivot finds a checking forward or 10' },
      { label: 'Target', value: 'Runner beyond the second midfield line' },
      { label: 'Support', value: 'Near 8 offers the bounce option' },
      { label: 'Finish', value: 'Slip pass into box or early cutback' }
    ],
    cues: ['Bounce pass sets runner', 'Third player arrives blind-side', 'Play around pressure'],
    watchout: 'Requires close distances; spacing too wide makes the pattern predictable.',
    formationFit: ['midfield-overload', 'single-pivot', 'double-pivot'],
    opponentCounters: ['single-pivot', 'central-overload', 'narrow-diamond'],
    tags: ['combinations', 'third-man', 'timing'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['high-press', 'strong-midfield'],
      riskLevel: ['balanced', 'aggressive']
    },
    sourceModelIds: ['guardiola-barcelona-2008-2012', 'ancelotti-flexible-player-fit', 'wenger-arsenal-attacking-fluency'],
    status: 'active'
  },
  {
    id: 'attack-long-ball-counter',
    phase: 'attack',
    title: 'Long Ball Counter',
    styleValue: 'Long Ball Counter',
    intent: 'Bypass pressure quickly and compete for second balls in advanced areas.',
    bestFor: 'Strong target players, quick wide support, or poor build-up conditions.',
    details: [
      { label: 'Entry', value: 'Direct pass into target or channel' },
      { label: 'Target', value: 'Space behind advanced fullbacks' },
      { label: 'Support', value: 'Midfield squeezes for second balls' },
      { label: 'Finish', value: 'Fast cross before the block resets' }
    ],
    cues: ['Target sets', 'Midfield squeezes up', 'Second runner attacks space'],
    watchout: 'Possession can become rushed if the second-ball line is too deep.',
    formationFit: ['two-striker', 'direct-outlet', 'compact-block'],
    opponentCounters: ['high-press', 'front-three-press', 'midfield-congestion'],
    tags: ['direct', 'second-ball', 'pressure-release'],
    contextFit: {
      matchState: ['protect-lead'],
      matchPhase: ['last-15'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['high-press', 'direct-play', 'strong-midfield'],
      riskLevel: ['safe']
    },
    sourceModelIds: ['mourinho-pragmatic-transition'],
    status: 'active'
  },
  {
    id: 'attack-inverted-fullback-build',
    phase: 'attack',
    title: 'Inverted Fullback Build',
    styleValue: 'Inverted Fullback Build',
    intent: 'Step one fullback inside to create a safer rest-defense base and unlock central passing lanes.',
    bestFor: 'Teams that want stable possession while still releasing one wide player high.',
    details: [
      { label: 'Entry', value: 'Fullback joins pivot during build-up' },
      { label: 'Target', value: 'Free 8 between midfield and back line' },
      { label: 'Support', value: 'Far fullback balances rest defense' },
      { label: 'Finish', value: 'Diagonal into winger or late 8 run' }
    ],
    cues: ['One fullback inverts', 'Pivot rotates away', 'Winger stays high'],
    watchout: 'The winger must hold width or the attack becomes too central.',
    formationFit: ['double-pivot', 'single-pivot', 'compact-block'],
    opponentCounters: ['high-press', 'front-three-press', 'midfield-congestion'],
    tags: ['build-up', 'rest-defense', 'inverted-fullback'],
    contextFit: {
      matchState: ['balanced'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['high-press', 'balanced'],
      riskLevel: ['balanced'],
      avoidWhen: [{ teamCondition: 'tired' }, { riskLevel: 'safe', matchState: 'protect-lead' }]
    },
    sourceModelIds: ['guardiola-manchester-city'],
    status: 'active'
  },
  {
    id: 'attack-out-wide',
    phase: 'attack',
    title: 'Out Wide',
    styleValue: 'Out Wide',
    intent: 'Stretch the field, isolate wide players, and create crossing or cutback chances.',
    bestFor: 'Teams with strong wingers, overlapping fullbacks, and aerial or late-box threats.',
    details: [
      { label: 'Entry', value: 'Switch after drawing central pressure' },
      { label: 'Target', value: 'Behind wingbacks or fullback shoulder' },
      { label: 'Support', value: 'Overlap plus far-post runner' },
      { label: 'Finish', value: 'Cutback first, cross if box is loaded' }
    ],
    cues: ['Hold width', 'Overlap on trigger', 'Far post runner arrives'],
    watchout: 'Central midfield must protect against counters after wide attacks.',
    formationFit: ['front-three', 'wing-width', 'fullback-overlap'],
    opponentCounters: ['wingback-space', 'central-overload', 'narrow-diamond', 'back-three', 'back-five'],
    tags: ['width', 'wing-play', 'crossing'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      matchPhase: ['last-15'],
      opponentBehavior: ['wide-overload', 'strong-midfield', 'low-block'],
      riskLevel: ['balanced', 'aggressive']
    },
    sourceModelIds: ['ferguson-manchester-united-tempo', 'wenger-arsenal-attacking-fluency'],
    status: 'active'
  },
  {
    id: 'attack-overload-to-isolate',
    phase: 'attack',
    title: 'Overload to Isolate',
    styleValue: 'Overload to Isolate',
    intent: 'Draw defenders to one side, then switch quickly to a free wide attacker in space.',
    bestFor: 'Teams with a strong 1v1 winger or fullback and midfielders who can switch play accurately.',
    details: [
      { label: 'Entry', value: 'Combine on strong side to attract pressure' },
      { label: 'Target', value: 'Far winger isolated against fullback' },
      { label: 'Support', value: 'Weak-side 8 arrives for cutback' },
      { label: 'Finish', value: 'Attack 1v1 before cover shifts across' }
    ],
    cues: ['Load one side', 'Scan far winger', 'Switch before pressure locks'],
    watchout: 'Slow switches allow the opponent block to slide across and reset.',
    formationFit: ['front-three', 'fullback-overlap', 'wing-width'],
    opponentCounters: ['narrow-midfield', 'wingback-space', 'central-overload'],
    tags: ['wide-overload', 'isolation', 'tempo'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['strong-midfield', 'wide-overload'],
      riskLevel: ['balanced', 'aggressive']
    },
    sourceModelIds: ['wenger-arsenal-attacking-fluency'],
    status: 'active'
  },
  {
    id: 'attack-cutback-patterns',
    phase: 'attack',
    title: 'Cutback Patterns',
    styleValue: 'Cutback Patterns',
    intent: 'Attack the byline and deliver low passes to late runners instead of forcing crowded crosses.',
    bestFor: 'Opponents defending with many bodies in the box or center backs who dominate aerial duels.',
    details: [
      { label: 'Entry', value: 'Wide runner attacks outside shoulder' },
      { label: 'Target', value: 'Penalty spot and edge-of-box lanes' },
      { label: 'Support', value: 'Two staggered late arrivals' },
      { label: 'Finish', value: 'Low cutback before the back line turns' }
    ],
    cues: ['Reach the byline', 'Delay runner arrives', 'Keep crosses on the floor'],
    watchout: 'Needs counter protection because both fullback and winger may be high.',
    formationFit: ['front-three', 'fullback-overlap', 'midfield-overload'],
    opponentCounters: ['back-five', 'low-block', 'wide-overload'],
    tags: ['cutbacks', 'box-entry', 'chance-quality'],
    contextFit: {
      matchState: ['chasing-goal'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['low-block', 'wide-overload'],
      riskLevel: ['balanced', 'aggressive']
    },
    sourceModelIds: ['guardiola-barcelona-2008-2012', 'guardiola-manchester-city'],
    status: 'active'
  },
  {
    id: 'attack-blindside-runners',
    phase: 'attack',
    title: 'Blind-Side Runners',
    styleValue: 'Blind-Side Runners',
    intent: 'Move defenders with circulation, then attack their blind side with late runs beyond the last line.',
    bestFor: 'Teams with smart wide forwards, attacking midfielders, or fullbacks who can time runs behind compact blocks.',
    details: [
      { label: 'Entry', value: 'Circulate until the defender faces the ball' },
      { label: 'Target', value: 'Blind-side lane behind fullback or center back' },
      { label: 'Support', value: 'Near 8 holds the cutback lane' },
      { label: 'Finish', value: 'Low pass across goal or pulled cutback' }
    ],
    cues: ['Wait for defender to ball-watch', 'Runner starts outside vision', 'Pass behind the shoulder'],
    watchout: 'Runs become offside or wasted if the passer is not under control.',
    formationFit: ['front-three', 'fullback-overlap', 'wing-width'],
    opponentCounters: ['low-block', 'back-five', 'narrow-midfield'],
    tags: ['blind-side', 'timing', 'box-entry'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['low-block'],
      riskLevel: ['balanced', 'aggressive']
    },
    sourceModelIds: ['wenger-arsenal-attacking-fluency'],
    status: 'active'
  },
  {
    id: 'attack-false-nine-overload',
    phase: 'attack',
    title: 'False Nine Overload',
    styleValue: 'False Nine Overload',
    intent: 'Drop the striker into midfield to create a free player, then release wide forwards into the vacated channel.',
    bestFor: 'Technical forwards, wide runners, and teams that can combine centrally before accelerating behind.',
    details: [
      { label: 'Entry', value: 'Striker checks into midfield pocket' },
      { label: 'Target', value: 'Wide forward running inside the fullback' },
      { label: 'Support', value: '10 or 8 bounces the third-man pass' },
      { label: 'Finish', value: 'Slip pass behind or wall pass into box' }
    ],
    cues: ['Nine drops, winger runs', 'Bounce before release', 'Midfield squeezes underneath'],
    watchout: 'Needs depth from wide players or the striker simply empties the box.',
    formationFit: ['front-three', 'midfield-overload', 'single-pivot'],
    opponentCounters: ['central-overload', 'single-pivot', 'front-two-screen'],
    tags: ['false-nine', 'third-man', 'central-overload'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      teamCondition: ['fresh'],
      opponentBehavior: ['strong-midfield', 'balanced'],
      riskLevel: ['aggressive'],
      avoidWhen: [{ teamCondition: 'tired' }, { riskLevel: 'safe' }]
    },
    sourceModelIds: ['guardiola-barcelona-2008-2012'],
    status: 'active'
  },
  {
    id: 'attack-half-space-overload',
    phase: 'attack',
    title: 'Half-Space Overload',
    styleValue: 'Half-Space Overload',
    intent: 'Stack a winger, 8, and fullback around the half-space to pull apart the fullback-center back gap.',
    bestFor: 'Teams with quick combination players and a fullback who can underlap or overlap on command.',
    details: [
      { label: 'Entry', value: 'Winger receives between fullback and midfielder' },
      { label: 'Target', value: 'Fullback-center back gap' },
      { label: 'Support', value: '8 arrives as wall pass or cutback option' },
      { label: 'Finish', value: 'Underlap shot, square pass, or slipped cross' }
    ],
    cues: ['Pin wide, combine inside', 'Underlap on inside touch', 'Arrive in staggered lanes'],
    watchout: 'If both fullback and 8 go forward, the pivot must protect the counter lane.',
    formationFit: ['front-three', 'fullback-overlap', 'midfield-overload'],
    opponentCounters: ['narrow-midfield', 'back-five', 'wide-overload'],
    tags: ['half-space', 'overload', 'cutbacks'],
    contextFit: {
      matchState: ['chasing-goal'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['low-block', 'wide-overload'],
      riskLevel: ['aggressive'],
      avoidWhen: [{ teamCondition: 'tired' }]
    },
    sourceModelIds: ['guardiola-manchester-city'],
    status: 'active'
  },
  {
    id: 'attack-press-resistant-build',
    phase: 'attack',
    title: 'Press-Resistant Build',
    styleValue: 'Press-Resistant Build',
    intent: 'Invite pressure, create a spare support angle, and escape through the pivot or far-side fullback.',
    bestFor: 'Teams with calm defenders, a reliable pivot, and midfielders who scan before receiving.',
    details: [
      { label: 'Entry', value: 'Center back draws first presser' },
      { label: 'Target', value: 'Pivot or far fullback outside pressure' },
      { label: 'Support', value: 'Nearest 8 gives a bounce option' },
      { label: 'Finish', value: 'Progress into free side after press breaks' }
    ],
    cues: ['Draw then release', 'Open body to far side', 'Bounce out of pressure'],
    watchout: 'Avoid square passes across goal when the first support angle is blocked.',
    formationFit: ['double-pivot', 'single-pivot', 'midfield-overload'],
    opponentCounters: ['high-press', 'front-three-press', 'front-two-screen'],
    tags: ['build-up', 'press-resistance', 'support-angles'],
    contextFit: {
      matchState: ['balanced'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['high-press'],
      riskLevel: ['balanced', 'safe']
    },
    sourceModelIds: ['guardiola-manchester-city'],
    status: 'active'
  },
  {
    id: 'attack-set-piece-pressure',
    phase: 'attack',
    title: 'Set-Piece Pressure',
    styleValue: 'Set-Piece Pressure',
    intent: 'Use corners, wide free kicks, and second balls as planned attacking phases instead of isolated deliveries.',
    bestFor: 'Teams with strong aerial players, disciplined blockers, and midfielders who can recycle clearances.',
    details: [
      { label: 'Entry', value: 'Delivery to planned run zone' },
      { label: 'Target', value: 'Near post, penalty spot, or far-post overload' },
      { label: 'Support', value: 'Edge players collect clearances' },
      { label: 'Finish', value: 'First contact or recycled cross' }
    ],
    cues: ['Attack assigned zone', 'Edge player reads clearance', 'Two stay for rest-defense'],
    watchout: 'Poor counter cover turns attacking set pieces into open-field danger.',
    formationFit: ['direct-outlet', 'two-striker', 'compact-block'],
    opponentCounters: ['low-block', 'back-five', 'pace-behind'],
    tags: ['set-piece', 'second-ball', 'rest-defense'],
    contextFit: {
      matchState: ['chasing-goal', 'protect-lead'],
      matchPhase: ['last-15'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['low-block', 'direct-play'],
      riskLevel: ['safe', 'aggressive']
    },
    sourceModelIds: ['ferguson-manchester-united-tempo', 'guardiola-manchester-city'],
    status: 'active'
  },
  {
    id: 'attack-rotation-box-midfield',
    phase: 'attack',
    title: 'Box Midfield Rotation',
    styleValue: 'Box Midfield Rotation',
    intent: 'Create a four-player central box so the ball carrier always has two short options and one forward escape.',
    bestFor: 'Double-pivot teams or narrow shapes that want secure central progression before switching wide.',
    details: [
      { label: 'Entry', value: 'Double pivot staggers around the first line' },
      { label: 'Target', value: 'Free 10 or advanced 8 between lines' },
      { label: 'Support', value: 'Nearest pivot stays behind the ball' },
      { label: 'Finish', value: 'Switch wide or slip runner between lines' }
    ],
    cues: ['Make a box, not a line', 'One supports underneath', 'Switch after pressure commits'],
    watchout: 'Can become sterile if wide players do not threaten depth.',
    formationFit: ['double-pivot', 'midfield-overload', 'single-pivot'],
    opponentCounters: ['narrow-midfield', 'single-pivot'],
    tags: ['box-midfield', 'positional-play', 'tempo'],
    contextFit: {
      matchState: ['balanced'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['strong-midfield', 'balanced'],
      riskLevel: ['balanced'],
      avoidWhen: [{ teamCondition: 'tired' }]
    },
    sourceModelIds: ['guardiola-manchester-city', 'ancelotti-flexible-player-fit'],
    status: 'active'
  }
];

export const DEFENSE_STRATEGY_CARDS: readonly TacticalStrategyCard[] = [
  {
    id: 'defense-high-press',
    phase: 'defense',
    title: 'High Press',
    styleValue: 'High Press',
    intent: 'Defend forward, trap build-up, and force rushed clearances near goal.',
    bestFor: 'Fit teams with coordinated forwards and compact midfield support.',
    details: [
      { label: 'Trigger', value: 'Back pass or poor first touch' },
      { label: 'Protect', value: 'Pass into their deepest midfielder' },
      { label: 'Line', value: 'Back line squeezes near halfway' },
      { label: 'Reset', value: 'Drop if first pressure is broken' }
    ],
    cues: ['Press on back pass', 'Nearest jumps', 'Back line holds high'],
    watchout: 'Vulnerable to balls behind if pressure is late.',
    formationFit: ['front-three', 'midfield-overload', 'compact-lines'],
    opponentCounters: ['slow-build-up', 'back-three', 'single-pivot'],
    tags: ['pressing', 'front-foot', 'turnovers'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      teamCondition: ['fresh'],
      opponentBehavior: ['balanced'],
      riskLevel: ['aggressive'],
      avoidWhen: [{ teamCondition: 'tired' }, { matchState: 'protect-lead' }, { matchPhase: 'last-15', riskLevel: 'safe' }]
    },
    status: 'active'
  },
  {
    id: 'defense-half-press',
    phase: 'defense',
    title: 'Half Press',
    styleValue: 'Half Press',
    intent: 'Protect the middle third, then press once the opponent enters a trap zone.',
    bestFor: 'Balanced teams that want control without constant sprint pressing.',
    details: [
      { label: 'Trigger', value: 'Wide touch or backwards pass' },
      { label: 'Protect', value: 'Central lane and second balls' },
      { label: 'Line', value: 'Compact mid-block spacing' },
      { label: 'Reset', value: 'Recover inside before pressing again' }
    ],
    cues: ['Screen central pass', 'Press wide touch', 'Keep lines compact'],
    watchout: 'Can become passive if the trigger is unclear.',
    formationFit: ['compact-lines', 'double-pivot', 'mid-block'],
    opponentCounters: ['central-overload', 'wingback-space', 'front-two', 'front-two-screen', 'midfield-congestion'],
    tags: ['mid-block', 'trigger', 'compact-block'],
    contextFit: {
      matchState: ['balanced', 'protect-lead'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['direct-play', 'strong-midfield', 'balanced'],
      riskLevel: ['safe', 'balanced'],
      avoidWhen: [{ opponentBehavior: 'wide-overload' }]
    },
    sourceModelIds: ['mourinho-pragmatic-transition'],
    status: 'active'
  },
  {
    id: 'defense-counter-press',
    phase: 'defense',
    title: 'Counter Press',
    styleValue: 'Counter Press',
    intent: 'React immediately after losing the ball to stop counters before they become attacks.',
    bestFor: 'Teams attacking with numbers around the ball and midfielders close enough to compress space.',
    details: [
      { label: 'Trigger', value: 'First five seconds after turnover' },
      { label: 'Protect', value: 'Forward pass into their outlet' },
      { label: 'Line', value: 'Nearest three players collapse space' },
      { label: 'Reset', value: 'Drop to shape if the outlet escapes' }
    ],
    cues: ['Close the receiver', 'Block forward pass', 'Recover if beaten'],
    watchout: 'Can expose the back line if the first wave presses without cover.',
    formationFit: ['front-three', 'midfield-overload', 'compact-lines'],
    opponentCounters: ['slow-build-up', 'single-pivot', 'high-press'],
    tags: ['transition-defense', 'pressing', 'reaction'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      teamCondition: ['fresh'],
      opponentBehavior: ['low-block', 'balanced'],
      riskLevel: ['aggressive'],
      avoidWhen: [{ teamCondition: 'tired' }, { matchState: 'protect-lead' }]
    },
    sourceModelIds: ['guardiola-barcelona-2008-2012', 'ferguson-manchester-united-tempo'],
    status: 'active'
  },
  {
    id: 'defense-man-to-man',
    phase: 'defense',
    title: 'Man to Man',
    styleValue: 'Man to Man',
    intent: 'Deny easy receivers by assigning direct pressure across key matchups.',
    bestFor: 'Games with obvious danger players or teams comfortable defending duels.',
    details: [
      { label: 'Trigger', value: 'Receiver checks into pocket' },
      { label: 'Protect', value: 'Cover behind the first duel' },
      { label: 'Line', value: 'Staggered cover, not flat chasing' },
      { label: 'Reset', value: 'Switch marks on rotations' }
    ],
    cues: ['Stay touch-tight', 'Cover if beaten', 'Communicate switches'],
    watchout: 'Shape can stretch if players chase too far.',
    formationFit: ['athletic-duels', 'compact-lines'],
    opponentCounters: ['playmaker-pocket', 'single-pivot', 'narrow-diamond'],
    tags: ['athletic-duels', 'pressure', 'screening'],
    contextFit: {
      teamCondition: ['fresh'],
      opponentBehavior: ['strong-midfield'],
      riskLevel: ['balanced', 'aggressive'],
      avoidWhen: [{ teamCondition: 'tired' }]
    },
    status: 'active'
  },
  {
    id: 'defense-wide-trap',
    phase: 'defense',
    title: 'Wide Trap',
    styleValue: 'Wide Trap',
    intent: 'Invite passes wide, then lock the touchline with fullback, winger, and nearest midfielder.',
    bestFor: 'Opponents relying on wingbacks, touchline wingers, or predictable switches.',
    details: [
      { label: 'Trigger', value: 'Ball travels into wide channel' },
      { label: 'Protect', value: 'Inside pass back to their pivot' },
      { label: 'Line', value: 'Nearest winger screens backward pass' },
      { label: 'Reset', value: 'Slide together if they recycle play' }
    ],
    cues: ['Show outside first', 'Midfielder locks inside', 'Fullback delays cross'],
    watchout: 'Far-side winger must tuck in or the switch becomes dangerous.',
    formationFit: ['compact-lines', 'wing-width', 'fullback-overlap'],
    opponentCounters: ['wingback-space', 'wide-overload', 'back-three'],
    tags: ['wide-defense', 'trigger', 'touchline'],
    contextFit: {
      matchState: ['balanced', 'protect-lead'],
      opponentBehavior: ['wide-overload'],
      riskLevel: ['safe', 'balanced']
    },
    status: 'active'
  },
  {
    id: 'defense-low-block',
    phase: 'defense',
    title: 'Low Block',
    styleValue: 'Low Block',
    intent: 'Protect the penalty area, close central lanes, and counter from a compact shell.',
    bestFor: 'Protecting a lead, facing superior pace, or managing fatigue late in matches.',
    details: [
      { label: 'Trigger', value: 'Press only on loose wide touch' },
      { label: 'Protect', value: 'Box, half-spaces, and cutbacks' },
      { label: 'Line', value: 'Narrow back line with midfield screen' },
      { label: 'Reset', value: 'Clear wide, then step out together' }
    ],
    cues: ['Narrow first', 'Force outside', 'Counter into channels'],
    watchout: 'Needs an outlet or pressure will keep returning.',
    formationFit: ['compact-block', 'back-five', 'two-striker'],
    opponentCounters: ['front-three-press', 'wide-overload', 'pace-behind'],
    tags: ['box-protection', 'counter', 'discipline'],
    contextFit: {
      matchState: ['protect-lead'],
      matchPhase: ['last-15'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['direct-play', 'wide-overload'],
      riskLevel: ['safe'],
      avoidWhen: [{ matchState: 'chasing-goal', riskLevel: 'aggressive' }]
    },
    sourceModelIds: ['mourinho-pragmatic-transition'],
    status: 'active'
  },
  {
    id: 'defense-zonal-block',
    phase: 'defense',
    title: 'Zonal Block',
    styleValue: 'Zonal Block',
    intent: 'Defend the most dangerous spaces first, passing runners between zones instead of chasing marks.',
    bestFor: 'Managing rotations, central overloads, and teams with several players moving between lines.',
    details: [
      { label: 'Trigger', value: 'Opponent rotates across midfield line' },
      { label: 'Protect', value: 'Half-spaces and zone 14' },
      { label: 'Line', value: 'Midfield screen stays connected' },
      { label: 'Reset', value: 'Pass runners on with clear calls' }
    ],
    cues: ['Protect zone first', 'Pass runners on', 'Keep screen connected'],
    watchout: 'Communication must be clear or runners can arrive untracked.',
    formationFit: ['compact-block', 'back-five', 'midfield-overload'],
    opponentCounters: ['central-overload', 'narrow-diamond', 'playmaker-pocket'],
    tags: ['zonal', 'screening', 'compact-block'],
    contextFit: {
      matchState: ['balanced', 'protect-lead'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['strong-midfield', 'direct-play'],
      riskLevel: ['safe', 'balanced']
    },
    sourceModelIds: ['mourinho-pragmatic-transition'],
    status: 'active'
  },
  {
    id: 'defense-rest-defense',
    phase: 'defense',
    title: 'Rest-Defense Net',
    styleValue: 'Rest-Defense Net',
    intent: 'Keep a stable cover structure behind attacks so turnovers are delayed or stopped immediately.',
    bestFor: 'Teams committing fullbacks, 8s, or wingers forward while still needing protection against counters.',
    details: [
      { label: 'Trigger', value: 'Any attack with both wide players high' },
      { label: 'Protect', value: 'Central outlet and first forward pass' },
      { label: 'Line', value: 'Two plus one cover triangle behind play' },
      { label: 'Reset', value: 'Drop into block if the first delay fails' }
    ],
    cues: ['Protect the outlet', 'Delay before diving in', 'Far fullback tucks early'],
    watchout: 'If the cover triangle gets flat, one pass can beat the whole rest-defense.',
    formationFit: ['fullback-overlap', 'midfield-overload', 'compact-lines'],
    opponentCounters: ['pace-behind', 'front-two', 'wingback-space'],
    tags: ['rest-defense', 'transition-defense', 'cover'],
    contextFit: {
      matchState: ['balanced', 'protect-lead'],
      matchPhase: ['second-half', 'last-15'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['direct-play', 'wide-overload'],
      riskLevel: ['safe', 'balanced']
    },
    sourceModelIds: ['guardiola-manchester-city'],
    status: 'active'
  },
  {
    id: 'defense-pressing-from-front-two',
    phase: 'defense',
    title: 'Front-Two Screen',
    styleValue: 'Front-Two Screen',
    intent: 'Use two forwards to screen central build-up, curve pressure, and force play into predictable wide traps.',
    bestFor: '4-4-2, 5-3-2, and diamond teams that want compact pressure without exposing midfield.',
    details: [
      { label: 'Trigger', value: 'Center back receives facing own goal' },
      { label: 'Protect', value: 'Pass into the opponent pivot' },
      { label: 'Line', value: 'Midfield four or three stays compact' },
      { label: 'Reset', value: 'Forwards recover into screen, not chase' }
    ],
    cues: ['Curve the press', 'Block the pivot', 'Jump when ball goes wide'],
    watchout: 'If one forward chases straight, the pivot lane opens.',
    formationFit: ['two-striker', 'compact-lines', 'compact-block'],
    opponentCounters: ['slow-build-up', 'single-pivot', 'front-two-screen'],
    tags: ['front-two', 'screening', 'mid-block'],
    contextFit: {
      matchState: ['balanced', 'protect-lead'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['strong-midfield', 'balanced'],
      riskLevel: ['safe', 'balanced']
    },
    sourceModelIds: ['mourinho-pragmatic-transition'],
    status: 'active'
  },
  {
    id: 'defense-back-five-shift',
    phase: 'defense',
    title: 'Back-Five Shift',
    styleValue: 'Back-Five Shift',
    intent: 'Slide a five-player back line across the box while midfield protects cutbacks and second balls.',
    bestFor: 'Protecting the penalty area against wide overloads, strong crossing teams, or late-match pressure.',
    details: [
      { label: 'Trigger', value: 'Ball enters wide final-third channel' },
      { label: 'Protect', value: 'Six-yard box, penalty spot, and cutback edge' },
      { label: 'Line', value: 'Five shift together without breaking gaps' },
      { label: 'Reset', value: 'Step out only after clean clearance' }
    ],
    cues: ['Slide as five', 'Protect far post', 'Midfield owns cutbacks'],
    watchout: 'Can pin the team deep if the first outlet after clearance is missing.',
    formationFit: ['back-five', 'compact-block', 'wing-width'],
    opponentCounters: ['wide-overload', 'front-three-press', 'back-five'],
    tags: ['back-five', 'box-protection', 'wide-defense'],
    contextFit: {
      matchState: ['protect-lead'],
      matchPhase: ['second-half', 'last-15'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['wide-overload', 'direct-play'],
      riskLevel: ['safe']
    },
    status: 'active'
  },
  {
    id: 'defense-compact-4-5-1',
    phase: 'defense',
    title: 'Compact 4-5-1 Block',
    styleValue: 'Compact 4-5-1 Block',
    intent: 'Drop the wide players into midfield to protect central lanes and make the opponent play around the block.',
    bestFor: 'Underdog matches, protecting a lead, or teams needing clear roles against stronger possession sides.',
    details: [
      { label: 'Trigger', value: 'Opponent controls sustained possession' },
      { label: 'Protect', value: 'Zone 14 and passes between lines' },
      { label: 'Line', value: 'Five across midfield, four behind' },
      { label: 'Reset', value: 'Rebuild block before chasing second phase' }
    ],
    cues: ['Narrow first', 'Winger goal-side', 'Counter through channel'],
    watchout: 'If the striker is isolated, clearances will return too quickly.',
    formationFit: ['compact-block', 'single-pivot', 'compact-lines'],
    opponentCounters: ['central-overload', 'midfield-congestion', 'front-three-press'],
    tags: ['compact-block', 'screening', 'low-block'],
    contextFit: {
      matchState: ['protect-lead'],
      matchPhase: ['second-half', 'last-15'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['strong-midfield', 'direct-play'],
      riskLevel: ['safe']
    },
    status: 'active'
  },
  {
    id: 'defense-cover-shadow-press',
    phase: 'defense',
    title: 'Cover-Shadow Press',
    styleValue: 'Cover-Shadow Press',
    intent: 'Press the ball while using body shape to block the next dangerous pass.',
    bestFor: 'Teams learning coordinated pressing without needing full man-to-man chasing.',
    details: [
      { label: 'Trigger', value: 'Poor first touch or closed body shape' },
      { label: 'Protect', value: 'Inside pass into midfield' },
      { label: 'Line', value: 'Second line steps with the first press' },
      { label: 'Reset', value: 'Recover compact if pass breaks the shadow' }
    ],
    cues: ['Press at an angle', 'Hide the inside pass', 'Second player jumps next'],
    watchout: 'Straight-line pressing opens the pass you meant to block.',
    formationFit: ['front-three', 'compact-lines', 'midfield-overload'],
    opponentCounters: ['slow-build-up', 'single-pivot', 'high-press'],
    tags: ['pressing', 'cover-shadow', 'trigger'],
    contextFit: {
      matchState: ['balanced', 'chasing-goal'],
      teamCondition: ['fresh', 'normal'],
      opponentBehavior: ['balanced', 'high-press'],
      riskLevel: ['balanced', 'aggressive'],
      avoidWhen: [{ teamCondition: 'tired' }]
    },
    status: 'active'
  },
  {
    id: 'defense-anti-overload-slide',
    phase: 'defense',
    title: 'Anti-Overload Slide',
    styleValue: 'Anti-Overload Slide',
    intent: 'Recognize an opponent overload early, slide support across, and leave the least dangerous far-side pass open.',
    bestFor: 'Defending against teams that create wide triangles, half-space overloads, or repeated switches.',
    details: [
      { label: 'Trigger', value: 'Three opponents gather around one wide channel' },
      { label: 'Protect', value: 'Inside pass and underlap lane' },
      { label: 'Line', value: 'Back line shifts while far winger tucks in' },
      { label: 'Reset', value: 'Recover width when ball travels backwards' }
    ],
    cues: ['See the overload early', 'Lock inside lane', 'Far winger narrows'],
    watchout: 'Over-sliding leaves the far winger free if pressure on the ball is weak.',
    formationFit: ['compact-lines', 'compact-block', 'wing-width'],
    opponentCounters: ['wide-overload', 'wingback-space', 'back-three'],
    tags: ['wide-defense', 'overload-defense', 'zonal'],
    contextFit: {
      matchState: ['balanced', 'protect-lead'],
      teamCondition: ['normal', 'tired'],
      opponentBehavior: ['wide-overload'],
      riskLevel: ['safe', 'balanced']
    },
    status: 'active'
  }
];

export const TACTICAL_STRATEGY_CARDS: readonly TacticalStrategyCard[] = [
  ...ATTACK_STRATEGY_CARDS,
  ...DEFENSE_STRATEGY_CARDS
];

export const findAttackStrategyByStyle = (style: string) => (
  ATTACK_STRATEGY_CARDS.find(card => card.styleValue === style)
);

export const findDefenseStrategyByStyle = (style: string) => (
  DEFENSE_STRATEGY_CARDS.find(card => card.styleValue === style)
);
