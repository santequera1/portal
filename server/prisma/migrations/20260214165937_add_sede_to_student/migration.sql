-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "admissionNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "religion" TEXT,
    "nationality" TEXT DEFAULT 'Colombiana',
    "photo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tipoIdentificacion" TEXT,
    "numeroIdentificacion" TEXT,
    "fechaExpedicion" DATETIME,
    "lugarExpedicion" TEXT,
    "lugarNacimiento" TEXT,
    "tipoSalud" TEXT,
    "numeroContrato" TEXT,
    "numeroPoliza" TEXT,
    "numeroCotizacion" TEXT,
    "certificado" TEXT,
    "eps" TEXT,
    "responsableTipo" TEXT,
    "fatherName" TEXT,
    "fatherPhone" TEXT,
    "fatherEmail" TEXT,
    "fatherOccupation" TEXT,
    "motherName" TEXT,
    "motherPhone" TEXT,
    "acudienteNombre" TEXT,
    "acudienteTelefono" TEXT,
    "acudienteEmail" TEXT,
    "acudienteOcupacion" TEXT,
    "address" TEXT,
    "classId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "organizationId" INTEGER,
    "sedeId" INTEGER,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exalumno" BOOLEAN NOT NULL DEFAULT false,
    "fechaSalida" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("acudienteEmail", "acudienteNombre", "acudienteOcupacion", "acudienteTelefono", "address", "admissionNo", "bloodGroup", "certificado", "classId", "createdAt", "dateOfBirth", "email", "enrollmentDate", "eps", "exalumno", "fatherEmail", "fatherName", "fatherOccupation", "fatherPhone", "fechaExpedicion", "fechaSalida", "gender", "id", "lastName", "lugarExpedicion", "lugarNacimiento", "motherName", "motherPhone", "name", "nationality", "numeroContrato", "numeroCotizacion", "numeroIdentificacion", "numeroPoliza", "organizationId", "phone", "photo", "religion", "responsableTipo", "sectionId", "status", "tipoIdentificacion", "tipoSalud", "updatedAt", "userId") SELECT "acudienteEmail", "acudienteNombre", "acudienteOcupacion", "acudienteTelefono", "address", "admissionNo", "bloodGroup", "certificado", "classId", "createdAt", "dateOfBirth", "email", "enrollmentDate", "eps", "exalumno", "fatherEmail", "fatherName", "fatherOccupation", "fatherPhone", "fechaExpedicion", "fechaSalida", "gender", "id", "lastName", "lugarExpedicion", "lugarNacimiento", "motherName", "motherPhone", "name", "nationality", "numeroContrato", "numeroCotizacion", "numeroIdentificacion", "numeroPoliza", "organizationId", "phone", "photo", "religion", "responsableTipo", "sectionId", "status", "tipoIdentificacion", "tipoSalud", "updatedAt", "userId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_admissionNo_key" ON "Student"("admissionNo");
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
