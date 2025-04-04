<script lang="ts">
  import { onMount } from 'svelte';
  
  let apiKey = '';
  let isLoading = false;
  let result: { 
    success?: boolean; 
    message?: string;
  } | null = null;
  let error = '';
  
  async function resetExamples() {
    if (!apiKey) {
      error = 'API key is required';
      return;
    }
    
    if (!confirm('Warning: This will reset ALL kanji examples in the database. This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }
    
    isLoading = true;
    error = '';
    result = null;
    
    try {
      const response = await fetch('/api/admin/reset-examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset examples');
      }
      
      result = data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
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
  <title>Admin - Reset Kanji Examples | iKanjiMaster</title>
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
  
  <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-8">Reset Kanji Examples</h1>
  
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
    <div class="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 mb-6">
      <p class="font-bold">Warning!</p>
      <p>This will reset ALL example data for ALL kanji in the database. After resetting, you'll need to regenerate examples using the 'Generate Examples' tool.</p>
    </div>
    
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
        <button
          type="submit"
          on:click={resetExamples}
          disabled={isLoading}
          class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Resetting...' : 'Reset All Examples'}
        </button>
        
        <a 
          href="/admin/generate-examples"
          class="ml-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors inline-block"
        >
          Generate Examples
        </a>
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
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Result</h2>
      
      {#if result.success}
        <div class="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg p-4 mb-4">
          <p>{result.message}</p>
        </div>
        
        <p class="text-slate-600 dark:text-slate-400 mt-4">
          All kanji examples have been reset. You can now go to the 
          <a href="/admin/generate-examples" class="text-indigo-600 dark:text-indigo-400 hover:underline">Generate Examples</a> 
          page to regenerate them.
        </p>
      {:else}
        <div class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg p-4 mb-4">
          <p>An error occurred during the reset process.</p>
        </div>
      {/if}
    </div>
  {/if}
</div> 