# Project: Saans (Urban Air Quality Assistant)

## Architecture
Saans is an urban air quality assistant tailored for North Indian cities experiencing severe winter smog.
The architecture enforces strict separation of concerns across pure domain mathematics, resilient data providers, WCAG 2.2 AA user interfaces, and a hardened serverless AI proxy:

```
[User Browser / WCAG 2.2 AA UI] (React 18, Tailwind CSS, Inline Accessible SVG)
       │
       ├── State & Modes (src/state/mode.ts, LocalStorage profile)
       │       │
       │       ▼
       ├── Services Layer (src/services/ - Open-Meteo AQ, Forecast, Geocoding, Caching, Fallback)
       │       │
       ├── Domain Engine (src/domain/ - Pure TS: CPCB AQI, Exposure Inhaled Dose, Deterministic Rules)
       │       │
       └── Serverless AI Proxy (api/ai.ts, server/ - Allow-listed tasks, Numeric Grounding Assertion, Gemini Fallback)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | CPCB AQI Calculator | Pure TS piecewise linear breakpoint calculation (PM2.5/PM10, capped at 500 Severe) | M1 | prompt.md §39 |
| 2 | Relative Inhaled Dose Model | Quantified exposure change (%) factoring ventilation, duration, environment, mask, vulnerability | M1 | prompt.md §40 |
| 3 | Assumptions & Citations Registry | Typed single source of truth for all coefficients, ranges, units, and scientific citations | M1 | prompt.md §40 |
| 4 | Daily Routine Rule Engine | Deterministic time-blocked routine generator based on AQI category, profile, and diurnal patterns | M1 | prompt.md §31, §41 |
| 5 | Indoor Air Quality Rules | Room-specific hacks, purifier CADR sizing formulas, ventilation windows, and myth busting | M1 | prompt.md §32, §41 |
| 6 | Sustainable Alternatives Engine | Quantified exposure change (%) and CO2e delta (g/trip) across transport/lifestyle modes | M1 | prompt.md §33, §41 |
| 7 | Open-Meteo Air Quality Client | Live and 48h hourly pollutant fetching with Zod validation and AbortController timeout | M2 | prompt.md §26 |
| 8 | Open-Meteo Weather Forecast Client | Weather mixing factors (temp, humidity, wind speed, pressure) with Zod validation | M2 | prompt.md §26 |
| 9 | Open-Meteo Geocoding Client | City search and geocoding resolution with debouncing and safe query handling | M2 | prompt.md §26 |
| 10 | Dual-Tier Cache Manager | In-memory + sessionStorage caching with 10-15 min TTL | M2 | prompt.md §58 |
| 11 | Manual Reading Entry Fallback | User fallback ("Enter your purifier AQI or PM2.5") tagged "user-entered reading" | M2 | prompt.md §26 |
| 12 | Frozen Demo Snapshots & Personas | Curated offline data for Delhi, Lucknow, Mumbai, Bengaluru and 3 household personas | M2 | prompt.md §25 |
| 13 | Dual Mode State Manager | Live vs Demo toggle, demo default on first load, persistent demo banner | M2 | prompt.md §24-25 |
| 14 | User Profile Storage & Versioning | LocalStorage persistence with Zod schema, version migrations, and "Clear my data" | M2 | prompt.md §29 |
| 15 | Welcoming Screen & Guided Tour | First-load greeting, 1-click demo launch, and 5-step skippable focus-trapped modal tour | M3 | prompt.md §25, §67 |
| 16 | Today Condition Dashboard | AQI category, pollutant breakdown, WHO/NAAQS comparison, and weather mixing explanations | M3 | prompt.md §30 |
| 17 | Hourly Outlook Chart & Table | Accessible inline SVG 24-48h forecast chart + accessible data table alternative | M3 | prompt.md §30 |
| 18 | WCAG 2.2 AA Calm Design Tokens | Light & dark themes meeting 4.5:1 text and 3:1 control contrast; flat aesthetic | M3 | prompt.md §55, §60, §67 |
| 19 | Serverless AI Proxy Core | Allow-listed tasks (5 tasks), server-held system prompts, and Zod response validation | M4 | prompt.md §44-51 |
| 20 | Numeric Grounding Verification | Server-side assertion that all numbers in LLM text exist in context.facts; retry then rules | M4 | prompt.md §47 |
| 21 | Provenance Tracking & Badge | Source badge (gemini vs rules), model name, cached flag, and interactive retry button | M4 | prompt.md §8, §34 |
| 22 | Safety & Red-Flag Triage Engine | Intercepts medical advice and red-flag symptoms with immediate hospital advisory | M4 | prompt.md §48 |
| 23 | Prompt-Alignment Test Suite | 10 diverse prompts testing Hindi, injections, off-topic, medical, and URLs | M4 | prompt.md §59, §68 |
| 24 | Time-Blocked Daily Routine UI | Interactive daily schedule with why/facts drawers, effort, cost band, and AI narrative | M5 | prompt.md §31, §69 |
| 25 | Indoor Air Quality Hacks UI | Room selector, ventilation timer, CADR calculator, CR-box guide, myth busting | M5 | prompt.md §32, §69 |
| 26 | "What If I Choose...?" Explainer UI | Side-by-side scenario comparison with % relative dose delta and CO2e per trip delta | M5 | prompt.md §33, §69 |
| 27 | Grounded Assistant Chat UI | Accessible chat panel with provenance badges, suggestion chips, and error retry | M5 | prompt.md §9, §34, §48 |
| 28 | Community Smog Action Kit | Actions by AQI band and copyable WhatsApp broadcast notice generator | M5 | prompt.md §35, §69 |
| 29 | Hindi Localization (SHOULD) | English / Hindi toggle with lang="hi" attributes on translated UI elements | M5 | prompt.md §36, §60 |
| 30 | Print-Friendly Smog Plan (SHOULD) | High-contrast @media print stylesheet for clean family emergency plan printing | M5 | prompt.md §36 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Domain Engine | Pure TS logic: CPCB AQI, exposure model, assumptions, deterministic rules (Features 1-6) | none | DONE |
| M2 | Data Layer & Modes | Open-Meteo APIs, dual-tier cache, manual fallback, demo snapshots, personas, profile (Features 7-14) | M1 | DONE |
| M3 | Core UI & Accessibility | Welcome screen, 5-step tour, today dashboard, hourly SVG chart & table, WCAG tokens (Features 15-18) | M1, M2 | DONE |
| M4 | Serverless AI Proxy | 5 allow-listed tasks, grounding verification, provenance, safety triage, 10 prompt tests (Features 19-23) | M1 | PLANNED |
| M5 | Feature Modules & Final E2E | Routine UI, indoor UI, what-if UI, chat UI, community kit UI, Hindi/print, full E2E pass (Features 24-30) | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### Domain Engine (`src/domain/`)
- `calculateAqi(pm25: number, pm10?: number): AqiResult`
  - Returns `{ aqi: number, category: AqiCategory, dominantPollutant: 'PM2.5' | 'PM10', isEstimate: boolean }`
  - Clamps negative values to 0; caps AQI at 500 (Severe).
- `calculateRelativeDose(params: ExposureParams): ExposureResult`
  - Returns `{ relativeDose: number, baselineDose: number, percentageChange: number, uncertaintyRange: [number, number] }`
- `ASSUMPTIONS: Record<string, AssumptionRecord>`
  - Static dictionary with value, low, high, unit, citation, isEstimate.
- `generateRoutine(category: AqiCategory, profile: UserProfile, forecast: HourlyPoint[]): RoutineItem[]`
- `getIndoorRecommendations(params: IndoorParams): IndoorRecommendations`
- `compareAlternatives(params: AlternativeParams): AlternativeComparison`

### Data Layer (`src/services/`)
- `fetchAirQuality(lat: number, lon: number, signal?: AbortSignal): Promise<AirQualityData>`
- `fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<ForecastData>`
- `searchLocations(query: string, signal?: AbortSignal): Promise<GeocodingLocation[]>`
- `getProfile(): UserProfile; saveProfile(profile: UserProfile): void; clearProfile(): void`
- `DEMO_SNAPSHOTS: Record<CityId, DemoSnapshot>; DEMO_PERSONAS: Record<PersonaId, PersonaRecord>`

### Serverless AI Proxy (`api/ai.ts`, `server/`)
- `POST /api/ai`
  - Request body: `{ task: TaskName, context: TaskContext, userText?: string }`
  - Response: `{ success: true, result: TaskResult, provenance: Provenance }`
  - Tasks: `narrate-plan`, `explain-impact`, `chat`, `indoor-tips`, `community-message`

## Code Layout
- `src/domain/`: Pure domain logic and calculations (no React, no network, no DOM).
- `src/services/`: API clients, storage, caching, geolocation.
- `src/state/`: React context or lightweight state management for mode and profile.
- `src/features/`: Feature modules (onboarding, dashboard, outlook, routine, indoor, impact, assistant, community).
- `src/components/ui/`: Reusable WCAG 2.2 AA design token components (Badge, Modal, Button, Tabs).
- `src/constants/`: Constants, demo snapshots, personas.
- `src/styles/`: Design tokens (`tokens.css`), Tailwind utilities, print styles.
- `api/`: Vercel serverless function entry points (`ai.ts`, `ai-status.ts`).
- `server/`: Serverless business logic (cache, gemini client, rate limit, grounding, safety, prompts).
- `shared/`: Shared Zod schemas and TypeScript types.
- `tests/`: E2E test runner and prompt-alignment test suite.
