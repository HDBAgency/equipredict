-- Désinscrire les anciens jobs si déjà présents
SELECT cron.unschedule('collect-race-results') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'collect-race-results'
);
SELECT cron.unschedule('update-model-weights') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-model-weights'
);

-- collect-results à 23h00 UTC chaque nuit
SELECT cron.schedule(
  'collect-race-results',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mkzkkwqxarnnoamxnzyu.supabase.co/functions/v1/collect-results',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1remtrd3F4YXJubm9hbXhuenl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTE1NzAsImV4cCI6MjA5NTI2NzU3MH0.jRSCZwVr39xAH4zt25GTp5X6naebzj-lDK2KDpgFDbE"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- update-weights à 23h30 UTC chaque nuit (30 min après collect)
SELECT cron.schedule(
  'update-model-weights',
  '30 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mkzkkwqxarnnoamxnzyu.supabase.co/functions/v1/update-weights',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1remtrd3F4YXJubm9hbXhuenl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTE1NzAsImV4cCI6MjA5NTI2NzU3MH0.jRSCZwVr39xAH4zt25GTp5X6naebzj-lDK2KDpgFDbE"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
