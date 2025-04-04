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
    examples: { 
      word: string; 
      reading: string; 
      howToRead?: string;
      meaning: string;
      sentence?: string;
      sentenceReading?: string;
      sentenceMeaning?: string;
      furigana?: Record<string, string>;
    }[] | null;
    sentence_examples?: { 
      word: string; 
      reading: string; 
      howToRead?: string;
      meaning: string;
      sentence?: string;
      sentenceReading?: string;
      sentenceMeaning?: string;
      furigana?: Record<string, string>;
    }[] | null;
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
  
  // Helper to combine examples and sentence_examples if needed
  $: combinedExamples = currentKanji ? (
    currentKanji.examples || []
  ).concat(
    (currentKanji.sentence_examples || []).filter(se => 
      !currentKanji.examples?.some(e => e.word === se.word)
    )
  ) : [];
  
  // Helper to check if we have sentences
  $: hasSentences = currentKanji ? (
    (currentKanji.examples || []).some(e => e.sentence) || 
    (currentKanji.sentence_examples || []).some(e => e.sentence)
  ) : false;
  
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
  
  // Helper function to apply furigana to specific kanji in a sentence
  function applyFurigana(sentence: string, furiganaMap: Record<string, string> = {}) {
    if (!sentence || Object.keys(furiganaMap).length === 0) return sentence;
    
    // Convert the sentence to an array of characters
    const characters = Array.from(sentence);
    
    // Create HTML with ruby tags only for kanji with readings
    let html = '';
    
    for (const char of characters) {
      if (furiganaMap[char]) {
        html += `<ruby>${char}<rt>${furiganaMap[char]}</rt></ruby>`;
      } else {
        html += char;
      }
    }
    
    return html;
  }
  
  // Create a test sentence with furigana for debugging
  const testSentence = applyFurigana("漢字の例", {"漢": "かん", "字": "じ"});
  
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
            {Math.round(totalItems / (elapsedTime / 60)) || 0}
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
      <!-- Study card based on mode -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mb-4">
        <div class="p-6 text-center">
          {#if !showAnswer}
            <!-- Question side -->
            {#if studyMode === 'kanji-to-meaning'}
              <div class="text-9xl mb-6 font-bold">
                {currentKanji.character}
              </div>
              {#if combinedExamples.length > 0}
                <p class="text-sm text-indigo-600 dark:text-indigo-400">
                  Flip to see {combinedExamples.length} example{combinedExamples.length !== 1 ? 's' : ''}
                  {hasSentences ? ' with sentences' : ''}
                </p>
              {/if}
            {:else if studyMode === 'meaning-to-kanji'}
              <div class="text-4xl mb-6 font-bold">
                {currentKanji.meaning}
              </div>
              {#if combinedExamples.length > 0}
                <p class="text-sm text-indigo-600 dark:text-indigo-400">
                  Flip to see {combinedExamples.length} example{combinedExamples.length !== 1 ? 's' : ''}
                  {hasSentences ? ' with sentences' : ''}
                </p>
              {/if}
            {:else if studyMode === 'reading-to-kanji'}
              <div class="text-4xl mb-6 font-bold">
                {currentKanji.onyomi || ''} / {currentKanji.kunyomi || ''}
              </div>
              {#if combinedExamples.length > 0}
                <p class="text-sm text-indigo-600 dark:text-indigo-400">
                  Flip to see {combinedExamples.length} example{combinedExamples.length !== 1 ? 's' : ''}
                  {hasSentences ? ' with sentences' : ''}
                </p>
              {/if}
            {/if}
          {:else}
            <!-- Answer side -->
            <div class="space-y-6">
              <div class="text-6xl mb-2 font-bold">
                {currentKanji.character}
              </div>
              
              <div class="text-2xl font-medium">
                {currentKanji.meaning}
              </div>
              
              {#if currentKanji.onyomi || currentKanji.kunyomi}
                <div class="flex justify-center space-x-8">
                  {#if currentKanji.onyomi}
                    <div>
                      <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">音読み (Onyomi)</span>
                      <span class="text-lg">{currentKanji.onyomi}</span>
                    </div>
                  {/if}
                  
                  {#if currentKanji.kunyomi}
                    <div>
                      <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">訓読み (Kunyomi)</span>
                      <span class="text-lg">{currentKanji.kunyomi}</span>
                    </div>
                  {/if}
                </div>
              {/if}
              
              <!-- Test furigana usage -->
              <div class="hidden">
                {@html testSentence}
              </div>
              
              {#if combinedExamples.length > 0}
                <div class="mt-4 text-left max-w-lg mx-auto">
                  <h4 class="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Example Words</h4>
                  <ul class="space-y-2">
                    {#each combinedExamples.filter(e => e.word).slice(0, 2) as example}
                      <li class="text-sm bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded">
                        <span class="font-bold">{example.word}</span>
                        {#if example.howToRead}
                          <span class="text-gray-500 dark:text-gray-400">「{example.howToRead}」</span>
                        {:else if example.reading}
                          <span class="text-gray-500 dark:text-gray-400">「{example.reading}」</span>
                        {/if}
                        <span class="block">{example.meaning}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
              
              {#if hasSentences}
                <div class="mt-3 text-left max-w-lg mx-auto">
                  <h4 class="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Example Sentences</h4>
                  <ul class="space-y-3">
                    {#each combinedExamples.filter(e => e.sentence).slice(0, 2) as example}
                      <li class="text-sm bg-green-50 dark:bg-green-900/30 p-3 rounded">
                        <div class="font-medium">
                          {#if example.furigana && Object.keys(example.furigana).length > 0}
                            {@html applyFurigana(example.sentence || '', example.furigana)}
                          {:else}
                            {example.sentence}
                          {/if}
                        </div>
                        {#if example.sentenceReading}
                          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {example.sentenceReading}
                          </div>
                        {/if}
                        {#if example.sentenceMeaning}
                          <div class="text-sm text-gray-700 dark:text-gray-300 italic mt-1 border-t border-gray-200 dark:border-gray-700 pt-1">
                            {example.sentenceMeaning}
                          </div>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      
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

<style>
  /* Furigana styling */
  ruby {
    display: inline-flex;
    flex-direction: column-reverse;
    line-height: 1.4;
    text-align: center;
  }
  
  rt {
    font-size: 0.6em;
    color: #6b7280;
    line-height: 1.2;
    text-align: center;
    margin-bottom: -0.2em;
  }
</style> 