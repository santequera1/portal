import { Request, Response } from 'express';
import prisma from '../config/database';

// ============ PING ============
export async function webhookPing(_req: Request, res: Response) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

// ============ ORGANIZATIONS ============
export async function webhookOrganizations(_req: Request, res: Response) {
  try {
    const orgs = await prisma.organization.findMany({
      include: { sedes: true, _count: { select: { students: true, classes: true } } },
    });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener organizaciones' });
  }
}

// ============ STUDENTS ============
export async function webhookStudents(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', classId, sectionId, search, status, organizationId, sedeId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (organizationId) where.organizationId = parseInt(organizationId as string);
    if (sedeId) where.sedeId = parseInt(sedeId as string);
    if (classId) where.classId = parseInt(classId as string);
    if (sectionId) where.sectionId = parseInt(sectionId as string);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { lastName: { contains: search as string } },
        { admissionNo: { contains: search as string } },
        { numeroIdentificacion: { contains: search as string } },
        { fatherName: { contains: search as string } },
        { acudienteNombre: { contains: search as string } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { class: true, section: true, sede: true },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({ students, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
}

export async function webhookStudentDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: true,
        section: true,
        sede: true,
        fees: { include: { feeType: true, payments: true } },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
}

// ============ STAFF ============
export async function webhookStaff(req: Request, res: Response) {
  try {
    const { department, designation, search, organizationId } = req.query;
    const where: any = {};
    if (department) where.department = department;
    if (designation) where.designation = designation;
    if (organizationId) {
      where.staffOrgs = { some: { organizationId: parseInt(organizationId as string) } };
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const staff = await prisma.staffMember.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, role: true, active: true } },
        staffOrgs: { include: { organization: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener personal' });
  }
}

export async function webhookStaffDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const staff = await prisma.staffMember.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, email: true, role: true, active: true } },
        teacherAssignments: { include: { subject: true, class: true, section: true } },
        staffOrgs: { include: { organization: true } },
      },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener personal' });
  }
}

// ============ FINANCE ============
export async function webhookFinanceSummary(_req: Request, res: Response) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [monthlyIncome, monthlyExpense, pendingFees, overdueFees] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.fee.count({ where: { status: 'PENDING' } }),
      prisma.fee.count({ where: { status: 'OVERDUE' } }),
    ]);

    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevIncome = await prisma.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    });

    const currentIncome = monthlyIncome._sum.amount || 0;
    const previousIncome = prevIncome._sum.amount || 0;
    const growth = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;

    res.json({
      monthlyIncome: currentIncome,
      monthlyExpense: monthlyExpense._sum.amount || 0,
      pendingFees,
      overdueFees,
      incomeGrowth: Math.round(growth * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen financiero' });
  }
}

export async function webhookTransactions(req: Request, res: Response) {
  try {
    const { type, from, to, page = '1', limit = '20', category, organizationId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (organizationId) where.organizationId = parseInt(organizationId as string);
    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, skip, take: limitNum, orderBy: { date: 'desc' } }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
}

export async function webhookFees(req: Request, res: Response) {
  try {
    const { studentId, classId, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);
    if (status) where.status = status;
    if (classId) where.student = { classId: parseInt(classId as string) };

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, admissionNo: true, class: true, section: true } },
          feeType: true,
          payments: true,
        },
        skip,
        take: limitNum,
        orderBy: { dueDate: 'desc' },
      }),
      prisma.fee.count({ where }),
    ]);

    const feesWithBalance = fees.map(fee => {
      const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
      return { ...fee, totalPaid, balance: fee.amount - totalPaid };
    });

    res.json({ fees: feesWithBalance, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cuotas' });
  }
}

