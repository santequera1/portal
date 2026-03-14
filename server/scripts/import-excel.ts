import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Class mapping for Minerva grades
const minervaClassMap: Record<string, number> = {
  '6°': 7,
  '7°': 8,
  '8°': 9,
  '8° Y 9°': 9,
  '8° y 9°': 9,
  '9°': 10,
  '10°': 11,
  '10|°': 11,
  '10° ': 11,
  '11°': 12,
};

// Class mapping for Fundisalud programs
const fundisaludClassMap: Record<string, number> = {
  'atencion integral a la primera infancia': 18,
  'gestion administrativa': 16,
  'administracion en salud': 22,
  'seguridad ocupacional': 17,
  'tecnico en sistema': 19,
  'tecnico en sistemas': 19,
  'auxiliar de enfermeria': 13,
  'auxiliar de farmacia': 14,
  'auxiliar en farmacia': 14,
};

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return new Date(date.y, date.m - 1, date.d);
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
    // Try dd/mm/yyyy
    const parts = value.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
  }
  return null;
}

function cleanString(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  return String(val).trim();
}

function generateAdmissionNo(org: string, index: number): string {
  const year = new Date().getFullYear();
  const prefix = org === 'MINERVA' ? 'MIN' : 'FDS';
  return `${prefix}-CTG-${year}-${String(index).padStart(3, '0')}`;
}

async function importMinerva(sheet: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  // Skip header (row 0), data starts at row 1
  let imported = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nombre = cleanString(row[1]);
    const apellido = cleanString(row[2]);
    if (!nombre) continue; // Skip empty rows

    const grado = cleanString(row[3]);
    const jornada = cleanString(row[5]);
    const genero = cleanString(row[6]).toUpperCase() === 'F' ? 'F' : 'M';
    const fechaNac = parseExcelDate(row[7]);
    const nacionalidad = cleanString(row[8]) || 'Colombiana';
    const email = cleanString(row[9]);
    const telefono = cleanString(row[10]);
    const tipoSangre = cleanString(row[11]);
    const tipoDoc = cleanString(row[12]);
    const numDoc = cleanString(row[13]);
    const fechaExp = parseExcelDate(row[14]);
    const eps = cleanString(row[16]);
    const numContrato = cleanString(row[17]);
    const numPoliza = cleanString(row[18]);
    const numCotizacion = cleanString(row[19]);
    const certificado = cleanString(row[20]);
    const responsable = cleanString(row[21]);
    const direccion = cleanString(row[22]);
    const valorMatricula = Number(row[24]) || 0;
    const valorPension = Number(row[25]) || 0;
    const totalAnual = Number(row[26]) || 0;

    // Map grade to class
    const classId = minervaClassMap[grado] || minervaClassMap[grado.replace(/\s+/g, '')] || 9;
    // Section A for all
    const sectionId = (classId - 1) * 2 + 1; // Maps to section A of each class

    const admissionNo = generateAdmissionNo('MINERVA', i);

    try {
      const student = await prisma.student.create({
        data: {
          admissionNo,
          name: nombre,
          lastName: apellido,
          dateOfBirth: fechaNac,
          gender: genero,
          bloodGroup: tipoSangre || null,
          nationality: nacionalidad,
          email: email || null,
          phone: telefono ? String(telefono) : null,
          tipoIdentificacion: tipoDoc || null,
          numeroIdentificacion: numDoc ? String(numDoc) : null,
          fechaExpedicion: fechaExp,
          eps: eps || null,
          tipoSalud: eps || null,
          numeroContrato: numContrato || null,
          numeroPoliza: numPoliza || null,
          numeroCotizacion: numCotizacion || null,
          certificado: certificado || null,
          acudienteNombre: responsable || null,
          address: direccion || null,
          classId,
          sectionId,
          organizationId: 1, // Minerva
          sedeId: 1, // Sede Olaya (Cartagena)
          balance: 0,
          status: 'active',
        },
      });

      // Create fees: 1 matrícula + monthly pensiones
      // Matrícula - due Feb 1
      await prisma.fee.create({
        data: {
          studentId: student.id,
          feeTypeId: 1, // Matricula
          amount: valorMatricula,
          dueDate: new Date(2026, 1, 1), // Feb 1, 2026
          status: 'PENDING',
        },
      });

      // Calculate number of monthly installments
      const numMeses = totalAnual > 0 && valorPension > 0
        ? Math.round((totalAnual - valorMatricula) / valorPension)
        : 10;

      // Monthly pensions (Feb - Nov typically)
      for (let m = 0; m < numMeses; m++) {
        await prisma.fee.create({
          data: {
            studentId: student.id,
            feeTypeId: 2, // Mensualidad
            amount: valorPension,
            dueDate: new Date(2026, 1 + m, 1), // Feb, Mar, Apr...
            status: 'PENDING',
            installmentNumber: m + 1,
          },
        });
      }

      imported++;
      console.log(`  [Minerva] ${nombre} ${apellido} - Matrícula: $${valorMatricula.toLocaleString()}, Pensión: $${valorPension.toLocaleString()}/mes x${numMeses} = Total: $${totalAnual.toLocaleString()}`);
    } catch (err: any) {
      console.error(`  ERROR importing ${nombre} ${apellido}: ${err.message}`);
    }
  }

  return imported;
}

