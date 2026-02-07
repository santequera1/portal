import { z } from 'zod';

export const submitAttendanceSchema = z.object({
  sectionId: z.number(),
  date: z.string(),
  records: z.array(z.object({
    studentId: z.number(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY']),
    remarks: z.string().optional(),
  })),
});
