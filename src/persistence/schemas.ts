import { z } from 'zod';
import type { Player, StaffMember } from '../types';
import { isStaffPosition } from '../types';

const finiteNumber = z.number().finite();
const nonNegativeNumber = finiteNumber.min(0);

const playerOffenseSchema = z.object({
  id: z.string().min(1),
  gameOpponent: z.string().optional(),
  gameId: z.string().optional(),
  date: z.string(),
  cardType: z.enum(['Yellow', 'Red', 'Second Yellow', 'Straight Red']),
  reason: z.string(),
  matchMinute: nonNegativeNumber.optional()
});

const mvpAwardRecordSchema = z.object({
  id: z.string().min(1),
  date: z.string(),
  opponent: z.string().optional(),
  note: z.string().optional()
});

const baseAttributesSchema = z.object({
  pace: finiteNumber,
  stamina: finiteNumber,
  agility: finiteNumber,
  strength: finiteNumber,
  firstTouch: finiteNumber,
  shortPassing: finiteNumber
});

const legacyAttributesSchema = z.object({
  speed: finiteNumber.optional(),
  shooting: finiteNumber.optional(),
  passing: finiteNumber.optional(),
  dribbling: finiteNumber.optional(),
  defending: finiteNumber.optional(),
  physicalness: finiteNumber.optional()
}).passthrough();

const playerInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  number: finiteNumber,
  position: z.string().min(1),
  bio: z.string(),
  photoUrl: z.string(),
  age: nonNegativeNumber.optional(),
  height: nonNegativeNumber.optional(),
  weight: nonNegativeNumber.optional(),
  specialtyTraits: z.array(z.string()).optional(),
  coachNotes: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  since: z.string().optional(),
  dateOfBirth: z.string().optional(),
  fprdsRole: z.enum(['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK']).optional(),
  fprdsAgeGroupPreference: z.enum(['U12', 'U15', 'U18', 'Adult']).optional(),
  fprdsLastAssessmentId: z.string().optional(),
  gamesPlayed: nonNegativeNumber.default(0),
  points: nonNegativeNumber.default(0),
  assists: nonNegativeNumber.default(0),
  cleanSheetsOrRebounds: nonNegativeNumber.default(0),
  minutesPlayed: nonNegativeNumber.default(0),
  mvpAwards: nonNegativeNumber.default(0),
  mvpHistory: z.array(mvpAwardRecordSchema).optional(),
  yellowCards: nonNegativeNumber.default(0),
  redCards: nonNegativeNumber.default(0),
  offenses: z.array(playerOffenseSchema).optional(),
  baseAttributes: baseAttributesSchema.optional(),
  positionAttributes: z.record(z.string(), finiteNumber).optional(),
  attributes: legacyAttributesSchema.optional(),
  registrationStatus: z.enum(['Active', 'Pending', 'Suspended']).default('Active')
}).passthrough();

export const migratePlayer = (input: z.input<typeof playerInputSchema>): Player => {
  const parsed = playerInputSchema.parse(input);
  const legacy = parsed.attributes;
  let baseAttributes = parsed.baseAttributes;
  let positionAttributes = parsed.positionAttributes;

  if (!baseAttributes && legacy) {
    baseAttributes = {
      pace: legacy.speed ?? 50,
      stamina: legacy.physicalness ?? 50,
      agility: legacy.dribbling ?? 50,
      strength: legacy.physicalness ?? 50,
      firstTouch: legacy.dribbling ?? 50,
      shortPassing: legacy.passing ?? 50
    };

    const offense = legacy.shooting ?? 50;
    const defense = legacy.defending ?? 50;
    const passing = legacy.passing ?? 50;
    if (parsed.position === 'Forward') {
      positionAttributes = { Finishing: offense, 'Long Shots': offense, 'Offensive 1v1': legacy.dribbling ?? 50, 'Attacking Heading': offense };
    } else if (parsed.position === 'Midfielder') {
      positionAttributes = { 'Long Passing': passing, Vision: passing, 'Ball Retention': legacy.dribbling ?? 50, Pressing: defense };
    } else if (parsed.position === 'Defender') {
      positionAttributes = { Tackling: defense, 'Defensive Heading': defense, Positioning: defense, Crossing: passing };
    } else if (parsed.position === 'Goalkeeper') {
      positionAttributes = { Reflexes: defense, Handling: defense, Diving: defense, Distribution: passing };
    }
  }

  return {
    ...parsed,
    yellowCards: parsed.yellowCards ?? 0,
    redCards: parsed.redCards ?? 0,
    offenses: parsed.offenses ?? [],
    baseAttributes: baseAttributes ?? {
      pace: 50,
      stamina: 50,
      agility: 50,
      strength: 50,
      firstTouch: 50,
      shortPassing: 50
    },
    positionAttributes: positionAttributes ?? {}
  } as Player;
};

