<script lang="ts">
  // Component to display a kanji card
  export let kanji: {
    id: string;
    character: string;
    meaning: string;
    onyomi?: string | null;
    kunyomi?: string | null;
    jlptLevel?: number | null;
    strokeCount?: number | null;
    examples?: Array<{
      word: string;
      reading: string;
      meaning: string;
      sentence?: string;
      sentenceReading?: string;
      sentenceMeaning?: string;
      howToRead?: string;
      furigana?: { [key: string]: string };
    }> | null;
  };
  
  export let showDetails = false;
  
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
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
  <div class="px-6 py-4 flex flex-col items-center border-b border-gray-200 dark:border-gray-700">
    <div class="text-7xl font-bold mb-2 kanjiCharacter">
      {kanji.character}
    </div>
    <h3 class="text-xl mb-2 font-medium text-center text-gray-700 dark:text-gray-300">
      {kanji.meaning}
    </h3>
  </div>
  
  {#if showDetails}
    <div class="px-6 py-4">
      <div class="grid grid-cols-2 gap-4 mb-4">
        {#if kanji.onyomi}
          <div>
            <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">音読み (Onyomi)</span>
            <span class="mt-1 text-sm text-gray-900 dark:text-gray-200">{kanji.onyomi}</span>
          </div>
        {/if}
        
        {#if kanji.kunyomi}
          <div>
            <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">訓読み (Kunyomi)</span>
            <span class="mt-1 text-sm text-gray-900 dark:text-gray-200">{kanji.kunyomi}</span>
          </div>
        {/if}
        
        {#if kanji.jlptLevel}
          <div>
            <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">JLPT Level</span>
            <span class="mt-1 text-sm text-gray-900 dark:text-gray-200">N{kanji.jlptLevel}</span>
          </div>
        {/if}
        
        {#if kanji.strokeCount}
          <div>
            <span class="block text-sm font-medium text-gray-600 dark:text-gray-400">Stroke Count</span>
            <span class="mt-1 text-sm text-gray-900 dark:text-gray-200">{kanji.strokeCount}</span>
          </div>
        {/if}
      </div>
      
      {#if kanji.examples && kanji.examples.length > 0}
        <div class="mt-4">
          <h4 class="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Examples</h4>
          <ul class="space-y-4">
            {#each kanji.examples.slice(0, 3) as example}
              <li class="text-sm border-l-2 border-indigo-200 dark:border-indigo-900 pl-3 py-1">
                <!-- Word with furigana -->
                <div class="mb-1">
                  <span class="font-bold text-gray-900 dark:text-gray-200 text-lg">{example.word}</span>
                  {#if example.howToRead}
                    <div class="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                      {example.howToRead}
                    </div>
                  {:else if example.reading}
                    <div class="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                      {example.reading}
                    </div>
                  {/if}
                  <div class="text-gray-700 dark:text-gray-300">{example.meaning}</div>
                </div>
                
                <!-- Example sentence with furigana -->
                {#if example.sentence}
                  <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div class="font-medium text-gray-900 dark:text-gray-200">
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
      {/if}
    </div>
  {/if}
  
  <div class="px-6 py-2 mt-auto bg-gray-50 dark:bg-slate-700">
    <div class="flex justify-between">
      <button 
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        on:click={() => (showDetails = !showDetails)}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
      <slot name="actions"></slot>
    </div>
  </div>
</div>

<style>
  .kanjiCharacter {
    line-height: 1.2;
    font-family: "Noto Sans JP", sans-serif;
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