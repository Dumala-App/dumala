export interface PlayerOffense {
  id: string;
  gameOpponent?: string;
  gameId?: string;
  date: string;
  cardType: 'Yellow' | 'Red' | 'Second Yellow' | 'Straight Red';
  reason: string;
  matchMinute?: number;
}

export interface MvpAwardRecord {
  id: string;
  date: string;
  opponent?: string;
  note?: string;
}

export type AgeGroup = 'U12' | 'U15' | 'U18' | 'Adult';

export type FprdsRole = 'ST' | 'W' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';

export type FprdsAssessmentType = 'Full' | 'Quick';

export type FprdsAttributeId =
  // Base
  | 'pace'
  | 'stamina'
  | 'agility'
  | 'strength'
  | 'firstTouch'
  | 'shortPassing'
  // ST / W
  | 'finishingBox'
  | 'shotPower'
  | 'offensive1v1'
  | 'attackingHeading'
  // CM / CDM
  | 'longPassing'
  | 'visionPlaymaking'
  | 'ballRetention'
  | 'pressingInterceptions'
  // FB / CB
  | 'tackling'
  | 'defensiveHeading'
  | 'positioningClearances'
  | 'crossing'
  // GK
  | 'reflexes'
  | 'handling'
  | 'divingReach'
  | 'distribution';

export interface RawResultsBase {
  sprint10mSeconds: number;
  sprint30mSeconds: number;
  yoyoMeters: number;
  illinoisSeconds: number;
  broadJumpCm: number;
  medicineBallThrowCm: number;
  firstTouchSuccessesOutOf10: number;
  shortPassingSuccessesOutOf10: number;
  shortPassingGateWidthModifier?: 'standard' | 'u12_wide';
}

export interface RawResultsSTW {
  finishingGoalsOutOf6: number;
  finishingOnTargetOutOf6: number;
  shotPowerMaxControlledDistanceMeters: number;
  offensive1v1TakeonsOutOf10: number;
  attackingHeadingOnTargetOutOf10: number;
}

export interface RawResultsCMCDM {
  longPassing30mSuccessesOutOf5: number;
  longPassing40mSuccessesOutOf5: number;
  visionCoachScore1to10: number;
  ballRetentionBestSeconds: number;
  pressingWinsOutOf5: number;
}

export interface RawResultsFBCB {
  tacklingWinsOutOf10: number;
  defensiveHeadingClearancesOutOf10: number;
  positioningCoachScore1to10: number;
  positioningClearancesToSafeZoneOutOf10: number;
  crossingSuccessesOutOf10: number;
}

export interface RawResultsGK {
  gkReflexesSavesOutOf10: number;
  gkHandlingCleanCatchesOutOf10: number;
  gkDivingSavesOutOf10: number;
  gkDistributionSuccessesOutOf10: number;
}

