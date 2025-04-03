import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';
import { kanjis } from '$lib/server/db/schema';
import { eq, like, and, or, between, isNull, not, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET endpoint to fetch kanji with optional filtering
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Parse query parameters
    const searchQuery = url.searchParams.get('search') || '';
    const jlptLevel = url.searchParams.get('jlpt') ? parseInt(url.searchParams.get('jlpt') || '', 10) : null;
    const minStrokes = url.searchParams.get('minStrokes') ? parseInt(url.searchParams.get('minStrokes') || '', 10) : null;
    const maxStrokes = url.searchParams.get('maxStrokes') ? parseInt(url.searchParams.get('maxStrokes') || '', 10) : null;
    
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '50', 10) : 50;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset') || '0', 10) : 0;
    
    // Build filter conditions
    const conditions = [];
    
    if (searchQuery) {
      conditions.push(
        or(
          like(kanjis.character, `%${searchQuery}%`),
          like(kanjis.meaning, `%${searchQuery}%`)
        )
      );
    }
    
    if (jlptLevel !== null) {
      conditions.push(eq(kanjis.jlptLevel, jlptLevel));
    }
    
    if (minStrokes !== null && maxStrokes !== null) {
      conditions.push(between(kanjis.strokeCount, minStrokes, maxStrokes));
    } else if (minStrokes !== null) {
      conditions.push(
        and(
          not(isNull(kanjis.strokeCount)),
          sql`${kanjis.strokeCount} >= ${minStrokes}`
        )
      );
    } else if (maxStrokes !== null) {
      conditions.push(
        and(
          not(isNull(kanjis.strokeCount)),
          sql`${kanjis.strokeCount} <= ${maxStrokes}`
        )
      );
    }
    
    // Execute query with filters
    const results = conditions.length > 0
      ? await db.select().from(kanjis).where(and(...conditions)).limit(limit).offset(offset)
      : await db.select().from(kanjis).limit(limit).offset(offset);
    
    // Count total matching records for pagination
    const countQuery = conditions.length > 0
      ? await db.select({ count: sql`count(*)` }).from(kanjis).where(and(...conditions))
      : await db.select({ count: sql`count(*)` }).from(kanjis);
    
    // Return formatted response
    return json({
      data: results.map(kanji => ({
        id: kanji.id,
        character: kanji.character,
        meaning: kanji.meaning,
        onyomi: kanji.onyomi,
        kunyomi: kanji.kunyomi,
        jlptLevel: kanji.jlptLevel,
        strokeCount: kanji.strokeCount,
        examples: kanji.examples || []
      })),
      pagination: {
        total: countQuery[0]?.count || 0,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching kanji:', error);
    return json({ error: 'Failed to fetch kanji data' }, { status: 500 });
  }
}; 