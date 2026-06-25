# Squad Payments Ledger Implementation Plan

Updated: 2026-06-25

Status: Proposed implementation plan

## 1. Executive summary

Add a simple cash ledger to the Squad dashboard so coaches and team administrators can track player registration fees, monthly player fees, coach fees, kit fees, tournament fees, and other team payments.

The recommended first release is a local-first, transaction-based ledger that matches Dumala's current architecture:

- Store payment records as independent ledger entries linked to `playerId`.
- Keep player roster records separate from financial transactions.
- Derive balances, paid totals, outstanding totals, and overdue status from ledger entries.
- Validate all persisted ledger data with Zod.
- Include the ledger in full workspace backup and restore.
- Build the UI as a Squad subview, not a separate primary navigation area.
- Avoid payment processing, online checkout, invoicing compliance, and accounting-grade reporting in the MVP.

This keeps the feature useful for real grassroots operations while preserving a clean path toward future cloud sync, role-based access, and online payments.

## 2. Product goal

Coaches need a simple way to answer:

1. Who has paid registration?
2. Who still owes player fees?
3. How much cash was collected?
4. Which payments were made for coach fees, kits, tournaments, or other categories?
5. What was the last payment recorded for a player?
6. Can the team export or restore these records with the rest of the workspace?

The MVP should feel like a team payment notebook inside the Squad dashboard, not like a full accounting system.

## 3. Current system constraints

Dumala is currently a local-first React 19, Vite, and TypeScript PWA:

- `App.tsx` owns core workspace state and persistence.
- Core collections are stored in browser `localStorage`.
- Runtime validation uses Zod schemas in `src/persistence/schemas.ts`.
- Storage keys are centralized in `src/persistence/storage.ts`.
- Full Workspace V3 backup covers core records and feature state through `src/persistence/backup.ts`.
- Squad currently renders through `src/components/RosterView.tsx`.
- There is no backend, authentication, user role system, or online payment provider in the current beta.

The ledger must respect these boundaries. It should not assume cloud accounts, shared club roles, or server-side payment verification.

## 4. Non-goals for the first release

1. Online payment collection.
2. Payment gateway integration.
3. Official accounting, tax, invoice, or receipt compliance.
4. Multi-currency settlement.
5. Payroll, contracts, or salary management.
6. Parent/player login.
7. Automatic reminders through SMS, email, or chat apps.
8. Multi-user audit attribution.
9. Editing historical player balances directly.

These can be revisited after cloud accounts, role-based access, and durable backend storage exist.

## 5. Domain model

Use an append-friendly ledger model. Each fee, payment, waiver, refund, or correction is a separate transaction.

### TypeScript types

Add the following domain types to `src/types.ts`:

```ts
export type PaymentLedgerEntryType = 'charge' | 'payment' | 'waiver' | 'refund' | 'adjustment';

export type PaymentLedgerCategory =
  | 'registration'
  | 'monthly_fee'
  | 'coach_fee'
  | 'kit'
  | 'tournament'
  | 'training'
  | 'other';

export type PaymentMethod = 'cash' | 'gcash' | 'bank_transfer' | 'card' | 'other';

export interface PaymentLedgerEntry {
  id: string;
  playerId: string;
  playerNameSnapshot: string;
  type: PaymentLedgerEntryType;
  category: PaymentLedgerCategory;
  amount: number;
  date: string;
  dueDate?: string;
  method?: PaymentMethod;
  reference?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
  voidedAt?: string;
  voidReason?: string;
}
```

### Design rules

1. `amount` is always a positive finite number.
2. `charge` increases the player's balance.
3. `payment` decreases the player's balance.
4. `waiver` decreases the player's balance without representing collected money.
5. `refund` increases the player's balance and decreases net collected money.
6. `adjustment` is reserved for administrator corrections and should require a note.
7. Voided entries remain stored but are excluded from totals.
8. `playerNameSnapshot` preserves historical readability if a player is renamed or removed.
9. Player balance is derived from entries and never stored on the `Player` record.

## 6. Derived financial calculations

Create a pure domain module, for example `src/payments/ledger.ts`, for calculations.

Recommended derived values:

```ts
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
```

Calculation rules:

