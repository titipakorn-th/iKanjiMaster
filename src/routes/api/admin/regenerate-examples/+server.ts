import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { generateKanjiExamples } from '$lib/server/db/openai-utils';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Basic authentication check using admin API key
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${env.ADMIN_API_KEY}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    const { characters } = data;
    
    // Validate input
    if (!characters || !Array.isArray(characters) || characters.length === 0) {
      return json({ error: 'Missing or invalid characters array' }, { status: 400 });
    }
    
    // Process each kanji
    let updatedCount = 0;
    let errorCount = 0;
    let processedKanji: string[] = [];
    
    for (const character of characters) {
      try {
        // Fetch kanji from database
        const kanjiResults = await db.select().from(kanjis).where(eq(kanjis.character, character));
        
        if (kanjiResults.length === 0) {
          console.warn(`Kanji not found: ${character}`);
          errorCount++;
          continue;
        }
        
        const kanji = kanjiResults[0];
        console.log(`Regenerating examples for kanji: ${kanji.character}`);
        processedKanji.push(kanji.character);
        
        // Generate examples using OpenAI
        const examples = await generateKanjiExamples(
          kanji.character,
          kanji.meaning,
          kanji.onyomi,
          kanji.kunyomi
        );
        
        // Update the kanji in the database
        if (examples && examples.length > 0) {
          await db.update(kanjis)
            .set({ 
              sentence_examples: examples as any, // Type cast to resolve type issues
              updatedAt: new Date().toISOString()
            })
            .where(eq(kanjis.id, kanji.id));
          
          updatedCount++;
          console.log(`Updated kanji: ${kanji.character} with ${examples.length} examples`);
        } else {
          console.warn(`No examples were generated for kanji: ${kanji.character}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error processing kanji ${character}:`, error);
        errorCount++;
      }
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return json({
      success: true,
      total: characters.length,
      updated: updatedCount,
      errors: errorCount,
      processedKanji: processedKanji
    });
  } catch (error) {
    console.error('Error regenerating kanji examples:', error);
    return json({ error: 'Failed to regenerate kanji examples' }, { status: 500 });
  }
}; 