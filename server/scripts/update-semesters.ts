import * as XLSX from 'xlsx';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

async function main() {
  const excelPath = path.join(__dirname, '..', 'formato plataforma cartagena  fundisalud 2026.xlsx');
  console.log('Reading Excel:', excelPath);

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Fundisalud'];
  if (!sheet) {
    console.error('Sheet "Fundisalud" not found');
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

  // Get matrícula fee type
  const matriculaType = await prisma.feeType.findFirst({ where: { name: 'Matricula' } });
  if (!matriculaType) {
    console.error('FeeType "Matricula" not found');
    process.exit(1);
  }

  let updated = 0;
  let matriculasCreated = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nombre = cleanString(row[0]);
    const apellido = cleanString(row[1]);
    if (!nombre) continue;

    const semestre = parseInt(cleanString(row[13])) || 1;
    const valorMatricula = Number(row[18]) || 60000;
    const numDoc = cleanString(row[10]);

    // Find student by name (case insensitive via contains)
    const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const studentName = capitalize(nombre);
    const studentLastName = capitalize(apellido);

    // Try exact match first, then fuzzy
    let student = await prisma.student.findFirst({
      where: {
        name: studentName,
        lastName: studentLastName,
        organizationId: 2,
      },
      include: { fees: { where: { feeTypeId: matriculaType.id } } },
    });

    if (!student) {
      // Try case-insensitive with first name only
      const firstName = studentName.split(' ')[0];
      const lastNameFirst = studentLastName.split(' ')[0];
      const candidates = await prisma.student.findMany({
        where: {
          organizationId: 2,
          name: { contains: firstName },
          lastName: { contains: lastNameFirst },
        },
        include: { fees: { where: { feeTypeId: matriculaType.id } } },
      });
      student = candidates[0] || null;
    }

    if (!student) {
      console.log(`  [SKIP] Student not found: ${studentName} ${studentLastName}`);
      continue;
    }

    // Update semester
    await prisma.student.update({
      where: { id: student.id },
      data: { semester: semestre },
    });

    // Calculate how many matrículas should exist
    const totalSemesters = 3;
    const numMatriculasNeeded = Math.max(1, totalSemesters - (semestre - 1));
    const currentMatriculas = student.fees.length;

    console.log(`  ${studentName} ${studentLastName} - Sem ${semestre} - Matrículas: ${currentMatriculas}/${numMatriculasNeeded}`);

    if (currentMatriculas < numMatriculasNeeded) {
      // Create missing matrículas
      for (let m = currentMatriculas; m < numMatriculasNeeded; m++) {
        const matDueDate = new Date(2026, 1 + (m * 5), 1); // Feb, Jul, Dec

        await prisma.fee.create({
          data: {
            studentId: student.id,
            feeTypeId: matriculaType.id,
            amount: valorMatricula,
            dueDate: matDueDate,
            status: 'PENDING',
            description: `Matrícula Semestre ${semestre + m}`,
          },
        });
        matriculasCreated++;
      }
    }

    updated++;
  }

  console.log(`\n=== DONE ===`);
  console.log(`Students updated: ${updated}`);
  console.log(`Matrículas created: ${matriculasCreated}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
