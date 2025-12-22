-- Add 'enabled' and 'start_number' columns to table_layouts table
-- This allows enabling/disabling entire layout sections (zones)
-- and setting the starting physical table number for each zone

-- Add the enabled column with default value true
ALTER TABLE table_layouts 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Add the start_number column with default value 1
ALTER TABLE table_layouts 
ADD COLUMN IF NOT EXISTS start_number INTEGER DEFAULT 1;

-- Comments for documentation
COMMENT ON COLUMN table_layouts.enabled IS 'Whether this layout zone is enabled/visible in the floor plan';
COMMENT ON COLUMN table_layouts.start_number IS 'Starting physical table number for this zone (e.g., if start_number=5 and count=4, tables will be numbered 5,6,7,8)';

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
