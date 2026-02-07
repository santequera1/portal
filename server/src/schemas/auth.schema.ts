import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  name: z.string().min(2, 'Minimo 2 caracteres'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STUDENT', 'PARENT']),
  phone: z.string().optional(),
});
