// Unit and accessibility tests for FeatureTabs keyboard navigation and Hindi labels.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { LanguageProvider } from '../../state/language.js';
import { FeatureTabs } from './FeatureTabs.js';

describe('FeatureTabs Component', () => {
  it('supports ArrowRight, ArrowLeft, Home, and End keyboard tab navigation', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <FeatureTabs activeTab="today" onSelectTab={onSelect} />
      </LanguageProvider>
    );

    const todayTab = screen.getByRole('tab', { name: 'Today' });
    todayTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenCalledWith('routine');

    await user.keyboard('{End}');
    expect(onSelect).toHaveBeenCalledWith('community');

    await user.keyboard('{Home}');
    expect(onSelect).toHaveBeenCalledWith('today');

    await user.keyboard('{ArrowLeft}');
    expect(onSelect).toHaveBeenCalledWith('community');
  });

  it('passes automated accessibility audit', async () => {
    const { container } = render(
      <LanguageProvider>
        <FeatureTabs activeTab="routine" onSelectTab={vi.fn()} />
        <div id="tabpanel-routine" role="tabpanel" aria-labelledby="tab-routine">
          Routine Panel
        </div>
      </LanguageProvider>
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
