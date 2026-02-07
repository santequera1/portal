import { Router } from 'express';
import { search } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, search);

export { router as searchRouter };
