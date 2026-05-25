-- ============================================================
-- EquiPredict — Schéma initial de la base de données
-- Supabase / PostgreSQL
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profils utilisateurs ────────────────────────────────────
-- Étend la table auth.users de Supabase
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Abonnements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan              TEXT NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free', 'premium', 'pro')),
  start_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date          TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  -- Connecter ici un webhook Stripe pour les mises à jour d'abonnement
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Courses hippiques ────────────────────────────────────────
-- À alimenter via l'API hippique (PMU, Equidia, Zeturf, etc.)
CREATE TABLE IF NOT EXISTS races (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  racecourse        TEXT NOT NULL,
  start_time        TIMESTAMPTZ NOT NULL,
  race_type         TEXT NOT NULL
                    CHECK (race_type IN ('plat', 'trot', 'obstacle', 'steeplechase')),
  distance          INTEGER NOT NULL, -- mètres
  track_condition   TEXT NOT NULL
                    CHECK (track_condition IN ('souple', 'bon', 'léger', 'lourd', 'très lourd')),
  weather           TEXT NOT NULL
                    CHECK (weather IN ('ensoleillé', 'nuageux', 'pluvieux', 'venteux')),
  temperature       INTEGER,           -- °C
  number_of_runners INTEGER NOT NULL,
  prize             INTEGER,           -- euros
  race_date         DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming', 'live', 'completed')),
  race_number       INTEGER NOT NULL,
  category          TEXT NOT NULL,
  -- Identifiant externe pour connecter une API hippique ultérieurement
  external_id       TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_races_date   ON races (race_date);
CREATE INDEX idx_races_status ON races (status);

-- ─── Chevaux ─────────────────────────────────────────────────
-- À alimenter via l'API hippique
CREATE TABLE IF NOT EXISTS horses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id               UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  number                INTEGER NOT NULL,   -- numéro de selle
  name                  TEXT NOT NULL,
  jockey                TEXT NOT NULL,
  trainer               TEXT NOT NULL,
  owner                 TEXT,
  age                   INTEGER,
  weight                DECIMAL(4,1),       -- kg
  odds                  DECIMAL(6,2),       -- cote ex: 3.50
  odds_change           TEXT DEFAULT 'stable'
                        CHECK (odds_change IN ('up', 'down', 'stable')),
  recent_form           JSONB NOT NULL DEFAULT '[]', -- 5 dernières courses
  form_rating           TEXT CHECK (form_rating IN ('excellent', 'bon', 'moyen', 'mauvais')),
  career_wins           INTEGER DEFAULT 0,
  career_races          INTEGER DEFAULT 0,
  win_rate              DECIMAL(5,2),       -- %
  earnings              INTEGER DEFAULT 0,  -- euros
  preferred_dist_min    INTEGER,            -- mètres
  preferred_dist_max    INTEGER,
  preferred_conditions  JSONB DEFAULT '[]',
  similar_track_wins    INTEGER DEFAULT 0,
  similar_track_races   INTEGER DEFAULT 0,
  ai_score              INTEGER CHECK (ai_score BETWEEN 0 AND 100),
  win_probability       DECIMAL(5,2),       -- %
  confidence_level      TEXT CHECK (confidence_level IN ('faible', 'moyen', 'fort')),
  is_recommended        BOOLEAN DEFAULT false,
  -- Identifiant externe (API hippique)
  external_id           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (race_id, number)
);

CREATE INDEX idx_horses_race_id ON horses (race_id);

-- ─── Prédictions IA ──────────────────────────────────────────
-- Générées par le moteur de scoring EquiPredict
-- À remplacer par un appel à un modèle ML réel (ex: SageMaker, Vertex AI)
CREATE TABLE IF NOT EXISTS predictions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id          UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL UNIQUE,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  top3             JSONB NOT NULL,           -- PredictionTop3Entry[]
  analysis_factors JSONB NOT NULL DEFAULT '[]', -- AIAnalysisFactor[]
  race_analysis    TEXT,
  model_version    TEXT NOT NULL DEFAULT '1.0.0',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_race_id ON predictions (race_id);

-- ─── Fonction utilitaire : mise à jour auto de updated_at ────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_races_updated_at       BEFORE UPDATE ON races       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_horses_updated_at      BEFORE UPDATE ON horses      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Trigger : création automatique du profil à l'inscription ─
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );

  INSERT INTO subscriptions (user_id, plan)
  VALUES (NEW.id, 'free');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE races         ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions   ENABLE ROW LEVEL SECURITY;

-- Profils : lecture/modification par le propriétaire uniquement
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Abonnements : lecture par le propriétaire
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Courses : lecture publique (données non sensibles)
CREATE POLICY "races_select_public" ON races FOR SELECT USING (true);

-- Chevaux : lecture publique
CREATE POLICY "horses_select_public" ON horses FOR SELECT USING (true);

-- Prédictions : lecture publique
-- La restriction free/premium est gérée dans les Route Handlers Next.js
CREATE POLICY "predictions_select_public" ON predictions FOR SELECT USING (true);
