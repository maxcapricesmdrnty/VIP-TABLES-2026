-- Add 'zone_name' column to table_layouts
-- This stores the custom name for each zone (e.g., "PRIVILEGE", "VIP ONE")

ALTER TABLE table_layouts 
ADD COLUMN IF NOT EXISTS zone_name TEXT;

-- Comment for documentation
COMMENT ON COLUMN table_layouts.zone_name IS 'Custom display name for the zone (e.g., PRIVILEGE, VIP ONE)';

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');
