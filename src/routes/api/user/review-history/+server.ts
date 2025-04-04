import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviewHistory } from '$lib/server/db/schema';
import { count, eq, sql } from 'drizzle-orm';

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

    // Get reviews grouped by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    // Query to get counts by day
    const reviewsByDay = await db
      .select({
        date: sql`date(${reviewHistory.reviewDate})`,
        count: count(),
      })
      .from(reviewHistory)
      .where(
        sql`${reviewHistory.userId} = ${userId} AND ${reviewHistory.reviewDate} >= ${thirtyDaysAgoIso}`
      )
      .groupBy(sql`date(${reviewHistory.reviewDate})`)
      .orderBy(sql`date(${reviewHistory.reviewDate})`);

    // Generate a complete 30-day range (including days with zero reviews)
    const reviewData = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Find if we have data for this day
      const dayData = reviewsByDay.find(
        day => day.date === dateString
      );
      
      reviewData.push({
        date: dateString,
        count: dayData ? Number(dayData.count) : 0
      });
    }

    return json({
      success: true,
      reviewsByDay: reviewData
    });
  } catch (error) {
    console.error('Error fetching review history:', error);
    return json({
      success: false,
      message: 'Failed to fetch review history'
    }, { status: 500 });
  }
}; 