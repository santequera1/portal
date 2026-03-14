import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// These will be populated dynamically from the DB
let minervaClassMap: Record<string, number> = {};
let minervaClassSectionMap: Record<number, number> = {}; // classId -> sectionA id
let fundisaludClassMap: Record<string, number> = {};
let fundisaludClassSectionMap: Record<number, number> = {};
let orgIds: Record<string, number> = {};
let sedeIds: Record<string, number> = {};
let feeTypeIds: Record<string, number> = {};

async function loadMappings() {
  // Load organizations
  const orgs = await prisma.organization.findMany();
  for (const o of orgs) {
    if (o.name.toLowerCase().includes('minerva')) orgIds['minerva'] = o.id;
    if (o.name.toLowerCase().includes('fundisalud')) orgIds['fundisalud'] = o.id;
  }
  console.log('Organizations:', orgIds);

  // Load sedes
  const sedes = await prisma.sede.findMany();
  for (const s of sedes) {
    if (s.organizationId === orgIds['minerva'] && !sedeIds['minerva']) sedeIds['minerva'] = s.id;
    if (s.organizationId === orgIds['fundisalud'] && !sedeIds['fundisalud']) sedeIds['fundisalud'] = s.id;
  }
  console.log('Sedes:', sedeIds);

  // Load fee types
  const fts = await prisma.feeType.findMany();
  for (const ft of fts) {
    if (ft.name.toLowerCase().includes('matric')) feeTypeIds['matricula'] = ft.id;
    if (ft.name.toLowerCase() === 'mensualidad') feeTypeIds['mensualidad'] = ft.id;
  }
  console.log('Fee types:', feeTypeIds);

  // Load classes with sections
  const classes = await prisma.class.findMany({ include: { sections: true } });
  for (const c of classes) {
    const sectionA = c.sections.find(s => s.name === 'A') || c.sections[0];
    if (!sectionA) continue;

    if (c.category !== 'TECNICA') {
      // Minerva - map by grade name
      minervaClassMap[c.name] = c.id;
      minervaClassSectionMap[c.id] = sectionA.id;
    } else {
      // Fundisalud - map by program name (lowercase, normalized)
      const key = c.name.toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
        .replace(/ñ/g, 'n');
      fundisaludClassMap[key] = c.id;
      fundisaludClassSectionMap[c.id] = sectionA.id;
    }
  }
  console.log('Minerva classes:', Object.keys(minervaClassMap).length);
  console.log('Fundisalud classes:', Object.keys(fundisaludClassMap).length);
}

function findMinervaClassId(grado: string): number {
  // Try exact match first
  if (minervaClassMap[grado]) return minervaClassMap[grado];
  // Try cleaned version
  const cleaned = grado.replace(/\s+/g, '').replace(/\|/g, '');
  for (const [name, id] of Object.entries(minervaClassMap)) {
    if (name.replace(/\s+/g, '') === cleaned) return id;
    if (cleaned.startsWith(name.replace('°', '').replace(/\s+/g, ''))) return id;
  }
  // Default to first class
  const ids = Object.values(minervaClassMap);
  return ids[0] || 1;
}

function findFundisaludClassId(programa: string): number {
  const norm = programa.toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
    .replace(/ñ/g, 'n');
  // Try exact match
  if (fundisaludClassMap[norm]) return fundisaludClassMap[norm];
  // Try partial match
  for (const [name, id] of Object.entries(fundisaludClassMap)) {
    if (norm.includes(name) || name.includes(norm)) return id;
  }
  // Default to first fundisalud class
  const ids = Object.values(fundisaludClassMap);
  return ids[0] || 1;
}

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

    // Map grade to class dynamically
    const classId = findMinervaClassId(grado);
    const sectionId = minervaClassSectionMap[classId] || Object.values(minervaClassSectionMap)[0] || 1;

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
          organizationId: orgIds['minerva'] || 1,
          sedeId: sedeIds['minerva'] || 1,
          balance: 0,
          status: 'active',
        },
      });

      await prisma.fee.create({
        data: {
          studentId: student.id,
          feeTypeId: feeTypeIds['matricula'] || 1,
          amount: valorMatricula,
          dueDate: new Date(2026, 1, 1),
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
            feeTypeId: feeTypeIds['mensualidad'] || 2,
            amount: valorPension,
            dueDate: new Date(2026, 1 + m, 1),
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

    // Map program to class dynamically
    const classId = findFundisaludClassId(programa);
    const sectionId = fundisaludClassSectionMap[classId] || Object.values(fundisaludClassSectionMap)[0] || 1;

    const admissionNo = generateAdmissionNo('FUNDISALUD', i);

    // Capitalize words
    const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    try {
      const student = await prisma.student.create({
        data: {
          admissionNo,
          name: capitalize(nombre),
          lastName: capitalize(apellido),
          dateOfBirth: fechaNac,
          gender: genero,
          bloodGroup: tipoSangre || null,
          nationality: capitalize(nacionalidad),
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
          organizationId: orgIds['fundisalud'] || 2,
          sedeId: sedeIds['fundisalud'] || 1,
          balance: 0,
          status: 'active',
        },
      });

      await prisma.fee.create({
        data: {
          studentId: student.id,
          feeTypeId: feeTypeIds['matricula'] || 1,
          amount: valorMatricula,
          dueDate: new Date(2026, 1, 1),
          status: 'PENDING',
        },
      });

      const numMeses = totalAnual > 0 && valorPension > 0
        ? Math.round((totalAnual - valorMatricula) / valorPension)
        : 10;

      for (let m = 0; m < numMeses; m++) {
        await prisma.fee.create({
          data: {
            studentId: student.id,
            feeTypeId: feeTypeIds['mensualidad'] || 2,
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
  // Load dynamic mappings from DB
  await loadMappings();

  const excelPath = path.join(__dirname, '..', 'formato plataforma cartagena  fundisalud 2026.xlsx');
  console.log('\nReading Excel file:', excelPath);

  const wb = XLSX.readFile(excelPath);
  console.log('Sheets found:', wb.SheetNames);

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
    where: { feeTypeId: feeTypeIds['matricula'] || 1 },
    _sum: { amount: true },
  });
  const totalPensiones = await prisma.fee.aggregate({
    where: { feeTypeId: feeTypeIds['mensualidad'] || 2 },
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
