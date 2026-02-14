import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getSedes(req: AuthRequest, res: Response) {
  try {
    const { organizationId } = req.query;
    const where: any = {};

    if (organizationId) {
      where.organizationId = parseInt(organizationId as string);
    }

    const sedes = await prisma.sede.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' },
    });

    res.json(sedes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
}

export async function getSede(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const sede = await prisma.sede.findUnique({
      where: { id: parseInt(id) },
      include: {
        organization: true,
        _count: { select: { students: true } }
      },
    });

    if (!sede) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    res.json(sede);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sede' });
  }
}
