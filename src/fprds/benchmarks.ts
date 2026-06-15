export type TierLabel = 'Elite' | 'Advanced' | 'Developing' | 'Below Average' | 'Beginner';

export type AgeGroup = 'U12' | 'U15' | 'U18' | 'Adult';

export type BenchmarkDirection = 'lower_is_better' | 'higher_is_better';

export interface BenchmarkTier {
  label: TierLabel;
  scoreMin: number;
  scoreMax: number;
  // Raw range. For time-based drills, lower is better. For value-based drills, higher is better.
  // Use null for open-ended bounds.
  rawBest: number | null;
  rawWorst: number | null;
}

export interface BenchmarkTable {
  direction: BenchmarkDirection;
  tiers: BenchmarkTier[];
}

const timeTiers = (ranges: Array<{ label: TierLabel; best: number | null; worst: number | null; scoreMin: number; scoreMax: number }>): BenchmarkTier[] =>
  ranges.map(r => ({
    label: r.label,
    rawBest: r.best,
    rawWorst: r.worst,
    scoreMin: r.scoreMin,
    scoreMax: r.scoreMax
  }));

const valueTiers = timeTiers;

export const TIER_SCORE_RANGES: Record<TierLabel, { scoreMin: number; scoreMax: number }> = {
  Elite: { scoreMin: 90, scoreMax: 99 },
  Advanced: { scoreMin: 75, scoreMax: 89 },
  Developing: { scoreMin: 55, scoreMax: 74 },
  'Below Average': { scoreMin: 35, scoreMax: 54 },
  Beginner: { scoreMin: 10, scoreMax: 34 }
};

// Time-based (lower is better)
export const SPRINT_30M: Record<AgeGroup, BenchmarkTable> = {
  U12: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 4.5, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 4.5, worst: 4.89, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 4.9, worst: 5.39, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 5.4, worst: 5.89, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 5.9, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U15: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 4.2, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 4.2, worst: 4.59, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 4.6, worst: 5.09, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 5.1, worst: 5.59, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 5.6, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U18: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 3.95, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 3.95, worst: 4.29, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 4.3, worst: 4.69, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 4.7, worst: 5.19, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 5.2, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  Adult: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 3.9, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 3.9, worst: 4.19, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 4.2, worst: 4.59, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 4.6, worst: 4.99, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 5.0, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  }
};

export const SPRINT_10M: Record<AgeGroup, BenchmarkTable> = {
  U12: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 1.8, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 1.8, worst: 1.99, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 2.0, worst: 2.24, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 2.25, worst: 2.49, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 2.5, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U15: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 1.7, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 1.7, worst: 1.89, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 1.9, worst: 2.14, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 2.15, worst: 2.39, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 2.4, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U18: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 1.6, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 1.6, worst: 1.79, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 1.8, worst: 2.04, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 2.05, worst: 2.29, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 2.3, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  Adult: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 1.55, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 1.55, worst: 1.74, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 1.75, worst: 1.99, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 2.0, worst: 2.24, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 2.25, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  }
};

export const ILLINOIS_AGILITY: Record<AgeGroup, BenchmarkTable> = {
  U12: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 15.5, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 15.5, worst: 16.4, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 16.5, worst: 17.4, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 17.5, worst: 18.4, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 18.5, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U15: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 15.0, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 15.0, worst: 15.9, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 16.0, worst: 16.9, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 17.0, worst: 17.9, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 18.0, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U18: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 14.5, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 14.5, worst: 15.4, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 15.5, worst: 16.4, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 16.5, worst: 17.4, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 17.5, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  Adult: {
    direction: 'lower_is_better',
    tiers: timeTiers([
      { label: 'Elite', best: null, worst: 14.0, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 14.0, worst: 14.9, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 15.0, worst: 15.9, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 16.0, worst: 16.9, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 17.0, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  }
};

// Value-based (higher is better)
export const YOYO_DISTANCE: Record<AgeGroup, BenchmarkTable> = {
  U12: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 1200, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 1199, worst: 900, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 899, worst: 600, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 599, worst: 400, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 399, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U15: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 1600, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 1599, worst: 1200, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 1199, worst: 800, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 799, worst: 500, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 499, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U18: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 2000, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 1999, worst: 1600, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 1599, worst: 1200, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 1199, worst: 800, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 799, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  Adult: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 2200, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 2199, worst: 1800, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 1799, worst: 1400, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 1399, worst: 1000, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 999, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  }
};

export const BROAD_JUMP_CM: Record<AgeGroup, BenchmarkTable> = {
  U12: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 160, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 159, worst: 140, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 139, worst: 115, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 114, worst: 90, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 89, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U15: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 185, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 184, worst: 160, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 159, worst: 135, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 134, worst: 110, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 109, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U18: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 210, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 209, worst: 185, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 184, worst: 160, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 159, worst: 135, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 134, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  Adult: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 220, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 219, worst: 195, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 194, worst: 170, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 169, worst: 145, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 144, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  }
};

export const MED_BALL_THROW_CM: Record<AgeGroup, BenchmarkTable> = {
  U12: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 450, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 449, worst: 380, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 379, worst: 300, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 299, worst: 220, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 219, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U15: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 550, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 549, worst: 460, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 459, worst: 370, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 369, worst: 280, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 279, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U18: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 650, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 649, worst: 540, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 539, worst: 430, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 429, worst: 320, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 319, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  Adult: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 700, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 699, worst: 580, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 579, worst: 460, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 459, worst: 350, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 349, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  }
};

