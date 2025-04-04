import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, and, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, url, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        const { deckId } = params;
        
        // Extract query parameters
        const pageParam = url.searchParams.get('page');
        const pageSizeParam = url.searchParams.get('pageSize');
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 100;
        
        // Validate pagination parameters
        if (isNaN(page) || page < 1) {
            return json({ success: false, error: 'Invalid page parameter. Must be a positive integer.' }, { status: 400 });
        }
        
        if (isNaN(pageSize) || pageSize < 1 || pageSize > 500) {
            return json({ success: false, error: 'Invalid pageSize parameter. Must be between 1 and 500.' }, { status: 400 });
        }
        
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
        
        // Get kanji IDs in this deck
        const deckKanjiRows = await db
            .select({ kanjiId: deckKanjis.kanjiId })
            .from(deckKanjis)
            .where(eq(deckKanjis.deckId, deckId))
            .execute();
        
        if (deckKanjiRows.length === 0) {
            return json({ 
                success: true, 
                message: 'Deck has no kanji',
                kanji: [],
                totalCount: 0,
                page: 1,
                pageSize: pageSize,
                totalPages: 0,
                deck: { id: deck.id, name: deck.name }
            });
        }
        
        const kanjiIds = deckKanjiRows.map(row => row.kanjiId);
        const totalCount = kanjiIds.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        
        // Calculate offset for pagination
        const offset = (page - 1) * pageSize;
        const paginatedKanjiIds = kanjiIds.slice(offset, offset + pageSize);
        
        // Get kanji data for these IDs
        const kanjiData = await db
            .select({
                id: kanjis.id,
                character: kanjis.character,
                meaning: kanjis.meaning,
                onyomi: kanjis.onyomi,
                kunyomi: kanjis.kunyomi,
                jlptLevel: kanjis.jlptLevel,
                strokeCount: kanjis.strokeCount,
                examples: kanjis.examples,
                sentence_examples: kanjis.sentence_examples,
                createdAt: kanjis.createdAt,
                updatedAt: kanjis.updatedAt
            })
            .from(kanjis)
            .where(inArray(kanjis.id, paginatedKanjiIds))
            .execute();
        
        return json({
            success: true,
            kanji: kanjiData,
            totalCount: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            deck: { id: deck.id, name: deck.name }
        });
    } catch (error) {
        console.error('Error fetching kanji for deck:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 