1. Ignore voided entries.
2. Sum charges by player.
3. Sum payments and waivers as credits.
4. Sum refunds against collected totals and as added balance.
5. Calculate `balance = charges + refunds - payments - waivers`.
6. Treat a balance as overdue when at least one unpaid charge has `dueDate` before today.
7. Round display values to two decimal places, but keep stored amounts as numbers.
8. Never mutate input arrays or player records.

## 7. Persistence plan

### Storage key

Add a new key in `src/persistence/storage.ts`:

```ts
paymentLedger: 'stack_team_payment_ledger'
```

Add it to:

- `STORAGE_KEYS`
- `storageSchemas`
- `STORAGE_SECTIONS`
- `CORE_DUMALA_KEYS`

### Schema

Add `paymentLedgerEntrySchema` and `paymentLedgerSchema` in `src/persistence/schemas.ts`.

Validation requirements:

1. `id`, `playerId`, `playerNameSnapshot`, `date`, and `createdAt` are required strings.
2. `type`, `category`, and `method` use strict enums.
3. `amount` is finite and greater than `0`.
4. Optional text fields are strings.
5. `voidedAt` and `voidReason` are optional.
6. Unknown fields should not be relied on by the UI. Prefer strict schemas unless backward compatibility requires passthrough.

### App state

In `src/App.tsx`:

1. Read payment ledger during initial workspace load.
2. Store it in `useState<PaymentLedgerEntry[]>`.
3. Persist changes with `writeJsonStorage`.
4. Clear it on workspace reset.
5. Pass it to the Squad view.
6. Provide handlers for add, update, void, and bulk create operations.

Recommended handlers:

```ts
const handleAddPaymentLedgerEntry = (entry: PaymentLedgerEntry) => void;
const handleUpdatePaymentLedgerEntry = (entry: PaymentLedgerEntry) => void;
const handleVoidPaymentLedgerEntry = (entryId: string, reason: string) => void;
const handleAddBulkPaymentLedgerEntries = (entries: PaymentLedgerEntry[]) => void;
```

Avoid hard deletion in the normal UI. Voiding is safer because it preserves the audit trail.

## 8. Backup and restore

Create Full Workspace V4 or extend V3 only if backward compatibility remains clear.

Recommended approach:

1. Add `paymentLedger` to the core workspace model.
2. Introduce `workspaceBackupV4Schema`.
3. Keep V3 import support by defaulting missing `paymentLedger` to `[]`.
4. Keep V1 and V2 migration paths intact.
5. Update `BackupRestoreSummary` to include `paymentEntries`.
6. Update restore success copy in `RosterView` to mention payment records.
7. Add backup round-trip tests.

If a smaller change is preferred, payments can be added to `featureState` instead of core. However, because payments are directly tied to players and should travel with the roster, core workspace storage is the better long-term boundary.

## 9. UI and interaction design

### Placement

Add a Squad-level tab or segmented control:

- Players
- Staff
- Payments

The Payments tab should live in `RosterView` initially to avoid changing primary app navigation.

If `RosterView` becomes too large, split it into:

- `SquadPlayersPanel`
- `SquadStaffPanel`
- `SquadPaymentsPanel`

### Payments tab layout

The MVP Payments tab should include:

1. Summary metrics:
   - Total charged
   - Total collected
   - Outstanding
   - Overdue

2. Filters:
   - Search player
   - Category
   - Status
   - Date range

3. Player balance table:
   - Player
   - Charged
   - Paid
   - Waived
   - Balance
   - Last payment
   - Status
   - Actions

4. Ledger table:
   - Date
   - Player
   - Type
   - Category
   - Amount
   - Method
   - Reference
   - Note
   - Status

5. Actions:
   - Add fee
   - Add payment
   - Charge all active players
   - Void entry

### Add fee form

Fields:

- Player
- Category
- Amount
- Date
- Due date
- Note

For player-specific charges, require a selected player. For team-wide charges, use the bulk flow.

### Add payment form

Fields:

- Player
- Amount
- Date
- Method
- Category
- Reference
- Note

Default category can be `monthly_fee` or the selected unpaid category if launched from a player row.

### Bulk fee flow

Support "Charge all active players" after the single-entry flow works.

Fields:

- Category
- Amount per player
- Date
- Due date
- Include only active players
- Optional note

