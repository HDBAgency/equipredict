-- ============================================================
-- Migration 003 : Upgrade ML — Jockey/Trainer Stats + RankNet
-- ============================================================

-- ─── 1. Enrichir race_outcomes ────────────────────────────────────────────────
ALTER TABLE race_outcomes
  ADD COLUMN IF NOT EXISTS jockey_name    TEXT,
  ADD COLUMN IF NOT EXISTS trainer_name   TEXT,
  ADD COLUMN IF NOT EXISTS raw_jockey_wr  DOUBLE PRECISION DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS raw_trainer_wr DOUBLE PRECISION DEFAULT 5.0;

-- ─── 2. Table des stats jockeys (fenêtre glissante 90 jours) ─────────────────
CREATE TABLE IF NOT EXISTS jockey_stats (
  jockey_name  TEXT             PRIMARY KEY,
  total_races  INTEGER          NOT NULL DEFAULT 0,
  wins         INTEGER          NOT NULL DEFAULT 0,
  places       INTEGER          NOT NULL DEFAULT 0,
  win_rate     DOUBLE PRECISION NOT NULL DEFAULT 0,
  place_rate   DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_updated DATE
);
ALTER TABLE jockey_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jockey_stats' AND policyname = 'public read jockey_stats'
  ) THEN
    CREATE POLICY "public read jockey_stats" ON jockey_stats FOR SELECT USING (true);
  END IF;
END $$;

-- ─── 3. Table des stats entraîneurs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainer_stats (
  trainer_name TEXT             PRIMARY KEY,
  total_races  INTEGER          NOT NULL DEFAULT 0,
  wins         INTEGER          NOT NULL DEFAULT 0,
  places       INTEGER          NOT NULL DEFAULT 0,
  win_rate     DOUBLE PRECISION NOT NULL DEFAULT 0,
  place_rate   DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_updated DATE
);
ALTER TABLE trainer_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trainer_stats' AND policyname = 'public read trainer_stats'
  ) THEN
    CREATE POLICY "public read trainer_stats" ON trainer_stats FOR SELECT USING (true);
  END IF;
END $$;

-- ─── 4. Nouveaux poids dans model_weights ────────────────────────────────────
ALTER TABLE model_weights
  ADD COLUMN IF NOT EXISTS w_jockey_wr  DOUBLE PRECISION NOT NULL DEFAULT 0.08,
  ADD COLUMN IF NOT EXISTS w_trainer_wr DOUBLE PRECISION NOT NULL DEFAULT 0.06;

-- Rééquilibrer les poids (somme doit rester = 1.0)
UPDATE model_weights SET
  w_form       = 0.24,
  w_odds_rank  = 0.22,
  w_consist    = 0.10,
  w_placement  = 0.09,
  w_mvt        = 0.08,
  w_age        = 0.07,
  w_earnings   = 0.06,
  w_jockey_wr  = 0.08,
  w_trainer_wr = 0.06
WHERE id = TRUE;

-- ─── 5. Colonnes de suivi train/validation dans prediction_performance ────────
ALTER TABLE prediction_performance
  ADD COLUMN IF NOT EXISTS val_top1_accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS val_top3_accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS train_races        INTEGER,
  ADD COLUMN IF NOT EXISTS val_races          INTEGER,
  ADD COLUMN IF NOT EXISTS ranknet_loss       DOUBLE PRECISION;

-- ─── 6. Fonction SQL : recalcule jockey_stats et trainer_stats depuis race_outcomes
-- Appelée par collect-results via supabase.rpc('refresh_rider_stats')
-- Fenêtre glissante de 90 jours pour rester représentatif de la forme actuelle
CREATE OR REPLACE FUNCTION refresh_rider_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Jockeys
  INSERT INTO jockey_stats (jockey_name, total_races, wins, places, win_rate, place_rate, last_updated)
  SELECT
    jockey_name,
    COUNT(*)::INTEGER,
    SUM(CASE WHEN finish_pos = 1 THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN finish_pos <= 3 THEN 1 ELSE 0 END)::INTEGER,
    ROUND(SUM(CASE WHEN finish_pos = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2),
    ROUND(SUM(CASE WHEN finish_pos <= 3 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2),
    CURRENT_DATE
  FROM race_outcomes
  WHERE jockey_name IS NOT NULL
    AND jockey_name != ''
    AND race_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY jockey_name
  ON CONFLICT (jockey_name) DO UPDATE SET
    total_races  = EXCLUDED.total_races,
    wins         = EXCLUDED.wins,
    places       = EXCLUDED.places,
    win_rate     = EXCLUDED.win_rate,
    place_rate   = EXCLUDED.place_rate,
    last_updated = EXCLUDED.last_updated;

  -- Trainers
  INSERT INTO trainer_stats (trainer_name, total_races, wins, places, win_rate, place_rate, last_updated)
  SELECT
    trainer_name,
    COUNT(*)::INTEGER,
    SUM(CASE WHEN finish_pos = 1 THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN finish_pos <= 3 THEN 1 ELSE 0 END)::INTEGER,
    ROUND(SUM(CASE WHEN finish_pos = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2),
    ROUND(SUM(CASE WHEN finish_pos <= 3 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2),
    CURRENT_DATE
  FROM race_outcomes
  WHERE trainer_name IS NOT NULL
    AND trainer_name != ''
    AND race_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY trainer_name
  ON CONFLICT (trainer_name) DO UPDATE SET
    total_races  = EXCLUDED.total_races,
    wins         = EXCLUDED.wins,
    places       = EXCLUDED.places,
    win_rate     = EXCLUDED.win_rate,
    place_rate   = EXCLUDED.place_rate,
    last_updated = EXCLUDED.last_updated;
END;
$$;
