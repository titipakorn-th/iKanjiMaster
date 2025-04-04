/**
 * Script to generate sentence examples for kanji using the existing API endpoint
 * Run with: bun run src/scripts/generate-sentence-examples.ts
 * 
 * Note: You must set the ADMIN_API_KEY environment variable or put it in a .env file
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Try to load .env file if exists
try {
  const envPath = resolve('.env');
  const env: Record<string, string> = readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.trim() !== '' && !line.startsWith('#'))
    .reduce((acc: Record<string, string>, line) => {
      const [key, value] = line.split('=', 2);
      if (key && value) {
        acc[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
      return acc;
    }, {});
  
  // Set environment variables
  Object.keys(env).forEach(key => {
    process.env[key] = env[key];
  });
} catch (err) {
  // No .env file or error reading it
  console.log('No .env file found or error reading it. Make sure ADMIN_API_KEY is set.');
}

interface ApiResponse {
  success?: boolean;
  total?: number;
  updated?: number;
  errors?: number;
  processedKanji?: string[];
}

async function main() {
  try {
    console.log('Starting generation of kanji sentence examples...');
    
    // Get admin API key
    const adminApiKey = process.env.ADMIN_API_KEY;
    if (!adminApiKey) {
      throw new Error('ADMIN_API_KEY environment variable is not set');
    }
    
    // Limit to 10 kanji to start
    const limit = 10;
    
    // Call the API endpoint
    const response = await fetch('http://localhost:5173/api/admin/generate-examples', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({ limit })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${error}`);
    }
    
    const result: ApiResponse = await response.json();
    
    console.log('Generation complete!');
    console.log(`Processed ${result.total || 0} kanji`);
    console.log(`Updated ${result.updated || 0} kanji with sentence examples`);
    console.log(`Errors: ${result.errors || 0}`);
    
    if (result.processedKanji && result.processedKanji.length > 0) {
      console.log('Processed kanji:', result.processedKanji.join(', '));
    }
  } catch (error) {
    console.error('Error generating kanji sentence examples:', error);
  }
}

main().catch(console.error); 