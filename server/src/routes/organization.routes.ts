import { Router } from 'express';
import { getOrganizations, getSedes, createSede, updateSede, deleteSede } from '../controllers/organization.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getOrganizations);
router.get('/sedes', authenticate, getSedes);
router.post('/sedes', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), createSede);
router.put('/sedes/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateSede);
router.delete('/sedes/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteSede);

export { router as organizationRouter };
