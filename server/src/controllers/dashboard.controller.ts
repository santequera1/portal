import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const { organizationId } = req.query;
    const orgFilter = organizationId ? parseInt(organizationId as string) : undefined;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const studentWhere: any = { status: 'active' };
    const staffWhere: any = {};
    const teacherWhere: any = { designation: 'Profesor' };
    const transWhere: any = {};

    if (orgFilter) {
      studentWhere.organizationId = orgFilter;
      staffWhere.staffOrgs = { some: { organizationId: orgFilter } };
      teacherWhere.staffOrgs = { some: { organizationId: orgFilter } };
      transWhere.organizationId = orgFilter;
    }

    // Basic counts
    const [totalStudents, totalStaff, teacherCount] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.staffMember.count({ where: staffWhere }),
      prisma.staffMember.count({ where: teacherWhere }),
    ]);

    // Monthly income/expense
    const [monthlyIncome, monthlyExpense] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...transWhere, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { ...transWhere, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
    ]);

    // Previous month for growth
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevIncome = await prisma.transaction.aggregate({
      where: { ...transWhere, type: 'INCOME', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    });
    const currentInc = monthlyIncome._sum.amount || 0;
    const previousInc = prevIncome._sum.amount || 0;
    const incomeGrowth = previousInc > 0 ? ((currentInc - previousInc) / previousInc) * 100 : 0;

    // Today's attendance
    const todayAttendance = await prisma.attendance.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    });
    const present = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const absent = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const attendanceTotal = todayAttendance.length || totalStudents;
    const attendancePercentage = attendanceTotal > 0 ? (present / attendanceTotal) * 100 : 0;

    // Weekly attendance (last 5 days)
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const attendanceWeekly = [];
    for (let i = 4; i >= 0; i--) {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() - i);
      const nextDay = new Date(dayDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRecords = await prisma.attendance.findMany({
        where: { date: { gte: dayDate, lt: nextDay } },
      });

      attendanceWeekly.push({
        day: weekDays[dayDate.getDay()],
        presentes: dayRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length,
        ausentes: dayRecords.filter(a => a.status === 'ABSENT').length,
      });
    }

    // Finance monthly (last 6 months)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const financeMonthly = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({ where: { ...transWhere, type: 'INCOME', date: { gte: mStart, lte: mEnd } }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { ...transWhere, type: 'EXPENSE', date: { gte: mStart, lte: mEnd } }, _sum: { amount: true } }),
      ]);

      financeMonthly.push({
        month: months[mStart.getMonth()],
        ingresos: inc._sum.amount || 0,
        egresos: exp._sum.amount || 0,
      });
    }

    // Student distribution by class
    const classWhere: any = {};
    if (orgFilter) classWhere.organizationId = orgFilter;
    const classes = await prisma.class.findMany({
      where: classWhere,
      include: { _count: { select: { students: true } } },
      orderBy: { order: 'asc' },
    });
    const colors = ['#1B2A6B', '#2E3F8F', '#4A5DB5', '#E8701A', '#45AD6B', '#C41E2A', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
    const studentDistribution = classes.map((c, i) => ({
      name: c.name,
      value: c._count.students,
      color: colors[i % colors.length],
    }));

    // Pending fees
    const pendingFeesData = await prisma.fee.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      include: {
        student: { select: { id: true, name: true, class: true, section: true } },
        payments: true,
      },
      take: 10,
      orderBy: { dueDate: 'asc' },
    });

    const pendingFees = pendingFeesData.map(f => {
      const totalPaid = f.payments.reduce((sum, p) => sum + p.amount, 0);
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - f.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        id: f.id,
        name: f.student.name,
        class: `${f.student.class.name} ${f.student.section?.name || ''}`.trim(),
        amount: f.amount - totalPaid,
        daysOverdue,
      };
    });

    // Upcoming events
    const upcomingEvents = await prisma.event.findMany({
      where: { date: { gte: today } },
      orderBy: { date: 'asc' },
      take: 5,
    });

    // Recent activity (last transactions + attendance)
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity = recentTransactions.map(t => ({
      id: String(t.id),
      type: t.type === 'INCOME' ? 'payment' : 'alert',
      title: t.type === 'INCOME' ? 'Pago recibido' : 'Gasto registrado',
      description: `${t.description} - $${t.amount.toLocaleString()}`,
      time: getRelativeTime(t.createdAt),
    }));

    // Active session
    const activeSession = await prisma.academicSession.findFirst({ where: { isActive: true } });

    res.json({
      totalStudents,
      activeStaff: totalStaff,
      teacherCount,
      adminCount: totalStaff - teacherCount,
      monthlyIncome: currentInc,
      monthlyExpense: monthlyExpense._sum.amount || 0,
      incomeGrowth: Math.round(incomeGrowth * 10) / 10,
      attendanceToday: {
        present,
        absent,
        total: attendanceTotal,
        percentage: Math.round(attendancePercentage * 10) / 10,
      },
      attendanceWeekly,
      financeMonthly,
      studentDistribution,
      pendingFees,
      upcomingEvents: upcomingEvents.map(e => ({
        id: String(e.id),
        title: e.title,
        date: formatEventDate(e.date),
        time: e.time || 'Todo el dia',
        location: e.location || '-',
        type: e.type,
      })),
      recentActivity,
      academicSession: activeSession?.name || 'No configurada',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadisticas' });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
}

function formatEventDate(date: Date): string {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
