import { json } from '@sveltejs/kit';
import { registerUser } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, email, password } = body;
    
    // Validate input
    if (!username || !email || !password) {
      return json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      }, { status: 400 });
    }
    
    if (password.length < 8) {
      return json({ 
        success: false, 
        message: 'Password must be at least 8 characters' 
      }, { status: 400 });
    }
    
    // Register user
    const user = await registerUser(username, email, password);
    
    return json({ 
      success: true, 
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error instanceof Error && error.message.includes('already exists')) {
      return json({ 
        success: false, 
        message: error.message 
      }, { status: 409 });
    }
    
    return json({ 
      success: false, 
      message: 'An error occurred during registration' 
    }, { status: 500 });
  }
}; 