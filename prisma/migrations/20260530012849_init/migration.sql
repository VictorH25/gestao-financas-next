-- CreateTable
CREATE TABLE "MonthRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "meuSalario" REAL NOT NULL DEFAULT 0,
    "salarioEsposa" REAL NOT NULL DEFAULT 0,
    "agua" REAL NOT NULL DEFAULT 0,
    "luz" REAL NOT NULL DEFAULT 0,
    "parcelaCasa" REAL NOT NULL DEFAULT 0,
    "internet" REAL NOT NULL DEFAULT 0,
    "seguroMoto" REAL NOT NULL DEFAULT 0,
    "feira" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DynamicExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "monthRecordId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DynamicExpense_monthRecordId_fkey" FOREIGN KEY ("monthRecordId") REFERENCES "MonthRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthRecord_month_key" ON "MonthRecord"("month");
