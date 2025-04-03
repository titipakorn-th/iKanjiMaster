<script lang="ts">
  import { onMount } from 'svelte';
  import StudySession from '$lib/components/StudySession.svelte';
  
  // Study session state
  let sessionStarted = false;
  let selectedMode: 'kanji-to-meaning' | 'meaning-to-kanji' | 'reading-to-kanji' = 'kanji-to-meaning';
  let selectedDeckId = '';
  let cardLimit = 20;
  let includeNew = true;
  let includeDue = true;
  
  // Decks data (in a real app, this would come from the database)
  const decks = [
    { id: 'jlpt-n5', name: 'JLPT N5 Kanji', description: 'Basic kanji for JLPT N5', count: 100 },
    { id: 'jlpt-n4', name: 'JLPT N4 Kanji', description: 'Basic kanji for JLPT N4', count: 150 },
    { id: 'elements', name: 'Elements', description: 'Kanji for natural elements', count: 25 },
    { id: 'numbers', name: 'Numbers', description: 'Kanji for numbers', count: 20 },
    { id: 'animals', name: 'Animals', description: 'Kanji for common animals', count: 35 }
  ];
  
  // Sample kanji data for the study session (in a real app, this would come from the database)
  const studyItems = [
    {
      id: 'k1',
      character: '水',
      onyomi: 'スイ',
      kunyomi: 'みず',
      meaning: 'water',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '水曜日', reading: 'すいようび', meaning: 'Wednesday' },
        { word: '水泳', reading: 'すいえい', meaning: 'swimming' },
        { word: '冷水', reading: 'れいすい', meaning: 'cold water' }
      ]
    },
    {
      id: 'k2',
      character: '火',
      onyomi: 'カ',
      kunyomi: 'ひ',
      meaning: 'fire',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '火曜日', reading: 'かようび', meaning: 'Tuesday' },
        { word: '火山', reading: 'かざん', meaning: 'volcano' },
        { word: '花火', reading: 'はなび', meaning: 'fireworks' }
      ]
    },
    {
      id: 'k3',
      character: '木',
      onyomi: 'モク, ボク',
      kunyomi: 'き',
      meaning: 'tree, wood',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '木曜日', reading: 'もくようび', meaning: 'Thursday' },
        { word: '木材', reading: 'もくざい', meaning: 'lumber, timber' },
        { word: '木々', reading: 'きぎ', meaning: 'trees' }
      ]
    },
    {
      id: 'k4',
      character: '金',
      onyomi: 'キン, コン',
      kunyomi: 'かね, かな-',
      meaning: 'gold, money',
      jlptLevel: 5,
      strokeCount: 8,
      examples: [
        { word: '金曜日', reading: 'きんようび', meaning: 'Friday' },
        { word: 'お金', reading: 'おかね', meaning: 'money' },
        { word: '金庫', reading: 'きんこ', meaning: 'safe, vault' }
      ]
    },
    {
      id: 'k5',
      character: '土',
      onyomi: 'ド, ト',
      kunyomi: 'つち',
      meaning: 'earth, soil',
      jlptLevel: 5,
      strokeCount: 3,
      examples: [
        { word: '土曜日', reading: 'どようび', meaning: 'Saturday' },
        { word: '土地', reading: 'とち', meaning: 'land, plot' },
        { word: '土産', reading: 'みやげ', meaning: 'souvenir' }
      ]
    }
  ];
  
  // Start study session
  function startSession() {
    sessionStarted = true;
  }
  
  // Handle study session completion
  function handleSessionComplete(event: CustomEvent<{ reviewHistory: Record<string, number>, totalTime: number }>) {
    console.log('Session completed', event.detail);
    // In a real app, this would save the results to the database
    sessionStarted = false;
  }
  
  // Select a deck
  function selectDeck(deckId: string) {
    selectedDeckId = deckId;
  }
  
  // Auto-select the first deck on mount
  onMount(() => {
    if (decks.length > 0) {
      selectedDeckId = decks[0].id;
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
      
      <!-- Start button -->
      <div class="flex justify-center">
        <button 
          on:click={startSession}
          class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-lg"
          disabled={!selectedDeckId || (!includeNew && !includeDue)}
        >
          Start Studying
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