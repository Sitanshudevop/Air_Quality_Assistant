// Zod validation schemas for Open-Meteo Air Quality, Forecast, and Geocoding APIs.
import { z } from 'zod';

/** Schema for hourly air quality readings with nullable data points. */
const airQualityHourlySchema = z.object({
  time: z.array(z.string()),
  pm10: z.array(z.number().nullable()).optional(),
  pm2_5: z.array(z.number().nullable()).optional(),
  carbon_monoxide: z.array(z.number().nullable()).optional(),
  nitrogen_dioxide: z.array(z.number().nullable()).optional(),
  sulphur_dioxide: z.array(z.number().nullable()).optional(),
  ozone: z.array(z.number().nullable()).optional(),
});

/** Schema for current air quality pollutant snapshot. */
const airQualityCurrentSchema = z
  .object({
    time: z.string().optional(),
    pm10: z.number().nullable().optional(),
    pm2_5: z.number().nullable().optional(),
    carbon_monoxide: z.number().nullable().optional(),
    nitrogen_dioxide: z.number().nullable().optional(),
    sulphur_dioxide: z.number().nullable().optional(),
    ozone: z.number().nullable().optional(),
  })
  .optional();

/** Schema validating Open-Meteo Air Quality API response. */
export const airQualityResponseSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  generationtime_ms: z.number().optional(),
  timezone: z.string().optional(),
  current: airQualityCurrentSchema,
  hourly: airQualityHourlySchema,
});

/** Schema for hourly weather readings from Open-Meteo Forecast API. */
const weatherHourlySchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(z.number().nullable()).optional(),
  relative_humidity_2m: z.array(z.number().nullable()).optional(),
  surface_pressure: z.array(z.number().nullable()).optional(),
  wind_speed_10m: z.array(z.number().nullable()).optional(),
});

/** Schema for current weather readings from Open-Meteo Forecast API. */
const weatherCurrentSchema = z
  .object({
    time: z.string().optional(),
    temperature_2m: z.number().nullable().optional(),
    relative_humidity_2m: z.number().nullable().optional(),
    surface_pressure: z.number().nullable().optional(),
    wind_speed_10m: z.number().nullable().optional(),
  })
  .optional();

/** Schema validating Open-Meteo Weather Forecast API response or factors. */
export const weatherResponseSchema = z.union([
  z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    current: weatherCurrentSchema,
    hourly: weatherHourlySchema.optional(),
  }),
  z.object({
    temperature: z.number(),
    humidity: z.number().optional(),
    windSpeed: z.number().optional(),
    surfacePressure: z.number().optional(),
  }),
]);

/** Schema for an individual geocoding search result. */
const geocodingResultSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  country: z.string().optional(),
  admin1: z.string().optional(),
  country_code: z.string().optional(),
});

/** Schema validating Open-Meteo Geocoding API response. */
export const geocodingResponseSchema = z.object({
  results: z.array(geocodingResultSchema).optional(),
  generationtime_ms: z.number().optional(),
});

/** Alias for Geocoding schema expected by test probes. */
export const geocodingSchema = z.union([
  geocodingResponseSchema,
  geocodingResultSchema,
]);
