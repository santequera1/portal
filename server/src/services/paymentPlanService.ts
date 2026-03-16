import prisma from '../config/database';

interface GenerateFeesInput {
  studentId: number;
  studentPaymentPlanId: number;
  paymentPlanId: number;
  startDate: Date;
}

export async function generateFeesFromPlan(input: GenerateFeesInput) {
  const { studentId, studentPaymentPlanId, paymentPlanId, startDate } = input;

  const plan = await prisma.paymentPlan.findUnique({
    where: { id: paymentPlanId }
  });

  if (!plan) throw new Error('Plan de pago no encontrado');

  const studentPlan = await prisma.studentPaymentPlan.findUnique({
    where: { id: studentPaymentPlanId },
  });

  if (!studentPlan) throw new Error('Asignación de plan no encontrada');

  // Get student to determine semester
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { semester: true },
  });

  const fees = [];

  // 1. Matrículas (según semestre del estudiante)
  if (plan.enrollmentFee > 0) {
    const matriculaType = await prisma.feeType.findFirst({
      where: { name: 'Matricula' }
    });

    if (matriculaType) {
      const currentSemester = student?.semester || 1;
      const totalSemesters = (plan as any).totalSemesters || 3;
      const numMatriculas = Math.max(1, totalSemesters - (currentSemester - 1));

      for (let m = 0; m < numMatriculas; m++) {
        // Space matrículas by ~5 months (semester duration)
        const matDueDate = new Date(startDate);
        matDueDate.setMonth(matDueDate.getMonth() + (m * 5));

        fees.push({
          studentId,
          feeTypeId: matriculaType.id,
          amount: plan.enrollmentFee,
          dueDate: matDueDate,
          status: 'PENDING',
          studentPaymentPlanId,
          installmentNumber: 0,
          description: `Matrícula Semestre ${currentSemester + m}`,
        });
      }
    }
  }

  // 2. Cuotas periódicas
  const mensualidadType = await prisma.feeType.findFirst({
    where: { name: 'Mensualidad' }
  });

  if (mensualidadType) {
    const tuitionAmount = studentPlan.customTuition || plan.tuitionAmount;
    const discountPercent = studentPlan.customDiscount || plan.discountPercent;
    const finalAmount = tuitionAmount * (1 - discountPercent / 100);

    for (let i = 1; i <= plan.installments; i++) {
      const dueDate = calculateDueDate(startDate, i, plan.frequency);

      fees.push({
        studentId,
        feeTypeId: mensualidadType.id,
        amount: finalAmount,
        dueDate,
        status: 'PENDING',
        studentPaymentPlanId,
        installmentNumber: i,
      });
    }
  }

  // 3. Otros cobros (materiales, uniformes, transporte)
  if (plan.materialsCharge > 0) {
    const materialesType = await prisma.feeType.findFirst({
      where: { name: 'Materiales' }
    });
    if (materialesType) {
      fees.push({
        studentId,
        feeTypeId: materialesType.id,
        amount: plan.materialsCharge,
        dueDate: startDate,
        status: 'PENDING',
        studentPaymentPlanId,
        installmentNumber: 0,
      });
    }
  }

  if (plan.uniformCharge > 0) {
    const uniformeType = await prisma.feeType.findFirst({
      where: { name: 'Uniforme' }
    });
    if (uniformeType) {
      fees.push({
        studentId,
        feeTypeId: uniformeType.id,
        amount: plan.uniformCharge,
        dueDate: startDate,
        status: 'PENDING',
        studentPaymentPlanId,
        installmentNumber: 0,
      });
    }
  }

  if (plan.transportCharge > 0) {
    const transporteType = await prisma.feeType.findFirst({
      where: { name: 'Transporte' }
    });
    if (transporteType) {
      fees.push({
        studentId,
        feeTypeId: transporteType.id,
        amount: plan.transportCharge,
        dueDate: startDate,
        status: 'PENDING',
        studentPaymentPlanId,
        installmentNumber: 0,
      });
    }
  }

  // Crear todas las cuotas
  await prisma.fee.createMany({ data: fees });

  return fees.length;
}

function calculateDueDate(startDate: Date, installmentNumber: number, frequency: string): Date {
  const date = new Date(startDate);

  switch (frequency) {
    case 'WEEKLY':
      date.setDate(date.getDate() + (installmentNumber * 7));
      break;
    case 'BIWEEKLY':
      date.setDate(date.getDate() + (installmentNumber * 14));
      break;
    case 'MONTHLY':
      date.setMonth(date.getMonth() + installmentNumber);
      break;
    case 'QUARTERLY':
      date.setMonth(date.getMonth() + (installmentNumber * 3));
      break;
    case 'YEARLY':
      date.setFullYear(date.getFullYear() + installmentNumber);
      break;
    default:
      // CUSTOM - usar intervalo mensual por defecto
      date.setMonth(date.getMonth() + installmentNumber);
  }

  return date;
}
