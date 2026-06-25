import { describe, expect, it } from 'vitest';
import type { PaymentLedgerEntry, Player } from '../types';
import { calculatePaymentLedgerTotals, summarizePaymentLedger } from './ledger';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Test Player',
  number: 10,
  position: 'Forward',
  bio: '',
  photoUrl: '',
  gamesPlayed: 0,
  points: 0,
  assists: 0,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 0,
  mvpAwards: 0,
  yellowCards: 0,
  redCards: 0,
  offenses: [],
  baseAttributes: {
    pace: 70,
    stamina: 70,
    agility: 70,
    strength: 70,
    firstTouch: 70,
    shortPassing: 70
  },
  positionAttributes: {},
  registrationStatus: 'Active',
  ...overrides
});

const entry = (overrides: Partial<PaymentLedgerEntry>): PaymentLedgerEntry => ({
  id: overrides.id ?? `entry-${Math.random()}`,
  playerId: 'p1',
  playerNameSnapshot: 'Test Player',
  type: 'charge',
  category: 'monthly_fee',
  amount: 100,
  date: '2026-06-01',
  createdAt: '2026-06-01T00:00:00.000Z',
  ...overrides
});

describe('payment ledger summaries', () => {
  it('calculates charges, partial payments, waivers, and outstanding balance', () => {
    const summaries = summarizePaymentLedger([player()], [
      entry({ id: 'charge-1', type: 'charge', amount: 1000 }),
      entry({ id: 'payment-1', type: 'payment', amount: 400, date: '2026-06-05' }),
      entry({ id: 'waiver-1', type: 'waiver', amount: 100, date: '2026-06-06' })
    ], '2026-06-10');

    expect(summaries[0]).toMatchObject({
      charged: 1000,
      paid: 400,
      waived: 100,
      balance: 500,
      status: 'partial',
      lastPaymentDate: '2026-06-05'
    });
  });

  it('handles refunds as added balance and reduced net collection', () => {
    const summaries = summarizePaymentLedger([player()], [
      entry({ id: 'charge-1', type: 'charge', amount: 500 }),
      entry({ id: 'payment-1', type: 'payment', amount: 500 }),
      entry({ id: 'refund-1', type: 'refund', amount: 200 })
    ], '2026-06-10');
    const totals = calculatePaymentLedgerTotals(summaries);

    expect(summaries[0].balance).toBe(200);
    expect(summaries[0].refunded).toBe(200);
    expect(totals.outstanding).toBe(200);
  });

  it('ignores voided entries', () => {
    const summaries = summarizePaymentLedger([player()], [
      entry({ id: 'charge-1', type: 'charge', amount: 500 }),
      entry({ id: 'payment-void', type: 'payment', amount: 500, voidedAt: '2026-06-02T00:00:00.000Z' })
    ], '2026-06-10');

    expect(summaries[0].paid).toBe(0);
    expect(summaries[0].balance).toBe(500);
  });

  it('marks balances overdue when unpaid charges are past due', () => {
    const summaries = summarizePaymentLedger([player()], [
      entry({ id: 'charge-1', type: 'charge', amount: 500, dueDate: '2026-06-01' })
    ], '2026-06-10');

    expect(summaries[0].overdue).toBe(500);
    expect(summaries[0].status).toBe('overdue');
  });

  it('does not mutate input arrays or entries', () => {
    const entries = [entry({ id: 'charge-1' })];
    const before = structuredClone(entries);
    summarizePaymentLedger([player()], entries, '2026-06-10');

    expect(entries).toEqual(before);
  });
});
