// Compatibility re-export for manual reading fallback module.
export {
  clearManualReading,
  createManualReading,
  createManualReadingFromPm25,
  getManualReading,
  saveManualReading,
} from './manualReading.js';
export type {
  ManualAirQualityData,
  ManualReadingInput,
} from './manualReading.js';
