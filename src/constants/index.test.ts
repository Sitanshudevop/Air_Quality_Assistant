// Unit tests for centralized application constants.
import { describe, it, expect } from 'vitest';
import {
  AQI_THRESHOLDS,
  API_TIMEOUTS,
  CACHE_CONFIG,
  RATE_LIMIT_CONFIG,
  GEMINI_MODELS,
  ERROR_MESSAGES,
} from './index.js';

describe('Application Constants', () => {
  it('defines valid AQI thresholds', () => {
    expect(AQI_THRESHOLDS.GOOD_MAX).toBe(50);
    expect(AQI_THRESHOLDS.SEVERE_MAX).toBe(300);
  });

  it('defines API timeout constants', () => {
    expect(API_TIMEOUTS.UPSTREAM_TIMEOUT_MS).toBe(7500);
    expect(API_TIMEOUTS.OVERALL_DEADLINE_MS).toBe(9000);
    expect(API_TIMEOUTS.CLIENT_TIMEOUT_MS).toBe(12000);
    expect(API_TIMEOUTS.OPEN_METEO_TIMEOUT_MS).toBe(6000);
  });

  it('defines cache and rate limit parameters', () => {
    expect(CACHE_CONFIG.TTL_MS).toBe(600000);
    expect(CACHE_CONFIG.GEOCODING_TTL_MS).toBe(1800000);
    expect(RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW).toBe(30);
  });

  it('defines default Gemini models and error messages', () => {
    expect(GEMINI_MODELS.PRIMARY).toBe('gemini-3.5-flash-lite');
    expect(ERROR_MESSAGES.METHOD_NOT_ALLOWED).toBe('Method not allowed');
  });
});
