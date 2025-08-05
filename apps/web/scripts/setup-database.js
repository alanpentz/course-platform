#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function runMigration(filename) {
  console.log(`\n📄 Running migration: ${filename}`);
  
  const sqlPath = path.join(__dirname, '../supabase/migrations', filename);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error in ${filename}:`, error.message);
      return false;
    }
    
    console.log(`✅ Successfully ran ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to run ${filename}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Course Platform Database Setup\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using service role key: ${supabaseServiceKey.substring(0, 20)}...`);
  
  console.log('\n⚠️  WARNING: This will create/modify database tables.');
  
  rl.question('\nDo you want to continue? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Setup cancelled');
      rl.close();
      return;
    }
    
    console.log('\n🏃 Running migrations...');
    
    // Note: Supabase doesn't support running raw SQL through the client library
    // You'll need to run these migrations through the Supabase dashboard
    console.log('\n📋 Please run the following migrations in your Supabase SQL Editor:');
    console.log('\n1. Copy the contents of: apps/web/supabase/migrations/20240103_initial_schema.sql');
    console.log('2. Paste and run in Supabase SQL Editor');
    console.log('\n3. Copy the contents of: apps/web/supabase/migrations/20240103_rls_policies.sql');
    console.log('4. Paste and run in Supabase SQL Editor');
    
    console.log('\n🔗 Direct link to SQL Editor:');
    console.log(`https://app.supabase.com/project/chxykpbzdujtkcnkfhtn/editor/sql`);
    
    console.log('\n✨ After running the migrations, your database will be ready!');
    
    rl.close();
  });
}

main().catch(console.error);