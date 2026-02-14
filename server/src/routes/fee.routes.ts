import { Router } from 'express';
import { getFees, createFee, deleteFee, createPayment, getPayments, getFinanceSummary, getFeeTypes, createFeeType, deleteFeeType } from '../controllers/fee.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFeeSchema, createPaymentSchema, createFeeTypeSchema } from '../schemas/fee.schema';

const router = Router();

router.get('/', authenticate, getFees);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), validate(createFeeSchema), createFee);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), deleteFee);

router.get('/payments', authenticate, getPayments);
router.post('/payments', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), validate(createPaymentSchema), createPayment);

router.get('/summary', authenticate, getFinanceSummary);

router.get('/types', authenticate, getFeeTypes);
router.post('/types', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createFeeTypeSchema), createFeeType);
router.delete('/types/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteFeeType);

export { router as feeRouter };
