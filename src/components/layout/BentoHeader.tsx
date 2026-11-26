// Slim top header for Bento dashboard: greeting, pill search bar, Demo/Live toggle.
import type { FormEvent, ReactElement } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import type { OperatingMode } from '../../state/mode.js';
import { useLanguage } from '../../state/language.js';
import type { AqiCategory } from '../../domain/types.js';

/** Props for BentoHeader component. */
export interface BentoHeaderProps {
  readonly mode: OperatingMode;
  readonly onToggleMode: () => void;
  readonly cityName?: string;
  readonly category?: AqiCategory;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onSearchSubmit: () => void;
  readonly onUseLocation: () => void;
  readonly onToggleManual?: () => void;
}

function severityColorClass(cat?: AqiCategory): string {
  if (cat === 'Good' || cat === 'Satisfactory') return 'text-emerald-600 dark:text-emerald-400';
  if (cat === 'Moderate') return 'text-amber-600 dark:text-amber-400';
  if (cat === 'Poor') return 'text-orange-600 dark:text-orange-400';
  return 'text-rose-600 dark:text-rose-400';
}

function GreetingText(props: { cityName?: string; category?: AqiCategory }): ReactElement {
  const { t } = useLanguage();
  if (!props.cityName || !props.category) {
    return (
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-bento-ink dark:text-white">
          {t('app.title')}
        </h1>
        <p className="text-xs text-bento-muted dark:text-neutral-400">
          {t('app.subtitle')}
        </p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-lg font-extrabold tracking-tight text-bento-ink dark:text-white">
        Today&apos;s air in {props.cityName} is{' '}
        <span className={severityColorClass(props.category)}>{props.category}</span>
      </h1>
      <p className="text-xs text-bento-muted dark:text-neutral-400">
        {t('app.title')} • {t('app.subtitle')}
      </p>
    </div>
  );
}

/**
 * Slim Bento dashboard top header with greeting, pill city search, and mode toggle.
 *
 * @param props - Mode, search, location, and city/category state.
 * @returns React element.
 */
export function BentoHeader({
  mode, onToggleMode, cityName, category, searchQuery,
  onSearchChange, onSearchSubmit, onUseLocation, onToggleManual,
}: BentoHeaderProps): ReactElement {
  const handleFormSubmit = (e: FormEvent): void => {
    e.preventDefault();
    onSearchSubmit();
  };
  const modeLabel = `Current mode is ${mode}. Click to switch to ${mode === 'demo' ? 'live' : 'demo'} mode.`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4">
      <GreetingText cityName={cityName} category={category} />

      <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end min-w-0">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="flex items-center gap-2 flex-1 bg-bento-canvas dark:bg-neutral-800 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-bento-ink/25">
            <Search size={14} className="text-bento-muted shrink-0" aria-hidden="true" />
            <label htmlFor="live-city-search" className="sr-only">Search city</label>
            <input
              id="live-city-search"
              type="search"
              maxLength={100}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search city..."
              aria-label="Search city"
              className="flex-1 bg-transparent text-xs text-bento-ink dark:text-white placeholder-bento-muted outline-none min-w-0"
            />
            <button type="button" onClick={onUseLocation} aria-label="Use My Location" title="Use My Location" className="text-bento-muted hover:text-bento-ink dark:hover:text-white transition-colors">
              <MapPin size={14} />
            </button>
          </div>
        </form>

        {mode === 'live' && onToggleManual && (
          <button
            type="button"
            onClick={onToggleManual}
            aria-label="Manual AQI"
            title="Enter Manual AQI"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-bento-canvas dark:bg-neutral-800 text-xs font-semibold text-bento-ink dark:text-neutral-200 hover:bg-neutral-200/70 transition-colors"
          >
            <SlidersHorizontal size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Manual AQI</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMode}
          aria-label={modeLabel}
          className="inline-flex rounded-full p-0.5 bg-bento-canvas dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-bento-ink/40 shrink-0"
        >
          <span className={`px-3.5 py-1.5 rounded-full capitalize transition-colors ${mode === 'demo' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink shadow-sm' : 'text-bento-muted'}`}>
            Demo
          </span>
          <span className={`px-3.5 py-1.5 rounded-full capitalize transition-colors ${mode === 'live' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink shadow-sm' : 'text-bento-muted'}`}>
            Live
          </span>
        </button>
      </div>
    </header>
  );
}
