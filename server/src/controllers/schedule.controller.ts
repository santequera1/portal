import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getSchedules(req: AuthRequest, res: Response) {
  try {
    const { organizationId, classId, teacherId, sectionId } = req.query;
    const where: any = {};

    if (organizationId) where.organizationId = parseInt(organizationId as string);
    if (classId) where.classId = parseInt(classId as string);
    if (teacherId) where.teacherId = parseInt(teacherId as string);
    if (sectionId) where.sectionId = parseInt(sectionId as string);

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
}

export async function createSchedule(req: AuthRequest, res: Response) {
  try {
    const schedule = await prisma.schedule.create({
      data: req.body,
      include: { class: true, section: true, subject: true, teacher: true },
    });
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear horario' });
  }
}

export async function updateSchedule(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const schedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: req.body,
      include: { class: true, section: true, subject: true, teacher: true },
    });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar horario' });
  }
}

export async function deleteSchedule(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.schedule.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Horario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
}