export type AssessmentRawResults =
  // Striker / Winger
  | {
      role: 'ST';
      assessmentType: 'Full';
      base: RawResultsBase;
      roleSpecific: RawResultsSTW;
    }
  | {
      role: 'ST';
      assessmentType: 'Quick';
      base: RawResultsBase;
      roleSpecific: Pick<RawResultsSTW, 'finishingGoalsOutOf6' | 'finishingOnTargetOutOf6' | 'shotPowerMaxControlledDistanceMeters'>;
    }
  | {
      role: 'W';
      assessmentType: 'Full';
      base: RawResultsBase;
      roleSpecific: RawResultsSTW;
    }
  | {
      role: 'W';
      assessmentType: 'Quick';
      base: RawResultsBase;
      roleSpecific: Pick<RawResultsSTW, 'finishingGoalsOutOf6' | 'finishingOnTargetOutOf6' | 'offensive1v1TakeonsOutOf10'>;
    }
  // Midfield
  | {
      role: 'CM';
      assessmentType: 'Full';
      base: RawResultsBase;
      roleSpecific: RawResultsCMCDM;
    }
  | {
      role: 'CM';
      assessmentType: 'Quick';
      base: RawResultsBase;
      roleSpecific: Pick<RawResultsCMCDM, 'visionCoachScore1to10' | 'longPassing30mSuccessesOutOf5' | 'longPassing40mSuccessesOutOf5'>;
    }
  | {
      role: 'CDM';
      assessmentType: 'Full';
      base: RawResultsBase;
      roleSpecific: RawResultsCMCDM;
    }
  | {
      role: 'CDM';
      assessmentType: 'Quick';
      base: RawResultsBase;
      roleSpecific: Pick<RawResultsCMCDM, 'pressingWinsOutOf5' | 'longPassing30mSuccessesOutOf5' | 'longPassing40mSuccessesOutOf5'>;
    }
  // Defenders
  | {
      role: 'FB';
      assessmentType: 'Full';
      base: RawResultsBase;
      roleSpecific: RawResultsFBCB;
    }
  | {
      role: 'FB';
      assessmentType: 'Quick';
      base: RawResultsBase;
      roleSpecific: Pick<RawResultsFBCB, 'tacklingWinsOutOf10' | 'crossingSuccessesOutOf10'>;
    }
  | {
      role: 'CB';
      assessmentType: 'Full';
      base: RawResultsBase;
      roleSpecific: RawResultsFBCB;
    }
  | {
      role: 'CB';
      assessmentType: 'Quick';
      base: RawResultsBase;
      roleSpecific: Pick<RawResultsFBCB, 'tacklingWinsOutOf10' | 'defensiveHeadingClearancesOutOf10'>;
    }
  // Goalkeeper
  | {
      role: 'GK';
      assessmentType: 'Full';
      base: RawResultsBase;
      roleSpecific: RawResultsGK;
    }
  | {
      role: 'GK';
      assessmentType: 'Quick';
      base: RawResultsBase;
      roleSpecific: Pick<RawResultsGK, 'gkReflexesSavesOutOf10' | 'gkHandlingCleanCatchesOutOf10'>;
    };

export interface AssessmentDevelopmentPlanWeek {
  weekNumber: 1 | 2 | 3 | 4;
  focus: string;
  drillIds: string[];
  notes: string;
}

export interface AssessmentDevelopmentPlan {
  focusAttributeId: FprdsAttributeId;
  priorityScore: number;
  weeks: AssessmentDevelopmentPlanWeek[];
}

export interface AssessmentDeltas {
  previousSessionId?: string;
  ovrDelta?: number;
  attributeDeltas?: Partial<Record<FprdsAttributeId, number>>;
}

export interface LegacyPlayerAttributes {
  speed?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physicalness?: number;
  [key: string]: unknown;
}

export interface AssessmentSession {
  id: string;
  playerId: string;
  assessmentDate: string;
  createdAt: string;
  assessmentType: FprdsAssessmentType;
  ageGroup: AgeGroup;
  role: FprdsRole;
  rawResults: AssessmentRawResults;
  attributeScores: Record<FprdsAttributeId, number>;
  ovr: number;
  labels: {
    weakestAttributeId: FprdsAttributeId;
    ovrTierLabel: string;
  };
  deltas: AssessmentDeltas;
  coachNotes?: string;
  developmentPlan?: AssessmentDevelopmentPlan;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  bio: string;
  photoUrl: string;
  age?: number;
  height?: number;
  weight?: number;
  specialtyTraits?: string[];
  coachNotes?: string;
  dateOfBirth?: string;
  fprdsRole?: FprdsRole;
  fprdsAgeGroupPreference?: AgeGroup;
  fprdsLastAssessmentId?: string;
  gamesPlayed: number;
  points: number; // For soccer: goals; for basketball: points
  assists: number;
  cleanSheetsOrRebounds: number; // depends on sport
  minutesPlayed: number;
  mvpAwards: number;
  mvpHistory?: MvpAwardRecord[];
  yellowCards: number;
  redCards: number;
  offenses?: PlayerOffense[];
  baseAttributes: {
    pace: number;
    stamina: number;
    agility: number;
    strength: number;
    firstTouch: number;
    shortPassing: number;
  };
  positionAttributes: Record<string, number>;
  // Deprecated legacy migration boundary. New player data uses baseAttributes and positionAttributes.
  attributes?: LegacyPlayerAttributes;
  registrationStatus: 'Active' | 'Pending' | 'Suspended';
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  email?: string;
  phone?: string;
  since?: string;
  status: 'Active' | 'Inactive';
}

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

export const POSITION_ATTRIBUTES_MAP: Record<string, string[]> = {
  Forward: ['Finishing', 'Long Shots', 'Offensive 1v1', 'Attacking Heading'],
  Midfielder: ['Long Passing', 'Vision', 'Ball Retention', 'Pressing'],
  Defender: ['Tackling', 'Defensive Heading', 'Positioning', 'Crossing'],
  Goalkeeper: ['Reflexes', 'Handling', 'Diving', 'Distribution']
};

