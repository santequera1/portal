import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getPaymentPlans,
  createPaymentPlan,
  updatePaymentPlan,
  deletePaymentPlan,
  assignPlanToStudent,
  getStudentPlan,
} from '../controllers/paymentPlan.controller';

const router = Router();

router.get('/', authenticate, getPaymentPlans);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), createPaymentPlan);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updatePaymentPlan);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deletePaymentPlan);

router.post('/assign', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), assignPlanToStudent);
router.get('/student/:studentId', authenticate, getStudentPlan);

export { router as paymentPlanRouter };
