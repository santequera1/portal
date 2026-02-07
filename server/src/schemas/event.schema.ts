import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Titulo requerido'),
  description: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['exam', 'meeting', 'event', 'deadline']).optional(),
});
