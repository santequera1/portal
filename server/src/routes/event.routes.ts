import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEventSchema } from '../schemas/event.schema';

const router = Router();

router.get('/', authenticate, getEvents);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createEventSchema), createEvent);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteEvent);

export { router as eventRouter };
