// Accessibility tests for BentoSidebar focus-visible expansion and mouse-blur behavior.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BentoSidebar } from './BentoSidebar.js';

describe('BentoSidebar', () => {
  it('supports focus-visible keyboard expansion, 44px touch targets, and blurs on mouse click only', () => {
    const onSelectTab = vi.fn();
    render(
      <BentoSidebar
        activeTab="today"
        onSelectTab={onSelectTab}
        isDark={false}
        onToggleTheme={vi.fn()}
        onOpenTour={vi.fn()}
        onOpenProfile={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Switch language/i })).not.toBeInTheDocument();

    const aside = screen.getByLabelText('Sidebar navigation');
    expect(aside.className).toContain('has-[:focus-visible]:w-56');
    expect(aside.className).toContain('has-[:focus-visible]:shadow-xl');

    const communityBtn = screen.getByRole('button', { name: 'Community Kit' });
    const spans = communityBtn.querySelectorAll('span');
    expect(spans[0]?.className).toContain('min-w-[44px]');
    expect(spans[0]?.className).toContain('min-h-[44px]');
    expect(spans[1]?.className).toContain('group-has-[:focus-visible]:opacity-100');

    // Keyboard activation (detail === 0) preserves focus
    communityBtn.focus();
    expect(document.activeElement).toBe(communityBtn);
    fireEvent.click(communityBtn, { detail: 0 });
    expect(onSelectTab).toHaveBeenCalledWith('community');
    expect(document.activeElement).toBe(communityBtn);

    // Mouse click (detail > 0) blurs so sidebar collapses cleanly on mouse-out
    fireEvent.click(communityBtn, { detail: 1 });
    expect(document.activeElement).not.toBe(communityBtn);
  });
});