export const playerSchema = playerInputSchema.transform(migratePlayer);
export const playersSchema = z.array(playerSchema);

export const staffMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string(),
  photoUrl: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  since: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active')
});
export const staffMembersSchema = z.array(staffMemberSchema);

export const paymentLedgerEntrySchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  playerNameSnapshot: z.string().min(1),
  type: z.enum(['charge', 'payment', 'waiver', 'refund', 'adjustment']),
  category: z.enum(['registration', 'monthly_fee', 'coach_fee', 'kit', 'tournament', 'training', 'other']),
  amount: finiteNumber.gt(0),
  date: z.string().min(1),
  dueDate: z.string().optional(),
  method: z.enum(['cash', 'gcash', 'bank_transfer', 'card', 'other']).optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().optional(),
  voidedAt: z.string().optional(),
  voidReason: z.string().optional()
}).strict();
export const paymentLedgerSchema = z.array(paymentLedgerEntrySchema);

export const migrateLegacyRoster = (
  records: Player[]
): { players: Player[]; staff: StaffMember[] } => records.reduce<{ players: Player[]; staff: StaffMember[] }>(
  (result, record) => {
    if (isStaffPosition(record.position)) {
      const legacyContact = record as Player & { email?: string; phone?: string; since?: string };
      result.staff.push({
        id: record.id,
        name: record.name,
        role: record.position,
        bio: record.bio,
        photoUrl: record.photoUrl,
        email: legacyContact.email,
        phone: legacyContact.phone,
        since: legacyContact.since,
        status: record.registrationStatus === 'Suspended' ? 'Inactive' : 'Active'
      });
    } else {
      result.players.push(record);
    }
    return result;
  },
  { players: [], staff: [] }
);

export const teamInfoSchema = z.object({
  name: z.string().min(1),
  founded: z.string(),
  stadium: z.string(),
  coach: z.string(),
  league: z.string(),
  logoColor: z.string(),
  logoUrl: z.string().optional()
});

export const gameSchema = z.object({
  id: z.string().min(1),
  opponent: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  status: z.enum(['Upcoming', 'Completed', 'Cancelled']),
  type: z.enum(['League', 'Cup', 'Friendly', 'Training', 'Meeting']),
  ourScore: nonNegativeNumber.optional(),
  opponentScore: nonNegativeNumber.optional(),
  scorers: z.array(z.object({
    playerId: z.string().optional(),
    playerName: z.string(),
    count: nonNegativeNumber
  })).optional(),
  creditedPlayerIds: z.array(z.string()).optional(),
  mvpId: z.string().optional(),
  notes: z.string().optional()
});
export const gamesSchema = z.array(gameSchema);

export const standingSchema = z.object({
  rank: finiteNumber,
  teamName: z.string().min(1),
  played: nonNegativeNumber,
  won: nonNegativeNumber,
  drawn: nonNegativeNumber,
  lost: nonNegativeNumber,
  goalsFor: nonNegativeNumber,
  goalsAgainst: nonNegativeNumber,
  points: finiteNumber,
  isUserTeam: z.boolean().optional()
});
export const standingsSchema = z.array(standingSchema);

export const announcementSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
  date: z.string(),
  category: z.enum(['Urgent', 'Matchday', 'Training', 'Social']),
  author: z.string()
});
export const announcementsSchema = z.array(announcementSchema);

