// Simple script to run database migrations and import kanji data
import Database from 'better-sqlite3';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { createId } from '@paralleldrive/cuid2';

console.log('Starting database setup...');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const DB_PATH = './data/db.sqlite';

// Create data directory if it doesn't exist
try {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  console.log('Created data directory.');
  
  // Create a SQLite database connection
  const db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  
  // Run migrations from the SQL file
  console.log('Running database migrations...');
  const migrationSQL = fs.readFileSync('./drizzle/0000_sticky_adam_warlock.sql', 'utf8');
  
  // Split and execute each SQL statement
  migrationSQL.split(';')
    .filter(sql => sql.trim() !== '')
    .forEach(sql => {
      try {
        db.exec(sql);
      } catch (error) {
        // Ignore errors if table already exists
        if (error && error.message && !error.message.includes('already exists')) {
          console.error('Error executing SQL:', error.message);
        }
      }
    });
  
  console.log('Migrations completed successfully.');
  
  // Import kanji data
  console.log('Importing kanji data...');
  
  try {
    // Read the CSV file
    const csvData = fs.readFileSync('data/ka_data.csv', 'utf-8');
    
    // Parse CSV data (skip the header row)
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} kanji records to import`);
    
    // Process and insert data in batches
    const batchSize = 50;
    let imported = 0;
    
    // Prepare the insert statement
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO kanjis (
        id, character, meaning, onyomi, kunyomi, jlpt_level,
        jouyou_grade, stroke_count, radicals, examples,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Start a transaction
    const insertKanji = db.transaction((kanjiItems) => {
      for (const item of kanjiItems) {
        insertStmt.run(
          item.id,
          item.character,
          item.meaning,
          item.onyomi,
          item.kunyomi,
          item.jlpt_level,
          item.jouyou_grade,
          item.stroke_count,
          item.radicals,
          item.examples ? JSON.stringify(item.examples) : null,
          item.created_at,
          item.updated_at
        );
      }
    });
    
    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const kanjiItems = batch.map((record) => {
        // Parse examples
        let examples = [];
        try {
          if (record.examples && record.examples !== 'n/a') {
            // Clean and parse examples
            const examplesStr = record.examples
              .replace(/\[ \[ /g, '[{')
              .replace(/ \] \]/g, '}]')
              .replace(/ \], \[ /g, '},{')
              .replace(/"/g, '\\"');
            
            let parsedExamples;
            try {
              parsedExamples = JSON.parse(examplesStr.replace(/\\"([^,]+)\\", \\"([^,]+)\\"/g, '{"word":"$1", "reading":"", "meaning":"$2"}'));
            } catch (e) {
              console.error(`Fallback parsing for kanji ${record.kanji}`);
              parsedExamples = [];
            }
            
            examples = parsedExamples.map((ex) => ({
              word: ex.word || '',
              reading: ex.reading || '',
              meaning: ex.meaning || ''
            }));
          }
        } catch (error) {
          if (error && error.message) {
            console.error(`Error parsing examples for kanji ${record.kanji}:`, error.message);
          }
          examples = [];
        }
        
        return {
          id: createId(),
          character: record.kanji || '',
          meaning: record.kmeaning || '',
          onyomi: record.onyomi_ja || null,
          kunyomi: record.kunyomi_ja || null,
          jlpt_level: record.kgrade ? parseInt(record.kgrade, 10) || null : null,
          jouyou_grade: record.kgrade ? parseInt(record.kgrade, 10) || null : null,
          stroke_count: record.kstroke ? parseInt(record.kstroke, 10) || null : null,
          radicals: record.radical || null,
          examples: examples,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      // Insert the batch
      insertKanji(kanjiItems);
      
      imported += batch.length;
      console.log(`Processed ${imported}/${records.length} kanji records`);
    }
    
    console.log('Kanji data import completed successfully!');
    console.log('Database setup completed successfully!');
  } catch (error) {
    if (error && error.message) {
      console.error('Error importing kanji data:', error.message);
    } else {
      console.error('Unknown error during import');
    }
  } finally {
    // Close the database connection
    db.close();
  }
} catch (error) {
  if (error && error.message) {
    console.error('Failed in database setup:', error.message);
  } else {
    console.error('Unknown error during database setup');
  }
} 