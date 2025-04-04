import { db, kanjis, userKanjiProgress, reviewHistory, studyDecks, deckKanjis } from './index';
import { eq, and, like, sql, desc, asc, between, gt, lt, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * Kanji data utility functions
 */

// Get kanji by id
export async function getKanjiById(id: string) {
  const result = await db.select().from(kanjis).where(eq(kanjis.id, id));
  if (!result[0]) return null;
  
  const kanji = result[0];
  
  // Transform database column names to the expected property names and handle examples JSON
  return {
    id: kanji.id,
    character: kanji.character,
    meaning: kanji.meaning,
    onyomi: kanji.onyomi,
    kunyomi: kanji.kunyomi,
    jlptLevel: (kanji as any).jlpt_level,
    strokeCount: (kanji as any).stroke_count,
    jouyouGrade: (kanji as any).jouyou_grade,
    radicals: kanji.radicals,
    examples: kanji.examples ? (typeof kanji.examples === 'string' ? JSON.parse(kanji.examples) : kanji.examples) : null,
    sentence_examples: (kanji as any).sentence_examples ? (typeof (kanji as any).sentence_examples === 'string' ? JSON.parse((kanji as any).sentence_examples) : (kanji as any).sentence_examples) : null,
    createdAt: (kanji as any).created_at,
    updatedAt: (kanji as any).updated_at
  };
}

// Get kanji by character
export async function getKanjiByCharacter(character: string) {
  const result = await db.select().from(kanjis).where(eq(kanjis.character, character));
  return result[0] || null;
}

// Search kanji with various filters
export async function searchKanji({
  query = '',
  jlptLevel,
  minStrokes,
  maxStrokes,
  limit = 50,
  offset = 0,
  orderBy = 'strokeCount',
  orderDirection = 'asc'
}: {
  query?: string;
  jlptLevel?: number | null;
  minStrokes?: number | null;
  maxStrokes?: number | null;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}) {
  const conditions: SQL[] = [];
  
  if (query) {
    conditions.push(
      sql`(${kanjis.character} LIKE ${'%' + query + '%'} OR ${kanjis.meaning} LIKE ${'%' + query + '%'})`
    );
  }
  
  if (jlptLevel !== undefined && jlptLevel !== null) {
    conditions.push(eq(kanjis.jlptLevel, jlptLevel));
  }
  
  if (minStrokes !== undefined && minStrokes !== null) {
    conditions.push(gte(kanjis.strokeCount, minStrokes));
  }
  
  if (maxStrokes !== undefined && maxStrokes !== null) {
    conditions.push(lte(kanjis.strokeCount, maxStrokes));
  }
  
  let orderByClause;
  if (orderBy === 'character') {
    orderByClause = orderDirection === 'desc' ? desc(kanjis.character) : asc(kanjis.character);
  } else if (orderBy === 'jlptLevel') {
    orderByClause = orderDirection === 'desc' ? desc(kanjis.jlptLevel) : asc(kanjis.jlptLevel);
  } else if (orderBy === 'meaning') {
    orderByClause = orderDirection === 'desc' ? desc(kanjis.meaning) : asc(kanjis.meaning);
  } else {
    // Default to stroke count
    orderByClause = orderDirection === 'desc' ? desc(kanjis.strokeCount) : asc(kanjis.strokeCount);
  }
  
  // Execute query with filters
  const results = conditions.length > 0
    ? await db.select().from(kanjis)
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset)
    : await db.select().from(kanjis)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
  
  // Count total matching records for pagination
  const countQuery = conditions.length > 0
    ? await db.select({ count: sql`count(*)` }).from(kanjis).where(and(...conditions))
    : await db.select({ count: sql`count(*)` }).from(kanjis);
  
  // Map database column names to the expected property names
  const mappedResults = results.map(kanji => ({
    id: kanji.id,
    character: kanji.character,
    meaning: kanji.meaning,
    onyomi: kanji.onyomi,
    kunyomi: kanji.kunyomi,
    jlptLevel: (kanji as any).jlpt_level,
    strokeCount: (kanji as any).stroke_count,
    jouyouGrade: (kanji as any).jouyou_grade,
    radicals: kanji.radicals,
    examples: kanji.examples ? (typeof kanji.examples === 'string' ? JSON.parse(kanji.examples) : kanji.examples) : null,
    sentence_examples: (kanji as any).sentence_examples ? (typeof (kanji as any).sentence_examples === 'string' ? JSON.parse((kanji as any).sentence_examples) : (kanji as any).sentence_examples) : null,
    createdAt: (kanji as any).created_at,
    updatedAt: (kanji as any).updated_at
  }));
  
  return {
    data: mappedResults,
    pagination: {
      total: Number(countQuery[0]?.count) || 0,
      limit,
      offset
    }
  };
}

