import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  // Return the authenticated user, or null if not authenticated
  if (locals.user) {
    return json({ 
      authenticated: true, 
      user: locals.user
    });
  } else {
    return json({ 
      authenticated: false, 
      user: null
    });
  }
}; 