export async function webhookPayments(req: Request, res: Response) {
  try {
    const { studentId, feeId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);
    if (feeId) where.feeId = parseInt(feeId as string);

    const payments = await prisma.payment.findMany({
      where,
      include: { fee: { include: { feeType: true } }, student: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
}

// ============ ACADEMIC ============
export async function webhookClasses(req: Request, res: Response) {
  try {
    const { sessionId, organizationId } = req.query;
    const where: any = {};

    if (organizationId) where.organizationId = parseInt(organizationId as string);

    if (sessionId) {
      where.sessionId = parseInt(sessionId as string);
    } else {
      const activeSession = await prisma.academicSession.findFirst({ where: { isActive: true } });
      if (activeSession) where.sessionId = activeSession.id;
    }

    const classes = await prisma.class.findMany({
      where,
      include: { sections: true, classSubjects: { include: { subject: true } }, _count: { select: { students: true } } },
      orderBy: { order: 'asc' },
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clases' });
  }
}

export async function webhookSubjects(req: Request, res: Response) {
  try {
    const { classId, organizationId } = req.query;

    if (classId) {
      const classSubjects = await prisma.classSubject.findMany({
        where: { classId: parseInt(classId as string) },
        include: { subject: true },
      });
      res.json(classSubjects.map(cs => cs.subject));
    } else {
      const where: any = {};
      if (organizationId) where.organizationId = parseInt(organizationId as string);
      const subjects = await prisma.subject.findMany({
        where,
        include: { classSubjects: { include: { class: true } } },
        orderBy: { name: 'asc' },
      });
      res.json(subjects);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener materias' });
  }
}

export async function webhookExams(req: Request, res: Response) {
  try {
    const { examGroupId, classId } = req.query;
    const where: any = {};
    if (examGroupId) where.examGroupId = parseInt(examGroupId as string);
    if (classId) where.classId = parseInt(classId as string);

    const exams = await prisma.exam.findMany({
      where,
      include: { subject: true, class: true, examGroup: true, _count: { select: { marks: true } } },
      orderBy: { date: 'asc' },
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener examenes' });
  }
}

export async function webhookMarks(req: Request, res: Response) {
  try {
    const { examId, studentId } = req.query;
    const where: any = {};
    if (examId) where.examId = parseInt(examId as string);
    if (studentId) where.studentId = parseInt(studentId as string);

    const marks = await prisma.mark.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, admissionNo: true } },
        exam: { include: { subject: true, class: true, examGroup: true } },
      },
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notas' });
  }
}

export async function webhookAttendance(req: Request, res: Response) {
  try {
    const { sectionId, date, classId } = req.query;

    if (!sectionId || !date) {
      return res.status(400).json({ error: 'sectionId y date son requeridos' });
    }

    const targetDate = new Date(date as string);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendances = await prisma.attendance.findMany({
      where: {
        sectionId: parseInt(sectionId as string),
        date: { gte: targetDate, lt: nextDay },
      },
      include: { student: { select: { id: true, name: true, admissionNo: true } } },
    });

    const sectionFilter: any = { sectionId: parseInt(sectionId as string), status: 'active' };
    if (classId) sectionFilter.classId = parseInt(classId as string);

    const students = await prisma.student.findMany({
      where: sectionFilter,
      select: { id: true, name: true, admissionNo: true },
      orderBy: { name: 'asc' },
    });

    res.json({ attendances, students });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
}

export async function webhookAttendanceReport(req: Request, res: Response) {
  try {
    const { studentId, from, to } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: 'studentId requerido' });
    }

    const where: any = { studentId: parseInt(studentId as string) };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const records = await prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      halfDay: records.filter(r => r.status === 'HALF_DAY').length,
    };

    res.json({ records, summary });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reporte de asistencia' });
  }
}

// ============ DASHBOARD ============
export async function webhookDashboard(req: Request, res: Response) {
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

    const [totalStudents, totalStaff, teacherCount] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.staffMember.count({ where: staffWhere }),
      prisma.staffMember.count({ where: teacherWhere }),
    ]);

    const [monthlyIncome, monthlyExpense] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...transWhere, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { ...transWhere, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
    ]);

    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevIncome = await prisma.transaction.aggregate({
      where: { ...transWhere, type: 'INCOME', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    });
    const currentInc = monthlyIncome._sum.amount || 0;
    const previousInc = prevIncome._sum.amount || 0;
    const incomeGrowth = previousInc > 0 ? ((currentInc - previousInc) / previousInc) * 100 : 0;

    const todayAttendance = await prisma.attendance.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    });
    const present = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const absent = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const attendanceTotal = todayAttendance.length || totalStudents;
    const attendancePercentage = attendanceTotal > 0 ? (present / attendanceTotal) * 100 : 0;

    const classWhere: any = {};
    if (orgFilter) classWhere.organizationId = orgFilter;
    const classes = await prisma.class.findMany({
      where: classWhere,
      include: { _count: { select: { students: true } } },
      orderBy: { order: 'asc' },
    });
    const studentDistribution = classes.map(c => ({
      name: c.name,
      students: c._count.students,
    }));

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

    const upcomingEvents = await prisma.event.findMany({
      where: { date: { gte: today } },
      orderBy: { date: 'asc' },
      take: 5,
    });

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
      studentDistribution,
      pendingFees,
      upcomingEvents: upcomingEvents.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        time: e.time || 'Todo el dia',
        location: e.location || '-',
        type: e.type,
      })),
      academicSession: activeSession?.name || 'No configurada',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
}
