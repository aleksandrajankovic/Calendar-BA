-- Funkcije iz RS-a (17.11.2026). Samo DODAVANJE — ništa se ne briše niti mijenja u postojećim podacima.
-- Ručno napisano (ne shadow-diff nad pravom bazom).

-- Nokaut faze i GOLD kategorija za football temu
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'GOLD';
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'QUARTER_FINAL';
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'SEMI_FINAL';
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'FINAL';
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "knockoutPhase" TEXT;

-- Otkrivanje promocije slot mašinom (alternativa grebalici)
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "slot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "slot" BOOLEAN NOT NULL DEFAULT false;

-- Podešavanja kalendara: logo, konfete, zatvoren kalendar, countdown
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "showLogo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "confetti" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "closed" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "countdownTargetIso" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "countdownLabel" TEXT;

-- Analitika kalendara: događaji (prikaz, otvaranje dana, grebanje, klik na dugme).
-- Bez kolačića i ličnih podataka: "visitor" je dnevni anonimni heš.
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "promoType" TEXT,
    "title" TEXT,
    "device" TEXT,
    "embedded" BOOLEAN NOT NULL DEFAULT false,
    "visitor" TEXT,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CalendarEvent_createdAt_idx" ON "CalendarEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "CalendarEvent_year_month_day_idx" ON "CalendarEvent"("year", "month", "day");
