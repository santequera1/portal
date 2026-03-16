import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { createReceiptForPayment } from './receipt.controller';

export async function getFees(req: AuthRequest, res: Response) {
  try {
    const { studentId, classId, status, organizationId, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);
    if (status) where.status = status;
    if (classId) where.student = { ...where.student, classId: parseInt(classId as string) };
    if (organizationId) where.student = { ...where.student, organizationId: parseInt(organizationId as string) };
    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { name: { contains: search as string } },
          { lastName: { contains: search as string } },
          { admissionNo: { contains: search as string } },
          { numeroIdentificacion: { contains: search as string } },
        ],
      };
    }

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, lastName: true, admissionNo: true, numeroIdentificacion: true, class: true, section: true, organization: true } },
          feeType: true,
          payments: { include: { receipt: true } },
        },
        skip,
        take: limitNum,
        orderBy: { dueDate: 'desc' },
      }),
      prisma.fee.count({ where }),
    ]);

    // Compute paid amounts
    const feesWithBalance = fees.map(fee => {
      const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
      return { ...fee, totalPaid, balance: fee.amount - totalPaid };
    });

    res.json({ fees: feesWithBalance, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cuotas' });
  }
}

export async function createFee(req: AuthRequest, res: Response) {
  try {
    const { studentId, feeTypeId, amount, dueDate, description, status, studentPaymentPlanId, installmentNumber } = req.body;
    const fee = await prisma.fee.create({
      data: {
        studentId,
        feeTypeId,
        amount,
        dueDate: new Date(dueDate),
        ...(description ? { description } : {}),
        ...(status ? { status } : {}),
        ...(studentPaymentPlanId ? { studentPaymentPlanId } : {}),
        ...(installmentNumber !== undefined ? { installmentNumber } : {}),
      },
      include: { student: true, feeType: true },
    });
    res.status(201).json(fee);
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ error: 'Error al crear cuota' });
  }
}

export async function updateFee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { amount, dueDate, description, feeTypeId } = req.body;
    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (description !== undefined) updateData.description = description;
    if (feeTypeId !== undefined) updateData.feeTypeId = feeTypeId;

    const fee = await prisma.fee.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { student: true, feeType: true, payments: true },
    });
    res.json(fee);
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ error: 'Error al actualizar cuota' });
  }
}

export async function updateFeeStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const fee = await prisma.fee.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true },
    });

    if (!fee) {
      return res.status(404).json({ error: 'Cuota no encontrada' });
    }

    // If reverting to PENDING, delete associated payments, receipts and transactions
    if (status === 'PENDING' && fee.payments.length > 0) {
      const paymentIds = fee.payments.map(p => p.id);

      // Delete receipts linked to these payments
      await prisma.receipt.deleteMany({ where: { paymentId: { in: paymentIds } } });

      // Delete the payments
      await prisma.payment.deleteMany({ where: { feeId: fee.id } });
    }

    await prisma.fee.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cuota' });
  }
}

