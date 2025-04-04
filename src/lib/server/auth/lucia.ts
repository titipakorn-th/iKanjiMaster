import { Lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { BunSQLiteAdapter } from '@lucia-auth/adapter-sqlite';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { dev } from '$app/environment';
import { authSessions, users } from '$lib/server/db/schema';

// We need to create a custom adapter as we're using drizzle ORM
const adapter = new BunSQLiteAdapter(db, {
  user: users.name,
  session: authSessions.name
});

// Create Lucia auth instance
export const auth = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev
    }
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      email: attributes.email,
      createdAt: attributes.created_at,
      updatedAt: attributes.updated_at,
      lastLogin: attributes.last_login,
      preferences: attributes.preferences,
      streak: attributes.streak,
      lastStudyDate: attributes.last_study_date
    };
  }
});

// Extend the Lucia types in app.d.ts
export type Auth = typeof auth; 