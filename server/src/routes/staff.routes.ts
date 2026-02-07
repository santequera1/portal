import { Router } from 'express';
import { getStaff, getStaffMember, createStaff, updateStaff, deleteStaff } from '../controllers/staff.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createStaffSchema, updateStaffSchema } from '../schemas/staff.schema';

const router = Router();

router.get('/', authenticate, getStaff);
router.get('/:id', authenticate, getStaffMember);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createStaffSchema), createStaff);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(updateStaffSchema), updateStaff);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteStaff);

export { router as staffRouter };
