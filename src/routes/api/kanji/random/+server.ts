import { error, json } from '@sveltejs/kit';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { and, eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    throw error(401, 'You must be logged in to access this endpoint');
  }
  
  const userId = locals.user.id;
  
  // Get query parameters
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const jlptLevel = url.searchParams.get('jlpt') ? parseInt(url.searchParams.get('jlpt')!) : null;
  const addToDeck = url.searchParams.get('addToDeck');
  
  try {
    // Build query conditions
    const conditions = [];
    
    // Add JLPT level filter if specified
    if (jlptLevel !== null) {
      conditions.push(eq(kanjis.jlptLevel, jlptLevel));
    }
    
    // Get random kanji
    const randomKanji = conditions.length > 0
      ? await db.select().from(kanjis)
          .where(and(...conditions))
          .orderBy(sql`RANDOM()`)
          .limit(limit)
      : await db.select().from(kanjis)
          .orderBy(sql`RANDOM()`)
          .limit(limit);
    
    // If addToDeck parameter is provided, add these kanji to the specified deck
    if (addToDeck) {
      // Check if the deck exists and belongs to the user
      const deckResults = await db.select()
        .from(studyDecks)
        .where(
          and(
            eq(studyDecks.id, addToDeck),
            eq(studyDecks.userId, userId)
          )
        );
      
      if (deckResults.length === 0) {
        throw error(404, 'Deck not found or you do not have permission to modify it');
      }
      
      // Get existing kanji IDs in the deck to avoid duplicates
      const existingKanjiInDeck = await db.select({ kanjiId: deckKanjis.kanjiId })
        .from(deckKanjis)
        .where(eq(deckKanjis.deckId, addToDeck));
      
      const existingIds = new Set(existingKanjiInDeck.map(row => row.kanjiId));
      
      // Filter out kanji that are already in the deck
      const newKanjiIds = randomKanji
        .filter(k => !existingIds.has(k.id))
        .map(k => k.id);
      
      // If we have new kanji to add, insert them
      let added = 0;
      
      if (newKanjiIds.length > 0) {
        // Insert all new kanji IDs into the deck
        await db.insert(deckKanjis).values(
          newKanjiIds.map(kanjiId => ({
            deckId: addToDeck,
            kanjiId,
            addedAt: new Date().toISOString()
          }))
        );
        
        added = newKanjiIds.length;
      }
      
      return json({
        success: true,
        kanji: randomKanji,
        deckId: addToDeck,
        added,
        message: added > 0 
          ? `Added ${added} new kanji to your deck!` 
          : 'No new kanji were added. They may already be in your deck.'
      });
    }
    
    // Standard response without adding to deck
    return json({
      success: true,
      data: randomKanji
    });
  } catch (e) {
    console.error('Error fetching random kanji:', e);
    throw error(500, 'Failed to fetch random kanji');
  }
}; 