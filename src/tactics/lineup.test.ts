import { describe, expect, it } from 'vitest';
import {
  buildPositionAwareLineup,
  type LineupSlot,
  type TacticsPlayer
} from './lineup';

const player = (
  id: string,
  position: string,
  rating: number
): TacticsPlayer => ({
  id,
  name: id,
  position,
  rating,
  condition: 'B',
  photoUrl: ''
});

const slots: LineupSlot[] = [
  { role: 'CF' },
  { role: 'LWF' },
  { role: 'AMF' },
  { role: 'CMF' },
  { role: 'LB' },
  { role: 'CB' },
  { role: 'RB' },
  { role: 'GK' }
];

describe('position-aware tactics lineup', () => {
  it('fills a complete roster with compatible position groups', () => {
    const result = buildPositionAwareLineup({
      players: [
        player('gk', 'Goalkeeper', 80),
        player('cb-1', 'Defender', 79),
        player('cb-2', 'Defender', 78),
        player('cb-3', 'Defender', 77),
        player('cm-1', 'Midfielder', 83),
        player('cm-2', 'Midfielder', 81),
        player('fw-1', 'Forward', 85),
        player('fw-2', 'Forward', 82)
      ],
      slots,
      size: slots.length,
      preserveAssignments: false
    });

    expect(result[7].id).toBe('gk');
    expect([result[4].id, result[5].id, result[6].id]).toEqual(
      expect.arrayContaining(['cb-1', 'cb-2', 'cb-3'])
    );
    expect([result[2].id, result[3].id]).toEqual(expect.arrayContaining(['cm-1', 'cm-2']));
    expect([result[0].id, result[1].id]).toEqual(expect.arrayContaining(['fw-1', 'fw-2']));
  });

  it('fills goalkeeper slots before outfield slots', () => {
    const result = buildPositionAwareLineup({
      players: [player('gk', 'Goalkeeper', 50), player('star', 'Forward', 99)],
      slots: [{ role: 'CF' }, { role: 'GK' }],
      size: 2,
      preserveAssignments: false
    });

    expect(result[1].id).toBe('gk');
    expect(result[0].id).toBe('star');
  });

  it('preserves valid manual assignments and refreshes their slot role', () => {
    const manual = player('manual', 'Forward', 60);
    const refreshed = { ...manual, name: 'Updated name', rating: 70 };
    const result = buildPositionAwareLineup({
      players: [refreshed, player('gk', 'Goalkeeper', 80)],
      slots: [{ role: 'CF' }, { role: 'GK' }],
      size: 2,
      currentLineup: { 0: manual },
      preserveAssignments: true
    });

    expect(result[0]).toMatchObject({ id: 'manual', name: 'Updated name', rating: 70, position: 'CF' });
    expect(result[1].id).toBe('gk');
  });

  it('removes stale and duplicate manual assignments', () => {
    const repeated = player('same', 'Midfielder', 75);
    const result = buildPositionAwareLineup({
      players: [repeated, player('other', 'Forward', 70)],
      slots: [{ role: 'CMF' }, { role: 'CF' }, { role: 'GK' }],
      size: 3,
      currentLineup: {
        0: repeated,
        1: repeated,
        2: player('removed', 'Goalkeeper', 90)
      },
      preserveAssignments: true
    });

    expect(Object.values(result).map(item => item.id)).toEqual(['same', 'other']);
    expect(new Set(Object.values(result).map(item => item.id)).size).toBe(2);
  });

  it('uses deterministic outfield fallbacks without placing an outfield player in goal', () => {
    const result = buildPositionAwareLineup({
      players: [
        player('defender', 'Defender', 80),
        player('midfielder', 'Midfielder', 75),
        player('forward', 'Forward', 70)
      ],
      slots: [{ role: 'GK' }, { role: 'CB' }, { role: 'CF' }],
      size: 3,
      preserveAssignments: false
    });

    expect(result[0]).toBeUndefined();
    expect(result[1].id).toBe('defender');
    expect(result[2].id).toBe('forward');
  });

  it('never assigns more players than are available', () => {
    const result = buildPositionAwareLineup({
      players: [player('only', 'Forward', 80)],
      slots,
      size: slots.length,
      preserveAssignments: false
    });

    expect(Object.values(result)).toHaveLength(1);
    expect(Object.values(result)[0].id).toBe('only');
    expect(result[0]).toMatchObject({ id: 'only', position: 'CF' });
    expect(result[7]).toBeUndefined();
  });
});
