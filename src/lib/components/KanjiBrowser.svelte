<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Types
  type KanjiItem = {
    id: string;
    character: string;
    meaning: string;
    jlptLevel: number | null;
    strokeCount: number | null;
  };
  
  type FilterOptions = {
    jlptLevel: number | null;
    minStrokes: number | null;
    maxStrokes: number | null;
    searchQuery: string;
  };
  
  // Props
  export let kanjiItems: KanjiItem[] = [];
  export let selectedKanjiIds: string[] = [];
  export let showSelection = true;
  
  // Local state
  let filters: FilterOptions = {
    jlptLevel: null,
    minStrokes: null,
    maxStrokes: null,
    searchQuery: '',
  };
  
  let page = 1;
  let itemsPerPage = 48; // 6x8 grid
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    select: { id: string; selected: boolean };
    view: { id: string };
  }>();
  
  // Apply filters to kanji items
  $: filteredItems = kanjiItems.filter((item) => {
    // JLPT level filter
    if (filters.jlptLevel !== null && item.jlptLevel !== filters.jlptLevel) {
      return false;
    }
    
    // Stroke count filter
    if (
      (filters.minStrokes !== null && item.strokeCount !== null && item.strokeCount < filters.minStrokes) ||
      (filters.maxStrokes !== null && item.strokeCount !== null && item.strokeCount > filters.maxStrokes)
    ) {
      return false;
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        item.character.includes(filters.searchQuery) ||
        item.meaning.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Pagination
  $: totalItems = filteredItems.length;
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: currentPageItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  // Handle pagination
  function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
    }
  }
  
  // Toggle selection of a kanji
  function toggleSelection(id: string) {
    const isSelected = selectedKanjiIds.includes(id);
    const newSelection = isSelected
      ? selectedKanjiIds.filter(itemId => itemId !== id)
      : [...selectedKanjiIds, id];
    
    selectedKanjiIds = newSelection;
    dispatch('select', { id, selected: !isSelected });
  }
  
  // View kanji details
  function viewKanji(id: string) {
    dispatch('view', { id });
  }
  
  // Clear filters
  function clearFilters() {
    filters = {
      jlptLevel: null,
      minStrokes: null,
      maxStrokes: null,
      searchQuery: '',
    };
    page = 1;
  }
</script>

<div class="w-full">
  <!-- Filters -->
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Filter Kanji</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Search -->
      <div class="col-span-1 md:col-span-2">
        <label for="search" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Search
        </label>
        <input
          type="text"
          id="search"
          bind:value={filters.searchQuery}
          placeholder="Search by kanji or meaning"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      <!-- JLPT Level -->
      <div>
        <label for="jlpt" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          JLPT Level
        </label>
        <select
          id="jlpt"
          bind:value={filters.jlptLevel}
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={null}>All Levels</option>
          <option value={1}>N1</option>
          <option value={2}>N2</option>
          <option value={3}>N3</option>
          <option value={4}>N4</option>
          <option value={5}>N5</option>
        </select>
      </div>
      
      <!-- Stroke Count -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Stroke Count
        </label>
        <div class="flex space-x-2">
          <input
            type="number"
            min="1"
            max="30"
            bind:value={filters.minStrokes}
            placeholder="Min"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span class="self-center text-slate-400">-</span>
          <input
            type="number"
            min="1"
            max="30"
            bind:value={filters.maxStrokes}
            placeholder="Max"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
    
    <!-- Filter actions -->
    <div class="flex justify-end mt-4">
      <button
        on:click={clearFilters}
        class="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors mr-2"
      >
        Clear Filters
      </button>
      
      <div class="text-sm text-slate-600 dark:text-slate-400 self-center">
        Showing {totalItems} kanji
      </div>
    </div>
  </div>
  
  <!-- Selected count (if selection is enabled) -->
  {#if showSelection && selectedKanjiIds.length > 0}
    <div class="bg-indigo-100 dark:bg-indigo-900 rounded-lg px-4 py-3 mb-6 flex justify-between items-center">
      <div class="text-indigo-800 dark:text-indigo-200">
        <span class="font-semibold">{selectedKanjiIds.length}</span> kanji selected
      </div>
      
      <button
        on:click={() => { selectedKanjiIds = []; }}
        class="text-sm text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100"
      >
        Clear selection
      </button>
    </div>
  {/if}
  
  <!-- Kanji grid -->
  {#if currentPageItems.length > 0}
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
      {#each currentPageItems as kanji}
        <div 
          class={`
            aspect-square bg-white dark:bg-slate-800 rounded-lg border-2 shadow-sm 
            flex flex-col items-center justify-center cursor-pointer transition-all
            ${selectedKanjiIds.includes(kanji.id) 
              ? 'border-indigo-500 dark:border-indigo-400' 
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
          `}
          on:click={() => showSelection ? toggleSelection(kanji.id) : viewKanji(kanji.id)}
          role="button"
          tabindex="0"
          aria-pressed={selectedKanjiIds.includes(kanji.id)}
        >
          <div class="text-3xl font-bold font-japanese mb-1">{kanji.character}</div>
          <div class="text-xs text-slate-600 dark:text-slate-400 truncate w-full text-center px-1">{kanji.meaning}</div>
          
          {#if kanji.jlptLevel}
            <div class="absolute top-1 right-1">
              <span class="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                {kanji.jlptLevel}
              </span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex justify-center items-center space-x-2 mt-8 mb-4">
        <button
          class="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page === 1}
          on:click={() => goToPage(page - 1)}
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <div class="text-sm text-slate-600 dark:text-slate-400">
          Page {page} of {totalPages}
        </div>
        
        <button
          class="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page === totalPages}
          on:click={() => goToPage(page + 1)}
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    {/if}
  {:else}
    <!-- No results -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No Kanji Found</h3>
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        No kanji match your current filters. Try adjusting your search criteria.
      </p>
      <button
        on:click={clearFilters}
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        Clear Filters
      </button>
    </div>
  {/if}
</div>

<style>
  /* Font for Japanese characters */
  .font-japanese {
    font-family: "Noto Sans JP", "Hiragino Sans", "Meiryo", sans-serif;
  }
</style> 