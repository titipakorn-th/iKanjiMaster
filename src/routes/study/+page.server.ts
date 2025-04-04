import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  try {
    // Extract query parameters
    const kanjiId = url.searchParams.get('kanjiId');
    const jlptLevelParam = url.searchParams.get('jlpt');

    // Parse JLPT level if it exists
    let jlptLevel = null;
    if (jlptLevelParam) {
      const parsed = parseInt(jlptLevelParam, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 5) {
        throw error(400, 'Invalid JLPT level parameter');
      }
      jlptLevel = parsed;
    }

    return {
      studyParams: {
        kanjiId: kanjiId || null,
        jlptLevel: jlptLevel
      }
    };
  } catch (err) {
    console.error('Error loading study parameters:', err);
    throw error(500, 'Failed to load study parameters');
  }
}; 