-- Tension Masters: price manager table (already created in your Neon database).
-- Only needed if you switch to a new database. Paste into Neon → SQL Editor → Run.
CREATE TABLE IF NOT EXISTS tm_settings (
  id         text PRIMARY KEY,
  doc        jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
