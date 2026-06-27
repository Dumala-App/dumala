import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AgeGroup, AssessmentRawResults, AssessmentSession, FprdsAttributeId, FprdsRole, Player } from '../types';
import {
  AlertCircle,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  NotebookPen,
  Save,
  Search,
  Sparkles,
  Trash2,
  User
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { FieldError, FormErrorSummary } from './FormValidation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select';
import { Textarea } from '@/src/components/ui/textarea';
import { FieldErrors, focusFirstInvalidField, hasFieldErrors } from '../forms/validation';
import { generateFourWeekPlan } from '../fprds/development';
import {
  computeAgeGroupFromDob,
  computeScoresForSession,
  getAttributeLabel
} from '../fprds/scoring';
import { ROLE_LABELS, ROLE_WEIGHTS } from '../fprds/weights';
import {
  buildAssessmentProgressSeries,
  buildPlayerAssessmentReport,
  buildSessionAssessmentReport,
  calculateProgressDelta,
  filterProgressSeriesByRole,
  getLatestRoleFromProgress,
  getWeightedProgressAttributes,
  selectLatestAssessmentByPlayer,
  type AssessmentProgressPoint
} from '../fprds/progress';
import AssessmentPlayerCardPreview from './AssessmentPlayerCardPreview';

type AssessmentType = 'Full' | 'Quick';
type AssessmentStep = 1 | 2 | 3 | 4 | 5 | 6;

const nextAssessmentStep = (step: AssessmentStep): AssessmentStep => (step < 6 ? ((step + 1) as AssessmentStep) : step);
const previousAssessmentStep = (step: AssessmentStep): AssessmentStep => (step > 1 ? ((step - 1) as AssessmentStep) : step);
const weightedAttributeIdsForRole = (role: FprdsRole): FprdsAttributeId[] => (
  (Object.keys(ROLE_WEIGHTS[role]) as FprdsAttributeId[]).filter(attrId => ROLE_WEIGHTS[role][attrId] > 0)
);

const ATTRIBUTE_LABELS: Record<FprdsAttributeId, string> = {
  pace: 'Pace',
  stamina: 'Stamina',
  agility: 'Agility',
  strength: 'Strength',
  firstTouch: 'First touch',
  shortPassing: 'Short passing',
  finishingBox: 'Finishing',
  shotPower: 'Shot power',
  offensive1v1: 'Offensive 1v1',
  attackingHeading: 'Attacking heading',
  longPassing: 'Long passing',
  visionPlaymaking: 'Vision',
  ballRetention: 'Ball retention',
  pressingInterceptions: 'Pressing',
  tackling: 'Tackling',
  defensiveHeading: 'Defensive heading',
  positioningClearances: 'Positioning',
  crossing: 'Crossing',
  reflexes: 'Reflexes',
  handling: 'Handling',
  divingReach: 'Diving',
  distribution: 'Distribution'
};

const ATTRIBUTE_LINE_COLORS = ['#4f46e5', '#059669', '#f59e0b', '#dc2626'];

type ProgressTooltipPayload = Array<{
  name?: string;
  value?: number;
  color?: string;
  payload: AssessmentProgressPoint & { [key: string]: unknown };
}>;

const AssessmentProgressTooltip = ({
  active,
  payload
}: {
  active?: boolean;
  payload?: ProgressTooltipPayload;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{point.assessmentDate}</p>
      <p className="text-xs font-black text-slate-900">
        {ROLE_LABELS[point.role]} • {point.assessmentType} • {point.ageGroup}
      </p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-[11px] font-semibold">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface AssessmentsViewProps {
  players: Player[];
  assessments: AssessmentSession[];
  preselectedPlayerId: string | null;
  onClearPreselectedPlayer: () => void;
  onAddAssessment: (session: AssessmentSession) => void;
  onDeleteAssessment: (sessionId: string) => void;
  onUpdateAssessmentNotes: (sessionId: string, coachNotes: string) => void;
}

const getDefaultRoleForPlayer = (player: Player): FprdsRole => {
  if (player.fprdsRole) return player.fprdsRole;
  if (player.position === 'Forward') return 'ST';
  if (player.position === 'Midfielder') return 'CM';
  if (player.position === 'Defender') return 'CB';
  if (player.position === 'Goalkeeper') return 'GK';
  return 'CM';
};

const todayIsoDate = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

type NumberInputProps = {
  id: string;
  fieldName: string;
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  onChange: (val: string) => void;
};

const NumberInput: React.FC<NumberInputProps> = (props) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor={props.id} className="text-[11px] font-black uppercase tracking-wider text-slate-500">
        {props.label}
      </label>
      <Input
        id={props.id}
        data-validation-field={props.fieldName}
        type="number"
        inputMode="decimal"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        aria-label={props.label}
        aria-invalid={Boolean(props.error)}
        aria-describedby={props.error ? `${props.id}-error` : undefined}
        className={`rounded-xl text-sm font-semibold text-slate-800 shadow-sm ${
          props.error
            ? 'border-rose-300 focus-visible:ring-rose-200'
            : 'border-slate-200 focus-visible:ring-indigo-100'
        }`}
      />
      {props.hint && !props.error && <p className="text-[11px] text-slate-400 font-medium">{props.hint}</p>}
      <FieldError id={`${props.id}-error`} message={props.error} />
    </div>
  );
};

