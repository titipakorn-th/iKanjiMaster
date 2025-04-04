import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ 
      success: false, 
      message: 'Not authenticated' 
    }, { status: 401 });
  }

  try {
    const userId = locals.user.id;
    
    // Get user preferences from database
    const userResult = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userResult.length === 0) {
      return json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    return json({
      success: true,
      preferences: userResult[0].preferences
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return json({ 
      success: false, 
      message: 'Failed to fetch preferences' 
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ 
      success: false, 
      message: 'Not authenticated' 
    }, { status: 401 });
  }

  try {
    const userId = locals.user.id;
    const preferences = await request.json();
    
    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return json({ 
        success: false, 
        message: 'Invalid preferences data' 
      }, { status: 400 });
    }
    
    // Update user preferences
    await db
      .update(users)
      .set({ 
        preferences,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId));
    
    return json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return json({ 
      success: false, 
      message: 'Failed to update preferences' 
    }, { status: 500 });
  }
}; 