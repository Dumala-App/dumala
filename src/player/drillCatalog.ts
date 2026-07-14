import type { PlayerDrillCompletion } from '../cloud/player';

// Player-only solo drill library. These are intentionally separate from the
// coach app's team training library: every drill can be done alone with simple
// footwork, a ball, a wall/goal/cones, and the player app timer.

export type DrillDifficulty = 'Easy' | 'Moderate' | 'Hard';
export type PositionGroup = 'Forward' | 'Midfield' | 'Defender' | 'Goalkeeper' | 'General';

export interface PlayerDrill {
  id: string;
  name: string;
  category: string;
  description: string;
  intensity: number;
  difficulty: DrillDifficulty;
  minutes: number;
  positionGroup: PositionGroup;
  equipment: string[];
  color: string;
  instructions: string;
  trackJugglingScore?: boolean;
}

export const JUGGLING_DRILL_ID = 'solo-ball-control-juggling';
const JUGGLING_NOTE_PREFIX = 'juggling_score:';

export const difficultyForIntensity = (intensity: number): DrillDifficulty => {
  if (intensity <= 3) return 'Easy';
  if (intensity <= 5) return 'Moderate';
  return 'Hard';
};

export const estimatedMinutes = (intensity: number): number =>
  Math.min(30, Math.max(10, Math.round(8 + intensity * 2.5)));

