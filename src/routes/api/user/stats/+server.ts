import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { studySessions, userKanjiProgress } from '$lib/server/db/schema';
import { count, eq, sql, sum } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    const userId = locals.user.id;

    // Get kanji progress count for this user
    const kanjiProgress = await db
      .select({ count: count() })
      .from(userKanjiProgress)
      .where(eq(userKanjiProgress.userId, userId));

    // Get session stats for this user
    const sessionStats = await db
      .select({
        totalSessions: count(),
        totalReviews: sql<number>`COALESCE(SUM(${studySessions.reviewCount}), 0)`,
        correctReviews: sql<number>`COALESCE(SUM(${studySessions.correctCount}), 0)`,
      })
      .from(studySessions)
      .where(eq(studySessions.userId, userId));

    // Calculate accuracy percentage
    const totalReviews = sessionStats[0]?.totalReviews || 0;
    const correctReviews = sessionStats[0]?.correctReviews || 0;
    const accuracyPercentage = totalReviews > 0 
      ? Math.round((correctReviews / totalReviews) * 100) 
      : 0;

    // Get the number of masteredKanji (those with lastReviewQuality >= 4)
    const masteredKanji = await db
      .select({ count: count() })
      .from(userKanjiProgress)
      .where(
        sql`${userKanjiProgress.userId} = ${userId} AND ${userKanjiProgress.lastReviewQuality} >= 4`
      );

    return json({
      success: true,
      stats: {
        totalKanjiStudied: kanjiProgress[0]?.count || 0,
        totalSessions: sessionStats[0]?.totalSessions || 0,
        totalReviews: totalReviews,
        correctReviews: correctReviews,
        averageAccuracy: accuracyPercentage,
        masteredKanji: masteredKanji[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return json({
      success: false,
      message: 'Failed to fetch user statistics'
    }, { status: 500 });
  }
}; 