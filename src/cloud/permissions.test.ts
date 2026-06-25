import { describe, expect, it } from 'vitest';
import { canManageDomainTable, hasClubPermission, MEMBERSHIP_ROLES } from './permissions';

describe('club role permissions', () => {
  it('keeps all five collaboration roles explicit', () => {
    expect(MEMBERSHIP_ROLES).toEqual(['owner', 'admin', 'coach', 'staff', 'viewer']);
  });

  it('reserves destructive club and member management to owner/admin levels', () => {
    expect(hasClubPermission('owner', 'club.delete')).toBe(true);
    expect(hasClubPermission('admin', 'club.delete')).toBe(false);
    expect(hasClubPermission('admin', 'members.manage')).toBe(true);
    expect(hasClubPermission('coach', 'members.manage')).toBe(false);
    expect(hasClubPermission('viewer', 'members.manage')).toBe(false);
  });

  it('allows coaches to manage football records but not payments or staff membership records', () => {
    expect(canManageDomainTable('coach', 'players')).toBe(true);
    expect(canManageDomainTable('coach', 'games')).toBe(true);
    expect(canManageDomainTable('coach', 'assessment_sessions')).toBe(true);
    expect(canManageDomainTable('coach', 'payment_ledger_entries')).toBe(false);
    expect(canManageDomainTable('coach', 'staff_members')).toBe(false);
  });

  it('keeps staff operational and viewers read-only', () => {
    expect(canManageDomainTable('staff', 'bulletins')).toBe(true);
    expect(canManageDomainTable('staff', 'player_availability')).toBe(true);
    expect(canManageDomainTable('staff', 'players')).toBe(false);
    expect(canManageDomainTable('viewer', 'bulletins')).toBe(false);
    expect(hasClubPermission('viewer', 'club.read')).toBe(true);
  });
});
