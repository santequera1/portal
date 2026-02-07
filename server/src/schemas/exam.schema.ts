import { z } from 'zod';

export const createExamGroupSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  sessionId: z.number(),
});

export const createExamSchema = z.object({
  examGroupId: z.number(),
  subjectId: z.number(),
  classId: z.number(),
  date: z.string(),
  startTime: z.string().optional(),
  duration: z.number().optional(),
  maxMarks: z.number().positive().optional(),
});

export const submitMarksSchema = z.object({
  examId: z.number(),
  marks: z.array(z.object({
    studentId: z.number(),
    marksObtained: z.number().min(0),
    remarks: z.string().optional(),
  })),
});
