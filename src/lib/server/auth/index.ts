import bcrypt from 'bcrypt';
import jwtSimple from 'jwt-simple';
import { dev } from '$app/environment';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Secret key for JWT (in production, this would be in environment variables)
const JWT_SECRET = dev ? 'dev_secret_key' : process.env.JWT_SECRET || 'production_secret_key';

// User type for our auth system
export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

/**
 * Register a new user
 */
export async function registerUser(username: string, email: string, password: string): Promise<AuthUser> {
  // Check if user already exists
  const existingUser = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (existingUser.length > 0) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Create new user
  const now = new Date().toISOString();
  const userId = createId();
  
  await db.insert(users).values({
    id: userId,
    username,
    email,
    passwordHash,
    createdAt: now,
    updatedAt: now
  });
  
  return { id: userId, username, email };
}

/**
 * Login a user and return JWT token
 */
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser, token: string }> {
  // Find user by email
  const userResults = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (userResults.length === 0) {
    throw new Error('Invalid email or password');
  }
  
  const user = userResults[0];
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash || '');
  
  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }
  
  // Update last login time
  await db.update(users)
    .set({ lastLogin: new Date().toISOString() })
    .where(eq(users.id, user.id));
  
  // Create JWT token
  const token = createToken(user);
  
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    },
    token
  };
}

/**
 * Create a JWT token for a user
 */
export function createToken(user: { id: string; username: string; email: string }): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
  };
  
  return jwtSimple.encode(payload, JWT_SECRET);
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwtSimple.decode(token, JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  const userResults = await db.select({
    id: users.id,
    username: users.username,
    email: users.email
  })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  
  if (userResults.length === 0) {
    return null;
  }
  
  return userResults[0];
}

/**
 * Update streak and last study date
 */
export async function updateStudyStreak(userId: string): Promise<void> {
  const userResults = await db.select({
    lastStudyDate: users.lastStudyDate,
    streak: users.streak
  })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (userResults.length === 0) {
    return;
  }
  
  const user = userResults[0];
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let streak = user.streak || 0;
  
  // If this is the first study or more than one day has passed
  if (!user.lastStudyDate) {
    streak = 1;
  } else {
    const lastStudyDate = new Date(user.lastStudyDate).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (lastStudyDate === today) {
      // Already studied today, don't update
      return;
    } else if (lastStudyDate === yesterday) {
      // Consecutive day
      streak++;
    } else {
      // Streak broken
      streak = 1;
    }
  }
  
  // Update user streak and last study date
  await db.update(users)
    .set({ 
      streak,
      lastStudyDate: new Date().toISOString()
    })
    .where(eq(users.id, userId));
} 