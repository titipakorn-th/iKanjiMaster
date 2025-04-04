import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, inArray, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        const { deckId, kanjiIds } = await request.json();
        
        // Validate input
        if (!deckId || typeof deckId !== 'string') {
            return json({
                success: false,
                error: 'Deck ID is required'
            }, { status: 400 });
        }
        
        if (!kanjiIds || !Array.isArray(kanjiIds) || kanjiIds.length === 0) {
            return json({
                success: false,
                error: 'At least one kanji ID is required'
            }, { status: 400 });
        }
        
        // Verify that the deck belongs to the user
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
        
        // Verify that the kanji IDs exist
        const existingKanji = await db
            .select({
                id: kanjis.id,
                character: kanjis.character
            })
            .from(kanjis)
            .where(inArray(kanjis.id, kanjiIds))
            .execute();
        
        if (existingKanji.length === 0) {
            return json({
                success: false,
                error: 'None of the provided kanji IDs exist in the database'
            }, { status: 404 });
        }
        
        const existingKanjiIds = existingKanji.map(k => k.id);
        
        // Check which kanji are already in the deck
        const existingInDeck = await db
            .select({
                kanjiId: deckKanjis.kanjiId
            })
            .from(deckKanjis)
            .where(and(
                eq(deckKanjis.deckId, deckId),
                inArray(deckKanjis.kanjiId, existingKanjiIds)
            ))
            .execute();
        
        const existingInDeckIds = existingInDeck.map((r: { kanjiId: string }) => r.kanjiId);
        
        // Filter out kanji that are already in the deck
        const kanjiToAdd = existingKanjiIds.filter(id => !existingInDeckIds.includes(id));
        
        if (kanjiToAdd.length === 0) {
            return json({
                success: true,
                message: 'All kanji are already in the deck',
                deck: { id: deckId, name: deck.name },
                added: 0,
                total: existingKanjiIds.length,
                alreadyInDeck: existingInDeckIds.length
            });
        }
        
        // Add the kanji to the deck
        let addedCount = 0;
        for (const kanjiId of kanjiToAdd) {
            try {
                await db
                    .insert(deckKanjis)
                    .values({
                        deckId,
                        kanjiId
                    })
                    .execute();
                addedCount++;
            } catch (error) {
                console.error(`Error adding kanji ${kanjiId} to deck:`, error);
            }
        }
        
        return json({
            success: true,
            message: `Added ${addedCount} kanji to deck "${deck.name}"`,
            deck: { id: deckId, name: deck.name },
            added: addedCount,
            total: existingKanjiIds.length,
            alreadyInDeck: existingInDeckIds.length
        });
    } catch (error) {
        console.error('Error adding kanji to deck:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 