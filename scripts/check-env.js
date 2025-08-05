#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment configuration...\n');

const envPath = path.join(__dirname, '../apps/web/.env.local');
const envExamplePath = path.join(__dirname, '../apps/web/.env.local.example');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found!');
  console.log('   Create it by copying .env.local.example:');
  console.log('   cp apps/web/.env.local.example apps/web/.env.local\n');
  process.exit(1);
}

// Read the env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

// Required environment variables
const requiredVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL', example: 'https://xxxxx.supabase.co' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous key', example: 'eyJhbGc...' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key', example: 'eyJhbGc...' },
  { name: 'NEXT_PUBLIC_SANITY_PROJECT_ID', description: 'Sanity project ID', example: '2zyo34nu' },
  { name: 'NEXT_PUBLIC_SANITY_DATASET', description: 'Sanity dataset', example: 'production' },
  { name: 'SANITY_API_TOKEN', description: 'Sanity API token', example: 'sk...' },
  { name: 'OPENAI_API_KEY', description: 'OpenAI API key', example: 'sk-...' },
];

const envVars = {};
lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key) {
      envVars[key] = valueParts.join('=');
    }
  }
});

let hasErrors = false;

console.log('📋 Environment Variables Status:\n');

requiredVars.forEach(({ name, description, example }) => {
  const value = envVars[name];
  
  if (!value || value.includes('your_') || value.includes('your-')) {
    console.error(`❌ ${name}`);
    console.log(`   ${description}`);
    console.log(`   Example: ${example}\n`);
    hasErrors = true;
  } else {
    const displayValue = value.substring(0, 10) + '...';
    console.log(`✅ ${name}: ${displayValue}`);
  }
});

if (hasErrors) {
  console.log('\n📌 Next Steps:');
  console.log('1. Get your Supabase credentials from: https://app.supabase.com');
  console.log('2. Get your Sanity credentials from: https://www.sanity.io/manage');
  console.log('3. Get your OpenAI API key from: https://platform.openai.com/api-keys');
  console.log('4. Update apps/web/.env.local with your actual values');
  process.exit(1);
} else {
  console.log('\n✨ All environment variables are configured!');
  
  // Check if Supabase URL is valid
  const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
  try {
    new URL(supabaseUrl);
    console.log('✅ Supabase URL is valid');
  } catch (e) {
    console.error('❌ Supabase URL is invalid:', supabaseUrl);
    hasErrors = true;
  }
}

if (!hasErrors) {
  console.log('\n🚀 Your environment is properly configured!');
  console.log('   Run "npm run dev" to start the development server.');
}