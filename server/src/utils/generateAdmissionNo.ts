import prisma from '../config/database';

export async function generateAdmissionNo(): Promise<string> {
  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    where: { admissionNo: { startsWith: `${year}-` } },
    orderBy: { admissionNo: 'desc' },
  });

  let nextNum = 1;
  if (lastStudent) {
    const parts = lastStudent.admissionNo.split('-');
    nextNum = parseInt(parts[1], 10) + 1;
  }

  return `${year}-${String(nextNum).padStart(3, '0')}`;
}
