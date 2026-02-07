import { Router } from 'express';
import { login, register, me, getUsers, updateUser, updateProfile, changePassword } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(registerSchema), register);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.get('/users', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), getUsers);
router.put('/users/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateUser);

export { router as authRouter };
