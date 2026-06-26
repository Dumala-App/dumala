import React, { useMemo, useRef, useState } from 'react';
import { AssessmentSession, Player, SPECIALTY_TRAITS, SpecialtyTrait, STAFF_POSITIONS } from '../types';
import { X, Award, Shield, User, Zap, CircleDot, Activity, Save, Edit2, Briefcase, Calendar, Mail, Phone, AlertTriangle, Clock, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { FieldError, FormErrorSummary } from './FormValidation';
import {
  FieldErrors,
  focusFirstInvalidField,
  hasFieldErrors,
  mergeFieldErrors,
  parseIntegerInput
} from '../forms/validation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

type PlayerProgressPoint = {
  name: string;
  opponent: string;
  points: number;
  cumulative: number;
  dataLabel: string;
};
type PlayerTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: PlayerProgressPoint }>;
};

type ProfileField =
  | 'name'
  | 'number'
  | 'position'
  | 'gamesPlayed'
  | 'points'
  | 'assists'
  | 'cleanSheetsOrRebounds'
  | 'minutesPlayed'
  | 'mvpAwards'
  | 'yellowCards'
  | 'redCards'
  | 'age'
  | 'height'
  | 'weight';

const PLAYER_POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'] as const;

const integerError = (result: ReturnType<typeof parseIntegerInput>): string | undefined => (
  'errors' in result ? result.errors.value : undefined
);

const integerValue = (result: ReturnType<typeof parseIntegerInput>, fallback = 0): number => (
  'value' in result ? result.value : fallback
);

const optionalIntegerValue = (
  result: ReturnType<typeof parseIntegerInput> | { ok: true; value: undefined },
  fallback?: number
): number | undefined => (
  'value' in result ? result.value : fallback
);

