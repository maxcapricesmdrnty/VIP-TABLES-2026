-- Fix zone constraint to allow more values
-- Run this in Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE table_layouts DROP CONSTRAINT IF EXISTS table_layouts_zone_check;

-- Add the new constraint with all needed zones
ALTER TABLE table_layouts ADD CONSTRAINT table_layouts_zone_check 
CHECK (zone IN ('left', 'right', 'back', 'center', 'back_1', 'back_2', 'back_3', 'back_4', 'back_5'));

-- Add date column if not exists (for day-specific layouts)
ALTER TABLE table_layouts ADD COLUMN IF NOT EXISTS date DATE;

-- Add enabled column if not exists
ALTER TABLE table_layouts ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Add start_number column if not exists  
ALTER TABLE table_layouts ADD COLUMN IF NOT EXISTS start_number INTEGER DEFAULT 1;

-- Create index for faster lookups by venue and date
CREATE INDEX IF NOT EXISTS idx_table_layouts_venue_date ON table_layouts(venue_id, date);

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