/**
 * User progress utility functions
 */

// Get user's progress for a specific kanji
export async function getUserKanjiProgress(userId: string, kanjiId: string) {
  const result = await db.select()
    .from(userKanjiProgress)
    .where(and(
      eq(userKanjiProgress.userId, userId),
      eq(userKanjiProgress.kanjiId, kanjiId)
    ));
  return result[0] || null;
}

// Update user's progress after a review
export async function updateUserKanjiProgress(
  userId: string,
  kanjiId: string,
  {
    quality,
    interval,
    easeFactor,
    status
  }: {
    quality: number;
    interval: number;
    easeFactor: number;
    status: string;
  }
) {
  const now = new Date();
  const dueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  
  // Check if progress record exists
  const existing = await getUserKanjiProgress(userId, kanjiId);
  
  if (existing) {
    // Update existing record
    return db.update(userKanjiProgress)
      .set({
        interval,
        easeFactor,
        dueDate: dueDate.toISOString(),
        lastReviewDate: now.toISOString(),
        lastReviewQuality: quality,
        status,
        reviewCount: (existing.reviewCount || 0) + 1,
        correctCount: quality >= 3 ? (existing.correctCount || 0) + 1 : (existing.correctCount || 0),
        incorrectCount: quality < 3 ? (existing.incorrectCount || 0) + 1 : (existing.incorrectCount || 0),
        updatedAt: now.toISOString()
      })
      .where(and(
        eq(userKanjiProgress.userId, userId),
        eq(userKanjiProgress.kanjiId, kanjiId)
      ));
  } else {
    // Create new record
    return db.insert(userKanjiProgress)
      .values({
        userId,
        kanjiId,
        interval,
        easeFactor,
        dueDate: dueDate.toISOString(),
        lastReviewDate: now.toISOString(),
        lastReviewQuality: quality,
        status,
        reviewCount: 1,
        correctCount: quality >= 3 ? 1 : 0,
        incorrectCount: quality < 3 ? 1 : 0
      });
  }
}

// Add review history entry
export async function addReviewHistory(
  userId: string,
  kanjiId: string,
  {
    quality,
    elapsedMs,
    previousInterval,
    newInterval,
    previousEaseFactor,
    newEaseFactor
  }: {
    quality: number;
    elapsedMs?: number;
    previousInterval?: number;
    newInterval: number;
    previousEaseFactor?: number;
    newEaseFactor: number;
  }
) {
  return db.insert(reviewHistory)
    .values({
      userId,
      kanjiId,
      quality,
      elapsedMs: elapsedMs || 0,
      previousInterval: previousInterval || 0,
      newInterval,
      previousEaseFactor: previousEaseFactor || 250,
      newEaseFactor
    });
}

/**
 * Study deck utility functions
 */

// Get all decks for a user
export async function getUserDecks(userId: string) {
  return db.select()
    .from(studyDecks)
    .where(eq(studyDecks.userId, userId))
    .orderBy(asc(studyDecks.name));
}

// Get deck by id
export async function getDeckById(deckId: string) {
  const result = await db.select()
    .from(studyDecks)
    .where(eq(studyDecks.id, deckId));
  return result[0] || null;
}

// Get kanji in a deck
export async function getDeckKanji(deckId: string) {
  return db.select({
    deckKanji: deckKanjis,
    kanji: kanjis
  })
    .from(deckKanjis)
    .innerJoin(kanjis, eq(deckKanjis.kanjiId, kanjis.id))
    .where(eq(deckKanjis.deckId, deckId))
    .orderBy(asc(deckKanjis.position));
}

// Add kanji to a deck
export async function addKanjiToDeck(deckId: string, kanjiId: string, position?: number) {
  // Get current highest position
  let nextPosition = 0;
  if (position === undefined) {
    const highestPosition = await db.select({ max: sql`MAX(${deckKanjis.position})` })
      .from(deckKanjis)
      .where(eq(deckKanjis.deckId, deckId));
    nextPosition = (Number(highestPosition[0]?.max) || 0) + 1;
  } else {
    nextPosition = position;
  }
  
  return db.insert(deckKanjis)
    .values({
      deckId,
      kanjiId,
      position: nextPosition
    });
}

// Remove kanji from a deck
export async function removeKanjiFromDeck(deckId: string, kanjiId: string) {
  return db.delete(deckKanjis)
    .where(and(
      eq(deckKanjis.deckId, deckId),
      eq(deckKanjis.kanjiId, kanjiId)
    ));
} 