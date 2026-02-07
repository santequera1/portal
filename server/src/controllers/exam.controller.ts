import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

// Exam Groups
export async function getExamGroups(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.query;
    const where: any = {};

    if (sessionId) {
      where.sessionId = parseInt(sessionId as string);
    } else {
      const active = await prisma.academicSession.findFirst({ where: { isActive: true } });
      if (active) where.sessionId = active.id;
    }

    const groups = await prisma.examGroup.findMany({
      where,
      include: { _count: { select: { exams: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grupos de examen' });
  }
}

export async function createExamGroup(req: AuthRequest, res: Response) {
  try {
    const group = await prisma.examGroup.create({ data: req.body });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear grupo de examen' });
  }
}

export async function deleteExamGroup(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.examGroup.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Grupo de examen eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar grupo' });
  }
}

// Exams
export async function getExams(req: AuthRequest, res: Response) {
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

export async function createExam(req: AuthRequest, res: Response) {
  try {
    const data = { ...req.body, date: new Date(req.body.date) };
    const exam = await prisma.exam.create({
      data,
      include: { subject: true, class: true, examGroup: true },
    });
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear examen' });
  }
}

export async function updateExam(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);

    const exam = await prisma.exam.update({
      where: { id: parseInt(id) },
      data,
      include: { subject: true, class: true },
    });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar examen' });
  }
}

export async function deleteExam(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.exam.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Examen eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar examen' });
  }
}

// Marks
export async function getMarks(req: AuthRequest, res: Response) {
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

export async function submitMarks(req: AuthRequest, res: Response) {
  try {
    const { examId, marks } = req.body;

    const results = await Promise.all(
      marks.map((m: any) =>
        prisma.mark.upsert({
          where: { examId_studentId: { examId, studentId: m.studentId } },
          update: { marksObtained: m.marksObtained, remarks: m.remarks },
          create: { examId, studentId: m.studentId, marksObtained: m.marksObtained, remarks: m.remarks },
        })
      )
    );

    res.json({ message: 'Notas registradas', count: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar notas' });
  }
}

// Grade Scale
export async function getGradeScale(req: AuthRequest, res: Response) {
  try {
    const scales = await prisma.gradeScale.findMany({ orderBy: { minMarks: 'desc' } });
    res.json(scales);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener escala' });
  }
}

export async function updateGradeScale(req: AuthRequest, res: Response) {
  try {
    const { scales } = req.body;
    // Delete all and recreate
    await prisma.gradeScale.deleteMany();
    const created = await prisma.gradeScale.createMany({ data: scales });
    res.json({ message: 'Escala actualizada', count: created.count });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar escala' });
  }
}
