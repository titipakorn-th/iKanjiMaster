<script lang="ts">
  // Kanji information props
  export let character: string;
  export let onyomi: string | null = null;
  export let kunyomi: string | null = null;
  export let meaning: string;
  export let jlptLevel: number | null = null;
  export let strokeCount: number | null = null;
  export let examples: { word: string; reading: string; meaning: string }[] = [];
  
  // Component state
  export let flipped = false;
  export let showHint = false;
  
  // Toggle the card flip state
  function toggleFlip() {
    flipped = !flipped;
  }
  
  // Toggle hint without flipping the card
  function toggleHint(event: MouseEvent) {
    event.stopPropagation();
    showHint = !showHint;
  }
</script>

<div 
  class="relative w-full max-w-lg mx-auto h-96 perspective-1000 cursor-pointer"
  on:click={toggleFlip} 
  role="button"
  tabindex="0"
  aria-label="Flip kanji card"
>
  <div class={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
    <!-- Front of card -->
    <div class="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center backface-hidden border border-slate-200 dark:border-slate-700">
      <!-- Kanji character -->
      <div class="mb-8 relative">
        <span class="text-8xl font-bold text-slate-900 dark:text-white font-japanese">{character}</span>
        
        {#if showHint}
          <div class="mt-4 text-center">
            {#if onyomi}
              <p class="text-sm text-slate-500 dark:text-slate-400">
                <span class="font-semibold">音読み:</span> {onyomi}
              </p>
            {/if}
            {#if kunyomi}
              <p class="text-sm text-slate-500 dark:text-slate-400">
                <span class="font-semibold">訓読み:</span> {kunyomi}
              </p>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- JLPT level and stroke count -->
      <div class="flex items-center space-x-4 mb-4">
        {#if jlptLevel}
          <div class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-xs font-semibold">
            JLPT N{jlptLevel}
          </div>
        {/if}
        
        {#if strokeCount}
          <div class="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
            {strokeCount} strokes
          </div>
        {/if}
      </div>
      
      <!-- Hint button -->
      <button 
        class="absolute bottom-6 right-6 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 p-2 rounded-full transition-colors"
        on:click={toggleHint}
        aria-label={showHint ? "Hide hint" : "Show hint"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <div class="absolute bottom-6 left-6 text-xs text-slate-400 dark:text-slate-500">
        Click to flip
      </div>
    </div>
    
    <!-- Back of card -->
    <div class="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 backface-hidden rotate-y-180 border border-slate-200 dark:border-slate-700 overflow-auto">
      <div class="flex flex-col h-full">
        <!-- Kanji character and meaning -->
        <div class="text-center mb-6">
          <span class="text-5xl font-bold text-slate-900 dark:text-white font-japanese">{character}</span>
          <h2 class="text-xl font-semibold mt-2 text-slate-800 dark:text-slate-200">{meaning}</h2>
        </div>
        
        <!-- Readings -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Readings</h3>
          <div class="grid grid-cols-2 gap-2">
            {#if onyomi}
              <div>
                <span class="text-xs text-slate-500 dark:text-slate-500">On'yomi</span>
                <p class="text-sm font-medium">{onyomi}</p>
              </div>
            {/if}
            
            {#if kunyomi}
              <div>
                <span class="text-xs text-slate-500 dark:text-slate-500">Kun'yomi</span>
                <p class="text-sm font-medium">{kunyomi}</p>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Example words -->
        {#if examples.length > 0}
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Examples</h3>
            <ul class="space-y-2">
              {#each examples.slice(0, 3) as example}
                <li class="border-b border-slate-100 dark:border-slate-700 pb-2">
                  <div class="flex justify-between">
                    <span class="font-medium font-japanese">{example.word}</span>
                    <span class="text-sm text-slate-500 dark:text-slate-400">{example.reading}</span>
                  </div>
                  <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">{example.meaning}</p>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
      
      <div class="absolute bottom-6 left-6 text-xs text-slate-400 dark:text-slate-500">
        Click to flip back
      </div>
    </div>
  </div>
</div>

<style>
  /* Apply perspective to create 3D effect */
  .perspective-1000 {
    perspective: 1000px;
  }
  
  /* Preserve 3D for child elements */
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  
  /* Hide the back face of elements */
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  /* Rotation for Y axis */
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  
  /* Font for Japanese characters */
  .font-japanese {
    font-family: "Noto Sans JP", "Hiragino Sans", "Meiryo", sans-serif;
  }
</style> 