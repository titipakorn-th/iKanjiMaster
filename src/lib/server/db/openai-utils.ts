import { OpenAI } from 'openai';
import { db, kanjis } from './index';
import { eq, isNull, or, sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Extract kanji examples from text when JSON parsing fails
 * @param text - The text response from OpenAI
 * @param character - The kanji character (for fallback)
 * @returns Array of examples with best-effort parsing
 */
function extractExamplesFromText(text: string, character: string): KanjiExample[] {
  console.log('Attempting to extract examples from text response');
  
  // Default fallback example
  const fallbackExample: KanjiExample = {
    word: character,
    reading: '',
    howToRead: '',
    meaning: '',
    sentence: '',
    sentenceReading: '',
    furigana: { [character]: '' },
    sentenceMeaning: ''
  };
  
  const examples: KanjiExample[] = [];
  
  // Look for patterns like "Word: X, Reading: Y, Meaning: Z"
  const wordMatches = text.match(/(?:Word|Japanese word|Example \d+)[:\s]+([^\n,]+)/gi);
  const readingMatches = text.match(/(?:Reading|Hiragana)[:\s]+([^\n,]+)/gi);
  const meaningMatches = text.match(/(?:Meaning|English meaning)[:\s]+([^\n,.]+)/gi);
  const sentenceMatches = text.match(/(?:Sentence|Japanese sentence)[:\s]+([^\n]+)/gi);
  const sentenceReadingMatches = text.match(/(?:Sentence reading|Reading of the sentence|Furigana)[:\s]+([^\n]+)/gi);
  const sentenceMeaningMatches = text.match(/(?:Translation|English translation)[:\s]+([^\n]+)/gi);
  
  // Count how many examples we can extract based on the number of word matches
  const count = wordMatches ? Math.min(wordMatches.length, 3) : 0;
  
  for (let i = 0; i < count; i++) {
    const sentence = sentenceMatches && sentenceMatches[i] 
      ? sentenceMatches[i].replace(/(?:Sentence|Japanese sentence)[:\s]+/i, '').trim() 
      : '';
    
    const sentenceReading = sentenceReadingMatches && sentenceReadingMatches[i] 
      ? sentenceReadingMatches[i].replace(/(?:Sentence reading|Reading of the sentence|Furigana)[:\s]+/i, '').trim()
      : '';
    
    // Basic furigana mapping: If we have a reading but can't parse complex mappings, 
    // we create a simple mapping for the target kanji
    const furigana: Record<string, string> = {};
    if (sentence && sentence.includes(character)) {
      furigana[character] = readingMatches && readingMatches[i] 
        ? readingMatches[i].replace(/(?:Reading|Hiragana)[:\s]+/i, '').trim()
        : '';
    }
    
    const reading = readingMatches && readingMatches[i] 
      ? readingMatches[i].replace(/(?:Reading|Hiragana)[:\s]+/i, '').trim() 
      : '';
      
    examples.push({
      word: wordMatches && wordMatches[i] ? wordMatches[i].replace(/(?:Word|Japanese word|Example \d+)[:\s]+/i, '').trim() : character,
      reading: reading,
      howToRead: reading, // Add howToRead field with the same value as reading
      meaning: meaningMatches && meaningMatches[i] ? meaningMatches[i].replace(/(?:Meaning|English meaning)[:\s]+/i, '').trim() : '',
      sentence: sentence,
      sentenceReading: sentenceReading, // Add the entire sentence reading
      furigana: furigana,
      sentenceMeaning: sentenceMeaningMatches && sentenceMeaningMatches[i] ? sentenceMeaningMatches[i].replace(/(?:Translation|English translation)[:\s]+/i, '').trim() : ''
    });
  }
  
  // If we couldn't extract anything, return a fallback
  if (examples.length === 0) {
    examples.push(fallbackExample);
  }
  
  return examples;
}

/**
 * Example sentence format for kanji
 */
export interface KanjiExample {
  word: string;
  reading: string;
  howToRead: string; // Reading of the word in hiragana for display purposes
  meaning: string;
  sentence?: string;
  sentenceReading?: string; // Reading of the entire sentence
  furigana?: Record<string, string>; // Map of kanji to readings for sentence only
  sentenceMeaning?: string;
}

/**
 * Generates example sentences with furigana for a kanji
 * @param character - The kanji character
 * @param meaning - The meaning of the kanji
 * @param onyomi - The onyomi reading
 * @param kunyomi - The kunyomi reading
 * @returns Array of examples with sentences and furigana
 */
export async function generateKanjiExamples(
  character: string,
  meaning: string,
  onyomi: string | null,
  kunyomi: string | null
): Promise<KanjiExample[]> {
  const prompt = `
Generate 3 example words and sentences for the Japanese kanji "${character}" (meaning: "${meaning}").
${onyomi ? `Onyomi reading: ${onyomi}` : ''}
${kunyomi ? `Kunyomi reading: ${kunyomi}` : ''}

For each example, provide:
1. A common Japanese word using this kanji
2. The reading of the word in hiragana
3. The English meaning of the word
4. A simple Japanese sentence using the word
5. The reading of the entire sentence in hiragana
6. A mapping of ONLY kanji characters to their readings in the sentence (for furigana)
7. The English translation of the sentence

IMPORTANT RULES FOR FURIGANA: 
- Only include kanji characters in the furigana mapping, NOT hiragana or katakana characters
- For compound kanji words, map each individual kanji to its correct reading in that specific word
- Include ALL kanji characters present in the sentence in the furigana mapping, not just the target kanji
- Do not repeat hiragana characters that immediately follow a kanji in the furigana mapping
- Ensure each kanji character in the sentence appears exactly once as a key in the furigana mapping

For example, for the sentence "彼は意見を述べた":
- Correct mapping: {"彼":"かれ", "意":"い", "見":"けん", "述":"の"}
- NOT: {"彼は":"かれは", "意見を":"いけんを", "述べた":"のべた"}
- NOT: {"彼":"かれは", "意見":"いけんを", "述":"のべた"}
- NOT: {"意見":"いけん", "述":"のべ"}
- NOT: {"彼":"かれ", "意":"い", "見":"けん", "述":"のべた"}

Format the response as a valid JSON array with the following structure:
[
  {
    "word": "Japanese word",
    "reading": "reading in hiragana",
    "howToRead": "reading in hiragana", 
    "meaning": "English meaning",
    "sentence": "Japanese sentence",
    "sentenceReading": "entire sentence reading in hiragana",
    "furigana": {"kanji1":"reading1", "kanji2":"reading2"},
    "sentenceMeaning": "English translation"
  },
  ...
]

Keep sentences simple and practical for language learners.
`;

  // List of models to try in order (fallback mechanism)
  const models = ["gpt-4o-mini"];
  let lastError = null;

  // Try each model in sequence until one works
  for (const model of models) {
    try {
      console.log(`Attempting to generate examples using model: ${model}`);
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { 
            role: "system", 
            content: "You are a helpful Japanese language assistant that provides accurate kanji usage examples with readings. Always respond with properly formatted JSON."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 800
        // No response_format for compatibility with all models
      });

      // Extract and parse the JSON response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse the JSON content carefully, handling various response formats
      try {
        // Try to find JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const jsonContent = jsonMatch[0];
          const parsed = JSON.parse(jsonContent);
          if (Array.isArray(parsed)) {
            // Ensure all examples have the new fields
            const enhancedExamples = parsed.map((example: Partial<KanjiExample>) => {
              // Make sure howToRead exists, default to reading if not provided
              if (!example.howToRead && example.reading) {
                example.howToRead = example.reading;
              }
              
              // Make sure sentenceReading exists if sentence exists
              if (example.sentence && !example.sentenceReading) {
                // Try to construct a basic sentence reading from the furigana or leave empty
                example.sentenceReading = '';
              }
              
              return example as KanjiExample;
            });
            
            console.log(`Successfully generated examples using model: ${model}`);
            return enhancedExamples;
          }
        }
        
        // If no JSON array found, try to parse the whole response
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Ensure all examples have the new fields
          const enhancedExamples = parsed.map((example: Partial<KanjiExample>) => {
            // Make sure howToRead exists, default to reading if not provided
            if (!example.howToRead && example.reading) {
              example.howToRead = example.reading;
            }
            
            // Make sure sentenceReading exists if sentence exists
            if (example.sentence && !example.sentenceReading) {
              // Try to construct a basic sentence reading from the furigana or leave empty
              example.sentenceReading = '';
            }
            
            return example as KanjiExample;
          });
          
          console.log(`Successfully generated examples using model: ${model}`);
          return enhancedExamples;
        } else if (parsed.examples && Array.isArray(parsed.examples)) {
          // Ensure all examples have the new fields
          const enhancedExamples = parsed.examples.map((example: Partial<KanjiExample>) => {
            // Make sure howToRead exists, default to reading if not provided
            if (!example.howToRead && example.reading) {
              example.howToRead = example.reading;
            }
            
            // Make sure sentenceReading exists if sentence exists
            if (example.sentence && !example.sentenceReading) {
              // Try to construct a basic sentence reading from the furigana or leave empty
              example.sentenceReading = '';
            }
            
            return example as KanjiExample;
          });
          
          console.log(`Successfully generated examples using model: ${model}`);
          return enhancedExamples;
        } else {
          // If we get here, the response might be malformed but we can try to salvage it
          console.warn(`Unexpected response format from model ${model}, attempting to extract example data`);
          return extractExamplesFromText(content, character);
        }
      } catch (error) {
        console.error(`Failed to parse OpenAI response from model ${model}:`, error);
        console.log('Response content:', content);
        return extractExamplesFromText(content, character);
      }
    } catch (error) {
      console.error(`Error generating kanji examples with model ${model}:`, error);
      lastError = error;
      // Continue to the next model in the list
    }
  }

  // If all models failed, log the error and return a basic example
  console.error('All models failed to generate examples:', lastError);
  return [{
    word: character,
    reading: onyomi || '',
    howToRead: onyomi || '',
    meaning: meaning,
    sentence: `${character}${character}${character}。`,
    sentenceReading: onyomi ? `${onyomi}${onyomi}${onyomi}。` : '',
    furigana: { [character]: onyomi || kunyomi || '' },
    sentenceMeaning: `Example with ${meaning}.`
  }];
}

