import { z } from 'zod';
import i18n from '../i18n/config';

export const noteSchema = () => z.object({
  title: z.string().trim().min(1, i18n.t('errors:titleRequired')).max(300),
  description: z.string().max(5000).optional(),
  folder: z.string().nullable().optional(),
});

export const urlSchema = () => z.object({
  url: z.string().trim().min(1, i18n.t('errors:urlRequired')).url(i18n.t('errors:invalidUrl')),
  title: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  folder: z.string().nullable().optional(),
});

export const itemUpdateSchema = () => z.object({
  title: z.string().trim().min(1, i18n.t('errors:titleRequired')).max(300),
  description: z.string().max(5000).optional(),
});
