// Accessibility tests for BentoSidebar keyboard focus expansion and navigation attributes.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BentoSidebar } from './BentoSidebar.js';

describe('BentoSidebar', () => {
  it('supports keyboard focus-within expansion and accessible tab navigation', () => {
    const onSelectTab = vi.fn();
    render(
      <BentoSidebar
        activeTab="today"
        onSelectTab={onSelectTab}
        isDark={false}
        onToggleTheme={vi.fn()}
        onToggleLang={vi.fn()}
        onOpenTour={vi.fn()}
        onOpenProfile={vi.fn()}
      />
    );

    const aside = screen.getByLabelText('Sidebar navigation');
    expect(aside.className).toContain('focus-within:w-56');
    expect(aside.className).toContain('focus-within:shadow-xl');

    const communityBtn = screen.getByRole('button', { name: 'Community Kit' });
    const spans = communityBtn.querySelectorAll('span');
    expect(spans[0]?.className).toContain('min-w-[44px]');
    expect(spans[0]?.className).toContain('min-h-[44px]');
    expect(spans[1]?.className).toContain('group-focus-within:opacity-100');

    fireEvent.click(communityBtn);
    expect(onSelectTab).toHaveBeenCalledWith('community');
  });
});
