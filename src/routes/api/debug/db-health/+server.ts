import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { kanjis, users, studyDecks, reviewHistory, userKanjiProgress, studySessions } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // List of tables to check
        const tables = [
            { name: 'users', schema: users },
            { name: 'kanjis', schema: kanjis },
            { name: 'study_decks', schema: studyDecks },
            { name: 'review_history', schema: reviewHistory },
            { name: 'user_kanji_progress', schema: userKanjiProgress },
            { name: 'study_sessions', schema: studySessions }
        ];

        // Get count for each table
        const tableCounts = [];
        for (const table of tables) {
            const [result] = await db
                .select({ count: sql<number>`count(*)` })
                .from(table.schema)
                .execute();
            
            tableCounts.push({
                name: table.name,
                count: Number(result.count)
            });
        }
        
        return json({
            success: true,
            message: 'Database health check completed',
            tables: tableCounts
        });
    } catch (error) {
        console.error('Database health check failed:', error);
        return json({ 
            success: false, 
            error: String(error)
        }, { status: 500 });
    }
}; 