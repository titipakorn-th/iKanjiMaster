import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { userKanjiProgress, kanjis } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    const userId = locals.user.id;
    
    // Get all progress entries for the user with kanji details
    const progress = await db
      .select({
        progressId: userKanjiProgress.id,
        kanjiId: userKanjiProgress.kanjiId,
        character: kanjis.character,
        meaning: kanjis.meaning,
        reviewCount: userKanjiProgress.reviewCount,
        correctCount: userKanjiProgress.correctCount,
        lastReviewQuality: userKanjiProgress.lastReviewQuality,
        lastReviewDate: userKanjiProgress.lastReviewDate,
        createdAt: userKanjiProgress.createdAt
      })
      .from(userKanjiProgress)
      .leftJoin(kanjis, eq(userKanjiProgress.kanjiId, kanjis.id))
      .where(eq(userKanjiProgress.userId, userId))
      .orderBy(userKanjiProgress.lastReviewDate);
    
    return json({
      success: true,
      message: `Found ${progress.length} kanji progress entries`,
      progress
    });
  } catch (error) {
    console.error('Error checking user kanji progress:', error);
    return json({
      success: false,
      message: 'Error checking user kanji progress',
      error: String(error)
    }, { status: 500 });
  }
}; 