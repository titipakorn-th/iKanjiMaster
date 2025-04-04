import { verifyToken, getUserById } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Get auth token from cookies or Authorization header
  const authToken = event.cookies.get('auth_token') || 
    event.request.headers.get('Authorization')?.split('Bearer ')[1];
  
  if (authToken) {
    // Verify the token and get user info
    const tokenUser = verifyToken(authToken);
    
    if (tokenUser) {
      // Set user info in locals for access in routes
      event.locals.user = tokenUser;
      
      // We could also fetch full user details from DB if needed
      // const fullUser = await getUserById(tokenUser.id);
      // if (fullUser) event.locals.user = fullUser;
    }
  } else {
    // No token, user is not authenticated
    event.locals.user = null;
  }
  
  // Continue processing the request
  const response = await resolve(event);
  return response;
}; 