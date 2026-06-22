import React, { useEffect, useMemo, useState } from 'react';
import type { AgeGroup, AssessmentRawResults, AssessmentSession, FprdsRole, Player } from '../types';
import { isStaffPosition } from '../types';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Save,
  Search,
  Sparkles,
  Trash2,
  User
} from 'lucide-react';
import AssessmentQuickGuide from './AssessmentQuickGuide';
import { generateFourWeekPlan } from '../fprds/development';
import {
  computeAgeGroupFromDob,
  computeScoresForSession,
  getAttributeLabel
} from '../fprds/scoring';
import { ROLE_LABELS, ROLE_WEIGHTS } from '../fprds/weights';
import type { DrillGuideCategory } from '../fprds/drillGuide';
import AssessmentPlayerCardPreview from './AssessmentPlayerCardPreview';

type AssessmentType = 'Full' | 'Quick';

interface AssessmentsViewProps {
  players: Player[];
  assessments: AssessmentSession[];
  preselectedPlayerId: string | null;
  onClearPreselectedPlayer: () => void;
  onAddAssessment: (session: AssessmentSession) => void;
  onDeleteAssessment: (sessionId: string) => void;
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
      <input
        id={props.id}
        type="number"
        inputMode="decimal"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        aria-label={props.label}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-colors ${
          props.error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
            : 'border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
        }`}
      />
      {props.hint && !props.error && <p className="text-[11px] text-slate-400 font-medium">{props.hint}</p>}
      {props.error && (
        <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
          <AlertCircle size={12} /> {props.error}
        </p>
      )}
    </div>
  );
};

export default function AssessmentsView({
  players,
  assessments,
  preselectedPlayerId,
  onClearPreselectedPlayer,
  onAddAssessment,
  onDeleteAssessment
}: AssessmentsViewProps) {
  const eligiblePlayers = useMemo(() => players.filter(p => !isStaffPosition(p.position)), [players]);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
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
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState(false);
  const [quickGuideLaunchContext, setQuickGuideLaunchContext] = useState<{ initialCategory?: DrillGuideCategory; initialDrillId?: string } | null>(null);

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
    setStep(2);
  }, [eligiblePlayers, onClearPreselectedPlayer, preselectedPlayerId]);

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

  const recommendedDrillIds = useMemo(() => {
    const baseIds = [
      'base_sprint_10_30',
      'base_yoyo',
      'base_illinois',
      'base_power',
      'base_first_touch',
      'base_short_passing'
    ];

    const roleIds: string[] = [];

    if (role === 'ST') {
      roleIds.push('fw_finishing_box', assessmentType === 'Quick' ? 'fw_shot_power' : 'fw_shot_power');
      if (assessmentType === 'Full') roleIds.push('fw_offensive_1v1', 'fw_attacking_heading');
    }

    if (role === 'W') {
      roleIds.push('fw_finishing_box', 'fw_offensive_1v1');
      if (assessmentType === 'Full') roleIds.push('fw_shot_power', 'fw_attacking_heading');
    }

    if (role === 'CM') {
      roleIds.push('mid_long_passing', 'mid_vision_rondo');
      if (assessmentType === 'Full') roleIds.push('mid_ball_retention', 'mid_pressing_cage');
    }

    if (role === 'CDM') {
      roleIds.push('mid_long_passing', 'mid_pressing_cage');
      if (assessmentType === 'Full') roleIds.push('mid_vision_rondo', 'mid_ball_retention');
    }

    if (role === 'FB') {
      roleIds.push('def_tackling_1v1', 'def_crossing_target');
      if (assessmentType === 'Full') roleIds.push('def_heading_clearance', 'def_positioning_clearances');
    }

    if (role === 'CB') {
      roleIds.push('def_tackling_1v1', 'def_heading_clearance');
      if (assessmentType === 'Full') roleIds.push('def_positioning_clearances', 'def_crossing_target');
    }

    if (role === 'GK') {
      roleIds.push('gk_reflexes', 'gk_handling');
      if (assessmentType === 'Full') roleIds.push('gk_diving', 'gk_distribution');
    }

    return [...baseIds, ...roleIds];
  }, [assessmentType, role]);

  const getRoleGuideCategory = (r: FprdsRole): DrillGuideCategory => {
    if (r === 'ST' || r === 'W') return 'ForwardsWingers';
    if (r === 'CM' || r === 'CDM') return 'Midfielders';
    if (r === 'FB' || r === 'CB') return 'Defenders';
    return 'Goalkeepers';
  };

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

    const weights = ROLE_WEIGHTS[role];
    const weightedKeys = (Object.keys(weights) as Array<keyof typeof weights>).filter(k => weights[k] > 0);
    const scoredWeightedKeys = weightedKeys.filter(k => typeof res.result.attributeScores[k as any] === 'number');
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

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setSaveError(null);
    setStep(2);
  };

  const handleNextStep = () => {
    setSaveError(null);
    setStep(prev => (prev < 6 ? ((prev + 1) as any) : prev));
  };

  const handlePrevStep = () => {
    setSaveError(null);
    setStep(prev => (prev > 1 ? ((prev - 1) as any) : prev));
  };

  const handleSaveAssessment = () => {
    setSaveError(null);
    if (!selectedPlayer) {
      setSaveError('Select a player to continue.');
      return;
    }
    if (!ageGroup) {
      setSaveError('Select an age group to continue.');
      return;
    }
    if (!scorePreview || !scorePreview.ok) {
      setSaveError('Fix validation errors before saving.');
      return;
    }

    const nowIso = new Date().toISOString();
    const id = `assess_${Date.now()}`;
    const previous = playerAssessments.find(s => s.role === role) ?? null;

    const attributeDeltas: Record<string, number> = {};
    if (previous) {
      (Object.keys(scorePreview.attributeScores) as Array<keyof typeof scorePreview.attributeScores>).forEach((k) => {
        const prevVal = previous.attributeScores[k as any];
        const nowVal = scorePreview.attributeScores[k as any];
        if (typeof prevVal !== 'number' || typeof nowVal !== 'number') return;
        attributeDeltas[k as string] = Math.round(nowVal - prevVal);
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
        attributeDeltas: previous ? (attributeDeltas as any) : undefined
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
    return 'Review & History';
  }, [step]);

  const canGoNext = useMemo(() => {
    if (step === 1) return !!selectedPlayerId;
    if (step === 2) return !!role;
    if (step === 3) return !!assessmentType && !!assessmentDate;
    if (step === 4) return !!ageGroup;
    if (step === 5) return !!scorePreview && scorePreview.ok;
    return false;
  }, [ageGroup, assessmentDate, assessmentType, role, scorePreview, selectedPlayerId, step]);

  return (
    <div className="space-y-6">
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

          <div className="flex items-center gap-2">
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
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={step === 1}
            aria-label="Previous step"
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
              step === 1
                ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ChevronLeft size={14} /> Back
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!canGoNext}
              aria-label="Next step"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
                canGoNext
                  ? 'border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Sparkles size={14} /> New assessment
            </button>
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
                  <input
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search name or number"
                    aria-label="Search players"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPlayers.map(p => {
                  const isActive = selectedPlayerId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlayer(p.id)}
                      aria-label={`Select ${p.name}`}
                      className={`text-left rounded-2xl border p-4 transition-all ${
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
                    </button>
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
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      aria-label={`Select role ${ROLE_LABELS[r]}`}
                      className={`rounded-2xl border p-4 text-left transition-all ${
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
                    </button>
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
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAssessmentType(t)}
                          aria-label={`Select ${t} assessment`}
                          className={`rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
                            active ? 'border-indigo-300 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Full runs base + all role attributes. Quick runs base + top role attributes only.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Assessment date</label>
                  <input
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    aria-label="Assessment date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
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
                    <button
                      key={g}
                      type="button"
                      onClick={() => setAgeGroup(g)}
                      aria-label={`Select age group ${g}`}
                      className={`rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
                        active ? 'border-indigo-300 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Base attributes (all players)</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickGuideLaunchContext({
                        initialCategory: 'Base',
                        initialDrillId: 'base_sprint_10_30'
                      });
                      setIsQuickGuideOpen(true);
                    }}
                    aria-label="Open guide for base drills"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[8px] font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <BookOpen size={10} className="text-indigo-600" />
                    Guide for these drills
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput
                    id="base-sprint10"
                    label="10m split (seconds)"
                    value={base.sprint10mSeconds}
                    step={0.01}
                    error={fieldErrors.sprint10mSeconds}
                    onChange={(v) => setBase(prev => ({ ...prev, sprint10mSeconds: v }))}
                  />
                  <NumberInput
                    id="base-sprint30"
                    label="30m sprint (seconds)"
                    value={base.sprint30mSeconds}
                    step={0.01}
                    error={fieldErrors.sprint30mSeconds}
                    onChange={(v) => setBase(prev => ({ ...prev, sprint30mSeconds: v }))}
                  />
                  <NumberInput
                    id="base-yoyo"
                    label="Yo-Yo distance (meters)"
                    value={base.yoyoMeters}
                    step={1}
                    error={fieldErrors.yoyoMeters}
                    onChange={(v) => setBase(prev => ({ ...prev, yoyoMeters: v }))}
                  />
                  <NumberInput
                    id="base-illinois"
                    label="Illinois agility (seconds)"
                    value={base.illinoisSeconds}
                    step={0.01}
                    error={fieldErrors.illinoisSeconds}
                    onChange={(v) => setBase(prev => ({ ...prev, illinoisSeconds: v }))}
                  />
                  <NumberInput
                    id="base-broad"
                    label="Standing broad jump (cm)"
                    value={base.broadJumpCm}
                    step={1}
                    error={fieldErrors.broadJumpCm}
                    onChange={(v) => setBase(prev => ({ ...prev, broadJumpCm: v }))}
                  />
                  <NumberInput
                    id="base-medball"
                    label="Medicine ball throw (cm)"
                    value={base.medicineBallThrowCm}
                    step={1}
                    error={fieldErrors.medicineBallThrowCm}
                    onChange={(v) => setBase(prev => ({ ...prev, medicineBallThrowCm: v }))}
                  />
                  <NumberInput
                    id="base-fth"
                    label="First touch: successes (out of 10)"
                    value={base.firstTouchSuccessesOutOf10}
                    step={1}
                    min={0}
                    max={10}
                    error={fieldErrors.firstTouchSuccessesOutOf10}
                    onChange={(v) => setBase(prev => ({ ...prev, firstTouchSuccessesOutOf10: v }))}
                  />
                  <NumberInput
                    id="base-spa"
                    label="Short passing: successes (out of 10)"
                    value={base.shortPassingSuccessesOutOf10}
                    step={1}
                    min={0}
                    max={10}
                    error={fieldErrors.shortPassingSuccessesOutOf10}
                    onChange={(v) => setBase(prev => ({ ...prev, shortPassingSuccessesOutOf10: v }))}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Role attributes ({ROLE_LABELS[role]})</p>
                  <button
                    type="button"
                    onClick={() => {
                      const firstRoleDrill = recommendedDrillIds.find(id => !id.startsWith('base_')) ?? 'fw_finishing_box';
                      setQuickGuideLaunchContext({
                        initialCategory: getRoleGuideCategory(role),
                        initialDrillId: firstRoleDrill
                      });
                      setIsQuickGuideOpen(true);
                    }}
                    aria-label="Open guide for role drills"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[8px] font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <BookOpen size={10} className="text-indigo-600" />
                    Guide for these drills
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {requiredRoleFields.map(f => (
                    <NumberInput
                      key={f.key}
                      id={`role-${f.key}`}
                      label={f.label}
                      value={roleSpecific[f.key] ?? ''}
                      hint={f.hint}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      error={fieldErrors[f.key]}
                      onChange={(v) => setRoleSpecific(prev => ({ ...prev, [f.key]: v }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSaveAssessment}
                  aria-label="Save assessment"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
                    scorePreview && scorePreview.ok
                      ? 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                  disabled={!scorePreview || !scorePreview.ok}
                >
                  <Save size={14} /> Save assessment
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-md shadow-slate-100/30 p-5 sm:p-6 space-y-4">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Assessment History
              </h3>

              {!selectedPlayer && <p className="text-sm text-slate-500 font-semibold">Select a player to view assessment history.</p>}

              {selectedPlayer && (
                <div className="space-y-3">
                  {playerAssessments.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-semibold">
                      No assessments saved for this player yet.
                    </div>
                  )}

                  {playerAssessments.map((s) => (
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
                          <button
                            type="button"
                            onClick={() => {
                              const confirmed = window.confirm('Delete this assessment session? This cannot be undone.');
                              if (!confirmed) return;
                              onDeleteAssessment(s.id);
                            }}
                            aria-label="Delete assessment"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(Object.keys(ROLE_WEIGHTS[s.role]) as any[]).filter(k => ROLE_WEIGHTS[s.role][k] > 0).map((attrId) => {
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
                                  <span className="text-[9px] font-black text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                                    Weakest
                                  </span>
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
                  ))}
                </div>
              )}
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
                scorePreview={scorePreview}
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

      <AssessmentQuickGuide
        isOpen={isQuickGuideOpen}
        onClose={() => setIsQuickGuideOpen(false)}
        initialCategory={quickGuideLaunchContext?.initialCategory}
        initialDrillId={quickGuideLaunchContext?.initialDrillId}
        recommendedDrillIds={recommendedDrillIds}
        title="Quick Guide"
      />
    </div>
  );
}
