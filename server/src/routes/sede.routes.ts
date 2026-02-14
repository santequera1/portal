import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getSedes, getSede } from '../controllers/sede.controller';

const router = Router();

router.get('/', authenticate, getSedes);
router.get('/:id', authenticate, getSede);

export { router as sedeRouter };
