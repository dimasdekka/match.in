import { z } from 'zod';

export const genderSchema = z.enum(['male', 'female', 'all']);
export const locationFilterModeSchema = z.enum(['same_city', 'same_country', 'global']);
export const swipeActionSchema = z.enum(['like', 'pass', 'superlike']);

export const userSchema = z.object({
  id: z.number().catch(0),
  telegram_id: z.number().catch(0),
  username: z.string().catch(''),
  first_name: z.string().catch(''),
  last_name: z.string().catch(''),
  language_code: z.string().catch('en'),
  is_active: z.boolean().catch(true),
});

export const profileSchema = z.object({
  id: z.number().catch(0),
  user_id: z.number().catch(0),
  name: z.string().catch(''),
  age: z.number().catch(18),
  gender: genderSchema.catch('male'),
  target_gender: genderSchema.catch('all'),
  bio: z.string().catch(''),
  voice_bio_url: z.string().catch(''),
  country: z.string().catch(''),
  city: z.string().catch(''),
  target_location_mode: locationFilterModeSchema.catch('same_city'),
  min_age_pref: z.number().catch(18),
  max_age_pref: z.number().catch(99),
  photos: z.union([z.string(), z.array(z.string())]).catch([]),
  interests: z.union([z.string(), z.array(z.string())]).catch([]),
  is_verified: z.boolean().catch(false),
  is_boosted: z.boolean().optional(),
  is_premium: z.boolean().optional(),
  user: userSchema.optional(),
});

export const profileFormSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi').max(100),
    age: z.number().min(18, 'Usia minimal 18 tahun').max(100, 'Usia tidak valid'),
    gender: genderSchema,
    target_gender: genderSchema,
    bio: z.string().max(500, 'Bio terlalu panjang').default(''),
    voice_bio_url: z.string().url('URL audio tidak valid').or(z.literal('')).default(''),
    country: z.string().min(1, 'Negara wajib diisi'),
    city: z.string().min(1, 'Kota wajib diisi'),
    target_location_mode: locationFilterModeSchema.default('same_city'),
    min_age_pref: z.number().min(18, 'Minimal 18 tahun').max(99, 'Maksimal 99 tahun'),
    max_age_pref: z.number().min(18, 'Minimal 18 tahun').max(99, 'Maksimal 99 tahun'),
    photos: z.array(z.string()),
    interests: z.array(z.string()),
  })
  .refine((data) => data.min_age_pref <= data.max_age_pref, {
    message: 'Usia minimal tidak boleh lebih besar dari usia maksimal',
    path: ['min_age_pref'],
  });

export const filterSchema = z
  .object({
    target_location_mode: locationFilterModeSchema,
    target_gender: genderSchema,
    min_age_pref: z.number().min(18).max(99),
    max_age_pref: z.number().min(18).max(99),
  })
  .refine((data) => data.min_age_pref <= data.max_age_pref, {
    message: 'Usia minimal tidak boleh lebih besar dari usia maksimal',
    path: ['min_age_pref'],
  });

export const matchDetailSchema = z.object({
  match_id: z.number().catch(0),
  matched_user: userSchema,
  matched_profile: profileSchema,
  telegram_username: z.string().catch(''),
  direct_telegram_link: z.string().catch(''),
  matched_at: z.string().catch(''),
});

export const swipeRequestSchema = z.object({
  target_id: z.number(),
  action: swipeActionSchema,
});

export const swipeResponseSchema = z.object({
  is_match: z.boolean(),
  match: matchDetailSchema.optional(),
  profile: profileSchema.optional(),
});

export const getMeResponseSchema = z.object({
  user: userSchema,
});

export const getMyProfileResponseSchema = z.object({
  profile: profileSchema.nullable(),
});

export const getRecommendationsResponseSchema = z.object({
  profiles: z.array(profileSchema),
});

export const getMatchesResponseSchema = z.object({
  matches: z.array(matchDetailSchema),
});

export type ProfileFormSchemaType = z.infer<typeof profileFormSchema>;
export type FilterSchemaType = z.infer<typeof filterSchema>;
