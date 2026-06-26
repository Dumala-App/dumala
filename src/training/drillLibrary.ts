import type { Player } from '../types';

export type TrainingAttributeKey = Extract<keyof Player['attributes'], string>;

export type TrainingDrill = {
  id: string;
  name: string;
  category: string;
  description: string;
  targetAttributes: readonly TrainingAttributeKey[];
  statsBumps: Partial<Record<TrainingAttributeKey, number>>;
  fatigueIncrease: number;
  icon: string;
  color: string;
};

export type DrillInstruction = {
  equipment: string;
  setup: string;
  execution: string;
  setsReps: string;
};

// Technical, tactical, and conditioning drill library.
export const TRAINING_DRILLS = [
  {
    id: "drill-agility",
    name: "Shuttle Run Sprints",
    category: "Physical & Pace",
    description: "High-intensity shuttle sprints and lateral agility cone-weaving. Boosts athlete speed and physical presence.",
    targetAttributes: ["speed", "physicalness"],
    statsBumps: { speed: 2, physicalness: 1 },
    fatigueIncrease: 6,
    icon: "",
    color: "from-blue-600 to-indigo-600"
  },
  {
    id: "drill-shooting",
    name: "Finesse Target Shooting",
    category: "Clinic Finish",
    description: "Rapid receiving and precision finishing against simulated goalie pressure. Boosts clinical goal scoring.",
    targetAttributes: ["shooting"],
    statsBumps: { shooting: 3 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-rose-600 to-amber-600"
  },
  {
    id: "drill-passing",
    name: "Triangular Direct Passing",
    category: "Creative Midfield",
    description: "Tight-knit quick passing under heavy tactical counter-pressures. Calibrates overall team coordination.",
    targetAttributes: ["passing", "dribbling"],
    statsBumps: { passing: 2, dribbling: 1 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-emerald-600 to-cyan-600"
  },
  {
    id: "drill-dribbling",
    name: "Dribble Maze Challenge",
    category: "Ball Mastery",
    description: "Dynamic close-quarter dribble track through physical hurdles and obstacles. Boosts tight control.",
    targetAttributes: ["dribbling"],
    statsBumps: { dribbling: 3 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-amber-600 to-yellow-600"
  },
  {
    id: "drill-defending",
    name: "Defensive Low Block Walkthrough",
    category: "Tactical Guard",
    description: "Defenders coordinate slides, body blocks, and physical clearing tactics to stall target strikers.",
    targetAttributes: ["defending", "passing"],
    statsBumps: { defending: 3, passing: 1 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-purple-600 to-indigo-600"
  },
  {
    id: "drill-gym",
    name: "Iron Core Power Workout",
    category: "Stamina & Cardio",
    description: "High weight sets, deadlifts, and cardio build dynamic physical stamina and stamina longevity.",
    targetAttributes: ["physicalness"],
    statsBumps: { physicalness: 3 },
    fatigueIncrease: 7,
    icon: "",
    color: "from-slate-700 to-zinc-900"
  },
  {
    id: "drill-heading",
    name: "Aerial Target Power Headers",
    category: "Set Pieces & Air Power",
    description: "Perfect crossing deliveries and timing high headers under defender contact. Elevates overall target presence.",
    targetAttributes: ["shooting", "physicalness"],
    statsBumps: { shooting: 2, physicalness: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-blue-500 to-amber-500"
  },
  {
    id: "drill-tactical-shadow",
    name: "Shadow Play Tactical Shape",
    category: "Strategy & IQ",
    description: "Off-the-ball runs, defensive spacing, and simulated positional shifting without a game ball. Calibrates mental positioning.",
    targetAttributes: ["defending", "passing"],
    statsBumps: { defending: 2, passing: 1 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-indigo-600 to-cyan-500"
  },
  {
    id: "drill-goalkeeper",
    name: "Reflex Shot Stopping Grid",
    category: "Goalkeeping & Reflexes",
    description: "Rapid reaction tennis ball machine catching and diving exercises. Essential for deep line guard presence.",
    targetAttributes: ["defending", "speed"],
    statsBumps: { defending: 2, speed: 1 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-yellow-500 to-emerald-600"
  },
  {
    id: "drill-stamina-cardio",
    name: "Interval Cooper Endurance",
    category: "Stamina & Cardio",
    description: "Classic high-volume wind sprints paired with jog-recovery cycles. Drastically increases long-game lung capacity.",
    targetAttributes: ["physicalness", "speed"],
    statsBumps: { physicalness: 3, speed: 1 },
    fatigueIncrease: 8,
    icon: "",
    color: "from-red-650 to-orange-500"
  },
  {
    id: "drill-playmaking",
    name: "Pocket Vision Playmaking",
    category: "Creative Midfield",
    description: "Midfield vision grids to identify diagonal half-space runners. Calibrates final third assist accuracy.",
    targetAttributes: ["passing"],
    statsBumps: { passing: 3 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-violet-600 to-rose-500"
  },
  {
    id: "drill-pressing",
    name: "Gegenpress Trap Exercise",
    category: "Tactical Guard",
    description: "High intensity 4v2 positional boxes to choke off opponent ball circulation immediately upon possession loss.",
    targetAttributes: ["defending", "physicalness"],
    statsBumps: { defending: 2, physicalness: 2 },
    fatigueIncrease: 6,
    icon: "",
    color: "from-amber-600 to-rose-700"
  },
  {
    id: "drill-aerobic-base",
    name: "Aerobic Base Tempo Runs",
    category: "Conditioning & Endurance",
    description: "Controlled four-minute running blocks with short recovery periods to build match-long aerobic capacity.",
    targetAttributes: ["physicalness"],
    statsBumps: { physicalness: 2 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-cyan-600 to-blue-700"
  },
  {
    id: "drill-repeat-sprint",
    name: "Repeated Sprint Capacity",
    category: "Conditioning & Speed",
    description: "Short maximal sprints with incomplete recovery to improve repeated high-intensity efforts late in matches.",
    targetAttributes: ["speed", "physicalness"],
    statsBumps: { speed: 2, physicalness: 2 },
    fatigueIncrease: 7,
    icon: "",
    color: "from-orange-500 to-rose-600"
  },
  {
    id: "drill-acceleration",
    name: "First-Step Acceleration",
    category: "Conditioning & Pace",
    description: "Explosive 5-to-15 meter starts from varied body positions with full recovery and technique coaching.",
    targetAttributes: ["speed"],
    statsBumps: { speed: 3 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-sky-500 to-indigo-600"
  },
  {
    id: "drill-plyometrics",
    name: "Plyometric Power Circuit",
    category: "Conditioning & Power",
    description: "Low-volume jumps, bounds, and landing mechanics that develop explosive power while protecting the joints.",
    targetAttributes: ["physicalness", "speed"],
    statsBumps: { physicalness: 2, speed: 1 },
    fatigueIncrease: 6,
    icon: "",
    color: "from-fuchsia-600 to-purple-700"
  },
  {
    id: "drill-mobility",
    name: "Mobility & Recovery Flow",
    category: "Recovery & Mobility",
    description: "Guided hip, ankle, hamstring, and upper-back mobility work designed for low-load recovery days.",
    targetAttributes: ["physicalness"],
    statsBumps: { physicalness: 1 },
    fatigueIncrease: 1,
    icon: "",
    color: "from-emerald-500 to-teal-600"
  },
  {
    id: "drill-core-stability",
    name: "Core Stability Circuit",
    category: "Conditioning & Resilience",
    description: "Anti-rotation, balance, and trunk-control stations that improve contact strength and movement quality.",
    targetAttributes: ["physicalness", "defending"],
    statsBumps: { physicalness: 2, defending: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-slate-600 to-blue-800"
  },
  
  // ===== FORWARD-SPECIFIC DRILLS =====
  {
    id: "drill-fwd-finishing",
    name: "Clinical Finishing Under Pressure",
    category: "Forward Finishing",
    description: "High-repetition one-touch and two-touch finishing from varied angles with passive and active defensive pressure.",
    targetAttributes: ["shooting", "dribbling"],
    statsBumps: { shooting: 2, dribbling: 1 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-rose-600 to-red-700"
  },
  {
    id: "drill-fwd-positioning",
    name: "Off-Ball Striker Movement",
    category: "Forward Movement",
    description: "Timed runs between centre-backs, curved arcs into space, and checking short to receive between midfield lines.",
    targetAttributes: ["shooting", "speed"],
    statsBumps: { shooting: 1, speed: 2 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-orange-500 to-amber-600"
  },
  {
    id: "drill-fwd-hold-up",
    name: "Target Man Hold-Up Play",
    category: "Forward Hold-Up",
    description: "Receiving with back to goal, shielding in tight areas, and laying off to advancing midfielders under physical contact.",
    targetAttributes: ["shooting", "physicalness"],
    statsBumps: { shooting: 1, physicalness: 2 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-amber-600 to-yellow-600"
  },
  {
    id: "drill-fwd-cross-finish",
    name: "Crossing & Volley Finish Drill",
    category: "Forward Air Attack",
    description: "In-swinging and out-swinging crosses met with first-time finishes, diving headers, and controlled volleys from 8-18 yards.",
    targetAttributes: ["shooting", "speed"],
    statsBumps: { shooting: 2, speed: 1 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-red-600 to-amber-600"
  },

  // ===== MIDFIELDER-SPECIFIC DRILLS =====
  {
    id: "drill-mid-transition",
    name: "Quick Transition Build-Up",
    category: "Midfield Transition",
    description: "Rapid defensive-to-offensive transitions with 3-touch maximum. Midfielders scan and distribute under split-second pressure.",
    targetAttributes: ["passing", "dribbling"],
    statsBumps: { passing: 2, dribbling: 1 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-sky-500 to-cyan-600"
  },
  {
    id: "drill-mid-through-ball",
    name: "Through Ball Lane Calibration",
    category: "Midfield Vision",
    description: "Weighted through balls between defensive lines into space for runners, practiced with moving targets and mannequin walls.",
    targetAttributes: ["passing"],
    statsBumps: { passing: 3 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-emerald-500 to-teal-600"
  },
  {
    id: "drill-mid-possession",
    name: "Rondo Possession Circuit",
    category: "Midfield Control",
    description: "5v2 and 4v2 rondos emphasizing quick decisions, body orientation, and first-touch direction under tight pressure.",
    targetAttributes: ["passing", "dribbling"],
    statsBumps: { passing: 2, dribbling: 2 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-teal-500 to-emerald-600"
  },
  {
    id: "drill-mid-long-range",
    name: "Long Range Striking Zone",
    category: "Midfield Shooting",
    description: "Controlled power shots from 18-30 yards with placement targets, practicing both driven and curling techniques.",
    targetAttributes: ["shooting", "passing"],
    statsBumps: { shooting: 2, passing: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-violet-500 to-purple-600"
  },
  {
    id: "drill-mid-pressing-resist",
    name: "Press Resistance Under Load",
    category: "Midfield Composure",
    description: "Receiving in central areas with two-man pressure arriving. Escape turns, shielding, and recognition of the free outlet player.",
    targetAttributes: ["dribbling", "physicalness"],
    statsBumps: { dribbling: 2, physicalness: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-indigo-500 to-blue-600"
  },

  // ===== DEFENDER-SPECIFIC DRILLS =====
  {
    id: "drill-def-1v1",
    name: "1v1 Defensive Duels",
    category: "Defender Isolations",
    description: "Sideline containment, jockeying posture, and standing tackle technique in isolated 1v1 attacking scenarios.",
    targetAttributes: ["defending", "speed"],
    statsBumps: { defending: 2, speed: 1 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-sky-600 to-blue-700"
  },
  {
    id: "drill-def-line-shift",
    name: "Back Four Line Shift Drill",
    category: "Defender Organization",
    description: "Coordinated unit movement: stepping up/dropping as one block, maintaining 8-12m inter-player distances, offside trap timing.",
    targetAttributes: ["defending", "passing"],
    statsBumps: { defending: 2, passing: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-blue-600 to-indigo-700"
  },
  {
    id: "drill-def-aerial",
    name: "Aerial Clearance Domination",
    category: "Defender Aerial",
    description: "Repeated high-ball challenges with attacking pressure. Focus on first-contact wins, heading distance, and body positioning.",
    targetAttributes: ["defending", "physicalness"],
    statsBumps: { defending: 1, physicalness: 2 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-slate-600 to-zinc-700"
  },
  {
    id: "drill-def-overlap",
    name: "Fullback Overlap & Recovery",
    category: "Defender Wide Play",
    description: "Wing overlap sprints with crossing practice followed by immediate sprint-back to defensive 1v1 recovery position.",
    targetAttributes: ["speed", "defending"],
    statsBumps: { speed: 2, defending: 1 },
    fatigueIncrease: 6,
    icon: "",
    color: "from-cyan-500 to-sky-600"
  },

  // ===== GOALKEEPER-SPECIFIC DRILLS =====
  {
    id: "drill-gk-diving",
    name: "Reactive Diving Progression",
    category: "Goalkeeper Reflexes",
    description: "Progressive low/mid/high dive sequences from static and moving start positions. Second-save reactions off primary parries.",
    targetAttributes: ["defending", "speed"],
    statsBumps: { defending: 2, speed: 1 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-yellow-500 to-orange-600"
  },
  {
    id: "drill-gk-distribution",
    name: "Distribution & Sweeper Actions",
    category: "Goalkeeper Build-Up",
    description: "Goal kicks, side-volley distribution to wide targets, and sweeping actions off the line to clear through balls with foot control.",
    targetAttributes: ["passing", "speed"],
    statsBumps: { passing: 2, speed: 1 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-lime-500 to-emerald-600"
  },
  {
    id: "drill-gk-cross",
    name: "Cross Collection & Command",
    category: "Goalkeeper Air Control",
    description: "High cross claiming with attacking congestion. Punching decisions under aerial challenge and organizing the defensive wall.",
    targetAttributes: ["defending", "physicalness"],
    statsBumps: { defending: 2, physicalness: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-amber-500 to-yellow-600"
  },
  {
    id: "drill-gk-1v1",
    name: "1v1 Breakaway Smothering",
    category: "Goalkeeper Close-Outs",
    description: "Angle-closing sprints, set-position timing, spread technique, and low smother saves on isolated striker breakaways.",
    targetAttributes: ["speed", "defending"],
    statsBumps: { speed: 2, defending: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-orange-600 to-red-600"
  },
  {
    id: "drill-gk-footwork",
    name: "Footwork & Handling Grid",
    category: "Goalkeeper Technique",
    description: "Shuttle steps through cones to set position, followed by varied-height catches and immediate redistribution to targets.",
    targetAttributes: ["dribbling", "passing"],
    statsBumps: { dribbling: 2, passing: 1 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-blue-400 to-cyan-500"
  },

  // ===== ADDITIONAL FORWARD DRILLS =====
  {
    id: "drill-fwd-wall-pass",
    name: "Wall Pass Give & Go Finish",
    category: "Forward Combination",
    description: "Standard one-two wall pass around a mannequin with a first-time finish from 12-16m. Classic striker combination play.",
    targetAttributes: ["shooting", "passing"],
    statsBumps: { shooting: 2, passing: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-rose-500 to-pink-600"
  },
  {
    id: "drill-fwd-blind-side",
    name: "Blind-Side Run & Score",
    category: "Forward Movement",
    description: "Striker drops into the defender's blind spot, then bursts across to receive a slipped through-ball and finish one-on-one.",
    targetAttributes: ["shooting", "speed"],
    statsBumps: { shooting: 2, speed: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-orange-600 to-red-600"
  },
  {
    id: "drill-fwd-rebound",
    name: "Rebound Anticipation Finishing",
    category: "Forward Instinct",
    description: "Shots fired from 18m; striker follows in at full speed to pounce on goalkeeper parries, deflections, and loose balls in the box.",
    targetAttributes: ["shooting", "speed"],
    statsBumps: { shooting: 1, speed: 2 },
    fatigueIncrease: 5,
    icon: "",
    color: "from-red-500 to-rose-600"
  },
  {
    id: "drill-fwd-distance-shooting",
    name: "Edge-of-Box Quick Strike",
    category: "Forward Shooting",
    description: "Receive a square ball at the edge of the area, set with one touch, and fire a driven shot into the bottom corner within two seconds.",
    targetAttributes: ["shooting"],
    statsBumps: { shooting: 3 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-fuchsia-500 to-rose-600"
  },

  // ===== ADDITIONAL MIDFIELDER DRILLS =====
  {
    id: "drill-mid-switch-play",
    name: "Switching Play Long Diagonals",
    category: "Midfield Distribution",
    description: "Receive centrally, scan for the weak-side winger, and play a 35-50m diagonal switch to isolate the far-side wide player.",
    targetAttributes: ["passing"],
    statsBumps: { passing: 3 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-blue-500 to-indigo-600"
  },
  {
    id: "drill-mid-half-turn",
    name: "Receiving on the Half-Turn",
    category: "Midfield Scanning",
    description: "Midfielders receive a pass with their back to goal, scan over the shoulder, and turn into space with their first touch to play forward.",
    targetAttributes: ["passing", "dribbling"],
    statsBumps: { passing: 2, dribbling: 1 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-teal-500 to-emerald-600"
  },
  {
    id: "drill-mid-breaking-lines",
    name: "Progressive Line-Breaking Pass",
    category: "Midfield Penetration",
    description: "Receive from the back line and play a vertical pass that cuts through two lines of pressure into a forward's feet. Two-touch max.",
    targetAttributes: ["passing"],
    statsBumps: { passing: 3 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-cyan-500 to-blue-600"
  },
  {
    id: "drill-mid-third-man",
    name: "Third-Man Combination Play",
    category: "Midfield Combination",
    description: "A passes to B, B lays off to C (the third man) who has drifted into space. C plays the final through-ball. Movement off the ball is key.",
    targetAttributes: ["passing", "dribbling"],
    statsBumps: { passing: 2, dribbling: 2 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-purple-500 to-violet-600"
  },

  // ===== ADDITIONAL PASSING DRILLS =====
  {
    id: "drill-pass-triangle",
    name: "Triangle Passing Warm-Up",
    category: "Passing Foundation",
    description: "Three players in a 10m triangle play two-touch passes with emphasis on receiving on the back foot and opening the body to the next target.",
    targetAttributes: ["passing"],
    statsBumps: { passing: 2 },
    fatigueIncrease: 2,
    icon: "",
    color: "from-emerald-400 to-teal-500"
  },
  {
    id: "drill-pass-wall",
    name: "Wall Passing One-Twos",
    category: "Passing Combination",
    description: "Players in pairs execute rapid one-two passes around a cone. Receiver checks to the ball, returns it first-time, then spins for the return.",
    targetAttributes: ["passing"],
    statsBumps: { passing: 3 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-lime-500 to-emerald-500"
  },
  {
    id: "drill-pass-overlap",
    name: "Overlap Passing Combination",
    category: "Passing Wide Play",
    description: "Winger receives, fullback overlaps at speed, winger feeds the overlapping run, and the fullback crosses. Synchronize timing of run and pass.",
    targetAttributes: ["passing", "speed"],
    statsBumps: { passing: 2, speed: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-cyan-400 to-sky-500"
  },
  {
    id: "drill-pass-one-touch-grid",
    name: "One-Touch Passing Grid",
    category: "Passing Speed",
    description: "6-8 players in a 15×15m grid. One-touch passing only. Players must constantly scan, move into space, and deliver crisp passes under time pressure.",
    targetAttributes: ["passing", "dribbling"],
    statsBumps: { passing: 2, dribbling: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-sky-400 to-blue-500"
  },
  {
    id: "drill-pass-target-switch",
    name: "Long Ball Target Switch",
    category: "Passing Range",
    description: "Players practice 30-50m driven diagonal balls to a moving target on the opposite flank. Focus on weight, trajectory, and leading the receiver.",
    targetAttributes: ["passing"],
    statsBumps: { passing: 3 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-indigo-400 to-purple-500"
  },
  {
    id: "drill-pass-headed-pass",
    name: "Aerial Control & Headed Pass",
    category: "Passing Aerial",
    description: "Receive a lofted ball with the chest or thigh, control into space, then play a driven pass to a teammate. Alternate receiving sides each rep.",
    targetAttributes: ["passing", "physicalness"],
    statsBumps: { passing: 2, physicalness: 1 },
    fatigueIncrease: 3,
    icon: "",
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "drill-pass-under-pressure",
    name: "Passing Under Pressure Cage",
    category: "Passing Composure",
    description: "Two pressers close down a passer inside a 6m box. Passer must find an outlet within 3s under heavy pressure. One-touch clearance allowed.",
    targetAttributes: ["passing", "dribbling"],
    statsBumps: { passing: 2, dribbling: 1 },
    fatigueIncrease: 4,
    icon: "",
    color: "from-rose-400 to-pink-500"
  }
] satisfies readonly TrainingDrill[];

// ===== DRILL ICON MAPPINGS (Lucide components) =====
// ===== DRILL HOW-TO INSTRUCTIONS =====
export const DRILL_INSTRUCTIONS: Record<string, DrillInstruction> = {
  "drill-agility": {
    equipment: "8 cones, flat markers, stopwatch",
    setup: "Set cones 5m apart in a zig‑zag pattern. Mark start/finish lines 20m apart.",
    execution: "Sprint to each cone, touch it, change direction sharply. Perform lateral weave through centre cones, then sprint back.",
    setsReps: "4–6 reps × 3 sets. 45s rest between reps, 2 min between sets."
  },
  "drill-shooting": {
    equipment: "6 balls, full‑size goal, cone targets, goalkeeper (optional)",
    setup: "Place balls at 12m, 16m, and 20m from goal. Set cone targets in top/bottom corners.",
    execution: "Receive a short lay‑off pass and strike first‑time. Alternate foot and target zone. GK pressure optional.",
    setsReps: "10 shots × 3 sets. 30s between shots."
  },
  "drill-passing": {
    equipment: "6 cones, 3 balls, pinnies",
    setup: "Arrange three cones as a 6m triangle. One passer at each cone, one defender inside.",
    execution: "Two‑touch maximum. Pass around the triangle; defender tries to intercept. Rotate defender every 60s.",
    setsReps: "3 min continuous × 4 rounds. 60s rest per round."
  },
  "drill-dribbling": {
    equipment: "10 cones, 2 balls, small hurdles",
    setup: "Line cones in a 1m‑wide corridor over 12m with hurdles placed at the halfway mark.",
    execution: "Dribble through the corridor using inside/outside touches. Jump hurdle mid‑lane, exit with a burst sprint.",
    setsReps: "6 runs per foot × 3 sets. 30s rest."
  },
  "drill-defending": {
    equipment: "Flat markers, 3 balls, pinnies",
    setup: "Mark a 10×10m grid. 2 defenders vs 2 attackers with a small goal at each end.",
    execution: "Defenders slide as a unit, block shots, and clear loose balls. Attackers try to score in either goal.",
    setsReps: "4 min continuous × 3 rounds. 90s rest."
  },
  "drill-gym": {
    equipment: "Barbell, dumbbells, plyo box, resistance bands",
    setup: "Arrange stations: deadlift platform, box‑jump area, band‑pull station. 15m run lane between stations.",
    execution: "5 deadlifts → 8 box jumps → 10 band pull‑aparts → sprint 15m. Repeat circuit immediately.",
    setsReps: "3 circuits × 4 rounds. 2 min rest per circuit."
  },
  "drill-heading": {
    equipment: "10 balls, cone targets in goal",
    setup: "Server stands at corner flag. Target cones placed in far post and near post corners of goal.",
    execution: "Server delivers an in‑swinging cross. Attacker times run and directs header toward the far‑post cone.",
    setsReps: "8 headers × 3 sets. Alternate server/target."
  },
  "drill-tactical-shadow": {
    equipment: "Cones for positional markers",
    setup: "Place cones in a 4‑3‑3 defensive shape across a half‑pitch width (no ball).",
    execution: "Coach calls out scenarios (e.g. 'ball wide right'). Unit shifts together, maintaining 8‑10m spacing between lines.",
    setsReps: "12 scenarios × 3 rounds. 60s rest between rounds."
  },
  "drill-goalkeeper": {
    equipment: "Tennis ball machine (or rapid thrower), 12 tennis balls, GK gloves",
    setup: "GK stands 3m from machine. Feeder varies height/direction at medium speed.",
    execution: "React and catch or parry each ball. Second‑ball recoveries for any parries that stay in the 6‑yard area.",
    setsReps: "12 balls × 4 rounds. 30s between rounds."
  },
  "drill-stamina-cardio": {
    equipment: "Stopwatch, whistle, hydration station",
    setup: "Mark a 30m sprint lane. Jog‑recovery zone marked alongside it.",
    execution: "Sprint 30m at 90% effort, jog back to start over 25s. Immediately begin next sprint on the whistle.",
    setsReps: "10 sprints × 3 sets. 3 min between sets."
  },
  "drill-playmaking": {
    equipment: "10 cones, 6 balls, mannequins (optional)",
    setup: "Place mannequins/cones as a flat back‑four line 30m from a central midfield position.",
    execution: "Receive a pass, scan, and hit a diagonal ball into space behind the defensive line for a runner.",
    setsReps: "8 passes × 4 sets. Alternate left/right each rep."
  },
  "drill-pressing": {
    equipment: "4v2 grid markers, 2 balls, pinnies",
    setup: "Mark a 12×12m box. Four attackers circulate; two defenders press inside the box.",
    execution: "On coach's signal, defenders hunt in pairs to force a turnover within 5 seconds. Attackers play two‑touch max.",
    setsReps: "90s press window × 6 rounds. 60s between rounds."
  },
  "drill-aerobic-base": {
    equipment: "Cones for lap markers, stopwatch, heart‑rate monitors (optional)",
    setup: "Mark a 200m loop around the pitch perimeter.",
    execution: "Run at 70‑75% max HR for 4 minutes, then walk/jog for 90s. Repeat without stopping between cycles.",
    setsReps: "4 min run + 90s recovery × 5 cycles."
  },
  "drill-repeat-sprint": {
    equipment: "Stopwatch, whistle, 20m sprint lane markers",
    setup: "Mark start and finish lines 20m apart. Recovery zone adjacent.",
    execution: "Maximal sprint 20m; walk back over 25s. Start next sprint immediately after the walk‑back.",
    setsReps: "8 sprints × 2 sets. 4 min rest between sets."
  },
  "drill-acceleration": {
    equipment: "5 cones, stopwatch, starting whistle",
    setup: "Place cones at 5m, 10m, and 15m from a start line.",
    execution: "From a crouch/prone/standing start, explode and accelerate through each cone gate. Decelerate past the 15m cone.",
    setsReps: "6 starts × 3 sets. Full recovery (90s) between reps."
  },
  "drill-plyometrics": {
    equipment: "Low hurdles (20‑30cm), plyo box (30‑45cm), soft landing mat",
    setup: "Arrange 4 hurdles 1.5m apart followed by a plyo box at the end of the lane.",
    execution: "Two‑foot bound over each hurdle, then a maximum vertical jump onto the box. Step down safely and reset.",
    setsReps: "5 reps × 3 sets. 60s between reps."
  },
  "drill-mobility": {
    equipment: "Yoga mat, foam roller, resistance band (light)",
    setup: "Athletes spaced 2m apart on mats. Instructor leads guided stretching flow.",
    execution: "Hip‑opener sequence → hamstring walkouts → ankle circles → thoracic spine rotations → banded shoulder distraction.",
    setsReps: "45s per exercise × 1 full body circuit (approx. 12‑15 min total)."
  },
  "drill-core-stability": {
    equipment: "Mat, medicine ball (3‑5kg), balance pad (optional)",
    setup: "Athlete on a mat facing a partner or wall. Medicine ball held at chest height.",
    execution: "Anti‑rotation holds (partner pushes ball from side) → plank variations → single‑leg balance on pad → dead‑bug holds.",
    setsReps: "30s hold per exercise × 3 rounds. 30s rest between rounds."
  },
  "drill-fwd-finishing": {
    equipment: "8 balls, goal, cone targets, defender mannequin",
    setup: "Place mannequin 10m from goal. Balls lined at 14m at varying angles (left, centre, right).",
    execution: "Receive a quick lay‑off, shift past the mannequin with one touch, and finish to the far corner with the second touch.",
    setsReps: "8 shots × 3 sets. Alternate starting side each set."
  },
  "drill-fwd-positioning": {
    equipment: "5 cones, 6 balls, 2 servers at wing positions",
    setup: "Mark a centre‑back gap (two cones 3m apart) 20m from goal. Servers at each wing with balls.",
    execution: "Start between CB cones, check short to receive, then spin into space between cones. Server plays through; finish first‑time.",
    setsReps: "6 runs × 3 sets. Alternate left/right server each run."
  },
  "drill-fwd-hold-up": {
    equipment: "6 balls, physical defender partner, cone target 5m away",
    setup: "Striker at edge of the area with back to goal. Defender presses from behind. Cone marks lay‑off target 5m to side.",
    execution: "Receive ball, shield using body, hold off pressure for 2s, then lay off to the cone target and spin for return pass.",
    setsReps: "6 holds × 3 sets. Switch defender/striker halfway."
  },
  "drill-fwd-cross-finish": {
    equipment: "12 balls, full‑size goal, server at each wing",
    setup: "Striker starts 12m from goal, centred. Servers alternate crossing from left and right wing positions.",
    execution: "Time run to meet the cross. Finish with volley, diving header, or one‑touch redirect. Alternate finish type each rep.",
    setsReps: "8 crosses × 3 sets. 20s between crosses."
  },
  "drill-mid-transition": {
    equipment: "4 cones (20m grid), 3 balls, pinnies",
    setup: "Mark a 20×20m grid. Two teams of 3. Coach feeds a ball to the defensive team on transition cue.",
    execution: "Coach shouts 'GOAL' — defensive team immediately feeds a through‑ball to a runner breaking forward. Three‑touch max.",
    setsReps: "8 transitions × 4 rounds. 45s between rounds."
  },
  "drill-mid-through-ball": {
    equipment: "3 mannequins/cones as a defensive line, 8 balls",
    setup: "Mannequins 18m away representing a back line with 3m gaps. Passer at 25m out.",
    execution: "Scan, then play a weighted through‑ball through the gaps for a runner timing a curved run from deep.",
    setsReps: "8 passes × 4 sets. Alternate gap target each pass."
  },
  "drill-mid-possession": {
    equipment: "4 cones (6m circle), 2 balls",
    setup: "Mark a 6m‑diameter rondo circle. 5 players on perimeter, 2 defenders inside.",
    execution: "Perimeter players play one‑two touch only. Defenders press to intercept. If a defender wins the ball, they swap with the passer.",
    setsReps: "3 min × 4 rounds. Rotate defenders halfway through each round."
  },
  "drill-mid-long-range": {
    equipment: "8 balls, goal, target cones in top corners",
    setup: "Balls placed at 20m, 25m, and 30m from goal. Target cones in both top corners.",
    execution: "Take a controlling touch then strike with laces (driven) or instep (curled). Aim for the target cone zone.",
    setsReps: "5 shots per distance × 2 sets. Alternate foot each set."
  },
  "drill-mid-pressing-resist": {
    equipment: "4 cones (5m square), 2 pressers, 1 ball",
    setup: "Receiver stands in centre of 5m square. Two pressers enter from opposite sides on coach's whistle.",
    execution: "Receiver must shield, turn, or use a drag‑back to escape the square via any side within 3 seconds. Two‑touch max.",
    setsReps: "8 escapes × 3 sets. Rotate roles each set."
  },
  "drill-def-1v1": {
    equipment: "2 cones (start/end line 10m apart), 1 ball per pair",
    setup: "Attacker starts with the ball at one cone. Defender starts at the opposite cone, facing the attacker.",
    execution: "Attacker dribbles at the defender. Defender jockeys, contains, and attempts a standing tackle in the 10m lane.",
    setsReps: "6 duels × 3 sets. Swap roles each set."
  },
  "drill-def-line-shift": {
    equipment: "6 cones for positional markers, whistle",
    setup: "Four defenders spaced across a 30m width in a flat line. Coach stands 15m in front with players.",
    execution: "Coach points direction — defenders slide together, nearest player presses while others tuck in and cover.",
    setsReps: "10 shifts × 4 rounds. 30s rest between rounds."
  },
  "drill-def-aerial": {
    equipment: "10 balls, server at the wing, 2 attackers",
    setup: "Defender and 2 attackers inside the penalty area. Server delivers high balls from a wide position.",
    execution: "Defender attacks the ball in the air, wins the first contact, and heads it clear beyond the 18‑yard line.",
    setsReps: "8 aerial balls × 3 sets. 20s between deliveries."
  },
  "drill-def-overlap": {
    equipment: "4 cones (20m lane), 3 balls",
    setup: "Mark a 20m wing corridor. Fullback starts at the defensive end of the corridor; a winger starts 10m ahead.",
    execution: "Fullback overlaps the winger at full sprint, receives a through‑ball, whips in a cross, then immediately sprints back to starting position.",
    setsReps: "6 overlaps × 3 sets. 45s between reps."
  },
  "drill-gk-diving": {
    equipment: "10 balls, cone targets in corners, GK gloves",
    setup: "GK in centre of goal. Server at 8m, alternating low/mid/high shots toward corner targets.",
    execution: "Dive and parry or catch each shot. Focus on a two‑step set position and driving off the near foot. Recover immediately.",
    setsReps: "8 dives × 4 sets. 30s rest between sets."
  },
  "drill-gk-distribution": {
    equipment: "8 balls, cone targets at 20m, 30m, and 45m",
    setup: "GK in possession at the 6‑yard line. Targets marked at progressive distances on both wings.",
    execution: "Drop‑kick or side‑volley to hit the target cone. Alternate left and right targets. Shout the target before striking.",
    setsReps: "8 kicks × 3 sets. 20s between kicks."
  },
  "drill-gk-cross": {
    equipment: "10 balls, server at wing, 3 attackers as congestion",
    setup: "GK on goal line. Server delivers high crosses from a wide 18‑yard position. Attackers create traffic inside the 6‑yard box.",
    execution: "Judge flight, call 'KEEPER!', attack the ball at its highest point, and punch or catch cleanly above the crowd.",
    setsReps: "8 crosses × 3 sets. 25s between crosses."
  },
  "drill-gk-1v1": {
    equipment: "5 balls, striker with ball starting at 18m",
    setup: "Striker starts at 18m with the ball. GK is on the 6‑yard line.",
    execution: "GK charges out to close the angle. As the striker shoots, GK spreads and smothers low. Stay big, don't commit early.",
    setsReps: "5 breakaways × 4 sets. 45s between reps."
  },
  "drill-gk-footwork": {
    equipment: "6 cones (lateral pattern), 6 balls, server",
    setup: "Cones in a ladder pattern across the goal mouth 1m apart. Server at 10m.",
    execution: "Quick lateral steps through cones → set position at the end → server feeds a ball at varied height for a catch → distribute to a target cone.",
    setsReps: "6 patterns × 3 sets. 20s between patterns."
  },
  "drill-fwd-wall-pass": {
    equipment: "1 mannequin, 6 balls, goal, cone targets",
    setup: "Mannequin placed at 14m from goal as the 'wall'. Passer 5m behind mannequin. Cone targets in bottom corners.",
    execution: "Pass into the mannequin, receive the return, and strike first-time into the far corner. Alternate left and right finishes.",
    setsReps: "6 shots × 3 sets. 30s between shots."
  },
  "drill-fwd-blind-side": {
    equipment: "2 cones (defender gap), 6 balls, server at 25m",
    setup: "Two cones 3m apart to simulate centre‑backs 20m from goal. Server with balls at 25m.",
    execution: "Drift into the defender's blind side so they cannot see both you and the ball. Burst into the gap as the pass is played, finish first‑time.",
    setsReps: "8 runs × 3 sets. Alternate starting side each run."
  },
  "drill-fwd-rebound": {
    equipment: "8 balls, goal, goalkeeper",
    setup: "Shooter at 18m takes initial shots on goal. Striker starts 5m outside the penalty area.",
    execution: "As the shot leaves the shooter's foot, the striker sprints into the box to follow up on any save, parry, or deflection. React to the keeper's movement.",
    setsReps: "8 rebounds × 3 sets. 20s between shots."
  },
  "drill-fwd-distance-shooting": {
    equipment: "6 balls, goal, target cones in bottom corners",
    setup: "Balls lined in an arc at 16-20m from goal. Server rolls a square pass from one side.",
    execution: "Receive the square ball, set with the first touch, and snap a driven shot toward the far bottom corner within two seconds of receiving.",
    setsReps: "6 shots × 3 sets. Alternate receiving side each set."
  },
  "drill-mid-switch-play": {
    equipment: "4 cones (target zones on each flank), 6 balls",
    setup: "Central passer at the centre circle. Wide target zones marked 10m from each touchline, 30m from the passer.",
    execution: "Receive a short pass from a defender, lift your head and scan, then drive a 35‑50m diagonal ball into the target zone. Weak‑side winger times a run into the zone.",
    setsReps: "6 diagonals each side × 3 sets. 20s between passes."
  },
  "drill-mid-half-turn": {
    equipment: "2 cones, 6 balls, 1 server",
    setup: "Midfielder at a cone with back to goal. Server 8m behind. Second cone marks the turn direction at 5m.",
    execution: "Receive the ball, check over the shoulder before it arrives, open the body with the first touch, and turn into the cone direction. Play a forward pass.",
    setsReps: "8 receives × 3 sets. Alternate turning left/right."
  },
  "drill-mid-breaking-lines": {
    equipment: "4 cones (two defensive lines), 8 balls",
    setup: "Two lines of cones spaced 8m and 14m ahead of the passer, 5m apart simulating two defensive units.",
    execution: "Receive from the back, take one touch to set, and fire a vertical pass that travels through both lines of cones into a forward's feet.",
    setsReps: "8 passes × 3 sets. 25s between passes."
  },
  "drill-mid-third-man": {
    equipment: "4 cones, 6 balls, 3 players (A, B, C)",
    setup: "A at 25m from goal. B at 18m. C drifts into a pocket 12m from goal between the lines.",
    execution: "A passes to B → B lays off first‑time to C → C plays a through‑ball to a runner. All players must move immediately after passing.",
    setsReps: "6 combinations × 4 rounds. Rotate roles each round."
  },
  "drill-pass-triangle": {
    equipment: "3 cones, 2 balls",
    setup: "Three cones form a 10m equilateral triangle. One player at each cone.",
    execution: "Pass clockwise using two touches: receive on the back foot, open the body, pass to the next cone. Switch direction on coach's whistle. Keep the ball on the ground.",
    setsReps: "3 min continuous × 3 rounds. 60s between rounds."
  },
  "drill-pass-wall": {
    equipment: "2 cones (5m apart), 1 ball per pair",
    setup: "Two players 5m apart with a cone between them acting as a wall point.",
    execution: "Player A passes to the cone; Player B checks toward it and returns first-time. A then spins off and receives the return pass. Repeat, swapping roles every 60s.",
    setsReps: "3 min continuous × 3 rounds. 45s rest per round."
  },
  "drill-pass-overlap": {
    equipment: "4 cones (20m corridor), 4 balls",
    setup: "Mark a 20m wing corridor. Winger at the near cone, fullback 5m behind at the start cone.",
    execution: "Winger receives a pass and holds it. Fullback overlaps at full speed. Winger feeds the overlapping run at the right moment. Fullback crosses first‑time.",
    setsReps: "6 overlaps × 3 sets. 30s between reps."
  },
  "drill-pass-one-touch-grid": {
    equipment: "4 cones (15×15m grid), 2 balls",
    setup: "6-8 players inside a 15×15m grid. Two balls in play simultaneously.",
    execution: "Pass and move constantly. One touch only. If a ball exits the grid, the nearest player retrieves it. Players must call names before passing.",
    setsReps: "4 min continuous × 3 rounds. 90s rest."
  },
  "drill-pass-target-switch": {
    equipment: "6 balls, cone targets at 30m and 50m on each flank",
    setup: "Passer centrally 10m inside own half. Moving target zones at 30m and 50m on both flanks.",
    execution: "Hit a 30m diagonal to the near target, then a 50m diagonal to the far target. Focus on weight — the ball should arrive at the target, not the target chase the ball.",
    setsReps: "4 near + 4 far × 3 sets. 20s between passes."
  },
  "drill-pass-headed-pass": {
    equipment: "6 balls, server at 15m",
    setup: "Receiver at 10m from the server. Second player (target) 8m to the side.",
    execution: "Server delivers a lofted ball. Receiver controls with chest or thigh, takes one settling touch, and plays a crisp driven pass to the target.",
    setsReps: "6 receives × 3 sets. Alternate chest/thigh each rep."
  },
  "drill-pass-under-pressure": {
    equipment: "4 cones (6×6m box), 2 pressers, 1 ball, 1 outlet player",
    setup: "Passer inside a 6×6m box. Two pressers enter on coach's signal. Outlet player stands 8m outside the box.",
    execution: "On the whistle, pressers charge in at full speed. Passer must shield, turn, or dummy to find the outlet player with a pass within 3s. One‑touch clearance permitted.",
    setsReps: "8 reps × 3 rounds. Rotate passer/pressers each round."
  },
};

export type TrainingDrillId = typeof TRAINING_DRILLS[number]['id'];


