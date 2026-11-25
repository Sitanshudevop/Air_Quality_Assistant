// Unit tests for global language store, LanguageProvider, and useLanguage hook.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getLanguage, LanguageProvider, setLanguage, useLanguage } from './language.js';

function LangProbe() {
  const { language, toggleLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="label">{t('nav.today')}</span>
      <button type="button" onClick={toggleLanguage}>
        Toggle
      </button>
    </div>
  );
}

describe('Language State & Provider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLanguage('en');
  });

  it('provides reactive language state and translates via LanguageProvider', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LangProbe />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Today');

    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('lang')).toHaveTextContent('hi');
    expect(screen.getByTestId('label')).toHaveTextContent('आज');
    expect(getLanguage()).toBe('hi');
  });

  it('works with module-level setLanguage and fallback outside provider', () => {
    render(<LangProbe />);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    act(() => {
      setLanguage('hi');
    });
    expect(getLanguage()).toBe('hi');
  });
});
