import { z } from 'zod';

/**
 * Schémas de validation Zod pour les candidats
 */

// Utilitaires
const optionalTrimmedString = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(''));

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const birthDateSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return value;
}, z.date().optional());

const resumeSchema = z
  .union([
    // URL classique
    z.string().url('URL invalide'),
    // Base64 (data URL)
    z
      .string()
      .regex(
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9.+-]+)?;base64,[A-Za-z0-9+/=]+$/,
        'Format CV base64 invalide'
      ),
  ])
  .optional()
  .or(z.literal(''));

// Schéma pour la création d'un candidat
export const createCandidateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .trim(),
  email: z
    .string()
    .email('Veuillez fournir un email valide')
    .min(1, "L'email est requis")
    .trim()
    .toLowerCase(),
  phone: emptyToUndefined(
    z
      .string()
      .trim()
      .regex(
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Veuillez fournir un numéro de téléphone valide'
      )
  ),
  address: optionalTrimmedString(200, "L'adresse ne peut pas dépasser 200 caractères"),
  city: optionalTrimmedString(100, 'La ville ne peut pas dépasser 100 caractères'),
  country: optionalTrimmedString(100, 'Le pays ne peut pas dépasser 100 caractères'),
  postalCode: optionalTrimmedString(20, 'Le code postal ne peut pas dépasser 20 caractères'),
  skills: z
    .array(z.string().trim().min(1).max(50))
    .max(20, 'Un candidat ne peut pas avoir plus de 20 compétences')
    .default([]),
  experience: z
    .number()
    .min(0, "L'expérience ne peut pas être négative")
    .max(50, "L'expérience ne peut pas dépasser 50 ans")
    .default(0),
  education: z.enum(['high_school', 'bachelor', 'master', 'phd', 'other']).default('other'),

  // Nouveau: date de naissance
  birthDate: birthDateSchema,

  // Nouveau: champ CV flexible (URL ou base64)
  resume: resumeSchema,

  // Compatibilité avec l'ancien champ éventuel
  resumeUrl: z.string().url('URL invalide').optional().or(z.literal('')),

  notes: z
    .string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
});

// Schéma pour la mise à jour d'un candidat (tous les champs optionnels)
export const updateCandidateSchema = createCandidateSchema.partial();

// Schéma pour la validation d'un candidat
export const validateCandidateSchema = z.object({
  status: z.enum(['validated', 'rejected'], {
    errorMap: () => ({ message: 'Le statut doit être "validated" ou "rejected"' }),
  }),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional(),
});

// Schéma pour les paramètres de requête (pagination, filtres)
export const queryParamsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'La page doit être positive'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'La limite doit être entre 1 et 100'),
  search: z.string().optional(),
  status: z.enum(['pending', 'reviewing', 'validated', 'rejected', 'archived']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastName', 'experience']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Types dérivés des schémas
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type ValidateCandidateInput = z.infer<typeof validateCandidateSchema>;
export type QueryParamsInput = z.infer<typeof queryParamsSchema>;
