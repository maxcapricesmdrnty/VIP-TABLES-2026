-- Add 'enabled' column to table_layouts table
-- This allows enabling/disabling entire layout sections (zones)

-- Add the enabled column with default value true
ALTER TABLE table_layouts 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN table_layouts.enabled IS 'Whether this layout zone is enabled/visible in the floor plan';

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
