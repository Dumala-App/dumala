import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AgeGroup, AssessmentRawResults, AssessmentSession, FprdsAttributeId, FprdsRole, Player } from '../types';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileDown,
  FlaskConical,
  Gauge,
  History,
  MessageSquareText,
  NotebookPen,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
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
  clampInt,
  clampScore,
  computeAgeGroupFromDob,
  computeFinishingBoxScore,
  computeScoresForSession,
  getAttributeLabel,
  scoreFromBands,
  scoreFromBenchmarkTable,
  scoreFromCoach1to10,
  scoreFromOutOf10Direct
} from '../fprds/scoring';
import {
  BALL_RETENTION_SECONDS,
  BROAD_JUMP_CM,
  CURRENT_BENCHMARK_VERSION,
  getBenchmarkVersionInfo,
  ILLINOIS_AGILITY,
  MED_BALL_THROW_CM,
  OUT_OF_5_BANDS,
  OUT_OF_10_BANDS,
  SHOT_POWER_DISTANCE_M,
  SPRINT_10M,
  SPRINT_30M,
  YOYO_DISTANCE
} from '../fprds/benchmarks';
import { ROLE_LABELS, ROLE_WEIGHTS } from '../fprds/weights';
import {
  buildAssessmentProgressSeries,
  buildPlayerFeedbackReport,
  calculateProgressDelta,
  filterProgressSeriesByRole,
  getLatestRoleFromProgress,
  getWeightedProgressAttributes,
  selectLatestAssessmentByPlayer,
  type AssessmentProgressPoint
} from '../fprds/progress';
import { buildAssessmentReportModel, renderAssessmentReportHtml } from '../fprds/assessmentReport';
import AssessmentPlayerCardPreview from './AssessmentPlayerCardPreview';
import FprdsBetaSubmissionDialog from './FprdsBetaSubmissionDialog';

type AssessmentType = 'Full' | 'Quick';
type AssessmentStep = 1 | 2 | 3 | 4;

const TOTAL_STEPS = 4;

const ASSESSMENT_STEPS: Array<{ id: AssessmentStep; label: string }> = [
  { id: 1, label: 'Player' },
  { id: 2, label: 'Setup' },
  { id: 3, label: 'Record' },
  { id: 4, label: 'Review' }
];

const nextAssessmentStep = (step: AssessmentStep): AssessmentStep => (step < TOTAL_STEPS ? ((step + 1) as AssessmentStep) : step);
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

const ATTRIBUTE_LINE_COLORS = ['#22d3ee', '#059669', '#f59e0b', '#dc2626'];

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
    <div className="rounded-xl border border-cyan-300/15 bg-[#07111f] px-3 py-2 shadow-2xl shadow-black/40">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{point.assessmentDate}</p>
      <p className="text-xs font-black text-slate-100">
        {ROLE_LABELS[point.role]} • {point.assessmentType} • {point.ageGroup}
      </p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-[11px] font-semibold">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="text-slate-100">{entry.value}</span>
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
  onReportDownloaded?: () => void;
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

type FieldRating = { label: string; className: string };

