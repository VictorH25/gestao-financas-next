DO $$
BEGIN
  IF to_regclass('public."User"') IS NOT NULL AND to_regclass('public.usuarios') IS NULL THEN
    EXECUTE 'ALTER TABLE "User" RENAME TO usuarios';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."MonthRecord"') IS NOT NULL AND to_regclass('public.registros_mensais') IS NULL THEN
    EXECUTE 'ALTER TABLE "MonthRecord" RENAME TO registros_mensais';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."DynamicExpense"') IS NOT NULL AND to_regclass('public.despesas_dinamicas') IS NULL THEN
    EXECUTE 'ALTER TABLE "DynamicExpense" RENAME TO despesas_dinamicas';
  END IF;
END $$;
