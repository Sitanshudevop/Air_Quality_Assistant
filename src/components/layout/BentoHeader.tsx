// Multi-tier responsive Bento header: logo + greeting + mobile utilities + search + GPS + mode toggle.
import type { FormEvent, ReactElement } from 'react';
import { Search, LocateFixed, Loader2, SlidersHorizontal, Languages, Sun, Moon, Compass, UserCircle } from 'lucide-react';
import type { OperatingMode } from '../../state/mode.js';
import { useLanguage } from '../../state/language.js';
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
  readonly onToggleLang?: () => void;
  readonly onOpenTour?: () => void;
  readonly onOpenProfile?: () => void;
}

function severityColorClass(cat?: AqiCategory): string {
  if (cat === 'Good' || cat === 'Satisfactory') return 'text-emerald-600 dark:text-emerald-400';
  if (cat === 'Moderate') return 'text-amber-600 dark:text-amber-400';
  if (cat === 'Poor') return 'text-orange-600 dark:text-orange-400';
  return 'text-rose-600 dark:text-rose-400';
}

function GreetingText(props: { cityName?: string; category?: AqiCategory }): ReactElement {
  const { t } = useLanguage();
  const titleText = !props.cityName || !props.category ? (
    t('app.title')
  ) : (
    <>Today&apos;s air in {props.cityName} is <span className={severityColorClass(props.category)}>{props.category}</span></>
  );
  const subText = !props.cityName || !props.category ? t('app.subtitle') : `${t('app.title')} • ${t('app.subtitle')}`;

  return (
    <div className="min-w-0 flex-1">
      <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-bento-ink dark:text-white line-clamp-2">
        {titleText}
      </h1>
      <p className="text-[11px] sm:text-xs text-bento-muted dark:text-neutral-400 truncate">{subText}</p>
    </div>
  );
}

function MobileUtilityCluster(props: Pick<BentoHeaderProps, 'isDark' | 'onToggleTheme' | 'onToggleLang' | 'onOpenTour' | 'onOpenProfile'>): ReactElement {
  const btnCls = 'md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-500 hover:text-bento-ink hover:bg-bento-canvas dark:hover:text-white dark:hover:bg-neutral-800 transition-colors';
  return (
    <div className="flex md:hidden items-center gap-0.5 shrink-0">
      {props.onToggleLang && (
        <button type="button" onClick={props.onToggleLang} aria-label="Switch language" className={btnCls}>
          <Languages size={17} />
        </button>
      )}
      {props.onToggleTheme && (
        <button type="button" onClick={props.onToggleTheme} aria-label={props.isDark ? 'Switch to light theme' : 'Switch to dark theme'} className={btnCls}>
          {props.isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      )}
      {props.onOpenTour && (
        <button type="button" onClick={props.onOpenTour} aria-label="Tour" className={btnCls}>
          <Compass size={17} />
        </button>
      )}
      {props.onOpenProfile && (
        <button type="button" onClick={props.onOpenProfile} aria-label="Profile" className={btnCls}>
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
        <div className="flex items-center gap-2 flex-1 min-w-0 min-h-[44px] bg-bento-canvas dark:bg-neutral-800 rounded-full px-3.5 py-2 focus-within:ring-2 focus-within:ring-bento-ink/25">
          <Search size={14} className="text-bento-muted shrink-0" aria-hidden="true" />
          <label htmlFor="live-city-search" className="sr-only">Search city</label>
          <input
            id="live-city-search" type="search" maxLength={100} value={props.searchQuery}
            onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Search city..." aria-label="Search city"
            className="flex-1 bg-transparent text-xs text-bento-ink dark:text-white placeholder-bento-muted outline-none min-w-0"
          />
        </div>
      </form>
      <button
        type="button" onClick={props.onUseLocation} disabled={props.isLocating} aria-label="Use My Location"
        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 sm:px-3.5 py-2 rounded-full bg-bento-ice text-bento-ink text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
      >
        {props.isLocating ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <LocateFixed size={14} aria-hidden="true" />}
        <span className="hidden min-[480px]:inline">{props.isLocating ? 'Locating...' : 'Use My Location'}</span>
        <span className="min-[480px]:hidden">{props.isLocating ? '...' : 'Locate'}</span>
      </button>
      {props.mode === 'live' && props.onToggleManual && (
        <button
          type="button" onClick={props.onToggleManual} aria-label="Manual AQI" title="Enter Manual AQI"
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-bento-canvas dark:bg-neutral-800 text-xs font-semibold text-bento-ink dark:text-neutral-200 hover:bg-neutral-200/70 transition-colors shrink-0"
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
  const modeLabel = `Current mode is ${mode}. Click to switch to ${mode === 'demo' ? 'live' : 'demo'} mode.`;

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
            <span className={`px-3 py-1.5 rounded-full capitalize transition-colors ${mode === 'demo' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink shadow-sm' : 'text-bento-muted'}`}>Demo</span>
            <span className={`px-3 py-1.5 rounded-full capitalize transition-colors ${mode === 'live' ? 'bg-bento-ink text-white dark:bg-white dark:text-bento-ink shadow-sm' : 'text-bento-muted'}`}>Live</span>
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
