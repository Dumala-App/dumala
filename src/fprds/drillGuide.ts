export type DrillGuideCategory = 'Base' | 'ForwardsWingers' | 'Midfielders' | 'Defenders' | 'Goalkeepers';

export interface DrillGuideAudio {
  /** Public path to the audio file (e.g. `/yoyo.m4a`). */
  src: string;
  /** Short label shown on the player. */
  label: string;
  /** One-line explanation of what the audio is for. */
  description?: string;
}

export interface DrillGuideEntry {
  id: string;
  title: string;
  category: DrillGuideCategory;
  attributeCode?: string;
  equipment: string[];
  setup: string[];
  procedure: string[];
  attempts: string[];
  dataToRecord: string[];
  commonMistakes?: string[];
  safety?: string[];
  tags: string[];
  /** Optional public path to an illustration image showing how the drill is run. */
  illustration?: string;
  /** Optional audio track required to run the drill (e.g. the Yo-Yo beep track). */
  audio?: DrillGuideAudio;
}

export const DRILL_GUIDE_CATEGORIES: Array<{ id: DrillGuideCategory; label: string }> = [
  { id: 'Base', label: 'Base drills' },
  { id: 'ForwardsWingers', label: 'Forwards / Wingers' },
  { id: 'Midfielders', label: 'Midfielders' },
  { id: 'Defenders', label: 'Defenders' },
  { id: 'Goalkeepers', label: 'Goalkeepers' }
];

