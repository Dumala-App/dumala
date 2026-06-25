import type { PaymentLedgerEntry, Player } from '../types';

export interface PlayerPaymentSummary {
  playerId: string;
  playerName: string;
  charged: number;
  paid: number;
  waived: number;
  refunded: number;
  balance: number;
  overdue: number;
  lastPaymentDate?: string;
  status: 'paid' | 'partial' | 'due' | 'overdue' | 'no_activity';
}

export interface PaymentLedgerTotals {
  charged: number;
  paid: number;
  waived: number;
  refunded: number;
  outstanding: number;
  overdue: number;
}

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const isBeforeToday = (date: string, today: string): boolean => date < today;

export const activeLedgerEntries = (entries: PaymentLedgerEntry[]): PaymentLedgerEntry[] =>
  entries.filter(entry => !entry.voidedAt);

export const summarizePaymentLedger = (
  players: Player[],
  entries: PaymentLedgerEntry[],
  today = new Date().toISOString().slice(0, 10)
): PlayerPaymentSummary[] => {
  const activeEntries = activeLedgerEntries(entries);

  return players.map(player => {
    const playerEntries = activeEntries.filter(entry => entry.playerId === player.id);
    let charged = 0;
    let paid = 0;
    let waived = 0;
    let refunded = 0;
    let overdueChargeTotal = 0;
    let lastPaymentDate: string | undefined;

    for (const entry of playerEntries) {
      if (entry.type === 'charge') {
        charged += entry.amount;
        if (entry.dueDate && isBeforeToday(entry.dueDate, today)) {
          overdueChargeTotal += entry.amount;
        }
      }
      if (entry.type === 'payment') {
        paid += entry.amount;
        if (!lastPaymentDate || entry.date > lastPaymentDate) lastPaymentDate = entry.date;
      }
      if (entry.type === 'waiver') waived += entry.amount;
      if (entry.type === 'refund') refunded += entry.amount;
      if (entry.type === 'adjustment') charged += entry.amount;
    }

    const balance = roundMoney(charged + refunded - paid - waived);
    const overdue = balance > 0 ? roundMoney(Math.min(overdueChargeTotal, balance)) : 0;
    const activityCount = playerEntries.length;
    const status: PlayerPaymentSummary['status'] = activityCount === 0
      ? 'no_activity'
      : overdue > 0
        ? 'overdue'
        : balance <= 0
          ? 'paid'
          : paid > 0 || waived > 0
            ? 'partial'
            : 'due';

    return {
      playerId: player.id,
      playerName: player.name,
      charged: roundMoney(charged),
      paid: roundMoney(paid),
      waived: roundMoney(waived),
      refunded: roundMoney(refunded),
      balance,
      overdue,
      lastPaymentDate,
      status
    };
  });
};

export const calculatePaymentLedgerTotals = (summaries: PlayerPaymentSummary[]): PaymentLedgerTotals => {
  const totals = summaries.reduce<PaymentLedgerTotals>((result, summary) => ({
    charged: result.charged + summary.charged,
    paid: result.paid + summary.paid,
    waived: result.waived + summary.waived,
    refunded: result.refunded + summary.refunded,
    outstanding: result.outstanding + Math.max(summary.balance, 0),
    overdue: result.overdue + summary.overdue
  }), {
    charged: 0,
    paid: 0,
    waived: 0,
    refunded: 0,
    outstanding: 0,
    overdue: 0
  });

  return {
    charged: roundMoney(totals.charged),
    paid: roundMoney(totals.paid),
    waived: roundMoney(totals.waived),
    refunded: roundMoney(totals.refunded),
    outstanding: roundMoney(totals.outstanding),
    overdue: roundMoney(totals.overdue)
  };
};
