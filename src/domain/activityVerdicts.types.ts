// Type definitions for activity verdict evaluation across daily lifestyle routines.

/** Supported daily lifestyle activity identifiers. */
export type ActivityId =
  | 'morning_walk'
  | 'kids_playground'
  | 'jogging_exercise'
  | 'school_run'
  | 'opening_windows'
  | 'drying_laundry'
  | 'two_wheeler_commute';

/** Actionable safety verdict levels. */
export type ActivityVerdict = 'Go' | 'Wait' | 'Avoid';

/** Activity verdict item with actionable safety recommendation. */
export interface ActivityVerdictItem {
  readonly id: ActivityId;
  readonly title: string;
  readonly verdict: ActivityVerdict;
  readonly safeWindow?: string;
  readonly reason: string;
  readonly maskRecommendation?: string;
}
