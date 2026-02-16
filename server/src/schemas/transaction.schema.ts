import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Descripcion requerida'),
  amount: z.number().nonnegative('El monto no puede ser negativo'),
  date: z.string().optional(),
  category: z.string().min(1, 'Categoria requerida'),
  status: z.string().optional(),
  notes: z.string().optional(),
  reference: z.string().optional(),
  personName: z.string().optional(),
  personType: z.string().optional(),
  paymentMethod: z.string().optional(),
  bank: z.string().optional(),
  organizationId: z.number().optional(),
});
