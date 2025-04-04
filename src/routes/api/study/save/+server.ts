import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, studySessions, kanjis, reviewHistory, userKanjiProgress } from '$lib/server/db';
import { eq, count, avg, sql } from 'drizzle-orm';
import { updateStudyStreak } from '$lib/server/auth';

// Define the expected structure of review history items
interface ReviewHistoryItem {
    kanjiId: string;
    quality: number;
    timestamp?: string;
    elapsedMs?: number;
    previousInterval?: number;
    newInterval?: number;
    previousEaseFactor?: number;
    newEaseFactor?: number;
}

// Define the expected study session data structure
interface StudySessionData {
    reviewHistory: ReviewHistoryItem[];
    totalTime: number;
    deckId?: string;
    studyMode?: string;
}

// Function to fetch user stats
async function getUserStats(userId: string) {
    // Get total unique kanji studied
    const progressResult = await db
        .select({ count: count() })
        .from(userKanjiProgress)
        .where(eq(userKanjiProgress.userId, userId));
        
    const totalKanjiStudied = progressResult[0]?.count || 0;
    
    // Get total study sessions
    const sessionsResult = await db
        .select({ count: count() })
        .from(studySessions)
        .where(eq(studySessions.userId, userId));
        
    const totalSessions = sessionsResult[0]?.count || 0;
    
    // Get average accuracy from review history
    const accuracyResult = await db
        .select({ 
            avgQuality: avg(reviewHistory.quality) 
        })
        .from(reviewHistory)
        .where(eq(reviewHistory.userId, userId));
        
    // Convert 0-5 scale to percentage (0-100)
    const avgQuality = accuracyResult[0]?.avgQuality || 0;
    const averageAccuracy = Math.round(((avgQuality as number) / 5) * 100);
    
    return {
        totalKanjiStudied,
        totalSessions,
        averageAccuracy
    };
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            console.error('Study session save failed: User not authenticated');
            return json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const userId = locals.user.id;
        // Parse the session data from the request
        const sessionData = await request.json() as StudySessionData;
        
        console.log('Received study session data:', JSON.stringify(sessionData, null, 2));
        console.log(`Review history items: ${sessionData.reviewHistory?.length || 0}`);
        
        // Validate the session data
        if (!sessionData.reviewHistory || !Array.isArray(sessionData.reviewHistory) || sessionData.reviewHistory.length === 0) {
            console.error('Study session save failed: Invalid review history', sessionData);
            return json({ 
                success: false, 
                error: 'Invalid review history data',
                receivedData: sessionData
            }, { status: 400 });
        }

        // Check if all kanji IDs in the review history exist in the database
        const kanjiIds = [...new Set(sessionData.reviewHistory.map(item => item.kanjiId))];
        console.log(`Unique kanji IDs in review: ${kanjiIds.length}`, kanjiIds);
        
        if (kanjiIds.length === 0 || !kanjiIds[0]) {
            console.error('Study session save failed: No valid kanji IDs in review history');
            return json({ 
                success: false, 
                error: 'No valid kanji IDs in review history',
                receivedData: { kanjiIds, sessionData }
            }, { status: 400 });
        }
        
        // Verify each kanji exists in the database
        for (const kanjiId of kanjiIds) {
            const existingKanji = await db
                .select({ id: kanjis.id })
                .from(kanjis)
                .where(eq(kanjis.id, kanjiId))
                .execute();
            
            if (existingKanji.length === 0) {
                console.error(`Study session save failed: Kanji ID ${kanjiId} not found in database`);
                return json({ 
                    success: false, 
                    error: `Kanji ID ${kanjiId} not found in database. Use the debug tools to verify the kanji.`,
                    debugLink: `/api/debug/check-kanji-id?id=${kanjiId}`,
                    receivedData: { kanjiId, sessionData }
                }, { status: 400 });
            }
        }

        try {
            // Create a new study session
            const [sessionResult] = await db
                .insert(studySessions)
                .values({
                    userId: userId,
                    deckId: sessionData.deckId,
                    startTime: new Date(Date.now() - sessionData.totalTime).toISOString(),
                    endTime: new Date().toISOString(),
                    reviewCount: sessionData.reviewHistory.length,
                    correctCount: sessionData.reviewHistory.filter(r => r.quality >= 3).length,
                    studyMode: sessionData.studyMode || 'standard'
                })
                .returning({ id: studySessions.id })
                .execute();
            
            console.log(`Created study session with ID: ${sessionResult.id}`);
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
                console.error('Foreign key constraint error when saving study session:', error);
                
                return json({ 
                    success: false, 
                    error: 'Foreign key constraint error. This usually happens when the kanji is not linked to your deck.',
                    message: 'Please use the debug tools to check kanji and deck relationships.',
                    debugLink: `/api/debug/check-kanji-id?id=${kanjiIds[0]}`,
                    kanjiIds: kanjiIds,
                    fixLink: `/api/debug/fix-kanji-id?id=${kanjiIds[0]}`,
                    receivedData: { kanjiIds },
                    debugTips: [
                        "Use the 'Fix Kanji ID' tool to add this kanji to your deck",
                        "Create sample kanji and decks using the debug tools",
                        "Try studying kanji from the 'Sample Test Deck' created in the debug page"
                    ]
                }, { status: 400 });
            }
            throw error; // Re-throw if it's not a foreign key constraint error
        }

        // Create review history entries
        const reviewEntries: string[] = [];
        let reviewErrors = [];
        
        for (const review of sessionData.reviewHistory) {
            try {
                // Insert each review into the review history
                const [reviewResult] = await db
                    .insert(reviewHistory)
                    .values({
                        userId: userId,
                        kanjiId: review.kanjiId,
                        reviewDate: review.timestamp || new Date().toISOString(),
                        quality: review.quality,
                        elapsedMs: review.elapsedMs || 0,
                        previousInterval: review.previousInterval || 0,
                        newInterval: review.newInterval || 0,
                        previousEaseFactor: review.previousEaseFactor || 250,
                        newEaseFactor: review.newEaseFactor || 250
                    })
                    .returning({ id: reviewHistory.id })
                    .execute();
                
                reviewEntries.push(reviewResult.id);
                
                // Also update user kanji progress to track which kanji the user has studied
                try {
                    // Check if a progress entry already exists
                    const existingProgress = await db
                        .select({ id: userKanjiProgress.id })
                        .from(userKanjiProgress)
                        .where(
                            eq(userKanjiProgress.userId, userId) && 
                            eq(userKanjiProgress.kanjiId, review.kanjiId)
                        )
                        .execute();
                    
                    if (existingProgress.length === 0) {
                        // Create a new progress entry if one doesn't exist
                        await db
                            .insert(userKanjiProgress)
                            .values({
                                userId: userId,
                                kanjiId: review.kanjiId,
                                lastReviewDate: new Date().toISOString(),
                                dueDate: new Date().toISOString(), // Set due date to now initially
                                reviewCount: 1,
                                correctCount: review.quality >= 3 ? 1 : 0,
                                incorrectCount: review.quality < 3 ? 1 : 0,
                                lastReviewQuality: review.quality,
                                status: 'learning'
                            })
                            .execute();
                    } else {
                        // Update the existing progress entry
                        await db
                            .update(userKanjiProgress)
                            .set({
                                lastReviewDate: new Date().toISOString(),
                                reviewCount: sql`${userKanjiProgress.reviewCount} + 1`,
                                correctCount: sql`${userKanjiProgress.correctCount} + ${review.quality >= 3 ? 1 : 0}`,
                                incorrectCount: sql`${userKanjiProgress.incorrectCount} + ${review.quality < 3 ? 1 : 0}`,
                                lastReviewQuality: review.quality,
                                updatedAt: new Date().toISOString()
                            })
                            .where(
                                eq(userKanjiProgress.userId, userId) && 
                                eq(userKanjiProgress.kanjiId, review.kanjiId)
                            )
                            .execute();
                    }
                } catch (progressError) {
                    console.error(`Error updating kanji progress for kanji ${review.kanjiId}:`, progressError);
                    // Don't fail the whole operation, just log the error
                }
            } catch (error: any) {
                console.error(`Error inserting review for kanji ${review.kanjiId}:`, error);
                
                // Collect error information
                let errorMessage = String(error);
                if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
                    errorMessage = `Foreign key constraint error for kanji ID: ${review.kanjiId}`;
                }
                
                reviewErrors.push({
                    kanjiId: review.kanjiId,
                    error: errorMessage,
                    debugLink: `/api/debug/check-kanji-id?id=${review.kanjiId}`
                });
            }
        }

        // Even if some reviews failed, if at least one succeeded we consider it partially successful
        if (reviewEntries.length > 0) {
            console.log(`Created ${reviewEntries.length} review history entries out of ${sessionData.reviewHistory.length} (${reviewErrors.length} failed)`);
            
            // Update user streak
            await updateStudyStreak(userId);
            
            // Get updated stats
            const stats = await getUserStats(userId);
            
            return json({ 
                success: true, 
                message: `Study session saved with ${reviewEntries.length}/${sessionData.reviewHistory.length} reviews.`,
                reviewEntries: reviewEntries.length,
                failedReviews: reviewErrors.length > 0 ? reviewErrors : undefined,
                stats
            });
        } else if (reviewErrors.length > 0) {
            // All reviews failed
            return json({ 
                success: false, 
                error: 'Failed to save any review history items',
                reviewErrors,
                debugTips: [
                    "Use the debug tools to check if the kanji are linked to your decks",
                    "Create sample kanji and decks using the debug tools",
                    "Verify that you are logged in with the correct user account"
                ]
            }, { status: 500 });
        }

        // This should never happen (no reviews succeeded but no errors), but just in case
        // Update user streak even in this case
        await updateStudyStreak(userId);
        
        // Get updated stats
        const stats = await getUserStats(userId);
        
        return json({ 
            success: true, 
            message: 'Study session saved, but no review entries were created.',
            reviewEntries: 0,
            stats
        });
    } catch (error: any) {
        console.error('Error saving study session:', error);
        
        // Provide friendly error message for common issues
        let message = String(error);
        let status = 500;
        
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            message = 'Database foreign key constraint failed. This often happens when a kanji is not linked to your deck.';
            status = 400;
        }
        
        return json({ 
            success: false, 
            error: message,
            debugTips: [
                "Use the Debug page to diagnose and fix issues",
                "Create sample kanji and decks using the debug tools",
                "Check if the kanji ID exists and is associated with your deck"
            ]
        }, { status });
    }
}; 