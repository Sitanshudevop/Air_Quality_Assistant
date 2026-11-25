// Unit and accessibility tests for LanguageToggle component.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { LanguageProvider, setLanguage } from '../state/language.js';
import { LanguageToggle } from './LanguageToggle.js';

describe('LanguageToggle Component', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLanguage('en');
  });

  it('renders Hindi label with lang="hi" and toggles language state', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>
    );

    const btn = screen.getByRole('button', { name: /Switch language to Hindi/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn.querySelector('[lang="hi"]')).toBeInTheDocument();

    await user.click(btn);
    expect(screen.getByRole('button', { name: /Switch language to English/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('passes automated accessibility audit', async () => {
    const { container } = render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
