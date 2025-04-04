import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserById } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
  // Return the authenticated user, or null if not authenticated
  if (locals.user) {
    try {
      // Get the full user data from the database
      const fullUser = await getUserById(locals.user.id);
      
      if (fullUser) {
        return json({ 
          authenticated: true, 
          user: fullUser
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }
  
  return json({ 
    authenticated: false, 
    user: null
  });
}; 