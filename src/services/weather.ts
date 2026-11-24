// Compatibility re-export for forecast and weather service modules.
export {
  buildWeatherUrl,
  clearForecastCache,
  detectInversion,
  fetchForecast,
  getWeatherSummary,
  parseHourlyForecast,
  parseWeatherFactors,
  weatherSchema,
} from './forecast.js';
