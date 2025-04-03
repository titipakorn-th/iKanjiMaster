<script lang="ts">
  import { onMount } from 'svelte';
  import KanjiBrowser from '$lib/components/KanjiBrowser.svelte';
  import KanjiCard from '$lib/components/KanjiCard.svelte';
  
  // State for selected kanji and view mode
  let selectedKanjiIds: string[] = [];
  let viewMode: 'browse' | 'detail' = 'browse';
  let selectedKanjiId: string | null = null;
  let isCreatingDeck = false;
  let newDeckName = '';
  let newDeckDescription = '';
  
  // Sample kanji data (in a real app, this would come from the database)
  const allKanji = [
    {
      id: 'k1',
      character: '水',
      meaning: 'water',
      jlptLevel: 5,
      strokeCount: 4
    },
    {
      id: 'k2',
      character: '火',
      meaning: 'fire',
      jlptLevel: 5,
      strokeCount: 4
    },
    {
      id: 'k3',
      character: '木',
      meaning: 'tree, wood',
      jlptLevel: 5,
      strokeCount: 4
    },
    {
      id: 'k4',
      character: '金',
      meaning: 'gold, money',
      jlptLevel: 5,
      strokeCount: 8
    },
    {
      id: 'k5',
      character: '土',
      meaning: 'earth, soil',
      jlptLevel: 5,
      strokeCount: 3
    },
    {
      id: 'k6',
      character: '日',
      meaning: 'sun, day',
      jlptLevel: 5,
      strokeCount: 4
    },
    {
      id: 'k7',
      character: '月',
      meaning: 'moon, month',
      jlptLevel: 5,
      strokeCount: 4
    },
    {
      id: 'k8',
      character: '山',
      meaning: 'mountain',
      jlptLevel: 5,
      strokeCount: 3
    },
    {
      id: 'k9',
      character: '川',
      meaning: 'river',
      jlptLevel: 5,
      strokeCount: 3
    },
    {
      id: 'k10',
      character: '田',
      meaning: 'rice field',
      jlptLevel: 5,
      strokeCount: 5
    },
    {
      id: 'k11',
      character: '人',
      meaning: 'person',
      jlptLevel: 5,
      strokeCount: 2
    },
    {
      id: 'k12',
      character: '口',
      meaning: 'mouth',
      jlptLevel: 5,
      strokeCount: 3
    }
  ];
  
  // Detailed kanji data (in a real app, this would come from the database)
  const detailedKanjiMap: Record<string, any> = {
    'k1': {
      id: 'k1',
      character: '水',
      onyomi: 'スイ',
      kunyomi: 'みず',
      meaning: 'water',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '水曜日', reading: 'すいようび', meaning: 'Wednesday' },
        { word: '水泳', reading: 'すいえい', meaning: 'swimming' },
        { word: '冷水', reading: 'れいすい', meaning: 'cold water' }
      ]
    },
    'k2': {
      id: 'k2',
      character: '火',
      onyomi: 'カ',
      kunyomi: 'ひ',
      meaning: 'fire',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '火曜日', reading: 'かようび', meaning: 'Tuesday' },
        { word: '火山', reading: 'かざん', meaning: 'volcano' },
        { word: '花火', reading: 'はなび', meaning: 'fireworks' }
      ]
    },
    'k3': {
      id: 'k3',
      character: '木',
      onyomi: 'モク, ボク',
      kunyomi: 'き',
      meaning: 'tree, wood',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '木曜日', reading: 'もくようび', meaning: 'Thursday' },
        { word: '木材', reading: 'もくざい', meaning: 'lumber, timber' },
        { word: '木々', reading: 'きぎ', meaning: 'trees' }
      ]
    }
  };
  
  // Function to handle viewing a kanji's details
  function viewKanji(event: CustomEvent<{ id: string }>) {
    selectedKanjiId = event.detail.id;
    viewMode = 'detail';
  }
  
  // Function to go back to browse mode
  function backToBrowse() {
    viewMode = 'browse';
    selectedKanjiId = null;
  }
  
  // Function to handle kanji selection
  function handleKanjiSelect(event: CustomEvent<{ id: string; selected: boolean }>) {
    // Selection is handled by the KanjiBrowser component
  }
  
  // Function to add selected kanji to a new deck
  function showCreateDeckForm() {
    isCreatingDeck = true;
  }
  
  // Function to create a new deck with the selected kanji
  function createDeck() {
    if (!newDeckName.trim()) return;
    
    // In a real app, this would save the new deck to the database
    console.log('Creating new deck:', {
      name: newDeckName,
      description: newDeckDescription,
      kanjiIds: selectedKanjiIds
    });
    
    // Reset form
    newDeckName = '';
    newDeckDescription = '';
    selectedKanjiIds = [];
    isCreatingDeck = false;
  }
  
  // Function to cancel deck creation
  function cancelDeckCreation() {
    isCreatingDeck = false;
    newDeckName = '';
    newDeckDescription = '';
  }
