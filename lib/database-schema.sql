-- VIP Table Management Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  currency TEXT DEFAULT 'CHF',
  logo_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VENUES TABLE
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- TABLE LAYOUTS
CREATE TABLE IF NOT EXISTS table_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  zone TEXT NOT NULL CHECK (zone IN ('left', 'right', 'back')),
  table_prefix TEXT NOT NULL,
  table_count INTEGER NOT NULL,
  rows INTEGER DEFAULT 1,
  capacity_per_table INTEGER DEFAULT 10,
  standard_price NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- EVENT DAYS
CREATE TABLE IF NOT EXISTS event_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(event_id, date)
);

-- TABLES (Reservations)
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  table_layout_id UUID REFERENCES table_layouts(id) ON DELETE SET NULL,
  table_number TEXT NOT NULL,
  day DATE NOT NULL,
  zone TEXT,
  status TEXT DEFAULT 'libre' CHECK (status IN ('libre', 'reserve', 'confirme', 'paye')),
  standard_price NUMERIC DEFAULT 0,
  sold_price NUMERIC DEFAULT 0,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  concierge_nom TEXT,
  concierge_commission NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  beverage_budget NUMERIC DEFAULT 0,
  additional_persons INTEGER DEFAULT 0,
  additional_person_price NUMERIC DEFAULT 0,
  on_site_additional_persons INTEGER DEFAULT 0,
  on_site_additional_revenue NUMERIC DEFAULT 0,
  partial_payment NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  drink_preorder TEXT,
  staff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, venue_id, table_number, day)
);

-- MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  format TEXT,
  volume TEXT,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  access_token TEXT UNIQUE,
  order_type TEXT DEFAULT 'vip_preorder',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_amount NUMERIC DEFAULT 0,
  extra_amount NUMERIC DEFAULT 0,
  budget_exceeded BOOLEAN DEFAULT false,
  client_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'crypto')),
  notes TEXT
);

-- USER ROLES
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE(user_id, event_id)
);

-- TRIGGERS

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate table totals
CREATE OR REPLACE FUNCTION calculate_table_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Beverage budget = 10% of sold_price
  NEW.beverage_budget = COALESCE(NEW.sold_price, 0) * 0.10;
  
  -- Commission amount
  NEW.commission_amount = COALESCE(NEW.sold_price, 0) * (COALESCE(NEW.concierge_commission, 0) / 100);
  
  -- Total price
  NEW.total_price = COALESCE(NEW.sold_price, 0) 
    + (COALESCE(NEW.additional_persons, 0) * COALESCE(NEW.additional_person_price, 0))
    + COALESCE(NEW.on_site_additional_revenue, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tables_calculate_totals BEFORE INSERT OR UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION calculate_table_totals();

-- ROW LEVEL SECURITY
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow authenticated read events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert events" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update events" ON events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete events" ON events FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read venues" ON venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all venues" ON venues FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read table_layouts" ON table_layouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all table_layouts" ON table_layouts FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read event_days" ON event_days FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all event_days" ON event_days FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read tables" ON tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all tables" ON tables FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated all menu_items" ON menu_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read orders by token" ON orders FOR SELECT USING (access_token IS NOT NULL);
CREATE POLICY "Allow authenticated all orders" ON orders FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all order_items" ON order_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated all payments" ON payments FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read user_roles" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all user_roles" ON user_roles FOR ALL TO authenticated USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tables_event_day ON tables(event_id, day);
CREATE INDEX IF NOT EXISTS idx_tables_venue_day ON tables(venue_id, day);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(access_token);
CREATE INDEX IF NOT EXISTS idx_event_days_event ON event_days(event_id);
