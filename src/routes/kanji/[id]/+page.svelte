<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  
  export let data: PageData;
  
  // Extract kanji data
  const { kanji } = data;
  
  // State for the flashcard
  let flipped = false;
  
  // Toggle the card flip
  function toggleFlip() {
    flipped = !flipped;
  }
  
  // Helper function to apply furigana to specific kanji in a sentence
  function applyFurigana(sentence: string, furiganaMap: Record<string, string> = {}) {
    if (!sentence || Object.keys(furiganaMap).length === 0) return sentence;
    
    // Convert the sentence to an array of characters
    const characters = Array.from(sentence);
    
    // Create HTML with ruby tags only for kanji with readings
    let html = '';
    let skipCount = 0;
    
    for (let i = 0; i < characters.length; i++) {
      if (skipCount > 0) {
        skipCount--;
        continue;
      }
      
      const char = characters[i];
      
      // Check if this character is a kanji with a reading
      if (furiganaMap[char]) {
        html += `<ruby>${char}<rt>${furiganaMap[char]}</rt></ruby>`;
      } else {
        // Check if this character is part of a multi-character key in the furigana map
        let foundMultiChar = false;
        for (let j = 2; j <= 3 && i + j - 1 < characters.length; j++) {
          const potentialKey = characters.slice(i, i + j).join('');
          if (furiganaMap[potentialKey]) {
            html += `<ruby>${potentialKey}<rt>${furiganaMap[potentialKey]}</rt></ruby>`;
            skipCount = j - 1; // Skip the next j-1 characters as they're part of this multi-character key
            foundMultiChar = true;
            break;
          }
        }
        
        if (!foundMultiChar) {
          html += char;
        }
      }
    }
    
    return html;
  }
</script>

