import { Router } from 'express';
import {
  getSessions, createSession, updateSession,
  getClasses, createClass, updateClass, deleteClass,
  getSections, createSection, deleteSection,
  getSubjects, createSubject, deleteSubject, addSubjectToClass, removeSubjectFromClass,
  getTeacherAssignments, createTeacherAssignment, deleteTeacherAssignment,
} from '../controllers/class.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createClassSchema, createSectionSchema, createSubjectSchema, createSessionSchema, createTeacherAssignmentSchema } from '../schemas/class.schema';

const router = Router();

// Academic Sessions
router.get('/sessions', authenticate, getSessions);
router.post('/sessions', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createSessionSchema), createSession);
router.put('/sessions/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateSession);

// Classes
router.get('/', authenticate, getClasses);
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createClassSchema), createClass);
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), updateClass);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteClass);

// Sections
router.get('/sections', authenticate, getSections);
router.post('/sections', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createSectionSchema), createSection);
router.delete('/sections/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteSection);

// Subjects
router.get('/subjects', authenticate, getSubjects);
router.post('/subjects', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createSubjectSchema), createSubject);
router.delete('/subjects/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteSubject);

// Subject-Class assignments (many-to-many)
router.post('/subjects/assign', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), addSubjectToClass);
router.delete('/subjects/assign/:classId/:subjectId', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), removeSubjectFromClass);

// Teacher Assignments
router.get('/teacher-assignments', authenticate, getTeacherAssignments);
router.post('/teacher-assignments', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), validate(createTeacherAssignmentSchema), createTeacherAssignment);
router.delete('/teacher-assignments/:id', authenticate, requireRole('SUPER_ADMIN', 'ADMIN'), deleteTeacherAssignment);

export { router as classRouter };
