import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resetAllKanjiExamples } from '$lib/server/db/reset-examples';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Basic authentication check using admin API key
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${env.ADMIN_API_KEY}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Call the utility function to reset all examples
    const result = await resetAllKanjiExamples();
    
    // Return the result directly since it already contains a success property
    return json(result);
  } catch (error) {
    console.error('Error resetting kanji examples:', error);
    return json({ error: 'Failed to reset kanji examples' }, { status: 500 });
  }
}; 