export const MATCH_FORMAT_CONFIG = {
  '11-a-side': {
    size: 11,
    formations: [
      '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-1-2-3',
      '3-4-3', '4-1-4-1', '5-3-2', '5-4-1', '4-5-1',
      '4-3-1-2', '3-4-2-1', '4-4-1-1', '4-3-2-1'
    ]
  },
  '9-a-side': {
    size: 9,
    formations: [
      '3-3-2', '3-2-3', '2-3-3', '4-3-1', '3-4-1',
      '2-4-2', '2-3-2-1'
    ]
  },
  '8-a-side': {
    size: 8,
    formations: [
      '2-3-2', '3-2-2', '2-2-2-1', '3-2-1-1',
      '2-3-1-1', '1-3-2-1'
    ]
  },
  '7-a-side': {
    size: 7,
    formations: [
      '2-3-1', '3-2-1', '2-1-2-1', '1-3-2',
      '2-2-2', '3-1-2', '1-2-1-2', '1-4-1'
    ]
  },
  '6-a-side': {
    size: 6,
    formations: [
      '2-2-1', '2-1-2', '1-2-2', '1-3-1', '3-1-1'
    ]
  },
  '5-a-side': {
    size: 5,
    formations: [
      '1-2-1', '2-1-1', '1-1-2', '2-0-2',
      '1-3-0', '0-2-2', '1-0-3'
    ]
  }
} as const;

export type MatchFormat = keyof typeof MATCH_FORMAT_CONFIG;

export const getDefaultFormation = (matchFormat: MatchFormat) => MATCH_FORMAT_CONFIG[matchFormat].formations[0];

export const isFormationValidForFormat = (matchFormat: MatchFormat, formation: string) => (
  (MATCH_FORMAT_CONFIG[matchFormat].formations as readonly string[]).includes(formation)
);