On submit, create one charge entry per included player. This keeps later partial payments and waivers simple.

## 10. Accessibility and UX standards

1. Every input must have a visible label.
2. Validation errors should use the existing `FieldError` and `FormErrorSummary` patterns.
3. Forms should focus the first invalid field on failed submit.
4. Buttons must have clear accessible names.
5. Tables must keep readable headings and avoid horizontal overflow on tablet widths.
6. Destructive actions such as voiding should require confirmation and a reason.
7. Empty states should explain that no payment entries have been recorded yet.
8. Status badges should not rely on color alone.
9. Currency display should be consistent across summary cards, rows, and forms.
10. Keyboard users must be able to add, filter, and void entries.

## 11. Validation rules

Use the existing form validation style in `src/forms/validation.ts`.

Required validation:

1. Player is required for all MVP ledger entries.
2. Amount is required, numeric, finite, and greater than `0`.
3. Date is required.
4. Due date cannot be earlier than charge date unless explicitly allowed with a note.
5. Payment method is required for `payment` entries.
6. Reference should be optional but trimmed.
7. Void reason is required when voiding an entry.
8. Adjustment entries require a note.
9. Removed players can remain visible through `playerNameSnapshot`, but new entries should only target current players.

## 12. Currency and localization

For the Philippines-first beta, default display should use Philippine peso formatting:

```ts
new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP'
});
```

Implementation notes:

1. Keep currency formatting in a small helper such as `src/payments/formatting.ts`.
2. Store amounts as numbers, not formatted strings.
3. Defer multi-currency support until cloud organization settings exist.
4. Do not assume centavo precision matters for every grassroots team, but support two decimal places cleanly.

## 13. Privacy and safety

Payment information is sensitive even in a local-first app.

MVP safeguards:

1. Do not show payment amounts in public profiles.
2. Do not include payment data in screenshots or share views unless explicitly designed later.
3. Do not log payment records to the console.
4. Do not expose raw backup contents in rendered error messages.
5. Include payment ledger data only in full workspace backups, not lightweight public exports.
6. Make clear in docs and UI copy that the beta stores data locally in the browser.

Future cloud requirements:

1. Restrict payments to owner, manager, treasurer, or authorized staff roles.
2. Use server-side authorization and audit logs.
3. Encrypt backups at rest where supported.
4. Add data deletion and export flows.

## 14. Testing strategy

### Unit tests

Add tests for `src/payments/ledger.ts`:

1. Calculates balance for charges and payments.
2. Handles partial payments.
3. Handles waivers separately from collected money.
4. Handles refunds.
5. Excludes voided entries.
6. Identifies overdue balances.
7. Preserves removed-player display through snapshots.
8. Does not mutate inputs.

Add persistence tests:

1. Valid ledger entries pass schema validation.
2. Invalid amount values are rejected.
3. Invalid enum values are rejected.
4. Backup V4 round-trips payment entries.
5. V3 backups restore with an empty ledger.
6. Failed restore writes roll back previous ledger data.

### UI tests

At minimum, manually verify:

1. Fresh workspace with no ledger entries.
2. Add fee for one player.
3. Add partial payment for that player.
4. Add waiver.
5. Void an incorrect entry.
6. Charge all active players.
7. Filter by status and category.
8. Export backup, reset workspace, import backup, confirm ledger records remain.
9. Tablet-width layout does not overflow.
10. Keyboard navigation works through forms and action buttons.

Automated component tests can be added after the payments panel is split into focused components.

## 15. Implementation phases

### Phase 1: Domain and persistence

1. Add payment ledger types.
2. Add Zod schemas.
3. Add storage key and recovery section.
4. Add pure calculation helpers.
5. Add unit tests for calculations and schemas.
6. Wire ledger state into `App.tsx`.
7. Persist ledger entries to local storage.

Acceptance criteria:

- TypeScript passes.
- Ledger data survives reload.
- Invalid stored ledger data triggers the existing recovery path.
- Calculation tests pass.

### Phase 2: Backup and restore

1. Add payment ledger to full workspace backup.
2. Introduce backup V4 with V3 backward compatibility.
3. Update backup summary copy.
4. Add backup migration and restore tests.
5. Verify restore rollback includes payment ledger.

Acceptance criteria:

