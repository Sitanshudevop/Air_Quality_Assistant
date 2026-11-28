// Community Smog Action Kit view with AQI-band checklists and WhatsApp notice generator.
import type { ReactElement } from 'react';
import type { AqiCategory } from '../../domain/types.js';
import type { DemoPersonaId } from '../../constants/demo/types.js';
import type { CommunityTemplateId } from '../../utils/deepLink.js';
import { COMMUNITY_ACTIONS_BY_BAND } from './communityData.js';
import { CommunityNoticeCard } from './CommunityNoticeCard.js';

/** Props for CommunityKitView component. */
export interface CommunityKitViewProps {
  readonly aqi: number;
  readonly category: AqiCategory;
  readonly cityName: string;
  readonly template?: CommunityTemplateId;
  readonly persona?: DemoPersonaId;
}

/**
 * Displays RWA/school action checklist calibrated to current AQI band and WhatsApp circular builder.
 *
 * @param props - Active AQI, CPCB category, city name, and optional deep-link template/persona.
 * @returns Accessible Community Kit section element.
 */
export function CommunityKitView({
  aqi,
  category,
  cityName,
  template,
  persona,
}: CommunityKitViewProps): ReactElement {
  const actions = COMMUNITY_ACTIONS_BY_BAND[category];

  return (
    <section aria-labelledby="community-heading" className="space-y-4">
      <div>
        <h2
          id="community-heading"
          className="text-lg font-bold"
        >
          Community Smog Action Kit
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Recommended RWA, school, and neighbourhood actions for {cityName} —{' '}
          <span className="font-semibold">
            {category}
          </span>{' '}
          (Est. AQI {Math.round(aqi)})
        </p>
      </div>

      <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-2">
        <h3 className="text-sm font-bold">Checklist for {category} Band</h3>
        <ul className="list-disc list-inside text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5">
          {actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>

      <CommunityNoticeCard cityName={cityName} aqi={aqi} category={category} template={template} persona={persona} />
    </section>
  );
}
