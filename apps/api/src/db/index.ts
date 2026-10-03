import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

// This will be provided by the user in .env
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
