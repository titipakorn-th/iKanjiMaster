<script lang="ts">
  import { onMount } from 'svelte';
  import KanjiBrowser from '$lib/components/KanjiBrowser.svelte';
  
  // State
  let selectedDeckId: string | null = null;
  let isCreatingDeck = false;
  let isEditingDeck = false;
  let selectedKanjiIds: string[] = [];
  let currentView: 'list' | 'detail' | 'edit' = 'list';
  
  // Form state
  let newDeckName = '';
  let newDeckDescription = '';
  
  // Sample decks data (in a real app, this would come from the database)
  let decks = [
    { 
      id: 'deck1', 
      name: 'JLPT N5 Kanji', 
      description: 'Basic kanji for JLPT N5 level',
      count: 100,
      created: '2023-03-15',
      lastStudied: '2023-04-25',
      progress: 45
    },
    { 
      id: 'deck2', 
      name: 'JLPT N4 Kanji', 
      description: 'Standard kanji for JLPT N4 level',
      count: 150,
      created: '2023-02-10',
      lastStudied: '2023-04-26',
      progress: 30
    },
    { 
      id: 'deck3', 
      name: 'Elements', 
      description: 'Kanji related to natural elements',
      count: 25,
      created: '2023-04-01',
      lastStudied: '2023-04-27',
      progress: 80
    },
    { 
      id: 'deck4', 
      name: 'Numbers and Counting', 
      description: 'Kanji for numbers and counting',
      count: 20,
      created: '2023-03-25',
      lastStudied: '2023-04-20',
      progress: 95
    }
  ];
  
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
    }
  ];
  
  // Sample data for specific deck's kanji
  const deckKanjiMap: Record<string, string[]> = {
    'deck1': ['k1', 'k2', 'k3'],
    'deck2': ['k3', 'k4', 'k5'],
    'deck3': ['k1', 'k2', 'k5'],
    'deck4': ['k4']
  };
  
  // Current deck's kanji
  $: currentDeckKanji = selectedDeckId ? 
    allKanji.filter(k => deckKanjiMap[selectedDeckId as string]?.includes(k.id)) : 
    [];
  
  // Functions for deck management
  function createDeck() {
    if (!newDeckName.trim()) return;
    
    // In a real app, this would save the new deck to the database
    const newDeck = {
      id: `deck${decks.length + 1}`,
      name: newDeckName,
      description: newDeckDescription,
      count: selectedKanjiIds.length,
      created: new Date().toISOString().split('T')[0],
      lastStudied: '-',
      progress: 0
    };
    
    decks = [...decks, newDeck];
    deckKanjiMap[newDeck.id] = [...selectedKanjiIds];
    
    // Reset form and state
    newDeckName = '';
    newDeckDescription = '';
    selectedKanjiIds = [];
    isCreatingDeck = false;
    currentView = 'list';
  }
  
  function updateDeck() {
    if (!selectedDeckId || !newDeckName.trim()) return;
    
    // Update deck details
    decks = decks.map(deck => 
      deck.id === selectedDeckId ? 
        { ...deck, name: newDeckName, description: newDeckDescription, count: selectedKanjiIds.length } : 
        deck
    );
    
    // Update kanji in deck
    deckKanjiMap[selectedDeckId] = [...selectedKanjiIds];
    
    // Reset state
    newDeckName = '';
    newDeckDescription = '';
    isEditingDeck = false;
    currentView = 'detail';
  }
  
  function deleteDeck(deckId: string) {
    if (confirm('Are you sure you want to delete this deck?')) {
      decks = decks.filter(deck => deck.id !== deckId);
      delete deckKanjiMap[deckId];
      
      if (selectedDeckId === deckId) {
        selectedDeckId = null;
        currentView = 'list';
      }
    }
  }
  
  function showDeckDetail(deckId: string) {
    selectedDeckId = deckId;
    currentView = 'detail';
  }
  
  function showCreateDeckForm() {
    isCreatingDeck = true;
    selectedKanjiIds = [];
    currentView = 'edit';
  }
  
  function showEditDeckForm(deckId: string) {
    if (!deckId) return;
    
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    
    selectedDeckId = deckId;
    newDeckName = deck.name;
    newDeckDescription = deck.description || '';
    selectedKanjiIds = deckKanjiMap[deckId] || [];
    isEditingDeck = true;
    currentView = 'edit';
  }
  
  function cancelDeckForm() {
    isCreatingDeck = false;
    isEditingDeck = false;
    newDeckName = '';
    newDeckDescription = '';
    selectedKanjiIds = [];
    
    if (selectedDeckId) {
      currentView = 'detail';
    } else {
      currentView = 'list';
    }
  }
  
  function goBack() {
    if (currentView === 'detail') {
      selectedDeckId = null;
      currentView = 'list';
    } else if (currentView === 'edit') {
      if (isEditingDeck && selectedDeckId) {
        currentView = 'detail';
      } else {
        currentView = 'list';
      }
      isCreatingDeck = false;
      isEditingDeck = false;
    }
  }
