import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { studentRouter } from './routes/student.routes';
import { classRouter } from './routes/class.routes';
import { attendanceRouter } from './routes/attendance.routes';
import { feeRouter } from './routes/fee.routes';
import { transactionRouter } from './routes/transaction.routes';
import { examRouter } from './routes/exam.routes';
import { staffRouter } from './routes/staff.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { eventRouter } from './routes/event.routes';
import { configRouter } from './routes/config.routes';
import { searchRouter } from './routes/search.routes';
import { organizationRouter } from './routes/organization.routes';
import { scheduleRouter } from './routes/schedule.routes';
import { webhookRouter } from './routes/webhook.routes';
import { sedeRouter } from './routes/sede.routes';
import { paymentPlanRouter } from './routes/paymentPlan.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/students', studentRouter);
app.use('/api/classes', classRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/fees', feeRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/exams', examRouter);
app.use('/api/staff', staffRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/events', eventRouter);
app.use('/api/config', configRouter);
app.use('/api/search', searchRouter);
app.use('/api/organizations', organizationRouter);
app.use('/api/schedules', scheduleRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/sedes', sedeRouter);
app.use('/api/payment-plans', paymentPlanRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
