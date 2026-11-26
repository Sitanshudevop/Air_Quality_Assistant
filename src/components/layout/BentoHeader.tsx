// Slim top header for Bento dashboard: greeting, pill search bar, Demo/Live toggle, quick actions.
import { type ReactElement, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import type { OperatingMode } from '../../state/mode.js';
import { useLanguage } from '../../state/language.js';
import type { AqiCategory } from '../../domain/types.js';

/** Props for BentoHeader component. */
export interface BentoHeaderProps {
  readonly mode: OperatingMode;
  readonly onToggleMode: () => void;
  readonly cityName?: string;
  readonly category?: AqiCategory;
  readonly onSearchCity: (query: string) => void;
  readonly onUseLocation: () => void;
  readonly onLaunchDemo: () => void;
}

function categoryLabel(cat?: AqiCategory): string {
  if (!cat) return '';
  const map: Record<AqiCategory, string> = {
    Good: 'Good', Satisfactory: 'Satisfactory', Moderate: 'Moderate',
    Poor: 'Poor', 'Very Poor': 'Very Poor', Severe: 'Severe',
  };
  return map[cat] ?? cat;
}

/** Greeting text shown in the header. */
function GreetingText(props: { cityName?: string; category?: AqiCategory }): ReactElement {
  const { t } = useLanguage();
  if (!props.cityName || !props.category) {
    return (
      <div>
        <p className="text-sm font-bold text-bento-ink dark:text-white">{t('app.name')}</p>
        <p className="text-xs text-bento-muted">Search a city to see live air quality</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm font-bold text-bento-ink dark:text-white">
        Air in {props.cityName} is{' '}
        <span className="text-rose-600 dark:text-rose-400">{categoryLabel(props.category)}</span>
      </p>
      <p className="text-xs text-bento-muted dark:text-neutral-400">Urban Air Quality Assistant</p>
    </div>
  );
}

/**
 * Slim Bento dashboard top header with greeting, search, and mode toggle.
 *
 * @param props - Mode, callbacks, city and category for greeting text.
 * @returns React element.
 */
export function BentoHeader({
  mode, onToggleMode, cityName, category, onSearchCity, onUseLocation,
}: BentoHeaderProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (): void => {
    const val = inputRef.current?.value.trim() ?? '';
    if (val) onSearchCity(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') handleSearch();
  };

  const modeLabel = `Current mode: ${mode}. Click to switch to ${mode === 'demo' ? 'live' : 'demo'}.`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
      <GreetingText cityName={cityName} category={category} />

      {/* Search pill */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm">
        <div className="flex items-center gap-2 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2 border border-neutral-200 dark:border-neutral-700">
          <Search size={14} className="text-neutral-400 flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            id="live-city-search"
            type="search"
            placeholder="Search city..."
            aria-label="Search city"
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs text-bento-ink dark:text-white placeholder-neutral-400 outline-none min-w-0"
          />
          <button type="button" onClick={onUseLocation} aria-label="Use my location" className="text-neutral-400 hover:text-bento-ink transition-colors">
            <MapPin size={14} />
          </button>
        </div>
      </div>

      {/* Demo / Live toggle */}
      <button
        type="button"
        onClick={onToggleMode}
        aria-label={modeLabel}
        className="inline-flex rounded-full p-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-bento-ink/40 flex-shrink-0"
      >
        <span className={`px-3 py-1 rounded-full capitalize transition-colors ${mode === 'demo' ? 'bg-bento-ink text-white shadow-sm' : 'text-neutral-500'}`}>
          Demo
        </span>
        <span className={`px-3 py-1 rounded-full capitalize transition-colors ${mode === 'live' ? 'bg-bento-ink text-white shadow-sm' : 'text-neutral-500'}`}>
          Live
        </span>
      </button>
    </header>
  );
}
