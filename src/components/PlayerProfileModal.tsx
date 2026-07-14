import React, { useMemo, useRef, useState } from 'react';
import { AssessmentSession, Player, SPECIALTY_TRAITS, SpecialtyTrait, STAFF_POSITIONS } from '../types';
import { Briefcase, Calendar, Edit2, Mail, Phone, Save, Shield, Trash2, User, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { FieldError, FormErrorSummary } from './FormValidation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Textarea } from './ui/textarea';
import { cn } from '@/src/lib/utils';
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
  Tooltip
} from 'recharts';
import { LocalImageUploadError, prepareLocalImageDataUrl } from '../images/localImageUpload';

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
const REGISTRATION_STATUS_OPTIONS: Array<NonNullable<Player['registrationStatus']>> = ['Active', 'Pending', 'Suspended'];

const profileInputClass = (hasError?: boolean) => cn(
  'rounded-lg border bg-white/[0.04] text-xs font-bold text-slate-100 placeholder:text-slate-500 focus-visible:ring-2',
  hasError
    ? 'border-rose-400/40 focus-visible:ring-rose-500/30'
    : 'border-white/10 focus-visible:ring-indigo-400/30'
);

const profileStatInputClass = (hasError?: boolean) => cn(
  profileInputClass(hasError),
  'h-9 font-mono'
);

