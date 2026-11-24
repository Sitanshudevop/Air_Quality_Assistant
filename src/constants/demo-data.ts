// Curated demo data barrel export for snapshots and household personas.
export {
  DEMO_SNAPSHOTS,
  getSnapshot,
} from './demo/snapshots.js';
export {
  DEMO_PERSONAS,
  getPersona,
} from './demo/personas.js';
export {
  deepFreeze,
  generateDiurnalHourly,
} from './demo/generator.js';
export type {
  DemoCityId,
  DemoPersonaId,
  DemoSnapshot,
  DemoPersona,
  DemoSnapshotPollutants,
  DemoSnapshotWeather,
} from './demo/types.js';
