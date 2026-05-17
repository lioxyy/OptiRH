-- ============================================================
-- Fix: Prisma 5.x P2023 "Conversion failed: input contains
-- invalid characters" for SQLite DATETIME columns.
--
-- Root cause: SQLite DEFAULT CURRENT_TIMESTAMP stores dates as
-- "YYYY-MM-DD HH:MM:SS" (space-separated, no T, no Z).
-- Prisma 5.x requires strict ISO 8601 "YYYY-MM-DDTHH:MM:SS.mmmZ".
--
-- This script normalises every DATETIME column in every table
-- to ISO 8601 format WITHOUT touching already-correct values.
--
-- Run once with:
--   npx prisma db execute --file=prisma/fix-datetime-format.sql
-- ============================================================

-- Helper macro (repeated per table/column):
--   1. Space-separator  "YYYY-MM-DD HH:MM:SS[.mmm]"  → ISO
--   2. Date-only        "YYYY-MM-DD"                   → ISO (midnight UTC)
--   3. ISO no-Z         "YYYY-MM-DDTHH:MM:SS"          → add .000Z
--   4. ISO has-T no-Z   "...T...HH:MM:SS.mmm"          → add Z
--   Values already ending in Z are left untouched.

-- ── Employee ─────────────────────────────────────────────────
UPDATE "Employee" SET date_birth =
  CASE
    WHEN date_birth LIKE '%Z'                    THEN date_birth
    WHEN date_birth LIKE '% %' AND date_birth LIKE '%.%'
                                                 THEN substr(date_birth,1,10)||'T'||substr(date_birth,12)||'Z'
    WHEN date_birth LIKE '% %'                   THEN substr(date_birth,1,10)||'T'||substr(date_birth,12)||'.000Z'
    WHEN date_birth LIKE '%T%' AND date_birth LIKE '%.%'
                                                 THEN date_birth||'Z'
    WHEN date_birth LIKE '%T%'                   THEN date_birth||'.000Z'
    WHEN length(date_birth) = 10                 THEN date_birth||'T00:00:00.000Z'
    ELSE date_birth
  END
WHERE date_birth NOT LIKE '%Z';

UPDATE "Employee" SET date_employment =
  CASE
    WHEN date_employment LIKE '%Z'                    THEN date_employment
    WHEN date_employment LIKE '% %' AND date_employment LIKE '%.%'
                                                      THEN substr(date_employment,1,10)||'T'||substr(date_employment,12)||'Z'
    WHEN date_employment LIKE '% %'                   THEN substr(date_employment,1,10)||'T'||substr(date_employment,12)||'.000Z'
    WHEN date_employment LIKE '%T%' AND date_employment LIKE '%.%'
                                                      THEN date_employment||'Z'
    WHEN date_employment LIKE '%T%'                   THEN date_employment||'.000Z'
    WHEN length(date_employment) = 10                 THEN date_employment||'T00:00:00.000Z'
    ELSE date_employment
  END
WHERE date_employment NOT LIKE '%Z';

-- ── Candidat ─────────────────────────────────────────────────
UPDATE "Candidat" SET date_birth =
  CASE
    WHEN date_birth LIKE '%Z'   THEN date_birth
    WHEN date_birth LIKE '% %' AND date_birth LIKE '%.%' THEN substr(date_birth,1,10)||'T'||substr(date_birth,12)||'Z'
    WHEN date_birth LIKE '% %'  THEN substr(date_birth,1,10)||'T'||substr(date_birth,12)||'.000Z'
    WHEN date_birth LIKE '%T%' AND date_birth LIKE '%.%' THEN date_birth||'Z'
    WHEN date_birth LIKE '%T%'  THEN date_birth||'.000Z'
    WHEN length(date_birth) = 10 THEN date_birth||'T00:00:00.000Z'
    ELSE date_birth
  END
WHERE date_birth IS NOT NULL AND date_birth NOT LIKE '%Z';

UPDATE "Candidat" SET date_candidature =
  CASE
    WHEN date_candidature LIKE '%Z'   THEN date_candidature
    WHEN date_candidature LIKE '% %' AND date_candidature LIKE '%.%' THEN substr(date_candidature,1,10)||'T'||substr(date_candidature,12)||'Z'
    WHEN date_candidature LIKE '% %'  THEN substr(date_candidature,1,10)||'T'||substr(date_candidature,12)||'.000Z'
    WHEN date_candidature LIKE '%T%' AND date_candidature LIKE '%.%' THEN date_candidature||'Z'
    WHEN date_candidature LIKE '%T%'  THEN date_candidature||'.000Z'
    WHEN length(date_candidature) = 10 THEN date_candidature||'T00:00:00.000Z'
    ELSE date_candidature
  END
WHERE date_candidature NOT LIKE '%Z';

