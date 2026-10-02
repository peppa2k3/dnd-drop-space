import { z } from 'zod';

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(300),
  description: z.string().max(5000).optional(),
  folder: z.string().nullable().optional(),
});

export const urlSchema = z.object({
  url: z.string().trim().min(1, 'Vui lòng nhập đường dẫn').url('Đường dẫn không hợp lệ'),
  title: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  folder: z.string().nullable().optional(),
});

export const itemUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(300),
  description: z.string().max(5000).optional(),
});
