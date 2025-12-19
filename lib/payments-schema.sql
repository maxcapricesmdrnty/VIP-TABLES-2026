-- =============================================
-- TABLE DES PAIEMENTS - SCHÉMA SQL
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- 1. TABLE DES PAIEMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'virement' CHECK (payment_method IN ('virement', 'carte', 'especes', 'twint', 'autre')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. INDEX
CREATE INDEX IF NOT EXISTS idx_payments_table_id ON payments(table_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 3. RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access payments" ON payments;
CREATE POLICY "Admin full access payments" ON payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. AJOUTER COLONNES MANQUANTES À LA TABLE TABLES (si pas déjà présentes)
DO $$
BEGIN
  -- Colonne pour le total payé (calculé)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'total_paid') THEN
    ALTER TABLE tables ADD COLUMN total_paid NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  -- Colonne numéro de facture
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'invoice_number') THEN
    ALTER TABLE tables ADD COLUMN invoice_number TEXT;
  END IF;
  
  -- Colonne date de facture
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'invoice_date') THEN
    ALTER TABLE tables ADD COLUMN invoice_date DATE;
  END IF;
END $$;

-- 5. FONCTION POUR METTRE À JOUR LE TOTAL PAYÉ
CREATE OR REPLACE FUNCTION update_table_total_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE tables 
    SET total_paid = COALESCE((SELECT SUM(amount) FROM payments WHERE table_id = OLD.table_id), 0)
    WHERE id = OLD.table_id;
    RETURN OLD;
  ELSE
    UPDATE tables 
    SET total_paid = COALESCE((SELECT SUM(amount) FROM payments WHERE table_id = NEW.table_id), 0)
    WHERE id = NEW.table_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_total_paid ON payments;
CREATE TRIGGER trigger_update_total_paid
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_table_total_paid();

-- =============================================
-- FIN DU SCRIPT
-- =============================================
