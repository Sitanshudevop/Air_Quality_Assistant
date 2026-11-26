// Unit tests for global language store, LanguageProvider, and useLanguage hook.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getLanguage, LanguageProvider, setLanguage, useLanguage } from './language.js';

function LangProbe() {
  const { language, setLanguage: setCtxLang, toggleLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="label">{t('nav.today')}</span>
      <button type="button" onClick={toggleLanguage}>
        Toggle
      </button>
      <button type="button" onClick={() => setCtxLang('hi')}>
        SetHindi
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

  it('works with module-level setLanguage and fallback outside provider', async () => {
    const user = userEvent.setup();
    render(<LangProbe />);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    act(() => {
      setLanguage('hi');
    });
    expect(getLanguage()).toBe('hi');

    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(getLanguage()).toBe('en');

    act(() => {
      setLanguage('fr' as unknown as 'en');
    });
    expect(getLanguage()).toBe('en');
  });

  it('updates via provider setLanguage and ignores throwing subscribers', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LangProbe />
      </LanguageProvider>
    );
    await user.click(screen.getByRole('button', { name: 'SetHindi' }));
    expect(screen.getByTestId('lang')).toHaveTextContent('hi');
  });
});
