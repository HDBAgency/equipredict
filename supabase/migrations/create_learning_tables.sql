-- Table 1 : poids du modèle (singleton, 1 seule ligne)
CREATE TABLE IF NOT EXISTS model_weights (
  id            BOOLEAN PRIMARY KEY DEFAULT TRUE,
  w_form        DOUBLE PRECISION NOT NULL DEFAULT 0.28,
  w_odds_rank   DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  w_consist     DOUBLE PRECISION NOT NULL DEFAULT 0.12,
  w_placement   DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  w_mvt         DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  w_age         DOUBLE PRECISION NOT NULL DEFAULT 0.08,
  w_earnings    DOUBLE PRECISION NOT NULL DEFAULT 0.07,
  sample_count  INTEGER NOT NULL DEFAULT 0,
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = TRUE)
);
INSERT INTO model_weights DEFAULT VALUES ON CONFLICT DO NOTHING;
ALTER TABLE model_weights ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'model_weights' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON model_weights FOR SELECT USING (true);
  END IF;
END $$;

-- Table 2 : résultats réels des courses (récupérés depuis PMU)
CREATE TABLE IF NOT EXISTS race_outcomes (
  race_id       TEXT NOT NULL,
  race_date     DATE NOT NULL,
  horse_number  INTEGER NOT NULL,
  finish_pos    INTEGER NOT NULL,
  raw_form      DOUBLE PRECISION,
  raw_odds_rank DOUBLE PRECISION,
  raw_consist   DOUBLE PRECISION,
  raw_placement DOUBLE PRECISION,
  raw_mvt       DOUBLE PRECISION,
  raw_age       DOUBLE PRECISION,
  raw_earnings  DOUBLE PRECISION,
  collected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (race_id, horse_number)
);
ALTER TABLE race_outcomes ENABLE ROW LEVEL SECURITY;

-- Table 3 : performance des prédictions
CREATE TABLE IF NOT EXISTS prediction_performance (
  id               BIGSERIAL PRIMARY KEY,
  race_date        DATE NOT NULL,
  total_races      INTEGER NOT NULL DEFAULT 0,
  total_horses     INTEGER NOT NULL DEFAULT 0,
  spearman_avg     DOUBLE PRECISION,
  top1_accuracy    DOUBLE PRECISION,
  top3_accuracy    DOUBLE PRECISION,
  weights_snapshot JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE prediction_performance ENABLE ROW LEVEL SECURITY;
