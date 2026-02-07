import { Router } from 'express';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/schedule.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSchedules);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), createSchedule);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateSchedule);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteSchedule);

export { router as scheduleRouter };
