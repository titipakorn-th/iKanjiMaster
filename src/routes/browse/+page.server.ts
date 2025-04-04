import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { searchKanji } from '$lib/server/db/utils';

export const load: PageServerLoad = async ({ url }) => {
  try {
    // Parse query parameters
    const query = url.searchParams.get('q') || '';
    const jlptLevel = url.searchParams.get('jlpt') ? parseInt(url.searchParams.get('jlpt') || '', 10) : null;
    const minStrokes = url.searchParams.get('min') ? parseInt(url.searchParams.get('min') || '', 10) : null;
    const maxStrokes = url.searchParams.get('max') ? parseInt(url.searchParams.get('max') || '', 10) : null;
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page') || '1', 10) : 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Search kanji based on filters
    const result = await searchKanji({
      query,
      jlptLevel,
      minStrokes,
      maxStrokes,
      limit,
      offset,
      orderBy: 'jlptLevel',
      orderDirection: 'asc'
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(result.pagination.total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      kanji: result.data,
      pagination: {
        ...result.pagination,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        query,
        jlptLevel,
        minStrokes,
        maxStrokes
      }
    };
  } catch (err) {
    console.error('Error loading kanji data:', err);
    throw error(500, 'Failed to load kanji data');
  }
}; 