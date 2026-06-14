import React, { useState, useEffect } from 'react';
import { Player, Game } from '../types';
import { 
  Dumbbell, Sparkles, Activity, Zap, RotateCcw, Flame, TrendingUp, Search, Filter,
  User, CheckCircle, CalendarPlus, HeartPulse, ShieldCheck, Target, Footprints,
  Shield, Timer, Gauge, ArrowUpRight, Crosshair, Waves, Goal, Hand, Route,
  ChevronDown, ChevronUp, Clock, Box, Users, ClipboardList, Trophy
} from 'lucide-react';

interface TrainingViewProps {
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  games: Game[];
  onUpdateGames: (games: Game[]) => void;
}

// Technical, tactical, and conditioning drill library.
const CRITICAL_DRILLS = [
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
];

// ===== DRILL ICON MAPPINGS (Lucide components) =====
function getDrillIcon(drillId: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    "drill-agility": <Footprints size={18} />,
    "drill-shooting": <Target size={18} />,
    "drill-passing": <Route size={18} />,
    "drill-dribbling": <Footprints size={18} />,
    "drill-defending": <Shield size={18} />,
    "drill-gym": <Dumbbell size={18} />,
    "drill-heading": <Goal size={18} />,
    "drill-tactical-shadow": <Users size={18} />,
    "drill-goalkeeper": <Hand size={18} />,
    "drill-stamina-cardio": <Timer size={18} />,
    "drill-playmaking": <ArrowUpRight size={18} />,
    "drill-pressing": <Shield size={18} />,
    "drill-aerobic-base": <Activity size={18} />,
    "drill-repeat-sprint": <Gauge size={18} />,
    "drill-acceleration": <Zap size={18} />,
    "drill-plyometrics": <Flame size={18} />,
    "drill-mobility": <HeartPulse size={18} />,
    "drill-core-stability": <Shield size={18} />,
    "drill-fwd-finishing": <Crosshair size={18} />,
    "drill-fwd-positioning": <ArrowUpRight size={18} />,
    "drill-fwd-hold-up": <Target size={18} />,
    "drill-fwd-cross-finish": <Goal size={18} />,
    "drill-mid-transition": <Zap size={18} />,
    "drill-mid-through-ball": <ArrowUpRight size={18} />,
    "drill-mid-possession": <Route size={18} />,
    "drill-mid-long-range": <Target size={18} />,
    "drill-mid-pressing-resist": <Shield size={18} />,
    "drill-def-1v1": <Shield size={18} />,
    "drill-def-line-shift": <Users size={18} />,
    "drill-def-aerial": <Goal size={18} />,
    "drill-def-overlap": <ArrowUpRight size={18} />,
    "drill-gk-diving": <Hand size={18} />,
    "drill-gk-distribution": <Route size={18} />,
    "drill-gk-cross": <Hand size={18} />,
    "drill-gk-1v1": <Shield size={18} />,
    "drill-gk-footwork": <Footprints size={18} />,
    "drill-fwd-wall-pass": <Route size={18} />,
    "drill-fwd-blind-side": <Crosshair size={18} />,
    "drill-fwd-rebound": <Target size={18} />,
    "drill-fwd-distance-shooting": <Crosshair size={18} />,
    "drill-mid-switch-play": <Route size={18} />,
    "drill-mid-half-turn": <ArrowUpRight size={18} />,
    "drill-mid-breaking-lines": <ArrowUpRight size={18} />,
    "drill-mid-third-man": <Users size={18} />,
    "drill-pass-triangle": <Route size={18} />,
    "drill-pass-wall": <Route size={18} />,
    "drill-pass-overlap": <ArrowUpRight size={18} />,
    "drill-pass-one-touch-grid": <Gauge size={18} />,
    "drill-pass-target-switch": <Route size={18} />,
    "drill-pass-headed-pass": <Goal size={18} />,
    "drill-pass-under-pressure": <Shield size={18} />,
  };
  return iconMap[drillId] || <Activity size={18} />;
}

function getDrillIconColor(drillId: string): string {
  const colorMap: Record<string, string> = {
    "drill-agility": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-shooting": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-passing": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-dribbling": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-defending": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-gym": "bg-slate-100 text-slate-700 border-slate-300",
    "drill-heading": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-tactical-shadow": "bg-purple-50 text-purple-600 border-purple-200",
    "drill-goalkeeper": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "drill-stamina-cardio": "bg-red-50 text-red-600 border-red-200",
    "drill-playmaking": "bg-violet-50 text-violet-600 border-violet-200",
    "drill-pressing": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-aerobic-base": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-repeat-sprint": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-acceleration": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-plyometrics": "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
    "drill-mobility": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-core-stability": "bg-slate-50 text-slate-600 border-slate-200",
    "drill-fwd-finishing": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-fwd-positioning": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-fwd-hold-up": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-fwd-cross-finish": "bg-red-50 text-red-600 border-red-200",
    "drill-mid-transition": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-mid-through-ball": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-mid-possession": "bg-teal-50 text-teal-600 border-teal-200",
    "drill-mid-long-range": "bg-violet-50 text-violet-600 border-violet-200",
    "drill-mid-pressing-resist": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-def-1v1": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-def-line-shift": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-def-aerial": "bg-slate-50 text-slate-600 border-slate-200",
    "drill-def-overlap": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-gk-diving": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "drill-gk-distribution": "bg-lime-50 text-lime-600 border-lime-200",
    "drill-gk-cross": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-gk-1v1": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-gk-footwork": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-fwd-wall-pass": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-fwd-blind-side": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-fwd-rebound": "bg-red-50 text-red-600 border-red-200",
    "drill-fwd-distance-shooting": "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
    "drill-mid-switch-play": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-mid-half-turn": "bg-teal-50 text-teal-600 border-teal-200",
    "drill-mid-breaking-lines": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-mid-third-man": "bg-purple-50 text-purple-600 border-purple-200",
    "drill-pass-triangle": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-pass-wall": "bg-lime-50 text-lime-600 border-lime-200",
    "drill-pass-overlap": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-pass-one-touch-grid": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-pass-target-switch": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-pass-headed-pass": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-pass-under-pressure": "bg-rose-50 text-rose-600 border-rose-200",
  };
  return colorMap[drillId] || "bg-slate-50 text-slate-600 border-slate-200";
}

