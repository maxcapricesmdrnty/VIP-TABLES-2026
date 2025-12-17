const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dslgmpbdctojaukofsph.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGdtcGJkY3RvamF1a29mc3BoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk5MDc4NSwiZXhwIjoyMDgxNTY2Nzg1fQ.27DvuNT7hB7OocbOX2wsfdFLzcv8Iw6G9C0OxmELZbQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSQL() {
  // Try to use Supabase's RPC to execute SQL
  const sql = `
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  `;

  try {
    // Supabase doesn't allow raw SQL via REST API
    // Let's check if tables exist by trying to query them
    const { data, error } = await supabase.from('events').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('Tables do not exist. Need to create them via SQL Editor.');
        console.log('\n📍 URL to create tables:');
        console.log('https://supabase.com/dashboard/project/dslgmpbdctojaukofsph/sql/new');
      } else {
        console.log('Error:', error.message, error.code);
      }
    } else {
      console.log('✅ Tables already exist! Connection successful.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runSQL();