/**
 * Checks the database for kanji without examples and generates them using OpenAI
 * @param limit - Maximum number of kanji to process
 * @returns Object containing counts of processed and updated records
 */
export async function generateMissingKanjiExamples(limit: number = 10) {
  try {
    // Find kanji without sentence_examples or with empty sentence_examples array
    const kanjiWithoutExamples = await db.select()
      .from(kanjis)
      .where(isNull(kanjis.sentence_examples))
      .limit(limit);
    
    console.log(`Found ${kanjiWithoutExamples.length} kanji without sentence examples`);
    
    let updatedCount = 0;
    let errorCount = 0;
    let processedKanji: string[] = [];
    
    // Process each kanji
    for (const kanji of kanjiWithoutExamples) {
      try {
        console.log(`Generating sentence examples for kanji: ${kanji.character} (${kanji.meaning})`);
        processedKanji.push(kanji.character);
        
        // Generate examples using OpenAI
        const examples = await generateKanjiExamples(
          kanji.character,
          kanji.meaning,
          kanji.onyomi,
          kanji.kunyomi
        );
        
        // Update the kanji in the database
        if (examples && examples.length > 0) {
          await db.update(kanjis)
            .set({ 
              sentence_examples: JSON.stringify(examples) as any, // Type cast to resolve type issues
              updatedAt: new Date().toISOString()
            })
            .where(eq(kanjis.id, kanji.id));
          
          updatedCount++;
          console.log(`Updated kanji: ${kanji.character} with ${examples.length} sentence examples`);
        } else {
          console.warn(`No sentence examples were generated for kanji: ${kanji.character}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error processing kanji ${kanji.character}:`, error);
        errorCount++;
      }
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      total: kanjiWithoutExamples.length,
      updated: updatedCount,
      errors: errorCount,
      processedKanji: processedKanji
    };
  } catch (error) {
    console.error('Error in generateMissingKanjiExamples:', error);
    throw error;
  }
} 