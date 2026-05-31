-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Drop old global month uniqueness before adding user-scoped uniqueness.
DROP INDEX IF EXISTS "MonthRecord_month_key";

-- Add nullable first so existing development data does not block migration.
ALTER TABLE "MonthRecord" ADD COLUMN "userId" TEXT;

-- If old shared records exist, attach them to a disabled legacy user.
INSERT INTO "User" ("id", "email", "password", "name", "updatedAt")
SELECT 'legacy-user', 'legacy@finfamilia.local', 'disabled', 'Dados antigos', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "MonthRecord" WHERE "userId" IS NULL)
ON CONFLICT ("email") DO NOTHING;

UPDATE "MonthRecord"
SET "userId" = 'legacy-user'
WHERE "userId" IS NULL;

ALTER TABLE "MonthRecord" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MonthRecord_userId_month_key" ON "MonthRecord"("userId", "month");

-- AddForeignKey
ALTER TABLE "MonthRecord" ADD CONSTRAINT "MonthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
