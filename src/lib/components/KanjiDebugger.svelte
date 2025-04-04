<script lang="ts">
  import { onMount } from 'svelte';

  // State
  let isLoading = false;
  let error = '';
  let kanjiList: { id: string; character: string; meaning: string }[] = [];
  let selectedKanjiId = '';
  let kanjiDetails: any = null;
  
  // Create sample kanji
  async function createSampleKanji() {
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/kanji/create-sample');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create sample kanji:', data);
        error = data.error || 'Failed to create sample kanji';
        return;
      }
      
      // Fetch kanji list after creating samples
      await checkKanjiDatabase();
    } catch (e) {
      console.error('Error creating sample kanji:', e);
      error = e instanceof Error ? e.message : 'Unknown error creating sample kanji';
    } finally {
      isLoading = false;
    }
  }
  
  // Check kanji database
  async function checkKanjiDatabase() {
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/kanji/test');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to check kanji database:', data);
        error = data.error || 'Failed to check kanji database';
        return;
      }
      
      kanjiList = data.kanji || [];
      console.log('Kanji database check:', data);
    } catch (e) {
      console.error('Error checking kanji database:', e);
      error = e instanceof Error ? e.message : 'Unknown error checking kanji database';
    } finally {
      isLoading = false;
    }
  }
  
  // Check individual kanji details
  async function checkKanjiDetails(kanjiId: string) {
    isLoading = true;
    error = '';
    selectedKanjiId = kanjiId;
    kanjiDetails = null;
    
    try {
      // Instead of using the debug API, just get basic kanji info
      const response = await fetch(`/api/kanji?id=${kanjiId}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to check kanji details:', data);
        error = data.error || 'Failed to check kanji details';
        return;
      }
      
      // Create a simplified result
      kanjiDetails = {
        kanji: data.data[0],
        isForeignKeyValid: {
          existsInKanjiTable: true,
          recommendation: "Add this kanji to one of your decks to use in study sessions."
        }
      };
      
      console.log('Kanji details:', data);
    } catch (e) {
      console.error('Error checking kanji details:', e);
      error = e instanceof Error ? e.message : 'Unknown error checking kanji details';
    } finally {
      isLoading = false;
    }
  }
  
  // Verify study capability
  async function verifyStudyCapability(kanjiId: string) {
    isLoading = true;
    error = '';
    
    try {
      // Create a mock review history with this kanji
      const mockReviewHistory = [
        {
          kanjiId: kanjiId,
          quality: 3, // 3 means "Good" rating
          timestamp: new Date().toISOString(),
          elapsedMs: 5000
        }
      ];
      
      // Try to record a mock study session
      const response = await fetch('/api/study/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewHistory: mockReviewHistory,
          totalTime: 10, // 10 seconds
          studyMode: 'kanji-to-meaning'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to verify study capability:', data);
        error = `Study test failed: ${data.error || 'Unknown error'}`;
        return;
      }
      
      alert(`Success! Study session saved successfully.`);
      console.log('Study capability verification:', data);
    } catch (e) {
      console.error('Error verifying study capability:', e);
      error = e instanceof Error ? e.message : 'Unknown error verifying study capability';
    } finally {
      isLoading = false;
    }
  }
  
  // Load kanji list on mount
  onMount(checkKanjiDatabase);
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
  <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Kanji Database Debugger</h2>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p class="font-medium">Error</p>
      <p>{error}</p>
    </div>
  {/if}
  
  <div class="flex flex-wrap gap-2 mb-6">
    <button
      on:click={createSampleKanji}
      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
      disabled={isLoading}
    >
      {#if isLoading}
        <span class="inline-block animate-spin mr-2">↻</span>
      {/if}
      Create Sample Kanji
    </button>
    
    <button
      on:click={checkKanjiDatabase}
      class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
      disabled={isLoading}
    >
      {#if isLoading}
        <span class="inline-block animate-spin mr-2">↻</span>
      {/if}
      Check Kanji Database
    </button>
  </div>
  
  <div class="mb-4">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Available Kanji ({kanjiList.length})</h3>
    
    {#if kanjiList.length === 0}
      <p class="text-slate-500 dark:text-slate-400">No kanji found in database. Click "Create Sample Kanji" to add some.</p>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each kanjiList as kanji}
          <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div class="flex items-center mb-2">
              <span class="text-3xl mr-3">{kanji.character}</span>
              <div>
                <p class="font-medium">{kanji.meaning}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">ID: {kanji.id}</p>
              </div>
            </div>
            
            <button
              on:click={() => verifyStudyCapability(kanji.id)}
              class="w-full mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Test Study
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if kanjiDetails}
    <div class="mb-6 p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Kanji Details for {kanjiDetails.kanji.character}
      </h3>
      
      <div class="flex flex-col md:flex-row mb-4">
        <div class="md:w-1/2 md:mr-4">
          <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-2">Kanji Information</h4>
          <div class="space-y-2 text-sm">
            <div class="flex">
              <span class="w-28 font-medium text-slate-700 dark:text-slate-300">ID:</span>
              <span class="text-slate-600 dark:text-slate-400 break-all">{kanjiDetails.kanji.id}</span>
            </div>
            <div class="flex">
              <span class="w-28 font-medium text-slate-700 dark:text-slate-300">Character:</span>
              <span class="text-4xl text-slate-600 dark:text-slate-400">{kanjiDetails.kanji.character}</span>
            </div>
            <div class="flex">
              <span class="w-28 font-medium text-slate-700 dark:text-slate-300">Meaning:</span>
              <span class="text-slate-600 dark:text-slate-400">{kanjiDetails.kanji.meaning}</span>
            </div>
            <div class="flex">
              <span class="w-28 font-medium text-slate-700 dark:text-slate-300">JLPT Level:</span>
              <span class="text-slate-600 dark:text-slate-400">{kanjiDetails.kanji.jlptLevel || 'N/A'}</span>
            </div>
            <div class="flex">
              <span class="w-28 font-medium text-slate-700 dark:text-slate-300">Stroke Count:</span>
              <span class="text-slate-600 dark:text-slate-400">{kanjiDetails.kanji.strokeCount || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div class="md:w-1/2 mt-4 md:mt-0">
          <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-2">Foreign Key Status</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-center">
              <span class="w-40 font-medium text-slate-700 dark:text-slate-300">Exists in Kanji Table:</span>
              <span class={kanjiDetails.isForeignKeyValid.existsInKanjiTable ? "text-green-500" : "text-red-500"}>
                {kanjiDetails.isForeignKeyValid.existsInKanjiTable ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div class="flex items-center">
              <span class="w-40 font-medium text-slate-700 dark:text-slate-300">Belongs to User Decks:</span>
              <span class={kanjiDetails.isForeignKeyValid.existsInUserDecks ? "text-green-500" : "text-red-500"}>
                {kanjiDetails.isForeignKeyValid.existsInUserDecks ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div class="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
              <strong>Recommendation:</strong> {kanjiDetails.isForeignKeyValid.recommendation}
            </div>
          </div>
        </div>
      </div>
      
      {#if kanjiDetails.decks && kanjiDetails.decks.length > 0}
        <div class="mt-4">
          <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-2">Included in Decks</h4>
          <ul class="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
            {#each kanjiDetails.decks as deck}
              <li>
                {deck.name} (ID: {deck.id})
              </li>
            {/each}
          </ul>
          <p class="mt-2 text-sm">
            <span class={kanjiDetails.userDecks.length > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {kanjiDetails.userDecks.length > 0 
                ? `${kanjiDetails.userDecks.length} of these decks belong to you.` 
                : "None of these decks belong to you."}
            </span>
          </p>
        </div>
      {:else}
        <div class="mt-4 p-2 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
          <p>This kanji is not included in any decks. This will cause foreign key constraints to fail when trying to save study sessions.</p>
        </div>
      {/if}
      
      <div class="mt-4 flex gap-2">
        <button
          on:click={() => verifyStudyCapability(kanjiDetails.kanji.id)}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          disabled={isLoading || !kanjiDetails.isForeignKeyValid.existsInUserDecks}
        >
          Test Study API
        </button>
      </div>
    </div>
  {/if}
</div> 