// ===== DRILL HOW-TO INSTRUCTIONS =====
const DRILL_INSTRUCTIONS: Record<string, { equipment: string; setup: string; execution: string; setsReps: string }> = {
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

interface ScheduledDrill {
  id: string;
  drillId: string;
  name: string;
  icon?: string;
  fatigueIncrease: number;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type DayName = typeof DAYS_OF_WEEK[number];

const getWeekDaysMap = (refDate: Date = new Date("2026-06-13")) => {
  const day = refDate.getDay(); // 0 is Sunday, 1-6 is Mon-Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diff);
  
  const map: Record<DayName, { dateStr: string; monthDate: string; displayStrOrMonthDate: string }> = {} as any;
  DAYS_OF_WEEK.forEach((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yr}-${mo}-${dy}`;
    
    const shortMonthDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const displayStrOrMonthDate = `${dayName} (${shortMonthDate})`;
    
    map[dayName] = {
      dateStr,
      monthDate: shortMonthDate,
      displayStrOrMonthDate
    };
  });
  return map;
};

const DEFAULT_SCHEDULE: Record<DayName, ScheduledDrill[]> = {
  Monday: [
    { id: 'init-1', drillId: 'drill-gym', name: 'Iron Core Power Workout', fatigueIncrease: 7 },
    { id: 'init-2', drillId: 'drill-agility', name: 'Shuttle Run Sprints', fatigueIncrease: 6 }
  ],
  Tuesday: [
    { id: 'init-3', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
  ],
  Wednesday: [],
  Thursday: [
    { id: 'init-4', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 }
  ],
  Friday: [
    { id: 'init-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
  ],
  Saturday: [],
  Sunday: []
};

export default function TrainingView({ players, onUpdatePlayer, games, onUpdateGames }: TrainingViewProps) {
  const [selectedDrillId, setSelectedDrillId] = useState<string>(CRITICAL_DRILLS[0].id);
  const [expandedDrills, setExpandedDrills] = useState<Set<string>>(new Set());
  const [weeklySchedule, setWeeklySchedule] = useState<Record<DayName, ScheduledDrill[]>>(() => {
    const saved = localStorage.getItem('squad_weekly_schedule');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback to default
      }
    }
    return DEFAULT_SCHEDULE;
  });

  const weekDaysMap = getWeekDaysMap(new Date());

  useEffect(() => {
    // Archive current week as history before overwriting
    const currentRaw = localStorage.getItem('squad_weekly_schedule');
    if (currentRaw) {
      localStorage.setItem('squad_weekly_schedule_history', currentRaw);
    }
    localStorage.setItem('squad_weekly_schedule', JSON.stringify(weeklySchedule));
  }, [weeklySchedule]);

  // Synchronize Weekly Training to Calendar Games
  useEffect(() => {
    const activeWeekDates = Object.values(weekDaysMap).map(w => w.dateStr);

    // 1. Filter out existing training games in this week from the main games list
    const otherGames = games.filter(g => {
      const isTrainingInWeek = g.type === 'Training' && activeWeekDates.includes(g.date);
      return !isTrainingInWeek;
    });

    // 2. Generate games for active days
    const nextTrainingGames: Game[] = [];
    DAYS_OF_WEEK.forEach((dayName) => {
      const drills = weeklySchedule[dayName];
      if (drills && drills.length > 0) {
        const dateInfo = weekDaysMap[dayName];
        
        const drillText = drills.map(d => `${d.icon} ${d.name}`).join(' & ');
        const workLoad = drills.reduce((sum, item) => sum + item.fatigueIncrease, 0);

        const trainingGame: Game = {
          id: `training_sync_${dateInfo.dateStr}`,
          opponent: `Training: ${drills.map(d => d.name).join(' + ')}`,
          date: dateInfo.dateStr,
          time: "10:00 AM",
          location: "Training Ground A",
          status: "Upcoming",
          type: "Training",
          notes: `Squad Workload Target: +${workLoad}% intensity. Drills: ${drillText}. Prepare lightweight kits.`
        };
        nextTrainingGames.push(trainingGame);
      }
    });

    const finalGames = [...otherGames, ...nextTrainingGames];

    // Helper to check deep equality of relevant parts to prevent infinite loops
    const hasChanges = () => {
      const currentInWeek = games.filter(g => g.type === 'Training' && activeWeekDates.includes(g.date));
      if (currentInWeek.length !== nextTrainingGames.length) return true;

      const sortedCurrent = [...currentInWeek].sort((a,b) => a.date.localeCompare(b.date));
      const sortedNext = [...nextTrainingGames].sort((a,b) => a.date.localeCompare(b.date));

      for (let i = 0; i < sortedCurrent.length; i++) {
        const c = sortedCurrent[i];
        const n = sortedNext[i];
        if (
          c.date !== n.date ||
          c.opponent !== n.opponent ||
          c.notes !== n.notes
        ) {
          return true;
        }
      }
      return false;
    };

    if (hasChanges()) {
      onUpdateGames(finalGames);
    }
  }, [weeklySchedule, games, onUpdateGames]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttributeFilter, setSelectedAttributeFilter] = useState('all');
  const [recommendPlayerId, setRecommendPlayerId] = useState('');
  const [developmentDay, setDevelopmentDay] = useState<DayName>('Wednesday');
  const [developmentFocus, setDevelopmentFocus] = useState<'all' | 'technical' | 'tactical' | 'conditioning' | 'recovery'>('all');
  const [selectedTrainingDrillIds, setSelectedTrainingDrillIds] = useState<string[]>([]);

  const handleDragStart = (e: React.DragEvent, drillId: string) => {
    e.dataTransfer.setData('text/plain', drillId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropDrill = (day: DayName, e: React.DragEvent) => {
    e.preventDefault();
    const drillId = e.dataTransfer.getData('text/plain');
    const drill = CRITICAL_DRILLS.find(d => d.id === drillId);
    if (drill) {
      const newScheduled: ScheduledDrill = {
        id: `scheduled-${day}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        drillId: drill.id,
        name: drill.name,
        icon: drill.icon,
        fatigueIncrease: drill.fatigueIncrease
      };
      setWeeklySchedule(prev => ({
        ...prev,
        [day]: [...prev[day], newScheduled]
      }));
    }
  };

  const handleRemoveDrill = (day: DayName, id: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(item => item.id !== id)
    }));
  };

  const handleClearAllWeekly = () => {
    setWeeklySchedule({
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    });
  };

  const handleLoadTemplate = (mode: 'heavy' | 'taper' | 'tactical' | 'prematch' | 'recovery' | 'forward-focus' | 'midfield-focus' | 'defender-focus' | 'last-week') => {
    if (mode === 'last-week') {
      const saved = localStorage.getItem('squad_weekly_schedule_history');
      if (saved) {
        try {
          const prev = JSON.parse(saved) as Record<DayName, ScheduledDrill[]>;
          // Merge with current to keep IDs unique but use previous structure
          const restored: Record<DayName, ScheduledDrill[]> = { Monday:[], Tuesday:[], Wednesday:[], Thursday:[], Friday:[], Saturday:[], Sunday:[] };
          DAYS_OF_WEEK.forEach(day => {
            restored[day] = (prev[day] || []).map((d: any, i: number) => ({
              ...d,
              id: `lw-${day}-${Date.now()}-${i}`
            }));
          });
          setWeeklySchedule(restored);
        } catch {}
      }
      return;
    }

    const fillDays = (template: Partial<Record<DayName, Array<{ id: string; drillId: string; name: string; fatigueIncrease: number }>>>) => {
      const base: Record<DayName, ScheduledDrill[]> = { Monday:[], Tuesday:[], Wednesday:[], Thursday:[], Friday:[], Saturday:[], Sunday:[] };
      DAYS_OF_WEEK.forEach(day => { if (template[day]) base[day] = template[day]; });
      return base;
    };

    if (mode === 'heavy') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'h-1', drillId: 'drill-gym', name: 'Iron Core Power Workout', fatigueIncrease: 7 },
          { id: 'h-2', drillId: 'drill-agility', name: 'Shuttle Run Sprints', fatigueIncrease: 6 }
        ],
        Tuesday: [
          { id: 'h-3', drillId: 'drill-dribbling', name: 'Dribble Maze Challenge', fatigueIncrease: 3 },
          { id: 'h-4', drillId: 'drill-gym', name: 'Iron Core Power Workout', fatigueIncrease: 7 }
        ],
        Wednesday: [
          { id: 'h-5', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Thursday: [
          { id: 'h-6', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 },
          { id: 'h-7', drillId: 'drill-agility', name: 'Shuttle Run Sprints', fatigueIncrease: 6 }
        ],
        Friday: [
          { id: 'h-8', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ]
      }));
    } else if (mode === 'taper') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 't-1', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 't-2', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 't-3', drillId: 'drill-dribbling', name: 'Dribble Maze Challenge', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 't-4', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ]
      }));
    } else if (mode === 'tactical') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'ac-1', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 'ac-2', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'ac-3', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 },
          { id: 'ac-4', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 'ac-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ]
      }));
    } else if (mode === 'prematch') {
      // Light day before match, match day empty, recovery after
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'pm-1', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 'pm-2', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'pm-3', drillId: 'drill-pass-triangle', name: 'Triangle Passing Warm-Up', fatigueIncrease: 2 },
          { id: 'pm-4', drillId: 'drill-mobility', name: 'Mobility & Recovery Flow', fatigueIncrease: 1 }
        ],
        Friday: [
          { id: 'pm-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ],
        Saturday: [],  // Match day — kept clear
        Sunday: []      // Rest day
      }));
    } else if (mode === 'recovery') {
      // Low load, mobility and technique focus
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'rc-1', drillId: 'drill-mobility', name: 'Mobility & Recovery Flow', fatigueIncrease: 1 }
        ],
        Tuesday: [
          { id: 'rc-2', drillId: 'drill-pass-triangle', name: 'Triangle Passing Warm-Up', fatigueIncrease: 2 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'rc-3', drillId: 'drill-core-stability', name: 'Core Stability Circuit', fatigueIncrease: 4 }
        ],
        Friday: [
          { id: 'rc-4', drillId: 'drill-mobility', name: 'Mobility & Recovery Flow', fatigueIncrease: 1 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'forward-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'ff-1', drillId: 'drill-fwd-finishing', name: 'Clinical Finishing Under Pressure', fatigueIncrease: 5 }
        ],
        Tuesday: [
          { id: 'ff-2', drillId: 'drill-fwd-positioning', name: 'Off-Ball Striker Movement', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'ff-3', drillId: 'drill-fwd-cross-finish', name: 'Crossing & Volley Finish Drill', fatigueIncrease: 5 }
        ],
        Friday: [
          { id: 'ff-4', drillId: 'drill-fwd-wall-pass', name: 'Wall Pass Give & Go Finish', fatigueIncrease: 4 },
          { id: 'ff-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'midfield-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'mf-1', drillId: 'drill-mid-possession', name: 'Rondo Possession Circuit', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 'mf-2', drillId: 'drill-mid-transition', name: 'Quick Transition Build-Up', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'mf-3', drillId: 'drill-mid-through-ball', name: 'Through Ball Lane Calibration', fatigueIncrease: 3 },
          { id: 'mf-4', drillId: 'drill-pass-wall', name: 'Wall Passing One-Twos', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 'mf-5', drillId: 'drill-mid-switch-play', name: 'Switching Play Long Diagonals', fatigueIncrease: 3 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'defender-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'df-1', drillId: 'drill-def-1v1', name: '1v1 Defensive Duels', fatigueIncrease: 5 }
        ],
        Tuesday: [
          { id: 'df-2', drillId: 'drill-def-line-shift', name: 'Back Four Line Shift Drill', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'df-3', drillId: 'drill-def-aerial', name: 'Aerial Clearance Domination', fatigueIncrease: 5 }
        ],
        Friday: [
          { id: 'df-4', drillId: 'drill-def-overlap', name: 'Fullback Overlap & Recovery', fatigueIncrease: 6 }
        ],
        Saturday: [],
        Sunday: []
      }));
    }
  };

  const calculateOVR = (bAttrs: Player['baseAttributes'], pAttrs: Player['positionAttributes']) => {
    if (!bAttrs) return 50;
    const baseAvg = (bAttrs.pace + bAttrs.stamina + bAttrs.agility + bAttrs.strength + bAttrs.firstTouch + bAttrs.shortPassing) / 6;
    const posKeys = Object.keys(pAttrs || {});
    let posAvg = 0;
    if (posKeys.length > 0) {
      posAvg = (Object.values(pAttrs) as number[]).reduce((a: number, b: number) => a + b, 0) / posKeys.length;
    }
    return Math.round(posKeys.length > 0 ? (baseAvg * 0.6) + (posAvg * 0.4) : baseAvg);
  };

  // Find info about a player selected for recommendation
  const recommendedPlayer = players.find(p => p.id === recommendPlayerId);
  const rankedPlayerAttributes = recommendedPlayer
    ? Object.entries(recommendedPlayer.baseAttributes || {}).sort((a, b) => b[1] - a[1])
    : [];
  const strongestPlayerAttributes = rankedPlayerAttributes.slice(0, 2);
  const playerGoalContributions = recommendedPlayer
    ? recommendedPlayer.points + recommendedPlayer.assists
    : 0;

  const getPlayerGrowthNeeds = (player: Player) => {
    const attrs = player.baseAttributes || { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 };
    const sorted = Object.entries(attrs).sort((a, b) => (a[1] as number) - (b[1] as number));
    const lowestAttr = sorted[0][0];
    const lowestVal = sorted[0][1];

    let positionKeys: string[] = [];
    if (player.position === 'Forward') positionKeys = ['pace', 'shortPassing'];
    else if (player.position === 'Midfielder') positionKeys = ['shortPassing', 'stamina'];
    else if (player.position === 'Defender') positionKeys = ['strength', 'pace'];
    else positionKeys = ['agility', 'strength'];

    return {
      lowestAttr,
      lowestVal,
      positionKeys,
      isBeneficial: (drill: typeof CRITICAL_DRILLS[0]) => {
        return drill.targetAttributes.includes(lowestAttr) || 
               drill.targetAttributes.some(attr => positionKeys.includes(attr));
      }
    };
  };

  const growthNeeds = recommendedPlayer ? getPlayerGrowthNeeds(recommendedPlayer) : null;

  const developmentDrills = CRITICAL_DRILLS.filter(drill => {
    const category = drill.category.toLowerCase();
    if (developmentFocus === 'conditioning') {
      return category.includes('conditioning') || category.includes('stamina') || category.includes('physical');
    }
    if (developmentFocus === 'recovery') return category.includes('recovery');
    if (developmentFocus === 'tactical') {
      return category.includes('tactical') || category.includes('strategy') || category.includes('creative midfield');
    }
    if (developmentFocus === 'technical') {
      return !category.includes('conditioning') &&
        !category.includes('recovery') &&
        !category.includes('stamina') &&
        !category.includes('physical') &&
        !category.includes('tactical') &&
        !category.includes('strategy');
    }
    return true;
  });

  const selectedTrainingDrills = CRITICAL_DRILLS.filter(drill => selectedTrainingDrillIds.includes(drill.id));
  const selectedTrainingLoad = selectedTrainingDrills.reduce((sum, drill) => sum + drill.fatigueIncrease, 0);
  const projectedTrainingGains = selectedTrainingDrills.reduce<Partial<Record<keyof Player['attributes'], number>>>(
    (totals, drill) => {
      Object.entries(drill.statsBumps).forEach(([attribute, amount]) => {
        const key = attribute as keyof Player['attributes'];
        totals[key] = (totals[key] || 0) + amount;
      });
      return totals;
    },
    {}
  );

  const dailyLoads = DAYS_OF_WEEK.map(day => ({
    day,
    load: weeklySchedule[day].reduce((sum, item) => sum + item.fatigueIncrease, 0)
  }));
  const weeklyLoad = dailyLoads.reduce((sum, item) => sum + item.load, 0);
  const heavyDays = dailyLoads.filter(item => item.load >= 13).length;
  const recoveryDays = dailyLoads.filter(item => item.load <= 3).length;
  const workloadStatus = heavyDays >= 3 || weeklyLoad > 55
    ? { label: 'High risk', color: 'text-rose-300', note: 'Reduce one high-load day and add mobility work.' }
    : recoveryDays < 2
      ? { label: 'Needs recovery', color: 'text-amber-300', note: 'Keep at least two low-load days in the week.' }
      : { label: 'Balanced', color: 'text-emerald-300', note: 'Work and recovery are distributed well.' };

  const addDrillsToDay = (drills: typeof CRITICAL_DRILLS, day: DayName) => {
    const scheduled = drills.map((drill, index) => ({
      id: `development-${day}-${Date.now()}-${index}`,
      drillId: drill.id,
      name: drill.name,
      icon: drill.icon,
      fatigueIncrease: drill.fatigueIncrease
    }));
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: [...prev[day], ...scheduled]
    }));
  };

  const handleCompleteDevelopmentSession = () => {
    if (!recommendedPlayer || selectedTrainingDrills.length === 0) return;
    const nextAttributes = { ...recommendedPlayer.attributes };
    selectedTrainingDrills.forEach(drill => {
      Object.entries(drill.statsBumps).forEach(([attribute, amount]) => {
        const key = attribute as keyof Player['attributes'];
        nextAttributes[key] = Math.min(99, nextAttributes[key] + amount);
      });
    });
    onUpdatePlayer({ ...recommendedPlayer, attributes: nextAttributes });
  };

  const toggleTrainingDrill = (drillId: string) => {
    setSelectedTrainingDrillIds(current =>
      current.includes(drillId)
        ? current.filter(id => id !== drillId)
        : [...current, drillId]
    );
  };

  // Filter Drills by text and category/focus filters
  const filteredDrills = CRITICAL_DRILLS.filter(drill => {
    const query = searchQuery.toLowerCase();
    const matchesText = 
      drill.name.toLowerCase().includes(query) ||
      drill.category.toLowerCase().includes(query) ||
      drill.description.toLowerCase().includes(query) ||
      drill.targetAttributes.some(attr => attr.toLowerCase().includes(query));

    const matchesAttribute =
      selectedAttributeFilter === 'all' ||
      (selectedAttributeFilter === 'conditioning'
        ? drill.category.toLowerCase().includes('conditioning') || drill.category.toLowerCase().includes('recovery')
        : selectedAttributeFilter === 'forward'
          ? drill.category.toLowerCase().startsWith('forward')
          : selectedAttributeFilter === 'midfielder'
            ? drill.category.toLowerCase().startsWith('midfield')
            : selectedAttributeFilter === 'defender'
              ? drill.category.toLowerCase().startsWith('defender')
              : selectedAttributeFilter === 'goalkeeper'
                ? drill.category.toLowerCase().startsWith('goalkeeper')
                : selectedAttributeFilter === 'passing'
                  ? drill.category.toLowerCase().includes('passing') || drill.targetAttributes.includes('passing')
                  : drill.targetAttributes.includes(selectedAttributeFilter));

    return matchesText && matchesAttribute;
  });

  return (
    <div id="training-view-container" className="space-y-6">
      
      {/* Standalone Brand Header Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6.5 shadow-lg border border-indigo-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Dumbbell size={200} className="stroke-[3]" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-widest">ATHLETIC LABS</span>
            <span className="text-indigo-200 text-xs font-mono">Performance Hub & Drills Engine</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight">Interactive Training Grounds</h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Maximize squad tactical capabilities and stamina ratios. Establish full team workouts, select specific training drills, and simulate direct stat boosts to improve your players' technical scores in coordination with state metrics.
          </p>
        </div>
      </div>

      {/* WEEKLY DRAG-AND-DROP TRAINING PLANNER */}
      <div id="weekly-training-planner-card" className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-display shadow-sm font-bold shadow-amber-500/10">
              📅
            </div>
            <div>
              <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">Weekly Intensity & Strategy Planner</h3>
              <p className="text-slate-500 text-[11px]">Drag drills from the playbook index and drop onto calendar blocks to design and balance the squad's physical workload.</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
            <span className="text-slate-400 text-[10px] tracking-wider uppercase mr-1">Load Preset Mode:</span>
            <button 
              id="btn-pres-heavy"
              onClick={() => handleLoadTemplate('heavy')} 
              className="px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 transition-colors"
            >
              <Dumbbell size={11} className="inline mr-1" /> Heavy Fitness
            </button>
            <button 
              id="btn-pres-tactical"
              onClick={() => handleLoadTemplate('tactical')} 
              className="px-2.5 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 transition-colors"
            >
              <Shield size={11} className="inline mr-1" /> Tactical Focus
            </button>
            <button 
              id="btn-pres-taper"
              onClick={() => handleLoadTemplate('taper')} 
              className="px-2.5 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 transition-colors"
            >
              <Sparkles size={11} className="inline mr-1" /> Match Taper
            </button>
            <button 
              id="btn-pres-prematch"
              onClick={() => handleLoadTemplate('prematch')} 
              className="px-2.5 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 transition-colors"
            >
              <Target size={11} className="inline mr-1" /> Pre-Match Week
            </button>
            <button 
              id="btn-pres-recovery"
              onClick={() => handleLoadTemplate('recovery')} 
              className="px-2.5 py-1.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 transition-colors"
            >
              <HeartPulse size={11} className="inline mr-1" /> Recovery Week
            </button>
            <button 
              id="btn-pres-forward"
              onClick={() => handleLoadTemplate('forward-focus')} 
              className="px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 transition-colors"
            >
              <Crosshair size={11} className="inline mr-1" /> Forward Focus
            </button>
            <button 
              id="btn-pres-midfield"
              onClick={() => handleLoadTemplate('midfield-focus')} 
              className="px-2.5 py-1.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100 transition-colors"
            >
              <Route size={11} className="inline mr-1" /> Midfield Focus
            </button>
            <button 
              id="btn-pres-defender"
              onClick={() => handleLoadTemplate('defender-focus')} 
              className="px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 transition-colors"
            >
              <Shield size={11} className="inline mr-1" /> Defender Focus
            </button>
            <button 
              id="btn-pres-last-week"
              onClick={() => handleLoadTemplate('last-week')} 
              className="px-2.5 py-1.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 transition-colors"
            >
              <RotateCcw size={11} className="inline mr-1" /> Last Week
            </button>
            <button 
              id="btn-pres-reset"
              onClick={handleClearAllWeekly} 
              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              Reset Week
            </button>
          </div>
        </div>

        {/* Intensity Distribution Trend Graph */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-900 text-white p-4.5 rounded-xl border border-slate-800">
          <div className="md:col-span-1 space-y-2 flex flex-col justify-center">
            <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase">CALENDAR LABS</span>
            <h4 className="font-display font-black text-white text-sm uppercase">Intensity Distribution</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              A real-time aggregate of physical drainage indices across the seven-day cycle. High-intensity spikes should be balanced with tapering periods.
            </p>
            
            {/* Distribution Index info */}
            <div className="mt-2 text-[10px] font-mono space-y-1 p-2 bg-slate-950/60 rounded-lg">
              <div className="flex justify-between items-center text-rose-400 font-bold">
                <span>Heavy Load (13+):</span>
                <span>{DAYS_OF_WEEK.filter(d => weeklySchedule[d].reduce((sum, item) => sum + item.fatigueIncrease, 0) >= 13).length} Days</span>
              </div>
              <div className="flex justify-between items-center text-amber-300 font-bold">
                <span>Optimal (6-12):</span>
                <span>{DAYS_OF_WEEK.filter(d => {
                  const sum = weeklySchedule[d].reduce((sum, item) => sum + item.fatigueIncrease, 0);
                  return sum >= 6 && sum < 13;
                }).length} Days</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Recovery (0-5):</span>
                <span>{DAYS_OF_WEEK.filter(d => weeklySchedule[d].reduce((sum, item) => sum + item.fatigueIncrease, 0) < 6).length} Days</span>
              </div>
            </div>
          </div>

          {/* Mini Chart of weekly Load Curve */}
          <div className="md:col-span-3 flex flex-col justify-end h-36">
            <div className="flex items-end justify-between h-full px-2 mt-4">
              {DAYS_OF_WEEK.map((day) => {
                const load = weeklySchedule[day].reduce((sum, item) => sum + item.fatigueIncrease, 0);
                const maxPossibleLoad = 25; // scaling
                const heightPercent = Math.min(100, Math.max(8, (load / maxPossibleLoad) * 100));
                let barBg = 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                if (load >= 13) {
                  barBg = 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                } else if (load >= 6) {
                  barBg = 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
                }
                
                return (
                  <div key={day} className="flex flex-col items-center flex-1 group">
                    {/* Load indicator badge on hover / top */}
                    <span className="text-[10px] font-mono font-black mb-1.5 text-slate-300 group-hover:text-indigo-400 transition-colors">
                      {load}%
                    </span>
                    
                    {/* Vertical Bar */}
                    <div className="w-6 md:w-8 bg-slate-950 rounded-t-lg overflow-hidden h-24 flex items-end">
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${barBg}`}
                      />
                    </div>

                    {/* Day Name */}
                    <span className="text-[9px] font-sans font-extrabold text-slate-500 uppercase tracking-widest mt-2">{day.substring(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly Drop Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const scheduledList = weeklySchedule[day];
            const totalLoad = scheduledList.reduce((sum, item) => sum + item.fatigueIncrease, 0);
            const dateStr = weekDaysMap[day].dateStr;
            const dayMatches = games.filter(g => (g.type === 'League' || g.type === 'Cup' || g.type === 'Friendly') && g.date === dateStr);
            
            let loadLabel = "RECOVER";
            let loadColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
            let loadDot = "bg-emerald-500";
            if (totalLoad >= 13) {
              loadLabel = "HEAVY LOAD";
              loadColor = "bg-rose-50 text-rose-700 border-rose-100 animate-pulse";
              loadDot = "bg-rose-500";
            } else if (totalLoad >= 6) {
              loadLabel = "OPTIMAL";
              loadColor = "bg-amber-50 text-amber-700 border-amber-100";
              loadDot = "bg-amber-500";
            }

            return (
              <div
                id={`planner-day-${day.toLowerCase()}`}
                key={day}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/20');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/20');
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/20');
                  handleDropDrill(day, e);
                }}
                className="border border-slate-200 bg-slate-50/40 rounded-xl p-3 flex flex-col justify-between min-h-[220px] transition-all relative group/day hover:border-slate-300"
              >
                {/* Day block top layout */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-display font-black text-slate-800 text-xs uppercase tracking-wide leading-tight">{day}</span>
                      <span className="text-[10px] text-indigo-600 font-bold font-mono tracking-tight">{weekDaysMap[day].monthDate}</span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono font-medium">{scheduledList.length} d</span>
                  </div>

                  {/* Load indicator tag */}
                  <div className={`p-1 rounded text-[8px] font-mono font-bold border flex items-center justify-center gap-1 leading-none ${loadColor}`}>
                    <span className={`w-1 h-1 rounded-full ${loadDot}`}></span>
                    <span>{loadLabel} ({totalLoad}%)</span>
                  </div>

                  {/* Match badge if there's a scheduled game */}
                  {dayMatches.length > 0 && dayMatches.map(m => (
                    <div key={m.id} className={`p-1 rounded text-[8px] font-black border flex items-center gap-1 leading-none ${
                      m.type === 'League' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      m.type === 'Cup' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      <Trophy size={9} />
                      <span className="truncate">{m.type === 'League' ? 'LEAGUE' : m.type === 'Cup' ? 'CUP' : 'FRIENDLY'} vs {m.opponent.substring(0, 12)}</span>
                    </div>
                  ))}

                  {/* Scheduled drills list */}
                  <div className="space-y-1.5 pt-1.5">
                    {scheduledList.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-400 text-[9px] flex flex-col items-center justify-center gap-1 select-none">
                        <Hand size={14} className="text-slate-300 mx-auto" />
                        <span className="font-sans leading-tight">Drop drills</span>
                      </div>
                    ) : (
                      scheduledList.map((item) => (
                        <div 
                          id={`scheduled-item-${item.id}`}
                          key={item.id}
                          className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-1.5 hover:border-slate-300 transition-all text-[10px]"
                        >
                          <div className="flex items-center gap-1 truncate pr-1">
                            <span className="text-slate-400 shrink-0">{getDrillIcon(item.drillId)}</span>
                            <span className="font-semibold text-slate-800 truncate leading-tight select-none">
                              {item.name.replace("Challenge", "").replace("Workout", "").replace("Walkthrough", "").replace("Sprints", "")}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveDrill(day, item.id)}
                            className="text-slate-400 hover:text-rose-500 font-bold text-[10px] bg-slate-100 hover:bg-rose-50 w-4 h-4 rounded flex items-center justify-center transition-all shrink-0"
                            title="Remove Drill"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Day footer helper text */}
                <div className="mt-3 text-[8px] font-mono text-slate-400 border-t border-slate-100 pt-1.5 flex justify-between items-center select-none">
                  <span>Daily Load</span>
                  <span className="font-bold text-slate-650">+{totalLoad}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Playbook drills and player development */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Drills Catalog */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Dumbbell size={16} />
                </div>
                <div>
                  <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">Tactical & Technical Drill Selector</h3>
                  <p className="text-slate-400 text-[10px]">Select a specialized drill to check target attribute upgrades and daily load ratios.</p>
                </div>
              </div>
              
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                Found {filteredDrills.length} Drills
              </span>
            </div>

            {/* Filter Section (Search & Pill buttons) */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search drills by name, category, or benefit (e.g. speed, physical, shooting)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Skill Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
                  <Filter size={13} /> Focus Target:
                </span>
                {[
                  { id: 'all', label: 'All Skills' },
                  { id: 'forward', label: 'Forwards' },
                  { id: 'midfielder', label: 'Midfielders' },
                  { id: 'defender', label: 'Defenders' },
                  { id: 'goalkeeper', label: 'Goalkeepers' },
                  { id: 'speed', label: 'Speed' },
                  { id: 'shooting', label: 'Shooting' },
                  { id: 'passing', label: 'Passing' },
                  { id: 'dribbling', label: 'Dribbling' },
                  { id: 'defending', label: 'Defending' },
                  { id: 'physicalness', label: 'Stamina/Physicality' },
                  { id: 'conditioning', label: 'Conditioning & Recovery' },
                ].map((pill) => {
                  const isActive = selectedAttributeFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => setSelectedAttributeFilter(pill.id)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drills Grid */}
            {filteredDrills.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-1.5">
                <Search size={24} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold">No matches found for "{searchQuery}"</p>
                <p className="text-xs text-slate-400">Try modifying your search query or picking another focus target filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDrills.map((drill) => {
                  const isSelected = selectedDrillId === drill.id;
                  const isRecommended = growthNeeds?.isBeneficial(drill);
                  const isExpanded = expandedDrills.has(drill.id);
                  const instructions = DRILL_INSTRUCTIONS[drill.id];

                  const toggleExpand = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setExpandedDrills(prev => {
                      const next = new Set(prev);
                      if (next.has(drill.id)) next.delete(drill.id);
                      else next.add(drill.id);
                      return next;
                    });
                  };

                  return (
                    <div 
                      id={`drill-card-${drill.id}`}
                      key={drill.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, drill.id)}
                      onClick={() => setSelectedDrillId(drill.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden flex flex-col justify-between ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-md scale-[1.01]' 
                          : isRecommended
                            ? 'border-emerald-300 bg-emerald-50/10 hover:border-emerald-400/50 hover:bg-emerald-50/20 shadow-emerald-500/[0.02]'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Professional Lucide icon */}
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${getDrillIconColor(drill.id)}`}>
                          {getDrillIcon(drill.id)}
                        </div>
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-800">{drill.name}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">{drill.category}</span>
                          </div>
                          
                          {isRecommended && (
                            <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-0.5">
                              <Sparkles size={10} /> Highly Recommended
                            </div>
                          )}

                          <p className="text-xs text-slate-500 leading-relaxed pt-1">{drill.description}</p>
                        </div>
                      </div>

                      {/* Drills statistics bumps badges */}
                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold">
                        <span className="text-indigo-600 tracking-wider flex items-center gap-1">
                          <Sparkles size={11} /> BUMP: {Object.entries(drill.statsBumps).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(", ")}
                        </span>
                        <span className="text-rose-500 flex items-center gap-1">
                          <Flame size={11} /> FATIGUE +{drill.fatigueIncrease}%
                        </span>
                      </div>

                      {/* Collapsible How-To Instructions */}
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={toggleExpand}
                          className="w-full flex items-center justify-between text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
                        >
                          <span className="flex items-center gap-1.5"><ClipboardList size={12} /> How-To Guide</span>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {isExpanded && instructions && (
                          <div className="mt-2 space-y-2.5 text-[11px] text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <div className="flex items-start gap-2">
                              <Box size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <div><span className="font-black text-slate-500 uppercase tracking-wider">Equipment:</span> {instructions.equipment}</div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Route size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <div><span className="font-black text-slate-500 uppercase tracking-wider">Setup:</span> {instructions.setup}</div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Activity size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <div><span className="font-black text-slate-500 uppercase tracking-wider">Execution:</span> {instructions.execution}</div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              <div><span className="font-black text-slate-500 uppercase tracking-wider">Sets/Reps:</span> {instructions.setsReps}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Player development and workload tools */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <HeartPulse size={17} className="text-rose-500" />
              <div>
                <h4 className="font-display font-black text-sm text-slate-900">Weekly Load Check</h4>
                <p className="text-[10px] text-slate-500">Fast guidance from the current calendar</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <strong className="block text-lg text-slate-900">{weeklyLoad}%</strong>
                <span className="text-[8px] uppercase font-bold text-slate-400">Total load</span>
              </div>
              <div className="bg-rose-50 rounded-xl p-2.5 text-center border border-rose-100">
                <strong className="block text-lg text-rose-700">{heavyDays}</strong>
                <span className="text-[8px] uppercase font-bold text-rose-500">Heavy days</span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                <strong className="block text-lg text-emerald-700">{recoveryDays}</strong>
                <span className="text-[8px] uppercase font-bold text-emerald-600">Recovery days</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-3.5 flex items-start gap-2.5">
              <ShieldCheck size={17} className={workloadStatus.color} />
              <div>
                <div className={`text-xs font-black ${workloadStatus.color}`}>{workloadStatus.label}</div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{workloadStatus.note}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addDrillsToDay([CRITICAL_DRILLS.find(drill => drill.id === 'drill-mobility')!], developmentDay)}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl py-2 text-[10px] font-black"
            >
              Add recovery flow to {developmentDay}
            </button>
          </div>
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center border border-blue-400/20">
                <User size={17} />
              </div>
              <div>
                <h4 className="font-display font-black text-sm text-white">Player Development Plan</h4>
                <p className="text-[10px] text-slate-400">Review the profile, then build a custom training session</p>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Select player</label>
              <select
                value={recommendPlayerId}
                onChange={(e) => {
                  setRecommendPlayerId(e.target.value);
                  setSelectedTrainingDrillIds([]);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Choose a squad member</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.position})
                  </option>
                ))}
              </select>
            </div>

            {recommendedPlayer && growthNeeds ? (
              <>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={recommendedPlayer.photoUrl}
                        alt={recommendedPlayer.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      {recommendedPlayer.number > 0 && (
                        <span className="absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-md bg-blue-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-slate-950">
                          {recommendedPlayer.number}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="font-display font-black text-sm text-white truncate">{recommendedPlayer.name}</h5>
                          <p className="text-[10px] text-blue-300 font-bold mt-0.5">{recommendedPlayer.position}</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${
                          recommendedPlayer.registrationStatus === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : recommendedPlayer.registrationStatus === 'Pending'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}>
                          {recommendedPlayer.registrationStatus}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-relaxed mt-2 line-clamp-2">
                        {recommendedPlayer.bio || 'No player profile summary has been added yet.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Overall rating</span>
                    <strong className="block text-2xl font-display text-white mt-0.5">{calculateOVR(recommendedPlayer.baseAttributes, recommendedPlayer.positionAttributes)}</strong>
                  </div>
                  <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-3">
                    <span className="text-[9px] text-rose-300 uppercase font-bold">Development gap</span>
                    <strong className="block text-sm capitalize text-white mt-1">{growthNeeds.lowestAttr}</strong>
                    <span className="text-[10px] text-rose-300">{growthNeeds.lowestVal}/99</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Appearances', value: recommendedPlayer.gamesPlayed },
                    { label: 'Goals', value: recommendedPlayer.points },
                    { label: 'Assists', value: recommendedPlayer.assists },
                    { label: 'Contributions', value: playerGoalContributions },
                    { label: 'Minutes', value: recommendedPlayer.minutesPlayed },
                    { label: 'MVP awards', value: recommendedPlayer.mvpAwards }
                  ].map(item => (
                    <div key={item.label} className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-center">
                      <strong className="block text-sm text-white font-display">{item.value}</strong>
                      <span className="text-[7px] text-slate-500 uppercase font-bold tracking-wide">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Attribute profile</span>
                    <span className="text-[8px] text-slate-600">Rating / 99</span>
                  </div>
                  {rankedPlayerAttributes.map(([attribute, value]) => {
                    const isDevelopmentGap = attribute === growthNeeds.lowestAttr;
                    const isStrength = strongestPlayerAttributes.some(([key]) => key === attribute);
                    return (
                      <div key={attribute} className="space-y-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className={`capitalize font-bold ${
                            isDevelopmentGap ? 'text-rose-300' : isStrength ? 'text-emerald-300' : 'text-slate-400'
                          }`}>
                            {attribute === 'physicalness' ? 'Conditioning' : attribute}
                          </span>
                          <span className="font-mono font-black text-slate-300">{value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${value}%` }}
                            className={`h-full rounded-full ${
                              isDevelopmentGap
                                ? 'bg-rose-500'
                                : isStrength
                                  ? 'bg-emerald-400'
                                  : 'bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3">
                    <span className="text-[8px] uppercase font-black tracking-wider text-emerald-400">Top strengths</span>
                    <div className="mt-1.5 space-y-1">
                      {strongestPlayerAttributes.map(([attribute, value]) => (
                        <div key={attribute} className="flex justify-between text-[9px]">
                          <span className="capitalize text-slate-300">{attribute === 'physicalness' ? 'Conditioning' : attribute}</span>
                          <strong className="text-emerald-300">{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3">
                    <span className="text-[8px] uppercase font-black tracking-wider text-blue-400">Role priorities</span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {growthNeeds.positionKeys.map(attribute => (
                        <span key={attribute} className="capitalize text-[8px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">
                          {attribute === 'physicalness' ? 'Conditioning' : attribute}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Build training session</span>
                      <p className="text-[9px] text-slate-500 mt-1">Choose any combination of drills for this player.</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'technical', label: 'Technical' },
                        { id: 'tactical', label: 'Tactical' },
                        { id: 'conditioning', label: 'Conditioning' },
                        { id: 'recovery', label: 'Recovery' }
                      ].map(focus => (
                        <button
                          key={focus.id}
                          type="button"
                          onClick={() => setDevelopmentFocus(focus.id as typeof developmentFocus)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                            developmentFocus === focus.id
                              ? 'bg-blue-500 border-blue-400 text-white'
                              : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {focus.label}
                        </button>
                      ))}
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5">
                      {developmentDrills.map(drill => {
                        const isChosen = selectedTrainingDrillIds.includes(drill.id);
                        const supportsGap = drill.targetAttributes.includes(growthNeeds.lowestAttr);
                        return (
                          <button
                            key={drill.id}
                            type="button"
                            onClick={() => toggleTrainingDrill(drill.id)}
                            aria-pressed={isChosen}
                            className={`w-full text-left flex items-center gap-2.5 rounded-xl p-2.5 border transition-all ${
                              isChosen
                                ? 'bg-blue-500/15 border-blue-400/60'
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                              isChosen ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-600 text-transparent'
                            }`}>
                              <CheckCircle size={12} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-white font-bold truncate">{drill.name}</span>
                                {supportsGap && (
                                  <span className="text-[7px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1 py-0.5 rounded shrink-0">
                                    Develops gap
                                  </span>
                                )}
                              </div>
                              <div className="text-[8px] text-slate-500 mt-0.5">
                                {drill.category} · Load {drill.fatigueIncrease}% · {Object.entries(drill.statsBumps).map(([key, value]) => `${key === 'physicalness' ? 'conditioning' : key} +${value}`).join(', ')}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Session summary</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTrainingDrillIds([])}
                          disabled={selectedTrainingDrillIds.length === 0}
                          className="text-[8px] text-slate-500 hover:text-white disabled:opacity-40"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900 rounded-lg p-2">
                          <strong className="block text-sm text-white">{selectedTrainingDrills.length}</strong>
                          <span className="text-[8px] text-slate-500 uppercase">Selected drills</span>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2">
                          <strong className={`block text-sm ${selectedTrainingLoad >= 13 ? 'text-rose-300' : selectedTrainingLoad >= 6 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {selectedTrainingLoad}%
                          </strong>
                          <span className="text-[8px] text-slate-500 uppercase">Session load</span>
                        </div>
                      </div>
                      {Object.keys(projectedTrainingGains).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(projectedTrainingGains).map(([attribute, gain]) => (
                            <span key={attribute} className="text-[8px] capitalize bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              {attribute === 'physicalness' ? 'conditioning' : attribute} +{gain}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-600">Select at least one drill to create a session.</p>
                      )}
                    </div>
                  </div>
                  {false && selectedTrainingDrills.map((drill, index) => (
                    <div key={drill.id} className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                      <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-300 flex items-center justify-center text-[9px] font-black">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-white font-bold truncate">{drill.name}</div>
                        <div className="text-[9px] text-slate-500">{drill.category} · Load {drill.fatigueIncrease}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={developmentDay}
                    onChange={(e) => setDevelopmentDay(e.target.value as DayName)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-[11px] text-slate-200"
                    aria-label="Development plan day"
                  >
                    {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => addDrillsToDay(selectedTrainingDrills, developmentDay)}
                    disabled={selectedTrainingDrills.length === 0}
                    className="bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 text-[10px] font-black flex items-center gap-1.5"
                  >
                    <CalendarPlus size={13} /> Schedule
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCompleteDevelopmentSession}
                  disabled={selectedTrainingDrills.length === 0}
                  className="w-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-300 rounded-xl py-2 text-[10px] font-black flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={13} /> Complete selected training and apply gains
                </button>
              </>
            ) : (
              <div className="border border-dashed border-slate-700 rounded-xl p-5 text-center">
                <User size={20} className="mx-auto text-slate-600 mb-2" />
                <p className="text-[10px] text-slate-400 leading-relaxed">Choose a player to identify their weakest attribute and build a practical three-drill session.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
