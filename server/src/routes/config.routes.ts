import { Router } from 'express';
import { getSchoolConfig, updateSchoolConfig } from '../controllers/config.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/school', authenticate, getSchoolConfig);
router.put('/school', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateSchoolConfig);

export { router as configRouter };
