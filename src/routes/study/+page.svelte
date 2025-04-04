<script lang="ts">
  import { onMount } from 'svelte';
  import StudySession from '$lib/components/StudySession.svelte';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // Study session state
  let sessionStarted = false;
  let selectedMode: 'kanji-to-meaning' | 'meaning-to-kanji' | 'reading-to-kanji' = 'kanji-to-meaning';
  let selectedDeckId = '';
  let cardLimit = 20;
  let includeNew = true;
  let includeDue = true;
  let isLoading = false;
  let error = '';
  
  // Kanji data for the study session
  type KanjiItem = {
    id: string;
    character: string;
    meaning: string;
    onyomi: string | null;
    kunyomi: string | null;
    jlptLevel: number | null;
    strokeCount: number | null;
    examples: Array<{
      word: string;
      reading: string;
      meaning: string;
      sentence?: string;
      sentenceReading?: string;
      sentenceMeaning?: string;
      furigana?: Record<string, string>;
    }> | null;
    sentence_examples?: Array<{
      word: string;
      reading: string;
      meaning: string;
      sentence?: string;
      sentenceReading?: string;
      sentenceMeaning?: string;
      furigana?: Record<string, string>;
    }> | null;
  };
  
  let studyItems: KanjiItem[] = [];
  
  // Decks data (in a real app, this would come from the database)
  const decks = [
    { id: 'jlpt-n5', name: 'JLPT N5 Kanji', description: 'Basic kanji for JLPT N5', count: 100 },
    { id: 'jlpt-n4', name: 'JLPT N4 Kanji', description: 'Basic kanji for JLPT N4', count: 150 },
    { id: 'elements', name: 'Elements', description: 'Kanji for natural elements', count: 25 },
    { id: 'numbers', name: 'Numbers', description: 'Kanji for numbers', count: 20 },
    { id: 'animals', name: 'Animals', description: 'Kanji for common animals', count: 35 }
  ];
  
  // Get preselected parameters from URL
  const { kanjiId, jlptLevel } = data.studyParams;
  
  // Fetch kanji data from API
  async function fetchKanjiForStudy() {
    isLoading = true;
    error = '';
    
    try {
      // Map from deck IDs to JLPT levels for this demo
      const jlptMap = {
        'jlpt-n5': 5,
        'jlpt-n4': 4,
      };
      
      let apiUrl = '/api/kanji?limit=' + cardLimit;
      
      // If a specific kanji ID was requested, fetch just that one
      if (kanjiId) {
        console.log(`Fetching specific kanji with ID: ${kanjiId}`);
        const response = await fetch(`/api/kanji?id=${kanjiId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error response:', errorData);
          throw new Error(errorData.error || `Failed to fetch kanji with ID ${kanjiId}`);
        }
        
        const data = await response.json();
        console.log('API response for kanji by ID:', data);
        
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          throw new Error(`Kanji with ID ${kanjiId} not found`);
        }
        
        studyItems = data.data
          .map((kanji: any) => {
            // Make sure both examples arrays are arrays if present
            const examples = kanji.examples ? 
              (typeof kanji.examples === 'string' ? JSON.parse(kanji.examples) : kanji.examples) : 
              [];
              
            const sentenceExamples = kanji.sentence_examples ? 
              (typeof kanji.sentence_examples === 'string' ? JSON.parse(kanji.sentence_examples) : kanji.sentence_examples) : 
              [];
              
            return {
              id: kanji.id,
              character: kanji.character,
              meaning: kanji.meaning,
              onyomi: kanji.onyomi || null,
              kunyomi: kanji.kunyomi || null,
              jlptLevel: kanji.jlptLevel || null,
              strokeCount: kanji.strokeCount || null,
              examples: examples,
              sentence_examples: sentenceExamples.length > 0 ? sentenceExamples : undefined
            } as KanjiItem;
          })
          .sort(() => Math.random() - 0.5)
          .slice(0, cardLimit);
        
        sessionStarted = true;
        return;
      }
      
      // Add JLPT filter for N4 and N5 decks
      const level = jlptLevel || (selectedDeckId === 'jlpt-n5' ? 5 : 
                                   selectedDeckId === 'jlpt-n4' ? 4 : null);
      
      if (level) {
        apiUrl += '&jlpt=' + level;
      }
      
      console.log(`Fetching kanji with URL: ${apiUrl}`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch kanji data');
      }
      
      const data = await response.json();
      console.log('API response for kanji search:', data);
      
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('No kanji data available');
      }
      
      // Process examples to ensure sentence examples are available
      studyItems = data.data
        .map((kanji: any) => {
          // Make sure both examples arrays are arrays if present
          const examples = kanji.examples ? 
            (typeof kanji.examples === 'string' ? JSON.parse(kanji.examples) : kanji.examples) : 
            [];
            
          const sentenceExamples = kanji.sentence_examples ? 
            (typeof kanji.sentence_examples === 'string' ? JSON.parse(kanji.sentence_examples) : kanji.sentence_examples) : 
            [];
            
          return {
            id: kanji.id,
            character: kanji.character,
            meaning: kanji.meaning,
            onyomi: kanji.onyomi || null,
            kunyomi: kanji.kunyomi || null,
            jlptLevel: kanji.jlptLevel || null,
            strokeCount: kanji.strokeCount || null,
            examples: examples,
            sentence_examples: sentenceExamples.length > 0 ? sentenceExamples : undefined
          } as KanjiItem;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, cardLimit);
      
      sessionStarted = true;
    } catch (err: unknown) {
      console.error('Error fetching kanji:', err);
      error = err instanceof Error ? err.message : 'Failed to load kanji for study session';
      sessionStarted = false;
    } finally {
      isLoading = false;
    }
  }
  
  // Start study session
  function startSession() {
    fetchKanjiForStudy();
  }
  
  // Handle study session completion
  function handleSessionComplete(event: CustomEvent<any>) {
    console.log('Session completed', event.detail);
    // In a real app, this would save the results to the database
    sessionStarted = false;
  }
  
  // Select a deck
  function selectDeck(deckId: string) {
    selectedDeckId = deckId;
  }
  
  // Auto-select the first deck on mount, or use URL parameters if provided
  onMount(() => {
    // If a JLPT level was specified, select the corresponding deck
    if (jlptLevel) {
      if (jlptLevel === 5) {
        selectedDeckId = 'jlpt-n5';
      } else if (jlptLevel === 4) {
        selectedDeckId = 'jlpt-n4';
      }
    }
    // Otherwise, select the first deck
    else if (decks.length > 0 && !selectedDeckId) {
      selectedDeckId = decks[0].id;
    }
    
    // If a specific kanji ID was requested, start the session immediately
    if (kanjiId) {
      fetchKanjiForStudy();
    }
  });
</script>

<div>
  {#if !sessionStarted}
    <!-- Study configuration -->
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">Start Study Session</h1>
      
      <!-- Deck selection -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Choose a Deck</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each decks as deck}
            <button 
              class={`text-left p-4 rounded-lg border-2 transition-colors ${
                selectedDeckId === deck.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              on:click={() => selectDeck(deck.id)}
            >
              <div class="font-medium">{deck.name}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">{deck.description}</div>
              <div class="text-xs text-indigo-600 dark:text-indigo-400 mt-2">{deck.count} kanji</div>
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Study options -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Study Options</h2>
        
        <div class="space-y-6">
          <!-- Study mode selection -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Study Mode
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class={`
                flex items-center p-3 rounded-lg border-2 cursor-pointer
                ${selectedMode === 'kanji-to-meaning' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                  : 'border-slate-200 dark:border-slate-700'}
              `}>
                <input 
                  type="radio" 
                  name="studyMode" 
                  value="kanji-to-meaning" 
                  bind:group={selectedMode}
                  class="hidden" 
                />
                <span class="block w-full text-center">Kanji → Meaning</span>
              </label>
              
              <label class={`
                flex items-center p-3 rounded-lg border-2 cursor-pointer
                ${selectedMode === 'meaning-to-kanji' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                  : 'border-slate-200 dark:border-slate-700'}
              `}>
                <input 
                  type="radio" 
                  name="studyMode" 
                  value="meaning-to-kanji" 
                  bind:group={selectedMode}
                  class="hidden" 
                />
                <span class="block w-full text-center">Meaning → Kanji</span>
              </label>
              
              <label class={`
                flex items-center p-3 rounded-lg border-2 cursor-pointer
                ${selectedMode === 'reading-to-kanji' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                  : 'border-slate-200 dark:border-slate-700'}
              `}>
                <input 
                  type="radio" 
                  name="studyMode" 
                  value="reading-to-kanji" 
                  bind:group={selectedMode}
                  class="hidden" 
                />
                <span class="block w-full text-center">Reading → Kanji</span>
              </label>
            </div>
          </div>
          
          <!-- Card limit -->
          <div>
            <label for="cardLimit" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Number of Cards ({cardLimit})
            </label>
            <input 
              type="range" 
              id="cardLimit" 
              min="5" 
              max="100" 
              step="5" 
              bind:value={cardLimit}
              class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
          
          <!-- Include options -->
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center">
              <input type="checkbox" bind:checked={includeNew} class="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500" />
              <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Include new cards</span>
            </label>
            
            <label class="flex items-center">
              <input type="checkbox" bind:checked={includeDue} class="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500" />
              <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Include due reviews</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Error display -->
      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      {/if}
      
      <!-- Start button -->
      <div class="flex justify-center">
        <button 
          on:click={startSession}
          class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-lg"
          disabled={!selectedDeckId || (!includeNew && !includeDue) || isLoading}
        >
          {#if isLoading}
            <span class="inline-block animate-spin mr-2">↻</span> Loading...
          {:else}
            Start Studying
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <!-- Study session -->
    <StudySession 
      kanjiItems={studyItems}
      studyMode={selectedMode}
      deckName={decks.find(d => d.id === selectedDeckId)?.name || 'Study Session'}
      on:complete={handleSessionComplete}
    />
  {/if}
</div> 