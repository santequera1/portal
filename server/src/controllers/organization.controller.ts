import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getOrganizations(req: AuthRequest, res: Response) {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: { select: { classes: true, students: true, subjects: true, sedes: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener organizaciones' });
  }
}

export async function getSedes(req: AuthRequest, res: Response) {
  try {
    const { organizationId } = req.query;
    const where: any = {};
    if (organizationId) where.organizationId = parseInt(organizationId as string);

    const sedes = await prisma.sede.findMany({
      where,
      include: { organization: true },
      orderBy: { name: 'asc' },
    });
    res.json(sedes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
}

export async function createSede(req: AuthRequest, res: Response) {
  try {
    const sede = await prisma.sede.create({
      data: req.body,
      include: { organization: true },
    });
    res.status(201).json(sede);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear sede' });
  }
}

export async function updateSede(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const sede = await prisma.sede.update({
      where: { id: parseInt(id) },
      data: req.body,
      include: { organization: true },
    });
    res.json(sede);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar sede' });
  }
}

export async function deleteSede(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.sede.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Sede eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar sede' });
  }
}
