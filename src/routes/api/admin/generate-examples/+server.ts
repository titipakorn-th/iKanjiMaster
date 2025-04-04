import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateMissingKanjiExamples } from '$lib/server/db/openai-utils';
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
    const limit = data.limit && !isNaN(parseInt(data.limit)) ? parseInt(data.limit) : 10;
    
    // Validate limit
    if (limit <= 0 || limit > 100) {
      return json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }
    
    // Start the generation process
    const result = await generateMissingKanjiExamples(limit);
    
    return json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error generating kanji examples:', error);
    return json({ error: 'Failed to generate kanji examples' }, { status: 500 });
  }
}; 