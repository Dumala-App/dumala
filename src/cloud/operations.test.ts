import { describe, expect, it } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import {
  createDiagnosticSnapshot,
  evaluateProductionLaunchReadiness,
  evaluateRestoreDrill,
  OPERATIONAL_METRICS,
  PRODUCTION_GATES,
  sanitizeOperationalMetadata
} from './operations';
import { writeLifecycleAuditEvent } from './lifecycle';

describe('cloud operations', () => {
  it('defines operational metrics without private workspace labels', () => {
    const allLabels = OPERATIONAL_METRICS.flatMap(metric => metric.allowedLabels);

    expect(OPERATIONAL_METRICS.length).toBeGreaterThanOrEqual(10);
    expect(allLabels).not.toContain('playerName');
    expect(allLabels).not.toContain('staffName');
    expect(allLabels).not.toContain('paymentReference');
    expect(allLabels).not.toContain('noteContent');
  });

  it('redacts sensitive operational metadata keys', () => {
    expect(sanitizeOperationalMetadata({
      action: 'export',
      failureCode: 'EXPORT_FAILED',
      playerName: 'Ari Santos',
      paymentAmount: 1200,
      accessToken: 'secret',
      nested: { unsafe: true }
    })).toEqual({
      action: 'export',
      failureCode: 'EXPORT_FAILED'
    });
  });

  it('creates redacted diagnostic snapshots from counts and stable codes only', () => {
    const snapshot = createDiagnosticSnapshot({
      appVersion: '0.0.0',
      cloudEnabled: true,
      browser: {
        family: 'chromium',
        platformClass: 'desktop'
      },
      sync: {
        state: 'paused',
        pendingMutations: { players: 2 },
        unresolvedConflicts: { games: 1 },
        oldestPendingMutationAgeMs: 9000,
        lastPullCursor: 'cursor-42'
      },
      storage: {
        usage: 1024,
        quota: 2048,
        usageRatio: 0.5
      },
      migration: {
        state: 'failed',
        lastErrorCode: 'IMPORT_CONSTRAINT_FAILED'
      },
      recentErrorCodes: ['RLS_DENIED']
    }, '2026-06-25T12:30:00.000Z');

    expect(snapshot).toEqual({
      format: 'dumala-redacted-diagnostics',
      version: 1,
      exportedAt: '2026-06-25T12:30:00.000Z',
      appVersion: '0.0.0',
      cloudEnabled: true,
      browser: {
        family: 'chromium',
        platformClass: 'desktop'
      },
      sync: {
        state: 'paused',
        pendingMutations: { players: 2 },
        unresolvedConflicts: { games: 1 },
        oldestPendingMutationAgeMs: 9000,
        lastPullCursor: 'cursor-42'
      },
      storage: {
        usage: 1024,
        quota: 2048,
        usageRatio: 0.5
      },
      migration: {
        state: 'failed',
        lastErrorCode: 'IMPORT_CONSTRAINT_FAILED'
      },
      recentErrorCodes: ['RLS_DENIED']
    });
  });

  it('fails restore drill evidence until every required check and note exists', () => {
    expect(evaluateRestoreDrill({
      checks: {
        schema_migration_validation: true,
        rls_isolation_tests: true
      }
    })).toMatchObject({
      status: 'failed',
      missingChecks: [
        'sample_club_counts',
        'domain_integrity',
        'sync_cursor_integrity',
        'export_generation'
      ]
    });

    expect(evaluateRestoreDrill({
      sourceBackupTimestamp: '2026-06-25T00:00:00.000Z',
      restoreEnvironment: 'staging-restore',
      operator: 'ops',
      startedAt: '2026-06-25T12:00:00.000Z',
      completedAt: '2026-06-25T12:30:00.000Z',
      checks: {
        schema_migration_validation: true,
        rls_isolation_tests: true,
        sample_club_counts: true,
        domain_integrity: true,
        sync_cursor_integrity: true,
        export_generation: true
      }
    })).toEqual({
      status: 'passed',
      missingChecks: [],
      issues: []
    });
  });

  it('blocks production launch until every gate passes', () => {
    expect(evaluateProductionLaunchReadiness([
      { id: 'environment_separation', passed: true },
      { id: 'restore_drill_passed', passed: false }
    ])).toMatchObject({
      ready: false,
      blockedBy: expect.arrayContaining(['restore_drill_passed', 'privacy_review_approved'])
    });

    expect(evaluateProductionLaunchReadiness(PRODUCTION_GATES.map(id => ({ id, passed: true })))).toEqual({
      ready: true,
      blockedBy: []
    });
  });

  it('applies audit metadata redaction before inserting lifecycle audit rows', async () => {
    const inserts: unknown[] = [];
    const client = {
      auth: {
        getUser: async () => ({
          data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
          error: null
        })
      },
      from: (table: string) => ({
        insert: async (values: unknown) => {
          inserts.push({ table, values });
          return { data: null, error: null };
        }
      })
    } as unknown as DumalaSupabaseClient;

    await writeLifecycleAuditEvent(client, 'authorization_denied', {
      clubId: '22222222-2222-4222-8222-222222222222',
      metadata: {
        action: 'request_club_deletion',
        playerName: 'Ari Santos',
        noteContent: 'private note',
        errorCode: 'CLUB_OWNER_REQUIRED'
      }
    });

    expect(inserts).toEqual([{
      table: 'audit_events',
      values: {
        club_id: '22222222-2222-4222-8222-222222222222',
        user_id: '11111111-1111-4111-8111-111111111111',
        device_id: undefined,
        event_type: 'authorization_denied',
        metadata: {
          action: 'request_club_deletion',
          errorCode: 'CLUB_OWNER_REQUIRED'
        }
      }
    }]);
  });
});
