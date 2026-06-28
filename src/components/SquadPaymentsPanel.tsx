import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, Ban, Banknote, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, Plus, ReceiptText, Search, TrendingUp } from 'lucide-react';
import type {
  PaymentLedgerCategory,
  PaymentLedgerEntry,
  PaymentLedgerEntryType,
  PaymentMethod,
  Player
} from '../types';
import { calculatePaymentLedgerTotals, summarizePaymentLedger } from '../payments/ledger';
import { formatPeso } from '../payments/formatting';
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
import {
  FieldErrors,
  focusFirstInvalidField,
  hasFieldErrors,
  mergeFieldErrors
} from '../forms/validation';
import { cn } from '../lib/utils';

interface SquadPaymentsPanelProps {
  players: Player[];
  entries: PaymentLedgerEntry[];
  onAddEntry: (entry: PaymentLedgerEntry) => void;
  onAddBulkEntries: (entries: PaymentLedgerEntry[]) => void;
  onVoidEntry: (entryId: string, reason: string) => void;
}

type EntryFormField = 'playerId' | 'amount' | 'date' | 'method' | 'note';
type BulkFormField = 'amount' | 'date';
type MonthlyPaymentSummary = {
  monthKey: string;
  monthLabel: string;
  charged: number;
  paid: number;
  waived: number;
  refunded: number;
  balance: number;
  entryCount: number;
};

