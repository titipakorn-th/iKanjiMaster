import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, deckKanjis, studyDecks } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

interface DeckInfo {
    id: string;
    name: string;
    userId: string;
}

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Get kanji ID from URL
        const kanjiId = url.searchParams.get('id');
        
        if (!kanjiId) {
            return json({ 
                success: false, 
                error: 'Kanji ID is required as a query parameter (?id=...)' 
            }, { status: 400 });
        }

        // Retrieve the kanji from the database
        const kanjiResults = await db
            .select()
            .from(kanjis)
            .where(eq(kanjis.id, kanjiId))
            .execute();
        
        // Check if kanji exists
        if (kanjiResults.length === 0) {
            return json({ 
                success: false, 
                error: `Kanji with ID ${kanjiId} not found in the database`,
                recommendations: [
                    "Create sample kanji using the 'Create Sample Kanji' button",
                    "Check if the ID format matches the expected CUID format",
                    "Verify the kanji hasn't been deleted"
                ]
            }, { status: 404 });
        }

        const kanji = kanjiResults[0];
        
        // Find decks containing this kanji
        const deckRelations = await db
            .select({
                relationId: deckKanjis.id,
                deckId: deckKanjis.deckId
            })
            .from(deckKanjis)
            .where(eq(deckKanjis.kanjiId, kanjiId))
            .execute();
        
        // Get deck details if there are any relations
        let decks: DeckInfo[] = [];
        if (deckRelations.length > 0) {
            const deckIds = deckRelations.map(rel => rel.deckId);
            decks = await db
                .select({
                    id: studyDecks.id,
                    name: studyDecks.name,
                    userId: studyDecks.userId
                })
                .from(studyDecks)
                .where(eq(studyDecks.id, deckIds[0]))
                .execute();
        }

        // Check if this kanji belongs to user's decks
        const userId = locals.user.id;
        const userDecks = decks.filter(deck => deck.userId === userId);
        
        return json({ 
            success: true, 
            kanji: {
                id: kanji.id,
                character: kanji.character,
                meaning: kanji.meaning,
                jlptLevel: kanji.jlptLevel,
                onyomi: kanji.onyomi,
                kunyomi: kanji.kunyomi,
                strokeCount: kanji.strokeCount,
                examples: kanji.examples
            },
            deckRelations: deckRelations,
            decks: decks,
            userDecks: userDecks,
            isForeignKeyValid: {
                existsInKanjiTable: true,
                existsInUserDecks: userDecks.length > 0,
                inAnyDeck: deckRelations.length > 0,
                foreignKeyStatus: userDecks.length > 0 ? "VALID" : "INVALID",
                deckOwnedByUser: decks.some(deck => deck.userId === userId),
                diagnosis: deckRelations.length === 0 
                    ? "This kanji isn't in any deck. Add it to a deck to use in study sessions."
                    : userDecks.length === 0
                        ? "This kanji is in decks, but none are owned by you. This will cause foreign key constraint errors."
                        : "This kanji is in one of your decks. It should work correctly for study sessions.",
                recommendation: userDecks.length === 0 ? 
                    "Create a sample deck with this kanji using the Debug tools." : 
                    "This kanji should be valid for study."
            },
            fixLink: userDecks.length === 0 ? `/api/debug/fix-kanji-id?id=${kanjiId}` : null
        });
    } catch (error) {
        console.error('Error checking kanji ID:', error);
        return json({ 
            success: false, 
            error: String(error)
        }, { status: 500 });
    }
}; 