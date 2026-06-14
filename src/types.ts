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
  email?: string;
  phone?: string;
  since?: string;
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
  attributes?: any; // Deprecated, kept for migration type safety
  registrationStatus: 'Active' | 'Pending' | 'Suspended';
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
  scorers?: Array<{ playerName: string; count: number }>;
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

