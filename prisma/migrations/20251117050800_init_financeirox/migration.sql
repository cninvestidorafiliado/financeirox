-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "incomeSource" TEXT,
    "receiptMethod" TEXT,
    "receiptDetail" TEXT,
    "expenseCategory" TEXT,
    "payMethod" TEXT,
    "payApp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_userEmail_occurredAt_idx" ON "Transaction"("userEmail", "occurredAt");

-- CreateIndex
CREATE INDEX "IncomeSource_userEmail_idx" ON "IncomeSource"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeSource_userEmail_name_key" ON "IncomeSource"("userEmail", "name");

-- CreateIndex
CREATE INDEX "ExpenseCategory_userEmail_idx" ON "ExpenseCategory"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_userEmail_name_key" ON "ExpenseCategory"("userEmail", "name");
