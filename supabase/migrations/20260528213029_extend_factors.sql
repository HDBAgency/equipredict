-- Migration 004 : 3 nouveaux facteurs d interaction + poids handicap

-- race_outcomes : 3 nouvelles colonnes
ALTER TABLE race_outcomes
  ADD COLUMN IF NOT EXISTS raw_weight_penalty  DOUBLE PRECISION DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS raw_form_x_signal   DOUBLE PRECISION DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS raw_jockey_x_trainer DOUBLE PRECISION DEFAULT 5.0;

-- model_weights : 3 nouveaux poids (redistribution pour que somme = 1)
ALTER TABLE model_weights
  ADD COLUMN IF NOT EXISTS w_weight_penalty   DOUBLE PRECISION NOT NULL DEFAULT 0.04,
  ADD COLUMN IF NOT EXISTS w_form_x_signal    DOUBLE PRECISION NOT NULL DEFAULT 0.06,
  ADD COLUMN IF NOT EXISTS w_jockey_x_trainer DOUBLE PRECISION NOT NULL DEFAULT 0.05;

-- Rééquilibrage : 12 facteurs, somme = 1.0
UPDATE model_weights SET
  w_form            = 0.20,
  w_odds_rank       = 0.18,
  w_consist         = 0.09,
  w_placement       = 0.08,
  w_mvt             = 0.07,
  w_age             = 0.06,
  w_earnings        = 0.05,
  w_jockey_wr       = 0.07,
  w_trainer_wr      = 0.05,
  w_weight_penalty  = 0.04,
  w_form_x_signal   = 0.06,
  w_jockey_x_trainer = 0.05
WHERE id = TRUE;
