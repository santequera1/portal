import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function search(req: AuthRequest, res: Response) {
  try {
    const { q, type } = req.query;
    const query = (q as string || '').trim();

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const results: Array<{ id: number; name: string; type: string; detail: string }> = [];

    if (!type || type === 'STUDENT') {
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { admissionNo: { contains: query } },
            { fatherPhone: { contains: query } },
            { motherPhone: { contains: query } },
          ],
        },
        select: { id: true, name: true, admissionNo: true, class: { select: { name: true } } },
        take: 10,
      });
      students.forEach(s => results.push({
        id: s.id,
        name: s.name,
        type: 'STUDENT',
        detail: `${s.admissionNo} - ${s.class?.name || ''}`,
      }));
    }

    if (!type || type === 'TEACHER') {
      const staff = await prisma.staffMember.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
            { email: { contains: query } },
          ],
        },
        select: { id: true, name: true, designation: true },
        take: 10,
      });
      staff.forEach(s => results.push({
        id: s.id,
        name: s.name,
        type: 'TEACHER',
        detail: s.designation || 'Personal',
      }));
    }

    res.json(results.slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: 'Error en la busqueda' });
  }
}
