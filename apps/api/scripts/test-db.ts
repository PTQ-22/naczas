import 'dotenv/config';
import { db } from '../src/db';
import { profiles } from '../src/db/schema';

async function testConnection() {
  console.log('Łączenie z bazą danych Neon...');
  try {
    // Próbujemy pobrać profile (tabela powinna być pusta, ale zapytanie musi przejść)
    const result = await db.select().from(profiles);
    console.log('✅ SUKCES! Połączenie z bazą działa idealnie.');
    console.log('Obecne profile w bazie:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ BŁĄD POŁĄCZENIA:', error);
    process.exit(1);
  }
}

void testConnection();