export const PLAYER_DRILLS: PlayerDrill[] = [
  {
    id: JUGGLING_DRILL_ID,
    name: 'Ball Control Juggling Ladder',
    category: 'Ball Mastery',
    description: 'Build touch and concentration by recording your best unbroken juggling count.',
    intensity: 2,
    difficulty: 'Easy',
    minutes: 10,
    positionGroup: 'General',
    equipment: ['ball', 'timer'],
    color: 'from-cyan-500 via-blue-600 to-indigo-700',
    trackJugglingScore: true,
    instructions: [
      'Set the timer for 10 minutes.',
      'Start with feet only. Count every clean touch before the ball drops.',
      'Rest 20-30 seconds, then repeat.',
      'Record your best unbroken count for the session.'
    ].join('\n')
  },
  {
    id: 'solo-inside-outside-touches',
    name: 'Inside-Outside Touch Grid',
    category: 'Footwork',
    description: 'Quick alternating inside and outside touches through a small square.',
    intensity: 3,
    difficulty: 'Easy',
    minutes: 12,
    positionGroup: 'General',
    equipment: ['ball', 'cones', 'timer'],
    color: 'from-emerald-500 via-teal-600 to-cyan-700',
    instructions: 'Create a 3x3m square. Move around the edge using inside-outside touches, 45 seconds on and 20 seconds rest for 8 rounds.'
  },
  {
    id: 'solo-sole-roll-cuts',
    name: 'Sole Roll and Cut Combos',
    category: 'Ball Mastery',
    description: 'Use sole rolls, drag backs, and sharp cuts to improve close control.',
    intensity: 3,
    difficulty: 'Easy',
    minutes: 12,
    positionGroup: 'General',
    equipment: ['ball', 'timer'],
    color: 'from-sky-500 via-cyan-600 to-emerald-700',
    instructions: 'Work in a 5m lane. Roll across your body, cut back with the inside, then accelerate two steps. Alternate feet every rep.'
  },
  {
    id: 'solo-wall-pass-first-touch',
    name: 'Wall Pass First Touch',
    category: 'Passing',
    description: 'Pass against a wall and control each return into a new angle.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 15,
    positionGroup: 'Midfield',
    equipment: ['ball', 'wall', 'timer'],
    color: 'from-lime-500 via-emerald-600 to-teal-700',
    instructions: 'Stand 4-6m from a wall. Pass firmly, receive across your body, take one setup touch, and pass again. Do 3 blocks of 3 minutes.'
  },
  {
    id: 'solo-two-touch-wall-switch',
    name: 'Two-Touch Wall Switches',
    category: 'Passing',
    description: 'Train both feet by switching passing angles after every return.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 16,
    positionGroup: 'Midfield',
    equipment: ['ball', 'wall', 'cones'],
    color: 'from-blue-500 via-indigo-600 to-violet-700',
    instructions: 'Mark two gates 3m apart. Pass to the wall, first touch through one gate, pass back, then switch to the other gate.'
  },
  {
    id: 'solo-dribble-slalom',
    name: 'Cone Slalom Close Control',
    category: 'Dribbling',
    description: 'Tight touches through cones with both feet and controlled exits.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 15,
    positionGroup: 'Forward',
    equipment: ['ball', 'cones', 'timer'],
    color: 'from-orange-500 via-rose-600 to-pink-700',
    instructions: 'Set 6 cones one step apart. Dribble through with small touches, explode out for 5m, jog back, and repeat for timed rounds.'
  },
  {
    id: 'solo-weak-foot-wall',
    name: 'Weak Foot Wall Reps',
    category: 'Weak Foot',
    description: 'Simple, high-volume weak-foot passing and receiving.',
    intensity: 3,
    difficulty: 'Easy',
    minutes: 14,
    positionGroup: 'General',
    equipment: ['ball', 'wall'],
    color: 'from-amber-500 via-orange-600 to-red-700',
    instructions: 'Use only your weaker foot for 100 wall passes. Every 20 passes, step back one metre or change the receiving angle.'
  },
  {
    id: 'solo-turning-box',
    name: 'Turning Box',
    category: 'First Touch',
    description: 'Practice receiving, turning, and escaping pressure inside a small box.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 15,
    positionGroup: 'Midfield',
    equipment: ['ball', 'cones', 'wall'],
    color: 'from-purple-500 via-violet-600 to-indigo-700',
    instructions: 'Pass to a wall, receive into a 4x4m box, perform a turn, and accelerate out through a different side.'
  },
  {
    id: 'solo-shooting-corners',
    name: 'Corner Finish Reps',
    category: 'Finishing',
    description: 'Solo finishing practice aiming for low and high corners.',
    intensity: 5,
    difficulty: 'Moderate',
    minutes: 18,
    positionGroup: 'Forward',
    equipment: ['ball', 'goal', 'cones'],
    color: 'from-rose-500 via-red-600 to-orange-700',
    instructions: 'Place four corner targets in the goal. Take 5 shots to each corner. Record how many hit the target zone.'
  },
  {
    id: 'solo-first-touch-finish',
    name: 'First Touch to Finish',
    category: 'Finishing',
    description: 'Roll the ball out, control into space, and shoot quickly.',
    intensity: 5,
    difficulty: 'Moderate',
    minutes: 18,
    positionGroup: 'Forward',
    equipment: ['ball', 'goal', 'timer'],
    color: 'from-fuchsia-500 via-rose-600 to-orange-700',
    instructions: 'Start 15m from goal. Roll the ball forward or sideways, take one touch into shooting space, then finish within three seconds.'
  },
  {
    id: 'solo-sprint-ball-carry',
    name: 'Sprint Carry Bursts',
    category: 'Speed',
    description: 'Short acceleration bursts while keeping the ball under control.',
    intensity: 6,
    difficulty: 'Hard',
    minutes: 16,
    positionGroup: 'Forward',
    equipment: ['ball', 'cones', 'timer'],
    color: 'from-yellow-500 via-orange-600 to-rose-700',
    instructions: 'Mark 15m. Dribble at max speed to the end cone, stop the ball dead, walk back, and repeat 10-14 times.'
  },
  {
    id: 'solo-defensive-footwork-shadow',
    name: 'Defensive Shadow Steps',
    category: 'Defending',
    description: 'Solo lateral footwork for jockeying, recovery, and balance.',
    intensity: 5,
    difficulty: 'Moderate',
    minutes: 14,
    positionGroup: 'Defender',
    equipment: ['cones', 'timer'],
    color: 'from-slate-500 via-sky-700 to-blue-800',
    instructions: 'Set a 5m line. Shuffle side-to-side, drop step, sprint two steps, then recover. Work 30 seconds on and 20 seconds rest.'
  },
  {
    id: 'solo-long-pass-targets',
    name: 'Long Pass Target Gates',
    category: 'Passing',
    description: 'Hit target gates at different distances using both feet.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 20,
    positionGroup: 'Defender',
    equipment: ['ball', 'cones'],
    color: 'from-cyan-500 via-sky-600 to-blue-700',
    instructions: 'Create gates at 15m, 25m, and 35m. Attempt 10 passes to each gate. Count clean passes through the gate.'
  },
  {
    id: 'solo-gk-reaction-wall',
    name: 'Goalkeeper Wall Reactions',
    category: 'Goalkeeping',
    description: 'Reaction catches and ground saves using a wall rebound.',
    intensity: 5,
    difficulty: 'Moderate',
    minutes: 15,
    positionGroup: 'Goalkeeper',
    equipment: ['ball', 'wall', 'gloves'],
    color: 'from-orange-400 via-amber-600 to-yellow-700',
    instructions: 'Throw or pass the ball at a wall from 3-5m. React to the rebound with catches, scoops, and low saves.'
  },
  {
    id: 'solo-gk-footwork-set',
    name: 'Goalkeeper Set Position Footwork',
    category: 'Goalkeeping',
    description: 'Move, set, and recover with clean goalkeeper footwork.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 14,
    positionGroup: 'Goalkeeper',
    equipment: ['cones', 'timer'],
    color: 'from-yellow-400 via-orange-600 to-red-700',
    instructions: 'Set three cones across the goal. Shuffle to a cone, set your feet, hands ready, then recover to the middle.'
  },
  {
    id: 'solo-endurance-ball-circuit',
    name: 'Ball Fitness Circuit',
    category: 'Fitness',
    description: 'A solo conditioning block that keeps the ball involved.',
    intensity: 6,
    difficulty: 'Hard',
    minutes: 24,
    positionGroup: 'General',
    equipment: ['ball', 'cones', 'timer'],
    color: 'from-red-500 via-orange-600 to-amber-700',
    instructions: 'Cycle through 45 seconds dribbling, 30 seconds toe taps, 30 seconds ball carries, and 30 seconds rest for 8 rounds.'
  },
  {
    id: 'solo-touch-count-challenge',
    name: 'One-Minute Touch Count',
    category: 'Ball Mastery',
    description: 'Count controlled touches in one minute and try to beat your number.',
    intensity: 3,
    difficulty: 'Easy',
    minutes: 10,
    positionGroup: 'General',
    equipment: ['ball', 'timer'],
    color: 'from-teal-500 via-cyan-600 to-blue-700',
    instructions: 'Set a 60-second timer. Use toe taps, foundations, or inside touches. Count only controlled touches and repeat 5 times.'
  },
  {
    id: 'solo-foundation-figure-eights',
    name: 'Foundation Figure Eights',
    category: 'Ball Mastery',
    description: 'Move the ball in figure eights using inside touches, sole drags, and tight footwork.',
    intensity: 3,
    difficulty: 'Easy',
    minutes: 12,
    positionGroup: 'General',
    equipment: ['ball', 'cones', 'timer'],
    color: 'from-emerald-400 via-cyan-600 to-blue-700',
    instructions: 'Place two cones 2m apart. Move around them in a figure eight using small touches. Switch feet and touch patterns every minute.'
  },
  {
    id: 'solo-gate-dribble-escape',
    name: 'Gate Dribble Escapes',
    category: 'Dribbling',
    description: 'Attack small gates, cut sharply, and accelerate away with control.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 16,
    positionGroup: 'General',
    equipment: ['ball', 'cones', 'timer'],
    color: 'from-orange-400 via-amber-600 to-rose-700',
    instructions: 'Create four small gates around you. Dribble through one gate, perform a cut or drag back, then burst through another gate.'
  },
  {
    id: 'solo-wall-one-touch-rhythm',
    name: 'One-Touch Wall Rhythm',
    category: 'Passing',
    description: 'Develop passing rhythm, balance, and clean contact with one-touch wall passes.',
    intensity: 4,
    difficulty: 'Moderate',
    minutes: 14,
    positionGroup: 'General',
    equipment: ['ball', 'wall', 'timer'],
    color: 'from-lime-400 via-green-600 to-emerald-700',
    instructions: 'Stand 3-5m from a wall. One-touch pass for 45 seconds, rest 20 seconds, then repeat. Alternate strong foot, weak foot, and both feet.'
  },
  {
    id: 'solo-chip-and-control',
    name: 'Chip and Cushion Control',
    category: 'First Touch',
    description: 'Chip the ball up and cushion it down with different body surfaces.',
    intensity: 3,
    difficulty: 'Easy',
    minutes: 12,
    positionGroup: 'General',
    equipment: ['ball', 'timer'],
    color: 'from-violet-400 via-purple-600 to-indigo-700',
    instructions: 'Chip the ball waist-high, cushion it with foot, thigh, or chest, then settle it in two touches. Repeat for controlled reps.'
  },
  {
    id: 'solo-far-post-finishing',
    name: 'Far Post Finish Pattern',
    category: 'Finishing',
    description: 'Practice opening your body and finishing across goal into the far corner.',
    intensity: 5,
    difficulty: 'Moderate',
    minutes: 18,
    positionGroup: 'General',
    equipment: ['ball', 'goal', 'cones'],
    color: 'from-pink-500 via-rose-600 to-red-700',
    instructions: 'Start wide of goal. Touch diagonally inside, open your hips, and finish across goal. Repeat from both sides.'
  },
  {
    id: 'solo-rebound-finish',
    name: 'Wall Rebound Finish',
    category: 'Finishing',
    description: 'Use a wall rebound or self-pass to set up quick first-time finishes.',
    intensity: 5,
    difficulty: 'Moderate',
    minutes: 18,
    positionGroup: 'General',
    equipment: ['ball', 'wall', 'goal'],
    color: 'from-red-500 via-orange-600 to-yellow-700',
    instructions: 'Pass firmly into a wall or board. Adjust your feet to the rebound and finish first time or with one touch.'
  },
  {
    id: 'solo-180-turn-accelerations',
    name: '180 Turn Accelerations',
    category: 'Change of Direction',
    description: 'Practice turning away from pressure and accelerating with the ball.',
    intensity: 5,
    difficulty: 'Moderate',
    minutes: 15,
    positionGroup: 'General',
    equipment: ['ball', 'cones', 'timer'],
    color: 'from-blue-400 via-sky-600 to-cyan-700',
    instructions: 'Dribble 5m, perform a 180 turn, then accelerate back. Rotate between inside cut, outside cut, Cruyff turn, and sole drag.'
  },
  {
    id: 'solo-cooldown-touch-flow',
    name: 'Cooldown Touch Flow',
    category: 'Recovery',
    description: 'Low-intensity ball touches to finish a session while keeping technique clean.',
    intensity: 2,
    difficulty: 'Easy',
    minutes: 10,
    positionGroup: 'General',
    equipment: ['ball', 'timer'],
    color: 'from-slate-400 via-blue-600 to-indigo-700',
    instructions: 'Move slowly through toe taps, foundations, sole rolls, and gentle dribbles. Keep breathing calm and touches precise.'
  }
];

