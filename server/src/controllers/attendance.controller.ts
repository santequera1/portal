import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getAttendance(req: AuthRequest, res: Response) {
  try {
    const { classId, sectionId, date } = req.query;

    if (!sectionId || !date) {
      return res.status(400).json({ error: 'sectionId y date son requeridos' });
    }

    const targetDate = new Date(date as string);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {
      sectionId: parseInt(sectionId as string),
      date: { gte: targetDate, lt: nextDay },
    };

    const attendances = await prisma.attendance.findMany({
      where,
      include: { student: { select: { id: true, name: true, admissionNo: true } } },
    });

    // Also get all students in this section to show who hasn't been marked
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

export async function submitAttendance(req: AuthRequest, res: Response) {
  try {
    const { sectionId, date, records } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Upsert each record
    const results = await Promise.all(
      records.map((record: any) =>
        prisma.attendance.upsert({
          where: { studentId_date: { studentId: record.studentId, date: targetDate } },
          update: { status: record.status, remarks: record.remarks, sectionId },
          create: { studentId: record.studentId, sectionId, date: targetDate, status: record.status, remarks: record.remarks },
        })
      )
    );

    res.json({ message: 'Asistencia registrada', count: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
}

export async function getAttendanceReport(req: AuthRequest, res: Response) {
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

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      halfDay: records.filter(r => r.status === 'HALF_DAY').length,
    };

    res.json({ records, summary });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
}

export async function getAttendanceSummary(req: AuthRequest, res: Response) {
  try {
    const { classId, sectionId, month } = req.query;

    if (!sectionId || !month) {
      return res.status(400).json({ error: 'sectionId y month son requeridos' });
    }

    const [year, monthNum] = (month as string).split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const records = await prisma.attendance.findMany({
      where: {
        sectionId: parseInt(sectionId as string),
        date: { gte: startDate, lte: endDate },
      },
      include: { student: { select: { id: true, name: true, admissionNo: true } } },
    });

    // Group by student
    const byStudent: Record<number, any> = {};
    records.forEach(r => {
      if (!byStudent[r.studentId]) {
        byStudent[r.studentId] = { student: (r as any).student, present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
      }
      byStudent[r.studentId].total++;
      if (r.status === 'PRESENT') byStudent[r.studentId].present++;
      else if (r.status === 'ABSENT') byStudent[r.studentId].absent++;
      else if (r.status === 'LATE') byStudent[r.studentId].late++;
      else if (r.status === 'HALF_DAY') byStudent[r.studentId].halfDay++;
    });

    res.json(Object.values(byStudent));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
}
