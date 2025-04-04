import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis } from '$lib/server/db';
import { inArray } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return json({
        success: false,
        message: 'Please provide an array of kanji IDs to check'
      }, { status: 400 });
    }
    
    // Get all kanji
    const allKanji = await db
      .select({
        id: kanjis.id,
        character: kanjis.character,
        meaning: kanjis.meaning
      })
      .from(kanjis);
      
    // Create a map for quick lookups
    const kanjiMap = new Map(allKanji.map(k => [k.id, k]));
    
    // Check which IDs exist
    const results = ids.map(id => ({
      id,
      exists: kanjiMap.has(id),
      details: kanjiMap.get(id) || null
    }));
    
    return json({
      success: true,
      totalKanji: allKanji.length,
      results,
      existingCount: results.filter(r => r.exists).length,
      missingCount: results.filter(r => !r.exists).length
    });
  } catch (error) {
    console.error('Error checking kanji IDs:', error);
    return json({ 
      success: false, 
      message: 'Failed to check kanji IDs',
      error: String(error)
    }, { status: 500 });
  }
}; 