export const getPlayerDrill = (drillId: string): PlayerDrill | undefined =>
  PLAYER_DRILLS.find(drill => drill.id === drillId);

export const getDrillInstructions = (drillId: string): string =>
  getPlayerDrill(drillId)?.instructions ?? 'Run the drill safely with control, good technique, and enough rest between rounds.';

export const serializeJugglingScoreNote = (score: number): string =>
  `${JUGGLING_NOTE_PREFIX}${Math.max(0, Math.round(score))}`;

export const parseJugglingScore = (completion: Pick<PlayerDrillCompletion, 'drill_id' | 'notes'>): number | null => {
  if (completion.drill_id !== JUGGLING_DRILL_ID) return null;
  const note = completion.notes?.trim();
  if (!note?.startsWith(JUGGLING_NOTE_PREFIX)) return null;
  const score = Number(note.slice(JUGGLING_NOTE_PREFIX.length));
  return Number.isFinite(score) && score >= 0 ? Math.round(score) : null;
};

export interface JugglingProgress {
  attempts: Array<PlayerDrillCompletion & { score: number }>;
  latestScore: number | null;
  bestScore: number | null;
}

export const getJugglingProgress = (completions: PlayerDrillCompletion[]): JugglingProgress => {
  const attempts = completions
    .map(completion => {
      const score = parseJugglingScore(completion);
      return score === null ? null : { ...completion, score };
    })
    .filter((completion): completion is PlayerDrillCompletion & { score: number } => completion !== null)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

  return {
    attempts,
    latestScore: attempts[0]?.score ?? null,
    bestScore: attempts.length > 0 ? Math.max(...attempts.map(attempt => attempt.score)) : null
  };
};

export interface DrillFilter {
  search?: string;
  difficulty?: DrillDifficulty | 'all';
  positionGroup?: PositionGroup | 'all';
  equipment?: string | 'all';
  favoritesOnly?: boolean;
}

export const equipmentOptions = (): string[] => {
  const set = new Set<string>();
  for (const drill of PLAYER_DRILLS) {
    for (const item of drill.equipment) set.add(item);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
};

export const filterPlayerDrills = (
  drills: PlayerDrill[],
  filter: DrillFilter,
  favorites: ReadonlySet<string> = new Set()
): PlayerDrill[] => {
  const search = filter.search?.trim().toLowerCase() ?? '';
  return drills.filter(drill => {
    if (filter.favoritesOnly && !favorites.has(drill.id)) return false;
    if (filter.difficulty && filter.difficulty !== 'all' && drill.difficulty !== filter.difficulty) return false;
    if (filter.positionGroup && filter.positionGroup !== 'all' && drill.positionGroup !== filter.positionGroup) return false;
    if (filter.equipment && filter.equipment !== 'all' && !drill.equipment.includes(filter.equipment)) return false;
    if (search) {
      const haystack = `${drill.name} ${drill.category} ${drill.description} ${drill.equipment.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};
