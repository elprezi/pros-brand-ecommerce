import { z } from 'zod';
import { isValidSenegalPhone } from '../utils/format';

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[a-zA-Z]/, 'Le mot de passe doit contenir au moins une lettre')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

export const loginSchema = z.object({
  email: z.string().min(1, 'L’email est requis').email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().min(1, 'L’email est requis').email('Adresse email invalide'),
    phone: z
      .string()
      .min(8, 'Numéro de téléphone requis')
      .refine((val: string) => isValidSenegalPhone(val), {
        message: 'Numéro de téléphone au format Sénégal valide (+221 77, 78, 76, 70, 75...)',
      }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
    acceptTerms: z.boolean().refine((val: boolean) => val === true, {
      message: 'Vous devez accepter les conditions générales',
    }),
  })
  .refine((data: { password?: string; confirmPassword?: string }) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'L’email est requis').email('Adresse email invalide'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data: { password?: string; confirmPassword?: string }) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
