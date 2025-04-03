import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { db } from '$lib/server/db/db';
import { importKanjiData } from '$lib/server/db/import-kanji';

async function main() {
  try {
    console.log('Starting database setup...');
    
    // Create data directory if it doesn't exist
    await mkdir('./data', { recursive: true });
    
    // Run migrations
    console.log('Running database migrations...');
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully.');
    
    // Import kanji data
    console.log('Importing kanji data...');
    await importKanjiData();
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main().catch(console.error); 