const rateScore = (score: number): FieldRating => {
  const s = clampScore(score);
  if (s >= 90) return { label: 'Elite', className: 'border-amber-300/25 bg-amber-300/[0.08] text-amber-200' };
  if (s >= 75) return { label: 'Advanced', className: 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200' };
  if (s >= 55) return { label: 'Developing', className: 'border-sky-300/25 bg-sky-300/[0.08] text-sky-200' };
  if (s >= 35) return { label: 'Needs work', className: 'border-orange-300/25 bg-orange-300/[0.08] text-orange-200' };
  return { label: 'Beginner', className: 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200' };
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
  rating?: FieldRating | null;
  onChange: (val: string) => void;
};

const NumberInput: React.FC<NumberInputProps> = (props) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={props.id} className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          {props.label}
        </label>
        {props.rating && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${props.rating.className}`}>
            {props.rating.label}
          </span>
        )}
      </div>
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
        className={`rounded-xl bg-[#07111f]/70 text-sm font-semibold text-slate-100 placeholder:text-slate-500 shadow-sm ${
          props.error
            ? 'border-rose-400/40 focus-visible:ring-rose-400/25'
            : 'border-cyan-300/10 focus-visible:ring-cyan-300/20'
        }`}
      />
      {props.hint && !props.error && <p className="text-[11px] text-slate-500 font-medium">{props.hint}</p>}
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
  onUpdateAssessmentNotes,
  onReportDownloaded
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
  const [teamHistorySearch, setTeamHistorySearch] = useState('');
  const [teamHistoryRoleFilter, setTeamHistoryRoleFilter] = useState<FprdsRole | 'all'>('all');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [betaSubmissionSession, setBetaSubmissionSession] = useState<AssessmentSession | null>(null);
  const [submittedBetaAssessmentIds, setSubmittedBetaAssessmentIds] = useState<Set<string>>(() => new Set());

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
    setStep(assessments.some((session) => session.playerId === preselectedPlayerId) ? 4 : 2);
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

  const teamAssessmentStats = useMemo(() => {
    if (assessedPlayerSummaries.length === 0) {
      return {
        assessedPlayers: 0,
        totalSessions: 0,
        averageLatestOvr: null as number | null,
        latestDate: null as string | null
      };
    }

    const totalLatestOvr = assessedPlayerSummaries.reduce((sum, summary) => sum + summary.latest.ovr, 0);
    const totalSessions = assessedPlayerSummaries.reduce((sum, summary) => sum + summary.sessionCount, 0);

    return {
      assessedPlayers: assessedPlayerSummaries.length,
      totalSessions,
      averageLatestOvr: Math.round(totalLatestOvr / assessedPlayerSummaries.length),
      latestDate: assessedPlayerSummaries[0]?.latest.assessmentDate ?? null
    };
  }, [assessedPlayerSummaries]);

  const filteredAssessedPlayerSummaries = useMemo(() => {
    const query = teamHistorySearch.trim().toLowerCase();

    return assessedPlayerSummaries.filter(({ player, latest }) => {
      const matchesSearch = !query
        || player.name.toLowerCase().includes(query)
        || String(player.number ?? '').includes(query)
        || player.position.toLowerCase().includes(query)
        || ROLE_LABELS[latest.role].toLowerCase().includes(query);
      const matchesRole = teamHistoryRoleFilter === 'all' || latest.role === teamHistoryRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [assessedPlayerSummaries, teamHistoryRoleFilter, teamHistorySearch]);

  const selectedPlayerLatestAssessment = playerAssessments[0] ?? null;
  const selectedPlayerPreviousAssessment = playerAssessments[1] ?? null;
  const playerFeedbackReport = useMemo(
    () => buildPlayerFeedbackReport(selectedPlayerLatestAssessment, selectedPlayerPreviousAssessment),
    [selectedPlayerLatestAssessment, selectedPlayerPreviousAssessment]
  );

  const triggerDownload = (content: string, mimeType: string, fileName: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reportFileStem = (name: string, date: string) => {
    const safeName = name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'player';
    return `${safeName}-fprds-${date}`;
  };

  const handleDownloadReport = () => {
    if (!selectedPlayer) return;
    const model = buildAssessmentReportModel(selectedPlayer, playerAssessments);
    if (!model) return;
    triggerDownload(renderAssessmentReportHtml(model), 'text/html;charset=utf-8', `${reportFileStem(selectedPlayer.name, model.latest.date)}-report.html`);
    onReportDownloaded?.();
  };

  const handleExportReportData = () => {
    if (!selectedPlayer) return;
    const model = buildAssessmentReportModel(selectedPlayer, playerAssessments);
    if (!model) return;
    const payload = { player: selectedPlayer.name, generatedAt: model.generatedAt, sessions: playerAssessments };
    triggerDownload(JSON.stringify(payload, null, 2), 'application/json', `${reportFileStem(selectedPlayer.name, model.latest.date)}-data.json`);
    onReportDownloaded?.();
  };

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

  // Live, per-field benchmark rating shown while the coach records results.
  // Each raw metric is scored with the same primitives the FPRDS engine uses,
  // so the chip a coach sees matches how the value ultimately grades.
  const fieldRatings = useMemo(() => {
    const ratings: Record<string, FieldRating> = {};
    if (!ageGroup) return ratings;

    const b = parsedBase;
    if (Number.isFinite(b.sprint10mSeconds)) ratings.sprint10mSeconds = rateScore(scoreFromBenchmarkTable(b.sprint10mSeconds, SPRINT_10M[ageGroup]));
    if (Number.isFinite(b.sprint30mSeconds)) ratings.sprint30mSeconds = rateScore(scoreFromBenchmarkTable(b.sprint30mSeconds, SPRINT_30M[ageGroup]));
    if (Number.isFinite(b.yoyoMeters)) ratings.yoyoMeters = rateScore(scoreFromBenchmarkTable(b.yoyoMeters, YOYO_DISTANCE[ageGroup]));
    if (Number.isFinite(b.illinoisSeconds)) ratings.illinoisSeconds = rateScore(scoreFromBenchmarkTable(b.illinoisSeconds, ILLINOIS_AGILITY[ageGroup]));
    if (Number.isFinite(b.broadJumpCm)) ratings.broadJumpCm = rateScore(scoreFromBenchmarkTable(b.broadJumpCm, BROAD_JUMP_CM[ageGroup]));
    if (Number.isFinite(b.medicineBallThrowCm)) ratings.medicineBallThrowCm = rateScore(scoreFromBenchmarkTable(b.medicineBallThrowCm, MED_BALL_THROW_CM[ageGroup]));
    if (Number.isFinite(b.firstTouchSuccessesOutOf10)) ratings.firstTouchSuccessesOutOf10 = rateScore(scoreFromOutOf10Direct(b.firstTouchSuccessesOutOf10));
    if (Number.isFinite(b.shortPassingSuccessesOutOf10)) ratings.shortPassingSuccessesOutOf10 = rateScore(scoreFromOutOf10Direct(b.shortPassingSuccessesOutOf10));

    const r = parsedRoleSpecific;
    const has = (key: string) => Number.isFinite(r[key]);
    const single = (key: string, score: number) => {
      if (has(key)) ratings[key] = rateScore(score);
    };

    single('shotPowerMaxControlledDistanceMeters', scoreFromBenchmarkTable(r.shotPowerMaxControlledDistanceMeters, SHOT_POWER_DISTANCE_M[ageGroup]));
    single('offensive1v1TakeonsOutOf10', scoreFromBands(r.offensive1v1TakeonsOutOf10, OUT_OF_10_BANDS));
    single('attackingHeadingOnTargetOutOf10', scoreFromOutOf10Direct(r.attackingHeadingOnTargetOutOf10));
    single('visionCoachScore1to10', scoreFromCoach1to10(r.visionCoachScore1to10));
    single('ballRetentionBestSeconds', scoreFromBenchmarkTable(r.ballRetentionBestSeconds, BALL_RETENTION_SECONDS));
    single('pressingWinsOutOf5', scoreFromBands(r.pressingWinsOutOf5, OUT_OF_5_BANDS));
    single('tacklingWinsOutOf10', scoreFromBands(r.tacklingWinsOutOf10, OUT_OF_10_BANDS));
    single('defensiveHeadingClearancesOutOf10', scoreFromOutOf10Direct(r.defensiveHeadingClearancesOutOf10));
    single('crossingSuccessesOutOf10', scoreFromOutOf10Direct(r.crossingSuccessesOutOf10));
    single('gkReflexesSavesOutOf10', scoreFromOutOf10Direct(r.gkReflexesSavesOutOf10));
    single('gkHandlingCleanCatchesOutOf10', scoreFromOutOf10Direct(r.gkHandlingCleanCatchesOutOf10));
    single('gkDivingSavesOutOf10', scoreFromOutOf10Direct(r.gkDivingSavesOutOf10));
    single('gkDistributionSuccessesOutOf10', scoreFromOutOf10Direct(r.gkDistributionSuccessesOutOf10));

    // Combined metrics rate once both contributing inputs are present.
    if (has('finishingGoalsOutOf6') && has('finishingOnTargetOutOf6')) {
      const rating = rateScore(computeFinishingBoxScore(r.finishingGoalsOutOf6, r.finishingOnTargetOutOf6));
      ratings.finishingGoalsOutOf6 = rating;
      ratings.finishingOnTargetOutOf6 = rating;
    }
    if (has('longPassing30mSuccessesOutOf5') && has('longPassing40mSuccessesOutOf5')) {
      const weighted = clampInt(r.longPassing30mSuccessesOutOf5, 0, 5) + clampInt(r.longPassing40mSuccessesOutOf5, 0, 5) * 1.5;
      const rating = rateScore(scoreFromBands((weighted / 12.5) * 10, OUT_OF_10_BANDS));
      ratings.longPassing30mSuccessesOutOf5 = rating;
      ratings.longPassing40mSuccessesOutOf5 = rating;
    }
    if (has('positioningCoachScore1to10') && has('positioningClearancesToSafeZoneOutOf10')) {
      const coachPart = clampInt(r.positioningCoachScore1to10, 1, 10) * 10 * 0.6;
      const clearPart = (clampInt(r.positioningClearancesToSafeZoneOutOf10, 0, 10) / 10) * 100 * 0.4;
      const rating = rateScore(coachPart + clearPart);
      ratings.positioningCoachScore1to10 = rating;
      ratings.positioningClearancesToSafeZoneOutOf10 = rating;
    }

    return ratings;
  }, [ageGroup, parsedBase, parsedRoleSpecific]);

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
    setStep(4);
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
      developmentPlan: assessmentType === 'Full' ? generateFourWeekPlan(role, scorePreview.attributeScores) : undefined,
      benchmarkVersion: CURRENT_BENCHMARK_VERSION
    };

    onAddAssessment(session);

    setStep(4);
  };

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return eligiblePlayers;
    return eligiblePlayers.filter(p => p.name.toLowerCase().includes(q) || String(p.number).includes(q));
  }, [eligiblePlayers, playerSearch]);

  const canGoNext = useMemo(() => {
    if (step === 1) return !!selectedPlayerId;
    if (step === 2) return !!role && !!assessmentType && !!assessmentDate && !!ageGroup;
    if (step === 3) return !!scorePreview && scorePreview.ok;
    return false;
  }, [ageGroup, assessmentDate, assessmentType, role, scorePreview, selectedPlayerId, step]);

  // The sidebar (player card preview + follow-up) helps while scanning and
  // reviewing, but is hidden on the Record step so results entry runs full-width.
  const showSidebar = step !== 3;

  const goToStep = (target: AssessmentStep) => {
    if (target === step) return;
    // Allow jumping back freely; only advance one step and only when allowed.
    if (target < step || (target === nextAssessmentStep(step) && canGoNext)) {
      setSaveError(null);
      setAssessmentSubmitErrors({});
      setStep(target);
    }
  };

  return (
    <div id="assessments-view-container" ref={assessmentContainerRef} className="space-y-6">
      <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-300/10 border border-cyan-300/20 flex items-center justify-center shrink-0">
              <ClipboardList className="text-cyan-100" size={20} />
            </div>
            <div>
              <h2 className="font-display font-black tracking-tight text-slate-100 text-lg">Assessment Center</h2>
              <p className="text-xs text-slate-400 font-medium">
                Run objective drill-based assessments through the FPRDS rating system, with role-weighted scores, progress deltas, coach feedback, and development plans.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenTeamHistory}
            aria-label="Open team assessment history"
            className="h-8 shrink-0 rounded-lg border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-100 hover:bg-cyan-300/15 hover:text-cyan-50"
          >
            <History size={12} /> Team history
          </Button>
        </div>

        <nav aria-label="Assessment progress" className="mt-4">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            {ASSESSMENT_STEPS.map((s, idx) => {
              const isComplete = step > s.id;
              const isCurrent = step === s.id;
              const clickable = s.id < step || (s.id === nextAssessmentStep(step) && canGoNext);
              return (
                <React.Fragment key={s.id}>
                  <li>
                    <button
                      type="button"
                      onClick={() => goToStep(s.id)}
                      disabled={!clickable && !isCurrent}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Step ${s.id}: ${s.label}`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition ${
                        clickable && !isCurrent ? 'hover:bg-white/[0.06]' : 'cursor-default'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                          isCurrent
                            ? 'border border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
                            : isComplete
                              ? 'border border-emerald-300/30 bg-emerald-300/15 text-emerald-200'
                              : 'border border-cyan-300/10 text-slate-500'
                        }`}
                      >
                        {isComplete ? <Check size={12} strokeWidth={3} /> : s.id}
                      </span>
                      <span className={`font-bold ${isCurrent ? 'text-slate-100' : 'text-slate-500'}`}>
                        {s.label}
                      </span>
                    </button>
                  </li>
                  {idx < ASSESSMENT_STEPS.length - 1 && (
                    <li aria-hidden="true" className="h-px w-3 shrink-0 bg-cyan-300/10" />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </nav>

        {saveError && (
          <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/[0.08] px-4 py-3 text-sm font-semibold text-rose-200 flex items-center gap-2">
            <AlertCircle size={16} /> {saveError}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {step === 2 || step === 3 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              aria-label="Previous step"
              className="rounded-xl border-cyan-300/10 bg-white/[0.03] px-4 py-2 text-xs font-black text-slate-300 hover:bg-white/[0.03]"
            >
              <ChevronLeft size={14} /> Back
            </Button>
          ) : (
            <div aria-hidden="true" />
          )}

          {step === 1 || step === 2 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!canGoNext}
              aria-label="Next step"
              className={`rounded-xl border px-4 py-2 text-xs font-black ${
                canGoNext
                  ? 'border-cyan-300/20 bg-cyan-300/15 text-white hover:bg-cyan-300/25'
                  : 'border-cyan-300/10 bg-white/[0.03] text-slate-300'
              }`}
            >
              Next <ChevronRight size={14} />
            </Button>
          ) : step === 4 ? (
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
              className="rounded-xl border-cyan-300/10 bg-white/[0.03] px-4 py-2 text-xs font-black text-slate-300 hover:bg-white/[0.03]"
            >
              <Sparkles size={14} /> New assessment
            </Button>
          ) : (
            <div aria-hidden="true" />
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showSidebar ? 'xl:grid-cols-[1.1fr_0.9fr]' : ''}`}>
        <div className="space-y-6">
          {step === 1 && (
            <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-black text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
                  <User size={16} className="text-cyan-300" /> Select Player
                </h3>
                <div className="relative w-full max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search name or number"
                    aria-label="Search players"
                    className="rounded-xl border-cyan-300/10 bg-white/[0.03] pl-9 pr-3 text-sm font-semibold text-slate-100 focus-visible:ring-cyan-300/20"
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
                          ? 'border-cyan-300/30 bg-cyan-300/10 shadow-md'
                          : 'border-cyan-300/10 bg-white/[0.03] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-cyan-300/10"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-100 text-sm truncate">{p.name}</span>
                            <span className="text-[10px] font-black text-slate-300 bg-white/[0.06] border border-cyan-300/10 rounded-lg px-2 py-0.5">
                              #{p.number || '—'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold truncate">{p.position}</p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="mt-3 text-xs font-black text-cyan-100 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Selected
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>

              {filteredPlayers.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm font-semibold">
                  No players match your search.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl p-5 sm:p-6 space-y-6">
              <div>
                <h3 className="font-display font-black text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-cyan-300" /> Setup
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Role and age group are pre-filled from the player profile — adjust only if needed, then move on to record results.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Assessment role</p>
                  {selectedPlayer && getDefaultRoleForPlayer(selectedPlayer) === role && (
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-200">
                      Auto from profile
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK'] as FprdsRole[]).map(r => {
                    const active = role === r;
                    return (
                      <Button
                        key={r}
                        type="button"
                        variant="outline"
                        onClick={() => setRole(r)}
                        aria-label={`Select role ${ROLE_LABELS[r]}`}
                        className={`h-auto justify-start whitespace-normal rounded-xl px-3 py-2.5 text-left ${
                          active ? 'border-cyan-300/30 bg-cyan-300/10 shadow-sm' : 'border-cyan-300/10 bg-white/[0.03] hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-sm font-black text-slate-100">{ROLE_LABELS[r]}</span>
                          {active
                            ? <CheckCircle2 size={16} className="shrink-0 text-cyan-100" />
                            : <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-500">{r}</span>}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Assessment type</label>
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
                            active ? 'border-cyan-300/30 bg-cyan-300/15 text-white' : 'border-cyan-300/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.03]'
                          }`}
                        >
                          {t}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Full runs base + all role attributes. Quick runs base + top role attributes only.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <Calendar size={12} className="text-cyan-300" /> Assessment date
                  </label>
                  <Input
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    aria-label="Assessment date"
                    className="rounded-xl border-cyan-300/10 bg-[#07111f]/70 text-sm font-semibold text-slate-100 focus-visible:ring-cyan-300/20 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Age group</p>
                  {selectedPlayer?.dateOfBirth && assessmentDate && ageGroup !== ''
                    && computeAgeGroupFromDob(selectedPlayer.dateOfBirth, assessmentDate) === ageGroup && (
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-200">
                      Auto from date of birth
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Benchmarks are age-grouped. Set this manually if the player has no saved date of birth.
                </p>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          active ? 'border-cyan-300/30 bg-cyan-300/15 text-white' : 'border-cyan-300/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.03]'
                        }`}
                      >
                        {g}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-black text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Gauge size={16} className="text-cyan-300" /> Enter Results
                </h3>
                <span className="hidden text-[11px] font-semibold text-slate-500 sm:inline">
                  Ratings update live against age-group benchmarks
                </span>
              </div>

              {selectedPlayer && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/10 bg-[#0b1726]/70 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={selectedPlayer.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-xl border border-cyan-300/10 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-100">{selectedPlayer.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                        #{selectedPlayer.number || '—'} · {ROLE_LABELS[role]} · {ageGroup || 'No age group'} · {assessmentType}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-cyan-300/15 bg-white/[0.03] px-3 py-1.5 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Projected OVR</p>
                    <p className="text-lg font-display font-black leading-none text-cyan-100">
                      {scorePreview && scorePreview.ok ? scorePreview.ovr : '—'}
                    </p>
                  </div>
                </div>
              )}

              <FormErrorSummary
                id="assessment-error-summary"
                errors={showAssessmentSubmitErrors ? assessmentSubmitErrors : {}}
              />

              <div className="rounded-2xl border border-cyan-300/10 bg-[#0b1726]/60 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Base attributes (all players)</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <NumberInput
                    id="base-sprint10"
                    fieldName="sprint10mSeconds"
                    label="10m split (seconds)"
                    value={base.sprint10mSeconds}
                    step={0.01}
                    error={assessmentSubmitErrors.sprint10mSeconds}
                    rating={fieldRatings.sprint10mSeconds}
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
                    rating={fieldRatings.sprint30mSeconds}
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
                    rating={fieldRatings.yoyoMeters}
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
                    rating={fieldRatings.illinoisSeconds}
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
                    rating={fieldRatings.broadJumpCm}
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
                    rating={fieldRatings.medicineBallThrowCm}
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
                    rating={fieldRatings.firstTouchSuccessesOutOf10}
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
                    rating={fieldRatings.shortPassingSuccessesOutOf10}
                    onChange={(v) => {
                      setAssessmentSubmitErrors(previous => ({ ...previous, shortPassingSuccessesOutOf10: undefined }));
                      setBase(prev => ({ ...prev, shortPassingSuccessesOutOf10: v }));
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Role attributes ({ROLE_LABELS[role]})</p>
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
                      rating={fieldRatings[f.key] ?? null}
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
                      ? 'border-emerald-300/25 bg-emerald-500/80 text-white hover:bg-emerald-500'
                      : 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200 hover:bg-rose-400/12'
                  }`}
                >
                  <Save size={14} /> Save assessment
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-display font-black text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="text-cyan-300" /> {selectedPlayer ? 'Assessment History' : 'Team Assessment History'}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {selectedPlayer
                      ? `Review saved sessions, reports, and notes for ${selectedPlayer.name}.`
                      : 'Choose an assessed player to view organized history, reports, and notes.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                  {!selectedPlayer && assessedPlayerSummaries.length === 0 && (
                    <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-5 text-sm text-slate-400 font-semibold">
                      No team assessments saved yet. Start a new assessment from the player roster to build history.
                    </div>
                  )}

                  {!selectedPlayer && assessedPlayerSummaries.length > 0 && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-cyan-300/10 bg-[#0b1726]/70 p-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Assessment center</p>
                            <h4 className="mt-1 text-base font-display font-black text-slate-100">Team assessment overview</h4>
                            <p className="mt-1 max-w-2xl text-xs font-semibold text-slate-400">
                              Scan latest FPRDS results, filter by role, then open a player for reports, notes, and session history.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
                            <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Players</p>
                              <p className="mt-1 text-xl font-display font-black leading-none text-slate-100">{teamAssessmentStats.assessedPlayers}</p>
                            </div>
                            <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sessions</p>
                              <p className="mt-1 text-xl font-display font-black leading-none text-slate-100">{teamAssessmentStats.totalSessions}</p>
                            </div>
                            <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg OVR</p>
                              <p className="mt-1 text-xl font-display font-black leading-none text-slate-100">{teamAssessmentStats.averageLatestOvr ?? '-'}</p>
                            </div>
                            <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Latest</p>
                              <p className="mt-1 text-sm font-black leading-tight text-slate-100">{teamAssessmentStats.latestDate ?? '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4 md:flex-row md:items-end md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <Input
                            value={teamHistorySearch}
                            onChange={(e) => setTeamHistorySearch(e.target.value)}
                            placeholder="Search player, number, position, or role"
                            aria-label="Search assessed players"
                            className="rounded-xl border-cyan-300/10 bg-white/[0.03] pl-9 pr-3 text-sm font-semibold text-slate-100 focus-visible:ring-cyan-300/20"
                          />
                        </div>
                        <label className="w-full space-y-1 md:max-w-[220px]">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Latest role</span>
                          <Select
                            value={teamHistoryRoleFilter}
                            onValueChange={(value) => setTeamHistoryRoleFilter(value as FprdsRole | 'all')}
                          >
                            <SelectTrigger
                              aria-label="Filter assessment history by latest role"
                              className="h-10 rounded-xl border-cyan-300/10 bg-[#07111f]/70 text-xs font-bold text-slate-200 focus:ring-cyan-300/20"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-cyan-300/15 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/35">
                              <SelectItem value="all" className="text-slate-200 focus:bg-cyan-300/12 focus:text-cyan-50 data-[state=checked]:bg-cyan-300/10 data-[state=checked]:text-cyan-50">All roles</SelectItem>
                              {(['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK'] as FprdsRole[]).map((roleOption) => (
                                <SelectItem key={roleOption} value={roleOption} className="text-slate-200 focus:bg-cyan-300/12 focus:text-cyan-50 data-[state=checked]:bg-cyan-300/10 data-[state=checked]:text-cyan-50">{ROLE_LABELS[roleOption]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                      </div>

                      {filteredAssessedPlayerSummaries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-cyan-300/10 bg-white/[0.03] p-5 text-sm font-semibold text-slate-400">
                          No assessed players match the current search or role filter.
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-white/[0.03]">
                          <div className="hidden grid-cols-[minmax(220px,1.6fr)_120px_120px_130px_110px] gap-3 border-b border-cyan-300/10 bg-white/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 md:grid">
                            <span>Player</span>
                            <span>Latest OVR</span>
                            <span>Role</span>
                            <span>Last assessed</span>
                            <span className="text-right">Sessions</span>
                          </div>

                          <div className="divide-y divide-cyan-300/10">
                            {filteredAssessedPlayerSummaries.map(({ player, latest, sessionCount }) => (
                              <button
                                key={player.id}
                                type="button"
                                onClick={() => setSelectedPlayerId(player.id)}
                                aria-label={`Open assessment history for ${player.name}`}
                                className="grid w-full grid-cols-1 gap-3 px-4 py-4 text-left transition hover:bg-cyan-300/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/25 md:grid-cols-[minmax(220px,1.6fr)_120px_120px_130px_110px] md:items-center"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <img
                                    src={player.photoUrl}
                                    alt=""
                                    className="h-11 w-11 shrink-0 rounded-xl border border-cyan-300/10 object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-100">{player.name}</p>
                                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                                      #{player.number || '-'} - {player.position}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 md:block">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 md:hidden">Latest OVR</span>
                                  <span className="inline-flex min-w-14 justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-lg font-display font-black leading-none text-cyan-100">
                                    {latest.ovr}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 md:block">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 md:hidden">Role</span>
                                  <span className="text-xs font-black text-slate-100">{ROLE_LABELS[latest.role]}</span>
                                </div>

                                <div className="flex items-center justify-between gap-3 md:block">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 md:hidden">Last assessed</span>
                                  <span className="text-xs font-black text-slate-100">{latest.assessmentDate}</span>
                                </div>

                                <div className="flex items-center justify-between gap-3 md:justify-end">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 md:hidden">Sessions</span>
                                  <span className="rounded-full border border-cyan-300/10 bg-white/[0.03] px-3 py-1 text-xs font-black text-slate-300">
                                    {sessionCount}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPlayer && playerAssessments.length === 0 && (
                    <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4 text-sm text-slate-400 font-semibold">
                      No assessments saved for this player yet.
                    </div>
                  )}

                  {selectedPlayer && assessmentProgressSeries.length > 0 && (
                    <div className="order-3 rounded-2xl border border-cyan-300/10 bg-[#0b1726]/70 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Historical progress</p>
                          <h4 className="mt-1 text-sm font-black text-slate-100">Saved assessment trend</h4>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Built from actual saved assessment sessions for {selectedPlayer.name}.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sessions</p>
                            <p className="text-lg font-display font-black text-slate-100 leading-none">{assessmentProgressSeries.length}</p>
                          </div>
                          <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Latest OVR</p>
                            <p className="text-lg font-display font-black text-slate-100 leading-none">
                              {assessmentProgressSeries[assessmentProgressSeries.length - 1].ovr}
                            </p>
                          </div>
                          <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Change</p>
                            <p className={`text-lg font-display font-black leading-none ${
                              progressDelta === null
                                ? 'text-slate-500'
                                : progressDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                            }`}>
                              {progressDelta === null ? '-' : progressDelta >= 0 ? `+${progressDelta}` : progressDelta}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">OVR timeline</p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-100 bg-cyan-300/10 border border-cyan-300/15 rounded-full px-2 py-1">
                              All roles
                            </span>
                          </div>
                          <div className="mt-3 h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={assessmentProgressSeries} margin={{ top: 10, right: 12, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e2b3d" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[10, 99]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<AssessmentProgressTooltip />} />
                                <Line
                                  name="OVR"
                                  type="monotone"
                                  dataKey="ovr"
                                  stroke="#22d3ee"
                                  strokeWidth={3}
                                  dot={{ r: 4, strokeWidth: 2, fill: '#0b1726', stroke: '#22d3ee' }}
                                  activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role attribute trend</p>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200 bg-emerald-300/[0.08] border border-emerald-300/20 rounded-full px-2 py-1">
                              {latestProgressRole ? ROLE_LABELS[latestProgressRole] : 'No role'}
                            </span>
                          </div>
                          {roleAttributeTrendData.length < 2 ? (
                            <div className="mt-3 flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-cyan-300/10 bg-white/[0.03] p-4 text-center">
                              <p className="max-w-xs text-xs font-semibold text-slate-400">
                                Save at least two assessments with the same latest role to compare role-weighted attributes over time.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 h-[220px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={roleAttributeTrendData} margin={{ top: 10, right: 12, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2b3d" vertical={false} />
                                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                  <YAxis domain={[10, 99]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                  <Tooltip content={<AssessmentProgressTooltip />} />
                                  {weightedProgressAttributes.map((attributeId, index) => (
                                    <Line
                                      key={attributeId}
                                      name={ATTRIBUTE_LABELS[attributeId]}
                                      type="monotone"
                                      dataKey={attributeId}
                                      stroke={ATTRIBUTE_LINE_COLORS[index % ATTRIBUTE_LINE_COLORS.length]}
                                      strokeWidth={2.5}
                                      dot={{ r: 3, strokeWidth: 1.5, fill: '#0b1726', stroke: ATTRIBUTE_LINE_COLORS[index % ATTRIBUTE_LINE_COLORS.length] }}
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

                  {selectedPlayer && playerFeedbackReport && (
                    <div className="order-4 rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                            <MessageSquareText size={14} className="text-cyan-300" /> Coach feedback report
                          </p>
                          <h4 className="mt-1 text-sm font-black text-slate-100">What to tell {selectedPlayer.name}</h4>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            A player-facing summary built from the latest assessment, trend, role priorities, and development plan.
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <FlaskConical size={12} className="text-cyan-300" /> Benchmark: {getBenchmarkVersionInfo(playerFeedbackReport.latestSession.benchmarkVersion).label}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleDownloadReport}
                            className="h-8 gap-1.5 rounded-lg bg-cyan-500/90 px-3 text-[11px] font-bold text-slate-950 hover:bg-cyan-400"
                          >
                            <FileDown size={14} /> Download report
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExportReportData}
                            className="h-8 gap-1.5 rounded-lg border-white/10 bg-white/[0.055] px-3 text-[11px] text-slate-200 hover:bg-white/10 hover:text-white"
                          >
                            <FileDown size={14} /> Data (JSON)
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Trend</p>
                          <p className={`mt-1 text-sm font-black leading-tight ${
                            playerFeedbackReport.trendTone === 'positive'
                              ? 'text-emerald-300'
                              : playerFeedbackReport.trendTone === 'negative' ? 'text-rose-300' : 'text-slate-100'
                          }`}>
                            {playerFeedbackReport.trendLabel}
                          </p>
                        </div>
                        <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Role</p>
                          <p className="mt-1 text-sm font-black leading-tight text-slate-100">{ROLE_LABELS[playerFeedbackReport.role]}</p>
                        </div>
                        <div className="rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Latest date</p>
                          <p className="mt-1 text-sm font-black leading-tight text-slate-100">{playerFeedbackReport.latestSession.assessmentDate}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
                          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cyan-100">
                            <MessageSquareText size={14} /> What to tell the player
                          </p>
                          <h5 className="mt-2 text-sm font-bold text-slate-100">{playerFeedbackReport.feedback.headline}</h5>
                          <div className="mt-3 space-y-3 rounded-xl border border-cyan-300/15 bg-white/[0.03]/75 p-4">
                            {[
                              playerFeedbackReport.feedback.opening,
                              playerFeedbackReport.feedback.praise,
                              playerFeedbackReport.feedback.correction,
                              playerFeedbackReport.feedback.focus
                            ].map((line) => (
                              <p key={line} className="text-sm font-normal leading-6 text-slate-300">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Keep building</p>
                          <div className="mt-3 space-y-2">
                            {playerFeedbackReport.strengths.map((item) => (
                              <div key={`feedback-strength-${item.attributeId}`} className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/10 bg-white/[0.03] px-3 py-2">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-black text-slate-100">{item.displayName}</p>
                                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{item.coachPhrase}</p>
                                  <p className={`mt-0.5 text-[10px] font-black ${item.color}`}>{item.label}</p>
                                </div>
                                <span className="shrink-0 text-base font-display font-black text-slate-100">{item.score}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <Target size={14} className="text-amber-300" /> Priority focus
                          </p>
                          <div className="mt-3 space-y-2">
                            {playerFeedbackReport.priorities.map((item) => (
                              <div key={`feedback-priority-${item.attributeId}`} className="rounded-xl border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-black text-slate-100">{item.displayName}</p>
                                    <p className="mt-0.5 text-[11px] font-semibold text-amber-100">{item.coachPhrase}</p>
                                    <p className={`mt-0.5 text-[10px] font-black ${item.color}`}>{item.label}</p>
                                  </div>
                                  <span className="shrink-0 text-base font-display font-black text-slate-100">{item.score}</span>
                                </div>
                                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-100">
                                  {item.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-[#0b1726]/70 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next conversation prompts</p>
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                          {playerFeedbackReport.conversationPrompts.map((prompt, index) => (
                            <div key={`feedback-prompt-${prompt}`} className="rounded-xl border border-cyan-300/10 bg-white/[0.03] p-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Prompt {index + 1}</p>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">{prompt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPlayer && playerAssessments.map((s) => {
                    return (
                    <div key={s.id} className="order-2 rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-slate-100">
                            {s.assessmentDate} • {ROLE_LABELS[s.role]} • {s.assessmentType}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400 font-semibold">
                            Age group: {s.ageGroup} • OVR tier: {s.labels.ovrTierLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setBetaSubmissionSession(s)}
                            aria-label={`Share assessment from ${s.assessmentDate} with the FPRDS beta`}
                            className={submittedBetaAssessmentIds.has(s.id)
                              ? 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200 hover:bg-emerald-300/15'
                              : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15'}
                          >
                            {submittedBetaAssessmentIds.has(s.id) ? <CheckCircle2 size={14} /> : <FlaskConical size={14} />}
                            <span className="hidden sm:inline">{submittedBetaAssessmentIds.has(s.id) ? 'Shared' : 'Beta'}</span>
                          </Button>
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
                            className="rounded-xl border-rose-400/25 bg-rose-400/[0.08] text-rose-200 hover:bg-rose-400/12 hover:text-rose-100"
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
                                isWeakest ? 'border-amber-300/25 bg-amber-300/[0.08]' : 'border-cyan-300/10 bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{String(attrId)}</p>
                                {isWeakest && (
                                  <Badge className="rounded-full border-amber-300/25 bg-amber-300/15 px-2 py-0.5 text-[9px] text-amber-200">
                                    Weakest
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 flex items-baseline justify-between gap-2">
                                <span className="text-sm font-display font-black text-slate-100">{val}</span>
                                <span className={`text-[10px] font-black ${meta.color}`}>{meta.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {false && s.developmentPlan && (
                        <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                          <p className="text-[11px] font-black uppercase tracking-wider text-cyan-100 flex items-center gap-2">
                            <Sparkles size={14} /> 4-week development plan
                          </p>
                          <p className="mt-1 text-xs text-slate-300 font-semibold">
                            Focus: <span className="font-black">{String(s.developmentPlan.focusAttributeId)}</span> • Priority score:{' '}
                            <span className="font-black">{s.developmentPlan.priorityScore}</span>
                          </p>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {s.developmentPlan.weeks.map(w => (
                              <div key={`${s.id}-wk-${w.weekNumber}`} className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                                <p className="text-xs font-black text-slate-100">Week {w.weekNumber}</p>
                                <p className="text-xs text-slate-300 font-semibold mt-1">{w.focus}</p>
                                {w.drillIds.length > 0 && (
                                  <p className="mt-2 text-[11px] text-slate-400 font-semibold">
                                    Drills: <span className="font-mono">{w.drillIds.join(', ')}</span>
                                  </p>
                                )}
                                <p className="mt-2 text-[11px] text-slate-400 font-medium">{w.notes}</p>
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

        {showSidebar && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl p-5 sm:p-6">
            <h3 className="font-display font-black text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-300" /> Live Player Card Preview
            </h3>

            {!selectedPlayer && (
              <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4 text-sm text-slate-400 font-semibold">
                Select a player to begin.
              </div>
            )}

            {selectedPlayer && (
              <AssessmentPlayerCardPreview
                player={selectedPlayer}
                role={role}
                assessmentType={assessmentType}
                ageGroupLabel={ageGroup || 'Select age group'}
                scorePreview={null}
              />
            )}
          </div>

          {selectedPlayer && (
            <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl p-5 sm:p-6">
              <h3 className="font-display font-black text-slate-100 text-sm uppercase tracking-wide flex items-center gap-2">
                <NotebookPen size={16} className="text-cyan-300" /> Assessment follow-up
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Latest-session notes and development work for {selectedPlayer.name}.
              </p>

              {!selectedPlayerLatestAssessment ? (
                <div className="mt-4 rounded-2xl border border-dashed border-cyan-300/10 bg-white/[0.03] p-4 text-sm font-semibold text-slate-400">
                  Save an assessment to unlock coach notes and a development plan here.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {(() => {
                    const latestSession = selectedPlayerLatestAssessment;
                    const noteValue = noteDrafts[latestSession.id] ?? latestSession.coachNotes ?? '';
                    const savedNoteValue = latestSession.coachNotes ?? '';
                    const noteChanged = noteValue.trim() !== savedNoteValue.trim();
                    const sessionPlayerName = playerNameById.get(latestSession.playerId) ?? selectedPlayer.name;

                    return (
                      <>
                        <div className="rounded-2xl border border-cyan-300/10 bg-[#0b1726]/70 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                <NotebookPen size={14} className="text-cyan-300" /> Coach notes
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {latestSession.assessmentDate} - {ROLE_LABELS[latestSession.role]} - {latestSession.assessmentType}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant={noteChanged ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleSaveSessionNote(latestSession.id)}
                              disabled={!noteChanged}
                              aria-label={`Save coach notes for ${sessionPlayerName} assessment on ${latestSession.assessmentDate}`}
                              className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider ${
                                noteChanged
                                  ? 'border-cyan-300/20 bg-cyan-300/15 text-white hover:bg-cyan-300/25'
                                  : 'border-cyan-300/10 bg-white/[0.03] text-slate-300'
                              }`}
                            >
                              <Save size={12} /> Save note
                            </Button>
                          </div>
                          <Textarea
                            id={`latest-assessment-note-${latestSession.id}`}
                            value={noteValue}
                            onChange={(event) => setNoteDrafts(current => ({ ...current, [latestSession.id]: event.target.value }))}
                            placeholder="Add the message you want to remember before the next training block or player check-in."
                            aria-label={`Coach notes for ${sessionPlayerName} latest assessment on ${latestSession.assessmentDate}`}
                            rows={4}
                            className="mt-3 resize-y rounded-xl border-cyan-300/10 bg-white/[0.03] text-sm font-medium text-slate-300 focus-visible:ring-cyan-300/20"
                          />
                        </div>

                        {latestSession.developmentPlan ? (
                          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-cyan-100">
                              <Sparkles size={14} /> 4-week development plan
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-300">
                              Focus: <span className="font-black">{String(latestSession.developmentPlan.focusAttributeId)}</span> - Priority score:{' '}
                              <span className="font-black">{latestSession.developmentPlan.priorityScore}</span>
                            </p>
                            <div className="mt-3 space-y-3">
                              {latestSession.developmentPlan.weeks.map(w => (
                                <div key={`latest-${latestSession.id}-wk-${w.weekNumber}`} className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-4">
                                  <p className="text-xs font-black text-slate-100">Week {w.weekNumber}</p>
                                  <p className="mt-1 text-xs font-semibold text-slate-300">{w.focus}</p>
                                  {w.drillIds.length > 0 && (
                                    <p className="mt-2 text-[11px] font-semibold text-slate-400">
                                      Drills: <span className="font-mono">{w.drillIds.join(', ')}</span>
                                    </p>
                                  )}
                                  <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-400">{w.notes}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.05] p-4">
                            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-cyan-100">
                              <Sparkles size={14} /> 4-week development plan
                            </p>
                            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-300">
                              This latest assessment does not include a generated plan. Run a Full assessment to create weekly focus work here.
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {selectedPlayer && betaSubmissionSession && (
        <FprdsBetaSubmissionDialog
          open
          player={selectedPlayer}
          session={betaSubmissionSession}
          onOpenChange={open => {
            if (!open) setBetaSubmissionSession(null);
          }}
          onSubmitted={assessmentId => setSubmittedBetaAssessmentIds(current => {
            if (current.has(assessmentId)) return current;
            const next = new Set(current);
            next.add(assessmentId);
            return next;
          })}
        />
      )}

    </div>
  );
}
