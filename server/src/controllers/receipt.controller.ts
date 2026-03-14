import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastReceipt = await prisma.receipt.findFirst({
    where: { receiptNumber: { startsWith: `REC-${year}` } },
    orderBy: { id: 'desc' },
  });

  let nextNum = 1;
  if (lastReceipt) {
    const parts = lastReceipt.receiptNumber.split('-');
    nextNum = parseInt(parts[2]) + 1;
  }

  return `REC-${year}-${String(nextNum).padStart(5, '0')}`;
}

export async function getReceipts(req: AuthRequest, res: Response) {
  try {
    const { studentId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          payment: {
            include: {
              fee: { include: { feeType: true } },
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              lastName: true,
              admissionNo: true,
              numeroIdentificacion: true,
              class: true,
              section: true,
              organization: true,
              sede: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.receipt.count({ where }),
    ]);

    res.json({ receipts, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener recibos' });
  }
}

export async function getReceipt(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) },
      include: {
        payment: {
          include: {
            fee: { include: { feeType: true } },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            lastName: true,
            admissionNo: true,
            numeroIdentificacion: true,
            tipoIdentificacion: true,
            phone: true,
            email: true,
            address: true,
            class: true,
            section: true,
            organization: true,
            sede: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener recibo' });
  }
}

export async function createReceiptForPayment(paymentId: number, studentId: number, concept: string, amount: number, notes?: string) {
  const receiptNumber = await generateReceiptNumber();
  return prisma.receipt.create({
    data: {
      receiptNumber,
      paymentId,
      studentId,
      concept,
      amount,
      notes,
    },
  });
}

export async function deleteReceipt(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.receipt.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Recibo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar recibo' });
  }
}

export async function getReceiptByPayment(req: AuthRequest, res: Response) {
  try {
    const { paymentId } = req.params;
    const receipt = await prisma.receipt.findUnique({
      where: { paymentId: parseInt(paymentId) },
      include: {
        payment: {
          include: {
            fee: { include: { feeType: true } },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            lastName: true,
            admissionNo: true,
            numeroIdentificacion: true,
            tipoIdentificacion: true,
            phone: true,
            email: true,
            address: true,
            class: true,
            section: true,
            organization: true,
            sede: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Recibo no encontrado para este pago' });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener recibo' });
  }
}
