const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dslgmpbdctojaukofsph.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGdtcGJkY3RvamF1a29mc3BoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk5MDc4NSwiZXhwIjoyMDgxNTY2Nzg1fQ.27DvuNT7hB7OocbOX2wsfdFLzcv8Iw6G9C0OxmELZbQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test connection by querying events table (might not exist yet)
    const { data, error } = await supabase.from('events').select('count').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Tables do not exist yet. Please run the SQL script in Supabase SQL Editor.');
      console.log('SQL file location: /app/lib/database-schema.sql');
    } else if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Connection successful! Tables exist.');
      console.log('Events count query result:', data);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

setupDatabase();
