import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getKanjiById } from '$lib/server/db/utils';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const kanjiId = params.id;
    
    if (!kanjiId) {
      throw error(400, 'Kanji ID is required');
    }
    
    const kanji = await getKanjiById(kanjiId);
    
    if (!kanji) {
      throw error(404, 'Kanji not found');
    }
    
    return {
      kanji
    };
  } catch (err) {
    console.error('Error loading kanji details:', err);
    throw error(500, 'Failed to load kanji details');
  }
}; 