-- ── Entretien ────────────────────────────────────────────────
UPDATE "Entretien" SET date_heure =
  CASE
    WHEN date_heure LIKE '%Z'   THEN date_heure
    WHEN date_heure LIKE '% %' AND date_heure LIKE '%.%' THEN substr(date_heure,1,10)||'T'||substr(date_heure,12)||'Z'
    WHEN date_heure LIKE '% %'  THEN substr(date_heure,1,10)||'T'||substr(date_heure,12)||'.000Z'
    WHEN date_heure LIKE '%T%' AND date_heure LIKE '%.%' THEN date_heure||'Z'
    WHEN date_heure LIKE '%T%'  THEN date_heure||'.000Z'
    WHEN length(date_heure) = 10 THEN date_heure||'T00:00:00.000Z'
    ELSE date_heure
  END
WHERE date_heure NOT LIKE '%Z';

-- ── Contract ─────────────────────────────────────────────────
UPDATE "Contract" SET date_deb =
  CASE
    WHEN date_deb LIKE '%Z'   THEN date_deb
    WHEN date_deb LIKE '% %' AND date_deb LIKE '%.%' THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'Z'
    WHEN date_deb LIKE '% %'  THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'.000Z'
    WHEN date_deb LIKE '%T%' AND date_deb LIKE '%.%' THEN date_deb||'Z'
    WHEN date_deb LIKE '%T%'  THEN date_deb||'.000Z'
    WHEN length(date_deb) = 10 THEN date_deb||'T00:00:00.000Z'
    ELSE date_deb
  END
WHERE date_deb NOT LIKE '%Z';

UPDATE "Contract" SET date_fin =
  CASE
    WHEN date_fin LIKE '%Z'   THEN date_fin
    WHEN date_fin LIKE '% %' AND date_fin LIKE '%.%' THEN substr(date_fin,1,10)||'T'||substr(date_fin,12)||'Z'
    WHEN date_fin LIKE '% %'  THEN substr(date_fin,1,10)||'T'||substr(date_fin,12)||'.000Z'
    WHEN date_fin LIKE '%T%' AND date_fin LIKE '%.%' THEN date_fin||'Z'
    WHEN date_fin LIKE '%T%'  THEN date_fin||'.000Z'
    WHEN length(date_fin) = 10 THEN date_fin||'T00:00:00.000Z'
    ELSE date_fin
  END
WHERE date_fin IS NOT NULL AND date_fin NOT LIKE '%Z';

-- ── Conge ────────────────────────────────────────────────────
UPDATE "Conge" SET date_deb =
  CASE
    WHEN date_deb LIKE '%Z'   THEN date_deb
    WHEN date_deb LIKE '% %' AND date_deb LIKE '%.%' THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'Z'
    WHEN date_deb LIKE '% %'  THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'.000Z'
    WHEN date_deb LIKE '%T%' AND date_deb LIKE '%.%' THEN date_deb||'Z'
    WHEN date_deb LIKE '%T%'  THEN date_deb||'.000Z'
    WHEN length(date_deb) = 10 THEN date_deb||'T00:00:00.000Z'
    ELSE date_deb
  END
WHERE date_deb NOT LIKE '%Z';

UPDATE "Conge" SET date_fin =
  CASE
    WHEN date_fin LIKE '%Z'   THEN date_fin
    WHEN date_fin LIKE '% %' AND date_fin LIKE '%.%' THEN substr(date_fin,1,10)||'T'||substr(date_fin,12)||'Z'
    WHEN date_fin LIKE '% %'  THEN substr(date_fin,1,10)||'T'||substr(date_fin,12)||'.000Z'
    WHEN date_fin LIKE '%T%' AND date_fin LIKE '%.%' THEN date_fin||'Z'
    WHEN date_fin LIKE '%T%'  THEN date_fin||'.000Z'
    WHEN length(date_fin) = 10 THEN date_fin||'T00:00:00.000Z'
    ELSE date_fin
  END
WHERE date_fin NOT LIKE '%Z';

-- ── Absence ──────────────────────────────────────────────────
UPDATE "Absence" SET date_absence =
  CASE
    WHEN date_absence LIKE '%Z'   THEN date_absence
    WHEN date_absence LIKE '% %' AND date_absence LIKE '%.%' THEN substr(date_absence,1,10)||'T'||substr(date_absence,12)||'Z'
    WHEN date_absence LIKE '% %'  THEN substr(date_absence,1,10)||'T'||substr(date_absence,12)||'.000Z'
    WHEN date_absence LIKE '%T%' AND date_absence LIKE '%.%' THEN date_absence||'Z'
    WHEN date_absence LIKE '%T%'  THEN date_absence||'.000Z'
    WHEN length(date_absence) = 10 THEN date_absence||'T00:00:00.000Z'
    ELSE date_absence
  END
WHERE date_absence NOT LIKE '%Z';