export const DRILL_GUIDE_ENTRIES: DrillGuideEntry[] = [
  // Base drills
  {
    id: 'base_sprint_10_30',
    title: '10m / 30m Sprint Test',
    category: 'Base',
    attributeCode: 'PAC',
    equipment: [
      '2–4 cones (START, 10m, 30m markers)',
      'Stopwatch (minimum) or timing gates (ideal)',
      'Measuring tape or pre-marked pitch lines'
    ],
    setup: [
      'Create a straight 30m lane on a flat surface.',
      'Mark START, 10m split, and 30m finish clearly.',
      'Ensure the athlete has safe run-off space past the 30m finish.'
    ],
    procedure: [
      'Use a standing start (no rolling start).',
      'On “Go”, sprint at maximum effort through the 30m line (do not slow early).',
      'Record both the 10m split and 30m total time.'
    ],
    attempts: ['3 attempts', 'Record best attempt', 'Rest 2–4 minutes between attempts'],
    dataToRecord: ['10m split (seconds)', '30m time (seconds)'],
    commonMistakes: [
      'Rolling start or inconsistent start stance between attempts',
      'Stopping the watch early before the athlete crosses the line',
      'Too little recovery, causing slower second/third attempts'
    ],
    safety: ['Do a full sprint warm-up first (mobility + progressive accelerations).', 'Avoid slippery surfaces.'],
    tags: ['sprint', '10m', '30m', 'pace', 'acceleration', 'time', 'cones']
  },
  {
    id: 'base_yoyo',
    title: 'Yo-Yo Intermittent Recovery Test',
    category: 'Base',
    attributeCode: 'STA',
    equipment: ['Cones for 20m shuttle markers', 'Yo-Yo audio / beep track + speaker', 'Measuring tape'],
    setup: [
      'Mark two lines 20m apart.',
      'Ensure the audio is loud enough for the athlete to follow accurately.'
    ],
    procedure: [
      'Athlete runs shuttles between lines, matching the beep timing.',
      'Athlete stops when unable to reach the line on time (standard Yo-Yo rules).',
      'Record the total distance achieved.'
    ],
    attempts: ['Single attempt (fatiguing test)', 'Use consistent warm-up and footwear each cycle'],
    dataToRecord: ['Total distance achieved (meters)'],
    commonMistakes: ['Inaccurate distance measurement (not exactly 20m)', 'Starting too hard without pacing', 'Poor audio quality'],
    safety: ['Hydrate and cool-down after the test.', 'Stop immediately if dizziness or sharp pain occurs.'],
    tags: ['yoyo', 'yo-yo', 'endurance', 'stamina', 'distance', 'beep'],
    audio: {
      src: '/yoyo.m4a',
      label: 'Yo-Yo beep track',
      description: 'Play through a loud speaker. Athletes match each shuttle to the beep timing.'
    }
  },
  {
    id: 'base_illinois',
    title: 'Illinois Agility Test',
    category: 'Base',
    attributeCode: 'AGI',
    equipment: ['8 cones', 'Stopwatch', 'Measuring tape'],
    setup: ['Lay out the standard Illinois Agility Test pattern.', 'Double-check cone distances before starting.'],
    procedure: [
      'Athlete completes the course at max speed following the standard pattern.',
      'Record completion time.'
    ],
    attempts: ['2 attempts', 'Record best attempt', 'Rest 2–3 minutes between attempts'],
    dataToRecord: ['Completion time (seconds)'],
    commonMistakes: ['Knocking cones and continuing without resetting', 'Different route taken across attempts'],
    safety: ['Use a non-slip surface and proper footwear.', 'Warm up hips/ankles/knees before testing.'],
    tags: ['illinois', 'agility', 'change of direction', 'cones', 'time']
  },
  {
    id: 'base_power',
    title: 'Standing Broad Jump + Medicine Ball Throw',
    category: 'Base',
    attributeCode: 'STR',
    equipment: ['Tape measure', 'Chalk/tape marker', 'Medicine ball (3–5kg)'],
    setup: ['Broad jump: mark a takeoff line.', 'Medicine ball: choose chest or overhead throw and keep it consistent.'],
    procedure: [
      'Broad jump: two-footed takeoff, land under control; measure from line to nearest heel mark.',
      'Medicine ball: throw from a consistent stance behind the line; measure throw distance.'
    ],
    attempts: ['3 attempts for broad jump (record best)', '3 attempts for medicine ball throw (record best)'],
    dataToRecord: ['Broad jump distance (cm)', 'Medicine ball throw distance (cm)'],
    commonMistakes: ['Stepping over the line', 'Changing throw technique between attempts', 'Measuring from wrong reference point'],
    safety: ['Emphasize landing mechanics to reduce joint stress.', 'Use an appropriate ball weight for the age group.'],
    tags: ['broad jump', 'medicine ball', 'power', 'strength', 'distance']
  },
  {
    id: 'base_first_touch',
    title: 'Rebound Board Control / Wall Pass Grid',
    category: 'Base',
    attributeCode: 'FTH',
    equipment: ['Rebound board or wall', '2m × 2m target grid (tape or cones)', '10 balls (or reuse 1 consistently)'],
    setup: ['Mark a 2m × 2m control zone.', 'Athlete stands 5m from rebound surface.'],
    procedure: [
      'Serve/pass into the rebound surface.',
      'Athlete receives and must control within the target grid.',
      'Repeat for 10 reps.'
    ],
    attempts: ['10 attempts'],
    dataToRecord: ['Successful controls within grid (out of 10)'],
    commonMistakes: ['Inconsistent service speed', 'Not clearly defining “controlled” inside the grid'],
    safety: ['Keep the area clear to avoid slipping on loose balls.'],
    tags: ['first touch', 'control', 'rebound', 'wall', 'grid', 'out of 10']
  },
  {
    id: 'base_short_passing',
    title: 'Target Gate Passing (10m)',
    category: 'Base',
    attributeCode: 'SPA',
    equipment: ['2 cones/poles to form a 1m gate', 'Measuring tape', '10 balls'],
    setup: ['Place a 1m gate at 10m distance.', 'Use the same ball type and surface each cycle.'],
    procedure: ['Athlete passes through the gate for 10 attempts.', 'Count successful passes.'],
    attempts: ['10 attempts'],
    dataToRecord: ['Successful passes through gate (out of 10)'],
    commonMistakes: ['Gate width changing between sessions', 'Counting a pass that clips the cone as success without a rule'],
    safety: ['Ensure the athlete is warmed up to reduce groin/hip strain.'],
    tags: ['short passing', 'gate', '10m', 'accuracy', 'out of 10']
  },

  // Forwards / Wingers
  {
    id: 'fw_finishing_box',
    title: 'Finishing (Box) — 6-ball rapid fire',
    category: 'ForwardsWingers',
    equipment: ['6 balls', 'Goal', 'Cones to mark ball positions', 'Optional: target zones inside goal'],
    setup: ['Place 6 balls around the penalty area (left/center/right lanes).', 'Standardize allowed touches (1-touch or 2-touch).'],
    procedure: [
      'Athlete attacks each ball in sequence and finishes quickly.',
      'Track goals scored and shots on target.'
    ],
    attempts: ['1 run (6 shots)', 'Optional: 2 runs and record best, if you want higher confidence'],
    dataToRecord: ['Goals (out of 6)', 'On-target (out of 6)'],
    commonMistakes: ['Changing feed speed drastically between athletes', 'Unclear definition of “on target”'],
    safety: ['Check the area for other players crossing the shooting lane.'],
    tags: ['finishing', 'box', 'shooting', '6-ball', 'on target', 'goals']
  },
  {
    id: 'fw_shot_power',
    title: 'Shot Power / Long Shots — max controlled distance',
    category: 'ForwardsWingers',
    equipment: ['Goal', 'Distance markers (20m/30m/40m)', 'Balls', 'Cones'],
    setup: ['Mark distances from goal (or use pitch lines).', 'Define what “controlled and on-target” means before starting.'],
    procedure: [
      'Athlete strikes from increasing distances.',
      'Identify the maximum distance where the shot remains controlled and on target.'
    ],
    attempts: ['Several attempts at each distance (consistent across athletes)'],
    dataToRecord: ['Max controlled on-target distance (meters)'],
    commonMistakes: ['Counting a wild shot as “power” despite lack of control', 'Different ball conditions between attempts'],
    safety: ['Avoid overuse; limit volume for younger athletes.'],
    tags: ['shot power', 'long shots', 'distance', 'meters']
  },
  {
    id: 'fw_offensive_1v1',
    title: 'Offensive 1v1 — attack channel',
    category: 'ForwardsWingers',
    equipment: ['Cones to mark a 10m × 15m channel', '1 defender', 'Goal or end line'],
    setup: ['Mark a 10m × 15m channel.', 'Standardize defender starting distance and intensity.'],
    procedure: [
      'Attacker starts with ball and has ~10 seconds to beat defender.',
      'Define “success” (e.g., beats defender and creates shot/cross/end-line).',
      'Run 10 attempts.'
    ],
    attempts: ['10 attempts'],
    dataToRecord: ['Successful take-ons (out of 10)'],
    commonMistakes: ['Defender intensity varies wildly', 'No clear “success” rule'],
    safety: ['Enforce controlled defending rules to reduce contact injury.'],
    tags: ['1v1', 'take-on', 'dribbling', 'channel', 'out of 10']
  },
  {
    id: 'fw_attacking_heading',
    title: 'Attacking Heading — target zones',
    category: 'ForwardsWingers',
    equipment: ['Server/feeder or pendulum cross tool', 'Goal', 'Optional: target zones marked in goal'],
    setup: ['Use a consistent crossing point and delivery type.', 'Define “on target / target zone” before starting.'],
    procedure: ['10 deliveries. Athlete attacks the ball and heads into target zones.'],
    attempts: ['10 attempts'],
    dataToRecord: ['On-target headers / headers into target zones (out of 10)'],
    commonMistakes: ['Inconsistent cross quality', 'Counting poor contact as success'],
    safety: ['Limit heading volume for younger age groups; follow your local safeguarding policy.'],
    tags: ['heading', 'attacking heading', 'cross', 'out of 10']
  },

  // Midfielders
  {
    id: 'mid_long_passing',
    title: 'Long Passing — 30m/40m into 5×5m target zone',
    category: 'Midfielders',
    equipment: ['Cones to mark a 5×5m target zone', 'Measuring tape', 'Balls'],
    setup: ['Place a 5×5m target zone at 30m and 40m.', 'Keep surface and ball consistent across sessions.'],
    procedure: ['5 attempts at 30m + 5 attempts at 40m.', 'Record successes into the target zone.'],
    attempts: ['10 attempts total'],
    dataToRecord: ['30m successes (out of 5)', '40m successes (out of 5)'],
    commonMistakes: ['Target zone size shifting', 'Counting a bounce outside the zone as inside'],
    safety: ['Warm up groin and hamstrings before long striking.'],
    tags: ['long passing', '30m', '40m', 'target zone', 'out of 5']
  },
  {
    id: 'mid_vision_rondo',
    title: 'Vision / Playmaking — 4v2 rondo coach score',
    category: 'Midfielders',
    equipment: ['Cones to mark 10×10m grid', 'Ball supply', '6 players'],
    setup: ['Mark a 10×10m grid.', 'Define coach scoring rubric before starting.'],
    procedure: [
      'Run 4v2 rondo for a fixed window (e.g., 10 minutes).',
      'Coach scores 1–10 using a consistent rubric: scanning, line-breaking passes, timing, decision speed.'
    ],
    attempts: ['Single scoring window'],
    dataToRecord: ['Coach score (1–10)'],
    commonMistakes: ['No rubric (subjective scoring)', 'Different game constraints between sessions'],
    safety: ['Keep intensity appropriate; stop if fatigue affects technique.'],
    tags: ['vision', 'playmaking', 'rondo', '4v2', 'coach score']
  },
  {
    id: 'mid_ball_retention',
    title: 'Ball Retention — 3×3m shielding',
    category: 'Midfielders',
    equipment: ['Cones for 3×3m grid', 'Stopwatch', '1 defender'],
    setup: ['Mark a 3×3m grid.', 'Standardize defender pressure intensity.'],
    procedure: ['Athlete shields ball to retain possession as long as possible.', '3 attempts; record best time.'],
    attempts: ['3 attempts; record best'],
    dataToRecord: ['Best time retained (seconds)'],
    commonMistakes: ['Defender intensity inconsistent', 'Timing starts late/early'],
    safety: ['Control contact rules to reduce collision risk.'],
    tags: ['ball retention', 'shielding', '3x3', 'seconds']
  },
  {
    id: 'mid_pressing_cage',
    title: 'Pressing / Interceptions — 3v1 pressing cage',
    category: 'Midfielders',
    equipment: ['Cones for grid', 'Ball supply', '4 players'],
    setup: ['Mark a small grid appropriate for intensity.', 'Define what counts as “won back”.'],
    procedure: ['5 rounds as the pressing player.', 'Record wins out of 5.'],
    attempts: ['5 rounds'],
    dataToRecord: ['Times ball won back (out of 5)'],
    commonMistakes: ['Rounds vary in length or rules', 'Recording forced error inconsistently'],
    safety: ['Monitor fatigue; pressing is high-intensity.'],
    tags: ['pressing', 'interceptions', '3v1', 'wins', 'out of 5']
  },

  // Defenders
  {
    id: 'def_tackling_1v1',
    title: 'Tackling — 1v1 defending channel',
    category: 'Defenders',
    equipment: ['Cones for channel', 'Ball supply', '1 attacker'],
    setup: ['Mark a 10m × 10m channel.', 'Standardize attacker starting position.'],
    procedure: ['Run 10 rounds.', 'Record challenges won (clean tackle or forced turnover).'],
    attempts: ['10 rounds'],
    dataToRecord: ['Challenges won (out of 10)'],
    commonMistakes: ['Inconsistent definition of “won”', 'Attacker intensity varies too much'],
    safety: ['Use controlled tackling rules to reduce injury risk.'],
    tags: ['tackling', '1v1', 'defending', 'out of 10']
  },
  {
    id: 'def_heading_clearance',
    title: 'Defensive Heading — safe zone clearance',
    category: 'Defenders',
    equipment: ['Feeder/server', 'Balls', 'Marked safe zone', 'Cones'],
    setup: ['Mark a safe clearance zone (distance + direction).', 'Use consistent delivery type.'],
    procedure: ['10 high serves.', 'Athlete heads ball into safe zone.', 'Record successful clearances.'],
    attempts: ['10 attempts'],
    dataToRecord: ['Clearances reaching safe zone (out of 10)'],
    commonMistakes: ['Safe zone not clearly defined', 'Inconsistent delivery'],
    safety: ['Limit heading volume for younger age groups; follow safeguarding policy.'],
    tags: ['defensive heading', 'clearance', 'safe zone', 'out of 10']
  },
  {
    id: 'def_positioning_clearances',
    title: 'Positioning / Clearances — cross-defense (coach score + clearance count)',
    category: 'Defenders',
    equipment: ['Cross server', 'Balls', 'Cones to mark safe zones', 'Stopwatch (optional)'],
    setup: ['Define safe zones clearly.', 'Coach uses a fixed rubric for body shape, scanning, positioning.'],
    procedure: [
      'Run 10 cross situations.',
      'Coach assigns a 1–10 positioning score using a consistent rubric.',
      'Record clearances to safe zone (out of 10).'
    ],
    attempts: ['10 cross situations'],
    dataToRecord: ['Coach score (1–10)', 'Clearances to safe zone (out of 10)'],
    commonMistakes: ['No rubric for coach score', 'Different number/quality of crosses per session'],
    safety: ['Control aerial collisions.', 'Ensure the crossing lane is clear.'],
    tags: ['positioning', 'clearances', 'cross defense', 'coach score']
  },
  {
    id: 'def_crossing_target',
    title: 'Crossing — penalty spot target box',
    category: 'Defenders',
    equipment: ['Balls', 'Cones to mark target box around penalty spot'],
    setup: ['Mark a target box around the penalty spot.', 'Standardize cross type (driven/lofted) if possible.'],
    procedure: ['Athlete delivers 10 crosses from wide areas.', 'Record those landing in target box.'],
    attempts: ['10 attempts'],
    dataToRecord: ['Crosses landing in target box (out of 10)'],
    commonMistakes: ['Target box changes size between sessions', 'Inconsistent starting position'],
    safety: ['Warm up hips/groin before repeated crossing.'],
    tags: ['crossing', 'fullback', 'target box', 'out of 10']
  },

  // Goalkeepers
  {
    id: 'gk_reflexes',
    title: 'Goalkeeper Reflexes — rapid-fire close range',
    category: 'Goalkeepers',
    equipment: ['Feeder', 'Tennis balls or volley shots', 'Goal'],
    setup: ['Feeder stands ~5m away.', 'Deliveries vary in height and direction.'],
    procedure: ['10 rapid deliveries.', 'Record saves/catches.'],
    attempts: ['10 attempts'],
    dataToRecord: ['Saves / catches (out of 10)'],
    commonMistakes: ['Inconsistent delivery pace', 'Counting parries as catches without a rule'],
    safety: ['Keep volume appropriate; prioritize safe landing and wrist prep.'],
    tags: ['goalkeeper', 'reflexes', 'rapid fire', 'out of 10']
  },
  {
    id: 'gk_handling',
    title: 'Goalkeeper Handling — clean catches (shots + crosses)',
    category: 'Goalkeepers',
    equipment: ['Ball supply', 'Shooter + crosser (or feeder)', 'Goal'],
    setup: ['Plan 5 shots + 5 crosses.', 'Define “clean catch” (no spill).'],
    procedure: ['GK must catch cleanly without spilling.', 'Record clean catches out of 10.'],
    attempts: ['10 attempts (5 shots + 5 crosses)'],
    dataToRecord: ['Clean catches (out of 10)'],
    commonMistakes: ['Mixing easy and very hard deliveries inconsistently between sessions'],
    safety: ['Warm up shoulders and wrists before high-volume handling.'],
    tags: ['goalkeeper', 'handling', 'crosses', 'shots', 'out of 10']
  },
  {
    id: 'gk_diving',
    title: 'Goalkeeper Diving / Reach — top corner saves',
    category: 'Goalkeepers',
    equipment: ['Shooter/feeder', 'Balls', 'Goal', 'Optional: target markers'],
    setup: ['GK starts central each rep.', 'Plan 10 attempts (5 left / 5 right).'],
    procedure: ['Deliver shots to top corners.', 'Record saves out of 10.'],
    attempts: ['10 attempts'],
    dataToRecord: ['Saves made (out of 10)'],
    commonMistakes: ['GK starting position drifts between reps', 'Unequal left/right distribution'],
    safety: ['Ensure safe landing surface and teach proper diving mechanics.'],
    tags: ['goalkeeper', 'diving', 'reach', 'out of 10']
  },
  {
    id: 'gk_distribution',
    title: 'Goalkeeper Distribution — drop-kick + throw into target grids',
    category: 'Goalkeepers',
    equipment: ['Target grids at 40m and 20m', 'Balls', 'Cones'],
    setup: ['Mark target grid at 40m for drop-kick and 20m for throw.', 'Define “in target” clearly.'],
    procedure: ['5 drop-kicks + 5 throws.', 'Record successful deliveries into target grids.'],
    attempts: ['10 attempts'],
    dataToRecord: ['Deliveries reaching target zone (out of 10)'],
    commonMistakes: ['Changing target size', 'Mixing technique (side-volley vs drop-kick) inconsistently'],
    safety: ['Warm up kicking leg and shoulder before max-distance distribution.'],
    tags: ['goalkeeper', 'distribution', 'drop-kick', 'throw', 'out of 10']
  }
];

