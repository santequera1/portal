import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export async function getFees(req: AuthRequest, res: Response) {
  try {
    const { studentId, classId, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);
    if (status) where.status = status;
    if (classId) where.student = { classId: parseInt(classId as string) };

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, admissionNo: true, class: true, section: true } },
          feeType: true,
          payments: true,
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
    const data = { ...req.body, dueDate: new Date(req.body.dueDate) };
    const fee = await prisma.fee.create({
      data,
      include: { student: true, feeType: true },
    });
    res.status(201).json(fee);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cuota' });
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
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { name: true } });
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        description: `Pago de cuota - ${student?.name || 'Estudiante'}`,
        amount,
        category: 'Cuotas',
        status: 'completed',
      },
    });

    res.status(201).json(payment);
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
    const types = await prisma.feeType.findMany({ orderBy: { name: 'asc' } });
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

    // Verificar que la cuota existe y obtener info
    const fee = await prisma.fee.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true },
    });

    if (!fee) {
      return res.status(404).json({ error: 'Cuota no encontrada' });
    }

    // Advertencia si tiene pagos
    if (fee.payments.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar una cuota con pagos registrados. Elimine los pagos primero.'
      });
    }

    await prisma.fee.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Cuota eliminada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cuota' });
  }
}
