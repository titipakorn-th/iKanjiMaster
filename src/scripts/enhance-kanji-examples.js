/**
 * This script enhances kanji examples by extracting sentences from the CSV data
 * and adding them to existing examples in the database without overwriting existing data.
 */

import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import Database from 'better-sqlite3';
import path from 'node:path';

// Setup database connection
const dbPath = path.resolve('./data/db.sqlite');
const db = new Database(dbPath);

/**
 * @typedef {Object} KanjiExample
 * @property {string} word - The example word
 * @property {string} reading - The reading of the word
 * @property {string} meaning - The meaning of the word
 * @property {string} [sentence] - Optional sentence using the word
 * @property {string} [sentenceReading] - Optional reading of the entire sentence
 * @property {Object.<string, string>} [furigana] - Optional furigana readings for sentence only
 * @property {string} [sentenceMeaning] - Optional meaning of the sentence
 * @property {string} [howToRead] - Optional reading guidance for the word
 */

/**
 * @typedef {Object} KanjiDbEntry
 * @property {string} id - The kanji ID
 * @property {string} character - The kanji character
 * @property {string|null} examples - JSON string of examples or null
 */

/**
 * @typedef {Object} KanjiMapEntry
 * @property {string} id - The kanji ID
 * @property {KanjiExample[]} examples - Array of examples
 */

/**
 * Parse an example entry from the CSV format
 * @param {[string, string]} entry - Entry containing word with reading and meaning
 * @returns {KanjiExample} Parsed kanji example
 */
function parseExampleEntry(entry) {
  // Capture word with reading in parentheses, and meaning separately
  // Example: "批評家（ひひょうか）", "critic"
  const wordWithReadingMatch = entry[0].match(/^([^（]+)（([^）]+)）$/);
  
  if (wordWithReadingMatch) {
    return {
      word: wordWithReadingMatch[1],
      reading: wordWithReadingMatch[2],
      howToRead: wordWithReadingMatch[2], // Add howToRead field with the same value as reading
      meaning: entry[1]
    };
  }
  
  // Fallback if the format is different
  return {
    word: entry[0],
    reading: '', // Will be populated manually or later
    howToRead: '', // Add empty howToRead field
    meaning: entry[1]
  };
}

/**
 * Process examples from CSV format string
 * @param {string} examplesStr - Raw examples string from CSV
 * @returns {KanjiExample[]} Array of parsed kanji examples
 */
function processExamplesFromCSV(examplesStr) {
  if (!examplesStr || examplesStr === 'n/a') return [];
  
  try {
    // Use regex to directly extract the example pairs
    // Pattern looks for "word（reading）", "meaning" pairs
    const regex = /"([^"]+)（([^）]+)）", "([^"]+)"/g;
    const matches = [...examplesStr.matchAll(regex)];
    
    return matches.map(match => ({
      word: match[1] || '',
      reading: match[2] || '',
      howToRead: match[2] || '', // Add howToRead field with the same value as reading
      meaning: match[3] || ''
    }));
  } catch (/** @type {unknown} */ error) {
    console.error('Error parsing examples:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Main function to enhance kanji examples
 */
async function enhanceKanjiExamples() {
  console.log('Starting enhancement of kanji examples...');
  
  try {
    // Read the CSV file
    const csvData = fs.readFileSync('data/ka_data.csv', 'utf-8');
    
    // Parse CSV data
    /** @type {Array<{kanji: string, examples: string}>} */
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} kanji records in CSV`);
    
    // Get all kanji from database
    /** @type {KanjiDbEntry[]} */
    const kanjiEntries = /** @type {KanjiDbEntry[]} */ (db.prepare('SELECT id, character, examples FROM kanjis').all());
    console.log(`Found ${kanjiEntries.length} kanji entries in database`);
    
    // Create a map for faster lookup
    /** @type {Map<string, KanjiMapEntry>} */
    const kanjiMap = new Map();
    kanjiEntries.forEach(entry => {
      let examples = [];
      try {
        if (entry.examples) {
          examples = JSON.parse(entry.examples);
          // Make sure examples is an array
          if (!Array.isArray(examples)) {
            console.warn(`Examples for kanji ${entry.character} is not an array, resetting.`);
            examples = [];
          }
        }
      } catch (error) {
        console.error(`Error parsing examples for kanji ${entry.character}:`, error);
        examples = [];
      }
      
      kanjiMap.set(entry.character, {
        id: entry.id,
        examples: examples
      });
    });
    
    // Prepare update statement
    const updateStmt = db.prepare('UPDATE kanjis SET examples = ?, updated_at = ? WHERE id = ?');
    
    // Begin transaction
    /** 
     * @param {Array<{id: string, examples: KanjiExample[]}>} updates 
     * @returns {number}
     */
    const enhanceKanji = db.transaction((updates) => {
      let successCount = 0;
      for (const update of updates) {
        updateStmt.run(
          JSON.stringify(update.examples),
          new Date().toISOString(),
          update.id
        );
        successCount++;
      }
      return successCount;
    });
    
    // Process each record from CSV
    /** @type {Array<{id: string, examples: KanjiExample[]}>} */
    const updates = [];
    for (const record of records) {
      const character = record.kanji;
      
      // Skip if character doesn't exist in database
      if (!kanjiMap.has(character)) continue;
      
      const dbEntry = kanjiMap.get(character);
      // We already checked for existence with kanjiMap.has(character)
      if (!dbEntry) continue;
      
      const csvExamples = processExamplesFromCSV(record.examples);
      
      // Skip if no examples from CSV
      if (csvExamples.length === 0) continue;
      
      // Enhance existing examples with data from CSV
      // First, create a map of existing examples by word
      /** @type {Map<string, KanjiExample>} */
      const existingExampleMap = new Map();
      
      // Ensure examples is an array
      if (Array.isArray(dbEntry.examples)) {
        dbEntry.examples.forEach(ex => {
          existingExampleMap.set(ex.word, ex);
        });
      }
      
      // Now merge CSV examples with existing ones
      for (const csvExample of csvExamples) {
        if (existingExampleMap.has(csvExample.word)) {
          // Example exists, enhance it
          const existingExample = existingExampleMap.get(csvExample.word);
          // We already checked for existence with existingExampleMap.has(csvExample.word)
          if (!existingExample) continue;
          
          // Only update if fields are missing
          if (!existingExample.reading && csvExample.reading) {
            existingExample.reading = csvExample.reading;
          }
          
          if (!existingExample.howToRead && csvExample.howToRead) {
            existingExample.howToRead = csvExample.howToRead;
          }
          
          if (!existingExample.meaning && csvExample.meaning) {
            existingExample.meaning = csvExample.meaning;
          }
        } else {
          // Example doesn't exist, add it
          dbEntry.examples.push(csvExample);
        }
      }
      
      // Ensure all examples have howToRead field (migration for existing data)
      for (const example of dbEntry.examples) {
        if (!example.howToRead && example.reading) {
          example.howToRead = example.reading;
        }
      }
      
      // Prepare for update
      updates.push({
        id: dbEntry.id,
        examples: dbEntry.examples
      });
    }
    
    // Execute all updates in a transaction
    const updatedCount = enhanceKanji(updates);
    console.log(`Enhanced examples for ${updatedCount} kanji entries`);
    
    console.log('Kanji examples enhancement completed!');
  } catch (error) {
    console.error('Error enhancing kanji examples:', error);
  } finally {
    // Close the database
    db.close();
  }
}

// Run the enhancement
enhanceKanjiExamples().catch(console.error); 