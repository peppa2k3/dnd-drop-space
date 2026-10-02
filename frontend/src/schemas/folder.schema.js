import { z } from 'zod';

export const folderSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên thư mục').max(120),
});
