import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction } from '../controllers/transaction.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTransactionSchema } from '../schemas/transaction.schema';

const router = Router();

router.get('/', authenticate, getTransactions);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), validate(createTransactionSchema), createTransaction);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteTransaction);

export { router as transactionRouter };
