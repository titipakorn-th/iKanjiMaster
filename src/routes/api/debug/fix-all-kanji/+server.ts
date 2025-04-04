import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, inArray, notInArray, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        
        // Step 1: Get all kanji IDs in the database
        const allKanjiIds = await db
            .select({ id: kanjis.id })
            .from(kanjis)
            .execute();
        
        const kanjiIdList = allKanjiIds.map(k => k.id);
        
        if (kanjiIdList.length === 0) {
            return json({
                success: false,
                error: 'No kanji found in the database',
                recommendation: 'Create sample kanji first using the "Create Sample Kanji" tool'
            }, { status: 404 });
        }
        
        // Step 2: Get all decks belonging to the user
        const userDecks = await db
            .select({ id: studyDecks.id })
            .from(studyDecks)
            .where(eq(studyDecks.userId, userId))
            .execute();
        
        const userDeckIds = userDecks.map(d => d.id);
        
        // Step 3: Get all kanji that are already in the user's decks
        let kanjiInUserDecks: string[] = [];
        if (userDeckIds.length > 0) {
            const results = await db
                .select({ kanjiId: deckKanjis.kanjiId })
                .from(deckKanjis)
                .where(inArray(deckKanjis.deckId, userDeckIds))
                .execute();
            
            kanjiInUserDecks = results.map(r => r.kanjiId);
        }
        
        // Step 4: Find kanji that aren't in any of the user's decks
        const kanjiToFix = kanjiIdList.filter(id => !kanjiInUserDecks.includes(id));
        
        if (kanjiToFix.length === 0) {
            return json({
                success: true,
                message: 'All kanji are already in your decks',
                totalKanji: kanjiIdList.length,
                kanjiInDecks: kanjiInUserDecks.length
            });
        }
        
        // Step 5: Create a new deck for the orphaned kanji
        const deckName = `System Fix Deck (${new Date().toISOString().slice(0, 10)})`;
        
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
        
        // Step 6: Add the orphaned kanji to the new deck
        let sucessCount = 0;
        let errorCount = 0;
        
        for (const kanjiId of kanjiToFix) {
            try {
                await db
                    .insert(deckKanjis)
                    .values({
                        deckId: deckResult.id,
                        kanjiId
                    })
                    .execute();
                
                sucessCount++;
            } catch (error) {
                console.error(`Error adding kanji ${kanjiId} to deck:`, error);
                errorCount++;
            }
        }
        
        return json({
            success: true,
            message: `Fixed ${sucessCount} kanji by adding them to a new deck "${deckName}"`,
            deck: {
                id: deckResult.id,
                name: deckName
            },
            fixedCount: sucessCount,
            errorCount,
            totalKanji: kanjiIdList.length,
            kanjiInDecksBeforeFix: kanjiInUserDecks.length,
            kanjiInDecksAfterFix: kanjiInUserDecks.length + sucessCount
        });
    } catch (error) {
        console.error('Error fixing kanji associations:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 