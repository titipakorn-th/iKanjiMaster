import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, inArray } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        
        // Get the kanji IDs from the request body
        const { kanjiIds } = await request.json();
        
        if (!kanjiIds || !Array.isArray(kanjiIds) || kanjiIds.length === 0) {
            return json({
                success: false,
                error: 'Please provide a list of kanji IDs in the request body'
            }, { status: 400 });
        }

        // Verify that these kanji IDs exist in the database
        const existingKanji = await db
            .select({ id: kanjis.id })
            .from(kanjis)
            .where(inArray(kanjis.id, kanjiIds))
            .execute();
        
        const existingKanjiIds = existingKanji.map(k => k.id);
        const nonExistingKanjiIds = kanjiIds.filter(id => !existingKanjiIds.includes(id));
        
        if (existingKanjiIds.length === 0) {
            return json({
                success: false,
                error: 'None of the provided kanji IDs exist in the database',
                providedIds: kanjiIds
            }, { status: 404 });
        }

        // Get all decks belonging to the user
        const userDecks = await db
            .select({ id: studyDecks.id, name: studyDecks.name })
            .from(studyDecks)
            .where(eq(studyDecks.userId, userId))
            .execute();
        
        let deckId: string;
        let deckName: string;
        
        // Check if user has any decks
        if (userDecks.length === 0) {
            // Create a new deck for the user
            deckName = `Auto-Fix Deck (${new Date().toISOString().slice(0, 10)})`;
            
            const [deckResult] = await db
                .insert(studyDecks)
                .values({
                    name: deckName,
                    description: 'Automatically created to fix foreign key issues',
                    userId,
                    isPublic: false
                })
                .returning({ id: studyDecks.id })
                .execute();
            
            deckId = deckResult.id;
        } else {
            // Use the first existing deck
            deckId = userDecks[0].id;
            deckName = userDecks[0].name;
        }
        
        // Find which kanji are already in the user's decks
        const kanjiInDecks = await db
            .select({ kanjiId: deckKanjis.kanjiId })
            .from(deckKanjis)
            .innerJoin(studyDecks, eq(deckKanjis.deckId, studyDecks.id))
            .where(
                eq(studyDecks.userId, userId)
            )
            .execute();
        
        const kanjiIdsInDecks = kanjiInDecks.map(k => k.kanjiId);
        
        // Filter out kanji that are already in user's decks
        const kanjiIdsToAdd = existingKanjiIds.filter(id => !kanjiIdsInDecks.includes(id));
        
        if (kanjiIdsToAdd.length === 0) {
            return json({
                success: true,
                message: 'All valid kanji are already in your decks',
                nonExistingKanjiIds,
                kanjiIdsInDecks
            });
        }
        
        // Add each kanji to the deck
        let successCount = 0;
        let errorCount = 0;
        
        for (const kanjiId of kanjiIdsToAdd) {
            try {
                await db
                    .insert(deckKanjis)
                    .values({
                        deckId,
                        kanjiId
                    })
                    .execute();
                
                successCount++;
            } catch (error) {
                console.error(`Error adding kanji ${kanjiId} to deck:`, error);
                errorCount++;
            }
        }
        
        return json({
            success: true,
            message: `Added ${successCount} kanji to deck "${deckName}"`,
            deck: {
                id: deckId,
                name: deckName
            },
            addedKanjiCount: successCount,
            errorCount,
            nonExistingKanjiIds,
            alreadyInDecksCount: kanjiIdsInDecks.length
        });
    } catch (error) {
        console.error('Error fixing kanji IDs:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 