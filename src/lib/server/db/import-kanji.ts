import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { kanjis } from './schema';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

/**
 * Import kanji data from CSV file into the database
 */
async function importKanjiData() {
  try {
    console.log('Starting kanji data import...');
    
    // Read the CSV file
    const csvData = readFileSync('data/ka_data.csv', 'utf-8');
    
    // Parse CSV data (skip the header row)
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} kanji records to import`);
    
    // Process and insert data in batches
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const kanjiItems = batch.map((record: any) => {
        // Parse examples
        let examples = [];
        try {
          if (record.examples && record.examples !== 'n/a') {
            // The examples are stored as a string representation of a JSON array
            // We need to parse and clean it
            const examplesStr = record.examples.replace(/\[ \[ /g, '[{').replace(/ \] \]/g, '}]')
              .replace(/ \], \[ /g, '},{').replace(/"/g, '\\"');
            
            const parsedExamples = JSON.parse(examplesStr.replace(/\\"([^,]+)\\", \\"([^,]+)\\"/g, '{"word":"$1", "reading":"", "meaning":"$2"}'));
            
            examples = parsedExamples.map((ex: any) => ({
              word: ex.word || '',
              reading: ex.reading || '',
              meaning: ex.meaning || ''
            }));
          }
        } catch (error) {
          console.error(`Error parsing examples for kanji ${record.kanji}:`, error);
          examples = [];
        }
        
        return {
          id: createId(),
          character: record.kanji || '',
          meaning: record.kmeaning || '',
          onyomi: record.onyomi_ja || null,
          kunyomi: record.kunyomi_ja || null,
          jlptLevel: record.kgrade ? parseInt(record.kgrade, 10) || null : null,
          jouyouGrade: record.kgrade ? parseInt(record.kgrade, 10) || null : null,
          strokeCount: record.kstroke ? parseInt(record.kstroke, 10) || null : null,
          radicals: record.radical || null,
          examples: examples,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
      
      // For each kanji in the batch, check if it exists and then insert or skip
      for (const item of kanjiItems) {
        const existingKanji = await db.select().from(kanjis).where(eq(kanjis.character, item.character)).limit(1);
        
        if (existingKanji.length === 0) {
          await db.insert(kanjis).values(item);
        }
      }
      
      imported += batch.length;
      console.log(`Processed ${imported}/${records.length} kanji records`);
    }
    
    console.log('Kanji data import completed successfully!');
  } catch (error) {
    console.error('Error importing kanji data:', error);
  }
}

// For CLI usage
export { importKanjiData }; 