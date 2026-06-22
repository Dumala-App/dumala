import type { AssessmentSession, Player } from '../types';
import { applyAssessmentSnapshotToPlayer } from './scoring';

export interface AssessmentState {
  players: Player[];
  assessments: AssessmentSession[];
}

export interface AssessmentTransition extends AssessmentState {
  affectedPlayerId: string;
}

const timestampValue = (value: string) => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};

export const compareAssessmentRecency = (a: AssessmentSession, b: AssessmentSession) => {
  const assessmentDateDelta = timestampValue(a.assessmentDate) - timestampValue(b.assessmentDate);
  if (assessmentDateDelta !== 0) return assessmentDateDelta;

  const createdAtDelta = timestampValue(a.createdAt) - timestampValue(b.createdAt);
  if (createdAtDelta !== 0) return createdAtDelta;

  return a.id.localeCompare(b.id);
};

export const selectLatestAssessmentForPlayer = (
  assessments: AssessmentSession[],
  playerId: string
) => {
  return assessments
    .filter((assessment) => assessment.playerId === playerId)
    .sort((a, b) => compareAssessmentRecency(b, a))[0] ?? null;
};

export const clearAssessmentSnapshotFromPlayer = (player: Player): Player => {
  const { fprdsLastAssessmentId: _fprdsLastAssessmentId, ...rest } = player;
  return rest;
};

export const applyLatestAssessmentSnapshotToPlayer = (
  player: Player,
  assessments: AssessmentSession[]
) => {
  const latest = selectLatestAssessmentForPlayer(assessments, player.id);
  return latest
    ? applyAssessmentSnapshotToPlayer(player, latest)
    : clearAssessmentSnapshotFromPlayer(player);
};

export const addAssessmentToWorkspace = (
  state: AssessmentState,
  assessment: AssessmentSession
): AssessmentTransition | null => {
  const targetPlayer = state.players.find((player) => player.id === assessment.playerId);
  if (!targetPlayer) return null;

  const existingIndex = state.assessments.findIndex((session) => session.id === assessment.id);
  const assessments = existingIndex >= 0
    ? state.assessments.map((session, index) => (index === existingIndex ? assessment : session))
    : [assessment, ...state.assessments];

  const players = state.players.map((player) => {
    if (player.id !== assessment.playerId) return player;
    return applyLatestAssessmentSnapshotToPlayer(
      {
        ...player,
        fprdsRole: assessment.role
      },
      assessments
    );
  });

  return {
    players,
    assessments,
    affectedPlayerId: assessment.playerId
  };
};

export const deleteAssessmentFromWorkspace = (
  state: AssessmentState,
  assessmentId: string
): AssessmentTransition | null => {
  const targetAssessment = state.assessments.find((assessment) => assessment.id === assessmentId);
  if (!targetAssessment) return null;

  const assessments = state.assessments.filter((assessment) => assessment.id !== assessmentId);
  const players = state.players.map((player) => {
    if (player.id !== targetAssessment.playerId) return player;
    return applyLatestAssessmentSnapshotToPlayer(player, assessments);
  });

  return {
    players,
    assessments,
    affectedPlayerId: targetAssessment.playerId
  };
};
