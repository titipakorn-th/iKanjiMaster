import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        const kanjiId = url.searchParams.get('id');
        
        if (!kanjiId) {
            return json({ 
                success: false, 
                error: 'Please provide a kanji ID as a query parameter (?id=...)'
            }, { status: 400 });
        }

        // Check if kanji exists
        const kanjiResult = await db
            .select({
                id: kanjis.id,
                character: kanjis.character,
                meaning: kanjis.meaning
            })
            .from(kanjis)
            .where(eq(kanjis.id, kanjiId))
            .execute();
        
        if (kanjiResult.length === 0) {
            return json({ 
                success: false, 
                error: `Kanji with ID ${kanjiId} not found in the database`
            }, { status: 404 });
        }

        // Check if kanji is already in a user deck
        const deckKanjiResults = await db
            .select({
                id: deckKanjis.id,
                deckId: deckKanjis.deckId
            })
            .from(deckKanjis)
            .where(eq(deckKanjis.kanjiId, kanjiId))
            .execute();
        
        let userDeckIds: string[] = [];
        
        if (deckKanjiResults.length > 0) {
            // Find which decks belong to the user
            const deckIds = deckKanjiResults.map(r => r.deckId);
            
            const userDecks = await db
                .select({
                    id: studyDecks.id
                })
                .from(studyDecks)
                .where(eq(studyDecks.userId, userId))
                .execute();
            
            userDeckIds = userDecks.map(d => d.id);
            
            const alreadyInUserDeck = deckKanjiResults.some(r => userDeckIds.includes(r.deckId));
            
            if (alreadyInUserDeck) {
                return json({
                    success: true,
                    message: `Kanji ${kanjiResult[0].character} (${kanjiId}) is already in one of your decks`,
                    kanji: kanjiResult[0],
                    alreadyFixed: true
                });
            }
        }
        
        // Create a new deck for this kanji
        const deckName = `Fix for ${kanjiResult[0].character} (${kanjiResult[0].meaning})`;
        
        const [deckResult] = await db
            .insert(studyDecks)
            .values({
                name: deckName,
                description: `Debug deck created to fix foreign key issues with kanji ID ${kanjiId}`,
                userId,
                isPublic: false
            })
            .returning({ id: studyDecks.id })
            .execute();
        
        // Add the kanji to the new deck
        await db
            .insert(deckKanjis)
            .values({
                deckId: deckResult.id,
                kanjiId
            })
            .execute();
        
        return json({
            success: true,
            message: `Fixed kanji ${kanjiResult[0].character} (${kanjiId}) by adding it to a new deck "${deckName}"`,
            kanji: kanjiResult[0],
            deck: {
                id: deckResult.id,
                name: deckName
            },
            nextStep: 'You can now use this kanji in your study sessions'
        });
    } catch (error) {
        console.error('Error fixing kanji ID:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 