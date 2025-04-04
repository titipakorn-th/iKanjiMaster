import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        const { deckId } = params;
        
        // Verify that the deck exists and belongs to the user
        const [deck] = await db
            .select({
                id: studyDecks.id,
                name: studyDecks.name
            })
            .from(studyDecks)
            .where(and(
                eq(studyDecks.id, deckId),
                eq(studyDecks.userId, userId)
            ))
            .execute();
        
        if (!deck) {
            return json({ 
                success: false, 
                error: 'Deck not found or does not belong to you'
            }, { status: 404 });
        }
        
        // Get all kanji IDs in this deck
        const deckKanjiRows = await db
            .select({ kanjiId: deckKanjis.kanjiId })
            .from(deckKanjis)
            .where(eq(deckKanjis.deckId, deckId))
            .execute();
        
        const kanjiIds = deckKanjiRows.map(row => row.kanjiId);
        
        return json({
            success: true,
            kanjiIds,
            count: kanjiIds.length,
            deck: { id: deck.id, name: deck.name }
        });
    } catch (error) {
        console.error('Error fetching kanji IDs for deck:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 