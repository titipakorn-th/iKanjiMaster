import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Fetch the first 10 kanji from the database
        const kanjiList = await db
            .select({
                id: kanjis.id,
                character: kanjis.character,
                meaning: kanjis.meaning,
                onyomi: kanjis.onyomi,
                kunyomi: kanjis.kunyomi,
                jlptLevel: kanjis.jlptLevel,
                strokeCount: kanjis.strokeCount,
                examples: kanjis.examples
            })
            .from(kanjis)
            .limit(10)
            .execute();

        return json({ 
            success: true, 
            count: kanjiList.length,
            kanji: kanjiList
        });
    } catch (error) {
        console.error('Error fetching kanji:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 