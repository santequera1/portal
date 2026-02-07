import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.schedule.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.examGroup.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.feeType.deleteMany();
  await prisma.feeGroup.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.staffAttendance.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.section.deleteMany();
  await prisma.class.deleteMany();
  await prisma.staffOrganization.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.academicSession.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.event.deleteMany();
  await prisma.gradeScale.deleteMany();
  await prisma.schoolConfig.deleteMany();
  await prisma.sede.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Organizations
  const minerva = await prisma.organization.create({
    data: { name: 'Minerva', code: 'MINERVA' },
  });
  const fundisalud = await prisma.organization.create({
    data: { name: 'Fundisalud', code: 'FUNDISALUD' },
  });

  console.log('Organizations created');

  // Sedes
  await prisma.sede.createMany({
    data: [
      { name: 'Sede Olaya', address: 'Calle 31 #10-45, Olaya Herrera, Cartagena', phone: '605-123-4567', organizationId: minerva.id },
      { name: 'Sede Arjona', address: 'Cra Principal #5-20, Arjona, Bolivar', phone: '605-234-5678', organizationId: minerva.id },
      { name: 'Sede Olaya', address: 'Calle 31 #10-50, Olaya Herrera, Cartagena', phone: '605-345-6789', organizationId: fundisalud.id },
      { name: 'Sede Arjona', address: 'Cra Principal #5-25, Arjona, Bolivar', phone: '605-456-7890', organizationId: fundisalud.id },
    ],
  });

  console.log('Sedes created');

  const passwordHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('profesor123', 10);

  // Users
  const superAdmin = await prisma.user.create({
    data: { email: 'admin@minerva.edu.co', password: passwordHash, name: 'Aureliano', role: 'SUPER_ADMIN', phone: '300-123-4567', address: 'Cra 10 #5-30, Cartagena', cargo: 'Director General' },
  });
  const admin = await prisma.user.create({
    data: { email: 'ana@minerva.edu.co', password: passwordHash, name: 'Ana Zays', role: 'ADMIN', phone: '300-234-5678', address: 'Calle 20 #12-15, Cartagena', cargo: 'Administradora' },
  });
  const teacher1User = await prisma.user.create({
    data: { email: 'rodriguez@minerva.edu.co', password: teacherHash, name: 'Prof. Ana Rodriguez', role: 'TEACHER', phone: '300-345-6789', cargo: 'Docente' },
  });
  const teacher2User = await prisma.user.create({
    data: { email: 'gomez@minerva.edu.co', password: teacherHash, name: 'Prof. Luis Gomez', role: 'TEACHER', phone: '300-456-7890', cargo: 'Docente' },
  });
  const accountant = await prisma.user.create({
    data: { email: 'contabilidad@minerva.edu.co', password: passwordHash, name: 'Sandra Contadora', role: 'ACCOUNTANT', phone: '300-567-8901', cargo: 'Contadora' },
  });
  const parent = await prisma.user.create({
    data: { email: 'padre@minerva.edu.co', password: passwordHash, name: 'Pedro Garcia', role: 'PARENT', phone: '300-678-9012' },
  });

  console.log('Users created');

  // Academic Session
  const session = await prisma.academicSession.create({
    data: { name: '2024-2025', startDate: new Date('2024-02-01'), endDate: new Date('2025-11-30'), isActive: true },
  });

  // Classes (Cursos) - Minerva: Primaria y Bachillerato
  const classNames = [
    { name: 'Transicion', order: 0, category: 'REGULAR', orgId: minerva.id },
    { name: '1° Primaria', order: 1, category: 'REGULAR', orgId: minerva.id },
    { name: '2° Primaria', order: 2, category: 'REGULAR', orgId: minerva.id },
    { name: '3° Primaria', order: 3, category: 'REGULAR', orgId: minerva.id },
    { name: '4° Primaria', order: 4, category: 'REGULAR', orgId: minerva.id },
    { name: '5° Primaria', order: 5, category: 'REGULAR', orgId: minerva.id },
    { name: '6°', order: 6, category: 'REGULAR', orgId: minerva.id },
    { name: '7°', order: 7, category: 'REGULAR', orgId: minerva.id },
    { name: '8°', order: 8, category: 'REGULAR', orgId: minerva.id },
    { name: '9°', order: 9, category: 'REGULAR', orgId: minerva.id },
    { name: '10°', order: 10, category: 'REGULAR', orgId: minerva.id },
    { name: '11°', order: 11, category: 'REGULAR', orgId: minerva.id },
    // Carreras Tecnicas - Fundisalud
    { name: 'Auxiliar de Enfermeria', order: 12, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Auxiliar en Farmacia', order: 13, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Auxiliar Contable', order: 14, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Gestion Administrativa', order: 15, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Seguridad Ocupacional', order: 16, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Atencion a la Primera Infancia', order: 17, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Tecnico en Sistemas', order: 18, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Electricidad Industrial y Comercial', order: 19, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Bodega y Centros de Distribucion', order: 20, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Administracion en Salud', order: 21, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Programa en Teologia y Biblia', order: 22, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Maquinaria Pesada', order: 23, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Radio Prensa y Television', order: 24, category: 'TECNICA', orgId: fundisalud.id },
    { name: 'Ingles Conversacional', order: 25, category: 'TECNICA', orgId: fundisalud.id },
  ];

  const classes: any[] = [];
  for (const cn of classNames) {
    const cls = await prisma.class.create({
      data: { name: cn.name, order: cn.order, sessionId: session.id, category: cn.category, organizationId: cn.orgId },
    });
    classes.push(cls);
  }

  // Sections A and B for each class
  const sections: any[] = [];
  for (const cls of classes) {
    for (const sName of ['A', 'B']) {
      const sec = await prisma.section.create({
        data: { name: sName, classId: cls.id },
      });
      sections.push({ ...sec, classId: cls.id });
    }
  }

  // Subjects - Minerva subjects
  const minervaSubjectDefs = [
    { name: 'Matematicas', code: 'MAT' },
    { name: 'Espanol', code: 'ESP' },
    { name: 'Ciencias Naturales', code: 'NAT' },
    { name: 'Ciencias Sociales', code: 'SOC' },
    { name: 'Ingles', code: 'ING' },
    { name: 'Educacion Fisica', code: 'EDF' },
    { name: 'Informatica', code: 'INF' },
    { name: 'Etica y Valores', code: 'ETI' },
  ];

  // Subjects - Fundisalud subjects
  const fundisaludSubjectDefs = [
    { name: 'Fundamentos de Enfermeria', code: 'ENF' },
    { name: 'Farmacologia Basica', code: 'FAR' },
    { name: 'Contabilidad General', code: 'CON' },
    { name: 'Administracion', code: 'ADM' },
    { name: 'Salud Ocupacional', code: 'SAO' },
    { name: 'Desarrollo Infantil', code: 'DEI' },
    { name: 'Programacion', code: 'PRG' },
    { name: 'Electricidad', code: 'ELE' },
    { name: 'Logistica', code: 'LOG' },
    { name: 'Gestion en Salud', code: 'GES' },
    { name: 'Teologia', code: 'TEO' },
    { name: 'Mecanica y Maquinaria', code: 'MEC' },
    { name: 'Comunicacion y Medios', code: 'COM' },
    { name: 'Ingles', code: 'ING2' },
  ];

  const allSubjects: any[] = [];
  for (const sd of minervaSubjectDefs) {
    const sub = await prisma.subject.create({ data: { ...sd, organizationId: minerva.id } });
    allSubjects.push(sub);
  }
  for (const sd of fundisaludSubjectDefs) {
    const sub = await prisma.subject.create({ data: { ...sd, organizationId: fundisalud.id } });
    allSubjects.push(sub);
  }

  // Assign subjects to classes via ClassSubject
  const coreSubjects = allSubjects.filter(s => ['MAT', 'ESP', 'NAT', 'SOC', 'ING'].includes(s.code));
  const extraSubjects = allSubjects.filter(s => ['EDF', 'INF', 'ETI'].includes(s.code));

  // Core + extra subjects for Minerva classes (Transicion + 1°-5° + 6°-11° = 12 classes)
  for (const cls of classes.slice(0, 12)) {
    for (const sub of [...coreSubjects, ...extraSubjects]) {
      await prisma.classSubject.create({ data: { classId: cls.id, subjectId: sub.id } });
    }
  }

  // Technical subjects for Fundisalud career programs
  const techMappings: Record<string, string[]> = {
    'Auxiliar de Enfermeria': ['MAT', 'ESP', 'ING', 'ENF', 'ETI'],
    'Auxiliar en Farmacia': ['MAT', 'ESP', 'ING', 'FAR', 'ETI'],
    'Auxiliar Contable': ['MAT', 'ESP', 'ING', 'CON', 'INF'],
    'Gestion Administrativa': ['MAT', 'ESP', 'ING', 'ADM', 'INF'],
    'Seguridad Ocupacional': ['MAT', 'ESP', 'ING', 'SAO', 'ETI'],
    'Atencion a la Primera Infancia': ['MAT', 'ESP', 'ING', 'DEI', 'ETI'],
    'Tecnico en Sistemas': ['MAT', 'ESP', 'ING', 'PRG', 'INF'],
    'Electricidad Industrial y Comercial': ['MAT', 'ESP', 'ING', 'ELE', 'INF'],
    'Bodega y Centros de Distribucion': ['MAT', 'ESP', 'ING', 'LOG', 'INF'],
    'Administracion en Salud': ['MAT', 'ESP', 'ING', 'GES', 'ADM'],
    'Programa en Teologia y Biblia': ['ESP', 'ING', 'TEO', 'ETI', 'SOC'],
    'Maquinaria Pesada': ['MAT', 'ESP', 'ING', 'MEC', 'ELE'],
    'Radio Prensa y Television': ['ESP', 'ING', 'COM', 'INF', 'ETI'],
    'Ingles Conversacional': ['ING', 'ING2', 'ESP', 'INF', 'ETI'],
  };

  for (const cls of classes.slice(12)) {
    const codes = techMappings[cls.name] || ['MAT', 'ESP', 'ING'];
    for (const code of codes) {
      const sub = allSubjects.find(s => s.code === code);
      if (sub) {
        await prisma.classSubject.create({ data: { classId: cls.id, subjectId: sub.id } });
      }
    }
  }

  console.log('Academic structure created');

  // Staff Members
  const teacher1 = await prisma.staffMember.create({
    data: { name: 'Prof. Ana Rodriguez', department: 'Academico', designation: 'Profesor', phone: '300-345-6789', email: 'rodriguez@minerva.edu.co', userId: teacher1User.id },
  });
  const teacher2 = await prisma.staffMember.create({
    data: { name: 'Prof. Luis Gomez', department: 'Academico', designation: 'Profesor', phone: '300-456-7890', email: 'gomez@minerva.edu.co', userId: teacher2User.id },
  });
  const coordStaff = await prisma.staffMember.create({
    data: { name: 'Maria Coordinadora', department: 'Administrativo', designation: 'Coordinador', phone: '300-234-5678', email: 'coordinador@minerva.edu.co', userId: admin.id },
  });
  const contStaff = await prisma.staffMember.create({
    data: { name: 'Sandra Contadora', department: 'Administrativo', designation: 'Contador', phone: '300-567-8901', email: 'contabilidad@minerva.edu.co', userId: accountant.id },
  });
  const mantStaff = await prisma.staffMember.create({
    data: { name: 'Jorge Mantenimiento', department: 'Mantenimiento', designation: 'Servicios Generales', phone: '300-999-8888' },
  });

  // Staff-Organization associations (teachers can belong to both)
  await prisma.staffOrganization.createMany({
    data: [
      { staffId: teacher1.id, organizationId: minerva.id },
      { staffId: teacher1.id, organizationId: fundisalud.id },
      { staffId: teacher2.id, organizationId: minerva.id },
      { staffId: coordStaff.id, organizationId: minerva.id },
      { staffId: coordStaff.id, organizationId: fundisalud.id },
      { staffId: contStaff.id, organizationId: minerva.id },
      { staffId: contStaff.id, organizationId: fundisalud.id },
      { staffId: mantStaff.id, organizationId: minerva.id },
    ],
  });

  // Teacher Assignments (use ClassSubject to find subjects for each class)
  for (const cls of classes.slice(0, 6)) {
    const classSubjectRels = await prisma.classSubject.findMany({ where: { classId: cls.id }, include: { subject: true } });
    const classSections = sections.filter(s => s.classId === cls.id);
    for (const sec of classSections) {
      for (let i = 0; i < Math.min(classSubjectRels.length, 5); i++) {
        await prisma.teacherAssignment.create({
          data: { teacherId: i % 2 === 0 ? teacher1.id : teacher2.id, subjectId: classSubjectRels[i].subjectId, classId: cls.id, sectionId: sec.id },
        });
      }
    }
  }

  console.log('Staff and assignments created');

  // ---- Mapping CSV carrera names (with accents) to seed class names (no accents) ----
  const carreraMap: Record<string, string> = {
    'Bodega y Centros de Distribución': 'Bodega y Centros de Distribucion',
    'Auxiliar Contable': 'Auxiliar Contable',
    'Electricidad Industrial y Comercial': 'Electricidad Industrial y Comercial',
    'Auxiliar de Enfermería': 'Auxiliar de Enfermeria',
    'Gestión Administrativa': 'Gestion Administrativa',
    'Atención a la Primera Infancia': 'Atencion a la Primera Infancia',
    'Administración en Salud': 'Administracion en Salud',
    'Maquinaria Pesada': 'Maquinaria Pesada',
    'Técnico en Sistemas': 'Tecnico en Sistemas',
    'Radio Prensa y Televisión': 'Radio Prensa y Television',
    'Auxiliar en Farmacia': 'Auxiliar en Farmacia',
    'Inglés Conversacional (A1–B2)': 'Ingles Conversacional',
    'Programa en Teología y Biblia': 'Programa en Teologia y Biblia',
  };

  const epsOptions = ['Familiar de Colombia', 'Nueva EPS', 'Salud Total', 'Cajacopi', 'Anas Wayuu', 'Sanitas', 'A1'];

  // ======== MINERVA STUDENTS (from minerva CSV) ========
  // All Minerva classes for distribution
  const minervaClasses = classes.filter(c => c.organizationId === minerva.id);

  const minervaCSVData = [
    { name: 'Daniel Alberto', lastName: 'Ramirez Gonzalez', tipoId: 'P.P.T.', eps: '', numId: '6375582', fechaExp: '2022-01-31', lugarExp: 'Bogota D.C.', fechaNac: '2009-06-09', lugarNac: 'Venezuela', gender: 'Masculino', grade: '6°' },
    { name: 'Yerlis Jhoana', lastName: 'Ozuna Ipuana', tipoId: 'C.C.', eps: 'Familiar de Colombia', numId: '1118800510', fechaExp: '2022-01-28', lugarExp: 'Riohacha', fechaNac: '2003-12-15', lugarNac: 'Riohacha, La Guajira', gender: 'Femenino', grade: '11°' },
    { name: 'Marlon De Jesus', lastName: 'Palacio Santos', tipoId: 'T.I.', eps: 'Familiar de Colombia', numId: '1119701254', fechaExp: '2026-09-11', lugarExp: 'Riohacha', fechaNac: '2008-11-29', lugarNac: 'Riohacha, La Guajira', gender: 'Masculino', grade: '7°' },
    { name: 'Ruth Elena', lastName: 'Solorzano Carretero', tipoId: 'T.I.', eps: 'A1', numId: '1043451445', fechaExp: '2025-07-28', lugarExp: 'Riohacha', fechaNac: '2008-06-21', lugarNac: 'Riohacha, La Guajira', gender: 'Femenino', grade: '7°' },
    { name: 'Luz Daniela', lastName: 'Solorzano Carretero', tipoId: 'C.C.', eps: 'A1', numId: '1140820880', fechaExp: '2025-07-23', lugarExp: 'Barranquilla, Atlantico', fechaNac: '2006-07-05', lugarNac: 'Barranquilla', gender: 'Femenino', grade: '10°' },
    { name: 'Eva Maria', lastName: 'Rodriguez Ustate', tipoId: 'T.I.', eps: 'Nueva EPS', numId: '1118828393', fechaExp: '2014-03-12', lugarExp: 'Riohacha', fechaNac: '2007-11-29', lugarNac: 'Riohacha, La Guajira', gender: 'Femenino', grade: '8°' },
    { name: 'Orleydis Dayan', lastName: 'Radillo Tausa', tipoId: 'T.I.', eps: 'Salud Total', numId: '1119394967', fechaExp: '2016-07-22', lugarExp: 'Riohacha', fechaNac: '2008-12-23', lugarNac: 'Riohacha, La Guajira', gender: 'Femenino', grade: '7°' },
    { name: 'Maria Alejandra', lastName: 'Bello Arena', tipoId: 'T.I.', eps: 'Nueva EPS', numId: '1119404755', fechaExp: '2018-09-26', lugarExp: 'Riohacha', fechaNac: '2010-12-08', lugarNac: 'Riohacha, La Guajira', gender: 'Femenino', grade: '5° Primaria' },
    { name: 'Joel Jose', lastName: 'Quevedo Flores', tipoId: 'P.P.T.', eps: 'Cajacopi', numId: '5488063', fechaExp: '2022-01-31', lugarExp: 'Bogota D.C.', fechaNac: '2007-12-27', lugarNac: 'Venezuela', gender: 'Masculino', grade: '8°' },
    { name: 'Yhoaleska Josefina', lastName: 'Quevedo Flores', tipoId: 'P.P.T.', eps: 'Cajacopi', numId: '5487708', fechaExp: '2022-01-31', lugarExp: 'Bogota D.C.', fechaNac: '2009-09-08', lugarNac: 'Venezuela', gender: 'Femenino', grade: '6°' },
    { name: 'David Alberto', lastName: 'Orozco Ortiz', tipoId: 'T.I.', eps: 'Anas Wayuu', numId: '1118831803', fechaExp: '2015-10-07', lugarExp: 'Riohacha', fechaNac: '2008-06-25', lugarNac: 'Riohacha, La Guajira', gender: 'Masculino', grade: '7°' },
    { name: 'Jhenjinith', lastName: 'Navarro Rivaneira', tipoId: 'T.I.', eps: 'Cajacopi', numId: '1119396538', fechaExp: '2018-08-14', lugarExp: 'Riohacha', fechaNac: '2010-03-05', lugarNac: 'Riohacha, La Guajira', gender: 'Femenino', grade: '5° Primaria' },
    { name: 'Yamiris', lastName: 'Pushaina Epiayu', tipoId: 'C.C.', eps: 'Anas Wayuu', numId: '1006571599', fechaExp: '2013-07-26', lugarExp: 'Riohacha', fechaNac: '1994-06-13', lugarNac: 'Riohacha, La Guajira', gender: 'Femenino', grade: '9°' },
    { name: 'Edeila', lastName: 'Ipuana Epieyu', tipoId: 'C.C.', eps: 'Anas Wayuu', numId: '1124043511', fechaExp: '2011-09-15', lugarExp: 'Maicao', fechaNac: '1993-06-14', lugarNac: 'Maicao, La Guajira', gender: 'Femenino', grade: '9°' },
    { name: 'Keiner Smith', lastName: 'Gonzalez Ortiz', tipoId: 'T.I.', eps: 'Salud Total', numId: '1065620488', fechaExp: '2016-10-18', lugarExp: 'Riohacha', fechaNac: '2008-08-13', lugarNac: 'Valledupar, Cesar', gender: 'Masculino', grade: '7°' },
  ];

  // Map grade names to class objects
  const gradeToClass: Record<string, any> = {};
  for (const cls of minervaClasses) {
    gradeToClass[cls.name] = cls;
  }

  // Invented parents/addresses for Minerva students
  const minervaExtras = [
    { fatherName: 'Alberto Ramirez', fatherPhone: '300-412-7831', motherName: 'Carmen Gonzalez', motherPhone: '301-589-3246', responsable: 'Madre', address: 'Calle 5 #12-30, Riohacha, La Guajira' },
    { fatherName: 'Luis Ozuna', fatherPhone: '302-714-5290', motherName: 'Jhoana Ipuana Mendez', motherPhone: '300-823-1574', responsable: 'Estudiante', address: 'Cra 8 #18-22, Riohacha, La Guajira' },
    { fatherName: 'Jesus Palacio Rivera', fatherPhone: '301-234-8761', motherName: 'Maria Santos Mejia', motherPhone: '305-912-4378', responsable: 'Padre', address: 'Manzana 3 Casa 7, Riohacha, La Guajira' },
    { fatherName: 'Enrique Solorzano', fatherPhone: '300-567-2134', motherName: 'Ruth Carretero Luna', motherPhone: '302-341-8976', responsable: 'Madre', address: 'Calle 15 #6-40, Riohacha, La Guajira' },
    { fatherName: 'Enrique Solorzano', fatherPhone: '300-567-2134', motherName: 'Ruth Carretero Luna', motherPhone: '302-341-8976', responsable: 'Madre', address: 'Calle 15 #6-40, Barranquilla, Atlantico' },
    { fatherName: 'Carlos Rodriguez', fatherPhone: '304-190-5623', motherName: 'Eva Ustate Diaz', motherPhone: '301-847-2390', responsable: 'Madre', address: 'Cra 12 #20-15, Riohacha, La Guajira' },
    { fatherName: 'Dayan Radillo Ospina', fatherPhone: '300-678-4521', motherName: 'Oleydis Tausa Reyes', motherPhone: '303-215-8764', responsable: 'Padre', address: 'Manzana 8 Casa 12, Riohacha, La Guajira' },
    { fatherName: 'Ricardo Bello Lopez', fatherPhone: '305-432-1897', motherName: 'Alejandra Arena Vega', motherPhone: '300-789-3456', responsable: 'Madre', address: 'Calle 22 #3-40, Riohacha, La Guajira' },
    { fatherName: 'Jose Quevedo Mendez', fatherPhone: '301-567-8934', motherName: 'Maria Flores Diaz', motherPhone: '304-123-7856', responsable: 'Padre', address: 'Cra 4 #10-25, Riohacha, La Guajira' },
    { fatherName: 'Jose Quevedo Mendez', fatherPhone: '301-567-8934', motherName: 'Maria Flores Diaz', motherPhone: '304-123-7856', responsable: 'Madre', address: 'Cra 4 #10-25, Riohacha, La Guajira' },
    { fatherName: 'Alberto Orozco Reyes', fatherPhone: '302-345-9012', motherName: 'Patricia Ortiz Herrera', motherPhone: '300-456-1237', responsable: 'Padre', address: 'Manzana 5 Casa 9, Riohacha, La Guajira' },
    { fatherName: 'Fernando Navarro', fatherPhone: '300-891-2345', motherName: 'Carmen Rivaneira Lopez', motherPhone: '305-678-2341', responsable: 'Madre', address: 'Calle 30 #8-50, Riohacha, La Guajira' },
    { fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', responsable: 'Estudiante', address: 'Comunidad Wayuu, Riohacha, La Guajira' },
    { fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', responsable: 'Estudiante', address: 'Comunidad Wayuu, Maicao, La Guajira' },
    { fatherName: 'Smith Gonzalez Diaz', fatherPhone: '303-456-7890', motherName: 'Keyla Ortiz Mejia', motherPhone: '301-234-5678', responsable: 'Padre', address: 'Cra 10 #14-27, Valledupar, Cesar' },
  ];

  const students: any[] = [];

  // Create Minerva students
  for (let i = 0; i < minervaCSVData.length; i++) {
    const sd = minervaCSVData[i];
    const ext = minervaExtras[i];
    const cls = gradeToClass[sd.grade] || minervaClasses[i % minervaClasses.length];
    const classSections = sections.filter(s => s.classId === cls.id);
    const sec = classSections[i % classSections.length] || classSections[0];

    const studentData: any = {
      admissionNo: `MIN-2024-${String(i + 1).padStart(3, '0')}`,
      name: sd.name,
      lastName: sd.lastName,
      gender: sd.gender,
      dateOfBirth: new Date(sd.fechaNac),
      tipoIdentificacion: sd.tipoId,
      numeroIdentificacion: sd.numId,
      fechaExpedicion: new Date(sd.fechaExp),
      lugarExpedicion: sd.lugarExp,
      lugarNacimiento: sd.lugarNac,
      eps: sd.eps || null,
      responsableTipo: ext.responsable,
      fatherName: ext.fatherName || null,
      fatherPhone: ext.fatherPhone || null,
      motherName: ext.motherName || null,
      motherPhone: ext.motherPhone || null,
      nationality: sd.lugarNac.includes('Venezuela') ? 'Venezolana' : 'Colombiana',
      address: ext.address,
      classId: cls.id,
      sectionId: sec.id,
      organizationId: minerva.id,
      enrollmentDate: new Date('2024-02-01'),
      exalumno: false,
      status: 'active',
    };

    const student = await prisma.student.create({ data: studentData });
    students.push(student);
  }

  console.log(`${students.length} Minerva students created`);

  // ======== FUNDISALUD STUDENTS (from fundisalud CSV - carreras tecnicas) ========
  const fundisaludCSVData = [
    { name: 'Nady Luz', lastName: 'Bassa Berrio', numId: '1108760382', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Jissela Mileidys', lastName: 'Goither Moya', numId: '1143329905', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Leidis Yolima', lastName: 'Marimon Marimon', numId: '1007401992', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Juan Jose', lastName: 'Pino Mendez', numId: '1143330764', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Farina', lastName: 'De Avila Barrios', numId: '1041978675', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Angie Daniela', lastName: 'Mercado Morales', numId: '1042583643', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Yulis Maria', lastName: 'Ruiz Serpa', numId: '1143352649', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Leyner De Jesus', lastName: 'Reyes Wilchez', numId: '1067164818', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Ignacio Jose', lastName: 'Arenas Portela', numId: '1047503653', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Hernando David', lastName: 'Diaz Diaz', numId: '1043658676', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Betty Yohana', lastName: 'Perez Jimenez', numId: '1044936997', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Gabriela Sofia', lastName: 'Zuniga Cowan', numId: '1043638597', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Yoleidis Paola', lastName: 'Pajaro Acuna', numId: '1002060321', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Natalia Cristina', lastName: 'Arroyo Hurtado', numId: '1044907281', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Bleidys Susana', lastName: 'Pereira Garcia', numId: '1044933157', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Yasmin Johana', lastName: 'Arroyo Hurtado', numId: '1043652417', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Ingris Ester', lastName: 'Suarez Martinez', numId: '1044913619', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Saray Julieth', lastName: 'Rincon Castro', numId: '1042607424', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Jose David', lastName: 'Castiblanco Murillo', numId: '1044910838', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Rosilda', lastName: 'Bechara Cervantes', numId: '1051890754', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Anny Dalay', lastName: 'Marin Leon', numId: '1042606626', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
    { name: 'Naibeth Paola', lastName: 'Pajaro Troya', numId: '1044930454', contrato: 'CT2600023364', poliza: '2000698272', cotizacion: 'PR260204001517', certificado: '1805432451' },
  ];

  // Invented extra data for Fundisalud students (carreras, EPS, parents, addresses, dates)
  const fundisaludCarreras = [
    'Bodega y Centros de Distribucion', 'Auxiliar Contable', 'Electricidad Industrial y Comercial',
    'Auxiliar de Enfermeria', 'Gestion Administrativa', 'Atencion a la Primera Infancia',
    'Administracion en Salud', 'Maquinaria Pesada', 'Tecnico en Sistemas',
    'Radio Prensa y Television', 'Auxiliar en Farmacia', 'Ingles Conversacional',
    'Auxiliar de Enfermeria', 'Gestion Administrativa', 'Administracion en Salud',
    'Bodega y Centros de Distribucion', 'Auxiliar Contable', 'Atencion a la Primera Infancia',
    'Tecnico en Sistemas', 'Programa en Teologia y Biblia', 'Electricidad Industrial y Comercial',
    'Auxiliar en Farmacia',
  ];

  const fundisaludExtras = [
    { eps: 'Familiar de Colombia', gender: 'Femenino', fechaNac: '2005-03-04', fechaExp: '2023-08-17', fechaIngreso: '2024-02-15', exalumno: false, responsable: 'Madre', fatherName: 'Alberto Bassa Mejia', fatherPhone: '300-512-3847', motherName: 'Luz Dary Berrio Padilla', motherPhone: '301-689-4251', address: 'Calle 31 #10-45, Olaya Herrera, Cartagena' },
    { eps: 'Nueva EPS', gender: 'Femenino', fechaNac: '2003-01-31', fechaExp: '2021-09-30', fechaIngreso: '2024-04-02', exalumno: false, responsable: 'Padre', fatherName: 'Ramon Goither Perez', fatherPhone: '302-814-6291', motherName: 'Mileidys Moya Herrera', motherPhone: '300-923-2574', address: 'Manzana 6 Casa 14, Nelson Mandela, Cartagena' },
    { eps: 'Cajacopi', gender: 'Femenino', fechaNac: '2001-02-23', fechaExp: '2024-08-03', fechaIngreso: '2023-06-28', exalumno: false, responsable: 'Estudiante', fatherName: 'Pedro Marimon Luna', fatherPhone: '301-334-9761', motherName: 'Yolima Marimon Torres', motherPhone: '305-012-5378', address: 'Cra 78 #30-22, Fredonia, Cartagena' },
    { eps: 'Salud Total', gender: 'Masculino', fechaNac: '2004-06-19', fechaExp: '2022-11-14', fechaIngreso: '2024-01-15', exalumno: false, responsable: 'Madre', fatherName: 'Jose Pino Suarez', fatherPhone: '300-667-3134', motherName: 'Elena Mendez Rios', motherPhone: '302-441-9976', address: 'Calle 50 #15-30, El Pozon, Cartagena' },
    { eps: 'Familiar de Colombia', gender: 'Femenino', fechaNac: '2002-09-08', fechaExp: '2023-05-09', fechaIngreso: '2023-03-10', exalumno: false, responsable: 'Padre', fatherName: 'Carlos De Avila Gomez', fatherPhone: '304-290-6623', motherName: 'Maria Barrios Luna', motherPhone: '301-947-3390', address: 'Av Pedro de Heredia #45-12, Bosque, Cartagena' },
    { eps: 'Anas Wayuu', gender: 'Femenino', fechaNac: '2003-12-02', fechaExp: '2021-07-22', fechaIngreso: '2023-08-01', exalumno: true, fechaSalida: '2025-05-18', responsable: 'Madre', fatherName: 'Felipe Mercado Rios', fatherPhone: '300-778-5521', motherName: 'Daniela Morales Vega', motherPhone: '303-315-9764', address: 'Cra 52 #20-18, Manga, Cartagena' },
    { eps: 'Sanitas', gender: 'Femenino', fechaNac: '2005-01-25', fechaExp: '2022-03-30', fechaIngreso: '2024-02-11', exalumno: false, responsable: 'Padre', fatherName: 'Manuel Ruiz Padilla', fatherPhone: '305-532-2897', motherName: 'Maria Serpa Orozco', motherPhone: '300-889-4456', address: 'Manzana 12 Casa 8, 13 de Junio, Cartagena' },
    { eps: 'A1', gender: 'Masculino', fechaNac: '2001-04-14', fechaExp: '2020-10-05', fechaIngreso: '2023-07-19', exalumno: false, responsable: 'Estudiante', fatherName: 'Jesus Reyes Gomez', fatherPhone: '301-667-9934', motherName: 'Liliana Wilchez Perez', motherPhone: '304-223-8856', address: 'Calle 74 #22-10, San Fernando, Cartagena' },
    { eps: 'Nueva EPS', gender: 'Masculino', fechaNac: '2002-11-30', fechaExp: '2023-01-12', fechaIngreso: '2024-03-06', exalumno: false, responsable: 'Madre', fatherName: 'Jose Arenas Herrera', fatherPhone: '302-445-0012', motherName: 'Marta Portela Diaz', motherPhone: '300-556-2237', address: 'Cra 38 #50-15, Pie de la Popa, Cartagena' },
    { eps: 'Salud Total', gender: 'Masculino', fechaNac: '2000-08-21', fechaExp: '2022-09-18', fechaIngreso: '2023-01-27', exalumno: false, responsable: 'Estudiante', fatherName: 'David Diaz Lopez', fatherPhone: '300-991-3345', motherName: 'Carmen Diaz Pacheco', motherPhone: '305-778-3341', address: 'Calle 25 #8-30, Centro, Cartagena' },
    { eps: 'Cajacopi', gender: 'Femenino', fechaNac: '2004-02-10', fechaExp: '2023-06-02', fechaIngreso: '2024-05-09', exalumno: false, responsable: 'Madre', fatherName: 'Alvaro Perez Acosta', fatherPhone: '303-556-8890', motherName: 'Betty Jimenez Castillo', motherPhone: '301-334-6678', address: 'Manzana 3 Casa 21, La Esperanza, Cartagena' },
    { eps: 'Familiar de Colombia', gender: 'Femenino', fechaNac: '2005-07-06', fechaExp: '2021-12-11', fechaIngreso: '2023-09-14', exalumno: false, responsable: 'Padre', fatherName: 'Santiago Zuniga Mejia', fatherPhone: '304-667-9901', motherName: 'Sofia Cowan Jimenez', motherPhone: '302-990-2234', address: 'Cra 21 #45-67, Bocagrande, Cartagena' },
    { eps: 'Sanitas', gender: 'Femenino', fechaNac: '2006-10-17', fechaExp: '2024-01-28', fechaIngreso: '2024-06-20', exalumno: true, fechaSalida: '2025-11-30', responsable: 'Madre', fatherName: 'Antonio Pajaro Rivera', fatherPhone: '300-445-7789', motherName: 'Yolanda Acuna Mendoza', motherPhone: '305-223-5567', address: 'Calle 15 #30-42, Ternera, Cartagena' },
    { eps: 'Anas Wayuu', gender: 'Femenino', fechaNac: '2001-05-03', fechaExp: '2023-04-19', fechaIngreso: '2023-04-07', exalumno: false, responsable: 'Estudiante', fatherName: 'Fernando Arroyo Gonzalez', fatherPhone: '301-778-0012', motherName: 'Natalia Hurtado Reyes', motherPhone: '303-556-2234', address: 'Av Crisanto Luque #12-34, Barrio Chino, Cartagena' },
    { eps: 'A1', gender: 'Femenino', fechaNac: '2003-09-29', fechaExp: '2022-08-07', fechaIngreso: '2024-02-18', exalumno: false, responsable: 'Padre', fatherName: 'Andres Pereira Diaz', fatherPhone: '304-889-1123', motherName: 'Bleidys Garcia Ospina', motherPhone: '300-667-9901', address: 'Manzana 9 Casa 5, Villa Estrella, Cartagena' },
    { eps: 'Salud Total', gender: 'Femenino', fechaNac: '2004-12-15', fechaExp: '2023-10-25', fechaIngreso: '2023-11-05', exalumno: false, responsable: 'Madre', fatherName: 'Jorge Arroyo Gonzalez', fatherPhone: '301-778-0012', motherName: 'Johana Hurtado Reyes', motherPhone: '303-556-2234', address: 'Av Crisanto Luque #12-34, Barrio Chino, Cartagena' },
    { eps: 'Nueva EPS', gender: 'Femenino', fechaNac: '2002-03-27', fechaExp: '2021-06-13', fechaIngreso: '2023-02-09', exalumno: false, responsable: 'Padre', fatherName: 'Luis Suarez Padilla', fatherPhone: '302-990-4456', motherName: 'Ingris Martinez Villar', motherPhone: '301-445-7789', address: 'Cra 65 #18-40, Boston, Cartagena' },
    { eps: 'Cajacopi', gender: 'Femenino', fechaNac: '2005-06-01', fechaExp: '2022-02-17', fechaIngreso: '2024-01-22', exalumno: false, responsable: 'Madre', fatherName: 'Diego Rincon Ortiz', fatherPhone: '305-334-6678', motherName: 'Saray Castro Ruiz', motherPhone: '300-778-0012', address: 'Calle 38 #52-19, Crespo, Cartagena' },
    { eps: 'Familiar de Colombia', gender: 'Masculino', fechaNac: '2001-01-12', fechaExp: '2023-03-08', fechaIngreso: '2023-03-15', exalumno: false, responsable: 'Estudiante', fatherName: 'Miguel Castiblanco Lopez', fatherPhone: '303-667-9901', motherName: 'Rosa Murillo Herrera', motherPhone: '304-990-2234', address: 'Cra 10 #70-25, Nuevo Bosque, Cartagena' },
    { eps: 'Sanitas', gender: 'Femenino', fechaNac: '2000-04-09', fechaExp: '2021-11-20', fechaIngreso: '2023-08-30', exalumno: true, fechaSalida: '2025-09-12', responsable: 'Acudiente', fatherName: 'Jaime Bechara Jaimes', fatherPhone: '300-223-5567', motherName: 'Rosalba Cervantes Lara', motherPhone: '302-667-9901', acudienteNombre: 'Patricia Bechara Cervantes', acudienteTelefono: '305-889-1123', acudienteEmail: 'patricia.bechara@gmail.com', acudienteOcupacion: 'Enfermera', address: 'Calle 60 #14-08, La Quinta, Cartagena' },
    { eps: 'A1', gender: 'Femenino', fechaNac: '2004-08-26', fechaExp: '2022-07-01', fechaIngreso: '2024-04-12', exalumno: false, responsable: 'Padre', fatherName: 'Ricardo Marin Restrepo', fatherPhone: '301-556-8890', motherName: 'Dalay Leon Perez', motherPhone: '304-334-6678', address: 'Manzana 2 Casa 16, Villa Rosita, Cartagena' },
    { eps: 'Anas Wayuu', gender: 'Femenino', fechaNac: '2006-02-18', fechaExp: '2023-09-06', fechaIngreso: '2023-10-03', exalumno: false, responsable: 'Madre', fatherName: 'Sergio Pajaro Acosta', fatherPhone: '302-778-0012', motherName: 'Paola Troya Velasquez', motherPhone: '300-445-7789', address: 'Cra 45 #28-11, Blas de Lezo, Cartagena' },
  ];

  // Fundisalud classes (carreras tecnicas)
  const fundisaludClasses = classes.filter(c => c.organizationId === fundisalud.id);

  // Create Fundisalud students from CSV data
  for (let i = 0; i < fundisaludCSVData.length; i++) {
    const sd = fundisaludCSVData[i];
    const ext = fundisaludExtras[i];
    const carreraName = fundisaludCarreras[i];
    const cls = fundisaludClasses.find((c: any) => c.name === carreraName) || fundisaludClasses[i % fundisaludClasses.length];
    const classSections = sections.filter(s => s.classId === cls.id);
    const sec = classSections[i % classSections.length] || classSections[0];

    const studentData: any = {
      admissionNo: `FDS-2024-${String(i + 1).padStart(3, '0')}`,
      name: sd.name,
      lastName: sd.lastName,
      gender: ext.gender,
      dateOfBirth: new Date(ext.fechaNac),
      tipoIdentificacion: 'CC',
      numeroIdentificacion: sd.numId,
      fechaExpedicion: new Date(ext.fechaExp),
      numeroContrato: sd.contrato,
      numeroPoliza: sd.poliza,
      numeroCotizacion: sd.cotizacion,
      certificado: sd.certificado,
      eps: ext.eps,
      responsableTipo: ext.responsable,
      fatherName: ext.fatherName,
      fatherPhone: ext.fatherPhone,
      motherName: ext.motherName,
      motherPhone: ext.motherPhone,
      nationality: 'Colombiana',
      address: ext.address,
      classId: cls.id,
      sectionId: sec.id,
      organizationId: fundisalud.id,
      enrollmentDate: new Date(ext.fechaIngreso),
      exalumno: ext.exalumno,
      status: ext.exalumno ? 'inactive' : 'active',
    };

    if ((ext as any).fechaSalida) {
      studentData.fechaSalida = new Date((ext as any).fechaSalida);
    }

    if ((ext as any).acudienteNombre) {
      studentData.acudienteNombre = (ext as any).acudienteNombre;
      studentData.acudienteTelefono = (ext as any).acudienteTelefono;
      studentData.acudienteEmail = (ext as any).acudienteEmail;
      studentData.acudienteOcupacion = (ext as any).acudienteOcupacion;
    }

    const student = await prisma.student.create({ data: studentData });
    students.push(student);
  }

  console.log(`${students.length} total students created (15 Minerva + 22 Fundisalud)`);

  // Fee Types
  const matricula = await prisma.feeType.create({ data: { name: 'Matricula' } });
  const mensualidad = await prisma.feeType.create({ data: { name: 'Mensualidad' } });
  await prisma.feeType.create({ data: { name: 'Transporte' } });
  await prisma.feeType.create({ data: { name: 'Uniforme' } });
  await prisma.feeType.create({ data: { name: 'Material Didactico' } });

  // Fee Group
  await prisma.feeGroup.create({ data: { name: 'Cuotas 2024-2025', sessionId: session.id } });

  // Fees for each active student
  const activeStudents = students.filter(s => s.status !== 'inactive');
  for (const student of activeStudents) {
    await prisma.fee.create({
      data: { studentId: student.id, feeTypeId: matricula.id, amount: 500000, dueDate: new Date('2024-02-15'), status: 'PAID' },
    });

    const monthlyAmount = 350000 + Math.floor(Math.random() * 100000);
    for (let month = 1; month <= 5; month++) {
      const dueDate = new Date(2025, month, 15);
      const isPaid = month <= 2;
      const isPartial = month === 3 && Math.random() > 0.5;
      const isOverdue = month <= 1 && !isPaid;

      await prisma.fee.create({
        data: {
          studentId: student.id,
          feeTypeId: mensualidad.id,
          amount: monthlyAmount,
          dueDate,
          status: isPaid ? 'PAID' : isPartial ? 'PARTIAL' : isOverdue ? 'OVERDUE' : 'PENDING',
        },
      });
    }
  }

  // Some payments
  const paidFees = await prisma.fee.findMany({ where: { status: 'PAID' } });
  for (const fee of paidFees) {
    await prisma.payment.create({
      data: { feeId: fee.id, studentId: fee.studentId, amount: fee.amount, method: 'CASH', date: new Date(fee.dueDate.getTime() - 86400000 * 5) },
    });
  }

  const partialFees = await prisma.fee.findMany({ where: { status: 'PARTIAL' } });
  for (const fee of partialFees) {
    await prisma.payment.create({
      data: { feeId: fee.id, studentId: fee.studentId, amount: Math.floor(fee.amount * 0.5), method: 'TRANSFER' },
    });
  }

  console.log('Fees and payments created');

  // Transactions - with organizationId
  const transactionData = [
    { type: 'INCOME', description: 'Cobro de matriculas Febrero - Minerva', amount: 12000000, category: 'Matricula', date: new Date('2025-02-10'), organizationId: minerva.id },
    { type: 'INCOME', description: 'Mensualidades Febrero - Minerva', amount: 8500000, category: 'Mensualidad', date: new Date('2025-02-15'), organizationId: minerva.id },
    { type: 'INCOME', description: 'Mensualidades Marzo - Minerva', amount: 7200000, category: 'Mensualidad', date: new Date('2025-03-15'), organizationId: minerva.id },
    { type: 'EXPENSE', description: 'Nomina docentes Febrero - Minerva', amount: 15000000, category: 'Nomina', date: new Date('2025-02-28'), organizationId: minerva.id },
    { type: 'EXPENSE', description: 'Servicios publicos Febrero', amount: 2500000, category: 'Servicios', date: new Date('2025-02-20'), organizationId: minerva.id },
    { type: 'EXPENSE', description: 'Material didactico', amount: 1200000, category: 'Materiales', date: new Date('2025-02-25'), organizationId: minerva.id },
    { type: 'INCOME', description: 'Cobro matriculas Fundisalud', amount: 5000000, category: 'Matricula', date: new Date('2025-02-10'), organizationId: fundisalud.id },
    { type: 'INCOME', description: 'Mensualidades Febrero - Fundisalud', amount: 3500000, category: 'Mensualidad', date: new Date('2025-02-15'), organizationId: fundisalud.id },
    { type: 'EXPENSE', description: 'Nomina docentes Febrero - Fundisalud', amount: 8000000, category: 'Nomina', date: new Date('2025-02-28'), organizationId: fundisalud.id },
    { type: 'EXPENSE', description: 'Nomina docentes Marzo - Minerva', amount: 15000000, category: 'Nomina', date: new Date('2025-03-28'), organizationId: minerva.id },
    { type: 'INCOME', description: 'Cobro transporte Febrero', amount: 3500000, category: 'Transporte', date: new Date('2025-02-12'), organizationId: minerva.id },
    { type: 'EXPENSE', description: 'Mantenimiento instalaciones', amount: 800000, category: 'Mantenimiento', date: new Date('2025-03-05'), organizationId: fundisalud.id },
  ];

  for (const t of transactionData) {
    await prisma.transaction.create({ data: { ...t, status: 'completed' } });
  }

  console.log('Transactions created');

  // Attendance (last 5 school days)
  const today = new Date();
  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    date.setHours(0, 0, 0, 0);

    for (const student of activeStudents) {
      const random = Math.random();
      const status = random > 0.95 ? 'ABSENT' : random > 0.92 ? 'LATE' : 'PRESENT';
      await prisma.attendance.create({
        data: { studentId: student.id, sectionId: student.sectionId, date, status },
      });
    }
  }

  console.log('Attendance created');

  // Exam Groups and Exams
  const examGroup = await prisma.examGroup.create({
    data: { name: 'Primer Periodo', sessionId: session.id },
  });
  await prisma.examGroup.create({
    data: { name: 'Segundo Periodo', sessionId: session.id },
  });

  // Create exams for 5 Primaria (class index 4)
  const class5 = classes[5]; // 5° Primaria (index shifted by Transicion)
  const class5SubjectRels = await prisma.classSubject.findMany({ where: { classId: class5.id }, include: { subject: true } });
  const class5Subjects = class5SubjectRels.map(cs => cs.subject).slice(0, 5);

  const exams: any[] = [];
  for (let i = 0; i < class5Subjects.length; i++) {
    const exam = await prisma.exam.create({
      data: {
        examGroupId: examGroup.id,
        subjectId: class5Subjects[i].id,
        classId: class5.id,
        date: new Date(2025, 1, 15 + i),
        startTime: '08:00',
        duration: 90,
        maxMarks: 5.0,
      },
    });
    exams.push(exam);
  }

  // Marks for students in 5 Primaria
  const class5Students = students.filter(s => s.classId === class5.id && s.status === 'active');
  for (const exam of exams) {
    for (const student of class5Students) {
      await prisma.mark.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          marksObtained: Math.round((2 + Math.random() * 3) * 10) / 10,
        },
      });
    }
  }

  console.log('Exams and marks created');

  // Grade Scale (Colombian system)
  await prisma.gradeScale.createMany({
    data: [
      { name: 'Superior', minMarks: 4.6, maxMarks: 5.0, grade: 'S', gpa: 5.0 },
      { name: 'Alto', minMarks: 4.0, maxMarks: 4.5, grade: 'A', gpa: 4.0 },
      { name: 'Basico', minMarks: 3.0, maxMarks: 3.9, grade: 'BS', gpa: 3.0 },
      { name: 'Bajo', minMarks: 1.0, maxMarks: 2.9, grade: 'BJ', gpa: 1.0 },
    ],
  });

  // Events
  const eventData = [
    { title: 'Examen Final Matematicas', date: new Date(2025, 1, 15), time: '8:00 AM', location: 'Aula 201', type: 'exam' },
    { title: 'Reunion de Padres', date: new Date(2025, 1, 18), time: '4:00 PM', location: 'Auditorio Principal', type: 'meeting' },
    { title: 'Dia del Idioma', date: new Date(2025, 3, 23), time: 'Todo el dia', location: 'Campus', type: 'event' },
    { title: 'Cierre de Notas 1er Periodo', date: new Date(2025, 2, 28), time: '11:59 PM', location: '-', type: 'deadline' },
    { title: 'Jornada Deportiva', date: new Date(2025, 4, 10), time: '7:00 AM', location: 'Canchas', type: 'event' },
    { title: 'Semana Cultural', date: new Date(2025, 5, 2), time: 'Todo el dia', location: 'Campus', type: 'event' },
  ];

  for (const e of eventData) {
    await prisma.event.create({ data: e });
  }

  // Schedules (sample weekly schedule for a few Minerva classes)
  const daysOfWeek = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
  const timeSlots = [
    { start: '07:00', end: '07:50' },
    { start: '07:50', end: '08:40' },
    { start: '08:40', end: '09:30' },
    { start: '09:50', end: '10:40' },
    { start: '10:40', end: '11:30' },
    { start: '11:30', end: '12:20' },
  ];

  // Create schedules for 6° and 7° classes with teacher1 and teacher2
  const scheduleClasses = minervaClasses.filter(c => ['6°', '7°'].includes(c.name));
  const minervaSubjects = allSubjects.filter(s => ['MAT', 'ESP', 'NAT', 'SOC', 'ING'].includes(s.code));

  for (const cls of scheduleClasses) {
    const classSecs = sections.filter(s => s.classId === cls.id);
    const secA = classSecs.find(s => s.name === 'A') || classSecs[0];
    for (let day = 0; day < 5; day++) {
      for (let slot = 0; slot < Math.min(minervaSubjects.length, 5); slot++) {
        const subjectIdx = (day + slot) % minervaSubjects.length;
        await prisma.schedule.create({
          data: {
            title: `${minervaSubjects[subjectIdx].name} - ${cls.name}`,
            dayOfWeek: day + 1,
            startTime: timeSlots[slot].start,
            endTime: timeSlots[slot].end,
            room: `Aula ${cls.name === '6°' ? '201' : '202'}`,
            classId: cls.id,
            sectionId: secA.id,
            subjectId: minervaSubjects[subjectIdx].id,
            teacherId: slot % 2 === 0 ? teacher1.id : teacher2.id,
            organizationId: minerva.id,
          },
        });
      }
    }
  }

  console.log('Schedules created');

  // School Config
  await prisma.schoolConfig.createMany({
    data: [
      { key: 'school_name', value: 'Colegio Minerva' },
      { key: 'school_address', value: 'Cra 5 #10-20, Cartagena, Bolivar' },
      { key: 'school_phone', value: '605-123-4567' },
      { key: 'school_email', value: 'info@minerva.edu.co' },
      { key: 'currency', value: 'COP' },
      { key: 'timezone', value: 'America/Bogota' },
      { key: 'date_format', value: 'DD/MM/YYYY' },
    ],
  });

  console.log('Events and config created');
  console.log('Seed completed successfully!');
  console.log('');
  console.log('Organizations:');
  console.log('  Minerva (Primaria y Bachillerato)');
  console.log('  Fundisalud (Carreras Tecnicas)');
  console.log('');
  console.log('Login credentials:');
  console.log('  Super Admin (Aureliano): admin@minerva.edu.co / admin123');
  console.log('  Admin (Ana Zays): ana@minerva.edu.co / admin123');
  console.log('  Profesor: rodriguez@minerva.edu.co / profesor123');
  console.log('  Contador: contabilidad@minerva.edu.co / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
