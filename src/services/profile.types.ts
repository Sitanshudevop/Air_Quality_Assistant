// Zod schema, types, and defaults for user profile persistence and versioning.
import { z } from 'zod';

export const PROFILE_STORAGE_KEY = 'saans_user_profile_v1';
export const PROFILE_SCHEMA_VERSION = 1;

/** Zod validation schema for persisted user profile preferences. */
export const profileSchema = z.object({
  version: z.number().int().min(1).default(PROFILE_SCHEMA_VERSION),
  cityName: z.string().min(1).default('Delhi'),
  vulnerabilities: z.array(z.string()).default(['general']),
  vulnerability: z
    .enum(['healthy_adult', 'child', 'elderly', 'respiratory', 'pregnant'])
    .optional(),
  commuteMode: z.string().default('metro'),
  commuteDistanceKm: z.number().min(0).default(10),
  householdMembers: z.number().int().min(1).default(2),
  hasPurifier: z.boolean().default(false),
  cookingFuel: z.enum(['lpg', 'induction', 'biomass']).default('lpg'),
  homeType: z.string().optional(),
  budgetBand: z.enum(['low', 'medium', 'high']).optional(),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

/** Inferred stored user profile interface. */
export type StoredProfile = z.infer<typeof profileSchema>;

/** Default profile preferences for first-time onboarding users. */
export const DEFAULT_PROFILE: Readonly<StoredProfile> = {
  version: PROFILE_SCHEMA_VERSION,
  cityName: 'Delhi',
  vulnerabilities: ['general'],
  vulnerability: 'healthy_adult',
  commuteMode: 'metro',
  commuteDistanceKm: 10,
  householdMembers: 2,
  hasPurifier: false,
  cookingFuel: 'lpg',
  homeType: 'apartment',
  budgetBand: 'medium',
  updatedAt: '2026-11-24T00:00:00.000Z',
};
