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
    "tipoIdentificacion" TEXT,
    "numeroIdentificacion" TEXT,
    "fechaExpedicion" DATETIME,
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
    CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("address", "admissionNo", "bloodGroup", "classId", "createdAt", "dateOfBirth", "enrollmentDate", "fatherEmail", "fatherName", "fatherOccupation", "fatherPhone", "gender", "id", "motherName", "motherPhone", "name", "nationality", "organizationId", "photo", "religion", "sectionId", "status", "updatedAt", "userId") SELECT "address", "admissionNo", "bloodGroup", "classId", "createdAt", "dateOfBirth", "enrollmentDate", "fatherEmail", "fatherName", "fatherOccupation", "fatherPhone", "gender", "id", "motherName", "motherPhone", "name", "nationality", "organizationId", "photo", "religion", "sectionId", "status", "updatedAt", "userId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_admissionNo_key" ON "Student"("admissionNo");
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
