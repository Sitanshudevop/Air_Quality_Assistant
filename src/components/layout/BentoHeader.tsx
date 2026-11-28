// Multi-tier responsive Bento header: logo + greeting + mobile utilities + search + GPS + mode toggle.
import type { FormEvent, ReactElement } from 'react';
import { Search, X, LocateFixed, Loader2, SlidersHorizontal, Sun, Moon, Compass, UserCircle } from 'lucide-react';
import type { OperatingMode } from '../../state/mode.js';
import type { AqiCategory } from '../../domain/types.js';
import { SaansLogo } from '../ui/SaansLogo.js';

/** Props for BentoHeader component. */
export interface BentoHeaderProps {
  readonly mode: OperatingMode;
  readonly onToggleMode: () => void;
  readonly cityName?: string;
  readonly category?: AqiCategory;
  readonly searchQuery: string;
  readonly isLocating?: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onSearchSubmit: () => void;
  readonly onUseLocation: () => void;
  readonly onToggleManual?: () => void;
  readonly isDark?: boolean;
  readonly onToggleTheme?: () => void;
  readonly onOpenTour?: () => void;
  readonly onOpenProfile?: () => void;
}

function severityColorClass(cat?: AqiCategory): string {
  if (cat === 'Good' || cat === 'Satisfactory') return 'text-emerald-700 dark:text-emerald-400';
  if (cat === 'Moderate') return 'text-amber-700 dark:text-amber-400';
  if (cat === 'Poor') return 'text-orange-700 dark:text-orange-400';
  return 'text-rose-700 dark:text-rose-400';
}

function GreetingText(props: { cityName?: string; category?: AqiCategory }): ReactElement {
  const titleText = !props.cityName || !props.category ? (
    'Saans'
  ) : (
    <>Today&apos;s air in {props.cityName} is <span className={severityColorClass(props.category)}>{props.category}</span></>
  );
  const subText = !props.cityName || !props.category ? 'Urban Air Quality Assistant' : 'Saans • Urban Air Quality Assistant';

  return (
    <div className="min-w-0 flex-1">
      <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-bento-ink dark:text-white line-clamp-2">
        {titleText}
      </h1>
      <p className="text-[11px] sm:text-xs text-slate-600 dark:text-neutral-300 truncate">{subText}</p>
    </div>
  );
}

