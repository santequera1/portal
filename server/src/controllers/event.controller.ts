import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getEvents(req: AuthRequest, res: Response) {
  try {
    const { upcoming } = req.query;
    const where: any = {};

    if (upcoming === 'true') {
      where.date = { gte: new Date() };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
}

export async function createEvent(req: AuthRequest, res: Response) {
  try {
    const data = { ...req.body, date: new Date(req.body.date) };
    const event = await prisma.event.create({ data });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear evento' });
  }
}

export async function updateEvent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);

    const event = await prisma.event.update({ where: { id: parseInt(id) }, data });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
}