</script>

<div class="max-w-7xl mx-auto">
  {#if currentView === 'list'}
    <!-- Deck List View -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Your Kanji Decks</h1>
      
      <button 
        on:click={showCreateDeckForm}
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        Create New Deck
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each decks as deck}
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div class="p-6">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2 truncate">{deck.name}</h2>
            <p class="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
              {deck.description || 'No description'}
            </p>
            
            <div class="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-4">
              <div class="mr-4">
                <span class="font-medium">{deck.count}</span> kanji
              </div>
              <div>
                <span class="font-medium">{deck.progress}%</span> complete
              </div>
            </div>
            
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-4">
              <div 
                class="bg-indigo-600 h-1.5 rounded-full" 
                style="width: {deck.progress}%"
              ></div>
            </div>
            
            <div class="flex justify-between text-xs text-slate-500 dark:text-slate-500">
              <div>Created: {deck.created}</div>
              <div>Last studied: {deck.lastStudied}</div>
            </div>
          </div>
          
          <div class="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 flex justify-between">
            <button 
              on:click={() => showDeckDetail(deck.id)}
              class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              View Details
            </button>
            
            <div class="flex space-x-4">
              <button 
                on:click={() => showEditDeckForm(deck.id)}
                class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                Edit
              </button>
              <button 
                on:click={() => deleteDeck(deck.id)}
                class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    {#if decks.length === 0}
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center my-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white mt-4 mb-2">No Decks Yet</h2>
        <p class="text-slate-600 dark:text-slate-400 mb-6">
          Create your first kanji deck to start organizing your study materials.
        </p>
        <button 
          on:click={showCreateDeckForm}
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Create New Deck
        </button>
      </div>
    {/if}
  {:else if currentView === 'detail' && selectedDeckId}
    <!-- Deck Detail View -->
    <div class="mb-6">
      <button 
        on:click={goBack}
        class="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Decks
      </button>
    </div>
    
    {#if selectedDeckId}
      {#if decks.find(d => d.id === selectedDeckId)}
        {@const deck = decks.find(d => d.id === selectedDeckId)}
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">{deck?.name}</h1>
              <p class="text-slate-600 dark:text-slate-400 mb-4">
                {deck?.description || 'No description'}
              </p>
            </div>
            
            <div class="flex space-x-3">
              <button 
                on:click={() => showEditDeckForm(selectedDeckId as string)}
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Edit Deck
              </button>
              
              <a 
                href={`/study?deck=${selectedDeckId}`} 
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                Study Now
              </a>
            </div>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
              <div class="text-sm text-slate-500 dark:text-slate-400">Kanji</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">{deck?.count}</div>
            </div>
            
            <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
              <div class="text-sm text-slate-500 dark:text-slate-400">Progress</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">{deck?.progress}%</div>
            </div>
            
            <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
              <div class="text-sm text-slate-500 dark:text-slate-400">Last Studied</div>
              <div class="text-2xl font-bold text-slate-900 dark:text-white">{deck?.lastStudied === '-' ? 'Never' : deck?.lastStudied}</div>
            </div>
          </div>
        </div>
        
        <!-- Kanji in this deck -->
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Kanji in this Deck</h2>
        
        <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 mb-6">
          {#each currentDeckKanji as kanji}
            <div class="aspect-square bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
              <div class="text-3xl font-bold font-japanese mb-1">{kanji.character}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 truncate w-full text-center px-1">{kanji.meaning}</div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
          <p class="text-slate-600 dark:text-slate-400">Deck not found</p>
        </div>
      {/if}
    {/if}
  {:else if currentView === 'edit'}
    <!-- Create/Edit Deck view -->
    <div class="mb-6">
      <button 
        on:click={goBack}
        class="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        {isEditingDeck ? 'Back to Deck Details' : 'Back to Decks'}
      </button>
    </div>
    
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">
      {isEditingDeck ? 'Edit Deck' : 'Create New Deck'}
    </h1>
    
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
      <div class="space-y-6">
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
      </div>
    </div>
    
    <!-- Kanji Selection -->
    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Select Kanji for this Deck</h2>
    
    <!-- Kanji Browser component -->
    <KanjiBrowser 
      kanjiItems={allKanji} 
      bind:selectedKanjiIds={selectedKanjiIds}
    />
    
    <!-- Action buttons -->
    <div class="flex justify-end space-x-4 mt-8">
      <button 
        on:click={cancelDeckForm}
        class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
      >
        Cancel
      </button>
      
      <button 
        on:click={isEditingDeck ? updateDeck : createDeck}
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        disabled={!newDeckName.trim() || selectedKanjiIds.length === 0}
      >
        {isEditingDeck ? 'Update Deck' : 'Create Deck'}
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