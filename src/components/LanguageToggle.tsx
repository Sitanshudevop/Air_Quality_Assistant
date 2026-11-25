// Accessible English/Hindi language toggle button with lang="hi" scoping.
import type { ReactElement } from 'react';
import { useLanguage } from '../state/language.js';
import { Button } from './ui/Button.js';

/** Props for LanguageToggle component. */
export interface LanguageToggleProps {
  readonly className?: string;
}

/**
 * Accessible toggle switching UI language between English and Hindi.
 *
 * @param props - Optional styling class name.
 * @returns React button element with lang="hi" pronunciation scope.
 */
export function LanguageToggle({ className = '' }: LanguageToggleProps): ReactElement {
  const { language, toggleLanguage } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      aria-pressed={isHindi}
      aria-label={isHindi ? 'Switch language to English' : 'Switch language to Hindi'}
      className={className}
    >
      {isHindi ? (
        <span>English</span>
      ) : (
        <span lang="hi">हिन्दी</span>
      )}
    </Button>
  );
}
