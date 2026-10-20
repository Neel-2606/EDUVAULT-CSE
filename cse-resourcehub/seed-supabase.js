// seed-supabase.js
// Programmatically syncs all demo data from local storage into Supabase PostgreSQL.
// Run with: node seed-supabase.js

const supabase = require('./supabase');
const db = require('./db');
const config = require('./config');

async function runSeed() {
  console.log('--- Supabase Data Seeder ---');

  if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL or SUPABASE_KEY is missing in your .env file!');
    console.error('Please configure your .env file first with your Supabase credentials.');
    process.exit(1);
  }

  if (!supabase) {
    console.error('Error: Supabase client could not be initialized.');
    process.exit(1);
  }

  console.log('Connecting to Supabase at:', config.SUPABASE_URL);

  // Load local data
  db.setupStorage();
  const users = db.readData('users');
  const subjects = db.readData('subjects');
  const items = db.readData('items');

  console.log(`Found ${users.length} users, ${subjects.length} subjects, ${items.length} items locally.`);

  console.log('Pushing data to Supabase PostgreSQL...');
  const success = await db.syncToSupabase();

  if (success) {
    console.log('--- SUCCESS! All data is now live in Supabase! ---');
    console.log('Open your Supabase Dashboard -> Table Editor to view your tables:');
    console.log('1. users');
    console.log('2. subjects');
    console.log('3. items');
  } else {
    console.error('Seeding failed. Please check table definitions or API keys.');
  }
}

runSeed().catch(function (err) {
  console.error('Unexpected error:', err);
  process.exit(1);
});
