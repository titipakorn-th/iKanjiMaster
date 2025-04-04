<script lang="ts">
  import { onMount } from 'svelte';
  
  let apiKey = '';
  let limit = 10;
  let isLoading = false;
  let result: { 
    success?: boolean; 
    total?: number; 
    updated?: number; 
    errors?: number;
    processedKanji?: string[];
  } | null = null;
  let error = '';
  let generationLog: string[] = [];
  
  async function generateExamples() {
    if (!apiKey) {
      error = 'API key is required';
      return;
    }
    
    isLoading = true;
    error = '';
    result = null;
    generationLog = ['Starting generation process...'];
    
    try {
      const response = await fetch('/api/admin/generate-examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ limit })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate examples');
      }
      
      result = data;
      generationLog.push('Generation process completed.');
      generationLog = [...generationLog]; // Trigger UI update
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
      generationLog.push(`Error: ${error}`);
      generationLog = [...generationLog]; // Trigger UI update
    } finally {
      isLoading = false;
    }
  }
  
  // Load API key from localStorage if available
  onMount(() => {
    const savedApiKey = localStorage.getItem('adminApiKey');
    if (savedApiKey) {
      apiKey = savedApiKey;
    }
  });
  
  // Save API key to localStorage when updated
  function updateApiKey(e: Event) {
    apiKey = (e.target as HTMLInputElement).value;
    localStorage.setItem('adminApiKey', apiKey);
  }
</script>

<svelte:head>
  <title>Admin - Generate Kanji Examples | iKanjiMaster</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="flex items-center mb-8">
    <a 
      href="/admin"
      class="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      Back to Admin
    </a>
  </div>
  
  <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-8">Generate Kanji Examples</h1>
  
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
    <p class="text-slate-600 dark:text-slate-400 mb-6">
      This tool generates example sentences with furigana for kanji that don't have examples.
      The examples are generated using OpenAI and saved to the database.
    </p>
    
    <form on:submit|preventDefault class="space-y-6">
      <div>
        <label for="apiKey" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Admin API Key
        </label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          on:input={updateApiKey}
          placeholder="Enter your API key"
          class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          required
        />
      </div>
      
      <div>
        <label for="limit" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Number of Kanji to Process
        </label>
        <input
          type="number"
          id="limit"
          bind:value={limit}
          min="1"
          max="100"
          class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
        />
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Max 100 kanji at a time to avoid API rate limits.
        </p>
      </div>
      
      <div>
        <button
          type="submit"
          on:click={generateExamples}
          disabled={isLoading}
          class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Examples'}
        </button>
      </div>
    </form>
  </div>
  
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg p-4 mb-4">
      <p>{error}</p>
    </div>
  {/if}
  
  {#if result}
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Generation Results</h2>
      
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {result.total || 0}
          </div>
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Kanji Processed
          </div>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {result.updated || 0}
          </div>
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Successfully Updated
          </div>
        </div>
        
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">
            {result.errors || 0}
          </div>
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Errors
          </div>
        </div>
      </div>
      
      <div class="text-center mt-4 mb-6">
        <p class="text-slate-600 dark:text-slate-400">
          {result.updated === result.total 
            ? 'All kanji were successfully updated with examples!' 
            : `${result.updated} out of ${result.total} kanji were updated successfully.`}
        </p>
        
        {#if result.errors && result.errors > 0}
          <p class="text-red-600 dark:text-red-400 mt-2">
            There were {result.errors} errors during generation. Check server logs for details.
          </p>
        {/if}
      </div>
      
      {#if result && result.processedKanji && result.processedKanji.length > 0}
        <div class="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Processed Kanji:</h3>
          <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto">
            <div class="flex flex-wrap gap-2">
              {#each result.processedKanji as kanji}
                <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-center min-w-[2.5rem]">
                  <div class="text-xl font-bold text-slate-900 dark:text-white">{kanji}</div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
      
      <div class="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Generation Log:</h3>
        <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg h-48 overflow-y-auto font-mono text-sm">
          {#each generationLog as logEntry}
            <p class="mb-1">{logEntry}</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div> 