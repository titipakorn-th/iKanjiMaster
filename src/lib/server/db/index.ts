import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Database file path
const DB_PATH = './data/db.sqlite';

// Ensure the data directory exists
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  await mkdir(dirname(DB_PATH), { recursive: true });
} catch (error) {
  // Directory already exists or permission error
  console.error('Failed to create data directory:', error);
}

// Create a SQLite database connection
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Create a Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export schema for use in queries
export * from './schema';
