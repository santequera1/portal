import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const { type, from, to, page = '1', limit = '20', category, organizationId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (organizationId) where.organizationId = parseInt(organizationId as string);
    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
}

export async function createTransaction(req: AuthRequest, res: Response) {
  try {
    const { type, description, amount, date, category, status, notes, reference, personName, paymentMethod, bank, organizationId } = req.body;

    // Build enriched description with metadata
    const parts = [description];
    if (bank) parts.push(`Banco: ${bank}`);
    if (reference) parts.push(`Ref: ${reference}`);
    if (paymentMethod) parts.push(`Metodo: ${paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Efectivo'}`);
    if (notes) parts.push(notes);

    const enrichedDescription = parts.join(' | ');

    const transaction = await prisma.transaction.create({
      data: {
        type,
        description: enrichedDescription,
        amount,
        date: date ? new Date(date) : new Date(),
        category,
        status: (status || 'completed').toLowerCase(),
        ...(organizationId && { organizationId: parseInt(organizationId) }),
      },
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear transaccion' });
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Transaccion eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar transaccion' });
  }
}