export interface SpecialtyTrait {
  label: string;
  icon: string;
}

export const SPECIALTY_TRAITS: Record<string, SpecialtyTrait[]> = {
  Forward: [
    { label: 'Speedster', icon: '⚡' },
    { label: 'Clinical Finisher', icon: '🎯' },
    { label: 'Target Man', icon: '📌' },
    { label: 'Dribbler', icon: '🕺' },
    { label: 'Poacher', icon: '🦊' },
    { label: 'False 9', icon: '🎭' },
    { label: 'Winger', icon: '🏃' },
    { label: 'First Touch', icon: '🤲' },
    { label: 'Aerial Threat', icon: '✈️' },
    { label: 'Counter Attack', icon: '💨' },
    { label: 'Link-Up Play', icon: '🔗' },
    { label: 'Chip Shot', icon: '🥄' }
  ],
  Midfielder: [
    { label: 'Playmaker', icon: '🎼' },
    { label: 'Box-to-Box', icon: '🏋️' },
    { label: 'Deep Lying', icon: '🧠' },
    { label: 'Engine', icon: '🔋' },
    { label: 'Dribbler', icon: '🕺' },
    { label: 'Long Shot Taker', icon: '🚀' },
    { label: 'Set Piece Specialist', icon: '🎪' },
    { label: 'Anchor', icon: '⚓' },
    { label: 'Tempo Setter', icon: '⏱️' },
    { label: 'Through Ball', icon: '🗝️' },
    { label: 'Ball Winner', icon: '🧹' },
    { label: 'Vision', icon: '👁️' }
  ],
  Defender: [
    { label: 'Wall', icon: '🧱' },
    { label: 'Speedster', icon: '⚡' },
    { label: 'Ball-Playing CB', icon: '🎨' },
    { label: 'Sweeper', icon: '🧹' },
    { label: 'Wingback Overlap', icon: '🏃' },
    { label: 'Man Marker', icon: '🔒' },
    { label: 'Aerial Dominant', icon: '✈️' },
    { label: 'Tackling Machine', icon: '🛡️' },
    { label: 'Last-Ditch Tackle', icon: '🦵' },
    { label: 'Offside Trap', icon: '📏' },
    { label: 'Crossing Expert', icon: '↗️' },
    { label: 'Leadership', icon: '📢' }
  ],
  Goalkeeper: [
    { label: 'Shot Stopper', icon: '🧤' },
    { label: 'Sweeper Keeper', icon: '🏃' },
    { label: 'Penalty Specialist', icon: '🥅' },
    { label: 'Commanding Presence', icon: '📢' },
    { label: 'Reflex King', icon: '⚡' },
    { label: 'Distribution Expert', icon: '🎯' },
    { label: 'One-on-One', icon: '🤼' },
    { label: 'Cross Collector', icon: '🙌' },
    { label: 'Long Throw', icon: '💪' },
    { label: 'Footwork', icon: '👣' }
  ]
};

export interface Game {
  id: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  type: 'League' | 'Cup' | 'Friendly' | 'Training' | 'Meeting';
  ourScore?: number;
  opponentScore?: number;
  scorers?: Array<{ playerId?: string; playerName: string; count: number }>;
  creditedPlayerIds?: string[];
  mvpId?: string;
  notes?: string;
}

export interface Standing {
  rank: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  isUserTeam?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Urgent' | 'Matchday' | 'Training' | 'Social';
  author: string;
}

export interface TeamInfo {
  name: string;
  founded: string;
  stadium: string;
  coach: string;
  league: string;
  logoColor: string;
  logoUrl?: string;
}

export const STAFF_POSITIONS = [
  'Team Owner',
  'Manager / Coach',
  'Founder',
  'Manager',
  'Coach',
  'Head Coach',
  'Assistant Coach',
  'President',
  'Vice President',
  'Director of Football',
  'Treasurer',
  'Secretary',
  'Staff'
];

export const isStaffPosition = (pos: string): boolean => {
  if (!pos) return false;
  return STAFF_POSITIONS.includes(pos) || [
    'founder', 'manager', 'coach', 'vice president', 'president', 'owner', 'director', 'staff'
  ].some(keyword => pos.toLowerCase().includes(keyword));
};
