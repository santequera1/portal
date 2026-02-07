import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { generateAdmissionNo } from '../utils/generateAdmissionNo';

export async function getStudents(req: AuthRequest, res: Response) {
  try {
    const { page = '1', limit = '20', classId, sectionId, search, status, organizationId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (organizationId) where.organizationId = parseInt(organizationId as string);
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
        include: { class: true, section: true },
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

export async function getStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: { class: true, section: true, fees: { include: { feeType: true, payments: true } }, attendances: { orderBy: { date: 'desc' }, take: 30 } },
    });

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
}

export async function createStudent(req: AuthRequest, res: Response) {
  try {
    const admissionNo = await generateAdmissionNo();
    const data = { ...req.body, admissionNo };

    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.fechaExpedicion) data.fechaExpedicion = new Date(data.fechaExpedicion);
    if (data.fechaSalida) data.fechaSalida = new Date(data.fechaSalida);

    const student = await prisma.student.create({
      data,
      include: { class: true, section: true },
    });

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear estudiante' });
  }
}

export async function updateStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.fechaExpedicion) data.fechaExpedicion = new Date(data.fechaExpedicion);
    if (data.fechaSalida) data.fechaSalida = new Date(data.fechaSalida);

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data,
      include: { class: true, section: true },
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
}

export async function deleteStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Estudiante eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
}
