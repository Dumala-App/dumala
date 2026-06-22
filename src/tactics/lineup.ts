export interface TacticsPlayer {
  id: string;
  name: string;
  rating: number;
  position: string;
  condition: 'A' | 'B' | 'C' | 'D';
  photoUrl: string;
  isLegend?: boolean;
  attributes?: {
    speed: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physicalness: number;
  };
  number?: number;
  bio?: string;
  gamesPlayed?: number;
  points?: number;
  assists?: number;
  cleanSheetsOrRebounds?: number;
  minutesPlayed?: number;
  mvpAwards?: number;
  yellowCards?: number;
  redCards?: number;
  registrationStatus?: 'Active' | 'Pending' | 'Suspended';
}

export interface LineupSlot {
  role: string;
}

export type TacticsLineup = Record<number, TacticsPlayer>;

type PositionGroup = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';

export const getSlotPositionGroup = (role: string): PositionGroup => {
  if (role === 'GK') return 'Goalkeeper';
  if (role.includes('B') || role === 'DEF') return 'Defender';
  if (role.includes('MF') || role === 'MID') return 'Midfielder';
  return 'Forward';
};

export const getPlayerPositionGroup = (position: string): PositionGroup => {
  if (position === 'GK' || position === 'Goalkeeper') return 'Goalkeeper';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DEF', 'Defender'].includes(position)) return 'Defender';
  if (position.includes('MF') || position === 'MID' || position === 'Midfielder') return 'Midfielder';
  return 'Forward';
};

const POSITION_FALLBACKS: Record<PositionGroup, PositionGroup[]> = {
  Goalkeeper: ['Goalkeeper'],
  Defender: ['Defender', 'Midfielder', 'Forward'],
  Midfielder: ['Midfielder', 'Defender', 'Forward'],
  Forward: ['Forward', 'Midfielder', 'Defender']
};

const SLOT_PRIORITY: Record<PositionGroup, number> = {
  Goalkeeper: 0,
  Defender: 1,
  Midfielder: 2,
  Forward: 3
};

export const buildPositionAwareLineup = ({
  players,
  slots,
  size,
  currentLineup = {},
  preserveAssignments
}: {
  players: TacticsPlayer[];
  slots: LineupSlot[];
  size: number;
  currentLineup?: TacticsLineup;
  preserveAssignments: boolean;
}): TacticsLineup => {
  const playerById = new Map(players.map(player => [player.id, player]));
  const nextLineup: TacticsLineup = {};
  const assignedIds = new Set<string>();

  if (preserveAssignments) {
    for (let index = 0; index < size; index++) {
      const assigned = currentLineup[index];
      const currentPlayer = assigned ? playerById.get(assigned.id) : undefined;
      if (!currentPlayer || assignedIds.has(currentPlayer.id)) continue;

      nextLineup[index] = {
        ...currentPlayer,
        position: slots[index]?.role || currentPlayer.position
      };
      assignedIds.add(currentPlayer.id);
    }
  }

  const available = players
    .filter(player => !assignedIds.has(player.id))
    .sort((a, b) => (
      b.rating - a.rating
      || a.name.localeCompare(b.name)
      || a.id.localeCompare(b.id)
    ));
  const emptySlots = Array.from({ length: size }, (_, index) => index)
    .filter(index => !nextLineup[index])
    .sort((a, b) => (
      SLOT_PRIORITY[getSlotPositionGroup(slots[a]?.role || 'MID')]
      - SLOT_PRIORITY[getSlotPositionGroup(slots[b]?.role || 'MID')]
      || a - b
    ));

  const assignPlayer = (index: number, allowedGroups: PositionGroup[]): boolean => {
    const slotRole = slots[index]?.role || 'MID';
    let selectedIndex = -1;

    for (const group of allowedGroups) {
      selectedIndex = available.findIndex(player => getPlayerPositionGroup(player.position) === group);
      if (selectedIndex !== -1) break;
    }

    if (selectedIndex === -1) return false;
    const selectedPlayer = available.splice(selectedIndex, 1)[0];
    nextLineup[index] = { ...selectedPlayer, position: slotRole };
    return true;
  };

  // Give every slot its exact position group before broader outfield fallback.
  emptySlots.forEach((index) => {
    const slotGroup = getSlotPositionGroup(slots[index]?.role || 'MID');
    assignPlayer(index, [slotGroup]);
  });

  emptySlots.filter(index => !nextLineup[index]).forEach((index) => {
    const slotGroup = getSlotPositionGroup(slots[index]?.role || 'MID');
    assignPlayer(index, POSITION_FALLBACKS[slotGroup].slice(1));
  });

  return nextLineup;
};