const rawBaseSchema = z.object({
  sprint10mSeconds: finiteNumber,
  sprint30mSeconds: finiteNumber,
  yoyoMeters: finiteNumber,
  illinoisSeconds: finiteNumber,
  broadJumpCm: finiteNumber,
  medicineBallThrowCm: finiteNumber,
  firstTouchSuccessesOutOf10: finiteNumber,
  shortPassingSuccessesOutOf10: finiteNumber,
  shortPassingGateWidthModifier: z.enum(['standard', 'u12_wide']).optional()
});

const assessmentRawResultsSchema = z.object({
  role: z.enum(['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK']),
  assessmentType: z.enum(['Full', 'Quick']),
  base: rawBaseSchema,
  roleSpecific: z.record(z.string(), finiteNumber)
});

const developmentPlanSchema = z.object({
  focusAttributeId: z.string(),
  priorityScore: finiteNumber,
  weeks: z.array(z.object({
    weekNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    focus: z.string(),
    drillIds: z.array(z.string()),
    notes: z.string()
  }))
});

export const assessmentSessionSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  assessmentDate: z.string(),
  createdAt: z.string(),
  assessmentType: z.enum(['Full', 'Quick']),
  ageGroup: z.enum(['U12', 'U15', 'U18', 'Adult']),
  role: z.enum(['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK']),
  rawResults: assessmentRawResultsSchema,
  attributeScores: z.record(z.string(), finiteNumber),
  ovr: finiteNumber,
  labels: z.object({
    weakestAttributeId: z.string(),
    ovrTierLabel: z.string()
  }),
  deltas: z.object({
    previousSessionId: z.string().optional(),
    ovrDelta: finiteNumber.optional(),
    attributeDeltas: z.record(z.string(), finiteNumber).optional()
  }),
  coachNotes: z.string().optional(),
  developmentPlan: developmentPlanSchema.optional()
});
export const assessmentsSchema = z.array(assessmentSessionSchema);

export const availabilitySchema = z.record(
  z.string(),
  z.record(z.string(), z.enum(['yes', 'no', 'maybe']))
);
export const coachNotesSchema = z.record(z.string(), z.string());

export const scheduledDrillSchema = z.object({
  id: z.string(),
  drillId: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  fatigueIncrease: finiteNumber,
  playerId: z.string().optional(),
  playerName: z.string().optional()
}).passthrough();

export const weeklyScheduleSchema = z.object({
  Monday: z.array(scheduledDrillSchema),
  Tuesday: z.array(scheduledDrillSchema),
  Wednesday: z.array(scheduledDrillSchema),
  Thursday: z.array(scheduledDrillSchema),
  Friday: z.array(scheduledDrillSchema),
  Saturday: z.array(scheduledDrillSchema),
  Sunday: z.array(scheduledDrillSchema)
});

export const standingsBackupSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  label: z.string(),
  source: z.enum(['manual', 'sunday']),
  standings: standingsSchema
});
export const standingsBackupsSchema = z.array(standingsBackupSchema);

export const tacticsPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: finiteNumber,
  position: z.string(),
  condition: z.string(),
  photoUrl: z.string(),
  isLegend: z.boolean()
}).passthrough();
export const tacticsLineupSchema = z.record(z.string(), tacticsPlayerSchema);

export const tacticsNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.enum(['Formation', 'Set Pieces', 'Strategy', 'General']),
  createdAt: z.string()
}).passthrough();
export const tacticsNotesSchema = z.array(tacticsNoteSchema);

export const draggedPositionsSchema = z.record(
  z.string(),
  z.object({ left: finiteNumber, top: finiteNumber })
);

export const drawingPathsSchema = z.array(z.object({
  color: z.string(),
  width: finiteNumber,
  points: z.array(z.tuple([finiteNumber, finiteNumber]))
}));

export const playerExtrasSchema = z.record(z.string(), z.object({
  status: z.enum(['starting', 'substitute', 'injured']),
  yellowCards: nonNegativeNumber,
  redCards: nonNegativeNumber
}));

export const stringArraySchema = z.array(z.string());
export const booleanSchema = z.boolean();
export const stringSchema = z.string();
export const matchFormatSchema = z.enum(['11-a-side', '9-a-side', '8-a-side', '7-a-side', '6-a-side', '5-a-side']);
