import { Router } from 'express';
import {
  getExamGroups, createExamGroup, deleteExamGroup,
  getExams, createExam, updateExam, deleteExam,
  getMarks, submitMarks,
  getGradeScale, updateGradeScale,
} from '../controllers/exam.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createExamGroupSchema, createExamSchema, submitMarksSchema } from '../schemas/exam.schema';

const router = Router();

// Exam Groups
router.get('/groups', authenticate, getExamGroups);
router.post('/groups', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createExamGroupSchema), createExamGroup);
router.delete('/groups/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteExamGroup);

// Exams
router.get('/', authenticate, getExams);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), validate(createExamSchema), createExam);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateExam);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteExam);

// Marks
router.get('/marks', authenticate, getMarks);
router.post('/marks', authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), validate(submitMarksSchema), submitMarks);

// Grade Scale
router.get('/grade-scale', authenticate, getGradeScale);
router.put('/grade-scale', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateGradeScale);

export { router as examRouter };
