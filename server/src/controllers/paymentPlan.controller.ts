import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { generateFeesFromPlan } from '../services/paymentPlanService';

// Get all payment plans
export async function getPaymentPlans(req: AuthRequest, res: Response) {
  try {
    const plans = await prisma.paymentPlan.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener planes de pago' });
  }
}

// Create payment plan
export async function createPaymentPlan(req: AuthRequest, res: Response) {
  try {
    const plan = await prisma.paymentPlan.create({
      data: req.body,
    });
    res.status(201).json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear plan de pago' });
  }
}

// Update payment plan
export async function updatePaymentPlan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const plan = await prisma.paymentPlan.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar plan de pago' });
  }
}

// Delete payment plan
export async function deletePaymentPlan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if plan is in use
    const inUse = await prisma.studentPaymentPlan.count({
      where: { paymentPlanId: parseInt(id), active: true }
    });

    if (inUse > 0) {
      return res.status(400).json({
        error: `No se puede eliminar. ${inUse} estudiante(s) tienen este plan activo.`
      });
    }

    await prisma.paymentPlan.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Plan eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar plan' });
  }
}

// Assign plan to student
export async function assignPlanToStudent(req: AuthRequest, res: Response) {
  try {
    const { studentId, paymentPlanId, customTuition, customDiscount, startDate } = req.body;

    // Deactivate any existing active plans for this student
    await prisma.studentPaymentPlan.updateMany({
      where: { studentId, active: true },
      data: { active: false, endDate: new Date() }
    });

    // Create new assignment
    const studentPlan = await prisma.studentPaymentPlan.create({
      data: {
        studentId,
        paymentPlanId,
        customTuition,
        customDiscount,
        startDate: startDate ? new Date(startDate) : new Date(),
        active: true,
      },
      include: {
        paymentPlan: true,
      }
    });

    // Generate all fees from plan
    const feesGenerated = await generateFeesFromPlan({
      studentId,
      studentPaymentPlanId: studentPlan.id,
      paymentPlanId,
      startDate: studentPlan.startDate,
    });

    res.status(201).json({
      studentPlan,
      feesGenerated,
      message: `Plan asignado. ${feesGenerated} cuotas generadas.`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al asignar plan' });
  }
}

// Get student's payment plan
export async function getStudentPlan(req: AuthRequest, res: Response) {
  try {
    const { studentId } = req.params;

    const studentPlan = await prisma.studentPaymentPlan.findFirst({
      where: { studentId: parseInt(studentId), active: true },
      include: {
        paymentPlan: true,
      }
    });

    if (!studentPlan) {
      return res.status(404).json({ error: 'El estudiante no tiene plan de pago activo' });
    }

    res.json(studentPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener plan del estudiante' });
  }
}
