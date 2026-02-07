import { Router } from 'express';
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent } from '../controllers/student.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createStudentSchema, updateStudentSchema } from '../schemas/student.schema';

const router = Router();

router.get('/', authenticate, getStudents);
router.get('/:id', authenticate, getStudent);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createStudentSchema), createStudent);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(updateStudentSchema), updateStudent);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteStudent);

export { router as studentRouter };
