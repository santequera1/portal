import { Router } from 'express';
import { authenticateApiKey } from '../middleware/apiKey';
import {
  webhookPing,
  webhookOrganizations,
  webhookStudents,
  webhookStudentDetail,
  webhookStaff,
  webhookStaffDetail,
  webhookFinanceSummary,
  webhookTransactions,
  webhookFees,
  webhookPayments,
  webhookClasses,
  webhookSubjects,
  webhookExams,
  webhookMarks,
  webhookAttendance,
  webhookAttendanceReport,
  webhookDashboard,
} from '../controllers/webhook.controller';

const router = Router();

// All webhook routes require API Key
router.use(authenticateApiKey);

// Health check
router.get('/ping', webhookPing);

// Organizations
router.get('/organizations', webhookOrganizations);

// Students
router.get('/students', webhookStudents);
router.get('/students/:id', webhookStudentDetail);

// Staff
router.get('/staff', webhookStaff);
router.get('/staff/:id', webhookStaffDetail);

// Finance
router.get('/finance/summary', webhookFinanceSummary);
router.get('/finance/transactions', webhookTransactions);
router.get('/finance/fees', webhookFees);
router.get('/finance/payments', webhookPayments);

// Academic
router.get('/academic/classes', webhookClasses);
router.get('/academic/subjects', webhookSubjects);
router.get('/academic/exams', webhookExams);
router.get('/academic/marks', webhookMarks);
router.get('/academic/attendance', webhookAttendance);
router.get('/academic/attendance/report', webhookAttendanceReport);

// Dashboard
router.get('/dashboard', webhookDashboard);

export { router as webhookRouter };