const CustomTooltip = ({ active, payload, label }: PlayerTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl shadow-xl text-xs text-white">
        <p className="font-bold text-amber-400 mb-1.5">{label} vs {data.opponent}</p>
        <div className="space-y-1 text-slate-300">
          <p className="flex justify-between gap-6">
            <span>{data.dataLabel ?? 'Goals Scored'}:</span>
            <span className="font-mono font-bold text-white">{data.points}</span>
          </p>
          <p className="flex justify-between gap-6 border-t border-slate-800 pt-1 mt-1">
            <span>Season Progression:</span>
            <span className="font-mono font-bold text-amber-300">{data.cumulative} G</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface PlayerProfileModalProps {
  player: Player;
  onClose: () => void;
  onUpdate: (updatedPlayer: Player) => void;
  onRemove: (playerId: string) => void;
  assessments: AssessmentSession[];
  onOpenAssessments: (playerId: string) => void;
}

export default function PlayerProfileModal({ player, onClose, onUpdate, onRemove, assessments, onOpenAssessments }: PlayerProfileModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useDialogAccessibility(dialogRef, true, onClose);
  const isStaff = false;
  const [isEditing, setIsEditing] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [name, setName] = useState(player.name);
  const [number, setNumber] = useState(String(player.number));
  const [position, setPosition] = useState(player.position);
  const [bio, setBio] = useState(player.bio);
  const [status, setStatus] = useState(player.registrationStatus);
  const [gamesPlayed, setGamesPlayed] = useState(String(player.gamesPlayed));
  const [points, setPoints] = useState(String(player.points)); // Goals
  const [assists, setAssists] = useState(String(player.assists));
  const [cleanSheetsOrRebounds, setCleanSheetsOrRebounds] = useState(String(player.cleanSheetsOrRebounds));
  const [minutesPlayed, setMinutesPlayed] = useState(String(player.minutesPlayed));
  const [mvpAwards, setMvpAwards] = useState(String(player.mvpAwards));
  const [yellowCards, setYellowCards] = useState(String(player.yellowCards));
  const [redCards, setRedCards] = useState(String(player.redCards));
  const [photoUrl, setPhotoUrl] = useState(player.photoUrl);
  const [age, setAge] = useState(player.age === undefined ? '' : String(player.age));
  const [height, setHeight] = useState(player.height === undefined ? '' : String(player.height));
  const [weight, setWeight] = useState(player.weight === undefined ? '' : String(player.weight));
  const [specialtyTraits, setSpecialtyTraits] = useState<string[]>(player.specialtyTraits || []);
  const [coachNotes, setCoachNotes] = useState(player.coachNotes || '');
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileField>>({});

  // Staff-specific state
  const legacyStaffFields = player as Player & { email?: string; phone?: string; since?: string };
  const [staffEmail, setStaffEmail] = useState(legacyStaffFields.email || '');
  const [staffPhone, setStaffPhone] = useState(legacyStaffFields.phone || '');
  const [staffSince, setStaffSince] = useState(legacyStaffFields.since || '');
  const [staffBio, setStaffBio] = useState(bio);

  const [baseAttributes, setBaseAttributes] = useState(player.baseAttributes || { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 });
  const [positionAttributes, setPositionAttributes] = useState(player.positionAttributes || {});

  const latestAssessment = useMemo(() => {
    return [...assessments]
      .filter(s => s.playerId === player.id)
      .sort((a, b) => {
        const ad = new Date(a.assessmentDate).getTime();
        const bd = new Date(b.assessmentDate).getTime();
        if (ad !== bd) return bd - ad;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];
  }, [assessments, player.id]);

  const parsedPoints = Number.parseInt(points, 10);
  const parsedCleanSheets = Number.parseInt(cleanSheetsOrRebounds, 10);
  const parsedAssists = Number.parseInt(assists, 10);
  const parsedMvpAwards = Number.parseInt(mvpAwards, 10);
  const parsedGamesPlayed = Number.parseInt(gamesPlayed, 10);
  const parsedMinutesPlayed = Number.parseInt(minutesPlayed, 10);
  const parsedYellowCards = Number.parseInt(yellowCards, 10);
  const parsedRedCards = Number.parseInt(redCards, 10);
  const displayPoints = Number.isFinite(parsedPoints) ? parsedPoints : 0;
  const displayCleanSheets = Number.isFinite(parsedCleanSheets) ? parsedCleanSheets : 0;
  const displayAssists = Number.isFinite(parsedAssists) ? parsedAssists : 0;
  const displayMvpAwards = Number.isFinite(parsedMvpAwards) ? parsedMvpAwards : 0;
  const displayGamesPlayed = Number.isFinite(parsedGamesPlayed) ? parsedGamesPlayed : 0;
  const displayMinutesPlayed = Number.isFinite(parsedMinutesPlayed) ? parsedMinutesPlayed : 0;
  const displayYellowCards = Number.isFinite(parsedYellowCards) ? parsedYellowCards : 0;
  const displayRedCards = Number.isFinite(parsedRedCards) ? parsedRedCards : 0;

  const progressionData = useMemo(() => {
    const isGoalkeeper = position === 'Goalkeeper';
    const sourceValue = isGoalkeeper ? displayCleanSheets : displayPoints;
    const weights = [0.15, 0.25, 0.1, 0.3, 0.2];
    let remaining = sourceValue;
    const perGame = [0, 0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      const target = Math.round(sourceValue * weights[i]);
      const val = Math.min(remaining, target);
      perGame[i] = val;
      remaining -= val;
    }
    perGame[4] = Math.max(0, remaining);

    const currentSum = perGame.reduce((a, b) => a + b, 0);
    if (currentSum !== sourceValue) {
      const diff = sourceValue - currentSum;
      perGame[4] = Math.max(0, perGame[4] + diff);
      const newSum = perGame.reduce((a, b) => a + b, 0);
      if (newSum !== sourceValue) {
        let fillAmt = sourceValue - newSum;
        perGame[2] = Math.max(0, perGame[2] + fillAmt);
      }
    }

    const opponents = [
      "Glacier Rovers",
      "Silverback Academy",
      "Ironclad FC",
      "Coastal Warriors",
      "Phoenix Athletic"
    ];

    let cumulative = 0;
    const dataLabel = isGoalkeeper ? 'Clean Sheets' : 'Goals Scored';
    return perGame.map((val, idx) => {
      cumulative += val;
      return {
        name: `Match ${idx + 1}`,
        opponent: opponents[idx],
        points: val,
        cumulative: cumulative,
        dataLabel
      };
    });
  }, [player.id, displayPoints, displayCleanSheets, position]);

  const handleSave = () => {
    const trimmedName = name.trim();
    const parsedNumber = parseIntegerInput(number, { label: 'Squad number', min: 1, max: 99 });
    const parsedGamesPlayed = parseIntegerInput(gamesPlayed, { label: 'Games played', min: 0 });
    const parsedGoals = parseIntegerInput(points, { label: 'Goals scored', min: 0 });
    const parsedAssists = parseIntegerInput(assists, { label: 'Assists', min: 0 });
    const parsedSheets = parseIntegerInput(cleanSheetsOrRebounds, { label: 'Clean sheets or goal contributions', min: 0 });
    const parsedMinutes = parseIntegerInput(minutesPlayed, { label: 'Minutes played', min: 0 });
    const parsedMvp = parseIntegerInput(mvpAwards, { label: 'MVP awards', min: 0 });
    const parsedYellows = parseIntegerInput(yellowCards, { label: 'Yellow cards', min: 0 });
    const parsedReds = parseIntegerInput(redCards, { label: 'Red cards', min: 0 });
    const parsedAge = age.trim() ? parseIntegerInput(age, { label: 'Age', min: 10, max: 80 }) : { ok: true as const, value: undefined };
    const parsedHeight = height.trim() ? parseIntegerInput(height, { label: 'Height', min: 100, max: 250 }) : { ok: true as const, value: undefined };
    const parsedWeight = weight.trim() ? parseIntegerInput(weight, { label: 'Weight', min: 30, max: 250 }) : { ok: true as const, value: undefined };

    const nextErrors = mergeFieldErrors<ProfileField>(
      trimmedName ? {} : { name: isStaff ? 'Staff name is required.' : 'Player name is required.' },
      isStaff || parsedNumber.ok ? {} : { number: integerError(parsedNumber) },
      isStaff || PLAYER_POSITIONS.includes(position as typeof PLAYER_POSITIONS[number])
        ? {}
        : { position: 'Choose a supported player position.' },
      isStaff || parsedGamesPlayed.ok ? {} : { gamesPlayed: integerError(parsedGamesPlayed) },
      isStaff || parsedGoals.ok ? {} : { points: integerError(parsedGoals) },
      isStaff || parsedAssists.ok ? {} : { assists: integerError(parsedAssists) },
      isStaff || parsedSheets.ok ? {} : { cleanSheetsOrRebounds: integerError(parsedSheets) },
      isStaff || parsedMinutes.ok ? {} : { minutesPlayed: integerError(parsedMinutes) },
      isStaff || parsedMvp.ok ? {} : { mvpAwards: integerError(parsedMvp) },
      isStaff || parsedYellows.ok ? {} : { yellowCards: integerError(parsedYellows) },
      isStaff || parsedReds.ok ? {} : { redCards: integerError(parsedReds) },
      isStaff || parsedAge.ok ? {} : { age: integerError(parsedAge) },
      isStaff || parsedHeight.ok ? {} : { height: integerError(parsedHeight) },
      isStaff || parsedWeight.ok ? {} : { weight: integerError(parsedWeight) }
    );

    if (
      hasFieldErrors(nextErrors)
      || (!isStaff && (
        !parsedNumber.ok
        || !parsedGamesPlayed.ok
        || !parsedGoals.ok
        || !parsedAssists.ok
        || !parsedSheets.ok
        || !parsedMinutes.ok
        || !parsedMvp.ok
        || !parsedYellows.ok
        || !parsedReds.ok
        || !parsedAge.ok
        || !parsedHeight.ok
        || !parsedWeight.ok
      ))
    ) {
      setProfileErrors(nextErrors);
      focusFirstInvalidField(dialogRef.current, nextErrors);
      return;
    }

    onUpdate({
      ...player,
      name: trimmedName,
      number: integerValue(parsedNumber, player.number),
      position,
      bio,
      photoUrl,
      age: optionalIntegerValue(parsedAge, player.age),
      height: optionalIntegerValue(parsedHeight, player.height),
      weight: optionalIntegerValue(parsedWeight, player.weight),
      specialtyTraits: specialtyTraits.length > 0 ? specialtyTraits : undefined,
      coachNotes: coachNotes || undefined,
      registrationStatus: status,
      gamesPlayed: integerValue(parsedGamesPlayed, player.gamesPlayed),
      points: integerValue(parsedGoals, player.points),
      assists: integerValue(parsedAssists, player.assists),
      cleanSheetsOrRebounds: integerValue(parsedSheets, player.cleanSheetsOrRebounds),
      minutesPlayed: integerValue(parsedMinutes, player.minutesPlayed),
      mvpAwards: integerValue(parsedMvp, player.mvpAwards),
      yellowCards: integerValue(parsedYellows, player.yellowCards),
      redCards: integerValue(parsedReds, player.redCards),
      baseAttributes,
      positionAttributes
    });
    setProfileErrors({});
    setIsEditing(false);
  };

  const handleBaseAttrChange = (key: keyof Player['baseAttributes'], val: number) => {
    setBaseAttributes(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handlePosAttrChange = (key: string, val: number) => {
    setPositionAttributes(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const getAvailableTraits = (pos: string): SpecialtyTrait[] => SPECIALTY_TRAITS[pos] || [];

  const handleToggleTrait = (traitLabel: string) => {
    setSpecialtyTraits(prev => {
      const isRemoving = prev.includes(traitLabel);
      const next = isRemoving
        ? prev.filter(t => t !== traitLabel) 
        : prev.length < 4 ? [...prev, traitLabel] : prev;
      
      // Auto-populate coaching verdict templates when selecting traits
      if (!isRemoving && next.length > prev.length) {
        const template = TRAIT_VERDICT_TEMPLATES[traitLabel];
        if (template) {
          const currentNotes = coachNotes.trim();
          if (!currentNotes || currentNotes === getDefaultVerdict()) {
            // First trait or still showing default — replace entirely
            setCoachNotes(template);
          } else if (!currentNotes.includes(template)) {
            // Append the new trait's template as a new paragraph
            setCoachNotes(currentNotes + '\n\n' + template);
          }
        }
      }
      return next;
    });
  };

  const getDefaultVerdict = () => {
    if (position === 'Goalkeeper') 
      return 'Strong last-line presence with commanding box control. Shot-stopping reflex work remains vital to clean sheet consistency across fixtures.';
    if (position === 'Defender') 
      return 'Solid defensive anchor with disciplined positional awareness. Key contributor to the backline structure and pressing coordination.';
    if (position === 'Midfielder')
      return 'Creative engine in the middle third. Dictates tempo, links phases of play, and provides consistent progressive distribution.';
    return 'Clinical in the final third with intelligent movement off the ball. Reliable goal threat and key catalyst for attacking transition play.';
  };

  // Trait → Coaching Verdict templates
  const TRAIT_VERDICT_TEMPLATES: Record<string, string> = {
    'Speedster': 'Pure pace merchant who stretches defensive lines at will. Deploy in counter-attacking phases and use overlapping runs to exploit channels. Opposition fullbacks must stay compact when this player is on the pitch.',
    'Clinical Finisher': 'Ice-cool in front of goal with elite composure under pressure. Trust in 1v1 situations and ensure service arrives in the box early. Converts half-chances into goals at an above-average rate.',
    'Target Man': 'Physical focal point who holds up play and brings others into the attack. Feed to feet or chest, allow runners to break beyond. Dominant in aerial duels – target corners and crosses to the back post.',
    'Dribbler': 'Close-control specialist who can unlock tight defensive blocks with individual flair. Give license to take on defenders in the final third. Isolate against slower fullbacks to create overloads.',
    'Poacher': 'Instinctive goal-sniffer who thrives on loose balls, rebounds, and defensive mistakes inside the box. Position near the penalty spot and react before markers can adjust. Not heavily involved in build-up but decisive in the final action.',
    'False 9': 'Intelligent withdrawn striker who drops into midfield to create numerical superiority and disrupt defensive shape. Encourages center-backs to step out, opening lanes for onrushing wingers and midfield runners.',
    'Winger': 'Wide outlet who provides width and service from the flanks. Encourage early crosses and cutback deliveries. Defensively responsible to track the opposing fullback on transitions.',
    'First Touch': 'Immaculate ball reception under pressure. Excellent at killing difficult passes and setting up the next move in one fluid motion. Ideal for high-tempo combination play in congested areas.',
    'Aerial Threat': 'Dominant in the air at both ends of the pitch. A set-piece weapon in attack and a commanding clearing presence in defense. Target on attacking corners and stay goal-side on defensive set plays.',
    'Counter Attack': 'Deadly in transition moments. Springs forward at the first sign of possession turnover. Needs early release passes into space to maximize acceleration against retreating defenses.',
    'Link-Up Play': 'Intelligent connector who bridges defense, midfield, and attack through clever layoffs and one-touch combinations. Key to maintaining possession rhythm in the middle and final thirds.',
    'Chip Shot': 'Creative finisher with flair. Capable of lifting the ball over advancing goalkeepers with precision. Encourage to attempt when the keeper is off their line or charging out.',
    'Playmaker': 'Creative hub of the team. Dictates tempo, finds pockets of space, and supplies the forwards with progressive passes. Build possession through this player and give freedom to roam between the lines.',
    'Box-to-Box': 'Relentless engine that covers every blade of grass. Contributes at both ends of the pitch with late runs into the box and recovery tackles. Essential for maintaining intensity across 90 minutes.',
    'Deep Lying': `Quarterback from deep positions who controls the game's rhythm. Splits defensive lines with long diagonals and switches of play. Protects the backline while initiating attacking sequences.`,
    'Engine': 'High-capacity runner who maintains work rate from the first whistle to the last. Covers teammates, fills gaps, and provides constant passing options. Undroppable in high-intensity systems.',
    'Long Shot Taker': 'Threat from distance who keeps goalkeepers honest. Look for shooting opportunities from 20+ yards when defenses sit deep. Deflections and rebounds create secondary chances.',
    'Set Piece Specialist': 'Dead-ball expert delivering consistent quality from corners, free kicks, and penalties. Assign as the primary taker for all set-piece situations. Curl, power, or placement — reads the moment.',
    'Anchor': 'Shield in front of the defense who breaks up opposition play and distributes simply to more creative teammates. Stay positionally disciplined and avoid being drawn out of the defensive shape.',
    'Tempo Setter': `Controls match rhythm with intelligent short passing and movement. Knows when to slow down to kill opposition momentum or speed up to exploit fatigue. The team's metronome.`,
    'Through Ball': 'Specialist in unlocking defenses with perfectly weighted passes splitting lines. Look for runs from forwards and wingers cutting inside. Vision and execution separate this player from ordinary distributors.',
    'Ball Winner': 'Aggressive presser who excels at regaining possession in midfield. Trigger the press when the opposition faces their own goal. Creates transition moments from turnovers high up the pitch.',
    'Vision': 'Sees passes others cannot. Scanning constantly to identify runners and space. Excels at switching play and executing no-look passes that wrong-foot defensive shapes.',
    'Wall': 'Immovable defensive rock who blocks shots, wins headers, and reads danger before it develops. Organize the backline around this player. Let them take the lead on defensive shape and engagement triggers.',
    'Ball-Playing CB': 'Modern center-back who starts attacks from deep. Comfortable carrying the ball into midfield and breaking lines with passes. Build possession from the back through this defender.',
    'Sweeper': 'Last line of defense who reads the game and cleans up danger behind the backline. Position to cover through balls and coordinate the offside trap. Must communicate constantly with the defensive line.',
    'Wingback Overlap': 'Athletic wide defender who provides attacking width and crosses from advanced positions. Synchronize with the winger to create 2v1 overloads. Must have the stamina to recover defensively.',
    'Man Marker': `Shadows the opposition's most dangerous attacker and neutralizes their influence. Stay touch-tight, anticipate runs, and deny space. Disrupt rhythm through physical presence and concentration.`,
    'Aerial Dominant': 'Commands the air with authority. Wins headers in both boxes and clears danger on set pieces. A crucial asset on attacking corners as a primary target.',
    'Tackling Machine': 'Combative defender who wins duels with precision timing and physical intensity. Clean slide tackles and well-judged interceptions define this player. Opposition dribblers think twice before engaging.',
    'Last-Ditch Tackle': 'Desperation specialist who makes goal-saving challenges when all seems lost. Reads the moment perfectly to block, slide, or intercept at the last possible instant. Reliable cover for defensive gaps.',
    'Offside Trap': `Master of the defensive line who coordinates the back four's step-up timing. Anticipates through balls and catches attackers in offside positions with disciplined positioning.`,
    'Crossing Expert': 'Precision delivery from wide areas into dangerous zones. Can whip, float, or drive crosses depending on the situation. Look for target players making near-post and far-post runs.',
    'Leadership': 'Vocal organizer who commands respect and sets standards throughout the squad. Leads by example with body language, work ethic, and communication. Natural choice for captaincy responsibilities.',
    'Shot Stopper': 'Reflex-based goalkeeper who excels at reaction saves from close range. Spread big in 1v1 situations. Dominates the goal line with cat-like agility and fearless diving.',
    'Sweeper Keeper': 'Modern goalkeeper who plays high off the line to sweep up through balls and act as an 11th outfield player in possession. Must have excellent judgment and footwork to avoid being caught out.',
    'Penalty Specialist': `Elite penalty-saving record with psychological edge over takers. Research opponents' tendencies and use mind games to increase save probability. A weapon in knockout football.`,
    'Commanding Presence': 'Dominates the penalty area with authority. Claims crosses confidently and organizes the defense with loud, clear communication. Players feel secure knowing this keeper owns the box.',
    'Reflex King': 'Lightning-fast reactions from close range. Explosive diving and quick footwork make this keeper near-impossible to beat from inside the box. Trust instincts in chaotic goalmouth scrambles.',
    'Distribution Expert': 'Exceptional ball-playing goalkeeper who launches attacks with accurate thrown or kicked distributions. Can bypass the press with long deliveries to wingers or start short passing sequences.',
    'One-on-One': 'Excels when isolated against an attacker. Closes down angles aggressively and stays big to force the striker into mistakes. Rarely beaten when facing a single opponent bearing down on goal.',
    'Cross Collector': 'Confidently claims crosses in crowded penalty areas. Strong hands and excellent timing allow commanding collection of high balls, relieving pressure on the defensive line.',
    'Long Throw': 'Possesses an unusually long throw that functions like a set piece. Can launch the ball deep into the opposition half to start counter-attacks or create goal-scoring opportunities.',
    'Footwork': `Technically proficient with the ball at feet. Comfortable receiving back-passes under pressure and contributing to the team's build-up play with accurate short and medium-range passing.`
  };

  return (
    <div 
      id="player-profile-overlay"
      className="fixed inset-0 bg-slate-950/85 flex justify-center items-start py-4 sm:py-6 px-4 z-[140] overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-profile-fullname"
        id="player-profile-modal-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto text-slate-800 border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header Compact Banner */}
        <div className="p-5.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative border-b border-indigo-900/50">
          <button 
            id="close-profile-btn"
            onClick={onClose}
            className="absolute top-4.5 right-4.5 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white/90 hover:text-white"
          >
            <X size={15} />
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-5 mt-2">
            <div className="relative group shrink-0">
              <img 
                id="player-profile-img"
                src={photoUrl} 
                alt={player.name}
                className="w-20 h-20 rounded-full object-cover border-3 border-indigo-400/40 shadow-inner"
                referrerPolicy="no-referrer"
              />
              {isEditing && (
                <>
                  <input 
                    id="profile-photo-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setPhotoUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => document.getElementById('profile-photo-upload-input')?.click()}
                    className="absolute inset-0 bg-slate-950/75 hover:bg-slate-950/85 rounded-full flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-wider transition-all border border-indigo-500/30 cursor-pointer"
                  >
                    <span>Upload</span>
                    <span>Photo</span>
                  </button>
                </>
              )}
            </div>
            
            <div className="text-center sm:text-left flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {!isStaff && (
                  <span id="player-profile-jersey" className="bg-amber-400 text-slate-950 font-mono font-black px-2 py-0.5 rounded text-[11px] tracking-tight">
                    #{number}
                  </span>
                )}
                <span id="player-profile-pos" className={`font-bold px-2 py-0.5 rounded text-[11px] border uppercase tracking-wider ${
                  isStaff ? 'bg-amber-400/20 border-amber-400/30 text-amber-300' : 'bg-white/10 text-slate-100 border-white/10'
                }`}>
                  {isStaff && '👔 '}{position}
                </span>
                {!isStaff && (
                  <span id="player-profile-status" className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                    status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    ● {status}
                  </span>
                )}
              </div>
              
              {isEditing ? (
                <div className="mt-2.5 space-y-2">
                  <FormErrorSummary id="profile-error-summary" errors={profileErrors} />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div>
                      <input 
                        id="edit-player-name"
                        data-validation-field="name"
                        type="text" 
                        value={name} 
                        onChange={e => {
                          setName(e.target.value);
                          setProfileErrors(previous => ({ ...previous, name: undefined }));
                        }}
                        aria-invalid={Boolean(profileErrors.name)}
                        aria-describedby={profileErrors.name ? 'edit-player-name-error' : undefined}
                        className={`bg-white/15 border text-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 font-display font-bold text-lg w-full max-w-[240px] ${
                          profileErrors.name
                            ? 'border-rose-300 focus:ring-rose-300'
                            : 'border-white/20 focus:ring-amber-400'
                        }`}
                        placeholder={isStaff ? "Staff Name" : "Player Name"}
                      />
                      <FieldError id="edit-player-name-error" message={profileErrors.name} />
                    </div>
                    {isStaff ? (
                      <select
                        id="edit-staff-role-select"
                        value={position}
                        onChange={e => setPosition(e.target.value)}
                        className="bg-white px-2 py-1.5 rounded-lg text-xs font-bold"
                      >
                        {STAFF_POSITIONS.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-2 text-slate-900 shrink-0">
                        <div>
                          <input 
                            id="edit-player-number"
                            data-validation-field="number"
                            type="number" 
                            min="1"
                            max="99"
                            step="1"
                            inputMode="numeric"
                            value={number} 
                            placeholder="No."
                            onChange={e => {
                              setNumber(e.target.value);
                              setProfileErrors(previous => ({ ...previous, number: undefined }));
                            }}
                            aria-invalid={Boolean(profileErrors.number)}
                            aria-describedby={profileErrors.number ? 'edit-player-number-error' : undefined}
                            className={`bg-white px-2.5 py-1.5 rounded-lg w-16 text-xs font-mono font-bold border ${
                              profileErrors.number ? 'border-rose-400' : 'border-transparent'
                            }`}
                          />
                          <FieldError id="edit-player-number-error" message={profileErrors.number} />
                        </div>
                        <div>
                          <select
                            id="edit-player-pos-select"
                            data-validation-field="position"
                            value={position}
                            onChange={e => {
                              setPosition(e.target.value);
                              setProfileErrors(previous => ({ ...previous, position: undefined }));
                            }}
                            aria-invalid={Boolean(profileErrors.position)}
                            aria-describedby={profileErrors.position ? 'edit-player-position-error' : undefined}
                            className={`bg-white px-2 py-1.5 rounded-lg text-xs font-bold border ${
                              profileErrors.position ? 'border-rose-400' : 'border-transparent'
                            }`}
                          >
                            <option value="Forward">Forward</option>
                            <option value="Midfielder">Midfielder</option>
                            <option value="Defender">Defender</option>
                            <option value="Goalkeeper">Goalkeeper</option>
                          </select>
                          <FieldError id="edit-player-position-error" message={profileErrors.position} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <h2 id="player-profile-fullname" className="text-xl sm:text-2xl font-display font-black tracking-tight text-white">{name}</h2>
              )}
              
              {/* Physical Profile Chips beside name - only for athletes */}
              {!isStaff && (player.age || player.height || player.weight) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {player.age && (
                    <span className="text-[10px] bg-white/10 border border-white/15 text-white/80 px-2 py-0.5 rounded-md font-mono font-bold">
                      {player.age} yrs
                    </span>
                  )}
                  {player.height && (
                    <span className="text-[10px] bg-white/10 border border-white/15 text-white/80 px-2 py-0.5 rounded-md font-mono font-bold">
                      {player.height} cm
                    </span>
                  )}
                  {player.weight && (
                    <span className="text-[10px] bg-white/10 border border-white/15 text-white/80 px-2 py-0.5 rounded-md font-mono font-bold">
                      {player.weight} kg
                    </span>
                  )}
                </div>
              )}
              
              {!isStaff && (
                <p id="player-profile-bio-summary" className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-lg italic font-medium">
                  {isEditing ? (
                    <textarea 
                      id="edit-player-bio"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={2}
                      className="w-full bg-white/10 border border-white/25 rounded-lg p-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 not-italic leading-relaxed font-normal"
                      placeholder="Enter athlete synopsis or personal bio..."
                    />
                  ) : (
                    `"${bio || 'Highly motivated squad member.'}"`
                  )}
                </p>
              )}
            </div>

            <div className="shrink-0 self-center pt-2 sm:pt-0 flex flex-col items-center gap-1">
              {isEditing ? (
                <button 
                  id="save-profile-btn"
                  onClick={handleSave}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-xs uppercase tracking-wide"
                >
                  <Save size={13} /> Save Data
                </button>
              ) : (
                <button 
                  id="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-black px-1.5 py-1 rounded-md transition-all border border-white/15 inline-flex items-center justify-center gap-0.5 text-[7px] uppercase tracking-normal"
                >
                  <Edit2 size={8} /> Modify Profile
                </button>
              )}
              {!isStaff && !isEditing && (
                <button
                  type="button"
                  id="remove-player-profile-btn"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="inline-flex items-center justify-center gap-0.5 rounded px-1 py-0.5 text-[6px] font-bold uppercase tracking-normal text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                >
                  <Trash2 size={7} />
                  Remove Player
                </button>
              )}
            </div>
          </div>
        </div>

        {showRemoveConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-profile-player-title"
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2 size={19} />
              </div>
              <h3 id="remove-profile-player-title" className="font-display text-lg font-black text-slate-900">
                Remove {player.name}?
              </h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
                This permanently removes the player and their saved statistics from this browser.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(player.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-rose-700"
                >
                  <Trash2 size={13} />
                  Remove Player
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body Info Sections */}
        {isStaff ? (
          /* STAFF PROFILE LAYOUT */
          <div className="p-5 bg-slate-50/50 space-y-4">
            {/* Staff Bio Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/50">
              <h3 className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Briefcase size={13} className="text-amber-500" /> Staff Profile
              </h3>
              {isEditing ? (
                <textarea
                  id="edit-staff-bio"
                  value={staffBio}
                  onChange={e => setStaffBio(e.target.value)}
                  rows={5}
                  placeholder="Write a detailed staff bio covering their background, experience, philosophy, and key responsibilities within the club..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium leading-relaxed text-slate-700"
                />
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {staffBio || 'No biography has been added for this staff member yet.'}
                </p>
              )}
            </div>

            {/* Staff Info Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/50">
              <h3 className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <User size={13} className="text-indigo-600" /> Contact & Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <Briefcase size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-20 shrink-0 font-bold uppercase tracking-wider text-[10px]">Role</span>
                  <span className="text-slate-700 font-bold">{position}</span>
                </div>
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-3 text-xs">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 w-20 shrink-0 font-bold uppercase tracking-wider text-[10px]">Email</span>
                      <input
                        id="edit-staff-email"
                        type="email"
                        value={staffEmail}
                        onChange={e => setStaffEmail(e.target.value)}
                        placeholder="coach@club.com"
                        className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 w-20 shrink-0 font-bold uppercase tracking-wider text-[10px]">Phone</span>
                      <input
                        id="edit-staff-phone"
                        type="text"
                        value={staffPhone}
                        onChange={e => setStaffPhone(e.target.value)}
                        placeholder="+1 234 567 890"
                        className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 w-20 shrink-0 font-bold uppercase tracking-wider text-[10px]">Since</span>
                      <input
                        id="edit-staff-since"
                        type="text"
                        value={staffSince}
                        onChange={e => setStaffSince(e.target.value)}
                        placeholder="e.g. Jan 2025"
                        className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-xs">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 w-20 shrink-0 font-bold uppercase tracking-wider text-[10px]">Email</span>
                      <span className="text-slate-400 italic">{staffEmail || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 w-20 shrink-0 font-bold uppercase tracking-wider text-[10px]">Phone</span>
                      <span className="text-slate-400 italic">{staffPhone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 w-20 shrink-0 font-bold uppercase tracking-wider text-[10px]">Since</span>
                      <span className="text-slate-400 italic">{staffSince || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Staff Coaching Verdict */}
            {!isEditing && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1.5 font-mono">Club Stature</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {position.includes('Coach') 
                    ? 'An integral part of the technical staff, shaping the tactical identity and player development standards of the club.'
                    : position.includes('Manager')
                    ? 'A key figure in the operational leadership of the club, ensuring smooth coordination across all departments.'
                    : position.includes('President') || position.includes('Owner') || position.includes('Founder')
                    ? 'Foundation-level leadership driving the long-term vision, culture, and strategic direction of the organization.'
                    : position.includes('Director')
                    ? 'Oversees a critical department with strategic influence over club operations and long-term planning.'
                    : position.includes('Treasurer') || position.includes('Secretary')
                    ? 'Essential administrative pillar ensuring the club runs efficiently behind the scenes.'
                    : 'Valued member of the club staff contributing to the daily operations and team culture.'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ATHLETE PROFILE LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 bg-slate-50/50">
          
          {/* Section A: Season Statistics (Compact layout) */}
          <section
            id="season-stats-ledger-card"
            aria-labelledby="season-stats-ledger-title"
            className="relative order-1 min-h-[360px] bg-white p-4.5 rounded-xl shadow-sm border border-slate-200/50"
          >
            <div className="space-y-3.5">
              <h3 id="season-stats-ledger-title" className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Activity size={13} className="text-indigo-600" /> Season Stats Ledger
              </h3>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Matches Played</label>
                    <input 
                      id="edit-games-played"
                      data-validation-field="gamesPlayed"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={gamesPlayed} 
                      onChange={e => {
                        setGamesPlayed(e.target.value);
                        setProfileErrors(previous => ({ ...previous, gamesPlayed: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.gamesPlayed)}
                      aria-describedby={profileErrors.gamesPlayed ? 'edit-games-played-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.gamesPlayed ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-games-played-error" message={profileErrors.gamesPlayed} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Goals Scored</label>
                    <input 
                      id="edit-stat-goals"
                      data-validation-field="points"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={points} 
                      onChange={e => {
                        setPoints(e.target.value);
                        setProfileErrors(previous => ({ ...previous, points: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.points)}
                      aria-describedby={profileErrors.points ? 'edit-stat-goals-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.points ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-goals-error" message={profileErrors.points} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Assists</label>
                    <input 
                      id="edit-stat-assists"
                      data-validation-field="assists"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={assists} 
                      onChange={e => {
                        setAssists(e.target.value);
                        setProfileErrors(previous => ({ ...previous, assists: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.assists)}
                      aria-describedby={profileErrors.assists ? 'edit-stat-assists-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.assists ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-assists-error" message={profileErrors.assists} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                      {position === 'Goalkeeper' ? 'Clean Sheets' : position === 'Defender' ? 'Clean Sheets' : 'G+A Combined'}
                    </label>
                    <input 
                      id="edit-stat-sheets"
                      data-validation-field="cleanSheetsOrRebounds"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={cleanSheetsOrRebounds} 
                      onChange={e => {
                        setCleanSheetsOrRebounds(e.target.value);
                        setProfileErrors(previous => ({ ...previous, cleanSheetsOrRebounds: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.cleanSheetsOrRebounds)}
                      aria-describedby={profileErrors.cleanSheetsOrRebounds ? 'edit-stat-sheets-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.cleanSheetsOrRebounds ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-sheets-error" message={profileErrors.cleanSheetsOrRebounds} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Mins Placed</label>
                    <input 
                      id="edit-stat-mins"
                      data-validation-field="minutesPlayed"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={minutesPlayed} 
                      onChange={e => {
                        setMinutesPlayed(e.target.value);
                        setProfileErrors(previous => ({ ...previous, minutesPlayed: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.minutesPlayed)}
                      aria-describedby={profileErrors.minutesPlayed ? 'edit-stat-mins-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.minutesPlayed ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-mins-error" message={profileErrors.minutesPlayed} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Total Minutes</label>
                    <input 
                      id="edit-stat-mins-total"
                      data-validation-field="minutesPlayed"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={minutesPlayed} 
                      onChange={e => {
                        setMinutesPlayed(e.target.value);
                        setProfileErrors(previous => ({ ...previous, minutesPlayed: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.minutesPlayed)}
                      aria-describedby={profileErrors.minutesPlayed ? 'edit-stat-mins-total-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.minutesPlayed ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-mins-total-error" message={profileErrors.minutesPlayed} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">🟨 Yellow Cards</label>
                    <input 
                      id="edit-stat-yellows"
                      data-validation-field="yellowCards"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={yellowCards} 
                      onChange={e => {
                        setYellowCards(e.target.value);
                        setProfileErrors(previous => ({ ...previous, yellowCards: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.yellowCards)}
                      aria-describedby={profileErrors.yellowCards ? 'edit-stat-yellows-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.yellowCards ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-yellows-error" message={profileErrors.yellowCards} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">🟥 Red Cards</label>
                    <input 
                      id="edit-stat-reds"
                      data-validation-field="redCards"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={redCards} 
                      onChange={e => {
                        setRedCards(e.target.value);
                        setProfileErrors(previous => ({ ...previous, redCards: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.redCards)}
                      aria-describedby={profileErrors.redCards ? 'edit-stat-reds-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.redCards ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-reds-error" message={profileErrors.redCards} />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">⭐ MVP Awards</label>
                    <input 
                      id="edit-stat-mvps"
                      data-validation-field="mvpAwards"
                      type="number" 
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={mvpAwards} 
                      onChange={e => {
                        setMvpAwards(e.target.value);
                        setProfileErrors(previous => ({ ...previous, mvpAwards: undefined }));
                      }}
                      aria-invalid={Boolean(profileErrors.mvpAwards)}
                      aria-describedby={profileErrors.mvpAwards ? 'edit-stat-mvps-error' : undefined}
                      className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                        profileErrors.mvpAwards ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <FieldError id="edit-stat-mvps-error" message={profileErrors.mvpAwards} />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Squad Status</label>
                    <select
                      id="edit-reg-status"
                      value={status}
                      onChange={e => setStatus(e.target.value as Player['registrationStatus'])}
                      className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-bold"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="col-span-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Age</label>
                      <input 
                        id="edit-player-age"
                        data-validation-field="age"
                        type="number" 
                        min="10" max="80"
                        step="1"
                        inputMode="numeric"
                        value={age} 
                        onChange={e => {
                          setAge(e.target.value);
                          setProfileErrors(previous => ({ ...previous, age: undefined }));
                        }}
                        aria-invalid={Boolean(profileErrors.age)}
                        aria-describedby={profileErrors.age ? 'edit-player-age-error' : undefined}
                        className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                          profileErrors.age ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      />
                      <FieldError id="edit-player-age-error" message={profileErrors.age} />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Height (cm)</label>
                      <input 
                        id="edit-player-height"
                        data-validation-field="height"
                        type="number" 
                        min="100" max="250"
                        step="1"
                        inputMode="numeric"
                        value={height} 
                        onChange={e => {
                          setHeight(e.target.value);
                          setProfileErrors(previous => ({ ...previous, height: undefined }));
                        }}
                        aria-invalid={Boolean(profileErrors.height)}
                        aria-describedby={profileErrors.height ? 'edit-player-height-error' : undefined}
                        className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                          profileErrors.height ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      />
                      <FieldError id="edit-player-height-error" message={profileErrors.height} />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">Weight (kg)</label>
                      <input 
                        id="edit-player-weight"
                        data-validation-field="weight"
                        type="number" 
                        min="30" max="250"
                        step="1"
                        inputMode="numeric"
                        value={weight} 
                        onChange={e => {
                          setWeight(e.target.value);
                          setProfileErrors(previous => ({ ...previous, weight: undefined }));
                        }}
                        aria-invalid={Boolean(profileErrors.weight)}
                        aria-describedby={profileErrors.weight ? 'edit-player-weight-error' : undefined}
                        className={`w-full border rounded-lg p-2 focus:ring-2 focus:outline-none font-mono text-xs font-bold ${
                          profileErrors.weight ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      />
                      <FieldError id="edit-player-weight-error" message={profileErrors.weight} />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1.5 font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                      Specialty Traits ({specialtyTraits.length}/4)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {getAvailableTraits(position).map((trait) => {
                        const isSelected = specialtyTraits.includes(trait.label);
                        return (
                          <button
                            key={trait.label}
                            type="button"
                            onClick={() => handleToggleTrait(trait.label)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                          >
                            <span className="text-xs">{trait.icon}</span>
                            {trait.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 font-medium">
                  <div id="stat-row-games" className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><CircleDot size={13} className="text-slate-400" /> Games Played</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{gamesPlayed}</span>
                  </div>
                  <div id="stat-row-goals" className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><Zap size={13} className="text-amber-500 fill-amber-500/10" /> Goals Scored</span>
                    <span className="font-mono font-extrabold text-indigo-600 text-sm">{points}</span>
                  </div>
                  <div id="stat-row-assists" className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><Award size={13} className="text-blue-500" /> Assists Made</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{assists}</span>
                  </div>
                  <div id="stat-row-sheets" className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Shield size={13} className="text-emerald-500" />
                      {position === 'Goalkeeper' ? 'Clean Sheets' : position === 'Defender' ? 'Clean Sheets' : 'Goal Contributions'}
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {position === 'Goalkeeper' || position === 'Defender' ? displayCleanSheets : displayPoints + displayAssists}
                    </span>
                  </div>
                  <div id="stat-row-mvps" className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><Clock size={13} className="text-slate-400" /> Total Minutes</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{minutesPlayed}</span>
                  </div>
                  <div id="stat-row-motm" className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><Star size={13} className="text-amber-500" /> Man of the Match</span>
                    <span className="font-mono font-extrabold text-amber-600 text-sm">{displayMvpAwards > 0 ? `⭐ ${displayMvpAwards}` : '—'}</span>
                  </div>
                  <div id="stat-row-cards" className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><AlertTriangle size={13} className="text-slate-400" /> Discipline</span>
                    <span className="font-mono font-bold text-sm">
                      {displayYellowCards > 0 && <span className="text-amber-600">{displayYellowCards} 🟨</span>}
                      {displayYellowCards > 0 && displayRedCards > 0 && <span className="text-slate-300 mx-1">·</span>}
                      {displayRedCards > 0 && <span className="text-red-600">{displayRedCards} 🟥</span>}
                      {displayYellowCards === 0 && displayRedCards === 0 && <span className="text-slate-400">Clean</span>}
                    </span>
                  </div>
                  <div id="stat-row-ratio" className="flex justify-between items-center py-2 text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><User size={13} className="text-slate-400" /> 
                      {position === 'Goalkeeper' ? 'Saves per Match' : position === 'Defender' ? 'CS per Match' : 'Mins per Goal'}
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {position === 'Goalkeeper' 
                        ? (displayGamesPlayed > 0 ? (displayCleanSheets / displayGamesPlayed).toFixed(1) : '0.0')
                        : position === 'Defender'
                        ? (displayGamesPlayed > 0 ? (displayCleanSheets / displayGamesPlayed).toFixed(1) : '0.0')
                        : displayPoints > 0 ? Math.round(displayMinutesPlayed / displayPoints) : displayMinutesPlayed
                      }{position === 'Goalkeeper' || position === 'Defender' ? '' : 'm'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Specialty Traits display only */}
            {!isEditing && player.specialtyTraits && player.specialtyTraits.length > 0 && (
              <div className="mt-3 space-y-2.5">
                <div className="flex items-start gap-3 text-[10px]">
                  <span className="font-mono font-bold text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">Traits</span>
                  <div className="flex flex-wrap gap-1">
                    {player.specialtyTraits.map((traitLabel) => {
                      const traitDef = SPECIALTY_TRAITS[player.position]?.find(t => t.label === traitLabel);
                      return (
                        <span key={traitLabel} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
                          {traitDef?.icon && <span className="text-xs">{traitDef.icon}</span>}
                          {traitLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!isEditing ? (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-4.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1 font-mono">Coach's Notes</div>
                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {player.coachNotes || (
                    position === 'Goalkeeper' 
                      ? 'Strong last-line presence with commanding box control. Shot-stopping reflex work remains vital to clean sheet consistency across fixtures.'
                      : position === 'Defender' 
                      ? 'Solid defensive anchor with disciplined positional awareness. Key contributor to the backline structure and pressing coordination.'
                      : position === 'Midfielder'
                      ? 'Creative engine in the middle third. Dictates tempo, links phases of play, and provides consistent progressive distribution.'
                      : 'Clinical in the final third with intelligent movement off the ball. Reliable goal threat and key catalyst for attacking transition play.'
                  )}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-4.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black font-mono">Coach's Notes</div>
                  <span className="text-[8px] text-slate-400 font-mono">Editable — select traits to auto-populate</span>
                </div>
                <textarea
                  id="edit-coach-notes"
                  value={coachNotes}
                  onChange={e => setCoachNotes(e.target.value)}
                  rows={4}
                  placeholder="Write your coaching assessment, tactical observations, and development notes for this athlete..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium leading-relaxed text-slate-700 resize-none"
                />
                {specialtyTraits.length === 0 && !coachNotes && (
                  <p className="text-[9px] text-indigo-500 mt-1.5 font-medium">
                    Select traits to auto-populate the notes, or write your own.
                  </p>
                )}
              </div>
            )}
          </section>

            {/* Section B: Base & Positional Attributes */}
            <div className="order-2 bg-white p-4.5 rounded-xl shadow-sm border border-slate-200/50 flex flex-col justify-between">
              <div className="space-y-3.5">
                <h3 className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Shield size={13} className="text-indigo-600" /> Base Attributes
                </h3>

                {latestAssessment && (
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">FPRDS OVR</div>
                        <div className="text-xs font-semibold text-slate-700 mt-0.5">
                          Latest: <span className="font-black text-slate-900">{latestAssessment.ovr}</span>{' '}
                          <span className="text-slate-400">({latestAssessment.labels.ovrTierLabel})</span>
                        </div>
                        {typeof latestAssessment.deltas.ovrDelta === 'number' && (
                          <div className="text-[11px] font-bold mt-1">
                            <span className="text-slate-500">Delta:</span>{' '}
                            <span className={latestAssessment.deltas.ovrDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {latestAssessment.deltas.ovrDelta >= 0 ? `+${latestAssessment.deltas.ovrDelta}` : `${latestAssessment.deltas.ovrDelta}`}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-semibold mt-1">
                          {latestAssessment.assessmentDate} • {latestAssessment.role} • {latestAssessment.assessmentType}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenAssessments(player.id)}
                        aria-label="Open assessment center"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3 py-2 rounded-lg transition-colors shrink-0"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                )}

                {/* Overall Rating - top of attributes */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border-2 border-amber-400 shadow-md shrink-0">
                      <span className="text-xl font-display font-black text-white">
                        {Math.round((
                          baseAttributes.pace + 
                          baseAttributes.stamina + 
                          baseAttributes.agility + 
                          baseAttributes.strength + 
                          baseAttributes.firstTouch + 
                          baseAttributes.shortPassing
                        ) / 6 * 0.6 + 
                        (Object.keys(positionAttributes).length > 0 
                          ? (Object.values(positionAttributes) as number[]).reduce((a: number, b: number) => a + b, 0) / Object.keys(positionAttributes).length * 0.4 
                          : (baseAttributes.pace + baseAttributes.stamina + baseAttributes.agility + baseAttributes.strength + baseAttributes.firstTouch + baseAttributes.shortPassing) / 6 * 0.4)
                        )}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated OVR</div>
                      <div className="text-xs font-semibold text-slate-700">Algorithm Rating</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest inline-block">
                      {player.position} Model
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                  {Object.entries(baseAttributes).map(([key, value]) => {
                    const label = key === 'shortPassing' ? 'Short Pass' : key === 'firstTouch' ? 'First Touch' : key;
                    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
                    return (
                      <div key={key} className="flex flex-col gap-1 text-[10px]">
                        <div className="flex justify-between font-bold text-slate-600">
                          <span className="uppercase tracking-wider">{displayLabel}</span>
                          <span className="font-mono">{value}</span>
                        </div>
                        {isEditing ? (
                          <input 
                            type="range" 
                            min="1" max="99" 
                            value={value} 
                            onChange={(e) => handleBaseAttrChange(key as keyof Player['baseAttributes'], Number(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        ) : (
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${value}%` }} 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {Object.keys(positionAttributes).length > 0 && (
                  <>
                    <h3 className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mt-4 mb-2 flex items-center gap-1.5 pt-4 border-t border-slate-100">
                      <Shield size={13} className="text-amber-500" /> Position Attributes
                    </h3>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                      {Object.entries(positionAttributes).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 text-[10px]">
                          <div className="flex justify-between font-bold text-slate-600">
                            <span className="uppercase tracking-wider truncate mr-1">{key}</span>
                            <span className="font-mono">{value}</span>
                          </div>
                          {isEditing ? (
                            <input 
                              type="range" 
                              min="1" max="99" 
                              value={value} 
                              onChange={(e) => handlePosAttrChange(key, Number(e.target.value))}
                              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                          ) : (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${value}%` }} 
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Performance Insights */}
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-black">Performance Insights</span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <div className="text-slate-400 font-bold mb-0.5">Goals / Game</div>
                  <div className="font-mono font-black text-slate-700">
                    {displayGamesPlayed > 0 ? (displayPoints / displayGamesPlayed).toFixed(1) : '0.0'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <div className="text-slate-400 font-bold mb-0.5">Key Strength</div>
                  <div className="font-mono font-black text-slate-700 text-[9px] leading-tight">
                    {(() => {
                      const topAttr = Object.entries(baseAttributes).reduce((a, b) => a[1] > b[1] ? a : b);
                      const labels: Record<string, string> = {
                        pace: 'Pace',
                        stamina: 'Stamina',
                        agility: 'Agility',
                        strength: 'Strength',
                        firstTouch: 'First Touch',
                        shortPassing: 'Passing'
                      };
                      return `${labels[topAttr[0]]} (${topAttr[1]})`;
                    })()}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <div className="text-slate-400 font-bold mb-0.5">Form</div>
                  <div className="font-mono font-black text-slate-700 text-[9px] leading-tight">
                    {displayGamesPlayed > 0 
                      ? displayPoints >= displayGamesPlayed * 0.5 ? '🔥 In-form'
                      : displayMvpAwards > 0 ? '⭐ Rising'
                      : 'Active'
                    : 'No games'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <div className="text-slate-400 font-bold mb-0.5">Avg Mins/Game</div>
                  <div className="font-mono font-black text-slate-700">
                    {displayGamesPlayed > 0 ? Math.round(displayMinutesPlayed / displayGamesPlayed) : '—'}
                  </div>
                </div>
              </div>
            </div>

          {/* Points Progression Chart - Fullwidth footer span */}
          <div id="points-progression-chart-card" className="order-3 col-span-1 lg:col-span-2 bg-white p-4.5 rounded-xl shadow-sm border border-slate-200/50">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="font-display font-black text-slate-700 text-xs flex items-center gap-1.5">
                  <Activity className="text-indigo-600" size={13} /> {position === 'Goalkeeper' ? 'Five-Match Clean Sheets Trend' : 'Five-Match Goals Trend'}
                </h3>
              </div>
              <span className="text-[9px] uppercase font-mono font-black px-2 py-0.5 rounded bg-indigo-50/50 text-indigo-700 border border-indigo-100/50">Season Live Track</span>
            </div>
            
            <div id="recharts-wrapper-container" className="h-[180px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={25} 
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: 9, fontWeight: 600, color: '#475569', paddingBottom: 5 }}
                  />
                  <Line 
                    name={position === 'Goalkeeper' ? "Clean Sheets" : "Fixture Goals"} 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 1.5, fill: '#ffffff', stroke: '#4f46e5' }} 
                    activeDot={{ r: 5, strokeWidth: 0 }} 
                  />
                  <Line 
                    name="Running Sum" 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    strokeDasharray="3 3"
                    dot={{ r: 3, strokeWidth: 1, fill: '#ffffff', stroke: '#f59e0b' }} 
                    activeDot={{ r: 4, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
        )}
      </motion.div>
    </div>
  );
}