export default function AssessmentsView({
  players,
  assessments,
  preselectedPlayerId,
  onClearPreselectedPlayer,
  onAddAssessment,
  onDeleteAssessment,
  onUpdateAssessmentNotes
}: AssessmentsViewProps) {
  const assessmentContainerRef = useRef<HTMLDivElement | null>(null);
  const eligiblePlayers = useMemo(() => players, [players]);

  const [step, setStep] = useState<AssessmentStep>(1);
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [role, setRole] = useState<FprdsRole>('CM');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('Full');
  const [assessmentDate, setAssessmentDate] = useState<string>(todayIsoDate());
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');

  const [base, setBase] = useState({
    sprint10mSeconds: '',
    sprint30mSeconds: '',
    yoyoMeters: '',
    illinoisSeconds: '',
    broadJumpCm: '',
    medicineBallThrowCm: '',
    firstTouchSuccessesOutOf10: '',
    shortPassingSuccessesOutOf10: ''
  });

  const [roleSpecific, setRoleSpecific] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assessmentSubmitErrors, setAssessmentSubmitErrors] = useState<FieldErrors<string>>({});
  const [comparisonPlayerId, setComparisonPlayerId] = useState('');
  const [baselineSessionId, setBaselineSessionId] = useState('');
  const [targetSessionId, setTargetSessionId] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const selectedPlayer = useMemo(
    () => eligiblePlayers.find(p => p.id === selectedPlayerId) ?? null,
    [eligiblePlayers, selectedPlayerId]
  );

  useEffect(() => {
    if (!preselectedPlayerId) return;
    const exists = eligiblePlayers.some(p => p.id === preselectedPlayerId);
    if (!exists) return;
    setSelectedPlayerId(preselectedPlayerId);
    onClearPreselectedPlayer();
    setStep(assessments.some((session) => session.playerId === preselectedPlayerId) ? 6 : 2);
  }, [assessments, eligiblePlayers, onClearPreselectedPlayer, preselectedPlayerId]);

  useEffect(() => {
    if (!selectedPlayer) return;
    setRole(getDefaultRoleForPlayer(selectedPlayer));
  }, [selectedPlayer?.id]);

  useEffect(() => {
    if (!selectedPlayer || !assessmentDate) return;
    if (!selectedPlayer.dateOfBirth) return;
    const computed = computeAgeGroupFromDob(selectedPlayer.dateOfBirth, assessmentDate);
    if (!computed) return;
    setAgeGroup(computed);
  }, [assessmentDate, selectedPlayer?.dateOfBirth]);

  const playerAssessments = useMemo(() => {
    if (!selectedPlayerId) return [];
    return assessments
      .filter(s => s.playerId === selectedPlayerId)
      .sort((a, b) => {
        const ad = new Date(a.assessmentDate).getTime();
        const bd = new Date(b.assessmentDate).getTime();
        if (ad !== bd) return bd - ad;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [assessments, selectedPlayerId]);

  const playerNameById = useMemo(
    () => new Map(eligiblePlayers.map((player) => [player.id, player.name])),
    [eligiblePlayers]
  );

  const assessmentProgressSeries = useMemo(
    () => buildAssessmentProgressSeries(playerAssessments),
    [playerAssessments]
  );

  const latestProgressRole = useMemo(
    () => getLatestRoleFromProgress(assessmentProgressSeries),
    [assessmentProgressSeries]
  );

  const roleProgressSeries = useMemo(
    () => latestProgressRole ? filterProgressSeriesByRole(assessmentProgressSeries, latestProgressRole) : [],
    [assessmentProgressSeries, latestProgressRole]
  );

  const progressDelta = useMemo(
    () => calculateProgressDelta(assessmentProgressSeries),
    [assessmentProgressSeries]
  );

  const weightedProgressAttributes = useMemo(
    () => latestProgressRole ? getWeightedProgressAttributes(latestProgressRole, 4) : [],
    [latestProgressRole]
  );

  const roleAttributeTrendData = useMemo(
    () => roleProgressSeries.map((point) => {
      const row: AssessmentProgressPoint & { [key: string]: number | string | Record<FprdsAttributeId, number> } = {
        ...point
      };
      weightedProgressAttributes.forEach((attributeId) => {
        row[attributeId] = point.attributeScores[attributeId];
      });
      return row;
    }),
    [roleProgressSeries, weightedProgressAttributes]
  );

  const latestAssessmentByPlayerId = useMemo(() => {
    const map = new Map<string, AssessmentSession>();
    eligiblePlayers.forEach((player) => {
      const latest = selectLatestAssessmentByPlayer(assessments, player.id);
      if (latest) map.set(player.id, latest);
    });
    return map;
  }, [assessments, eligiblePlayers]);

  const assessedPlayerSummaries = useMemo(() => (
    eligiblePlayers
      .map((player) => {
        const playerSessions = assessments.filter((session) => session.playerId === player.id);
        const latest = latestAssessmentByPlayerId.get(player.id) ?? null;
        return {
          player,
          latest,
          sessionCount: playerSessions.length
        };
      })
      .filter((summary): summary is { player: Player; latest: AssessmentSession; sessionCount: number } => summary.latest !== null)
      .sort((a, b) => {
        const ad = new Date(a.latest.assessmentDate).getTime();
        const bd = new Date(b.latest.assessmentDate).getTime();
        if (ad !== bd) return bd - ad;
        return a.player.name.localeCompare(b.player.name);
      })
  ), [assessments, eligiblePlayers, latestAssessmentByPlayerId]);

  const playerComparisonOptions = useMemo(
    () => eligiblePlayers.filter((player) => player.id !== selectedPlayerId && latestAssessmentByPlayerId.has(player.id)),
    [eligiblePlayers, latestAssessmentByPlayerId, selectedPlayerId]
  );

  useEffect(() => {
    const hasCurrentOption = playerComparisonOptions.some((player) => player.id === comparisonPlayerId);
    if (hasCurrentOption) return;
    setComparisonPlayerId(playerComparisonOptions[0]?.id ?? '');
  }, [comparisonPlayerId, playerComparisonOptions]);

  useEffect(() => {
    if (assessmentProgressSeries.length === 0) {
      setBaselineSessionId('');
      setTargetSessionId('');
      return;
    }

    const latest = assessmentProgressSeries[assessmentProgressSeries.length - 1];
    const previous = assessmentProgressSeries[assessmentProgressSeries.length - 2] ?? null;
    setTargetSessionId((current) => (
      assessmentProgressSeries.some((point) => point.id === current) ? current : latest.id
    ));
    setBaselineSessionId((current) => (
      current && assessmentProgressSeries.some((point) => point.id === current)
        ? current
        : previous?.id ?? ''
    ));
  }, [assessmentProgressSeries]);

  const selectedPlayerLatestAssessment = selectedPlayerId ? latestAssessmentByPlayerId.get(selectedPlayerId) ?? null : null;
  const comparisonPlayer = playerComparisonOptions.find((player) => player.id === comparisonPlayerId) ?? null;
  const comparisonPlayerLatestAssessment = comparisonPlayerId ? latestAssessmentByPlayerId.get(comparisonPlayerId) ?? null : null;
  const playerAssessmentReport = useMemo(
    () => buildPlayerAssessmentReport(selectedPlayerLatestAssessment, comparisonPlayerLatestAssessment),
    [comparisonPlayerLatestAssessment, selectedPlayerLatestAssessment]
  );

  const baselineSession = baselineSessionId ? playerAssessments.find((session) => session.id === baselineSessionId) ?? null : null;
  const targetSession = targetSessionId ? playerAssessments.find((session) => session.id === targetSessionId) ?? null : null;
  const sessionAssessmentReport = useMemo(
    () => buildSessionAssessmentReport(baselineSession, targetSession),
    [baselineSession, targetSession]
  );

  const requiredRoleFields = useMemo(() => {
    const fields: Array<{ key: string; label: string; hint?: string; min?: number; max?: number; step?: number }> = [];

    if (role === 'ST') {
      fields.push(
        { key: 'finishingGoalsOutOf6', label: 'Finishing: goals (out of 6)', min: 0, max: 6, step: 1 },
        { key: 'finishingOnTargetOutOf6', label: 'Finishing: on target (out of 6)', min: 0, max: 6, step: 1 }
      );
      if (assessmentType === 'Full' || assessmentType === 'Quick') {
        fields.push({ key: 'shotPowerMaxControlledDistanceMeters', label: 'Shot power: max controlled distance (m)', min: 0, step: 0.1 });
      }
      if (assessmentType === 'Full') {
        fields.push(
          { key: 'offensive1v1TakeonsOutOf10', label: 'Offensive 1v1: take-ons (out of 10)', min: 0, max: 10, step: 1 },
          { key: 'attackingHeadingOnTargetOutOf10', label: 'Attacking heading: on target (out of 10)', min: 0, max: 10, step: 1 }
        );
      }
    }

    if (role === 'W') {
      fields.push(
        { key: 'finishingGoalsOutOf6', label: 'Finishing: goals (out of 6)', min: 0, max: 6, step: 1 },
        { key: 'finishingOnTargetOutOf6', label: 'Finishing: on target (out of 6)', min: 0, max: 6, step: 1 },
        { key: 'offensive1v1TakeonsOutOf10', label: 'Offensive 1v1: take-ons (out of 10)', min: 0, max: 10, step: 1 }
      );
      if (assessmentType === 'Full') {
        fields.push(
          { key: 'shotPowerMaxControlledDistanceMeters', label: 'Shot power: max controlled distance (m)', min: 0, step: 0.1 },
          { key: 'attackingHeadingOnTargetOutOf10', label: 'Attacking heading: on target (out of 10)', min: 0, max: 10, step: 1 }
        );
      }
    }

    if (role === 'CM') {
      fields.push(
        { key: 'longPassing30mSuccessesOutOf5', label: 'Long passing: 30m successes (out of 5)', min: 0, max: 5, step: 1 },
        { key: 'longPassing40mSuccessesOutOf5', label: 'Long passing: 40m successes (out of 5)', min: 0, max: 5, step: 1 },
        { key: 'visionCoachScore1to10', label: 'Vision / playmaking: coach score (1–10)', min: 1, max: 10, step: 1 }
      );
      if (assessmentType === 'Full') {
        fields.push(
          { key: 'ballRetentionBestSeconds', label: 'Ball retention: best time (seconds)', min: 0, step: 0.1 },
          { key: 'pressingWinsOutOf5', label: 'Pressing: wins (out of 5)', min: 0, max: 5, step: 1 }
        );
      }
    }

    if (role === 'CDM') {
      fields.push(
        { key: 'longPassing30mSuccessesOutOf5', label: 'Long passing: 30m successes (out of 5)', min: 0, max: 5, step: 1 },
        { key: 'longPassing40mSuccessesOutOf5', label: 'Long passing: 40m successes (out of 5)', min: 0, max: 5, step: 1 },
        { key: 'pressingWinsOutOf5', label: 'Pressing: wins (out of 5)', min: 0, max: 5, step: 1 }
      );
      if (assessmentType === 'Full') {
        fields.push(
          { key: 'visionCoachScore1to10', label: 'Vision / playmaking: coach score (1–10)', min: 1, max: 10, step: 1 },
          { key: 'ballRetentionBestSeconds', label: 'Ball retention: best time (seconds)', min: 0, step: 0.1 }
        );
      }
    }

    if (role === 'FB') {
      fields.push(
        { key: 'tacklingWinsOutOf10', label: 'Tackling: wins (out of 10)', min: 0, max: 10, step: 1 },
        { key: 'crossingSuccessesOutOf10', label: 'Crossing: successes (out of 10)', min: 0, max: 10, step: 1 }
      );
      if (assessmentType === 'Full') {
        fields.push(
          { key: 'defensiveHeadingClearancesOutOf10', label: 'Defensive heading: clearances (out of 10)', min: 0, max: 10, step: 1 },
          { key: 'positioningCoachScore1to10', label: 'Positioning: coach score (1–10)', min: 1, max: 10, step: 1 },
          { key: 'positioningClearancesToSafeZoneOutOf10', label: 'Positioning: clearances to safe zone (out of 10)', min: 0, max: 10, step: 1 }
        );
      }
    }

    if (role === 'CB') {
      fields.push(
        { key: 'tacklingWinsOutOf10', label: 'Tackling: wins (out of 10)', min: 0, max: 10, step: 1 },
        { key: 'defensiveHeadingClearancesOutOf10', label: 'Defensive heading: clearances (out of 10)', min: 0, max: 10, step: 1 }
      );
      if (assessmentType === 'Full') {
        fields.push(
          { key: 'positioningCoachScore1to10', label: 'Positioning: coach score (1–10)', min: 1, max: 10, step: 1 },
          { key: 'positioningClearancesToSafeZoneOutOf10', label: 'Positioning: clearances to safe zone (out of 10)', min: 0, max: 10, step: 1 },
          { key: 'crossingSuccessesOutOf10', label: 'Crossing: successes (out of 10)', min: 0, max: 10, step: 1 }
        );
      }
    }

    if (role === 'GK') {
      fields.push(
        { key: 'gkReflexesSavesOutOf10', label: 'Reflexes: saves/catches (out of 10)', min: 0, max: 10, step: 1 },
        { key: 'gkHandlingCleanCatchesOutOf10', label: 'Handling: clean catches (out of 10)', min: 0, max: 10, step: 1 }
      );
      if (assessmentType === 'Full') {
        fields.push(
          { key: 'gkDivingSavesOutOf10', label: 'Diving / reach: saves (out of 10)', min: 0, max: 10, step: 1 },
          { key: 'gkDistributionSuccessesOutOf10', label: 'Distribution: successes (out of 10)', min: 0, max: 10, step: 1 }
        );
      }
    }

    return fields;
  }, [assessmentType, role]);

  const parsedBase = useMemo(() => {
    const toNum = (v: string) => (v.trim() ? Number(v) : NaN);
    return {
      sprint10mSeconds: toNum(base.sprint10mSeconds),
      sprint30mSeconds: toNum(base.sprint30mSeconds),
      yoyoMeters: toNum(base.yoyoMeters),
      illinoisSeconds: toNum(base.illinoisSeconds),
      broadJumpCm: toNum(base.broadJumpCm),
      medicineBallThrowCm: toNum(base.medicineBallThrowCm),
      firstTouchSuccessesOutOf10: toNum(base.firstTouchSuccessesOutOf10),
      shortPassingSuccessesOutOf10: toNum(base.shortPassingSuccessesOutOf10)
    };
  }, [base]);

  const parsedRoleSpecific = useMemo(() => {
    const out: Record<string, number> = {};
    for (const key of Object.keys(roleSpecific)) {
      const raw = roleSpecific[key];
      out[key] = raw.trim() ? Number(raw) : NaN;
    }
    return out;
  }, [roleSpecific]);

  const scorePreview = useMemo(() => {
    if (!selectedPlayer) return null;
    if (!assessmentDate) return null;
    if (!ageGroup) return null;

    const res = computeScoresForSession({
      role,
      ageGroup,
      assessmentType,
      base: parsedBase,
      roleSpecific: parsedRoleSpecific
    });

    if (res.ok === false) return { ok: false as const, errors: res.errors };

    const scoredWeightedKeys = weightedAttributeIdsForRole(role).filter(k => typeof res.result.attributeScores[k] === 'number');
    if (scoredWeightedKeys.length === 0) return null;

    return { ok: true as const, ...res.result };
  }, [ageGroup, assessmentDate, assessmentType, parsedBase, parsedRoleSpecific, role, selectedPlayer]);

  const fieldErrors = useMemo(() => {
    const map: Record<string, string> = {};
    if (!scorePreview || scorePreview.ok) return map;
    scorePreview.errors.forEach(e => {
      map[e.field] = e.message;
    });
    return map;
  }, [scorePreview]);
  const showAssessmentSubmitErrors = hasFieldErrors(assessmentSubmitErrors);

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setSaveError(null);
    setAssessmentSubmitErrors({});
    setStep(2);
  };

  const handleOpenTeamHistory = () => {
    setSelectedPlayerId('');
    setPlayerSearch('');
    setSaveError(null);
    setAssessmentSubmitErrors({});
    setStep(6);
  };

  const handleSaveSessionNote = (sessionId: string) => {
    const sourceSession = assessments.find((session) => session.id === sessionId);
    const nextNotes = noteDrafts[sessionId] ?? sourceSession?.coachNotes ?? '';
    onUpdateAssessmentNotes(sessionId, nextNotes);
  };

  const handleNextStep = () => {
    setSaveError(null);
    setAssessmentSubmitErrors({});
    setStep(nextAssessmentStep);
  };

  const handlePrevStep = () => {
    setSaveError(null);
    setAssessmentSubmitErrors({});
    setStep(previousAssessmentStep);
  };

  const handleSaveAssessment = () => {
    setSaveError(null);
    setAssessmentSubmitErrors({});
    if (!selectedPlayer) {
      const errors = { playerId: 'Select a player to continue.' };
      setAssessmentSubmitErrors(errors);
      setSaveError(errors.playerId);
      focusFirstInvalidField(assessmentContainerRef.current, errors);
      return;
    }
    if (!ageGroup) {
      const errors = { ageGroup: 'Select an age group to continue.' };
      setAssessmentSubmitErrors(errors);
      setSaveError(errors.ageGroup);
      focusFirstInvalidField(assessmentContainerRef.current, errors);
      return;
    }
    if (!scorePreview || !scorePreview.ok) {
      setAssessmentSubmitErrors(fieldErrors);
      setSaveError('Fix validation errors before saving.');
      focusFirstInvalidField(assessmentContainerRef.current, fieldErrors);
      return;
    }

    const nowIso = new Date().toISOString();
    const id = `assess_${Date.now()}`;
    const previous = playerAssessments.find(s => s.role === role) ?? null;

    const attributeDeltas: Partial<Record<FprdsAttributeId, number>> = {};
    if (previous) {
      (Object.keys(scorePreview.attributeScores) as FprdsAttributeId[]).forEach((k) => {
        const prevVal = previous.attributeScores[k];
        const nowVal = scorePreview.attributeScores[k];
        if (typeof prevVal !== 'number' || typeof nowVal !== 'number') return;
        attributeDeltas[k] = Math.round(nowVal - prevVal);
      });
    }

    const sessionBase = {
      sprint10mSeconds: Number(parsedBase.sprint10mSeconds),
      sprint30mSeconds: Number(parsedBase.sprint30mSeconds),
      yoyoMeters: Number(parsedBase.yoyoMeters),
      illinoisSeconds: Number(parsedBase.illinoisSeconds),
      broadJumpCm: Number(parsedBase.broadJumpCm),
      medicineBallThrowCm: Number(parsedBase.medicineBallThrowCm),
      firstTouchSuccessesOutOf10: Number(parsedBase.firstTouchSuccessesOutOf10),
      shortPassingSuccessesOutOf10: Number(parsedBase.shortPassingSuccessesOutOf10),
      shortPassingGateWidthModifier: 'standard' as const
    };

    const buildRawResults = (): AssessmentRawResults => {
      const rs = parsedRoleSpecific;
      if (role === 'ST') {
        if (assessmentType === 'Quick') {
          return {
            role: 'ST',
            assessmentType: 'Quick',
            base: sessionBase,
            roleSpecific: {
              finishingGoalsOutOf6: Number(rs.finishingGoalsOutOf6),
              finishingOnTargetOutOf6: Number(rs.finishingOnTargetOutOf6),
              shotPowerMaxControlledDistanceMeters: Number(rs.shotPowerMaxControlledDistanceMeters)
            }
          };
        }
        return {
          role: 'ST',
          assessmentType: 'Full',
          base: sessionBase,
          roleSpecific: {
            finishingGoalsOutOf6: Number(rs.finishingGoalsOutOf6),
            finishingOnTargetOutOf6: Number(rs.finishingOnTargetOutOf6),
            shotPowerMaxControlledDistanceMeters: Number(rs.shotPowerMaxControlledDistanceMeters),
            offensive1v1TakeonsOutOf10: Number(rs.offensive1v1TakeonsOutOf10),
            attackingHeadingOnTargetOutOf10: Number(rs.attackingHeadingOnTargetOutOf10)
          }
        };
      }

      if (role === 'W') {
        if (assessmentType === 'Quick') {
          return {
            role: 'W',
            assessmentType: 'Quick',
            base: sessionBase,
            roleSpecific: {
              finishingGoalsOutOf6: Number(rs.finishingGoalsOutOf6),
              finishingOnTargetOutOf6: Number(rs.finishingOnTargetOutOf6),
              offensive1v1TakeonsOutOf10: Number(rs.offensive1v1TakeonsOutOf10)
            }
          };
        }
        return {
          role: 'W',
          assessmentType: 'Full',
          base: sessionBase,
          roleSpecific: {
            finishingGoalsOutOf6: Number(rs.finishingGoalsOutOf6),
            finishingOnTargetOutOf6: Number(rs.finishingOnTargetOutOf6),
            shotPowerMaxControlledDistanceMeters: Number(rs.shotPowerMaxControlledDistanceMeters),
            offensive1v1TakeonsOutOf10: Number(rs.offensive1v1TakeonsOutOf10),
            attackingHeadingOnTargetOutOf10: Number(rs.attackingHeadingOnTargetOutOf10)
          }
        };
      }

      if (role === 'CM') {
        if (assessmentType === 'Quick') {
          return {
            role: 'CM',
            assessmentType: 'Quick',
            base: sessionBase,
            roleSpecific: {
              longPassing30mSuccessesOutOf5: Number(rs.longPassing30mSuccessesOutOf5),
              longPassing40mSuccessesOutOf5: Number(rs.longPassing40mSuccessesOutOf5),
              visionCoachScore1to10: Number(rs.visionCoachScore1to10)
            }
          };
        }
        return {
          role: 'CM',
          assessmentType: 'Full',
          base: sessionBase,
          roleSpecific: {
            longPassing30mSuccessesOutOf5: Number(rs.longPassing30mSuccessesOutOf5),
            longPassing40mSuccessesOutOf5: Number(rs.longPassing40mSuccessesOutOf5),
            visionCoachScore1to10: Number(rs.visionCoachScore1to10),
            ballRetentionBestSeconds: Number(rs.ballRetentionBestSeconds),
            pressingWinsOutOf5: Number(rs.pressingWinsOutOf5)
          }
        };
      }

      if (role === 'CDM') {
        if (assessmentType === 'Quick') {
          return {
            role: 'CDM',
            assessmentType: 'Quick',
            base: sessionBase,
            roleSpecific: {
              longPassing30mSuccessesOutOf5: Number(rs.longPassing30mSuccessesOutOf5),
              longPassing40mSuccessesOutOf5: Number(rs.longPassing40mSuccessesOutOf5),
              pressingWinsOutOf5: Number(rs.pressingWinsOutOf5)
            }
          };
        }
        return {
          role: 'CDM',
          assessmentType: 'Full',
          base: sessionBase,
          roleSpecific: {
            longPassing30mSuccessesOutOf5: Number(rs.longPassing30mSuccessesOutOf5),
            longPassing40mSuccessesOutOf5: Number(rs.longPassing40mSuccessesOutOf5),
            visionCoachScore1to10: Number(rs.visionCoachScore1to10),
            ballRetentionBestSeconds: Number(rs.ballRetentionBestSeconds),
            pressingWinsOutOf5: Number(rs.pressingWinsOutOf5)
          }
        };
      }

      if (role === 'FB') {
        if (assessmentType === 'Quick') {
          return {
            role: 'FB',
            assessmentType: 'Quick',
            base: sessionBase,
            roleSpecific: {
              tacklingWinsOutOf10: Number(rs.tacklingWinsOutOf10),
              crossingSuccessesOutOf10: Number(rs.crossingSuccessesOutOf10)
            }
          };
        }
        return {
          role: 'FB',
          assessmentType: 'Full',
          base: sessionBase,
          roleSpecific: {
            tacklingWinsOutOf10: Number(rs.tacklingWinsOutOf10),
            defensiveHeadingClearancesOutOf10: Number(rs.defensiveHeadingClearancesOutOf10),
            positioningCoachScore1to10: Number(rs.positioningCoachScore1to10),
            positioningClearancesToSafeZoneOutOf10: Number(rs.positioningClearancesToSafeZoneOutOf10),
            crossingSuccessesOutOf10: Number(rs.crossingSuccessesOutOf10)
          }
        };
      }

      if (role === 'CB') {
        if (assessmentType === 'Quick') {
          return {
            role: 'CB',
            assessmentType: 'Quick',
            base: sessionBase,
            roleSpecific: {
              tacklingWinsOutOf10: Number(rs.tacklingWinsOutOf10),
              defensiveHeadingClearancesOutOf10: Number(rs.defensiveHeadingClearancesOutOf10)
            }
          };
        }
        return {
          role: 'CB',
          assessmentType: 'Full',
          base: sessionBase,
          roleSpecific: {
            tacklingWinsOutOf10: Number(rs.tacklingWinsOutOf10),
            defensiveHeadingClearancesOutOf10: Number(rs.defensiveHeadingClearancesOutOf10),
            positioningCoachScore1to10: Number(rs.positioningCoachScore1to10),
            positioningClearancesToSafeZoneOutOf10: Number(rs.positioningClearancesToSafeZoneOutOf10),
            crossingSuccessesOutOf10: Number(rs.crossingSuccessesOutOf10)
          }
        };
      }

      // GK
      if (assessmentType === 'Quick') {
        return {
          role: 'GK',
          assessmentType: 'Quick',
          base: sessionBase,
          roleSpecific: {
            gkReflexesSavesOutOf10: Number(rs.gkReflexesSavesOutOf10),
            gkHandlingCleanCatchesOutOf10: Number(rs.gkHandlingCleanCatchesOutOf10)
          }
        };
      }

      return {
        role: 'GK',
        assessmentType: 'Full',
        base: sessionBase,
        roleSpecific: {
          gkReflexesSavesOutOf10: Number(rs.gkReflexesSavesOutOf10),
          gkHandlingCleanCatchesOutOf10: Number(rs.gkHandlingCleanCatchesOutOf10),
          gkDivingSavesOutOf10: Number(rs.gkDivingSavesOutOf10),
          gkDistributionSuccessesOutOf10: Number(rs.gkDistributionSuccessesOutOf10)
        }
      };
    };

    const session: AssessmentSession = {
      id,
      playerId: selectedPlayer.id,
      assessmentDate,
      createdAt: nowIso,
      assessmentType,
      ageGroup,
      role,
      rawResults: buildRawResults(),
      attributeScores: scorePreview.attributeScores,
      ovr: scorePreview.ovr,
      labels: {
        weakestAttributeId: scorePreview.weakestAttributeId,
        ovrTierLabel: scorePreview.ovrTierLabel
      },
      deltas: {
        previousSessionId: previous?.id,
        ovrDelta: previous ? Math.round(scorePreview.ovr - previous.ovr) : undefined,
        attributeDeltas: previous ? attributeDeltas : undefined
      },
      developmentPlan: assessmentType === 'Full' ? generateFourWeekPlan(role, scorePreview.attributeScores) : undefined
    };

    onAddAssessment(session);

    setStep(6);
  };

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return eligiblePlayers;
    return eligiblePlayers.filter(p => p.name.toLowerCase().includes(q) || String(p.number).includes(q));
  }, [eligiblePlayers, playerSearch]);

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Select Player';
    if (step === 2) return 'Select Role';
    if (step === 3) return 'Assessment Settings';
    if (step === 4) return 'Age Group';
    if (step === 5) return 'Enter Results';
    if (!selectedPlayer) return 'Team History';
    return 'Review & History';
  }, [selectedPlayer, step]);

  const canGoNext = useMemo(() => {
    if (step === 1) return !!selectedPlayerId;
    if (step === 2) return !!role;
    if (step === 3) return !!assessmentType && !!assessmentDate;
    if (step === 4) return !!ageGroup;
    if (step === 5) return !!scorePreview && scorePreview.ok;
    return false;
  }, [ageGroup, assessmentDate, assessmentType, role, scorePreview, selectedPlayerId, step]);

  return (
    <div id="assessments-view-container" ref={assessmentContainerRef} className="space-y-6">
      <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center shrink-0">
              <ClipboardList className="text-indigo-700" size={20} />
            </div>
            <div>
              <h2 className="font-display font-black tracking-tight text-slate-900 text-lg">Assessment Center</h2>
              <p className="text-xs text-slate-500 font-medium">
                Run objective drill-based assessments and generate FIFA-style ratings, deltas, and development plans.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenTeamHistory}
              aria-label="Open team assessment history"
              className="h-7 rounded-lg border-indigo-200 bg-indigo-50 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
            >
              <History size={10} /> Team history
            </Button>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              Step {step} / 6: {stepTitle}
            </div>
          </div>
        </div>

        {saveError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} /> {saveError}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {step < 6 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={step === 1}
              aria-label="Previous step"
              className={`rounded-xl px-4 py-2 text-xs font-black ${
                step === 1
                  ? 'border-slate-200 bg-slate-50 text-slate-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft size={14} /> Back
            </Button>
          ) : (
            <div aria-hidden="true" />
          )}

          {step < 6 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!canGoNext}
              aria-label="Next step"
              className={`rounded-xl border px-4 py-2 text-xs font-black ${
                canGoNext
                  ? 'border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-300'
              }`}
            >
              Next <ChevronRight size={14} />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedPlayerId('');
                setPlayerSearch('');
                setRole('CM');
                setAssessmentType('Full');
                setAssessmentDate(todayIsoDate());
                setAgeGroup('');
                setBase({
                  sprint10mSeconds: '',
                  sprint30mSeconds: '',
                  yoyoMeters: '',
                  illinoisSeconds: '',
                  broadJumpCm: '',
                  medicineBallThrowCm: '',
                  firstTouchSuccessesOutOf10: '',
                  shortPassingSuccessesOutOf10: ''
                });
                setRoleSpecific({});
                setSaveError(null);
              }}
              aria-label="Start new assessment"
              className="rounded-xl border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <Sparkles size={14} /> New assessment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          {step === 1 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                  <User size={16} className="text-indigo-600" /> Select Player
                </h3>
                <div className="relative w-full max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search name or number"
                    aria-label="Search players"
                    className="rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-800 focus-visible:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPlayers.map(p => {
                  const isActive = selectedPlayerId === p.id;
                  return (
                    <Button
                      key={p.id}
                      type="button"
                      variant="outline"
                      data-validation-field={isActive ? 'playerId' : undefined}
                      onClick={() => handleSelectPlayer(p.id)}
                      aria-label={`Select ${p.name}`}
                      className={`h-auto justify-start whitespace-normal rounded-2xl p-4 text-left ${
                        isActive
                          ? 'border-indigo-300 bg-indigo-50 shadow-md'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm truncate">{p.name}</span>
                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5">
                              #{p.number || '—'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold truncate">{p.position}</p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="mt-3 text-xs font-black text-indigo-700 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Selected
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>

              {filteredPlayers.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm font-semibold">
                  No players match your search.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Select Role
              </h3>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK'] as FprdsRole[]).map(r => {
                  const active = role === r;
                  return (
                    <Button
                      key={r}
                      type="button"
                      variant="outline"
                      onClick={() => setRole(r)}
                      aria-label={`Select role ${ROLE_LABELS[r]}`}
                      className={`h-auto justify-start whitespace-normal rounded-2xl p-4 text-left ${
                        active ? 'border-indigo-300 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">{ROLE_LABELS[r]}</p>
                          <p className="text-xs text-slate-500 font-semibold">Role code: {r}</p>
                        </div>
                        {active && <CheckCircle2 size={18} className="text-indigo-700" />}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6 space-y-4">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" /> Assessment Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Assessment type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Full', 'Quick'] as AssessmentType[]).map(t => {
                      const active = assessmentType === t;
                      return (
                        <Button
                          key={t}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          onClick={() => setAssessmentType(t)}
                          aria-label={`Select ${t} assessment`}
                          className={`rounded-xl px-4 py-2 text-xs font-black ${
                            active ? 'border-indigo-300 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {t}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Full runs base + all role attributes. Quick runs base + top role attributes only.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Assessment date</label>
                  <Input
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    aria-label="Assessment date"
                    className="rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-800 focus-visible:ring-indigo-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6 space-y-4">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Age Group
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Benchmarks are age-grouped. If the player has a Date of Birth saved, we auto-select the correct group.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['U12', 'U15', 'U18', 'Adult'] as AgeGroup[]).map(g => {
                  const active = ageGroup === g;
                  return (
                    <Button
                      key={g}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      data-validation-field={active ? 'ageGroup' : undefined}
                      onClick={() => setAgeGroup(g)}
                      aria-label={`Select age group ${g}`}
                      className={`rounded-xl px-4 py-2 text-xs font-black ${
                        active ? 'border-indigo-300 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6 space-y-6">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Enter Results
              </h3>
              <FormErrorSummary
                id="assessment-error-summary"
                errors={showAssessmentSubmitErrors ? assessmentSubmitErrors : {}}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Base attributes (all players)</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <NumberInput
                    id="base-sprint10"
                    fieldName="sprint10mSeconds"
                    label="10m split (seconds)"
                    value={base.sprint10mSeconds}
                    step={0.01}
                    error={assessmentSubmitErrors.sprint10mSeconds}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, sprint10mSeconds: undefined }));
                      setBase(prev => ({ ...prev, sprint10mSeconds: v }));
                    }}
                  />
                  <NumberInput
                    id="base-sprint30"
                    fieldName="sprint30mSeconds"
                    label="30m sprint (seconds)"
                    value={base.sprint30mSeconds}
                    step={0.01}
                    error={assessmentSubmitErrors.sprint30mSeconds}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, sprint30mSeconds: undefined }));
                      setBase(prev => ({ ...prev, sprint30mSeconds: v }));
                    }}
                  />
                  <NumberInput
                    id="base-yoyo"
                    fieldName="yoyoMeters"
                    label="Yo-Yo distance (meters)"
                    value={base.yoyoMeters}
                    step={1}
                    error={assessmentSubmitErrors.yoyoMeters}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, yoyoMeters: undefined }));
                      setBase(prev => ({ ...prev, yoyoMeters: v }));
                    }}
                  />
                  <NumberInput
                    id="base-illinois"
                    fieldName="illinoisSeconds"
                    label="Illinois agility (seconds)"
                    value={base.illinoisSeconds}
                    step={0.01}
                    error={assessmentSubmitErrors.illinoisSeconds}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, illinoisSeconds: undefined }));
                      setBase(prev => ({ ...prev, illinoisSeconds: v }));
                    }}
                  />
                  <NumberInput
                    id="base-broad"
                    fieldName="broadJumpCm"
                    label="Standing broad jump (cm)"
                    value={base.broadJumpCm}
                    step={1}
                    error={assessmentSubmitErrors.broadJumpCm}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, broadJumpCm: undefined }));
                      setBase(prev => ({ ...prev, broadJumpCm: v }));
                    }}
                  />
                  <NumberInput
                    id="base-medball"
                    fieldName="medicineBallThrowCm"
                    label="Medicine ball throw (cm)"
                    value={base.medicineBallThrowCm}
                    step={1}
                    error={assessmentSubmitErrors.medicineBallThrowCm}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, medicineBallThrowCm: undefined }));
                      setBase(prev => ({ ...prev, medicineBallThrowCm: v }));
                    }}
                  />
                  <NumberInput
                    id="base-fth"
                    fieldName="firstTouchSuccessesOutOf10"
                    label="First touch: successes (out of 10)"
                    value={base.firstTouchSuccessesOutOf10}
                    step={1}
                    min={0}
                    max={10}
                    error={assessmentSubmitErrors.firstTouchSuccessesOutOf10}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, firstTouchSuccessesOutOf10: undefined }));
                      setBase(prev => ({ ...prev, firstTouchSuccessesOutOf10: v }));
                    }}
                  />
                  <NumberInput
                    id="base-spa"
                    fieldName="shortPassingSuccessesOutOf10"
                    label="Short passing: successes (out of 10)"
                    value={base.shortPassingSuccessesOutOf10}
                    step={1}
                    min={0}
                    max={10}
                    error={assessmentSubmitErrors.shortPassingSuccessesOutOf10}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, shortPassingSuccessesOutOf10: undefined }));
                      setBase(prev => ({ ...prev, shortPassingSuccessesOutOf10: v }));
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Role attributes ({ROLE_LABELS[role]})</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {requiredRoleFields.map(f => (
                    <NumberInput
                      key={f.key}
                      id={`role-${f.key}`}
                      fieldName={f.key}
                      label={f.label}
                      value={roleSpecific[f.key] ?? ''}
                      hint={f.hint}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      error={assessmentSubmitErrors[f.key]}
                      onChange={(v) => {
                        setAssessmentSubmitErrors(previous => ({ ...previous, [f.key]: undefined }));
                        setRoleSpecific(prev => ({ ...prev, [f.key]: v }));
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  onClick={handleSaveAssessment}
                  aria-label="Save assessment"
                  className={`rounded-xl border px-4 py-2 text-xs font-black ${
                    scorePreview && scorePreview.ok
                      ? 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Save size={14} /> Save assessment
                </Button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600" /> {selectedPlayer ? 'Assessment History' : 'Team Assessment History'}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedPlayer
                      ? `Review saved sessions, reports, and notes for ${selectedPlayer.name}.`
                      : 'Choose an assessed player to view organized history, reports, and notes.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                  {!selectedPlayer && assessedPlayerSummaries.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 font-semibold">
                      No team assessments saved yet. Start a new assessment from the player roster to build history.
                    </div>
                  )}

                  {!selectedPlayer && assessedPlayerSummaries.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {assessedPlayerSummaries.map(({ player, latest, sessionCount }) => (
                        <Button
                          key={player.id}
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedPlayerId(player.id)}
                          aria-label={`Open assessment history for ${player.name}`}
                          className="h-auto justify-start whitespace-normal rounded-2xl border-slate-200 bg-white p-4 text-left shadow-sm hover:border-indigo-200 hover:bg-indigo-50/40 focus-visible:ring-indigo-100"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={player.photoUrl}
                                alt=""
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <p className="font-black text-sm text-slate-900 truncate">{player.name}</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate">
                                  #{player.number || '-'} • {player.position}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">OVR</p>
                              <p className="text-lg font-display font-black text-slate-900 leading-none">{latest.ovr}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sessions</p>
                              <p className="text-sm font-black text-slate-900">{sessionCount}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Latest</p>
                              <p className="text-xs font-black text-slate-900">{latest.assessmentDate}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Role</p>
                              <p className="text-xs font-black text-slate-900">{ROLE_LABELS[latest.role]}</p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {selectedPlayer && playerAssessments.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-semibold">
                      No assessments saved for this player yet.
                    </div>
                  )}

                  {selectedPlayer && assessmentProgressSeries.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Historical progress</p>
                          <h4 className="mt-1 text-sm font-black text-slate-900">Saved assessment trend</h4>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Built from actual saved assessment sessions for {selectedPlayer.name}.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sessions</p>
                            <p className="text-lg font-display font-black text-slate-900 leading-none">{assessmentProgressSeries.length}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Latest OVR</p>
                            <p className="text-lg font-display font-black text-slate-900 leading-none">
                              {assessmentProgressSeries[assessmentProgressSeries.length - 1].ovr}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Change</p>
                            <p className={`text-lg font-display font-black leading-none ${
                              progressDelta === null
                                ? 'text-slate-400'
                                : progressDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {progressDelta === null ? '-' : progressDelta >= 0 ? `+${progressDelta}` : progressDelta}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">OVR timeline</p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-1">
                              All roles
                            </span>
                          </div>
                          <div className="mt-3 h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={assessmentProgressSeries} margin={{ top: 10, right: 12, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[10, 99]} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<AssessmentProgressTooltip />} />
                                <Line
                                  name="OVR"
                                  type="monotone"
                                  dataKey="ovr"
                                  stroke="#4f46e5"
                                  strokeWidth={3}
                                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#4f46e5' }}
                                  activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Role attribute trend</p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-1">
                              {latestProgressRole ? ROLE_LABELS[latestProgressRole] : 'No role'}
                            </span>
                          </div>
                          {roleAttributeTrendData.length < 2 ? (
                            <div className="mt-3 flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                              <p className="max-w-xs text-xs font-semibold text-slate-500">
                                Save at least two assessments with the same latest role to compare role-weighted attributes over time.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 h-[220px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={roleAttributeTrendData} margin={{ top: 10, right: 12, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                  <YAxis domain={[10, 99]} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                  <Tooltip content={<AssessmentProgressTooltip />} />
                                  {weightedProgressAttributes.map((attributeId, index) => (
                                    <Line
                                      key={attributeId}
                                      name={ATTRIBUTE_LABELS[attributeId]}
                                      type="monotone"
                                      dataKey={attributeId}
                                      stroke={ATTRIBUTE_LINE_COLORS[index % ATTRIBUTE_LINE_COLORS.length]}
                                      strokeWidth={2.5}
                                      dot={{ r: 3, strokeWidth: 1.5, fill: '#ffffff', stroke: ATTRIBUTE_LINE_COLORS[index % ATTRIBUTE_LINE_COLORS.length] }}
                                      activeDot={{ r: 5, strokeWidth: 0 }}
                                    />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPlayer && assessmentProgressSeries.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <ArrowLeftRight size={14} className="text-indigo-600" /> FPRDS reports
                          </p>
                          <h4 className="mt-1 text-sm font-black text-slate-900">Player and session comparisons</h4>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Compare latest player assessments or inspect how one saved session changed from another.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Player-to-player report</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">Latest assessment vs latest assessment.</p>
                            </div>
                            <label className="min-w-[220px] space-y-1">
                              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Compare with</span>
                              <Select
                                value={comparisonPlayerId || 'none'}
                                onValueChange={(value) => setComparisonPlayerId(value === 'none' ? '' : value)}
                                disabled={playerComparisonOptions.length === 0}
                              >
                                <SelectTrigger
                                  aria-label="Select player for FPRDS comparison report"
                                  className="h-9 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                  <SelectValue placeholder="No assessed players" />
                                </SelectTrigger>
                                <SelectContent>
                                  {playerComparisonOptions.length === 0 ? (
                                    <SelectItem value="none">No assessed players</SelectItem>
                                  ) : (
                                    <>
                                      <SelectItem value="none">Select player</SelectItem>
                                      {playerComparisonOptions.map((player) => (
                                        <SelectItem key={player.id} value={player.id}>
                                          {player.name}
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </label>
                          </div>

                          {!playerAssessmentReport || !comparisonPlayer ? (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">
                              Add assessments for another player to generate a side-by-side FPRDS report.
                            </div>
                          ) : (
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{selectedPlayer.name}</p>
                                  <p className="text-lg font-display font-black text-slate-900 leading-none">{playerAssessmentReport.primarySession.ovr}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">OVR Gap</p>
                                  <p className={`text-lg font-display font-black leading-none ${playerAssessmentReport.ovrDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {playerAssessmentReport.ovrDelta >= 0 ? `+${playerAssessmentReport.ovrDelta}` : playerAssessmentReport.ovrDelta}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{comparisonPlayer.name}</p>
                                  <p className="text-lg font-display font-black text-slate-900 leading-none">{playerAssessmentReport.comparisonSession.ovr}</p>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[420px] text-left text-xs">
                                  <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                      <th className="px-2 py-2">Attribute</th>
                                      <th className="px-2 py-2 text-right">{selectedPlayer.name}</th>
                                      <th className="px-2 py-2 text-right">{comparisonPlayer.name}</th>
                                      <th className="px-2 py-2 text-right">Gap</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {playerAssessmentReport.rows.map((row) => (
                                      <tr key={`player-report-${row.attributeId}`}>
                                        <td className="px-2 py-2 font-bold text-slate-700">{ATTRIBUTE_LABELS[row.attributeId]}</td>
                                        <td className="px-2 py-2 text-right font-black text-slate-900">{row.primaryScore}</td>
                                        <td className="px-2 py-2 text-right font-black text-slate-900">{row.comparisonScore}</td>
                                        <td className={`px-2 py-2 text-right font-black ${row.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {row.delta >= 0 ? `+${row.delta}` : row.delta}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Session-to-session report</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">Target session compared against a baseline.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="space-y-1">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Baseline</span>
                                <Select
                                  value={baselineSessionId || 'none'}
                                  onValueChange={(value) => setBaselineSessionId(value === 'none' ? '' : value)}
                                >
                                  <SelectTrigger
                                    aria-label="Select baseline assessment session"
                                    className="h-9 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-indigo-100"
                                  >
                                    <SelectValue placeholder="Select session" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Select session</SelectItem>
                                    {assessmentProgressSeries.map((point) => (
                                      <SelectItem key={`baseline-${point.id}`} value={point.id}>
                                        {point.assessmentDate} - {ROLE_LABELS[point.role]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </label>
                              <label className="space-y-1">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Target</span>
                                <Select
                                  value={targetSessionId || 'none'}
                                  onValueChange={(value) => setTargetSessionId(value === 'none' ? '' : value)}
                                >
                                  <SelectTrigger
                                    aria-label="Select target assessment session"
                                    className="h-9 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-indigo-100"
                                  >
                                    <SelectValue placeholder="Select session" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Select session</SelectItem>
                                    {assessmentProgressSeries.map((point) => (
                                      <SelectItem key={`target-${point.id}`} value={point.id}>
                                        {point.assessmentDate} - {ROLE_LABELS[point.role]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </label>
                            </div>
                          </div>

                          {!sessionAssessmentReport ? (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">
                              Select two different saved sessions to generate a session comparison report.
                            </div>
                          ) : (
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Baseline</p>
                                  <p className="text-lg font-display font-black text-slate-900 leading-none">{sessionAssessmentReport.baselineSession.ovr}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Change</p>
                                  <p className={`text-lg font-display font-black leading-none ${sessionAssessmentReport.ovrDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {sessionAssessmentReport.ovrDelta >= 0 ? `+${sessionAssessmentReport.ovrDelta}` : sessionAssessmentReport.ovrDelta}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target</p>
                                  <p className="text-lg font-display font-black text-slate-900 leading-none">{sessionAssessmentReport.targetSession.ovr}</p>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[420px] text-left text-xs">
                                  <thead>
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                      <th className="px-2 py-2">Attribute</th>
                                      <th className="px-2 py-2 text-right">Baseline</th>
                                      <th className="px-2 py-2 text-right">Target</th>
                                      <th className="px-2 py-2 text-right">Change</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {sessionAssessmentReport.rows.map((row) => (
                                      <tr key={`session-report-${row.attributeId}`}>
                                        <td className="px-2 py-2 font-bold text-slate-700">{ATTRIBUTE_LABELS[row.attributeId]}</td>
                                        <td className="px-2 py-2 text-right font-black text-slate-900">{row.comparisonScore}</td>
                                        <td className="px-2 py-2 text-right font-black text-slate-900">{row.primaryScore}</td>
                                        <td className={`px-2 py-2 text-right font-black ${row.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {row.delta >= 0 ? `+${row.delta}` : row.delta}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPlayer && playerAssessments.map((s) => {
                    const sessionPlayerName = playerNameById.get(s.playerId) ?? 'Unknown player';
                    const noteValue = noteDrafts[s.id] ?? s.coachNotes ?? '';
                    const savedNoteValue = s.coachNotes ?? '';
                    const noteChanged = noteValue.trim() !== savedNoteValue.trim();

                    return (
                    <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-slate-900">
                            {s.assessmentDate} • {ROLE_LABELS[s.role]} • {s.assessmentType}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500 font-semibold">
                            Age group: {s.ageGroup} • OVR tier: {s.labels.ovrTierLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">OVR</p>
                            <p className="text-lg font-display font-black text-slate-900 leading-none">{s.ovr}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const confirmed = window.confirm('Delete this assessment session? This cannot be undone.');
                              if (!confirmed) return;
                              onDeleteAssessment(s.id);
                            }}
                            aria-label="Delete assessment"
                            className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {weightedAttributeIdsForRole(s.role).map((attrId) => {
                          const val = s.attributeScores[attrId];
                          const meta = getAttributeLabel(val);
                          const isWeakest = attrId === s.labels.weakestAttributeId;
                          return (
                            <div
                              key={`${s.id}-${attrId}`}
                              className={`rounded-xl border px-3 py-2 ${
                                isWeakest ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">{String(attrId)}</p>
                                {isWeakest && (
                                  <Badge className="rounded-full border-amber-200 bg-amber-100 px-2 py-0.5 text-[9px] text-amber-700">
                                    Weakest
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 flex items-baseline justify-between gap-2">
                                <span className="text-sm font-display font-black text-slate-900">{val}</span>
                                <span className={`text-[10px] font-black ${meta.color}`}>{meta.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <label htmlFor={`assessment-note-${s.id}`} className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <NotebookPen size={14} className="text-indigo-600" /> Coach notes
                          </label>
                          <Button
                            type="button"
                            variant={noteChanged ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleSaveSessionNote(s.id)}
                            disabled={!noteChanged}
                            aria-label={`Save coach notes for ${sessionPlayerName} assessment on ${s.assessmentDate}`}
                            className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider ${
                              noteChanged
                                ? 'border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'border-slate-200 bg-white text-slate-300'
                            }`}
                          >
                            <Save size={12} /> Save note
                          </Button>
                        </div>
                        <Textarea
                          id={`assessment-note-${s.id}`}
                          value={noteValue}
                          onChange={(event) => setNoteDrafts(current => ({ ...current, [s.id]: event.target.value }))}
                          placeholder="Add coaching observations, context, follow-up reminders, or player feedback from this assessment."
                          aria-label={`Coach notes for ${sessionPlayerName} assessment on ${s.assessmentDate}`}
                          rows={3}
                          className="mt-3 resize-y rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 focus-visible:ring-indigo-100"
                        />
                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                          Notes are stored with this assessment and included in workspace backups.
                        </p>
                      </div>

                      {s.developmentPlan && (
                        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
                          <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                            <Sparkles size={14} /> 4-week development plan
                          </p>
                          <p className="mt-1 text-xs text-slate-600 font-semibold">
                            Focus: <span className="font-black">{String(s.developmentPlan.focusAttributeId)}</span> • Priority score:{' '}
                            <span className="font-black">{s.developmentPlan.priorityScore}</span>
                          </p>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {s.developmentPlan.weeks.map(w => (
                              <div key={`${s.id}-wk-${w.weekNumber}`} className="rounded-2xl border border-white/60 bg-white p-4">
                                <p className="text-xs font-black text-slate-900">Week {w.weekNumber}</p>
                                <p className="text-xs text-slate-600 font-semibold mt-1">{w.focus}</p>
                                {w.drillIds.length > 0 && (
                                  <p className="mt-2 text-[11px] text-slate-500 font-semibold">
                                    Drills: <span className="font-mono">{w.drillIds.join(', ')}</span>
                                  </p>
                                )}
                                <p className="mt-2 text-[11px] text-slate-500 font-medium">{w.notes}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6">
            <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" /> Live Player Card Preview
            </h3>

            {!selectedPlayer && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-semibold">
                Select a player to begin.
              </div>
            )}

            {selectedPlayer && (
              <AssessmentPlayerCardPreview
                player={selectedPlayer}
                role={role}
                assessmentType={assessmentType}
                ageGroupLabel={ageGroup || 'Select age group'}
                scorePreview={step === 5 ? scorePreview : null}
              />
            )}
          </div>

          {selectedPlayer && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Player context
              </h3>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-600 font-semibold">
                  Last saved assessment:{' '}
                  <span className="font-black text-slate-900">
                    {selectedPlayer.fprdsLastAssessmentId ? 'Available' : 'None'}
                  </span>
                </p>
                <p className="mt-2 text-[11px] text-slate-500 font-medium">
                  This app is local-first. All assessments are stored in your browser and included in backups.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
