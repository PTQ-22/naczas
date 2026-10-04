require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`ALTER TABLE profiles DROP COLUMN IF EXISTS encrypted_name, DROP COLUMN IF EXISTS gender, DROP COLUMN IF EXISTS birth_year, DROP COLUMN IF EXISTS updated_at, ADD COLUMN IF NOT EXISTS payload text NOT NULL DEFAULT '{}'`
  .then(() => console.log('Done'))
  .catch(console.error);