<svelte:head>
  <title>{kanji.character} - {kanji.meaning} | iKanjiMaster</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center mb-8">
    <a 
      href="/browse" 
      class="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      Back to Browse
    </a>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Left column: Kanji details -->
    <div class="md:col-span-2">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-col md:flex-row items-center mb-4">
            <div class="text-8xl font-bold mb-4 md:mb-0 md:mr-6 kanjiCharacter">
              {kanji.character}
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-800 dark:text-white">{kanji.meaning}</h1>
              <div class="flex flex-wrap mt-2 space-x-2">
                {#if kanji.jlptLevel}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    JLPT N{kanji.jlptLevel}
                  </span>
                {/if}
                {#if kanji.jouyouGrade}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Grade {kanji.jouyouGrade}
                  </span>
                {/if}
                {#if kanji.strokeCount}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {kanji.strokeCount} strokes
                  </span>
                {/if}
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Readings -->
            <div>
              <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-3">Readings</h2>
              <div class="space-y-4">
                {#if kanji.onyomi}
                  <div>
                    <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      音読み (Onyomi) - Chinese Reading
                    </span>
                    <span class="mt-1 text-gray-900 dark:text-gray-200 kanjiFont">{kanji.onyomi}</span>
                  </div>
                {/if}
                
                {#if kanji.kunyomi}
                  <div>
                    <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      訓読み (Kunyomi) - Japanese Reading
                    </span>
                    <span class="mt-1 text-gray-900 dark:text-gray-200 kanjiFont">{kanji.kunyomi}</span>
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Components/Radicals -->
            <div>
              <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-3">Components</h2>
              {#if kanji.radicals}
                <div class="mb-4">
                  <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Radicals
                  </span>
                  <span class="mt-1 text-gray-900 dark:text-gray-200">{kanji.radicals}</span>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Examples section -->
          {#if kanji.examples && kanji.examples.length > 0}
            <div class="mt-8">
              <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-3">Example Words</h2>
              <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <ul class="divide-y divide-gray-200 dark:divide-gray-600">
                  {#each kanji.examples as example}
                    <li class="py-3 first:pt-0 last:pb-0">
                      <!-- Word with reading and meaning -->
                      <div class="relative">
                        <div class="font-bold text-gray-900 dark:text-gray-100 kanjiFont text-lg">
                          {example.word}
                        </div>
                        {#if example.howToRead}
                          <div class="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                            {example.howToRead}
                          </div>
                        {/if}
                        <div class="mt-1 text-gray-700 dark:text-gray-300">
                          {example.meaning || ''}
                        </div>
                      </div>
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {/if}
          
          <!-- Sentence Examples section -->
          {#if kanji.sentence_examples && kanji.sentence_examples.length > 0}
            <div class="mt-8">
              <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-3">Example Sentences</h2>
              <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <ul class="divide-y divide-gray-200 dark:divide-gray-600">
                  {#each kanji.sentence_examples as example}
                    <li class="py-3 first:pt-0 last:pb-0">
                      <!-- Word with reading and meaning -->
                      <div class="relative">
                        <div class="font-bold text-gray-900 dark:text-gray-100 kanjiFont text-lg">
                          {example.word}
                        </div>
                        {#if example.howToRead}
                          <div class="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                            {example.howToRead}
                          </div>
                        {/if}
                        <div class="mt-1 text-gray-700 dark:text-gray-300">
                          {example.meaning || ''}
                        </div>
                      </div>
                      
                      <!-- Example sentence with furigana -->
                      {#if example.sentence}
                        <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div class="font-medium text-gray-900 dark:text-gray-100 kanjiFont mb-2">
                            {#if example.furigana && Object.keys(example.furigana).length > 0}
                              {@html applyFurigana(example.sentence, example.furigana)}
                            {:else}
                              {example.sentence}
                            {/if}
                          </div>
                          {#if example.sentenceReading}
                            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {example.sentenceReading}
                            </div>
                          {/if}
                          {#if example.sentenceMeaning}
                            <div class="text-sm text-gray-700 dark:text-gray-300 italic">
                              {example.sentenceMeaning}
                            </div>
                          {/if}
                        </div>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Right column: Flashcard and study options -->
    <div>
      <!-- Flashcard -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div class="p-4 bg-indigo-50 dark:bg-indigo-900 border-b border-indigo-100 dark:border-indigo-800">
          <h2 class="font-medium text-indigo-800 dark:text-indigo-200">Study Flashcard</h2>
        </div>
        
        <button 
          class="relative h-60 p-4 w-full text-left bg-transparent border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 rounded-md" 
          on:click={toggleFlip}
          on:keydown={(e) => e.key === 'Enter' && toggleFlip()}
          aria-label="Flip flashcard"
        >
          <div class={`w-full h-full ${flipped ? 'rotate-y-180' : ''} transition-transform duration-500 transform-style-preserve-3d`}>
            <!-- Front of card (Kanji) -->
            <div class={`absolute inset-0 backface-hidden flex flex-col items-center justify-center ${flipped ? 'invisible' : 'visible'}`}>
              <div class="text-8xl font-bold mb-4 kanjiCharacter">
                {kanji.character}
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Click to reveal meaning
              </p>
            </div>
            
            <!-- Back of card (Meaning) -->
            <div class={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center ${flipped ? 'visible' : 'invisible'}`}>
              <div class="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">
                {kanji.meaning}
              </div>
              
              {#if kanji.onyomi || kanji.kunyomi}
                <div class="text-center">
                  {#if kanji.onyomi}
                    <p class="text-sm text-gray-600 dark:text-gray-400 kanjiFont">
                      <span class="font-medium">音:</span> {kanji.onyomi}
                    </p>
                  {/if}
                  
                  {#if kanji.kunyomi}
                    <p class="text-sm text-gray-600 dark:text-gray-400 kanjiFont">
                      <span class="font-medium">訓:</span> {kanji.kunyomi}
                    </p>
                  {/if}
                </div>
              {/if}
              
              <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Click to see kanji
              </p>
            </div>
          </div>
        </button>
      </div>
      
      <!-- Study options -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div class="p-4 bg-green-50 dark:bg-green-900 border-b border-green-100 dark:border-green-800">
          <h2 class="font-medium text-green-800 dark:text-green-200">Study Options</h2>
        </div>
        
        <div class="p-4 space-y-3">
          <a 
            href={`/study?kanjiId=${kanji.id}`}
            class="block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded-md transition-colors"
          >
            Study Now
          </a>
          
          <a 
            href={`/decks/add?kanji=${kanji.id}`}
            class="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-center rounded-md transition-colors"
          >
            Add to Deck
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .kanjiCharacter, .kanjiFont {
    font-family: "Noto Sans JP", sans-serif;
  }

  /* CSS for 3D card flip effect */
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }

  .backface-hidden {
    backface-visibility: hidden;
  }

  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  
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