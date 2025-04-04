<script lang="ts">
  import { onMount } from 'svelte';
  
  let apiKey = '';
  
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
  <title>Admin Dashboard | iKanjiMaster</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="flex items-center mb-8">
    <a 
      href="/"
      class="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      Back to Dashboard
    </a>
  </div>
  
  <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-8">Admin Dashboard</h1>
  
  <!-- Admin API Key Section -->
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Admin API Key</h2>
    <p class="text-slate-600 dark:text-slate-400 mb-6">
      Enter your admin API key to access administrative functions.
    </p>
    
    <div class="mb-6">
      <label for="apiKey" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        API Key
      </label>
      <input
        type="password"
        id="apiKey"
        value={apiKey}
        on:input={updateApiKey}
        placeholder="Enter your admin API key"
        class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
      />
    </div>
  </div>
  
  <!-- Admin Tools -->
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Kanji Example Management</h2>
    <p class="text-slate-600 dark:text-slate-400 mb-6">
      Tools for managing kanji examples in the database.
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Generate Examples Card -->
      <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
        <div class="flex items-center mb-4">
          <div class="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white">Generate Examples</h3>
        </div>
        <p class="text-slate-600 dark:text-slate-400 mb-6">
          Generate example sentences with furigana for kanji that don't have examples using OpenAI.
        </p>
        <a 
          href="/admin/generate-examples"
          class="block w-full py-2 px-4 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Go to Generator
        </a>
      </div>
      
      <!-- Reset Examples Card -->
      <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
        <div class="flex items-center mb-4">
          <div class="bg-red-100 dark:bg-red-900 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white">Reset Examples</h3>
        </div>
        <p class="text-slate-600 dark:text-slate-400 mb-6">
          Reset all kanji examples in the database to allow fresh generation with updated prompts.
        </p>
        <a 
          href="/admin/reset-examples"
          class="block w-full py-2 px-4 text-center bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Go to Reset Tool
        </a>
      </div>
    </div>
  </div>
</div> 