// Form input controls for user profile attributes and household preferences.
import type { ReactElement } from 'react';
import type { StoredProfile } from '../../services/profile.types.js';

/** Props for ProfileFormFields component. */
export interface ProfileFormFieldsProps {
  formData: StoredProfile;
  onChange: <K extends keyof StoredProfile>(field: K, value: StoredProfile[K]) => void;
}

const inputClass =
  'w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500';

function CommuteInputs({ formData, onChange }: ProfileFormFieldsProps): ReactElement {
  return (
    <>
      <div>
        <label htmlFor="field-commute" className="block text-xs font-semibold mb-1">
          Commute Mode
        </label>
        <select
          id="field-commute"
          value={formData.commuteMode}
          onChange={(e) => onChange('commuteMode', e.target.value)}
          className={inputClass}
        >
          <option value="metro">Delhi Metro</option>
          <option value="bus">Public Bus</option>
          <option value="two-wheeler">Two-Wheeler</option>
          <option value="car">Car (AC)</option>
          <option value="auto_rickshaw">Auto Rickshaw</option>
          <option value="walk">Walking</option>
        </select>
      </div>

      <div>
        <label htmlFor="field-distance" className="block text-xs font-semibold mb-1">
          Commute Distance (km)
        </label>
        <input
          id="field-distance"
          type="number"
          min="0"
          max="100"
          value={formData.commuteDistanceKm}
          onChange={(e) => onChange('commuteDistanceKm', Math.max(0, Number(e.target.value)))}
          className={inputClass}
        />
      </div>
    </>
  );
}

/**
 * Accessible form field grid for profile onboarding configuration.
 *
 * @param props - Active form values and field change handler.
 * @returns React component element.
 */
export function ProfileFormFields({ formData, onChange }: ProfileFormFieldsProps): ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div>
        <label htmlFor="field-city" className="block text-xs font-semibold mb-1">
          City Name
        </label>
        <input
          id="field-city"
          type="text"
          maxLength={100}
          value={formData.cityName}
          onChange={(e) => onChange('cityName', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="field-vulnerability" className="block text-xs font-semibold mb-1">
          Vulnerability
        </label>
        <select
          id="field-vulnerability"
          value={formData.vulnerability ?? 'healthy_adult'}
          onChange={(e) => onChange('vulnerability', e.target.value as StoredProfile['vulnerability'])}
          className={inputClass}
        >
          <option value="healthy_adult">Healthy Adult</option>
          <option value="child">Child (&lt; 12 yrs)</option>
          <option value="elderly">Elderly (&gt; 65 yrs)</option>
          <option value="respiratory">Respiratory Condition</option>
          <option value="pregnant">Pregnant</option>
        </select>
      </div>

      <CommuteInputs formData={formData} onChange={onChange} />

      <div>
        <label htmlFor="field-members" className="block text-xs font-semibold mb-1">
          Household Members
        </label>
        <input
          id="field-members"
          type="number"
          min="1"
          max="20"
          value={formData.householdMembers}
          onChange={(e) => onChange('householdMembers', Math.max(1, Number(e.target.value)))}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2 pt-5">
        <input
          id="field-purifier"
          type="checkbox"
          checked={formData.hasPurifier}
          onChange={(e) => onChange('hasPurifier', e.target.checked)}
          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
        />
        <label htmlFor="field-purifier" className="text-xs font-semibold cursor-pointer">
          Owns Air Purifier
        </label>
      </div>
    </div>
  );
}
