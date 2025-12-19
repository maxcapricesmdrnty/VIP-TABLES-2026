-- Live Orders & Team Management Schema
-- Run this in Supabase SQL Editor

-- Team members table for access control
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'chef_equipe', 'serveur', 'bar')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live orders table
CREATE TABLE IF NOT EXISTS live_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  server_name TEXT NOT NULL,
  server_id UUID,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount DECIMAL DEFAULT 0,
  within_budget DECIMAL DEFAULT 0,
  supplement DECIMAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live order items table
CREATE TABLE IF NOT EXISTS live_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES live_orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  item_category TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add consumed_amount to tables for tracking budget consumption
ALTER TABLE tables ADD COLUMN IF NOT EXISTS consumed_amount DECIMAL DEFAULT 0;

-- RLS Policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_order_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage team members
CREATE POLICY "Allow authenticated to manage team_members" ON team_members
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage live_orders
CREATE POLICY "Allow authenticated to manage live_orders" ON live_orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage live_order_items
CREATE POLICY "Allow authenticated to manage live_order_items" ON live_order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Reload PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Add served_quantity to order_items for tracking served items from pre-orders
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS served_quantity INTEGER DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_name TEXT;

SELECT pg_notify('pgrst', 'reload schema');
