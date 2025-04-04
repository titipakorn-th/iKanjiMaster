import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, kanjis, studyDecks, deckKanjis } from '$lib/server/db';
import { eq, inArray } from 'drizzle-orm';

// Samples based on real JLPT N5 kanji
const sampleKanji = [
    {
        character: '日',
        meaning: 'day, sun',
        onyomi: 'ニチ, ジツ',
        kunyomi: 'ひ, -び, -か',
        strokeCount: 4,
        jlptLevel: 5,
        examples: '日本 (にほん) - Japan, 今日 (きょう) - today',
        radicals: '日',
        jouyouGrade: 1
    },
    {
        character: '一',
        meaning: 'one',
        onyomi: 'イチ, イツ',
        kunyomi: 'ひと-, ひと.つ',
        strokeCount: 1,
        jlptLevel: 5,
        examples: '一人 (ひとり) - one person, 一日 (いちにち) - one day',
        radicals: '一',
        jouyouGrade: 1
    },
    {
        character: '人',
        meaning: 'person',
        onyomi: 'ジン, ニン',
        kunyomi: 'ひと',
        strokeCount: 2,
        jlptLevel: 5,
        examples: '人口 (じんこう) - population, 外国人 (がいこくじん) - foreigner',
        radicals: '人',
        jouyouGrade: 1
    }
];

export const GET: RequestHandler = async ({ locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Clear existing sample kanji first to avoid duplicates
        await db.delete(kanjis)
            .where(inArray(kanjis.character, sampleKanji.map(k => k.character)))
            .execute();

        // Insert sample kanji
        const kanjiIds = [];
        for (const kanji of sampleKanji) {
            // Parse the example string into the required format
            const exampleParts = kanji.examples.split(' - ');
            const wordParts = exampleParts[0].match(/([^\s]+)\s+\(([^\)]+)\)/);
            
            const examplesArray = [];
            if (wordParts && exampleParts.length > 1) {
                examplesArray.push({
                    word: wordParts[1],
                    reading: wordParts[2],
                    meaning: exampleParts[1]
                });
            }

            const [result] = await db
                .insert(kanjis)
                .values({
                    character: kanji.character,
                    meaning: kanji.meaning,
                    onyomi: kanji.onyomi,
                    kunyomi: kanji.kunyomi,
                    strokeCount: kanji.strokeCount,
                    jlptLevel: kanji.jlptLevel,
                    radicals: kanji.radicals,
                    jouyouGrade: kanji.jouyouGrade,
                    examples: examplesArray as any
                })
                .returning({ id: kanjis.id })
                .execute();
            
            kanjiIds.push(result.id);
        }

        // Create a sample deck with these kanji
        const [deckResult] = await db
            .insert(studyDecks)
            .values({
                name: 'Sample Test Deck',
                description: 'A test deck with sample kanji for debugging',
                userId: locals.user.id,
                isPublic: false
            })
            .returning({ id: studyDecks.id })
            .execute();
        
        // Add kanji to deck
        for (const kanjiId of kanjiIds) {
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
            message: `Created ${sampleKanji.length} sample kanji and added them to a new deck`,
            deck: {
                id: deckResult.id,
                name: 'Sample Test Deck'
            },
            kanji: kanjiIds
        });
    } catch (error) {
        console.error('Error creating sample kanji:', error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}; 