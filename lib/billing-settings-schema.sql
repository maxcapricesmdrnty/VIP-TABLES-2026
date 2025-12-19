-- Billing Settings Schema
-- Run this in Supabase SQL Editor

-- Add billing settings columns to the events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_company_name TEXT DEFAULT 'VIP Gstaad';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_beneficiary TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_address TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_account_number TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_iban TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_bic TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_bank_name TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_bank_address TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_logo_url TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_terms TEXT DEFAULT 'Payment must be completed within eight days from the date of issue, after which the table will be put back on sale.
In case of table cancellation by the client less than two weeks before the event will result in a penalty of 30% of the amount collected.';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_vat_text TEXT DEFAULT 'VAT not applicable at this stage';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_thank_you TEXT DEFAULT 'Thank you for your trust';
ALTER TABLE events ADD COLUMN IF NOT EXISTS billing_email TEXT DEFAULT 'vip@caprices.ch';

-- Reload PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');
