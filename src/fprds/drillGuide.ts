export type DrillGuideCategory = 'Base' | 'ForwardsWingers' | 'Midfielders' | 'Defenders' | 'Goalkeepers';

/**
 * Whether a goalkeeper is needed to run the drill.
 * - `required`  — the drill cannot be scored fairly without a GK in goal.
 * - `optional`  — a GK adds realism but the scoring works without one.
 * - `none`      — no goalkeeper involved; do not place one in goal.
 * - `athlete`   — the assessed player IS the goalkeeper.
 */
export type GoalkeeperRequirement = 'required' | 'optional' | 'none' | 'athlete';

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
  /** Everyone needed on the day, including the coach roles (timer, server, defender...). */
  personnel: string[];
  /** Goalkeeper requirement, surfaced prominently so coaches can plan staffing. */
  goalkeeper: { requirement: GoalkeeperRequirement; note: string };
  /** Exactly where the assessed player positions or starts each rep. */
  playerStart: string;
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
      '4 cones (2 at START, 1 at the 10m split, 1 at the 30m finish)',
      'Stopwatch (minimum) or timing gates (ideal)',
      'Measuring tape or pre-marked pitch lines'
    ],
    personnel: [
      '1 coach at the 30m finish with the stopwatch (records both times)',
      'Optional: a second timer at the 10m split for a more accurate split with stopwatches',
      'No other players are involved — run one athlete at a time'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — this is a pure running test (GKs also take it as athletes).' },
    playerStart: 'Standing split stance immediately behind the START line, front foot up to (not on) the line, body still. Same stance every attempt.',
    setup: [
      'Measure a straight 30m lane on flat, dry grass or turf — use the tape, do not pace it out.',
      'Place 2 cones as a START gate, 1 cone exactly at 10m, and 1 cone exactly at 30m.',
      'Leave at least 10m of clear run-off space beyond the 30m finish so athletes never brake before the line.',
      'Position the timing coach side-on to the 30m line so they can see the athlete cross it.'
    ],
    procedure: [
      'Run a full sprint warm-up first: 5 minutes of jogging and mobility, then 3–4 progressive accelerations (60% → 80% → 95%).',
      'Athlete takes the standing split stance behind the START line. No rolling or walking starts.',
      'Athlete starts on their own first movement — the timer starts the watch on that first movement, not on a "Go" call.',
      'Athlete sprints at maximum effort THROUGH the 30m line; coach records the 10m split as the torso passes the 10m cone and stops the watch as the torso crosses 30m.',
      'Athlete walks back slowly. Give 2–4 minutes of full rest, then repeat for the remaining attempts.',
      'Record every attempt on the sheet; enter the best 10m and best 30m time (they may come from different attempts).'
    ],
    attempts: ['3 attempts', 'Record best attempt', 'Rest 2–4 minutes between attempts'],
    dataToRecord: ['10m split (seconds)', '30m time (seconds)'],
    commonMistakes: [
      'Rolling start or inconsistent start stance between attempts',
      'Starting the watch on a "Go" call instead of first movement (adds reaction time noise)',
      'Stopping the watch early before the athlete crosses the line',
      'Too little recovery, causing slower second/third attempts'
    ],
    safety: ['Do a full sprint warm-up first (mobility + progressive accelerations).', 'Avoid slippery or uneven surfaces.', 'Keep the run-off zone clear of balls, bags, and other players.'],
    tags: ['sprint', '10m', '30m', 'pace', 'acceleration', 'time', 'cones']
  },
  {
    id: 'base_yoyo',
    title: 'Yo-Yo Intermittent Recovery Test',
    category: 'Base',
    attributeCode: 'STA',
    equipment: [
      'Cones to mark the start line, the 20m turn line, and the 5m recovery line behind the start',
      'Yo-Yo audio / beep track + a loud speaker',
      'Measuring tape',
      'Recording sheet listing shuttle distances'
    ],
    personnel: [
      '1 coach controlling the audio and tallying completed shuttles',
      'Optional: 1 assistant watching that feet touch the lines on every turn',
      'Several athletes can be tested at once — give each a 2m-wide lane'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — GKs take this test as athletes like everyone else.' },
    playerStart: 'Standing with the front foot on the start line, facing the 20m turn line. After each 2×20m shuttle, walk/jog around the 5m recovery cone and return to the same start line.',
    setup: [
      'Measure exactly 20m between the start line and the turn line — check with the tape, not by pacing.',
      'Place a recovery cone 5m BEHIND the start line (the active-recovery loop between shuttles).',
      'Mark a 2m-wide lane per athlete if testing a group.',
      'Test the speaker volume: the beeps must be clearly audible at the 20m line.'
    ],
    procedure: [
      'Explain the rules before starting: run 20m out and 20m back per beep cycle, then 10 seconds of walking recovery around the 5m cone.',
      'Athlete must reach each line ON or BEFORE the beep, touching the line with the foot.',
      'First failure to reach the line in time = a warning; second consecutive failure = test over (standard Yo-Yo IR1 rules).',
      'Coach ticks off each completed shuttle on the recording sheet as the test runs.',
      'When the athlete is out, record the last COMPLETED shuttle — total distance = completed shuttles × 40m.',
      'Walk the athlete through a 3–5 minute cool-down jog immediately after.'
    ],
    attempts: ['Single attempt (fatiguing test)', 'Use consistent warm-up, surface, and footwear each cycle'],
    dataToRecord: ['Total distance achieved (meters)'],
    commonMistakes: [
      'Inaccurate distance measurement (not exactly 20m)',
      'Letting athletes turn short of the line without a warning',
      'Starting too hard without pacing',
      'Speaker too quiet — athletes drift off the beep timing'
    ],
    safety: ['Hydrate before and after; cool down after the test.', 'Stop immediately if dizziness, chest pain, or sharp pain occurs.'],
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
    personnel: [
      '1 coach at the finish cone with the stopwatch',
      'Optional: 1 assistant resetting knocked cones between attempts',
      'Run one athlete at a time'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — pure change-of-direction test.' },
    playerStart: 'Lying face down (prone) at the start cone, chest on the ground, hands beside the shoulders, head behind the line. Same start every attempt.',
    setup: [
      'Mark a rectangle 10m long × 5m wide with 4 corner cones. Bottom-left = START, top-left = first turn, top-right = second turn, bottom-right = FINISH.',
      'Place 4 cones in a straight line up the middle of the rectangle, 3.3m apart — these are the weave cones.',
      'Walk the athlete through the route once at jogging pace: up the left side 10m, back to the middle, weave up and back through the 4 center cones, up the right side 10m, then down through the finish.',
      'Double-check all cone distances with the tape before the first timed run.'
    ],
    procedure: [
      'Athlete lies prone at the start cone in the standard position.',
      'On the coach\'s "Go", start the watch; athlete jumps up and sprints the standard route at maximum speed.',
      'Athlete must round every cone — a missed or cut cone voids the attempt (re-run it after full rest).',
      'Stop the watch as the athlete\'s torso passes the finish cone.',
      'Give 2–3 minutes of full rest, then run the second attempt.',
      'Record both times; enter the best attempt.'
    ],
    attempts: ['2 attempts', 'Record best attempt', 'Rest 2–3 minutes between attempts'],
    dataToRecord: ['Completion time (seconds)'],
    commonMistakes: [
      'Knocking cones and continuing without re-running the attempt',
      'Different route or missed weave cone across attempts',
      'Inconsistent start position (standing vs prone) between athletes'
    ],
    safety: ['Use a non-slip surface and proper footwear.', 'Warm up hips/ankles/knees before testing.', 'Keep the area around the course clear.'],
    tags: ['illinois', 'agility', 'change of direction', 'cones', 'time']
  },
  {
    id: 'base_power',
    title: 'Standing Broad Jump + Medicine Ball Throw',
    category: 'Base',
    attributeCode: 'STR',
    equipment: ['Tape measure laid flat along the jumping/throwing direction', 'Chalk/tape marker for the takeoff and throw lines', 'Medicine ball (3–5kg, matched to age group)'],
    personnel: [
      '1 coach spotting the landing/first-bounce point and reading the tape',
      'Optional: 1 assistant recording numbers so the coach never leaves the tape',
      'Run one athlete at a time'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — power test only.' },
    playerStart: 'Broad jump: toes just behind the takeoff line, feet shoulder-width apart. Med ball throw: same stance behind the throw line, ball held at the chest (chest pass) — keep the chosen technique identical for every athlete.',
    setup: [
      'Broad jump: mark a clear takeoff line on flat ground and lay the tape measure perpendicular to it, zero at the line.',
      'Medicine ball: mark a throw line and lay the tape out along the throwing direction, zero at the line.',
      'Decide ONE throw technique for the whole squad (seated or standing chest push recommended) and never mix techniques within a cycle.',
      'Keep 5m+ of clear space in the throwing direction.'
    ],
    procedure: [
      'Broad jump — athlete stands toes behind the line, swings arms and jumps off BOTH feet, landing on both feet under control.',
      'Measure from the takeoff line to the BACK of the nearest heel. If the athlete falls or steps back, the attempt is void — repeat it.',
      'Give 3 attempts with ~1 minute rest between; record the best.',
      'Medicine ball throw — athlete stands behind the throw line and pushes the ball from the chest with two hands (no run-up, no step over the line).',
      'Measure from the throw line to the FIRST bounce point.',
      'Give 3 attempts with ~1 minute rest between; record the best.'
    ],
    attempts: ['3 attempts for broad jump (record best)', '3 attempts for medicine ball throw (record best)'],
    dataToRecord: ['Broad jump distance (cm)', 'Medicine ball throw distance (cm)'],
    commonMistakes: [
      'Stepping over the line on takeoff or throw',
      'Changing throw technique between attempts or between athletes',
      'Measuring from the toes or the front of the foot instead of the nearest heel mark'
    ],
    safety: ['Emphasize soft, controlled landing mechanics to reduce joint stress.', 'Use an appropriate ball weight for the age group.', 'Nobody stands in the throwing lane.'],
    tags: ['broad jump', 'medicine ball', 'power', 'strength', 'distance']
  },
  {
    id: 'base_first_touch',
    title: 'Rebound Board Control / Wall Pass Grid',
    category: 'Base',
    attributeCode: 'FTH',
    equipment: ['Rebound board or flat wall', 'Tape or 4 cones for a 2m × 2m control grid', '1 good ball (reuse the same ball for consistency)'],
    personnel: [
      '1 coach serving the ball into the board and judging each control',
      'Optional: 1 assistant tallying so the coach can focus on consistent service',
      'If no board/wall is available, the coach serves firm ground passes directly instead'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — technique test only.' },
    playerStart: 'Standing inside the 2m × 2m grid, 5m from the rebound surface, facing the board, on the balls of the feet. The athlete must be back inside the grid and set before each serve.',
    setup: [
      'Mark a 2m × 2m control grid with tape or cones, its near edge exactly 5m from the rebound surface.',
      'Agree the success rule out loud before starting: the ball must be controlled to a playable position INSIDE the grid within 2 touches.',
      'Coach stands beside the grid with the ball supply, serving at a consistent firm pace.'
    ],
    procedure: [
      'Athlete sets up inside the grid; coach plays a firm pass into the board (or serves directly) so it rebounds toward the grid.',
      'Athlete receives the rebound and must control it to a playable position inside the grid — first touch kills the pace, second touch may adjust.',
      'A control is a SUCCESS only if the ball stays inside the grid and the athlete could immediately pass or dribble.',
      'A ball that escapes the grid, needs 3+ touches, or bounces off the athlete uncontrolled = FAIL.',
      'Reset fully between reps — athlete back inside the grid, set, before the next serve.',
      'Run 10 reps at the same service pace; call out the running score so the athlete knows where they stand.'
    ],
    attempts: ['10 attempts'],
    dataToRecord: ['Successful controls within grid (out of 10)'],
    commonMistakes: [
      'Inconsistent service speed between reps or athletes',
      'Not agreeing what “controlled” means before starting',
      'Letting the athlete drift out of the grid before the serve'
    ],
    safety: ['Keep the area clear of loose balls to avoid slips.'],
    tags: ['first touch', 'control', 'rebound', 'wall', 'grid', 'out of 10']
  },
  {
    id: 'base_short_passing',
    title: 'Target Gate Passing (10m)',
    category: 'Base',
    attributeCode: 'SPA',
    equipment: ['2 cones/poles forming a 1m-wide gate', 'Measuring tape', '10 balls lined up at the pass line'],
    personnel: [
      '1 coach standing level with the gate to judge each pass',
      'Optional: 1 ball retriever behind the gate to keep the drill moving',
      'Run one athlete at a time'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — passing accuracy only.' },
    playerStart: 'Behind the pass line, 10m from the gate, with each ball stationary on the line before striking. One or two steps of approach maximum.',
    setup: [
      'Measure exactly 10m from the pass line to the gate and set the gate exactly 1m wide (check with the tape every session).',
      'Line up the 10 balls along the pass line so reps flow quickly.',
      'Agree the cone rule out loud before starting (recommended: ball through the gate on the ground or below knee height = success; clipping a cone but going through still counts).'
    ],
    procedure: [
      'Athlete addresses the first stationary ball behind the line.',
      'Athlete passes along the ground aiming through the 1m gate — both feet allowed unless your program specifies one.',
      'Coach calls SUCCESS or MISS immediately after each pass using the agreed rule.',
      'Move straight to the next ball; keep a steady rhythm, roughly one pass every 10–15 seconds.',
      'After 10 passes, total the successes and record the score.'
    ],
    attempts: ['10 attempts'],
    dataToRecord: ['Successful passes through gate (out of 10)'],
    commonMistakes: [
      'Gate width drifting between sessions — always re-measure',
      'No agreed rule for passes that clip a cone',
      'Allowing moving balls or long run-ups for some athletes and not others'
    ],
    safety: ['Ensure the athlete is warmed up to reduce groin/hip strain.'],
    tags: ['short passing', 'gate', '10m', 'accuracy', 'out of 10']
  },

  // Forwards / Wingers
  {
    id: 'fw_finishing_box',
    title: 'Finishing (Box) — 6-ball rapid fire',
    category: 'ForwardsWingers',
    equipment: ['6 balls', 'Full-size goal', '6 cones to mark the ball positions', 'Optional: tape/cones marking target zones inside the goal'],
    personnel: [
      '1 GOALKEEPER in goal — required, otherwise “goals” and “on target” are the same number',
      '1 coach beside the goal recording goals and on-target shots',
      'Optional: 1 assistant re-spotting balls for the next athlete'
    ],
    goalkeeper: { requirement: 'required', note: 'A goalkeeper of appropriate level MUST be in goal — the score uses goals vs on-target, which is meaningless against an empty net. Use the same GK for every athlete in the session.' },
    playerStart: 'On a start cone at the top of the penalty arc (“D”), facing the goal. The athlete attacks the 6 balls in a fixed order: left → center → right → left → center → right.',
    setup: [
      'Place 6 balls on cones around the penalty area: 2 in the left channel, 2 central, 2 in the right channel, all between 10m and 14m from goal.',
      'Number/agree the attack order before starting so every athlete runs the same sequence.',
      'Standardize allowed touches for the whole squad: 1-touch, or 2-touch maximum (settle + strike).',
      'Brief the goalkeeper: normal effort saves, stay on the line until the athlete moves to each ball.',
      'Agree "on target" out loud: any shot the GK saves or that enters the goal counts as on target; wide/over = off target.'
    ],
    procedure: [
      'Athlete starts at the penalty-arc cone. On the coach\'s "Go", they sprint to ball 1 and finish first-time (or within 2 touches).',
      'Immediately after each shot, the athlete turns and attacks the next ball in the agreed order — no walking between balls.',
      'Goalkeeper resets to the goal line between shots; the coach records each shot as GOAL, SAVED (on target), or OFF TARGET.',
      'The run ends after all 6 shots; a good run takes roughly 30–45 seconds.',
      'Record two numbers: goals (out of 6) and on-target (out of 6). A goal always also counts as on target.',
      'If running 2 runs for confidence, give 3+ minutes rest and re-spot all 6 balls identically; record the best run.'
    ],
    attempts: ['1 run (6 shots)', 'Optional: 2 runs and record best, if you want higher confidence'],
    dataToRecord: ['Goals (out of 6)', 'On-target (out of 6)'],
    commonMistakes: [
      'Running the drill without a goalkeeper — the goals metric becomes meaningless',
      'Different GK quality/effort between athletes in the same session',
      'Ball positions or attack order changing between athletes',
      'Unclear definition of “on target”'
    ],
    safety: ['Check the shooting lane is clear of other players before every run.', 'GK should be warmed up before facing rapid-fire shots.'],
    tags: ['finishing', 'box', 'shooting', '6-ball', 'on target', 'goals']
  },
  {
    id: 'fw_shot_power',
    title: 'Shot Power / Long Shots — max controlled distance',
    category: 'ForwardsWingers',
    equipment: ['Full-size goal', 'Cones marking 20m / 25m / 30m / 35m / 40m from the goal line', 'At least 5 balls', 'Measuring tape or pitch lines'],
    personnel: [
      '1 coach standing beside the goal judging on-target and control',
      'Optional: 1 ball retriever behind the goal',
      'Run one athlete at a time'
    ],
    goalkeeper: { requirement: 'none', note: 'Use an EMPTY goal — a keeper would block shots and corrupt the distance measurement. This test scores controlled striking distance, not beating a GK.' },
    playerStart: 'Behind the ball at the current distance marker, central to the goal, with a straight run-up of 3–5 steps. Ball stationary on the marker for every attempt.',
    setup: [
      'Mark shooting spots on the pitch centerline at 20m, 25m, 30m, 35m, 40m from the goal line (use pitch lines where possible).',
      'Agree "controlled and on target" before starting (recommended: struck cleanly, enters the goal below crossbar height without bouncing more than once).',
      'Stack the ball supply at each marker so reps flow.'
    ],
    procedure: [
      'Athlete starts at the 20m marker and strikes a stationary ball at the goal.',
      'Give up to 3 attempts at each distance; 2 controlled on-target strikes out of 3 = distance PASSED.',
      'On a pass, move back to the next marker (25m, 30m, ...) and repeat with the same rules.',
      'The test ends at the first distance the athlete fails; record the last distance PASSED as the result.',
      'Keep attempt counts identical for every athlete — do not give extras to anyone.',
      'Allow ~30 seconds between strikes to keep quality high.'
    ],
    attempts: ['Up to 3 attempts per distance; 2/3 controlled on-target = passed', 'Keep the attempt rule identical across athletes'],
    dataToRecord: ['Max controlled on-target distance (meters)'],
    commonMistakes: [
      'Counting a wild slice as “power” despite lack of control',
      'Putting a goalkeeper in goal (blocks valid strikes)',
      'Different ball pressure or wet-ball conditions between athletes',
      'Uneven attempt counts per distance'
    ],
    safety: ['Cap total strikes (~15) for younger athletes to avoid overuse.', 'Full lower-body warm-up before max striking.'],
    tags: ['shot power', 'long shots', 'distance', 'meters']
  },
  {
    id: 'fw_offensive_1v1',
    title: 'Offensive 1v1 — attack channel',
    category: 'ForwardsWingers',
    equipment: ['Cones marking a 10m wide × 15m long channel', 'Ball supply (5+ balls)', 'Cones for the attacker and defender start positions', 'Optional: small goal or end-line gate'],
    personnel: [
      '1 consistent DEFENDER (same player, same instructed intensity for every athlete)',
      '1 coach on the sideline timing the 10-second window and recording outcomes',
      'A goalkeeper only if your success rule is "shot on goal" (see goalkeeper note)'
    ],
    goalkeeper: { requirement: 'optional', note: 'Not needed with the recommended rule (beat the defender over the end line). Only add a GK if you define success as a shot on goal — then use the same GK for all athletes.' },
    playerStart: 'Attacker (assessed player) starts on a cone at one end line of the channel. The DEFENDER starts on the opposite end line and passes the ball firmly to the attacker to trigger each rep.',
    setup: [
      'Mark a 10m × 15m channel with cones, plus a start cone centered on each end line.',
      'Brief the defender: press at match intensity after their entry pass, defend honestly, no fouling — identical effort for every athlete and every rep.',
      'Agree the success rule out loud (recommended: attacker beats the defender and carries the ball under control over the far end line within 10 seconds).',
      'Stack spare balls at the defender\'s end so resets are fast.'
    ],
    procedure: [
      'Defender passes firmly from their end line to the attacker\'s feet — this pass starts the rep and the coach\'s 10-second count.',
      'Defender closes down immediately after passing; attacker tries to beat them 1v1 inside the channel.',
      'SUCCESS = attacker crosses the far end line with the ball under control (or completes your agreed alternative) within 10 seconds.',
      'FAIL = defender wins the ball, the ball leaves the channel, or 10 seconds expire.',
      'Reset both players to their start cones between reps; give the attacker ~45 seconds recovery so late reps aren\'t fatigue-limited.',
      'Run 10 reps and record successes; swap in a fresh defender only between athletes, never mid-assessment.'
    ],
    attempts: ['10 attempts'],
    dataToRecord: ['Successful take-ons (out of 10)'],
    commonMistakes: [
      'Defender intensity varying between reps or athletes',
      'No clear “success” rule agreed before starting',
      'Reps starting from a dribble instead of the standard entry pass',
      'No recovery between reps — later reps measure stamina, not 1v1 skill'
    ],
    safety: ['Enforce controlled defending (no slide tackles) to reduce contact injury.'],
    tags: ['1v1', 'take-on', 'dribbling', 'channel', 'out of 10']
  },
  {
    id: 'fw_attacking_heading',
    title: 'Attacking Heading — target zones',
    category: 'ForwardsWingers',
    equipment: ['Full-size goal with tape/cones marking two target zones (bottom corners recommended)', 'Ball supply (10+ balls)', 'Cone marking the crossing point', 'Cone marking the athlete\'s start spot'],
    personnel: [
      '1 SERVER delivering consistent crosses (hand-serve or short-range cross — same delivery all session)',
      '1 coach beside the goal judging target-zone hits',
      'No defender is used — this isolates heading technique'
    ],
    goalkeeper: { requirement: 'none', note: 'Leave the goal empty and mark target zones instead — a GK would turn this into a duel and break score comparability.' },
    playerStart: 'On a cone at the penalty spot, facing the crossing point. Before each delivery the athlete makes a short 2–3m move (check-away then attack) and meets the ball between the penalty spot and the 6-yard box.',
    setup: [
      'Mark the crossing point wide, level with the edge of the penalty area, ~20m from the athlete.',
      'Mark two target zones in the goal with tape or cones (recommended: the bottom corners, 1.5m in from each post) — headers there are the hardest to save in a match.',
      'Choose ONE delivery type for the whole session: underarm hand-serve (most consistent, best for U15 and below) or a floated cross from the ground.',
      'Agree scoring out loud: header on goal into a marked zone = 1 point; on target outside the zones = note it but no point (or use your program\'s variant — just keep it fixed).'
    ],
    procedure: [
      'Server signals, athlete makes the short check-away move, and the server delivers the cross toward the space between penalty spot and 6-yard box.',
      'Athlete attacks the ball and heads for a target zone.',
      'Coach records each header as ZONE HIT, ON TARGET, or MISS.',
      'If the delivery is poor (behind the athlete, too high, bouncing), the rep does NOT count — re-serve it.',
      'Reset to the start cone between headers; keep ~30 seconds between reps.',
      'Run 10 counted deliveries and total the zone hits.'
    ],
    attempts: ['10 attempts (only clean deliveries count)'],
    dataToRecord: ['On-target headers / headers into target zones (out of 10)'],
    commonMistakes: [
      'Inconsistent cross quality — always re-serve bad deliveries instead of counting them',
      'Counting a scuffed contact that dribbles into a zone as a full success without an agreed rule',
      'Athlete starting flat-footed on the spot instead of attacking the ball'
    ],
    safety: ['Limit heading volume for younger age groups and follow your local safeguarding policy.', 'Use a properly inflated (not overinflated) ball.'],
    tags: ['heading', 'attacking heading', 'cross', 'out of 10']
  },

  // Midfielders
  {
    id: 'mid_long_passing',
    title: 'Long Passing — 30m/40m into 5×5m target zone',
    category: 'Midfielders',
    equipment: ['4+ cones marking a 5m × 5m target zone', 'Cones marking the 30m and 40m pass lines', 'Measuring tape', '10 balls at the pass lines'],
    personnel: [
      '1 coach standing NEXT TO the target zone to judge landings (the pass line is too far away to judge accurately)',
      'Optional: 1 assistant at the pass line managing balls and tallying',
      'Run one athlete at a time'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — passing range and accuracy only.' },
    playerStart: 'Behind the 30m line for the first 5 attempts, then behind the 40m line for the last 5. Ball stationary, maximum 3-step approach, same for every athlete.',
    setup: [
      'Mark a 5m × 5m target zone and measure pass lines at exactly 30m and 40m from its NEAR edge.',
      'Lay 5 balls at each pass line before starting.',
      'Agree the landing rule out loud: the ball\'s FIRST bounce must be inside the zone (a ball first bouncing outside and rolling in = miss).',
      'Position the judging coach beside the zone, out of the flight path.'
    ],
    procedure: [
      'Athlete plays 5 lofted or driven passes from the 30m line, one at a time, aiming to land the first bounce inside the zone.',
      'The coach at the zone calls IN or OUT immediately after each ball lands.',
      'After 5 attempts, the athlete moves back to the 40m line and plays the remaining 5 with the same rule.',
      'Keep ~30 seconds between attempts so each strike is a quality action.',
      'Record 30m successes (out of 5) and 40m successes (out of 5) separately — the app weights 40m higher.'
    ],
    attempts: ['10 attempts total (5 at 30m, then 5 at 40m)'],
    dataToRecord: ['30m successes (out of 5)', '40m successes (out of 5)'],
    commonMistakes: [
      'Target zone size or pass-line distance drifting between sessions',
      'Counting a ball that bounces outside and rolls in as a success',
      'Judging landings from the pass line instead of beside the zone'
    ],
    safety: ['Warm up groin and hamstrings before repeated long striking.'],
    tags: ['long passing', '30m', '40m', 'target zone', 'out of 5']
  },
  {
    id: 'mid_vision_rondo',
    title: 'Vision / Playmaking — 4v2 rondo coach score',
    category: 'Midfielders',
    equipment: ['4 cones marking a 10m × 10m grid', 'Ball supply (4+ balls at the coach\'s feet for fast restarts)', 'Bibs to mark the 2 defenders', 'Rubric card / notepad for scoring'],
    personnel: [
      '6 players total: the assessed player + 3 teammates on the outside, 2 defenders inside',
      '1 coach OUTSIDE the grid doing nothing but observing and scoring the assessed player',
      'Rotate the 2 defenders every 2 minutes so pressure stays honest'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — possession game.' },
    playerStart: 'The assessed player is ONE OF THE 4 possession players, positioned on a side of the grid. They stay in the possession team for the whole scoring window (they do not go in the middle, even after losing the ball).',
    setup: [
      'Mark a 10m × 10m grid; place one possession player on each side, 2 defenders inside.',
      'Write the scoring rubric BEFORE the session and use the same card every time. Recommended 4 criteria, 0–2.5 points each: scanning before receiving, line-breaking passes through the defenders, first-touch direction, decision speed under pressure.',
      'Brief all players: normal rondo rules, 1–2 touch if age-appropriate; the assessed player is never sent into the middle during their window.',
      'Keep spare balls at the coach\'s feet so a ball out of play restarts within 3 seconds.'
    ],
    procedure: [
      'Play a continuous 4v2 rondo for a fixed 10-minute window.',
      'The coach watches ONLY the assessed player and tallies rubric events (e.g. tick each scan, each line-breaking pass, each poor decision).',
      'When possession breaks down, swap the defender who has been in longest with a non-assessed outside player — the assessed player stays outside.',
      'At the end of the window, convert the rubric tallies to a 1–10 score using the fixed criteria.',
      'To assess several midfielders, run a fresh 10-minute window per player — never score two players in the same window.'
    ],
    attempts: ['Single 10-minute scoring window per athlete'],
    dataToRecord: ['Coach score (1–10)'],
    commonMistakes: [
      'Scoring by feel with no written rubric',
      'Watching the game instead of only the assessed player',
      'Different grid size, touch limits, or window length between sessions',
      'Sending the assessed player into the middle, wasting the scoring window'
    ],
    safety: ['Keep intensity appropriate; pause if fatigue degrades technique.'],
    tags: ['vision', 'playmaking', 'rondo', '4v2', 'coach score']
  },
  {
    id: 'mid_ball_retention',
    title: 'Ball Retention — 3×3m shielding',
    category: 'Midfielders',
    equipment: ['4 cones marking a 3m × 3m grid', 'Stopwatch', '1 ball'],
    personnel: [
      '1 consistent DEFENDER applying honest, controlled pressure (same defender and intensity for every athlete)',
      '1 coach outside the grid with the stopwatch'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — shielding duel only.' },
    playerStart: 'Assessed player starts in the CENTER of the grid with the ball at their feet. The defender starts on the middle of one grid edge, ~1.5m away.',
    setup: [
      'Mark a tight 3m × 3m grid with cones.',
      'Brief the defender: win the ball with honest body pressure and pokes, no fouling, no wrestling — identical intensity for every athlete.',
      'Agree the end conditions out loud: rep ends when the defender touches the ball OUT of the athlete\'s control, or the ball leaves the grid, or the athlete steps out with the ball.'
    ],
    procedure: [
      'On the coach\'s "Go", start the watch; the defender engages immediately.',
      'The athlete shields, turns, and rolls the ball inside the grid to keep possession as long as possible — no time limit.',
      'Stop the watch at the first end condition (defender wins it, ball out, or athlete out).',
      'Record the time, give BOTH players 60–90 seconds rest (shielding is maximal work), and repeat.',
      'Run 3 reps and record the best time.'
    ],
    attempts: ['3 attempts; record best', 'Rest 60–90 seconds between attempts'],
    dataToRecord: ['Best time retained (seconds)'],
    commonMistakes: [
      'Defender easing off (inflated times) or fouling (deflated times)',
      'Starting the watch after the first contact instead of on "Go"',
      'Grid drifting larger than 3×3m, which makes retention far easier'
    ],
    safety: ['No slide tackles or shirt-pulling; stop the rep on any fall.', 'Rest the defender too — their fatigue changes later athletes\' scores.'],
    tags: ['ball retention', 'shielding', '3x3', 'seconds']
  },
  {
    id: 'mid_pressing_cage',
    title: 'Pressing / Interceptions — 3v1 pressing cage',
    category: 'Midfielders',
    equipment: ['4 cones marking an 8m × 8m grid', 'Ball supply (3+ balls)', 'Stopwatch', 'Bib for the presser'],
    personnel: [
      '4 players total: 3 possession players on the grid edges + the assessed player pressing inside',
      '1 coach outside the grid timing rounds and judging wins',
      'Use possession players of similar level for every assessed athlete'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — pressing game.' },
    playerStart: 'The assessed player starts in the CENTER of the grid. The 3 possession players stand on three sides of the grid; the ball starts with any outside player, and the coach\'s "Play" starts the round.',
    setup: [
      'Mark an 8m × 8m grid; smaller = easier for the presser, so keep the size fixed across the squad.',
      'Brief the 3 possession players: keep the ball with maximum 2 touches each, honest effort, stay on your grid edge.',
      'Agree what a WIN is out loud (recommended: the presser touches the ball, forces a pass out of the grid, or forces a control error that leaves the grid).',
      'Fix the round length: 30 seconds per round.'
    ],
    procedure: [
      'On "Play", the possession trio keeps the ball while the assessed player presses alone inside the grid.',
      'A round ends as a WIN the moment the presser touches the ball or forces it out of the grid; it ends as a LOSS if 30 seconds pass with possession kept.',
      'After each round, give the presser 60 seconds rest — pressing is maximal-intensity work and short rests wreck later rounds.',
      'Restart each round with the ball on a different grid side for variety, but keep 2-touch and 30-second rules constant.',
      'Run 5 rounds and record wins out of 5.'
    ],
    attempts: ['5 rounds of 30 seconds', 'Rest ~60 seconds between rounds'],
    dataToRecord: ['Times ball won back (out of 5)'],
    commonMistakes: [
      'Rounds varying in length or touch rules',
      'Possession players easing off or showboating — brief them on honest effort',
      'Recording “forced error” inconsistently — agree it before round 1',
      'Insufficient rest, so rounds 4–5 measure fatigue instead of pressing skill'
    ],
    safety: ['Monitor fatigue; pressing is high-intensity.', 'Controlled challenges only inside the tight grid.'],
    tags: ['pressing', 'interceptions', '3v1', 'wins', 'out of 5']
  },

  // Defenders
  {
    id: 'def_tackling_1v1',
    title: 'Tackling — 1v1 defending channel',
    category: 'Defenders',
    equipment: ['Cones marking a 10m wide × 10m long channel', 'Ball supply (5+ balls)', 'Start cones on both end lines', 'Optional: 2 cones forming a 2m gate on the defender\'s end line as the attacker\'s target'],
    personnel: [
      '1 consistent ATTACKER at match intensity (same attacker for every assessed defender in the session)',
      '1 coach on the sideline recording outcomes'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — the duel is the test.' },
    playerStart: 'The assessed DEFENDER starts on a cone on their end line. The attacker starts on the opposite end line. The defender passes the ball firmly to the attacker to trigger each rep, then closes down immediately — this standardizes the closing distance every rep.',
    setup: [
      'Mark a 10m × 10m channel with a start cone centered on each end line; optionally add a 2m target gate on the defender\'s end line.',
      'Brief the attacker: attack the gate/end line at honest match pace every rep — no easing off for weaker defenders.',
      'Agree what WON means out loud (recommended: clean tackle winning possession, forcing the ball out of the channel, or forcing a turnover — jockeying that merely delays is not a win).'
    ],
    procedure: [
      'Defender plays a firm pass from their end line to the attacker\'s feet — the rep starts on this pass.',
      'Defender sprints out to close down, then defends the 1v1 as the attacker tries to reach the defender\'s end line (or gate).',
      'The coach records WON (clean tackle / ball out / turnover forced) or LOST (attacker crosses the line under control).',
      'Reset both players to their start cones; give the defender ~45 seconds between reps.',
      'Run 10 reps and record challenges won out of 10.'
    ],
    attempts: ['10 rounds', 'Rest ~45 seconds between rounds'],
    dataToRecord: ['Challenges won (out of 10)'],
    commonMistakes: [
      'Inconsistent definition of “won” — agree it before rep 1',
      'Attacker intensity varying between defenders being assessed',
      'Skipping the standard entry pass so closing distance varies every rep'
    ],
    safety: ['Controlled tackling rules — no slide tackles from behind, no lunging.', 'Stop the rep immediately on any tangle of legs.'],
    tags: ['tackling', '1v1', 'defending', 'out of 10']
  },
  {
    id: 'def_heading_clearance',
    title: 'Defensive Heading — safe zone clearance',
    category: 'Defenders',
    equipment: ['Ball supply (10+ balls)', 'Cones marking the SAFE ZONE (wide areas beyond 15m from goal, both sides)', 'Cone marking the server\'s spot', 'Cone marking the defender\'s start spot'],
    personnel: [
      '1 SERVER delivering consistent high balls (underarm/javelin throw is most consistent; a lofted kick if throws can\'t reach)',
      '1 coach judging where each clearance lands'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — the defender\'s clearance is the only action scored.' },
    playerStart: 'Defender starts on a cone at the near edge of the 6-yard box, goal-side, facing the server. Before each serve the defender takes one look over the shoulder (scan), then attacks the dropping ball.',
    setup: [
      'Mark the safe zone with cones: everything WIDE of the penalty area and/or beyond 15m from goal counts as safe; anything central and short is a danger zone.',
      'Place the server 20–25m from the defender, simulating a cross or long throw trajectory.',
      'Choose the serve type once and keep it identical all session.',
      'Agree scoring out loud: a header that FIRST LANDS in the safe zone = success; central, short, or backward headers = fail.'
    ],
    procedure: [
      'Server calls "Ball!", then delivers a high ball dropping between the defender\'s start spot and the penalty spot.',
      'Defender attacks the ball at its highest reachable point and heads it toward the safe zone — height and distance both matter.',
      'Coach records SAFE or DANGER based on where the ball first lands.',
      'Poor serves (short, wide, flat) do not count — re-serve them.',
      'Reset to the start cone between reps; roughly 30 seconds between serves.',
      'Run 10 counted serves and total the safe-zone clearances.'
    ],
    attempts: ['10 attempts (only clean serves count)'],
    dataToRecord: ['Clearances reaching safe zone (out of 10)'],
    commonMistakes: [
      'Safe zone not physically marked, so judging drifts rep to rep',
      'Inconsistent delivery type or trajectory',
      'Counting weak flick-ons that land centrally as clearances'
    ],
    safety: ['Limit heading volume for younger age groups; follow safeguarding policy.', 'Properly inflated ball; no other players in the landing area.'],
    tags: ['defensive heading', 'clearance', 'safe zone', 'out of 10']
  },
  {
    id: 'def_positioning_clearances',
    title: 'Positioning / Clearances — cross-defense (coach score + clearance count)',
    category: 'Defenders',
    equipment: ['Ball supply (10+ balls)', 'Cones marking the crossing point(s)', 'Cones marking the safe zones (wide of the box, both sides)', 'Rubric card for the positioning score', 'Full-size goal and penalty area'],
    personnel: [
      '1 CROSSER delivering consistent crosses from the marked point',
      '1 coach behind the goal scoring positioning on the rubric and recording clearances',
      'Recommended: 1 passive ATTACKER making near-post runs (adds realism; walk-through pace, no jumping duels)',
      'Optional: a goalkeeper for realism only'
    ],
    goalkeeper: { requirement: 'optional', note: 'A GK adds realism (the defender must judge which balls to leave) but is NOT required — the scores are the defender\'s positioning and clearances. If used, brief the GK to claim only balls clearly theirs.' },
    playerStart: 'Defender starts marking the near-post space: on a cone at the near edge of the goal area, goal-side and ball-side, open body shape so they can see both the crosser and the (optional) attacker.',
    setup: [
      'Mark one crossing point wide on the right, level with the penalty area edge (add a mirrored left point if you want both-side data — then use 5 crosses per side).',
      'Mark the safe zones with cones: wide of the penalty area on both sides.',
      'Write the positioning rubric before the session; recommended 5 checkpoints worth 2 points each: goal-side start, ball-side body shape, scanning before the cross, movement to attack the ball early, first-contact quality.',
      'Brief the crosser: consistent in-swinging or driven crosses toward the space between 6-yard box and penalty spot — same type all session.'
    ],
    procedure: [
      'Defender takes their start position; the optional attacker starts at the penalty spot.',
      'Crosser calls "Ball!" and delivers; the defender adjusts position, attacks the ball, and clears toward a safe zone.',
      'After each cross the coach: (1) ticks the rubric checkpoints hit, and (2) records the clearance as SAFE ZONE or NOT.',
      'Poor crosses (behind the defender, overhit) do not count — re-deliver.',
      'Reset all players to their start cones between crosses; ~30–45 seconds between reps.',
      'Run 10 counted crosses; total the clearances (out of 10) and convert the rubric ticks to the 1–10 positioning score.'
    ],
    attempts: ['10 cross situations (only clean deliveries count)'],
    dataToRecord: ['Coach score (1–10)', 'Clearances to safe zone (out of 10)'],
    commonMistakes: [
      'No written rubric for the positioning score',
      'Different number or quality of crosses per athlete',
      'Letting the optional attacker contest at full intensity — this becomes a duel test, not a positioning test'
    ],
    safety: ['Control aerial situations — the optional attacker never jumps into the defender.', 'Keep the crossing lane clear.'],
    tags: ['positioning', 'clearances', 'cross defense', 'coach score']
  },
  {
    id: 'def_crossing_target',
    title: 'Crossing — penalty spot target box',
    category: 'Defenders',
    equipment: ['10 balls', '4 cones marking a 6m × 6m target box centered on the penalty spot', 'Cone marking the crossing start point', 'Cone marking the delivery zone'],
    personnel: [
      '1 coach standing near the target box judging landings',
      'Optional: 1 ball retriever in the box area',
      'Run one athlete at a time'
    ],
    goalkeeper: { requirement: 'none', note: 'No goalkeeper involved — the ball must LAND in the target box; a GK would catch valid deliveries.' },
    playerStart: 'Wide channel, on a start cone ~30m from the goal line. The athlete dribbles at pace toward the end line and must deliver the cross from inside a marked delivery zone (last 10m before the end line), before reaching the end line.',
    setup: [
      'Mark a 6m × 6m target box centered on the penalty spot with 4 cones (same size every session).',
      'Mark the start cone ~30m from the goal line in the wide channel, and a delivery zone covering the final 10m of the channel.',
      'Decide the cross type for the session (lofted or driven) and whether alternating feet/sides is required — keep it fixed across athletes.',
      'Line up the 10 balls at the start cone.'
    ],
    procedure: [
      'Athlete dribbles from the start cone at match pace into the delivery zone.',
      'Athlete crosses first-time or after one settling touch, aiming to LAND the ball inside the target box.',
      'The coach calls IN (first bounce inside the box) or OUT.',
      'A cross delivered from outside the delivery zone, or after the ball crosses the end line, does not count — repeat that ball.',
      'Athlete jogs back; keep ~45 seconds between reps.',
      'Run 10 counted crosses and total the INs. If assessing both feet, run 5 from each side and note them separately.'
    ],
    attempts: ['10 attempts (only crosses delivered from the marked zone count)'],
    dataToRecord: ['Crosses landing in target box (out of 10)'],
    commonMistakes: [
      'Target box size changing between sessions',
      'Crossing from a standing ball instead of off the dribble — decide one protocol and keep it',
      'Counting balls that bounce outside and roll through the box'
    ],
    safety: ['Warm up hips/groin before repeated crossing.', 'Keep the landing area clear of other players.'],
    tags: ['crossing', 'fullback', 'target box', 'out of 10']
  },

  // Goalkeepers
  {
    id: 'gk_reflexes',
    title: 'Goalkeeper Reflexes — rapid-fire close range',
    category: 'Goalkeepers',
    equipment: ['Full-size goal', '10+ balls staged at the feeder\'s feet', 'Cone marking the feeder\'s spot ~6m from the goal line', 'Optional: tennis balls for advanced hand-speed variation'],
    personnel: [
      'The assessed GOALKEEPER (the athlete being tested)',
      '1 FEEDER delivering firm, varied strikes or throws from 6m',
      'Optional: 1 assistant tallying so the feeder keeps a steady rhythm'
    ],
    goalkeeper: { requirement: 'athlete', note: 'The assessed player IS the goalkeeper. The feeder is an outfield server, not a second GK.' },
    playerStart: 'GK starts in the center of the goal, 1m off the line, in the set position (feet shoulder-width, weight on the balls of the feet, hands ready) — reset to this exact spot and stance before EVERY delivery.',
    setup: [
      'Place the feeder\'s cone ~6m from the goal line, central.',
      'Stage 10 balls at the feeder\'s feet so the sequence flows without pauses.',
      'Plan the delivery mix in advance and keep it identical for every GK (recommended: 3 low, 3 mid-height, 2 high, 2 at the body — mixed order, firm pace).',
      'Agree scoring out loud: CLEAN CATCH or a PARRY pushed wide of the goal frame = save; a parry that stays in front of goal or any ball in the net = no save.'
    ],
    procedure: [
      'GK takes the set position; feeder confirms they are set before each delivery.',
      'Feeder strikes or throws firmly on goal, varying height and corner per the planned mix.',
      'Deliver at a steady rhythm — roughly one ball every 4–6 seconds so the GK must reset fast but is never blindsided.',
      'Coach/assistant records each delivery as SAVE or GOAL using the agreed rule.',
      'Deliveries clearly off target do not count — re-deliver them.',
      'Run 10 counted deliveries and total the saves.'
    ],
    attempts: ['10 attempts (off-target deliveries are re-served)'],
    dataToRecord: ['Saves / catches (out of 10)'],
    commonMistakes: [
      'Delivery pace or mix varying between goalkeepers',
      'Counting parries straight back into the danger zone as saves',
      'Firing the next ball before the GK is set — that tests scrambling, not reflexes'
    ],
    safety: ['Warm up hands, wrists, and shoulders before rapid-fire work.', 'Keep pace age-appropriate; prioritize safe landings.'],
    tags: ['goalkeeper', 'reflexes', 'rapid fire', 'out of 10']
  },
  {
    id: 'gk_handling',
    title: 'Goalkeeper Handling — clean catches (shots + crosses)',
    category: 'Goalkeepers',
    equipment: ['Full-size goal', '10+ balls', 'Cone marking the shooting spot (~16m, central)', 'Cone marking the crossing point (wide, level with the penalty area edge)'],
    personnel: [
      'The assessed GOALKEEPER (the athlete being tested)',
      '1 SHOOTER for the 5 shots and 1 CROSSER for the 5 crosses (can be the same person changing position between phases)',
      '1 coach recording clean catches'
    ],
    goalkeeper: { requirement: 'athlete', note: 'The assessed player IS the goalkeeper. Servers are outfield players.' },
    playerStart: 'Shots phase: GK central, ~1m off the goal line, set position before each shot. Crosses phase: GK starts on the front third of the goal area (near the front post area), open stance so they can see the crosser — reset there before every cross.',
    setup: [
      'Mark the shooting spot ~16m out, central, and the crossing point wide, level with the penalty area edge.',
      'Brief the servers: shots at catchable pace ON TARGET at mid-height (this tests handling, not diving reach); crosses floated to drop between the 6-yard line and penalty spot.',
      'Agree "clean catch" out loud: ball secured to the chest at the first attempt, no double-grab, no spill — parries and second grabs are NOT clean.',
      'Plan the fixed sequence: 5 shots first, then 5 crosses.'
    ],
    procedure: [
      'Phase 1 — SHOTS: shooter strikes 5 on-target, mid-height balls from 16m, one every ~15 seconds; GK resets to center-set before each.',
      'Coach records each as CLEAN CATCH or NOT.',
      'Phase 2 — CROSSES: crosser floats 5 deliveries into the zone between 6-yard line and penalty spot; GK starts from the cross-start position, judges, attacks, and catches at the highest point.',
      'Coach records each as CLEAN CATCH or NOT.',
      'Off-target shots or crosses that miss the target zone do not count — re-serve.',
      'Total the clean catches out of 10 (note shots vs crosses separately for coaching feedback).'
    ],
    attempts: ['10 attempts (5 shots + 5 crosses; only valid deliveries count)'],
    dataToRecord: ['Clean catches (out of 10)'],
    commonMistakes: [
      'Mixing easy floaters and screamers inconsistently between sessions',
      'Counting a juggled double-grab as a clean catch',
      'Crosses delivered too close to the goal line, becoming unwinnable'
    ],
    safety: ['Warm up shoulders and wrists before high-volume handling.', 'No attackers challenging the GK during catches.'],
    tags: ['goalkeeper', 'handling', 'crosses', 'shots', 'out of 10']
  },
  {
    id: 'gk_diving',
    title: 'Goalkeeper Diving / Reach — top corner saves',
    category: 'Goalkeepers',
    equipment: ['Full-size goal', '10+ balls', 'Cone marking the serving spot ~12m out, central', 'Optional: target markers hung/taped in the top corners'],
    personnel: [
      'The assessed GOALKEEPER (the athlete being tested)',
      '1 SERVER who can strike or throw accurately toward the top corners (a consistent thrower beats an inconsistent shooter)',
      '1 coach recording saves'
    ],
    goalkeeper: { requirement: 'athlete', note: 'The assessed player IS the goalkeeper.' },
    playerStart: 'GK starts in the CENTER of the goal, on the line or up to 1m off it, in the set position. The GK must return to this center spot and be set before every serve — a drifting start position invalidates the rep.',
    setup: [
      'Place the serving cone ~12m out, central to the goal.',
      'Plan the fixed sequence: 5 serves to the left top corner and 5 to the right, in a known order (e.g. alternating) — same order for every GK.',
      'Choose the serve method once: accurate driven shots, or hard throws if the server can\'t hit corners reliably.',
      'Check the landing area: no divots, stones, or equipment where the GK will land.',
      'Agree scoring out loud: any touch that keeps the ball out of the goal = save.'
    ],
    procedure: [
      'GK sets in the center; server confirms they are set.',
      'Server delivers toward the announced top corner at consistent pace.',
      'GK dives at full extension; coach records SAVE or GOAL.',
      'Serves that miss the top-corner zone (too central, over the bar) do not count — re-serve.',
      'Give ~20–30 seconds between dives so each rep is full quality; GK re-centers and re-sets each time.',
      'Run 10 counted serves (5 left / 5 right) and total the saves. Note left vs right separately for coaching feedback.'
    ],
    attempts: ['10 attempts (5 left / 5 right; only corner-zone serves count)'],
    dataToRecord: ['Saves made (out of 10)'],
    commonMistakes: [
      'GK start position drifting toward the expected corner between reps',
      'Unequal left/right distribution',
      'Server pace varying wildly — a thrower is often more consistent than a shooter'
    ],
    safety: ['Ensure a safe landing surface and proper diving mechanics before testing.', 'Adequate rest between dives; stop on any shoulder/hip pain.'],
    tags: ['goalkeeper', 'diving', 'reach', 'out of 10']
  },
  {
    id: 'gk_distribution',
    title: 'Goalkeeper Distribution — drop-kick + throw into target grids',
    category: 'Goalkeepers',
    equipment: ['10 balls', 'Cones marking a 10m × 10m target grid at 40m (drop-kicks)', 'Cones marking a 8m × 8m target grid at 20m (throws)', 'Measuring tape or pitch markings'],
    personnel: [
      'The assessed GOALKEEPER (the athlete being tested)',
      '1 coach standing BESIDE the active target grid judging first bounces',
      'Optional: 1–2 retrievers returning balls'
    ],
    goalkeeper: { requirement: 'athlete', note: 'The assessed player IS the goalkeeper.' },
    playerStart: 'GK distributes from inside their penalty area: drop-kicks from around the penalty spot, throws from the edge of the 6-yard box. The GK may take 2–3 steps of momentum but must release inside the area, as in a match.',
    setup: [
      'Mark a 10m × 10m grid with its near edge 40m from the GK\'s release point (drop-kick target) and an 8m × 8m grid at 20m (throw target).',
      'Fix the techniques for the whole squad: drop-kick (half-volley) for the long target — no side-volleys mixed in — and one throw type (javelin or overarm) for the short target.',
      'Agree the landing rule out loud: the FIRST bounce must be inside the grid.',
      'Position the judging coach beside whichever grid is active, out of the ball\'s line.'
    ],
    procedure: [
      'Phase 1 — DROP-KICKS: GK takes a ball, moves to around the penalty spot, and drop-kicks toward the 40m grid. 5 attempts, ~30 seconds apart.',
      'Coach calls IN (first bounce inside) or OUT after each ball.',
      'Phase 2 — THROWS: GK throws from the edge of the 6-yard box toward the 20m grid using the fixed throw technique. 5 attempts.',
      'Coach calls IN or OUT after each throw.',
      'A delivery with the wrong technique (e.g. a side-volley in the drop-kick phase) does not count — repeat it.',
      'Total successful deliveries out of 10 (note drop-kicks vs throws separately for coaching feedback).'
    ],
    attempts: ['10 attempts (5 drop-kicks + 5 throws)'],
    dataToRecord: ['Deliveries reaching target zone (out of 10)'],
    commonMistakes: [
      'Target grid sizes or distances changing between sessions',
      'Mixing side-volley and drop-kick within the same phase',
      'Judging landings from behind the GK instead of beside the grid'
    ],
    safety: ['Warm up the kicking leg and throwing shoulder before max-distance distribution.', 'Retrievers stay wide of the ball flight until it lands.'],
    tags: ['goalkeeper', 'distribution', 'drop-kick', 'throw', 'out of 10']
  }
];