export async function createPayment(req: AuthRequest, res: Response) {
  try {
    const { feeId, studentId, amount, method, reference } = req.body;

    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: { payments: true },
    });

    if (!fee) {
      return res.status(404).json({ error: 'Cuota no encontrada' });
    }

    const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = fee.amount - totalPaid;

    if (amount > balance) {
      return res.status(400).json({ error: `El monto excede el saldo pendiente ($${balance.toLocaleString()})` });
    }

    const payment = await prisma.payment.create({
      data: { feeId, studentId, amount, method: method || 'CASH', reference },
    });

    // Update fee status
    const newTotalPaid = totalPaid + amount;
    const newStatus = newTotalPaid >= fee.amount ? 'PAID' : 'PARTIAL';
    await prisma.fee.update({ where: { id: feeId }, data: { status: newStatus } });

    // Create income transaction
    const feeWithType = await prisma.fee.findUnique({
      where: { id: feeId },
      include: { feeType: true },
    });
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { name: true, organizationId: true, class: { select: { name: true } } } });
    const feeTypeName = feeWithType?.feeType?.name || 'Cuota';
    const concept = feeWithType?.description || feeTypeName;
    const programa = student?.class?.name ? ` (${student.class.name})` : '';

    const paymentLabel = newTotalPaid >= fee.amount ? 'Pago' : 'Abono';
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        description: `${paymentLabel} de ${concept} - ${student?.name || 'Estudiante'}${programa}`,
        amount,
        category: concept,
        status: 'completed',
        organizationId: student?.organizationId || undefined,
      },
    });

    // Auto-generate receipt
    const receiptConceptBase = feeWithType?.description
      ? `${feeTypeName}: ${feeWithType.description}`
      : feeTypeName;
    const receiptConcept = `${paymentLabel} de ${receiptConceptBase}`;
    const receipt = await createReceiptForPayment(
      payment.id,
      studentId,
      receiptConcept,
      amount,
      reference || undefined,
    );

    res.status(201).json({ ...payment, receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
}

export async function getPayments(req: AuthRequest, res: Response) {
  try {
    const { studentId, feeId } = req.query;
    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);
    if (feeId) where.feeId = parseInt(feeId as string);

    const payments = await prisma.payment.findMany({
      where,
      include: { fee: { include: { feeType: true } }, student: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
}

export async function getFinanceSummary(req: AuthRequest, res: Response) {
  try {
    const { organizationId } = req.query;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transWhere: any = {};
    if (organizationId) {
      transWhere.organizationId = parseInt(organizationId as string);
    }

    const [monthlyIncome, monthlyExpense] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...transWhere, type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...transWhere, type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    // Calculate pending and overdue amounts
    const pendingFeesData = await prisma.fee.findMany({
      where: { status: 'PENDING' },
      include: { payments: true },
    });

    const overdueFeesData = await prisma.fee.findMany({
      where: { status: 'OVERDUE' },
      include: { payments: true },
    });

    const pendingFees = pendingFeesData.reduce((sum, fee) => {
      const totalPaid = fee.payments.reduce((s, p) => s + p.amount, 0);
      return sum + (fee.amount - totalPaid);
    }, 0);

    const overdueFees = overdueFeesData.reduce((sum, fee) => {
      const totalPaid = fee.payments.reduce((s, p) => s + p.amount, 0);
      return sum + (fee.amount - totalPaid);
    }, 0);

    // Previous month for growth calculation
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevIncome = await prisma.transaction.aggregate({
      where: { ...transWhere, type: 'INCOME', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    });

    const currentIncome = monthlyIncome._sum.amount || 0;
    const previousIncome = prevIncome._sum.amount || 0;
    const growth = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;

    res.json({
      monthlyIncome: currentIncome,
      monthlyExpense: monthlyExpense._sum.amount || 0,
      pendingFees,
      overdueFees,
      incomeGrowth: Math.round(growth * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen financiero' });
  }
}

// Fee Types
export async function getFeeTypes(req: AuthRequest, res: Response) {
  try {
    const types = await prisma.feeType.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tipos de cuota' });
  }
}

export async function createFeeType(req: AuthRequest, res: Response) {
  try {
    const feeType = await prisma.feeType.create({ data: req.body });
    res.status(201).json(feeType);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tipo de cuota' });
  }
}

export async function deleteFeeType(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.feeType.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Tipo de cuota eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tipo de cuota' });
  }
}

export async function deleteFee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const fee = await prisma.fee.findUnique({
      where: { id: parseInt(id) },
      include: {
        payments: true,
        feeType: true,
        student: { select: { name: true } },
      },
    });

    if (!fee) {
      return res.status(404).json({ error: 'Cuota no encontrada' });
    }

    // Si tiene pagos, eliminar las transacciones asociadas (los pagos y recibos se eliminan en cascada)
    if (fee.payments.length > 0) {
      const concept = fee.feeType?.name || 'Cuota';
      const studentName = fee.student?.name || 'Estudiante';

      // Buscar y eliminar transacciones de ingreso generadas por estos pagos
      for (const payment of fee.payments) {
        await prisma.transaction.deleteMany({
          where: {
            type: 'INCOME',
            amount: payment.amount,
            description: { contains: studentName },
            date: {
              gte: new Date(payment.createdAt.getTime() - 5000),
              lte: new Date(payment.createdAt.getTime() + 5000),
            },
          },
        });
      }
    }

    // Eliminar la cuota (pagos y recibos se eliminan en cascada por el schema)
    await prisma.fee.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Cuota eliminada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cuota' });
  }
}