const categories: Array<{ value: PaymentLedgerCategory; label: string }> = [
  { value: 'registration', label: 'Registration' },
  { value: 'monthly_fee', label: 'Monthly fee' },
  { value: 'coach_fee', label: 'Coach fee' },
  { value: 'kit', label: 'Kit' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' }
];

const entryTypes: Array<{ value: PaymentLedgerEntryType; label: string }> = [
  { value: 'charge', label: 'Fee / Charge' },
  { value: 'payment', label: 'Payment' },
  { value: 'waiver', label: 'Waiver' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Adjustment' }
];

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' }
];

const today = () => new Date().toISOString().slice(0, 10);

const parsePositiveAmount = (rawValue: string, label = 'Amount') => {
  const value = rawValue.trim();
  if (!value) return `${label} is required.`;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return `${label} must be a valid number.`;
  if (parsed <= 0) return `${label} must be greater than 0.`;
  return undefined;
};

const makeEntryId = () => `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const formatMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const statusStyles: Record<string, string> = {
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  partial: 'border-sky-200 bg-sky-50 text-sky-700',
  due: 'border-amber-200 bg-amber-50 text-amber-700',
  overdue: 'border-rose-200 bg-rose-50 text-rose-700',
  no_activity: 'border-slate-200 bg-slate-50 text-slate-500'
};

const paymentInputClass = 'rounded-xl text-xs font-semibold';
const invalidPaymentClass = 'border-rose-300 focus-visible:ring-rose-500/25 focus:ring-rose-500/25';

export default function SquadPaymentsPanel({
  players,
  entries,
  onAddEntry,
  onAddBulkEntries,
  onVoidEntry
}: SquadPaymentsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PaymentLedgerCategory>('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [entryType, setEntryType] = useState<PaymentLedgerEntryType>('charge');
  const [playerId, setPlayerId] = useState('');
  const [category, setCategory] = useState<PaymentLedgerCategory>('monthly_fee');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [formErrors, setFormErrors] = useState<FieldErrors<EntryFormField>>({});
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkCategory, setBulkCategory] = useState<PaymentLedgerCategory>('monthly_fee');
  const [bulkDate, setBulkDate] = useState(today());
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkErrors, setBulkErrors] = useState<FieldErrors<BulkFormField>>({});
  const [voidReasonById, setVoidReasonById] = useState<Record<string, string>>({});
  const [showAllMonthlyHistory, setShowAllMonthlyHistory] = useState(false);
  const [ledgerExpanded, setLedgerExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState<'record' | 'charge'>('record');
  const formRef = useRef<HTMLFormElement | null>(null);
  const bulkFormRef = useRef<HTMLFormElement | null>(null);

  const summaries = useMemo(() => summarizePaymentLedger(players, entries), [entries, players]);
  const totals = useMemo(() => calculatePaymentLedgerTotals(summaries), [summaries]);
  const playerById = useMemo(() => new Map(players.map(player => [player.id, player])), [players]);
  const activeEntries = useMemo(() => entries.filter(entry => !entry.voidedAt), [entries]);
  const monthlyHistory = useMemo(() => {
    const byMonth = new Map<string, MonthlyPaymentSummary>();

    activeEntries.filter(entry => entry.category === 'monthly_fee').forEach(entry => {
      const monthKey = entry.date.slice(0, 7);
      const current = byMonth.get(monthKey) ?? {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        charged: 0,
        paid: 0,
        waived: 0,
        refunded: 0,
        balance: 0,
        entryCount: 0
      };

      if (entry.type === 'charge' || entry.type === 'adjustment') current.charged += entry.amount;
      if (entry.type === 'payment') current.paid += entry.amount;
      if (entry.type === 'waiver') current.waived += entry.amount;
      if (entry.type === 'refund') current.refunded += entry.amount;
      current.entryCount += 1;
      current.balance = roundMoney(current.charged + current.refunded - current.paid - current.waived);
      byMonth.set(monthKey, current);
    });

    return Array.from(byMonth.values())
      .map(month => ({
        ...month,
        charged: roundMoney(month.charged),
        paid: roundMoney(month.paid),
        waived: roundMoney(month.waived),
        refunded: roundMoney(month.refunded),
        balance: roundMoney(month.balance)
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [activeEntries]);
  const currentMonthKey = today().slice(0, 7);
  const currentMonthSummary = monthlyHistory.find(month => month.monthKey === currentMonthKey);
  const currentMonthRate = currentMonthSummary && currentMonthSummary.charged > 0
    ? Math.min(100, Math.round(((currentMonthSummary.paid + currentMonthSummary.waived) / currentMonthSummary.charged) * 100))
    : 0;
  const visibleMonthlyHistory = showAllMonthlyHistory ? monthlyHistory : monthlyHistory.slice(0, 4);

  const filteredSummaries = summaries.filter(summary => {
    const matchesSearch = summary.playerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || summary.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.playerNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    const matchesMonth = monthFilter === 'all' || entry.date.startsWith(monthFilter);
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const resetEntryForm = () => {
    setEntryType('charge');
    setPlayerId('');
    setCategory('monthly_fee');
    setAmount('');
    setDate(today());
    setDueDate('');
    setMethod('cash');
    setReference('');
    setNote('');
    setFormErrors({});
  };

  const handleSubmitEntry = (event: React.FormEvent) => {
    event.preventDefault();
    const selectedPlayer = playerById.get(playerId);
    const amountError = parsePositiveAmount(amount);
    const nextErrors = mergeFieldErrors<EntryFormField>(
      selectedPlayer ? {} : { playerId: 'Choose a player.' },
      amountError ? { amount: amountError } : {},
      date ? {} : { date: 'Date is required.' },
      entryType === 'payment' && !method ? { method: 'Choose a payment method.' } : {},
      entryType === 'adjustment' && !note.trim() ? { note: 'Adjustments require a note.' } : {}
    );

    if (hasFieldErrors(nextErrors) || !selectedPlayer || amountError) {
      setFormErrors(nextErrors);
      focusFirstInvalidField(formRef.current, nextErrors);
      return;
    }

    const now = new Date().toISOString();
    onAddEntry({
      id: makeEntryId(),
      playerId: selectedPlayer.id,
      playerNameSnapshot: selectedPlayer.name,
      type: entryType,
      category,
      amount: Number(amount),
      date,
      dueDate: entryType === 'charge' && dueDate ? dueDate : undefined,
      method: entryType === 'payment' ? method : undefined,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
      createdAt: now
    });
    resetEntryForm();
  };

  const handleBulkSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const amountError = parsePositiveAmount(bulkAmount, 'Bulk amount');
    const nextErrors = mergeFieldErrors<BulkFormField>(
      amountError ? { amount: amountError } : {},
      bulkDate ? {} : { date: 'Date is required.' }
    );

    if (hasFieldErrors(nextErrors) || amountError) {
      setBulkErrors(nextErrors);
      focusFirstInvalidField(bulkFormRef.current, nextErrors);
      return;
    }

    const now = new Date().toISOString();
    const activePlayers = players.filter(player => player.registrationStatus === 'Active');
    onAddBulkEntries(activePlayers.map(player => ({
      id: makeEntryId(),
      playerId: player.id,
      playerNameSnapshot: player.name,
      type: 'charge',
      category: bulkCategory,
      amount: Number(bulkAmount),
      date: bulkDate,
      dueDate: bulkDueDate || undefined,
      note: bulkNote.trim() || undefined,
      createdAt: now
    })));
    setBulkAmount('');
    setBulkDate(today());
    setBulkDueDate('');
    setBulkNote('');
    setBulkErrors({});
  };

  const handleVoid = (entryId: string) => {
    const reason = voidReasonById[entryId]?.trim();
    if (!reason) return;
    onVoidEntry(entryId, reason);
    setVoidReasonById(current => ({ ...current, [entryId]: '' }));
  };

  return (
    <div id="squad-payments-panel" className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {[
          { label: 'Charged', value: totals.charged, icon: ReceiptText, tone: 'text-slate-700' },
          { label: 'Collected', value: totals.paid, icon: Banknote, tone: 'text-emerald-700' },
          { label: 'Outstanding', value: totals.outstanding, icon: CircleDollarSign, tone: 'text-amber-700' },
          { label: 'Overdue', value: totals.overdue, icon: AlertCircle, tone: 'text-rose-700' }
        ].map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{metric.label}</p>
                <Icon size={16} className={metric.tone} aria-hidden="true" />
              </div>
              <p className={`mt-2 text-xl font-black ${metric.tone}`}>{formatPeso(metric.value)}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.6fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Main workspace</p>
                <h3 className="mt-1 font-display text-lg font-black text-slate-900">Player balances</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Review who is paid, partial, overdue, or still missing activity.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <Input
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder="Search player..."
                    className="h-9 w-full bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-700 focus-visible:bg-white sm:w-52"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="h-9 text-xs font-bold text-slate-600 sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="due">Due</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="no_activity">No activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-[760px] w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                    <th className="px-3 py-2 font-black">Player</th>
                    <th className="px-3 py-2 font-black">Charged</th>
                    <th className="px-3 py-2 font-black">Paid</th>
                    <th className="px-3 py-2 font-black">Waived</th>
                    <th className="px-3 py-2 font-black">Balance</th>
                    <th className="px-3 py-2 font-black">Last payment</th>
                    <th className="px-3 py-2 font-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummaries.map(summary => (
                    <tr key={summary.playerId} className="text-slate-700">
                      <td className="px-3 py-3 font-black text-slate-900">{summary.playerName}</td>
                      <td className="px-3 py-3 font-semibold">{formatPeso(summary.charged)}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-700">{formatPeso(summary.paid)}</td>
                      <td className="px-3 py-3 font-semibold">{formatPeso(summary.waived)}</td>
                      <td className="px-3 py-3 font-black">{formatPeso(summary.balance)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-500">{summary.lastPaymentDate ?? '-'}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase ${statusStyles[summary.status]}`}>
                          {summary.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-display text-sm font-black uppercase tracking-wider text-slate-800">Ledger history</h3>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'} match the current filters. Voided entries remain visible for review.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={monthFilter}
                  onValueChange={setMonthFilter}
                >
                  <SelectTrigger className="h-9 text-xs font-bold text-slate-600 sm:w-40" aria-label="Filter ledger by month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {monthlyHistory.map(month => <SelectItem key={month.monthKey} value={month.monthKey}>{month.monthLabel}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={categoryFilter}
                  onValueChange={value => setCategoryFilter(value as 'all' | PaymentLedgerCategory)}
                >
                  <SelectTrigger className="h-9 text-xs font-bold text-slate-600 sm:w-44" aria-label="Filter ledger by category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerExpanded(current => !current)}
                  className="h-9 gap-1 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider"
                  aria-expanded={ledgerExpanded}
                >
                  {ledgerExpanded ? (
                    <>
                      <ChevronUp size={13} aria-hidden="true" /> Minimize
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} aria-hidden="true" /> Show ledger
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!ledgerExpanded ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                <ReceiptText className="mx-auto text-slate-300" size={26} aria-hidden="true" />
                <p className="mt-2 text-sm font-black text-slate-800">Ledger history is minimized</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Expand only when you need to review or void individual payment records.
                </p>
              </div>
            ) : filteredEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-xs">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                      <th className="px-3 py-2 font-black">Date</th>
                      <th className="px-3 py-2 font-black">Player</th>
                      <th className="px-3 py-2 font-black">Type</th>
                      <th className="px-3 py-2 font-black">Category</th>
                      <th className="px-3 py-2 font-black">Amount</th>
                      <th className="px-3 py-2 font-black">Method</th>
                      <th className="px-3 py-2 font-black">Reference</th>
                      <th className="px-3 py-2 font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map(entry => (
                      <tr key={entry.id} className={entry.voidedAt ? 'text-slate-400 line-through' : 'text-slate-700'}>
                        <td className="px-3 py-3 font-semibold">{entry.date}</td>
                        <td className="px-3 py-3 font-black">{entry.playerNameSnapshot}</td>
                        <td className="px-3 py-3 font-semibold capitalize">{entry.type}</td>
                        <td className="px-3 py-3 font-semibold">{categories.find(item => item.value === entry.category)?.label ?? entry.category}</td>
                        <td className="px-3 py-3 font-black">{formatPeso(entry.amount)}</td>
                        <td className="px-3 py-3 font-semibold">{entry.method ?? '-'}</td>
                        <td className="px-3 py-3 font-semibold">{entry.reference ?? entry.note ?? '-'}</td>
                        <td className="px-3 py-3">
                          {entry.voidedAt ? (
                            <span className="text-[10px] font-black uppercase text-slate-400">Voided</span>
                          ) : (
                            <div className="flex min-w-56 items-center gap-2">
                              <Input
                                value={voidReasonById[entry.id] ?? ''}
                                onChange={event => setVoidReasonById(current => ({ ...current, [entry.id]: event.target.value }))}
                                placeholder="Void reason"
                                className="h-8 w-full px-2 text-[11px] no-underline focus-visible:ring-rose-500/20"
                              />
                              <Button
                                type="button"
                                onClick={() => handleVoid(entry.id)}
                                disabled={!voidReasonById[entry.id]?.trim()}
                                variant="outline"
                                size="sm"
                                className="h-8 border-rose-200 bg-rose-50 px-2 text-[10px] font-black uppercase text-rose-700 no-underline hover:bg-rose-100 hover:text-rose-800"
                              >
                                <Ban size={12} /> Void
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                <AlertCircle className="mx-auto text-slate-300" size={28} />
                <p className="mt-2 text-sm font-black text-slate-700">No payment entries yet</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Record a fee or payment to begin the ledger.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current month</p>
                <h3 className="mt-1 font-display text-sm font-black uppercase tracking-wider text-slate-800">
                  {formatMonthLabel(currentMonthKey)}
                </h3>
              </div>
              <CalendarClock size={18} className="text-indigo-600" aria-hidden="true" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Charged</p>
                <p className="mt-1 font-black text-slate-800">{formatPeso(currentMonthSummary?.charged ?? 0)}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Collected</p>
                <p className="mt-1 font-black text-emerald-700">{formatPeso(currentMonthSummary?.paid ?? 0)}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Remaining</p>
                <p className="mt-1 font-black text-amber-700">{formatPeso(Math.max(currentMonthSummary?.balance ?? 0, 0))}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entries</p>
                <p className="mt-1 font-black text-slate-800">{currentMonthSummary?.entryCount ?? 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Collection rate</span>
                <span>{currentMonthRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${currentMonthRate}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment actions</p>
                <h3 className="mt-1 font-display text-sm font-black uppercase tracking-wider text-slate-800">
                  {activeAction === 'record' ? 'Record entry' : 'Charge roster'}
                </h3>
              </div>
              {activeAction === 'record' ? (
                <Plus size={18} className="shrink-0 text-indigo-600" aria-hidden="true" />
              ) : (
                <ReceiptText size={18} className="shrink-0 text-slate-700" aria-hidden="true" />
              )}
            </div>

            <div className="mb-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveAction('record')}
                className={cn(
                  'h-8 rounded-lg text-[10px] font-black uppercase tracking-wider',
                  activeAction === 'record' ? 'bg-white text-indigo-700 shadow-sm hover:bg-white' : 'text-slate-500 hover:bg-white/70'
                )}
              >
                Record
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveAction('charge')}
                className={cn(
                  'h-8 rounded-lg text-[10px] font-black uppercase tracking-wider',
                  activeAction === 'charge' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:bg-white/70'
                )}
              >
                Charge
              </Button>
            </div>

            {activeAction === 'record' ? (
              <form ref={formRef} onSubmit={handleSubmitEntry} className="space-y-2" noValidate>
                <FormErrorSummary id="payment-entry-errors" errors={formErrors} />
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="mb-1.5 block">Type</Label>
                      <Select value={entryType} onValueChange={value => setEntryType(value as PaymentLedgerEntryType)}>
                        <SelectTrigger className={paymentInputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {entryTypes.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Category</Label>
                      <Select value={category} onValueChange={value => setCategory(value as PaymentLedgerCategory)}>
                        <SelectTrigger className={paymentInputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Player *</Label>
                    <Select
                      value={playerId}
                      onValueChange={value => {
                        setPlayerId(value);
                        setFormErrors(previous => ({ ...previous, playerId: undefined }));
                      }}
                    >
                      <SelectTrigger
                        data-validation-field="playerId"
                        aria-invalid={Boolean(formErrors.playerId)}
                        className={cn(paymentInputClass, formErrors.playerId && invalidPaymentClass)}
                      >
                        <SelectValue placeholder="Choose player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(player => <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError id="payment-player-error" message={formErrors.playerId} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="mb-1.5 block">Amount *</Label>
                      <Input
                        data-validation-field="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        value={amount}
                        onChange={event => {
                          setAmount(event.target.value);
                          setFormErrors(previous => ({ ...previous, amount: undefined }));
                        }}
                        aria-invalid={Boolean(formErrors.amount)}
                        className={cn(paymentInputClass, formErrors.amount && invalidPaymentClass)}
                      />
                      <FieldError id="payment-amount-error" message={formErrors.amount} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Date *</Label>
                      <Input
                        data-validation-field="date"
                        type="date"
                        value={date}
                        onChange={event => {
                          setDate(event.target.value);
                          setFormErrors(previous => ({ ...previous, date: undefined }));
                        }}
                        className={cn(paymentInputClass, formErrors.date && invalidPaymentClass)}
                      />
                      <FieldError id="payment-date-error" message={formErrors.date} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="mb-1.5 block">Due date</Label>
                      <Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} disabled={entryType !== 'charge'} className={paymentInputClass} />
                    </div>
                    {entryType === 'payment' ? (
                      <div>
                        <Label className="mb-1.5 block">Method</Label>
                        <Select value={method} onValueChange={value => setMethod(value as PaymentMethod)}>
                          <SelectTrigger className={paymentInputClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <Label className="mb-1.5 block">Reference</Label>
                        <Input value={reference} onChange={event => setReference(event.target.value)} placeholder="Receipt or ref" className={paymentInputClass} />
                      </div>
                    )}
                  </div>
                  {entryType === 'payment' && (
                    <div>
                      <Label className="mb-1.5 block">Reference</Label>
                      <Input value={reference} onChange={event => setReference(event.target.value)} placeholder="Receipt or ref" className={paymentInputClass} />
                    </div>
                  )}
                  <div>
                    <Label className="mb-1.5 block">Note</Label>
                    <Textarea
                      data-validation-field="note"
                      value={note}
                      onChange={event => {
                        setNote(event.target.value);
                        setFormErrors(previous => ({ ...previous, note: undefined }));
                      }}
                      rows={2}
                      className={cn('min-h-14', paymentInputClass, formErrors.note && invalidPaymentClass)}
                    />
                    <FieldError id="payment-note-error" message={formErrors.note} />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-wider hover:bg-indigo-700">
                  <CheckCircle2 size={14} /> Save entry
                </Button>
              </form>
            ) : (
              <form ref={bulkFormRef} onSubmit={handleBulkSubmit} className="space-y-2" noValidate>
                <p className="text-[11px] font-medium text-slate-500">Creates one fee entry per active player.</p>
                <FormErrorSummary id="bulk-payment-errors" errors={bulkErrors} />
                <div>
                  <Label className="mb-1.5 block">Category</Label>
                  <Select value={bulkCategory} onValueChange={value => setBulkCategory(value as PaymentLedgerCategory)}>
                    <SelectTrigger className={paymentInputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="mb-1.5 block">Amount *</Label>
                    <Input
                      data-validation-field="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={bulkAmount}
                      onChange={event => {
                        setBulkAmount(event.target.value);
                        setBulkErrors(previous => ({ ...previous, amount: undefined }));
                      }}
                      className={cn(paymentInputClass, bulkErrors.amount && invalidPaymentClass)}
                    />
                    <FieldError id="bulk-payment-amount-error" message={bulkErrors.amount} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Date *</Label>
                    <Input
                      data-validation-field="date"
                      type="date"
                      value={bulkDate}
                      onChange={event => {
                        setBulkDate(event.target.value);
                        setBulkErrors(previous => ({ ...previous, date: undefined }));
                      }}
                      className={cn(paymentInputClass, bulkErrors.date && invalidPaymentClass)}
                    />
                    <FieldError id="bulk-payment-date-error" message={bulkErrors.date} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Due date</Label>
                  <Input type="date" value={bulkDueDate} onChange={event => setBulkDueDate(event.target.value)} className={paymentInputClass} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Note</Label>
                  <Textarea value={bulkNote} onChange={event => setBulkNote(event.target.value)} rows={2} placeholder="Optional note" className={cn('min-h-14', paymentInputClass)} />
                </div>
                <Button type="submit" disabled={players.filter(player => player.registrationStatus === 'Active').length === 0} className="w-full rounded-xl bg-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-800">
                  <ReceiptText size={14} /> Charge active roster
                </Button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Previous months</p>
                <h3 className="mt-1 font-display text-sm font-black uppercase tracking-wider text-slate-800">Monthly payment history</h3>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Showing {visibleMonthlyHistory.length} of {monthlyHistory.length} month{monthlyHistory.length === 1 ? '' : 's'}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {monthlyHistory.length > 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllMonthlyHistory(current => !current)}
                    className="h-8 gap-1 rounded-lg px-2 text-[10px] font-black uppercase tracking-wider"
                  >
                    {showAllMonthlyHistory ? (
                      <>
                        <ChevronUp size={12} aria-hidden="true" /> Show 4
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} aria-hidden="true" /> Show all
                      </>
                    )}
                  </Button>
                )}
                <TrendingUp size={18} className="text-emerald-600" aria-hidden="true" />
              </div>
            </div>
            {visibleMonthlyHistory.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {visibleMonthlyHistory.map(month => (
                  <Button
                    key={month.monthKey}
                    type="button"
                    onClick={() => setMonthFilter(month.monthKey)}
                    variant="ghost"
                    className={`h-auto min-h-[6.75rem] w-full flex-col items-stretch justify-start gap-0 whitespace-normal rounded-xl border p-2.5 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 ${
                      monthFilter === month.monthKey ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{month.monthLabel}</p>
                      <span className="text-[10px] font-black text-slate-400">{month.entryCount} rows</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-[9px]">
                      <div>
                        <p className="font-black uppercase tracking-widest text-slate-400">Fee</p>
                        <p className="mt-0.5 font-black text-slate-700">{formatPeso(month.charged)}</p>
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-widest text-emerald-600">Paid</p>
                        <p className="mt-0.5 font-black text-emerald-700">{formatPeso(month.paid)}</p>
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-widest text-amber-600">Open</p>
                        <p className="mt-0.5 font-black text-amber-700">{formatPeso(Math.max(month.balance, 0))}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-xs font-black text-slate-700">No monthly history yet</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">Monthly summaries appear after you record charges or payments.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
