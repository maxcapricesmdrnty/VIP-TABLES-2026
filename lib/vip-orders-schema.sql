-- =============================================
-- SYSTÈME DE PRÉ-COMMANDE VIP - SCHÉMA SQL
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- 1. TABLE DES COMMANDES VIP
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL DEFAULT 'initial' CHECK (order_type IN ('initial', 'additional')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  access_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  total_amount NUMERIC(10,2) DEFAULT 0,
  budget_amount NUMERIC(10,2) DEFAULT 0,
  extra_amount NUMERIC(10,2) DEFAULT 0,
  budget_exceeded BOOLEAN DEFAULT FALSE,
  client_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- 2. TABLE DES ARTICLES DE COMMANDE
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEX POUR PERFORMANCES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 4. TRIGGER POUR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- 5. POLITIQUES RLS (Row Level Security)
-- =============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins authentifiés (full access)
DROP POLICY IF EXISTS "Admin full access orders" ON orders;
CREATE POLICY "Admin full access orders" ON orders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access order_items" ON order_items;
CREATE POLICY "Admin full access order_items" ON order_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique pour accès public via token (lecture seule pour la page VIP)
DROP POLICY IF EXISTS "Public read via token" ON orders;
CREATE POLICY "Public read via token" ON orders
  FOR SELECT TO anon
  USING (access_token IS NOT NULL);

DROP POLICY IF EXISTS "Public read order_items" ON order_items;
CREATE POLICY "Public read order_items" ON order_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.access_token IS NOT NULL
    )
  );

-- 6. FONCTION POUR METTRE À JOUR LE BUDGET DE LA TABLE
-- =============================================
-- Le budget boisson = 100% du sold_price (ou standard_price si sold_price est null)
CREATE OR REPLACE FUNCTION update_table_beverage_budget()
RETURNS TRIGGER AS $$
BEGIN
  NEW.beverage_budget = COALESCE(NEW.sold_price, NEW.standard_price, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_beverage_budget ON tables;
CREATE TRIGGER trigger_update_beverage_budget
  BEFORE INSERT OR UPDATE OF sold_price, standard_price ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_table_beverage_budget();

-- 7. AJOUTER COLONNE beverage_budget SI ELLE N'EXISTE PAS
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tables' AND column_name = 'beverage_budget'
  ) THEN
    ALTER TABLE tables ADD COLUMN beverage_budget NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- 8. METTRE À JOUR LES BUDGETS EXISTANTS
-- =============================================
UPDATE tables 
SET beverage_budget = COALESCE(sold_price, standard_price, 0)
WHERE beverage_budget IS NULL OR beverage_budget = 0;

-- =============================================
-- FIN DU SCRIPT
-- Copiez ce script et exécutez-le dans:
-- Supabase Dashboard > SQL Editor > New Query
-- =============================================
