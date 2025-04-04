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
        const { name, kanjiIds } = await request.json();
        
        if (!name || !kanjiIds || !Array.isArray(kanjiIds) || kanjiIds.length === 0) {
            return json({ 
                success: false, 
                error: 'Invalid request. Please provide a name and array of kanji IDs.'
            }, { status: 400 });
        }

        // Verify that the kanji IDs exist in the database
        const existingKanji = await db
            .select({ id: kanjis.id })
            .from(kanjis)
            .where(inArray(kanjis.id, kanjiIds))
            .execute();
        
        const existingKanjiIds = existingKanji.map(k => k.id);
        
        if (existingKanjiIds.length === 0) {
            return json({ 
                success: false, 
                error: 'None of the provided kanji IDs exist in the database.'
            }, { status: 404 });
        }

        // Create a new deck
        const [deckResult] = await db
            .insert(studyDecks)
            .values({
                name,
                description: 'Custom deck created for debugging purposes',
                userId,
                isPublic: false
            })
            .returning({ id: studyDecks.id })
            .execute();
        
        // Add kanji to the deck
        for (const kanjiId of existingKanjiIds) {
            await db
                .insert(deckKanjis)
                .values({
                    deckId: deckResult.id,
                    kanjiId
                })
                .execute();
        }

        return json({ 
            success: true, 
            message: `Created deck "${name}" with ${existingKanjiIds.length} kanji`,
            deck: {
                id: deckResult.id,
                name
            },
            kanjiCount: existingKanjiIds.length,
            kanjiIds: existingKanjiIds
        });
    } catch (error) {
        console.error('Error creating custom deck:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 