function MobileUtilityCluster(props: Pick<BentoHeaderProps, 'isDark' | 'onToggleTheme' | 'onOpenTour' | 'onOpenProfile'>): ReactElement {
  const btnCls = 'md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-600 dark:text-neutral-300 hover:text-bento-ink hover:bg-bento-canvas dark:hover:text-white dark:hover:bg-neutral-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20';
  return (
    <div className="flex md:hidden items-center gap-0.5 shrink-0">
      {props.onToggleTheme && (
        <button type="button" onClick={props.onToggleTheme} aria-label={props.isDark ? 'Switch to light theme' : 'Switch to dark theme'} className={btnCls}>
          {props.isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      )}
      {props.onOpenTour && (
        <button type="button" onClick={props.onOpenTour} aria-label="Guided Tour" className={btnCls}>
          <Compass size={17} />
        </button>
      )}
      {props.onOpenProfile && (
        <button type="button" onClick={props.onOpenProfile} aria-label="Family Profile" className={btnCls}>
          <UserCircle size={17} />
        </button>
      )}
    </div>
  );
}

function SearchAndLocationBar(props: {
  searchQuery: string; isLocating: boolean; mode: OperatingMode;
  onSearchChange: (q: string) => void; onSubmit: (e: FormEvent) => void;
  onUseLocation: () => void; onToggleManual?: () => void;
}): ReactElement {
  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 xl:max-w-xl">
      <form onSubmit={props.onSubmit} className="flex items-center flex-1 min-w-0">
        <div className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/15 focus-within:border-slate-500 border border-slate-400 dark:bg-neutral-800 dark:border-neutral-600 dark:focus-within:bg-neutral-900 rounded-full px-3.5 min-h-[44px] transition-all w-full max-w-md min-w-0">
          <Search size={15} className="text-slate-600 dark:text-neutral-300 shrink-0" aria-hidden="true" />
          <label htmlFor="live-city-search" className="sr-only">Search city</label>
          <input
            id="live-city-search" type="search" maxLength={100} value={props.searchQuery}
            spellCheck={false} autoComplete="off"
            onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Search city..." aria-label="Search city"
            className="bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 appearance-none [&::-webkit-search-cancel-button]:hidden w-full min-h-[44px] text-sm text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-neutral-300 p-0 min-w-0"
          />
          {props.searchQuery && (
            <button
              type="button" onClick={() => props.onSearchChange('')} aria-label="Clear search"
              className="text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white shrink-0 min-w-[44px] min-h-[44px] sm:min-w-[28px] sm:min-h-[28px] inline-flex items-center justify-center rounded-full transition-colors -my-2 -mr-1.5 sm:my-0 sm:mr-0"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>
      <button
        type="button" onClick={props.onUseLocation} disabled={props.isLocating} aria-label="Use My Location"
        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 sm:px-3.5 py-2 rounded-full bg-bento-ice text-bento-ink text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
      >
        {props.isLocating ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <LocateFixed size={14} aria-hidden="true" />}
        <span className="hidden min-[480px]:inline">{props.isLocating ? 'Locating...' : 'Use My Location'}</span>
        <span className="min-[480px]:hidden">{props.isLocating ? 'Locating...' : 'Location'}</span>
      </button>
      {props.mode === 'live' && props.onToggleManual && (
        <button
          type="button" onClick={props.onToggleManual} aria-label="Manual AQI" title="Manual AQI"
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-bento-canvas dark:bg-neutral-800 text-xs font-semibold text-bento-ink dark:text-neutral-200 hover:bg-neutral-200/70 transition-colors shrink-0 border border-slate-300 dark:border-neutral-600"
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Manual AQI</span>
          <span className="sm:hidden">Manual</span>
        </button>
      )}
    </div>
  );
}

/**
 * Multi-tier responsive Bento header preventing overlap across mobile, tablet, laptop, and desktop.
 *
 * @param props - Mode, search, location, city/category, and mobile utility callbacks.
 * @returns React element.
 */
export function BentoHeader(props: BentoHeaderProps): ReactElement {
  const { mode, onToggleMode, cityName, category, searchQuery, isLocating = false, onSearchChange, onSearchSubmit, onUseLocation, onToggleManual } = props;
  const modeLabel = `Demo Live mode switch. Current mode is ${mode}. Click to switch to ${mode === 'demo' ? 'live' : 'demo'} mode.`;

  return (
    <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 px-3.5 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <SaansLogo className="w-9 h-9 md:hidden" />
          <GreetingText cityName={cityName} category={category} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <MobileUtilityCluster {...props} />
          <button
            type="button" onClick={onToggleMode} aria-label={modeLabel}
            className="inline-flex items-center min-h-[44px] rounded-full p-1 bg-bento-canvas dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-bento-ink/40 shrink-0"
          >
            <span className={`px-3 py-1.5 rounded-full capitalize transition-colors ${mode === 'demo' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink shadow-sm' : 'text-slate-700 dark:text-neutral-300'}`}>Demo</span><span className="whitespace-pre"> </span><span className={`px-3 py-1.5 rounded-full capitalize transition-colors ${mode === 'live' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink shadow-sm' : 'text-slate-700 dark:text-neutral-300'}`}>Live</span>
          </button>
        </div>
      </div>

      <SearchAndLocationBar
        searchQuery={searchQuery} isLocating={isLocating} mode={mode} onSearchChange={onSearchChange}
        onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }} onUseLocation={onUseLocation} onToggleManual={onToggleManual}
      />
    </header>
  );
}
