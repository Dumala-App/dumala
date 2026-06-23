import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import StaffProfileModal from './StaffProfileModal';

describe('StaffProfileModal', () => {
  it('renders staff-specific details without athlete statistics', () => {
    const html = renderToStaticMarkup(
      <StaffProfileModal
        staff={{
          id: 'staff-1',
          name: 'Alex Coach',
          role: 'Head Coach',
          bio: 'Technical lead',
          photoUrl: '/staff.png',
          email: 'coach@example.com',
          status: 'Active'
        }}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(html).toContain('Management &amp; Staff');
    expect(html).toContain('Head Coach');
    expect(html).toContain('coach@example.com');
    expect(html).not.toContain('Season Stats');
    expect(html).not.toContain('Goals');
  });
});
