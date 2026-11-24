// Curated 5-step guided tour definitions for new users.
import type { TourStep } from './types.js';

/** Curated 5-step guided tour sequence. */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 1,
    category: 'Operating Modes',
    title: 'Dual Operating Modes',
    description:
      'Switch between Live Mode (real Open-Meteo forecasts for your city) and Demo Mode (curated smog scenarios for Delhi, Lucknow, Mumbai, and Bengaluru). No API key required.',
  },
  {
    id: 2,
    category: 'Ground Truth AQI',
    title: 'Real-Time AQI & Weather Mixing',
    description:
      'View estimated CPCB AQI calculated from PM2.5/PM10, pollutant breakdowns, WHO/NAAQS guideline comparisons, and plain-words explanations of thermal inversions and calm winds.',
  },
  {
    id: 3,
    category: 'Forecast Outlook',
    title: '24-48h Hourly Outlook & Fresh Air Windows',
    description:
      'Explore hourly trends via our accessible SVG chart or data table. Easily identify the best outdoor activity windows (afternoon solar mixing) and safe room flush times.',
  },
  {
    id: 4,
    category: 'Daily Routine',
    title: 'Personalized Daily Routine',
    description:
      'Get an explainable, time-blocked low-emission routine matching your household profile, commute mode, and purifier ownership.',
  },
  {
    id: 5,
    category: 'AI Assistant',
    title: 'Grounded AI Assistant',
    description:
      'Consult our Gemini-powered assistant for personalized indoor hacks and smog advice. Every response carries a visible provenance badge and strict scientific grounding.',
  },
] as const;
