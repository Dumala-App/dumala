export const MEMBERSHIP_ROLES = ['owner', 'admin', 'coach', 'staff', 'viewer'] as const;

export type MembershipRole = typeof MEMBERSHIP_ROLES[number];

export type ClubPermission =
  | 'club.read'
  | 'club.update'
  | 'club.delete'
  | 'members.read'
  | 'members.manage'
  | 'roster.manage'
  | 'schedule.manage'
  | 'results.manage'
  | 'standings.manage'
  | 'bulletins.manage'
  | 'assessments.manage'
  | 'payments.manage'
  | 'availability.manage'
  | 'coachNotes.manage'
  | 'training.manage'
  | 'tactics.manage'
  | 'exports.create'
  | 'audit.read';

export const ROLE_PERMISSIONS: Record<MembershipRole, ReadonlySet<ClubPermission>> = {
  owner: new Set([
    'club.read',
    'club.update',
    'club.delete',
    'members.read',
    'members.manage',
    'roster.manage',
    'schedule.manage',
    'results.manage',
    'standings.manage',
    'bulletins.manage',
    'assessments.manage',
    'payments.manage',
    'availability.manage',
    'coachNotes.manage',
    'training.manage',
    'tactics.manage',
    'exports.create',
    'audit.read'
  ]),
  admin: new Set([
    'club.read',
    'club.update',
    'members.read',
    'members.manage',
    'roster.manage',
    'schedule.manage',
    'results.manage',
    'standings.manage',
    'bulletins.manage',
    'assessments.manage',
    'payments.manage',
    'availability.manage',
    'coachNotes.manage',
    'training.manage',
    'tactics.manage',
    'exports.create',
    'audit.read'
  ]),
  coach: new Set([
    'club.read',
    'members.read',
    'roster.manage',
    'schedule.manage',
    'results.manage',
    'standings.manage',
    'bulletins.manage',
    'assessments.manage',
    'availability.manage',
    'coachNotes.manage',
    'training.manage',
    'tactics.manage',
    'exports.create'
  ]),
  staff: new Set([
    'club.read',
    'members.read',
    'bulletins.manage',
    'availability.manage',
    'coachNotes.manage',
    'training.manage'
  ]),
  viewer: new Set([
    'club.read',
    'members.read'
  ])
};

export const hasClubPermission = (role: MembershipRole | null | undefined, permission: ClubPermission): boolean =>
  role ? ROLE_PERMISSIONS[role].has(permission) : false;

export const canManageDomainTable = (
  role: MembershipRole | null | undefined,
  table: string
): boolean => {
  const tablePermission: Record<string, ClubPermission> = {
    players: 'roster.manage',
    staff_members: 'members.manage',
    games: 'schedule.manage',
    match_results: 'results.manage',
    match_scorer_contributions: 'results.manage',
    mvp_awards: 'results.manage',
    player_offenses: 'results.manage',
    standings_rows: 'standings.manage',
    standings_snapshots: 'standings.manage',
    bulletins: 'bulletins.manage',
    assessment_sessions: 'assessments.manage',
    assessment_development_plan_weeks: 'assessments.manage',
    payment_ledger_entries: 'payments.manage',
    player_availability: 'availability.manage',
    coach_notes: 'coachNotes.manage',
    weekly_training_schedules: 'training.manage',
    tactics_workspaces: 'tactics.manage',
    tactics_lineup_assignments: 'tactics.manage',
    tactics_draw_paths: 'tactics.manage',
    tactics_notes: 'tactics.manage',
    tactics_player_extras: 'tactics.manage'
  };

  const permission = tablePermission[table];
  return permission ? hasClubPermission(role, permission) : false;
};
