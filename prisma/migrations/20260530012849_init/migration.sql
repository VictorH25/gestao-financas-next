-- CreateTable
CREATE TABLE "MonthRecord" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "meuSalario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salarioEsposa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agua" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "luz" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parcelaCasa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "internet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seguroMoto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feira" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicExpense" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "monthRecordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthRecord_month_key" ON "MonthRecord"("month");

-- AddForeignKey
ALTER TABLE "DynamicExpense" ADD CONSTRAINT "DynamicExpense_monthRecordId_fkey" FOREIGN KEY ("monthRecordId") REFERENCES "MonthRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
