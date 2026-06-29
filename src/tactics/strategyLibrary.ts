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
  formationFit: readonly string[];
  opponentCounters: readonly string[];
  tags: readonly string[];
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
    tags: ['transition', 'verticality', 'pace']
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
    tags: ['tempo', 'triangles', 'control']
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
    tags: ['combinations', 'between-lines', 'timing']
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
    tags: ['direct', 'second-ball', 'pressure-release']
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
    tags: ['build-up', 'rest-defense', 'rotation']
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
    tags: ['width', 'switches', 'crossing']
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
    tags: ['switches', 'isolation', 'tempo']
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
    tags: ['cutbacks', 'box-entry', 'chance-quality']
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
    tags: ['pressing', 'front-foot', 'turnovers']
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
    tags: ['mid-block', 'trap', 'compactness']
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
    tags: ['transition-defense', 'pressing', 'reaction']
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
    tags: ['duels', 'marking', 'pressure']
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
    tags: ['wide-defense', 'trap', 'touchline']
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
    tags: ['box-protection', 'counter', 'discipline']
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
    tags: ['zonal', 'screening', 'compactness']
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
