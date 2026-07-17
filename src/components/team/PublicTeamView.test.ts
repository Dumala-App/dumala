import { describe, expect, it } from 'vitest';
import { orderStaffByRole } from './PublicTeamView';

// The RPC sends staff sorted by name, so the coach who runs the team can land
// anywhere in the list. The public page lifts leadership to the top.
const staff = (...entries: Array<[string, string]>) => entries.map(([name, role]) => ({ name, role }));

describe('orderStaffByRole', () => {
  it('puts the manager and head coach first, whatever the incoming order', () => {
    const ordered = orderStaffByRole(staff(
      ['Aaron Zamora', 'Staff'],
      ['Bianca Cruz', 'Assistant Coach'],
      ['Carlos Reyes', 'Head Coach'],
      ['Diego Santos', 'Manager / Coach']
    ));

    expect(ordered.map(member => member.name)).toEqual([
      'Diego Santos',
      'Carlos Reyes',
      'Bianca Cruz',
      'Aaron Zamora'
    ]);
  });

  it('keeps every staff member, including unrecognised roles', () => {
    const input = staff(
      ['Elena Torres', 'Founder'],
      ['Fernando Lim', 'Treasurer'],
      ['Carlos Reyes', 'Head Coach'],
      ['Gina Cruz', 'Kit Manager']
    );

    expect(orderStaffByRole(input)).toHaveLength(input.length);
    expect(orderStaffByRole(input)[0].name).toBe('Carlos Reyes');
  });

  it('holds unrecognised roles at the back in the order they arrived', () => {
    const ordered = orderStaffByRole(staff(
      ['Elena Torres', 'Founder'],
      ['Fernando Lim', 'Treasurer'],
      ['Diego Santos', 'Manager']
    ));

    expect(ordered.map(member => member.name)).toEqual(['Diego Santos', 'Elena Torres', 'Fernando Lim']);
  });

  it('matches roles regardless of case and padding', () => {
    const ordered = orderStaffByRole(staff(
      ['Aaron Zamora', 'Staff'],
      ['Carlos Reyes', '  head coach  ']
    ));

    expect(ordered[0].name).toBe('Carlos Reyes');
  });

  it('does not mutate the caller\'s array', () => {
    const input = staff(['Aaron Zamora', 'Staff'], ['Carlos Reyes', 'Head Coach']);
    orderStaffByRole(input);

    expect(input.map(member => member.name)).toEqual(['Aaron Zamora', 'Carlos Reyes']);
  });
});