-- ── Evaluation ───────────────────────────────────────────────
UPDATE "Evaluation" SET date_eval =
  CASE
    WHEN date_eval LIKE '%Z'   THEN date_eval
    WHEN date_eval LIKE '% %' AND date_eval LIKE '%.%' THEN substr(date_eval,1,10)||'T'||substr(date_eval,12)||'Z'
    WHEN date_eval LIKE '% %'  THEN substr(date_eval,1,10)||'T'||substr(date_eval,12)||'.000Z'
    WHEN date_eval LIKE '%T%' AND date_eval LIKE '%.%' THEN date_eval||'Z'
    WHEN date_eval LIKE '%T%'  THEN date_eval||'.000Z'
    WHEN length(date_eval) = 10 THEN date_eval||'T00:00:00.000Z'
    ELSE date_eval
  END
WHERE date_eval NOT LIKE '%Z';

-- ── Task ─────────────────────────────────────────────────────
UPDATE "Task" SET date_deb =
  CASE
    WHEN date_deb LIKE '%Z'   THEN date_deb
    WHEN date_deb LIKE '% %' AND date_deb LIKE '%.%' THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'Z'
    WHEN date_deb LIKE '% %'  THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'.000Z'
    WHEN date_deb LIKE '%T%' AND date_deb LIKE '%.%' THEN date_deb||'Z'
    WHEN date_deb LIKE '%T%'  THEN date_deb||'.000Z'
    WHEN length(date_deb) = 10 THEN date_deb||'T00:00:00.000Z'
    ELSE date_deb
  END
WHERE date_deb NOT LIKE '%Z';

UPDATE "Task" SET date_fin =
  CASE
    WHEN date_fin LIKE '%Z'   THEN date_fin
    WHEN date_fin LIKE '% %' AND date_fin LIKE '%.%' THEN substr(date_fin,1,10)||'T'||substr(date_fin,12)||'Z'
    WHEN date_fin LIKE '% %'  THEN substr(date_fin,1,10)||'T'||substr(date_fin,12)||'.000Z'
    WHEN date_fin LIKE '%T%' AND date_fin LIKE '%.%' THEN date_fin||'Z'
    WHEN date_fin LIKE '%T%'  THEN date_fin||'.000Z'
    WHEN length(date_fin) = 10 THEN date_fin||'T00:00:00.000Z'
    ELSE date_fin
  END
WHERE date_fin NOT LIKE '%Z';

-- ── Formation ────────────────────────────────────────────────
UPDATE "Formation" SET date_deb =
  CASE
    WHEN date_deb LIKE '%Z'   THEN date_deb
    WHEN date_deb LIKE '% %' AND date_deb LIKE '%.%' THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'Z'
    WHEN date_deb LIKE '% %'  THEN substr(date_deb,1,10)||'T'||substr(date_deb,12)||'.000Z'
    WHEN date_deb LIKE '%T%' AND date_deb LIKE '%.%' THEN date_deb||'Z'
    WHEN date_deb LIKE '%T%'  THEN date_deb||'.000Z'
    WHEN length(date_deb) = 10 THEN date_deb||'T00:00:00.000Z'
    ELSE date_deb
  END
WHERE date_deb NOT LIKE '%Z';

-- ── Notification ─────────────────────────────────────────────
UPDATE "Notification" SET created_at =
  CASE
    WHEN created_at LIKE '%Z'   THEN created_at
    WHEN created_at LIKE '% %' AND created_at LIKE '%.%' THEN substr(created_at,1,10)||'T'||substr(created_at,12)||'Z'
    WHEN created_at LIKE '% %'  THEN substr(created_at,1,10)||'T'||substr(created_at,12)||'.000Z'
    WHEN created_at LIKE '%T%' AND created_at LIKE '%.%' THEN created_at||'Z'
    WHEN created_at LIKE '%T%'  THEN created_at||'.000Z'
    WHEN length(created_at) = 10 THEN created_at||'T00:00:00.000Z'
    ELSE created_at
  END
WHERE created_at NOT LIKE '%Z';

-- ── AuditLog ─────────────────────────────────────────────────
UPDATE "AuditLog" SET timestamp =
  CASE
    WHEN timestamp LIKE '%Z'   THEN timestamp
    WHEN timestamp LIKE '% %' AND timestamp LIKE '%.%' THEN substr(timestamp,1,10)||'T'||substr(timestamp,12)||'Z'
    WHEN timestamp LIKE '% %'  THEN substr(timestamp,1,10)||'T'||substr(timestamp,12)||'.000Z'
    WHEN timestamp LIKE '%T%' AND timestamp LIKE '%.%' THEN timestamp||'Z'
    WHEN timestamp LIKE '%T%'  THEN timestamp||'.000Z'
    WHEN length(timestamp) = 10 THEN timestamp||'T00:00:00.000Z'
    ELSE timestamp
  END
WHERE timestamp NOT LIKE '%Z';