</script>

<div>
  {#if viewMode === 'browse'}
    <!-- Browse mode -->
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Browse Kanji</h1>
        
        {#if selectedKanjiIds.length > 0}
          <div class="flex space-x-3">
            <button 
              on:click={showCreateDeckForm}
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Create Deck
            </button>
            <button 
              on:click={() => selectedKanjiIds = []}
              class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
            >
              Clear Selection ({selectedKanjiIds.length})
            </button>
          </div>
        {/if}
      </div>
      
      <KanjiBrowser 
        kanjiItems={allKanji} 
        bind:selectedKanjiIds={selectedKanjiIds}
        on:select={handleKanjiSelect}
        on:view={viewKanji}
      />
    </div>
    
    <!-- Create deck modal -->
    {#if isCreatingDeck}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-md w-full">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New Deck</h2>
          
          <div class="space-y-4">
            <div>
              <label for="deckName" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Deck Name*
              </label>
              <input 
                type="text" 
                id="deckName" 
                bind:value={newDeckName}
                placeholder="Enter deck name" 
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label for="deckDescription" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea 
                id="deckDescription" 
                bind:value={newDeckDescription}
                placeholder="Enter deck description" 
                rows="3"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>
            
            <div>
              <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Selected Kanji ({selectedKanjiIds.length})
              </div>
              <div class="flex flex-wrap gap-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                {#each selectedKanjiIds as kanjiId}
                  {#if allKanji.find(k => k.id === kanjiId)}
                    <div class="text-xl font-japanese">
                      {allKanji.find(k => k.id === kanjiId)?.character}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button 
                on:click={cancelDeckCreation}
                class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                on:click={createDeck}
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                disabled={!newDeckName.trim()}
              >
                Create Deck
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {:else if viewMode === 'detail' && selectedKanjiId && detailedKanjiMap[selectedKanjiId]}
    <!-- Detail mode -->
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <button 
          on:click={backToBrowse}
          class="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back to Browse
        </button>
      </div>
      
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center mb-6">
          <div class="md:w-1/3 mb-4 md:mb-0 flex justify-center">
            <div class="text-8xl font-bold text-slate-900 dark:text-white font-japanese">
              {detailedKanjiMap[selectedKanjiId].character}
            </div>
          </div>
          
          <div class="md:w-2/3 md:pl-6">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {detailedKanjiMap[selectedKanjiId].meaning}
            </h1>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span class="text-sm text-slate-500 dark:text-slate-400">On'yomi</span>
                <p class="text-slate-900 dark:text-white font-medium">
                  {detailedKanjiMap[selectedKanjiId].onyomi || 'N/A'}
                </p>
              </div>
              <div>
                <span class="text-sm text-slate-500 dark:text-slate-400">Kun'yomi</span>
                <p class="text-slate-900 dark:text-white font-medium">
                  {detailedKanjiMap[selectedKanjiId].kunyomi || 'N/A'}
                </p>
              </div>
            </div>
            
            <div class="flex flex-wrap gap-2">
              {#if detailedKanjiMap[selectedKanjiId].jlptLevel}
                <div class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-xs font-semibold">
                  JLPT N{detailedKanjiMap[selectedKanjiId].jlptLevel}
                </div>
              {/if}
              
              {#if detailedKanjiMap[selectedKanjiId].strokeCount}
                <div class="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                  {detailedKanjiMap[selectedKanjiId].strokeCount} strokes
                </div>
              {/if}
            </div>
          </div>
        </div>
        
        <!-- Examples section -->
        {#if detailedKanjiMap[selectedKanjiId].examples && detailedKanjiMap[selectedKanjiId].examples.length > 0}
          <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Example Words</h2>
            
            <ul class="space-y-4">
              {#each detailedKanjiMap[selectedKanjiId].examples as example}
                <li class="border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div class="flex justify-between">
                    <span class="text-lg font-medium font-japanese">{example.word}</span>
                    <span class="text-sm text-slate-500 dark:text-slate-400">{example.reading}</span>
                  </div>
                  <p class="text-slate-600 dark:text-slate-300 mt-1">{example.meaning}</p>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
      
      <!-- Kanji card (visual representation) -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Flashcard Preview</h2>
        
        <KanjiCard 
          character={detailedKanjiMap[selectedKanjiId].character}
          onyomi={detailedKanjiMap[selectedKanjiId].onyomi}
          kunyomi={detailedKanjiMap[selectedKanjiId].kunyomi}
          meaning={detailedKanjiMap[selectedKanjiId].meaning}
          jlptLevel={detailedKanjiMap[selectedKanjiId].jlptLevel}
          strokeCount={detailedKanjiMap[selectedKanjiId].strokeCount}
          examples={detailedKanjiMap[selectedKanjiId].examples}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  /* Font for Japanese characters */
  .font-japanese {
    font-family: "Noto Sans JP", "Hiragino Sans", "Meiryo", sans-serif;
  }
</style> 