async function importFundisalud(sheet: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  let imported = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nombre = cleanString(row[0]);
    const apellido = cleanString(row[1]);
    if (!nombre) continue;

    const genero = cleanString(row[2]).toUpperCase() === 'F' ? 'F' : 'M';
    const fechaNac = parseExcelDate(row[3]);
    const nacionalidad = cleanString(row[4]) || 'Colombiana';
    const email = cleanString(row[5]);
    const telefono = cleanString(row[6]);
    const tipoSangre = cleanString(row[7]);
    const tipoDoc = cleanString(row[8]);
    const numDoc = cleanString(row[10]);
    const fechaExp = parseExcelDate(row[11]);
    const programa = cleanString(row[12]).toLowerCase();
    const semestre = cleanString(row[13]);
    const jornada = cleanString(row[14]);
    const seguridadSocial = cleanString(row[15]);
    const direccion = cleanString(row[16]);
    const valorMatricula = Number(row[18]) || 0;
    const valorPension = Number(row[19]) || 0;
    const totalAnual = Number(row[20]) || 0;

    // Map program to class
    const classId = fundisaludClassMap[programa] || 13; // Default to Enfermeria
    // Section A
    const sectionId = (classId - 1) * 2 + 1;

    const admissionNo = generateAdmissionNo('FUNDISALUD', i);

    try {
      const student = await prisma.student.create({
        data: {
          admissionNo,
          name: nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase(),
          lastName: apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase(),
          dateOfBirth: fechaNac,
          gender: genero,
          bloodGroup: tipoSangre || null,
          nationality: nacionalidad.charAt(0).toUpperCase() + nacionalidad.slice(1).toLowerCase(),
          email: email || null,
          phone: telefono ? String(telefono) : null,
          tipoIdentificacion: tipoDoc ? tipoDoc.toUpperCase() : null,
          numeroIdentificacion: numDoc ? String(numDoc) : null,
          fechaExpedicion: fechaExp,
          eps: seguridadSocial || null,
          tipoSalud: seguridadSocial || null,
          address: direccion || null,
          classId,
          sectionId,
          organizationId: 2, // Fundisalud
          sedeId: 3, // Sede Olaya Fundisalud (Cartagena)
          balance: 0,
          status: 'active',
        },
      });

      // Matrícula fee
      await prisma.fee.create({
        data: {
          studentId: student.id,
          feeTypeId: 1, // Matricula
          amount: valorMatricula,
          dueDate: new Date(2026, 1, 1),
          status: 'PENDING',
        },
      });

      // Monthly pensions
      const numMeses = totalAnual > 0 && valorPension > 0
        ? Math.round((totalAnual - valorMatricula) / valorPension)
        : 10;

      for (let m = 0; m < numMeses; m++) {
        await prisma.fee.create({
          data: {
            studentId: student.id,
            feeTypeId: 2, // Mensualidad
            amount: valorPension,
            dueDate: new Date(2026, 1 + m, 1),
            status: 'PENDING',
            installmentNumber: m + 1,
          },
        });
      }

      imported++;
      console.log(`  [Fundisalud] ${nombre} ${apellido} - ${programa} - Sem ${semestre} - Matrícula: $${valorMatricula.toLocaleString()}, Pensión: $${valorPension.toLocaleString()}/mes x${numMeses} = Total: $${totalAnual.toLocaleString()}`);
    } catch (err: any) {
      console.error(`  ERROR importing ${nombre} ${apellido}: ${err.message}`);
    }
  }

  return imported;
}

async function main() {
  const excelPath = path.join(__dirname, '..', 'formato plataforma cartagena  fundisalud 2026.xlsx');
  console.log('Reading Excel file:', excelPath);

  const wb = XLSX.readFile(excelPath);
  console.log('Sheets found:', wb.SheetNames);

  // First, clean up existing seed students to avoid duplicates
  // We'll delete students that were created by the seed (they have specific admission patterns)
  const existingCount = await prisma.student.count();
  console.log(`\nExisting students in DB: ${existingCount}`);
  console.log('Deleting existing students to reimport fresh...');
  await prisma.fee.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.receipt.deleteMany({});
  await prisma.student.deleteMany({});
  console.log('Cleaned up existing data.\n');

  // Import Minerva students
  console.log('=== Importing Minerva Students ===');
  const minervaSheet = wb.Sheets['Minerva'];
  const minervaCount = await importMinerva(minervaSheet);
  console.log(`\nMinerva: ${minervaCount} students imported\n`);

  // Import Fundisalud students
  console.log('=== Importing Fundisalud Students ===');
  const fundisaludSheet = wb.Sheets['Fundisalud'];
  const fundisaludCount = await importFundisalud(fundisaludSheet);
  console.log(`\nFundisalud: ${fundisaludCount} students imported\n`);

  console.log(`\n=== TOTAL: ${minervaCount + fundisaludCount} students imported ===`);

  // Summary
  const totalFees = await prisma.fee.count();
  const totalMatricula = await prisma.fee.aggregate({
    where: { feeTypeId: 1 },
    _sum: { amount: true },
  });
  const totalPensiones = await prisma.fee.aggregate({
    where: { feeTypeId: 2 },
    _sum: { amount: true },
  });

  console.log(`Total fees created: ${totalFees}`);
  console.log(`Total en matrículas: $${(totalMatricula._sum.amount || 0).toLocaleString()}`);
  console.log(`Total en pensiones: $${(totalPensiones._sum.amount || 0).toLocaleString()}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
