import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres'),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  joinDate: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.string().optional(),
  active: z.boolean().optional(),
  organizationIds: z.array(z.number()).optional(),
});

export const updateStaffSchema = createStaffSchema.partial();
