<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import KanjiCard from '$lib/components/KanjiCard.svelte';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  let query: string = data.filters.query || '';
  let jlptLevel: string = data.filters.jlptLevel !== null ? String(data.filters.jlptLevel) : '';
  let minStrokes: string = data.filters.minStrokes !== null ? String(data.filters.minStrokes) : '';
  let maxStrokes: string = data.filters.maxStrokes !== null ? String(data.filters.maxStrokes) : '';
  
  // Helper function to determine which page numbers to show in pagination
  function getPageNumber(index: number, currentPage: number, totalPages: number): number {
    if (totalPages <= 5) {
      return index + 1;
    }
    
    // For more than 5 pages, try to keep current page in the middle
    if (currentPage <= 3) {
      return index + 1;
    } else if (currentPage >= totalPages - 2) {
      return totalPages - 4 + index;
    } else {
      return currentPage - 2 + index;
    }
  }
  
  // Handle form submission
  function handleSearch() {
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (jlptLevel) params.set('jlpt', jlptLevel);
    if (minStrokes) params.set('min', minStrokes);
    if (maxStrokes) params.set('max', maxStrokes);
    
    // Reset to first page when search changes
    params.set('page', '1');
    
    goto(`/browse?${params.toString()}`);
  }
  
  // Navigate to a specific page
  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('page', pageNum.toString());
    goto(`/browse?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Browse Kanji | iKanjiMaster</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Browse Kanji Database</h1>
  
  <!-- Search and Filter Form -->
  <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
    <form on:submit|preventDefault={handleSearch} class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="md:col-span-2">
          <label for="query" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            id="query"
            bind:value={query}
            placeholder="Search by character or meaning"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                   focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
        
        <div>
          <label for="jlptLevel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            JLPT Level
          </label>
          <select
            id="jlptLevel"
            bind:value={jlptLevel}
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                   focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">Any Level</option>
            <option value="5">N1</option>
            <option value="4">N2</option>
            <option value="3">N3</option>
            <option value="2">N4</option>
            <option value="1">N5</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stroke Count
          </label>
          <div class="grid grid-cols-2 gap-2">
            <input
              type="number"
              bind:value={minStrokes}
              placeholder="Min"
              min="1"
              max="30"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                     focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            />
            <input
              type="number"
              bind:value={maxStrokes}
              placeholder="Max"
              min="1"
              max="30"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                     focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                 dark:bg-indigo-700 dark:hover:bg-indigo-800"
        >
          Search
        </button>
      </div>
    </form>
  </div>
  
  <!-- Results display -->
  {#if data.kanji.length === 0}
    <div class="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <p class="text-lg text-gray-600 dark:text-gray-400">No kanji found matching your criteria.</p>
      <p class="mt-2 text-gray-500 dark:text-gray-500">Try adjusting your search filters.</p>
    </div>
  {:else}
    <!-- Results stats -->
    <div class="mb-4 flex justify-between items-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Showing {data.pagination.offset + 1}-{Math.min(data.pagination.offset + data.kanji.length, data.pagination.total)} 
        of {data.pagination.total} results
      </p>
    </div>
    
    <!-- Kanji grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
      {#each data.kanji as kanji}
        <KanjiCard {kanji}>
          <div slot="actions" class="flex gap-2 items-center mt-2">
            <a
              href={`/kanji/${kanji.id}`}
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Details
            </a>
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <a
              href={`/study?kanjiId=${kanji.id}`}
              class="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Study
            </a>
          </div>
        </KanjiCard>
      {/each}
    </div>
    
    <!-- Pagination controls -->
    {#if data.pagination.totalPages > 1}
      <div class="flex justify-center mt-8">
        <nav class="inline-flex rounded-md shadow-sm" aria-label="Pagination">
          <!-- Previous page button -->
          <button
            on:click={() => goToPage(data.pagination.currentPage - 1)}
            disabled={!data.pagination.hasPrevPage}
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 
                   dark:border-gray-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 
                   dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50
                   disabled:cursor-not-allowed"
          >
            <span class="sr-only">Previous</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Page numbers -->
          {#each Array(Math.min(5, data.pagination.totalPages)) as _, i}
            {#if getPageNumber(i, data.pagination.currentPage, data.pagination.totalPages) <= data.pagination.totalPages}
              {@const pageNum = getPageNumber(i, data.pagination.currentPage, data.pagination.totalPages)}
              <button
                on:click={() => goToPage(pageNum)}
                class={`
                  relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600
                  text-sm font-medium 
                  ${pageNum === data.pagination.currentPage 
                    ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-700 text-indigo-600 dark:text-indigo-200' 
                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}
                `}
              >
                {pageNum}
              </button>
            {/if}
          {/each}
          
          <!-- Next page button -->
          <button
            on:click={() => goToPage(data.pagination.currentPage + 1)}
            disabled={!data.pagination.hasNextPage}
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 
                   dark:border-gray-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 
                   dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50
                   disabled:cursor-not-allowed"
          >
            <span class="sr-only">Next</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    {/if}
  {/if}
</div> 