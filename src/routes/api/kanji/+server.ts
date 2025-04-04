import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchKanji, getKanjiById } from '$lib/server/db/utils';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Extract query parameters
    const query = url.searchParams.get('query') || '';
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    const jlptLevelParam = url.searchParams.get('jlpt');
    const idParam = url.searchParams.get('id');
    const minStrokesParam = url.searchParams.get('minStrokes');
    const maxStrokesParam = url.searchParams.get('maxStrokes');
    const orderBy = url.searchParams.get('orderBy') || 'jlptLevel';
    const orderDirection = (url.searchParams.get('orderDirection') || 'asc') as 'asc' | 'desc';
    
    // Convert to appropriate types
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const jlptLevel = jlptLevelParam ? parseInt(jlptLevelParam, 10) : null;
    const minStrokes = minStrokesParam ? parseInt(minStrokesParam, 10) : null;
    const maxStrokes = maxStrokesParam ? parseInt(maxStrokesParam, 10) : null;
    
    // Validate parameters
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    
    if (isNaN(offset) || offset < 0) {
      return json({ error: 'Invalid offset parameter' }, { status: 400 });
    }
    
    if (jlptLevelParam && (isNaN(jlptLevel!) || jlptLevel! < 1 || jlptLevel! > 5)) {
      return json({ error: 'Invalid JLPT level parameter' }, { status: 400 });
    }
    
    if (minStrokesParam && (isNaN(minStrokes!) || minStrokes! < 1)) {
      return json({ error: 'Invalid minStrokes parameter' }, { status: 400 });
    }
    
    if (maxStrokesParam && (isNaN(maxStrokes!) || maxStrokes! < 1)) {
      return json({ error: 'Invalid maxStrokes parameter' }, { status: 400 });
    }
    
    // Handle specific kanji ID request differently
    if (idParam) {
      // Directly use getKanjiById for ID lookups
      const kanji = await getKanjiById(idParam);
      
      if (!kanji) {
        return json({ error: 'Kanji not found' }, { status: 404 });
      }
      
      // Transform to match the expected format with examples parsing
      const formattedKanji = {
        id: kanji.id,
        character: kanji.character,
        meaning: kanji.meaning,
        onyomi: kanji.onyomi,
        kunyomi: kanji.kunyomi,
        jlptLevel: kanji.jlptLevel,
        strokeCount: kanji.strokeCount,
        jouyouGrade: kanji.jouyouGrade,
        radicals: kanji.radicals,
        examples: kanji.examples ? (typeof kanji.examples === 'string' ? JSON.parse(kanji.examples) : kanji.examples) : null,
        sentence_examples: kanji.sentence_examples ? (typeof kanji.sentence_examples === 'string' ? JSON.parse(kanji.sentence_examples) : kanji.sentence_examples) : null,
        createdAt: kanji.createdAt,
        updatedAt: kanji.updatedAt
      };
      
      return json({
        data: [formattedKanji], // Return as array to maintain API consistency
        count: 1,
        limit: 1,
        offset: 0
      });
    }
    
    // Search kanji with the provided parameters
    const result = await searchKanji({
      query,
      jlptLevel,
      minStrokes,
      maxStrokes,
      limit,
      offset,
      orderBy,
      orderDirection
    });
    
    return json({
      data: result.data,
      count: result.pagination.total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching kanji:', error);
    return json(
      { error: 'An error occurred while fetching kanji data' },
      { status: 500 }
    );
  }
}; 