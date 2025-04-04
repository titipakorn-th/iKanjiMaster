import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { inArray, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, request, url }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;

        // Get one of the user's decks
        const userDecks = await db
            .select({
                id: studyDecks.id,
                name: studyDecks.name
            })
            .from(studyDecks)
            .where(eq(studyDecks.userId, userId))
            .limit(1)
            .execute();

        if (userDecks.length === 0) {
            return json({ 
                success: false, 
                error: 'No decks found. Create a sample deck first.', 
                createSampleLink: '/api/kanji/create-sample'
            }, { status: 404 });
        }

        const deckId = userDecks[0].id;

        // Get kanji IDs from the deck
        const deckKanjiRelations = await db
            .select({
                kanjiId: deckKanjis.kanjiId
            })
            .from(deckKanjis)
            .where(eq(deckKanjis.deckId, deckId))
            .limit(3)
            .execute();

        if (deckKanjiRelations.length === 0) {
            return json({ 
                success: false, 
                error: 'No kanji in deck. Create sample kanji first.', 
                createSampleLink: '/api/kanji/create-sample'
            }, { status: 404 });
        }

        const kanjiIds = deckKanjiRelations.map(r => r.kanjiId);

        // Create a sample review history
        const sampleReviewHistory = kanjiIds.map(kanjiId => ({
            kanjiId,
            quality: 3,
            timestamp: new Date().toISOString(),
            elapsedMs: 1500,
            previousInterval: 0,
            newInterval: 1,
            previousEaseFactor: 250,
            newEaseFactor: 250
        }));

        // Create sample session data
        const sessionData = {
            reviewHistory: sampleReviewHistory,
            totalTime: 5000,
            deckId,
            studyMode: 'kanji-to-meaning'
        };

        // Send a POST request to the save API
        const response = await fetch(new URL('/api/study/save', new URL(url.toString()).origin).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('Cookie') || ''
            },
            body: JSON.stringify(sessionData)
        });

        const result = await response.json();

        return json({
            success: response.ok,
            testData: sessionData,
            apiResponse: result,
            message: response.ok 
                ? 'Test session successfully saved!' 
                : 'Failed to save test session. See apiResponse for details.'
        });
    } catch (error) {
        console.error('Error in test-session-save:', error);
        return json({ 
            success: false, 
            error: String(error) 
        }, { status: 500 });
    }
}; 