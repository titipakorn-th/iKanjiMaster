<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import KanjiCard from './KanjiCard.svelte';
  
  // Types
  type KanjiItem = {
    id: string;
    character: string;
    onyomi: string | null;
    kunyomi: string | null;
    meaning: string;
    jlptLevel: number | null;
    strokeCount: number | null;
    examples: { word: string; reading: string; meaning: string }[];
  };
  
  type StudyMode = 'kanji-to-meaning' | 'meaning-to-kanji' | 'reading-to-kanji';
  
  // Props
  export let kanjiItems: KanjiItem[] = [];
  export let studyMode: StudyMode = 'kanji-to-meaning';
  export let deckName: string = 'Study Session';
  
  // State
  let currentIndex = 0;
  let flipped = false;
  let studyComplete = false;
  let reviewHistory: Record<string, number> = {};
  let showAnswer = false;
  
  // Timer
  let startTime = Date.now();
  let elapsedTime = 0;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    complete: { 
      reviewHistory: Record<string, number>,
      totalTime: number
    }
  }>();
  
  // Computed properties
  $: currentKanji = kanjiItems[currentIndex] || null;
  $: progress = currentIndex + 1;
  $: totalItems = kanjiItems.length;
  $: progressPercentage = totalItems > 0 ? (progress / totalItems) * 100 : 0;
  
  // Handle rating the current kanji
  function rateKanji(rating: number) {
    if (!currentKanji) return;
    
    // Record the rating
    reviewHistory[currentKanji.id] = rating;
    
    // Move to the next card
    if (currentIndex < kanjiItems.length - 1) {
      currentIndex++;
      flipped = false;
      showAnswer = false;
    } else {
      completeStudySession();
    }
  }
  
  // Complete the study session
  function completeStudySession() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    studyComplete = true;
    
    // Dispatch complete event with results
    dispatch('complete', {
      reviewHistory,
      totalTime: elapsedTime
    });
  }
  
  // Start the timer
  function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
  }
  
  // Format seconds into MM:SS
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Initialize timer on component creation
  startTimer();
</script>

<div class="w-full max-w-4xl mx-auto">
  {#if studyComplete}
    <!-- Study complete screen -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
      <div class="mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Study Session Complete!</h2>
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        You've reviewed {totalItems} kanji in {formatTime(elapsedTime)}.
      </p>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto mb-8">
        <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
          <div class="text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Cards Reviewed</div>
        </div>
        
        <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
          <div class="text-2xl font-bold text-slate-900 dark:text-white">{formatTime(elapsedTime)}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Time</div>
        </div>
        
        <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
          <div class="text-2xl font-bold text-slate-900 dark:text-white">
            {Math.round(totalItems / (elapsedTime / 60))}
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Cards Per Minute</div>
        </div>
      </div>
      
      <div class="flex justify-center space-x-4">
        <a href="/stats" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          View Stats
        </a>
        <a href="/study" class="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors">
          New Session
        </a>
      </div>
    </div>
  {:else}
    <!-- Study session in progress -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{deckName}</h1>
        <div class="text-slate-600 dark:text-slate-400">
          Time: {formatTime(elapsedTime)}
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-4">
        <div class="text-sm text-slate-600 dark:text-slate-400">
          Card {progress} of {totalItems}
        </div>
        <div class="text-sm text-slate-600 dark:text-slate-400">
          Study mode: {studyMode === 'kanji-to-meaning' ? 'Kanji → Meaning' : 
                      studyMode === 'meaning-to-kanji' ? 'Meaning → Kanji' : 'Reading → Kanji'}
        </div>
      </div>
      
      <!-- Progress bar -->
      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6">
        <div 
          class="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
          style="width: {progressPercentage}%"
        ></div>
      </div>
    </div>
    
    {#if currentKanji}
      <!-- Kanji Card -->
      <KanjiCard 
        character={currentKanji.character}
        onyomi={currentKanji.onyomi}
        kunyomi={currentKanji.kunyomi}
        meaning={currentKanji.meaning}
        jlptLevel={currentKanji.jlptLevel}
        strokeCount={currentKanji.strokeCount}
        examples={currentKanji.examples}
        bind:flipped={flipped}
      />
      
      <!-- Show/Hide Answer Button -->
      <div class="flex justify-center mt-6 mb-4">
        <button 
          class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          on:click={() => showAnswer = !showAnswer}
        >
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </button>
      </div>
      
      <!-- Rating Buttons (only visible when answer is shown) -->
      {#if showAnswer}
        <div class="mt-4">
          <h3 class="text-center text-slate-700 dark:text-slate-300 mb-3">How well did you know this kanji?</h3>
          <div class="flex justify-center space-x-2">
            <button 
              class="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              on:click={() => rateKanji(1)}
            >
              Again
            </button>
            <button 
              class="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              on:click={() => rateKanji(2)}
            >
              Hard
            </button>
            <button 
              class="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              on:click={() => rateKanji(3)}
            >
              Good
            </button>
            <button 
              class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              on:click={() => rateKanji(4)}
            >
              Easy
            </button>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div> 