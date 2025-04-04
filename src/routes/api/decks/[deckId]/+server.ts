import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
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
        
        // First delete all kanji associations
        await db
            .delete(deckKanjis)
            .where(eq(deckKanjis.deckId, deckId))
            .execute();
        
        // Then delete the deck itself
        await db
            .delete(studyDecks)
            .where(eq(studyDecks.id, deckId))
            .execute();
        
        return json({
            success: true,
            message: `Deck "${deck.name}" deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting deck:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 