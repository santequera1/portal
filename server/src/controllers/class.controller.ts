import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

// Academic Sessions
export async function getSessions(req: AuthRequest, res: Response) {
  try {
    const sessions = await prisma.academicSession.findMany({ orderBy: { startDate: 'desc' } });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
}

export async function createSession(req: AuthRequest, res: Response) {
  try {
    const { name, startDate, endDate, isActive } = req.body;

    if (isActive) {
      await prisma.academicSession.updateMany({ data: { isActive: false } });
    }

    const session = await prisma.academicSession.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate), isActive: isActive || false },
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear sesion' });
  }
}

export async function updateSession(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, isActive } = req.body;

    if (isActive) {
      await prisma.academicSession.updateMany({ data: { isActive: false } });
    }

    const session = await prisma.academicSession.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar sesion' });
  }
}

// Classes
export async function getClasses(req: AuthRequest, res: Response) {
  try {
    const { sessionId, organizationId } = req.query;
    const where: any = {};

    if (organizationId) {
      where.organizationId = parseInt(organizationId as string);
    }

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

export async function createClass(req: AuthRequest, res: Response) {
  try {
    const cls = await prisma.class.create({
      data: req.body,
      include: { sections: true },
    });
    res.status(201).json(cls);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear clase' });
  }
}

export async function updateClass(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const cls = await prisma.class.update({
      where: { id: parseInt(id) },
      data: req.body,
      include: { sections: true },
    });
    res.json(cls);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar clase' });
  }
}

export async function deleteClass(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.class.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Clase eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar clase. Asegurese de que no tiene estudiantes asignados.' });
  }
}

// Sections
export async function getSections(req: AuthRequest, res: Response) {
  try {
    const { classId } = req.query;
    const where: any = {};
    if (classId) where.classId = parseInt(classId as string);

    const sections = await prisma.section.findMany({
      where,
      include: { class: true, _count: { select: { students: true } } },
    });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener secciones' });
  }
}

export async function createSection(req: AuthRequest, res: Response) {
  try {
    const section = await prisma.section.create({
      data: req.body,
      include: { class: true },
    });
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear seccion' });
  }
}

export async function deleteSection(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.section.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Seccion eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar seccion' });
  }
}

// Subjects (many-to-many with classes via ClassSubject)
export async function getSubjects(req: AuthRequest, res: Response) {
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

export async function createSubject(req: AuthRequest, res: Response) {
  try {
    const { name, code, classIds } = req.body;
    const subject = await prisma.subject.create({
      data: { name, code },
    });

    if (classIds && classIds.length > 0) {
      await prisma.classSubject.createMany({
        data: classIds.map((cId: number) => ({ classId: cId, subjectId: subject.id })),
      });
    }

    const full = await prisma.subject.findUnique({
      where: { id: subject.id },
      include: { classSubjects: { include: { class: true } } },
    });
    res.status(201).json(full);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear materia' });
  }
}

export async function deleteSubject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Materia eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar materia' });
  }
}

export async function addSubjectToClass(req: AuthRequest, res: Response) {
  try {
    const { classId, subjectId } = req.body;
    const cs = await prisma.classSubject.create({
      data: { classId, subjectId },
      include: { subject: true, class: true },
    });
    res.status(201).json(cs);
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar materia al curso' });
  }
}

export async function removeSubjectFromClass(req: AuthRequest, res: Response) {
  try {
    const { classId, subjectId } = req.params;
    await prisma.classSubject.delete({
      where: { classId_subjectId: { classId: parseInt(classId), subjectId: parseInt(subjectId) } },
    });
    res.json({ message: 'Materia desasignada del curso' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desasignar materia' });
  }
}

// Teacher Assignments
export async function getTeacherAssignments(req: AuthRequest, res: Response) {
  try {
    const { classId } = req.query;
    const where: any = {};
    if (classId) where.classId = parseInt(classId as string);

    const assignments = await prisma.teacherAssignment.findMany({
      where,
      include: { teacher: true, subject: true, class: true, section: true },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
}

export async function createTeacherAssignment(req: AuthRequest, res: Response) {
  try {
    const assignment = await prisma.teacherAssignment.create({
      data: req.body,
      include: { teacher: true, subject: true, class: true, section: true },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear asignacion' });
  }
}

export async function deleteTeacherAssignment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.teacherAssignment.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Asignacion eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar asignacion' });
  }
}
