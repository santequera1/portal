import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getSchoolConfig(req: AuthRequest, res: Response) {
  try {
    const configs = await prisma.schoolConfig.findMany();
    const configObj: Record<string, string> = {};
    configs.forEach(c => { configObj[c.key] = c.value; });
    res.json(configObj);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuracion' });
  }
}

export async function updateSchoolConfig(req: AuthRequest, res: Response) {
  try {
    const entries = Object.entries(req.body) as [string, string][];
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.schoolConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );
    res.json({ message: 'Configuracion actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuracion' });
  }
}