- V4 backups include payments.
- V3 backups still import.
- Failed imports do not corrupt existing payment data.

### Phase 3: Squad Payments UI

1. Add Squad subview state for Players, Staff, and Payments.
2. Build `SquadPaymentsPanel`.
3. Add summary metrics.
4. Add player balance table.
5. Add ledger history table.
6. Add filters.
7. Add empty states.

Acceptance criteria:

- Coaches can review balances by player.
- Summary totals match derived ledger calculations.
- UI remains usable on supported mobile and tablet widths.

### Phase 4: Entry forms

1. Add fee form.
2. Add payment form.
3. Add validation and focus handling.
4. Add void confirmation flow.
5. Add bulk charge flow for active players.

Acceptance criteria:

- Coaches can add fees and payments without editing player profiles.
- Partial payment workflows are supported.
- Voided entries are retained but excluded from totals.

### Phase 5: Polish and reporting

1. Add CSV export for ledger entries.
2. Add per-player printable summary.
3. Add category/month filters.
4. Add overdue-focused quick filter.
5. Add lightweight dashboard indicator in Home overview if needed.

Acceptance criteria:

- Team administrators can produce a simple payment report.
- Reports are derived from the same ledger entries as the UI.

## 16. Suggested file changes

Expected files:

- `src/types.ts`
- `src/payments/ledger.ts`
- `src/payments/ledger.test.ts`
- `src/payments/formatting.ts`
- `src/persistence/schemas.ts`
- `src/persistence/storage.ts`
- `src/persistence/backup.ts`
- `src/persistence/backup.test.ts`
- `src/persistence/storage.test.ts`
- `src/App.tsx`
- `src/components/RosterView.tsx`
- `src/components/SquadPaymentsPanel.tsx`
- `src/components/SquadPaymentsPanel.test.tsx` if component testing is added

Keep edits scoped. Do not redesign the entire Squad dashboard while adding payments.

## 17. Future cloud-ready considerations

When Dumala adds cloud accounts and synchronization, payment records should move cleanly into a durable table.

Potential relational model:

```text
payment_ledger_entries
- id
- club_id
- player_id
- type
- category
- amount
- currency
- date
- due_date
- method
- reference
- note
- created_by
- created_at
- updated_at
- voided_by
- voided_at
- void_reason
```

Cloud requirements:

1. Row Level Security must enforce club membership.
2. Only authorized roles can view and edit payment data.
3. Mutations should be idempotent for offline sync.
4. Voids should be audit events, not hard deletes.
5. Server timestamps should become authoritative for audit fields.
6. Export and deletion flows must include financial records.

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Storing balances directly on players | Balances become stale or incorrect | Store only ledger entries and derive totals |
| Hard deleting mistakes | Loss of audit trail | Void entries with required reason |
| Adding payments to backup incorrectly | Users lose payment records during restore | Add V4 backup tests and rollback coverage |
| Large `RosterView` becomes harder to maintain | Slower feature work | Split payments into `SquadPaymentsPanel` |
| Sensitive payment data appears in public features | Privacy issue | Keep payments restricted to workspace-only views |
| Confusing collected money with waived fees | Bad financial reporting | Track `paid` and `waived` separately |
| Overbuilding accounting workflows | Slower MVP delivery | Keep first release to ledger, balances, and backup |

## 19. Definition of done

The MVP is complete when:

1. A coach can record a fee for a player.
2. A coach can record a payment for a player.
3. A coach can record partial payments.
4. A coach can view paid, outstanding, and overdue totals.
5. A coach can see each player's payment status in the Squad dashboard.
6. A coach can void an incorrect entry without deleting history.
7. Active players can be bulk-charged a common fee.
8. Payment data survives reload.
9. Payment data is included in full workspace backup and restore.
10. TypeScript, unit tests, and production build pass.
11. The feature works at supported desktop, mobile, and tablet viewports.

## 20. Recommended first implementation slice

Start with the smallest useful vertical slice:

1. Add types, schemas, storage, and calculation helpers.
2. Wire state in `App.tsx`.
3. Build a Payments tab with summary totals and an empty ledger table.
4. Add one form that can create either `charge` or `payment`.
5. Add unit tests for balance calculations.
6. Add backup support.

After this slice works end to end, add bulk charges, voiding, filters, and reporting.
