import { z } from 'zod';
import i18n from '../i18n/config';

export const loginSchema = () => z.object({
  email: z.string().trim().min(1, i18n.t('errors:emailRequired')).email(i18n.t('errors:invalidEmail')),
  password: z.string().min(1, i18n.t('errors:passwordRequired')),
});

export const registerSchema = () => z
  .object({
    name: z.string().trim().min(2, i18n.t('errors:nameTooShort')),
    email: z.string().trim().min(1, i18n.t('errors:emailRequired')).email(i18n.t('errors:invalidEmail')),
    password: z.string().min(8, i18n.t('errors:passwordTooShort')),
    confirmPassword: z.string().min(1, i18n.t('errors:confirmPasswordRequired')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t('errors:passwordMismatch'),
    path: ['confirmPassword'],
  });
