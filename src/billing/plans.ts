// Single source of truth for Dumala subscription plans.
// Add future tiers here and every plan selector (admin console, billing, landing) picks them up.

export interface PlanDefinition {
  /** Stored plan code: lowercase, stable, matches the DB plan_code check constraint. */
  value: string;
  label: string;
  description: string;
}

export const PLAN_FREE = 'free';
export const PLAN_PREMIUM = 'premium';

export const PLAN_OPTIONS: PlanDefinition[] = [
  { value: PLAN_FREE, label: 'Free', description: 'One team, core planning and assessment tools.' },
  { value: PLAN_PREMIUM, label: 'Premium', description: 'Full reports, guided match-week planning, cloud sync.' }
];

export const DEFAULT_PLAN_CODE = PLAN_FREE;

/** Plan codes that were replaced by the free/premium consolidation. */
export const LEGACY_PLAN_CODES = ['trial', 'pro', 'club'] as const;

export const isKnownPlanCode = (code: string): boolean =>
  PLAN_OPTIONS.some(option => option.value === code);

export const isPaidPlanCode = (code: string): boolean => code !== PLAN_FREE;

export const planLabel = (code: string): string =>
  PLAN_OPTIONS.find(option => option.value === code)?.label ?? code;
