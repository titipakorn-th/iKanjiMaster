import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;

        // Get the user's decks
        const decks = await db
            .select({
                id: studyDecks.id,
                name: studyDecks.name,
                description: studyDecks.description,
                isPublic: studyDecks.isPublic,
                createdAt: studyDecks.createdAt
            })
            .from(studyDecks)
            .where(eq(studyDecks.userId, userId))
            .execute();

        // For each deck, get the kanji count
        const decksWithCounts = await Promise.all(
            decks.map(async (deck) => {
                const [result] = await db
                    .select({ count: count() })
                    .from(deckKanjis)
                    .where(eq(deckKanjis.deckId, deck.id))
                    .execute();
                
                return {
                    ...deck,
                    kanjiCount: result.count || 0
                };
            })
        );

        return json({
            success: true,
            decks: decksWithCounts
        });
    } catch (error) {
        console.error('Error fetching decks:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        const { name, description } = await request.json();
        
        // Validate input
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return json({
                success: false,
                error: 'Deck name is required'
            }, { status: 400 });
        }
        
        // Create a new deck
        const [deck] = await db
            .insert(studyDecks)
            .values({
                name: name.trim(),
                description: description ? description.trim() : undefined,
                userId,
                isPublic: false // Default to private
            })
            .returning({
                id: studyDecks.id,
                name: studyDecks.name,
                description: studyDecks.description,
                createdAt: studyDecks.createdAt
            })
            .execute();
        
        return json({
            success: true,
            message: 'Deck created successfully',
            deck
        });
    } catch (error) {
        console.error('Error creating deck:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 