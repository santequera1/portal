import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  order: z.number(),
  sessionId: z.number(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  classId: z.number(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().min(1, 'Codigo requerido'),
  classIds: z.array(z.number()).optional(),
});

export const createSessionSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional(),
});

export const createTeacherAssignmentSchema = z.object({
  teacherId: z.number(),
  subjectId: z.number(),
  classId: z.number(),
  sectionId: z.number(),
});