export const SHOT_POWER_DISTANCE_M: Record<AgeGroup, BenchmarkTable> = {
  U12: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 25, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 24, worst: 20, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 19, worst: 15, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 14, worst: 10, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 9, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U15: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 30, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 29, worst: 25, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 24, worst: 18, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 17, worst: 12, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 11, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  U18: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 35, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 34, worst: 30, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 29, worst: 22, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 21, worst: 15, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 14, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  },
  Adult: {
    direction: 'higher_is_better',
    tiers: valueTiers([
      { label: 'Elite', best: null, worst: 40, ...TIER_SCORE_RANGES.Elite },
      { label: 'Advanced', best: 39, worst: 35, ...TIER_SCORE_RANGES.Advanced },
      { label: 'Developing', best: 34, worst: 25, ...TIER_SCORE_RANGES.Developing },
      { label: 'Below Average', best: 24, worst: 18, ...TIER_SCORE_RANGES['Below Average'] },
      { label: 'Beginner', best: 17, worst: null, ...TIER_SCORE_RANGES.Beginner }
    ])
  }
};

export const BALL_RETENTION_SECONDS: BenchmarkTable = {
  direction: 'higher_is_better',
  tiers: valueTiers([
    { label: 'Elite', best: null, worst: 25, ...TIER_SCORE_RANGES.Elite },
    { label: 'Advanced', best: 24, worst: 18, ...TIER_SCORE_RANGES.Advanced },
    { label: 'Developing', best: 17, worst: 12, ...TIER_SCORE_RANGES.Developing },
    { label: 'Below Average', best: 11, worst: 7, ...TIER_SCORE_RANGES['Below Average'] },
    { label: 'Beginner', best: 6.9, worst: null, ...TIER_SCORE_RANGES.Beginner }
  ])
};

// Generic banding helpers for “won out of N” drills.
export const OUT_OF_10_BANDS: Array<{ min: number; max: number; scoreMin: number; scoreMax: number }> = [
  { min: 9, max: 10, scoreMin: 90, scoreMax: 99 },
  { min: 7, max: 8, scoreMin: 75, scoreMax: 89 },
  { min: 5, max: 6, scoreMin: 55, scoreMax: 74 },
  { min: 3, max: 4, scoreMin: 35, scoreMax: 54 },
  { min: 0, max: 2, scoreMin: 10, scoreMax: 34 }
];

export const OUT_OF_5_BANDS: Array<{ min: number; max: number; scoreMin: number; scoreMax: number }> = [
  { min: 5, max: 5, scoreMin: 90, scoreMax: 99 },
  { min: 4, max: 4, scoreMin: 75, scoreMax: 89 },
  { min: 3, max: 3, scoreMin: 55, scoreMax: 74 },
  { min: 2, max: 2, scoreMin: 35, scoreMax: 54 },
  { min: 0, max: 1, scoreMin: 10, scoreMax: 34 }
];

// Direct mappings (count-based)
export const OUT_OF_10_DIRECT: Record<number, number> = {
  10: 99,
  9: 88,
  8: 77,
  7: 66,
  6: 55,
  5: 44,
  4: 33,
  3: 22,
  2: 10,
  1: 10,
  0: 10
};

export const COACH_SCORE_1_TO_10: Record<number, number> = {
  10: 99,
  9: 88,
  8: 77,
  7: 66,
  6: 55,
  5: 44,
  4: 33,
  3: 22,
  2: 10,
  1: 10
};
