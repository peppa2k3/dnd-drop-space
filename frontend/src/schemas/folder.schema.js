import { z } from 'zod';
import i18n from '../i18n/config';

export const folderSchema = () => z.object({
  name: z.string().trim().min(1, i18n.t('errors:folderNameRequired')).max(120),
});
