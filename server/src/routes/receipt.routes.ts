import { Router } from 'express';
import { getReceipts, getReceipt, getReceiptByPayment, deleteReceipt } from '../controllers/receipt.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getReceipts);
router.get('/:id', authenticate, getReceipt);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), deleteReceipt);
router.get('/payment/:paymentId', authenticate, getReceiptByPayment);

export { router as receiptRouter };
