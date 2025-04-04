import { db, kanjis } from './index';

/**
 * Resets all kanji examples in the database to null
 * This allows them to be regenerated from scratch
 * @returns Object containing success status and message
 */
export async function resetAllKanjiExamples() {
  try {
    console.log('Resetting all kanji examples in the database...');
    
    // Update all kanji records to set examples to null
    await db.update(kanjis)
      .set({ 
        examples: null as any, // Type cast to resolve type issues
        updatedAt: new Date().toISOString()
      });
    
    console.log(`Reset examples for all kanji records`);
    
    return {
      success: true,
      message: `Successfully reset examples for all kanji records`
    };
  } catch (error) {
    console.error('Error resetting kanji examples:', error);
    throw error;
  }
} 