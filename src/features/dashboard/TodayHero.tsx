// Two-column hero with data-derived headline, supportive summary, skyline SVG, and overlaid AQI card.
import type { ReactElement } from 'react';
import type { AqiCategory } from '../../domain/types.js';
import { LIGHT_AQI_TOKENS } from '../../styles/tokens.js';
import { CitySkylineSvg } from './CitySkylineSvg.js';

/** Props for TodayHero component. */
export interface TodayHeroProps {
  readonly cityName?: string;
  readonly aqi?: number;
  readonly category?: AqiCategory;
  readonly dominantPollutant?: string;
  readonly timestamp?: string;
  readonly sourceLabel?: string;
  readonly isEstimate?: boolean;
  readonly className?: string;
}

function getSupportiveSentence(category?: AqiCategory): string {
  switch (category) {
    case 'Severe':
      return 'Atmospheric inversion suppresses dispersion; seal windows and run indoor air filtration.';
    case 'Very Poor':
    case 'Poor':
      return 'Elevated particulate concentrations present; wear an N95 mask during unavoidable outdoor trips.';
    case 'Moderate':
    case 'Satisfactory':
      return 'Air quality is acceptable for healthy individuals; sensitive groups should moderate exertion.';
    case 'Good':
      return 'Clean ambient air conditions ideal for outdoor exercise and active natural ventilation.';
    default:
      return 'Select your city, use your location, or enter a reading to see live air quality and advice.';
  }
}

function HeroAqiCard(props: {
  aqi: number;
  category: AqiCategory;
  dominantPollutant: string;
  timestamp?: string;
  sourceLabel?: string;
  isEstimate: boolean;
}): ReactElement {
  const { aqi, category, dominantPollutant, timestamp, sourceLabel, isEstimate } = props;
  const token = LIGHT_AQI_TOKENS[category] ?? LIGHT_AQI_TOKENS.Moderate;

  return (
    <div className="sm:absolute sm:bottom-4 sm:left-4 mt-3 sm:mt-0 p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-md max-w-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
        <span aria-hidden="true">{token.icon}</span>
        <span className="uppercase">{category}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium">
          {dominantPollutant}
        </span>
      </div>
      <div className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight my-0.5">
        {aqi}
      </div>
      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
        {timestamp && <span>Observed: <time>{timestamp}</time> • </span>}
        <span>Source: {sourceLabel ?? 'Live Data'}</span>
        {isEstimate ? ' • estimated' : ''}
      </div>
    </div>
  );
}

/**
 * Renders the top Today dashboard hero with breadcrumb, adaptive headline, skyline, and overlaid AQI card.
 *
 * @param props - Environmental metrics, city identity, and provenance details.
 * @returns React component element.
 */
export function TodayHero(props: TodayHeroProps): ReactElement {
  const { cityName = 'Your City', aqi, category = 'Moderate', dominantPollutant = 'PM2.5', timestamp, sourceLabel, isEstimate = true, className = '' } = props;
  const headline = aqi !== undefined ? `Today's air in ${cityName} is ${category}` : 'Check your local air quality';
  const supportive = getSupportiveSentence(aqi !== undefined ? category : undefined);

  return (
    <section aria-label="Today Air Overview" className={`space-y-4 ${className}`.trim()}>
      <nav aria-label="Breadcrumb" className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
        <span>Home</span> <span className="mx-1">/</span> <span className="text-neutral-900 dark:text-neutral-100 font-semibold">Today</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <h2 className="sr-only">{cityName}</h2>
          <p className="text-3xl sm:text-4xl font-normal tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight">
            {headline}
          </p>
        </div>
        <div>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {supportive}
          </p>
        </div>
      </div>

      <div className="relative">
        <CitySkylineSvg category={aqi !== undefined ? category : undefined} aqi={aqi} />
        {aqi !== undefined && (
          <HeroAqiCard
            aqi={aqi}
            category={category}
            dominantPollutant={dominantPollutant}
            timestamp={timestamp}
            sourceLabel={sourceLabel}
            isEstimate={isEstimate}
          />
        )}
      </div>
    </section>
  );
}
