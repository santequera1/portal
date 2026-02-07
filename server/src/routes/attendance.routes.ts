import { Router } from 'express';
import { getAttendance, submitAttendance, getAttendanceReport, getAttendanceSummary } from '../controllers/attendance.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitAttendanceSchema } from '../schemas/attendance.schema';

const router = Router();

router.get('/', authenticate, getAttendance);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), validate(submitAttendanceSchema), submitAttendance);
router.get('/report', authenticate, getAttendanceReport);
router.get('/summary', authenticate, getAttendanceSummary);

export { router as attendanceRouter };
