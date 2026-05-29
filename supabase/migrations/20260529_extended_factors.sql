-- Migration : 3 nouveaux facteurs (distance, hippodrome, jockey×hippodrome)

-- 1. Nouvelles colonnes dans race_outcomes
ALTER TABLE race_outcomes
  ADD COLUMN IF NOT EXISTS horse_name       TEXT,
  ADD COLUMN IF NOT EXISTS hippodrome_code  TEXT,
  ADD COLUMN IF NOT EXISTS race_distance    INT,
  ADD COLUMN IF NOT EXISTS raw_distance_fit FLOAT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS raw_track_fit    FLOAT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS raw_jockey_track FLOAT DEFAULT 5;

-- 2. Tables de stats par distance, hippodrome, jockey×hippodrome
CREATE TABLE IF NOT EXISTS horse_distance_stats (
  horse_name     TEXT NOT NULL,
  distance_range TEXT NOT NULL,  -- 'sprint' | 'mile' | 'long'
  win_rate       FLOAT NOT NULL DEFAULT 0,
  total_races    INT   NOT NULL DEFAULT 0,
  PRIMARY KEY (horse_name, distance_range)
);

CREATE TABLE IF NOT EXISTS horse_track_stats (
  horse_name      TEXT NOT NULL,
  hippodrome_code TEXT NOT NULL,
  win_rate        FLOAT NOT NULL DEFAULT 0,
  total_races     INT   NOT NULL DEFAULT 0,
  PRIMARY KEY (horse_name, hippodrome_code)
);

CREATE TABLE IF NOT EXISTS jockey_track_stats (
  jockey_name     TEXT NOT NULL,
  hippodrome_code TEXT NOT NULL,
  win_rate        FLOAT NOT NULL DEFAULT 0,
  total_races     INT   NOT NULL DEFAULT 0,
  PRIMARY KEY (jockey_name, hippodrome_code)
);

-- 3. RLS (lecture publique, écriture service role uniquement)
ALTER TABLE horse_distance_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_track_stats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE jockey_track_stats   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='horse_distance_stats' AND policyname='Public read horse_distance_stats') THEN
    CREATE POLICY "Public read horse_distance_stats" ON horse_distance_stats FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='horse_track_stats' AND policyname='Public read horse_track_stats') THEN
    CREATE POLICY "Public read horse_track_stats" ON horse_track_stats FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='jockey_track_stats' AND policyname='Public read jockey_track_stats') THEN
    CREATE POLICY "Public read jockey_track_stats" ON jockey_track_stats FOR SELECT USING (true);
  END IF;
END $$;

-- 4. Nouvelles colonnes de poids dans model_weights
ALTER TABLE model_weights
  ADD COLUMN IF NOT EXISTS w_distance_fit FLOAT DEFAULT 0.08,
  ADD COLUMN IF NOT EXISTS w_track_fit    FLOAT DEFAULT 0.08,
  ADD COLUMN IF NOT EXISTS w_jockey_track FLOAT DEFAULT 0.07;

-- 5. Re-normaliser les 15 poids (somme = 1.0)
UPDATE model_weights SET
  w_form             = 0.09,
  w_odds_rank        = 0.07,
  w_consist          = 0.07,
  w_placement        = 0.07,
  w_mvt              = 0.04,
  w_age              = 0.04,
  w_earnings         = 0.09,
  w_jockey_wr        = 0.07,
  w_trainer_wr       = 0.06,
  w_weight_penalty   = 0.04,
  w_form_x_signal    = 0.08,
  w_jockey_x_trainer = 0.05,
  w_distance_fit     = 0.08,
  w_track_fit        = 0.08,
  w_jockey_track     = 0.07;

-- 6. Fonction refresh_extended_stats : agrège race_outcomes → 3 tables stats
CREATE OR REPLACE FUNCTION refresh_extended_stats()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- horse_distance_stats
  INSERT INTO horse_distance_stats (horse_name, distance_range, win_rate, total_races)
  SELECT
    horse_name,
    CASE WHEN race_distance < 1400 THEN 'sprint'
         WHEN race_distance <= 2100 THEN 'mile'
         ELSE 'long' END AS distance_range,
    ROUND((SUM(CASE WHEN finish_pos = 1 THEN 1.0 ELSE 0 END) / COUNT(*)::FLOAT * 100)::NUMERIC, 2)::FLOAT AS win_rate,
    COUNT(*)::INT AS total_races
  FROM race_outcomes
  WHERE horse_name IS NOT NULL AND race_distance IS NOT NULL AND race_distance > 0
  GROUP BY horse_name,
    CASE WHEN race_distance < 1400 THEN 'sprint'
         WHEN race_distance <= 2100 THEN 'mile'
         ELSE 'long' END
  ON CONFLICT (horse_name, distance_range) DO UPDATE
    SET win_rate = EXCLUDED.win_rate, total_races = EXCLUDED.total_races;

  -- horse_track_stats
  INSERT INTO horse_track_stats (horse_name, hippodrome_code, win_rate, total_races)
  SELECT
    horse_name,
    hippodrome_code,
    ROUND((SUM(CASE WHEN finish_pos = 1 THEN 1.0 ELSE 0 END) / COUNT(*)::FLOAT * 100)::NUMERIC, 2)::FLOAT AS win_rate,
    COUNT(*)::INT AS total_races
  FROM race_outcomes
  WHERE horse_name IS NOT NULL AND hippodrome_code IS NOT NULL
  GROUP BY horse_name, hippodrome_code
  ON CONFLICT (horse_name, hippodrome_code) DO UPDATE
    SET win_rate = EXCLUDED.win_rate, total_races = EXCLUDED.total_races;

  -- jockey_track_stats
  INSERT INTO jockey_track_stats (jockey_name, hippodrome_code, win_rate, total_races)
  SELECT
    jockey_name,
    hippodrome_code,
    ROUND((SUM(CASE WHEN finish_pos = 1 THEN 1.0 ELSE 0 END) / COUNT(*)::FLOAT * 100)::NUMERIC, 2)::FLOAT AS win_rate,
    COUNT(*)::INT AS total_races
  FROM race_outcomes
  WHERE jockey_name IS NOT NULL AND hippodrome_code IS NOT NULL
  GROUP BY jockey_name, hippodrome_code
  ON CONFLICT (jockey_name, hippodrome_code) DO UPDATE
    SET win_rate = EXCLUDED.win_rate, total_races = EXCLUDED.total_races;
END;
$$;