const profileHeaderInputClass = (hasError?: boolean) => cn(
  'rounded-lg border bg-white/[0.06] text-white placeholder:text-white/45 focus-visible:ring-2',
  hasError
    ? 'border-rose-300 focus-visible:ring-rose-300/40'
    : 'border-white/15 focus-visible:ring-amber-400/40'
);

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

  const handlePhotoUpload = async (file: File | undefined, input?: HTMLInputElement) => {
    if (!file) return;
    try {
      const dataUrl = await prepareLocalImageDataUrl(file, {
        maxDimension: 860,
        maxBytes: 560 * 1024,
        outputType: 'image/webp'
      });
      setPhotoUrl(dataUrl);
    } catch (error) {
      alert(error instanceof LocalImageUploadError ? error.message : 'The selected photo could not be uploaded.');
    } finally {
      if (input) input.value = '';
    }
  };

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
  const attributeLabels: Record<string, string> = {
    pace: 'Pace',
    stamina: 'Stamina',
    agility: 'Agility',
    strength: 'Strength',
    firstTouch: 'First Touch',
    shortPassing: 'Passing'
  };
  const baseAttributeEntries = Object.entries(baseAttributes);
  const positionAttributeValues = Object.values(positionAttributes).filter((value): value is number => typeof value === 'number');
  const baseAttributeAverage = Math.round(
    baseAttributeEntries.reduce((total, [, value]) => total + value, 0) / Math.max(1, baseAttributeEntries.length)
  );
  const positionAttributeAverage = positionAttributeValues.length > 0
    ? Math.round(positionAttributeValues.reduce((total, value) => total + value, 0) / positionAttributeValues.length)
    : undefined;
  const strongestAttribute = baseAttributeEntries.reduce((best, current) => current[1] > best[1] ? current : best);
  const developmentFocusAttribute = baseAttributeEntries.reduce((lowest, current) => current[1] < lowest[1] ? current : lowest);
  const fprdsAttributeLabels: Record<string, string> = {
    ...attributeLabels,
    finishingBox: 'Box Finishing',
    shotPower: 'Shot Power',
    offensive1v1: 'Offensive 1v1',
    attackingHeading: 'Attacking Heading',
    longPassing: 'Long Passing',
    visionPlaymaking: 'Vision',
    ballRetention: 'Ball Retention',
    pressingInterceptions: 'Pressing',
    tackling: 'Tackling',
    defensiveHeading: 'Defensive Heading',
    positioningClearances: 'Positioning',
    crossing: 'Crossing',
    reflexes: 'Reflexes',
    handling: 'Handling',
    divingReach: 'Diving Reach',
    distribution: 'Distribution'
  };
  const goalContributions = displayPoints + displayAssists;
  const goalsPerMatch = displayGamesPlayed > 0 ? (displayPoints / displayGamesPlayed).toFixed(1) : '0.0';
  const assistsPerMatch = displayGamesPlayed > 0 ? (displayAssists / displayGamesPlayed).toFixed(1) : '0.0';
  const contributionsPerMatch = displayGamesPlayed > 0 ? (goalContributions / displayGamesPlayed).toFixed(1) : '0.0';
  const minutesPerContribution = goalContributions > 0 ? `${Math.round(displayMinutesPlayed / goalContributions)}m` : 'N/A';
  const mvpRate = displayGamesPlayed > 0 ? `${Math.round((displayMvpAwards / displayGamesPlayed) * 100)}%` : '0%';
  const disciplineCount = displayYellowCards + displayRedCards;
  const developmentPriorityId = latestAssessment?.labels.weakestAttributeId;
  const developmentPriorityLabel = developmentPriorityId
    ? fprdsAttributeLabels[developmentPriorityId] ?? developmentPriorityId
    : attributeLabels[developmentFocusAttribute[0]] ?? developmentFocusAttribute[0];
  const developmentPriorityScore = developmentPriorityId
    ? latestAssessment?.attributeScores[developmentPriorityId]
    : developmentFocusAttribute[1];
  const developmentPrioritySource = latestAssessment ? 'Latest FPRDS' : 'Base attributes';
  const priorityScore = developmentPriorityScore ?? 0;
  const improvementLevel = priorityScore < 50
    ? 'Build the basics'
    : priorityScore < 65
    ? 'Improve consistency'
    : priorityScore < 80
    ? 'Apply under pressure'
    : 'Fine-tune for match use';
  const priorityFocusType = developmentPriorityId?.includes('passing') || developmentPriorityId?.includes('vision') || developmentPriorityId === 'distribution'
    ? 'passing and decision speed'
    : developmentPriorityId?.includes('finishing') || developmentPriorityId?.includes('shot')
    ? 'finishing and controlled shooting'
    : developmentPriorityId?.includes('tackling') || developmentPriorityId?.includes('defensive') || developmentPriorityId?.includes('positioning')
    ? 'defensive timing and positioning'
    : developmentPriorityId?.includes('reflexes') || developmentPriorityId?.includes('handling') || developmentPriorityId?.includes('diving')
    ? 'goalkeeper reactions and handling'
    : developmentPriorityLabel.toLowerCase();
  const suggestedTrainingFocus = `${improvementLevel}: focus on ${priorityFocusType} because ${developmentPriorityLabel} is currently rated ${developmentPriorityScore ?? 'N/A'}.`;

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

  const isKeeperOrDefender = position === 'Goalkeeper' || position === 'Defender';
  const contributionStatLabel = isKeeperOrDefender ? 'Clean sheets' : 'Goal contributions';
  const contributionStatValue = isKeeperOrDefender ? displayCleanSheets : displayPoints + displayAssists;
  const ratioStatLabel = isKeeperOrDefender ? 'CS per match' : 'Mins per goal';
  const ratioStatValue = isKeeperOrDefender
    ? (displayGamesPlayed > 0 ? (displayCleanSheets / displayGamesPlayed).toFixed(1) : '0.0')
    : `${displayPoints > 0 ? Math.round(displayMinutesPlayed / displayPoints) : displayMinutesPlayed}m`;
  const disciplineStatValue = disciplineCount === 0
    ? 'Clean'
    : [
        displayYellowCards > 0 ? `${displayYellowCards}Y` : '',
        displayRedCards > 0 ? `${displayRedCards}R` : ''
      ].filter(Boolean).join(' ');
  const baseAttributeMean = baseAttributeEntries.reduce((total, [, value]) => total + value, 0) / Math.max(1, baseAttributeEntries.length);
  const overallRating = Math.round(
    baseAttributeMean * 0.6
    + (positionAttributeValues.length > 0
      ? positionAttributeValues.reduce((a, b) => a + b, 0) / positionAttributeValues.length
      : baseAttributeMean) * 0.4
  );
  const seasonStatItems = [
    { id: 'games', label: 'Games played', value: String(displayGamesPlayed), tone: 'text-white' },
    { id: 'goals', label: 'Goals scored', value: String(displayPoints), tone: 'text-indigo-300' },
    { id: 'assists', label: 'Assists made', value: String(displayAssists), tone: 'text-white' },
    { id: 'contribution', label: contributionStatLabel, value: String(contributionStatValue), tone: 'text-emerald-300' },
    { id: 'minutes', label: 'Total minutes', value: String(displayMinutesPlayed), tone: 'text-white' },
    { id: 'mvp', label: 'Man of the match', value: displayMvpAwards > 0 ? String(displayMvpAwards) : '—', tone: 'text-amber-300' },
    { id: 'discipline', label: 'Discipline', value: disciplineStatValue, tone: disciplineCount > 0 ? 'text-amber-300' : 'text-white' },
    { id: 'ratio', label: ratioStatLabel, value: ratioStatValue, tone: 'text-white' }
  ];
  const editStatFields: Array<{
    id: string;
    field: ProfileField;
    label: string;
    value: string;
    onChange: (value: string) => void;
    min: string;
    max?: string;
  }> = [
    { id: 'edit-games-played', field: 'gamesPlayed', label: 'Matches', value: gamesPlayed, onChange: setGamesPlayed, min: '0' },
    { id: 'edit-stat-goals', field: 'points', label: 'Goals', value: points, onChange: setPoints, min: '0' },
    { id: 'edit-stat-assists', field: 'assists', label: 'Assists', value: assists, onChange: setAssists, min: '0' },
    { id: 'edit-stat-sheets', field: 'cleanSheetsOrRebounds', label: isKeeperOrDefender ? 'Clean sheets' : 'G+A combined', value: cleanSheetsOrRebounds, onChange: setCleanSheetsOrRebounds, min: '0' },
    { id: 'edit-stat-mins', field: 'minutesPlayed', label: 'Total minutes', value: minutesPlayed, onChange: setMinutesPlayed, min: '0' },
    { id: 'edit-stat-yellows', field: 'yellowCards', label: 'Yellow cards', value: yellowCards, onChange: setYellowCards, min: '0' },
    { id: 'edit-stat-reds', field: 'redCards', label: 'Red cards', value: redCards, onChange: setRedCards, min: '0' },
    { id: 'edit-stat-mvps', field: 'mvpAwards', label: 'MVP awards', value: mvpAwards, onChange: setMvpAwards, min: '0' },
    { id: 'edit-player-age', field: 'age', label: 'Age', value: age, onChange: setAge, min: '10', max: '80' },
    { id: 'edit-player-height', field: 'height', label: 'Height (cm)', value: height, onChange: setHeight, min: '100', max: '250' },
    { id: 'edit-player-weight', field: 'weight', label: 'Weight (kg)', value: weight, onChange: setWeight, min: '30', max: '250' }
  ];

  return (
    <div
      id="player-profile-overlay"
      className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-slate-950/80 px-3 py-4 text-slate-100 backdrop-blur-xl lg:overflow-hidden"
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
        className="relative grid max-h-[92vh] w-full max-w-[1180px] grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-y-auto rounded-2xl border border-cyan-300/12 bg-[#07111f] p-4 shadow-2xl shadow-black/40 outline-none sm:p-5 lg:h-[min(660px,92vh)] lg:overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />

        <header className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {!isStaff && (
                <span id="player-profile-jersey" className="rounded bg-amber-400 px-2 py-0.5 font-mono text-[11px] font-black tracking-tight text-slate-950">
                  #{number}
                </span>
              )}
              <span id="player-profile-pos" className="rounded-full border border-cyan-300/18 bg-cyan-300/8 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-100">
                {isStaff && '👔 '}{position}
              </span>
              {!isStaff && (
                <span id="player-profile-status" className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${
                  status === 'Active' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' :
                  status === 'Pending' ? 'border-amber-300/25 bg-amber-300/10 text-amber-100' :
                  'border-rose-300/25 bg-rose-500/10 text-rose-100'
                }`}>
                  ● {status}
                </span>
              )}
              {!isStaff && (player.age || player.height || player.weight) && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {[
                    player.age ? `${player.age} yrs` : '',
                    player.height ? `${player.height} cm` : '',
                    player.weight ? `${player.weight} kg` : ''
                  ].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <FormErrorSummary id="profile-error-summary" errors={profileErrors} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div>
                    <Input
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
                      className={cn(profileHeaderInputClass(Boolean(profileErrors.name)), 'h-10 w-full max-w-[260px] px-3 font-display text-lg')}
                      placeholder={isStaff ? 'Staff Name' : 'Player Name'}
                    />
                    <FieldError id="edit-player-name-error" message={profileErrors.name} />
                  </div>
                  {isStaff ? (
                    <Select
                      value={position}
                      onValueChange={setPosition}
                    >
                      <SelectTrigger id="edit-staff-role-select" className={cn(profileInputClass(), 'h-9 w-48')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#0b1726] text-slate-100">
                        {STAFF_POSITIONS.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex shrink-0 gap-2">
                      <div>
                        <Input
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
                          className={cn(profileInputClass(Boolean(profileErrors.number)), 'h-9 w-16 px-2.5 font-mono')}
                        />
                        <FieldError id="edit-player-number-error" message={profileErrors.number} />
                      </div>
                      <div>
                        <Select
                          value={position}
                          onValueChange={value => {
                            setPosition(value);
                            setProfileErrors(previous => ({ ...previous, position: undefined }));
                          }}
                        >
                          <SelectTrigger
                            id="edit-player-pos-select"
                            data-validation-field="position"
                            aria-invalid={Boolean(profileErrors.position)}
                            aria-describedby={profileErrors.position ? 'edit-player-position-error' : undefined}
                            className={cn(profileInputClass(Boolean(profileErrors.position)), 'h-9 text-xs')}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-[#0b1726] text-slate-100">
                            {PLAYER_POSITIONS.map(playerPosition => (
                              <SelectItem key={playerPosition} value={playerPosition}>
                                {playerPosition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError id="edit-player-position-error" message={profileErrors.position} />
                      </div>
                    </div>
                  )}
                </div>
                {!isStaff && (
                  <Textarea
                    id="edit-player-bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={2}
                    className="min-h-14 max-w-2xl rounded-lg border-white/15 bg-white/[0.06] p-2 text-xs font-normal leading-relaxed text-white placeholder:text-white/45 focus-visible:ring-amber-400/40"
                    placeholder="Enter athlete synopsis or personal bio..."
                  />
                )}
              </div>
            ) : (
              <>
                {!isStaff ? (
                  <div className="mt-2 grid max-w-xl grid-cols-4 gap-x-5 gap-y-2">
                    {seasonStatItems.slice(0, 4).map(item => (
                      <div key={item.id} className="min-w-0">
                        <div className={`font-mono text-lg font-black leading-none ${item.tone}`}>{item.value}</div>
                        <div className="mt-1 truncate text-[8px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <h2 id="player-profile-fullname" className="mt-1.5 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {name}
                  </h2>
                )}
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            {isEditing ? (
              <Button
                id="save-profile-btn"
                onClick={handleSave}
                className="h-9 rounded-xl bg-amber-400 px-3 text-xs font-black uppercase tracking-wide text-slate-950 hover:bg-amber-300"
              >
                <Save size={13} /> Save
              </Button>
            ) : (
              <>
                <Button
                  id="edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                  className="h-9 rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-3 text-xs font-black text-emerald-50 hover:bg-emerald-300/22"
                >
                  <Edit2 size={12} /> Modify
                </Button>
                {!isStaff && (
                  <Button
                    type="button"
                    id="remove-player-profile-btn"
                    onClick={() => setShowRemoveConfirm(true)}
                    variant="ghost"
                    size="icon"
                    aria-label="Remove player"
                    className="size-9 rounded-xl text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </>
            )}
            <Button
              id="close-profile-btn"
              onClick={onClose}
              variant="ghost"
              size="icon"
              aria-label="Close player profile"
              className="size-9 rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white"
            >
              <X size={17} />
            </Button>
          </div>
        </header>

        {showRemoveConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-profile-player-title"
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1726] p-6 text-slate-100 shadow-2xl"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
                <Trash2 size={19} />
              </div>
              <h3 id="remove-profile-player-title" className="font-display text-lg font-black text-white">
                Remove {player.name}?
              </h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-400">
                This permanently removes the player and their saved statistics from this browser.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => onRemove(player.id)}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                >
                  <Trash2 size={13} />
                  Remove Player
                </Button>
              </div>
            </div>
          </div>
        )}

        {isStaff ? (
          /* STAFF PROFILE LAYOUT */
          <main className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <section className="rounded-2xl border border-amber-300/12 bg-amber-300/[0.04] p-4.5">
              <h3 className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-200">
                <Briefcase size={13} /> Staff Profile
              </h3>
              {isEditing ? (
                <Textarea
                  id="edit-staff-bio"
                  value={staffBio}
                  onChange={e => setStaffBio(e.target.value)}
                  rows={5}
                  placeholder="Write a detailed staff bio covering their background, experience, philosophy, and key responsibilities within the club..."
                  className="min-h-32 rounded-xl border-white/10 bg-white/[0.04] p-3 text-xs font-medium leading-relaxed text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-400/30"
                />
              ) : (
                <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {staffBio || 'No biography has been added for this staff member yet.'}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-indigo-300/12 bg-indigo-300/[0.04] p-4.5">
              <h3 className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-200">
                <User size={13} /> Contact & Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <Briefcase size={13} className="shrink-0 text-slate-500" />
                  <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</span>
                  <span className="font-bold text-slate-100">{position}</span>
                </div>
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-3 text-xs">
                      <Mail size={13} className="shrink-0 text-slate-500" />
                      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span>
                      <Input
                        id="edit-staff-email"
                        type="email"
                        value={staffEmail}
                        onChange={e => setStaffEmail(e.target.value)}
                        placeholder="coach@club.com"
                        className={cn(profileInputClass(), 'h-8 flex-1')}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Phone size={13} className="shrink-0 text-slate-500" />
                      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</span>
                      <Input
                        id="edit-staff-phone"
                        type="text"
                        value={staffPhone}
                        onChange={e => setStaffPhone(e.target.value)}
                        placeholder="+1 234 567 890"
                        className={cn(profileInputClass(), 'h-8 flex-1')}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Calendar size={13} className="shrink-0 text-slate-500" />
                      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Since</span>
                      <Input
                        id="edit-staff-since"
                        type="text"
                        value={staffSince}
                        onChange={e => setStaffSince(e.target.value)}
                        placeholder="e.g. Jan 2025"
                        className={cn(profileInputClass(), 'h-8 flex-1')}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-xs">
                      <Mail size={13} className="shrink-0 text-slate-500" />
                      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span>
                      <span className="italic text-slate-500">{staffEmail || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Phone size={13} className="shrink-0 text-slate-500" />
                      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</span>
                      <span className="italic text-slate-500">{staffPhone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Calendar size={13} className="shrink-0 text-slate-500" />
                      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Since</span>
                      <span className="italic text-slate-500">{staffSince || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {!isEditing && (
              <div className="border-l-2 border-amber-300/40 pl-4">
                <div className="text-[9px] font-black uppercase tracking-widest text-amber-200">Club Stature</div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
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
          </main>
        ) : (
          /* ATHLETE PROFILE LAYOUT — landscape two-pane */
          <main className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-12">
            <section
              id="season-stats-ledger-card"
              aria-label="Player overview"
              className={cn(
                'relative min-h-0 overflow-x-hidden rounded-2xl border border-cyan-300/12 bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(15,23,42,0.24)_36%,rgba(7,17,31,0.94))]',
                isEditing ? 'overflow-y-auto p-5 lg:col-span-8' : 'overflow-hidden p-4 lg:col-span-9'
              )}
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/40 to-transparent" />
              <div className={cn('grid', isEditing ? 'gap-5 sm:grid-cols-[auto_minmax(0,1fr)]' : 'gap-4 sm:grid-cols-[132px_minmax(0,1fr)] lg:grid-cols-[150px_minmax(0,1fr)]')}>
                <div className={cn('relative shrink-0 self-start', isEditing ? 'w-36 sm:w-44' : 'w-32 sm:w-[150px]')}>
                  <img
                    id="player-profile-img"
                    src={photoUrl}
                    alt={player.name}
                    className="aspect-[3/4] w-full rounded-xl border border-white/10 object-cover object-top shadow-lg shadow-black/30"
                    referrerPolicy="no-referrer"
                  />
                  {isEditing && (
                    <>
                      <Input
                        id="profile-photo-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handlePhotoUpload(e.target.files?.[0], e.currentTarget)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('profile-photo-upload-input')?.click()}
                        className="absolute inset-0 flex h-auto flex-col items-center justify-center rounded-xl border border-indigo-400/30 bg-slate-950/78 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-950/88"
                      >
                        <span>Upload</span>
                        <span>Photo</span>
                      </Button>
                    </>
                  )}
                </div>

                <div className="min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {editStatFields.map(field => (
                      <div key={field.id}>
                        <Label htmlFor={field.id} className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                          {field.label}
                        </Label>
                        <Input
                          id={field.id}
                          data-validation-field={field.field}
                          type="number"
                          min={field.min}
                          max={field.max}
                          step="1"
                          inputMode="numeric"
                          value={field.value}
                          onChange={e => {
                            field.onChange(e.target.value);
                            setProfileErrors(previous => ({ ...previous, [field.field]: undefined }));
                          }}
                          aria-invalid={Boolean(profileErrors[field.field])}
                          aria-describedby={profileErrors[field.field] ? `${field.id}-error` : undefined}
                          className={profileStatInputClass(Boolean(profileErrors[field.field]))}
                        />
                        <FieldError id={`${field.id}-error`} message={profileErrors[field.field]} />
                      </div>
                    ))}
                    <div>
                      <Label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-500">Squad status</Label>
                      <Select
                        value={status}
                        onValueChange={value => setStatus(value as Player['registrationStatus'])}
                      >
                        <SelectTrigger id="edit-reg-status" className={cn(profileInputClass(), 'h-9')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0b1726] text-slate-100">
                          {REGISTRATION_STATUS_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4">
                    <Label className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Specialty Traits ({specialtyTraits.length}/4)
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {getAvailableTraits(position).map((trait) => {
                        const isSelected = specialtyTraits.includes(trait.label);
                        return (
                          <Button
                            key={trait.label}
                            type="button"
                            onClick={() => handleToggleTrait(trait.label)}
                            variant="outline"
                            size="sm"
                            className={`h-7 rounded-full px-2.5 py-1 text-[10px] ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-500 text-white hover:bg-indigo-500 hover:text-white'
                                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-indigo-300/40 hover:text-indigo-200'
                            }`}
                          >
                            <span className="text-xs">{trait.icon}</span>
                            {trait.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor="edit-coach-notes" className="block text-[9px] font-black uppercase tracking-wider text-slate-500">
                        Coach's Notes
                      </Label>
                      <span className="text-[8px] text-slate-500">Editable — select traits to auto-populate</span>
                    </div>
                    <Textarea
                      id="edit-coach-notes"
                      value={coachNotes}
                      onChange={e => setCoachNotes(e.target.value)}
                      rows={4}
                      placeholder="Write your coaching assessment, tactical observations, and development notes for this athlete..."
                      className="min-h-24 resize-none rounded-xl border-white/10 bg-white/[0.04] p-2.5 text-xs font-medium leading-relaxed text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-400/30"
                    />
                    {specialtyTraits.length === 0 && !coachNotes && (
                      <p className="mt-1.5 text-[9px] font-medium text-indigo-300">
                        Select traits to auto-populate the notes, or write your own.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 border-b border-white/[0.06] pb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Player profile</span>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <h2 id="player-profile-fullname" className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                          {name}
                        </h2>
                        <p className="mt-0.5 text-xs font-black text-slate-300">{player.position} model</p>
                      </div>
                      <div className="ml-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-slate-950 shadow-md shadow-amber-950/20">
                        <span className="font-display text-xl font-black text-white">{overallRating}</span>
                      </div>
                    </div>
                    <p id="player-profile-bio-summary" className="mt-1 line-clamp-2 max-w-xl text-xs font-medium italic leading-relaxed text-slate-400">
                      "{bio || 'Highly motivated squad member.'}"
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Coach's verdict</span>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-50 lg:text-[15px]">
                    {player.coachNotes || getDefaultVerdict()}
                  </p>
                  <div className="mt-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-100">Specialty traits</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {player.specialtyTraits && player.specialtyTraits.length > 0 ? (
                        player.specialtyTraits.map((traitLabel) => {
                          const traitDef = SPECIALTY_TRAITS[player.position]?.find(t => t.label === traitLabel);
                          return (
                            <span key={traitLabel} className="flex items-center gap-1 rounded-full border border-indigo-300/20 bg-indigo-300/8 px-2.5 py-1 text-[10px] font-black text-indigo-100">
                              {traitDef?.icon && <span className="text-xs">{traitDef.icon}</span>}
                              {traitLabel}
                            </span>
                          );
                        })
                      ) : (
                        <p className="text-[11px] font-medium text-slate-500">No specialty traits assigned yet.</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold text-slate-400">
                    <span className="mr-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Per match</span>
                    {goalsPerMatch} goals · {assistsPerMatch} assists · {contributionsPerMatch} G+A · {minutesPerContribution} per contribution · {mvpRate} MVP rate
                  </p>
                </>
              )}
                </div>
              </div>

              {!isEditing && (
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <div className="mt-0 grid gap-x-7 gap-y-3 sm:grid-cols-2">
                    <div>
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-200">
                        <Shield size={11} /> Base attributes
                      </span>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {Object.entries(baseAttributes).map(([key, value]) => {
                          const label = key === 'shortPassing' ? 'Short Pass' : key === 'firstTouch' ? 'First Touch' : key;
                          const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
                          return (
                            <div key={key} className="flex flex-col gap-1 text-[10px]">
                              <div className="flex justify-between font-bold text-slate-300">
                                <span className="uppercase tracking-wider">{displayLabel}</span>
                                <span className="font-mono">{value}</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                  className="h-1.5 rounded-full bg-indigo-400 transition-all duration-500"
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="min-w-0">
                      {Object.keys(positionAttributes).length > 0 ? (
                        <>
                          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-200">
                            <Shield size={11} /> Position attributes
                          </span>
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {Object.entries(positionAttributes).map(([key, value]) => (
                              <div key={key} className="flex flex-col gap-1 text-[10px]">
                                <div className="flex justify-between font-bold text-slate-300">
                                  <span className="mr-1 truncate uppercase tracking-wider">{key}</span>
                                  <span className="font-mono">{value}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                  <div
                                    className="h-1.5 rounded-full bg-amber-400 transition-all duration-500"
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] font-medium text-slate-500">No position attributes recorded yet.</p>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Base avg {baseAttributeAverage} · Top tool {attributeLabels[strongestAttribute[0]] ?? strongestAttribute[0]} ({strongestAttribute[1]}){positionAttributeAverage !== undefined ? ` · Position avg ${positionAttributeAverage}` : ''}
                  </p>
                </div>
              )}
            </section>

            <aside
              aria-label={isEditing ? 'Player attributes' : 'Season performance'}
              className={cn(
                'flex min-h-0 flex-col px-1 py-1',
                isEditing ? 'gap-4 overflow-y-auto lg:col-span-4' : 'gap-3 overflow-hidden lg:col-span-3'
              )}
            >
              {isEditing ? (
                <>
                  <div>
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-200">
                      <Shield size={11} /> Base attributes
                    </span>
                    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {Object.entries(baseAttributes).map(([key, value]) => {
                        const label = key === 'shortPassing' ? 'Short Pass' : key === 'firstTouch' ? 'First Touch' : key;
                        const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
                        return (
                          <div key={key} className="flex flex-col gap-1 text-[10px]">
                            <div className="flex justify-between font-bold text-slate-300">
                              <span className="uppercase tracking-wider">{displayLabel}</span>
                              <span className="font-mono">{value}</span>
                            </div>
                            <Input
                              type="range"
                              min="1" max="99"
                              value={value}
                              onChange={(e) => handleBaseAttrChange(key as keyof Player['baseAttributes'], Number(e.target.value))}
                              className="h-1 cursor-pointer appearance-none rounded-lg border-0 bg-white/10 p-0 accent-indigo-400 focus-visible:ring-indigo-400/30"
                              aria-label={`${displayLabel} rating`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {Object.keys(positionAttributes).length > 0 && (
                    <div className="border-t border-white/[0.06] pt-3">
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-200">
                        <Shield size={11} /> Position attributes
                      </span>
                      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                        {Object.entries(positionAttributes).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1 text-[10px]">
                            <div className="flex justify-between font-bold text-slate-300">
                              <span className="mr-1 truncate uppercase tracking-wider">{key}</span>
                              <span className="font-mono">{value}</span>
                            </div>
                            <Input
                              type="range"
                              min="1" max="99"
                              value={value}
                              onChange={(e) => handlePosAttrChange(key, Number(e.target.value))}
                              className="h-1 cursor-pointer appearance-none rounded-lg border-0 bg-white/10 p-0 accent-amber-400 focus-visible:ring-amber-400/30"
                              aria-label={`${key} rating`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="border-b border-white/[0.06] pb-3">
                    <h3 id="season-stats-ledger-title" className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Secondary stats
                    </h3>
                    <div className="mt-2.5 space-y-2.5">
                      {seasonStatItems.slice(4).map(item => (
                        <div key={item.id} className="flex items-baseline justify-between gap-3">
                          <div className="min-w-0 truncate text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
                          <div className={`font-mono text-base font-black leading-none ${item.tone}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {latestAssessment && (
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Latest FPRDS</span>
                        <span className="text-xs font-black text-indigo-100">
                          {latestAssessment.labels.ovrTierLabel} {latestAssessment.ovr}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 border-t border-white/[0.06] pt-3">
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-200">
                        <Zap size={11} /> Development focus
                      </span>
                      <p className="mt-1.5 line-clamp-3 text-[11px] font-semibold leading-relaxed text-slate-300">{suggestedTrainingFocus}</p>
                      <Button
                        type="button"
                        onClick={() => onOpenAssessments(player.id)}
                        className="mt-3 h-8 w-full rounded-xl border border-indigo-300/25 bg-indigo-300/12 px-3 text-[10px] font-black uppercase tracking-wider text-indigo-100 hover:bg-indigo-300/20"
                      >
                        <Shield size={11} /> Open Assessment Center
                      </Button>
                    </div>
                  </div>

                  <div id="points-progression-chart-card" className="mt-auto pt-1">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {position === 'Goalkeeper' ? '5-match clean sheets' : '5-match goals trend'}
                    </h3>
                    <div id="recharts-wrapper-container" className="mt-2 h-[112px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressionData} margin={{ top: 5, right: 5, left: -28, bottom: -6 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#64748b', fontSize: 8, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: '#64748b', fontSize: 8, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            name={position === 'Goalkeeper' ? 'Clean Sheets' : 'Fixture Goals'}
                            type="monotone"
                            dataKey="points"
                            stroke="#818cf8"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: '#07111f', stroke: '#818cf8' }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                          />
                          <Line
                            name="Running Sum"
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#fbbf24"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            dot={{ r: 2.5, strokeWidth: 1, fill: '#07111f', stroke: '#fbbf24' }}
                            activeDot={{ r: 3.5, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </aside>
          </main>
        )}
      </motion.div>
    </div>
  );
}
