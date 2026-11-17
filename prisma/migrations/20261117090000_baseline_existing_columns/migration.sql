-- Usklađivanje istorije migracija sa stvarnom BA bazom (17.11.2026).
-- Ove kolone su ranije dodate u bazu mimo migracija (db push). Na BA bazi ova migracija
-- NE MIJENJA NIŠTA (sve je IF NOT EXISTS); postoji da `prisma migrate` ne bi vidio razliku
-- između istorije i baze i predlagao reset baze.

-- CalendarSettings
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "bgImageUrlMobile" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "calendarPosition" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "calendarTitle" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "monthBackgrounds" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "seoMeta" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "theme" TEXT;

-- Grebalica i flip kartica
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "scratch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "flipCard" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "scratch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "flipCard" BOOLEAN NOT NULL DEFAULT false;
