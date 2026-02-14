-- AlterTable
ALTER TABLE "Fee" ADD COLUMN "installmentNumber" INTEGER;
ALTER TABLE "Fee" ADD COLUMN "studentPaymentPlanId" INTEGER;

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enrollmentFee" REAL NOT NULL DEFAULT 0,
    "tuitionAmount" REAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "materialsCharge" REAL NOT NULL DEFAULT 0,
    "uniformCharge" REAL NOT NULL DEFAULT 0,
    "transportCharge" REAL NOT NULL DEFAULT 0,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentPaymentPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "paymentPlanId" INTEGER NOT NULL,
    "customTuition" REAL,
    "customDiscount" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentPaymentPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentPaymentPlan_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentPaymentPlan_studentId_paymentPlanId_active_key" ON "StudentPaymentPlan"("studentId", "paymentPlanId", "active");
