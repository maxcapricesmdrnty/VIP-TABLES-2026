-- Add 'capacity' column to tables
-- This stores the base capacity per table (number of persons included)

ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 10;

-- Comment for documentation
COMMENT ON COLUMN tables.capacity IS 'Base capacity of the table (number of persons included in the price)';

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
