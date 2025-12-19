-- Guichet d'Accueil Schema
-- Run this in Supabase SQL Editor

-- Add guichet-related columns to the tables table
ALTER TABLE tables ADD COLUMN IF NOT EXISTS bracelets_given BOOLEAN DEFAULT FALSE;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS bracelets_given_at TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS bracelets_given_by TEXT;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS guichet_notes TEXT;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS on_site_persons INTEGER DEFAULT 0;

-- Reload PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');
