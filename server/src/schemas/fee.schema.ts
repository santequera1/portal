import { z } from 'zod';

export const createFeeSchema = z.object({
  studentId: z.number(),
  feeTypeId: z.number(),
  amount: z.number().positive('El monto debe ser positivo'),
  dueDate: z.string(),
});

export const createPaymentSchema = z.object({
  feeId: z.number(),
  studentId: z.number(),
  amount: z.number().positive('El monto debe ser positivo'),
  method: z.enum(['CASH', 'TRANSFER', 'CHECK']).optional(),
  reference: z.string().optional(),
});

export const createFeeTypeSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
});
