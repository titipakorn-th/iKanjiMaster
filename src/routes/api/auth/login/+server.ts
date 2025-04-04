import { json } from '@sveltejs/kit';
import { loginUser } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validate input
    if (!email || !password) {
      return json({ 
        success: false, 
        message: 'Email and password are required' 
      }, { status: 400 });
    }
    
    // Login user
    const { user, token } = await loginUser(email, password);
    
    // Set auth token in cookies (httpOnly for security)
    cookies.set('auth_token', token, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    return json({ 
      success: true, 
      user: user
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Return generic error message for security
    return json({ 
      success: false, 
      message: 'Invalid email or password'
    }, { status: 401 });
  }
}; 