<script lang="ts">
  import { onMount } from 'svelte';
  import KanjiBrowser from '$lib/components/KanjiBrowser.svelte';
  
  // State
  let selectedDeckId: string | null = null;
  let isCreatingDeck = false;
  let isEditingDeck = false;
  let selectedKanjiIds: string[] = [];
  let currentView: 'list' | 'detail' | 'edit' = 'list';
  let isLoading = true;
  let error = '';
  
  // Form state
  let newDeckName = '';
  let newDeckDescription = '';
  
  // Define KanjiItem type to match KanjiBrowser component
  type KanjiItem = {
    id: string;
    character: string;
    meaning: string;
    jlptLevel: number | null;
    strokeCount: number | null;
  };
  
  // Deck and kanji data to be loaded from database
  let decks: {
    id: string;
    name: string;
    description: string;
    count: number;
    created?: string;
    lastStudied?: string;
    progress?: number;
    kanjiCount?: number;
    createdAt?: string;
    isPublic?: boolean;
  }[] = [];
  
  let allKanji: KanjiItem[] = [];
  
  // Current deck's kanji
  let currentDeckKanji: KanjiItem[] = [];
  
  // State for adding kanji in detail view
  let showAddKanjiPanel = false;
  let addKanjiLoading = false;
  let addKanjiMessage = '';
  
  // Add these variables to the state variables at the top of the script
  let currentPage = 1;
  let pageSize = 100;
  let totalPages = 1;
  let totalKanjiCount = 0;
  
  // Track all kanji IDs across pages in edit mode
  let editPageKanjiIds: string[] = [];
  
  // Load decks from database
  async function loadDecks() {
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/decks');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load decks');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.decks)) {
        decks = data.decks.map((deck: any) => ({
          id: deck.id,
          name: deck.name,
          description: deck.description || 'No description',
          count: deck.kanjiCount || 0,
          created: new Date(deck.createdAt).toLocaleDateString(),
          createdAt: deck.createdAt,
          isPublic: deck.isPublic,
          lastStudied: '-', // We'll add this functionality later
          progress: 0 // We'll add this functionality later
        }));
      } else {
        throw new Error('Invalid response format from decks API');
      }
    } catch (e) {
      console.error('Error loading decks:', e);
      error = e instanceof Error ? e.message : 'Failed to load decks';
    } finally {
      isLoading = false;
    }
  }
  
  // Load kanji for the selected deck
  async function loadDeckKanji(deckId: string, page = 1, size = pageSize) {
    if (!deckId) {
      currentDeckKanji = [];
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      // Request with pagination parameters
      const response = await fetch(`/api/decks/${deckId}/kanji?page=${page}&pageSize=${size}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load kanji for this deck');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.kanji)) {
        currentDeckKanji = data.kanji.map((kanji: any): KanjiItem => ({
          id: kanji.id,
          character: kanji.character,
          meaning: kanji.meaning,
          jlptLevel: kanji.jlptLevel || null,
          strokeCount: kanji.strokeCount || null
        }));
        
        // Update pagination state
        currentPage = data.page;
        pageSize = data.pageSize;
        totalPages = data.totalPages;
        totalKanjiCount = data.totalCount;
      } else {
        throw new Error('Invalid response format from deck kanji API');
      }
    } catch (e) {
      console.error('Error loading deck kanji:', e);
      error = e instanceof Error ? e.message : 'Failed to load kanji for this deck';
      currentDeckKanji = [];
    } finally {
      isLoading = false;
    }
  }
  
  // Load all available kanji for adding to decks
  async function loadAllKanji(filters = { jlptLevel: 5 }) {
    // Start with a reasonable default - e.g., JLPT N5 kanji which are common beginner kanji
    try {
      let url = '/api/kanji?limit=100';
      
      // Add filters to the URL
      if (filters.jlptLevel) {
        url += `&jlpt=${filters.jlptLevel}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load kanji');
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        allKanji = data.data.map((kanji: any): KanjiItem => ({
          id: kanji.id,
          character: kanji.character,
          meaning: kanji.meaning,
          jlptLevel: kanji.jlptLevel || null,
          strokeCount: kanji.strokeCount || null
        }));
      } else {
        throw new Error('Invalid response format from kanji API');
      }
    } catch (e) {
      console.error('Error loading all kanji:', e);
      // Don't set global error - allKanji is only needed for the edit view
    }
  }
  
  // Load more kanji with different filters
  async function loadMoreKanji(filters: { jlptLevel?: number | null, minStrokes?: number | null, maxStrokes?: number | null, query?: string }) {
    try {
      let url = '/api/kanji?limit=100';
      
      // Add filters to the URL
      if (filters.jlptLevel) {
        url += `&jlpt=${filters.jlptLevel}`;
      }
      
      if (filters.minStrokes) {
        url += `&minStrokes=${filters.minStrokes}`;
      }
      
      if (filters.maxStrokes) {
        url += `&maxStrokes=${filters.maxStrokes}`;
      }
      
      if (filters.query) {
        url += `&query=${encodeURIComponent(filters.query)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load kanji');
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Add new kanji to the existing list, avoiding duplicates
        const newKanji = data.data.map((kanji: any): KanjiItem => ({
          id: kanji.id,
          character: kanji.character,
          meaning: kanji.meaning,
          jlptLevel: kanji.jlptLevel || null,
          strokeCount: kanji.strokeCount || null
        }));
        
        // Filter out kanji that are already in allKanji
        const existingIds = new Set(allKanji.map(k => k.id));
        const uniqueNewKanji = newKanji.filter((k: KanjiItem) => !existingIds.has(k.id));
        
        // Combine existing and new kanji
        allKanji = [...allKanji, ...uniqueNewKanji];
        
        return newKanji.length;
      } else {
        throw new Error('Invalid response format from kanji API');
      }
    } catch (e) {
      console.error('Error loading more kanji:', e);
      throw e;
    }
  }
  
  // Functions for deck management
  async function createDeck() {
    if (!newDeckName.trim()) return;
    
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDeckName.trim(),
          description: newDeckDescription.trim() || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create deck');
      }
      
      const data = await response.json();
      
      if (data.success && data.deck) {
        // Add the new deck to the list
    const newDeck = {
          id: data.deck.id,
          name: data.deck.name,
          description: data.deck.description || 'No description',
          count: 0,
          created: new Date(data.deck.createdAt).toLocaleDateString(),
          createdAt: data.deck.createdAt,
      lastStudied: '-',
      progress: 0
    };
    
    decks = [...decks, newDeck];
        
        // If we have selected kanji IDs, add them to the deck
        if (selectedKanjiIds.length > 0) {
          await addKanjiToDeck(newDeck.id, selectedKanjiIds);
        }
    
    // Reset form and state
    newDeckName = '';
    newDeckDescription = '';
    selectedKanjiIds = [];
    isCreatingDeck = false;
    currentView = 'list';
      } else {
        throw new Error('Invalid response format from deck creation API');
      }
    } catch (e) {
      console.error('Error creating deck:', e);
      error = e instanceof Error ? e.message : 'Failed to create deck';
    } finally {
      isLoading = false;
    }
  }
  
  // Add kanji to a deck
  async function addKanjiToDeck(deckId: string, kanjiIds: string[]) {
    if (!deckId || !kanjiIds.length) return;
    
    try {
      const response = await fetch('/api/decks/add-kanji', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckId,
          kanjiIds
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add kanji to deck');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update deck counts in the UI
        decks = decks.map(deck => {
          if (deck.id === deckId) {
            return {
              ...deck,
              count: deck.count + data.added
            };
          }
          return deck;
        });
        
        // Reload deck kanji if we're in detail view for this deck
        if (selectedDeckId === deckId && currentView === 'detail') {
          await loadDeckKanji(deckId);
        }
        
        return data.added;
      } else {
        throw new Error('Invalid response format from add kanji API');
      }
    } catch (e) {
      console.error('Error adding kanji to deck:', e);
      throw e;
    }
  }
  
  async function updateDeck() {
    if (!selectedDeckId || !newDeckName.trim()) return;
    
    isLoading = true;
    error = '';
    
    try {
      // In the future, implement an API endpoint to update deck details
      // For now, just update the name and description in the UI
      
      // Update deck details in the UI
    decks = decks.map(deck => 
      deck.id === selectedDeckId ? 
          { ...deck, name: newDeckName, description: newDeckDescription } : 
        deck
    );
    
      // If we have selectedKanjiIds that have changed, update them
      if (selectedKanjiIds.length > 0) {
        // In a real app, we would handle removing kanji too
        // For now, just add any new kanji
        await addKanjiToDeck(selectedDeckId, selectedKanjiIds);
      }
    
    // Reset state
    newDeckName = '';
    newDeckDescription = '';
      selectedKanjiIds = [];
      editPageKanjiIds = [];
    isEditingDeck = false;
    currentView = 'detail';
    } catch (e) {
      console.error('Error updating deck:', e);
      error = e instanceof Error ? e.message : 'Failed to update deck';
    } finally {
      isLoading = false;
    }
  }
  
  async function deleteDeck(deckId: string) {
    if (confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      isLoading = true;
      error = '';
      
      try {
        const response = await fetch(`/api/decks/${deckId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete deck');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Remove the deck from the UI
      decks = decks.filter(deck => deck.id !== deckId);
      
      if (selectedDeckId === deckId) {
        selectedDeckId = null;
        currentView = 'list';
          }
        } else {
          throw new Error(data.message || 'Failed to delete deck');
        }
      } catch (e) {
        console.error('Error deleting deck:', e);
        error = e instanceof Error ? e.message : 'Failed to delete deck';
      } finally {
        isLoading = false;
      }
    }
  }
  
  async function showDeckDetail(deckId: string) {
    selectedDeckId = deckId;
    currentView = 'detail';
    await loadDeckKanji(deckId);
  }
  
  async function showCreateDeckForm() {
    // Only load JLPT N5 kanji initially for better performance
    await loadAllKanji({ jlptLevel: 5 });
    isCreatingDeck = true;
    selectedKanjiIds = [];
    currentView = 'edit';
  }
  
  async function showEditDeckForm(deckId: string) {
    if (!deckId) return;
    
    // Only load JLPT N5 kanji initially for better performance
    await loadAllKanji({ jlptLevel: 5 });
    
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    
    selectedDeckId = deckId;
    newDeckName = deck.name;
    newDeckDescription = deck.description || '';
    
    // Reset pagination parameters for the edit view
    currentPage = 1;
    pageSize = 100;
    isLoading = true;

    try {
      // First, fetch all kanji IDs for this deck
      const idsResponse = await fetch(`/api/decks/${deckId}/kanji-ids`);
      
      if (idsResponse.ok) {
        const idsData = await idsResponse.json();
        if (idsData.success) {
          // Store all kanji IDs for tracking across pagination
          editPageKanjiIds = idsData.kanjiIds;
          
          // Assume all kanji are initially selected
          selectedKanjiIds = [...editPageKanjiIds];
        }
      }
      
      // Now load the first page of full kanji details
      await loadDeckKanji(deckId, 1, pageSize);
    } catch (e) {
      console.error('Error initializing edit form:', e);
      error = e instanceof Error ? e.message : 'Failed to load kanji for editing';
      
      // Fallback: just use the first page of kanji
      await loadDeckKanji(deckId, 1, pageSize);
      editPageKanjiIds = currentDeckKanji.map(k => k.id);
      selectedKanjiIds = [...editPageKanjiIds];
    } finally {
      isLoading = false;
    }
    
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
  
  // Function to toggle add kanji panel in detail view
  function toggleAddKanjiPanel() {
    showAddKanjiPanel = !showAddKanjiPanel;
    
    if (showAddKanjiPanel && allKanji.length === 0) {
      // Load N5 kanji if we haven't loaded any kanji yet
      loadAllKanji({ jlptLevel: 5 });
    }
    
    // Reset message
    addKanjiMessage = '';
  }
  
  // Add random kanji to the current deck
  async function addRandomKanjiToDeck(count = 10) {
    if (!selectedDeckId) return;
    
    addKanjiLoading = true;
    addKanjiMessage = '';
    
    try {
      // Get all available kanji IDs
      const existingIds = new Set(currentDeckKanji.map(k => k.id));
      const availableKanji = allKanji.filter(k => !existingIds.has(k.id));
      
      if (availableKanji.length === 0) {
        addKanjiMessage = 'No new kanji available to add. Try loading more kanji with different filters.';
        return;
      }
      
      // Randomly select kanji
      const shuffled = [...availableKanji].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      const kanjiIds = selected.map(k => k.id);
      
      // Add to deck
      const added = await addKanjiToDeck(selectedDeckId, kanjiIds);
      
      addKanjiMessage = `Successfully added ${added} new kanji to your deck!`;
    } catch (e) {
      console.error('Error adding random kanji:', e);
      addKanjiMessage = e instanceof Error ? e.message : 'Failed to add kanji';
    } finally {
      addKanjiLoading = false;
    }
  }
  
  // Function to handle page changes
  async function changePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages || !selectedDeckId) return;
    await loadDeckKanji(selectedDeckId, newPage, pageSize);
  }
  
  // Add this function to handle kanji selection in edit view with pagination
  function toggleKanjiSelection(kanjiId: string) {
    if (selectedKanjiIds.includes(kanjiId)) {
      // Remove kanji from selection
      selectedKanjiIds = selectedKanjiIds.filter(id => id !== kanjiId);
      editPageKanjiIds = editPageKanjiIds.filter(id => id !== kanjiId);
    } else {
      // Add kanji to selection
      selectedKanjiIds = [...selectedKanjiIds, kanjiId];
      editPageKanjiIds = [...editPageKanjiIds, kanjiId];
    }
  }
  
  // Load data on mount
  onMount(() => {
    loadDecks();
  });
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  {#if isLoading && currentView === 'list'}
    <div class="flex justify-center items-center min-h-[300px]">
      <div class="text-center">
        <div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
        <p class="text-slate-600 dark:text-slate-400">Loading your decks...</p>
      </div>
    </div>
  {:else if error && currentView === 'list'}
    <div class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
      <p>{error}</p>
      <button 
        class="mt-2 text-red-600 dark:text-red-400 underline" 
        on:click={() => loadDecks()}
      >
        Try Again
      </button>
    </div>
  {:else if currentView === 'list'}
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
    
    {#if decks.length === 0}
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg text-center">
        <p class="text-yellow-800 dark:text-yellow-200 mb-4">You don't have any decks yet!</p>
        <button 
          on:click={showCreateDeckForm}
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Create Your First Deck
        </button>
      </div>
    {:else}
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
                  <span class="font-medium">Created:</span> {deck.created || 'Unknown'}
              </div>
            </div>
            
              <div class="flex justify-between">
            <button 
              on:click={() => showDeckDetail(deck.id)}
                  class="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              View Details
            </button>
            
              <button 
                on:click={() => showEditDeckForm(deck.id)}
                  class="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      {/each}
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
              
              <button 
                on:click={() => deleteDeck(selectedDeckId as string)}
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Deck
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
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">Kanji in this Deck</h2>
          
          <button 
            on:click={toggleAddKanjiPanel}
            class="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            {showAddKanjiPanel ? 'Hide Add Kanji' : 'Add Kanji'}
          </button>
        </div>
        
        {#if showAddKanjiPanel}
          <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6">
            <h3 class="font-medium text-indigo-900 dark:text-indigo-200 mb-2">Add Kanji to {decks.find(d => d.id === selectedDeckId)?.name}</h3>
            
            {#if addKanjiMessage}
              <div class={`p-3 rounded-lg mb-3 ${addKanjiMessage.includes('Successfully') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                {addKanjiMessage}
              </div>
            {/if}
            
            <div class="flex flex-wrap gap-3 mb-4">
              <button 
                on:click={() => addRandomKanjiToDeck(10)}
                disabled={addKanjiLoading}
                class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if addKanjiLoading}
                  <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {/if}
                Add 10 Random Kanji
              </button>
              
              <a 
                href="/api/kanji/random?limit=30&addToDeck={selectedDeckId}"
                target="_blank"
                class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
              >
                Add 30 Random Kanji
              </a>
            </div>
            
            <h4 class="font-medium text-indigo-900 dark:text-indigo-200 mb-2">Or select from available kanji:</h4>
            
            <div class="flex flex-wrap gap-2 mb-3">
              <button 
                on:click={() => loadAllKanji({ jlptLevel: 5 })}
                class="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                N5 Kanji
              </button>
              <button 
                on:click={() => loadMoreKanji({ jlptLevel: 4 })}
                class="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                Add N4 Kanji
              </button>
              <button 
                on:click={() => loadMoreKanji({ jlptLevel: 3 })}
                class="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                Add N3 Kanji
              </button>
              <button 
                on:click={() => loadMoreKanji({ jlptLevel: 2 })}
                class="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                Add N2 Kanji
              </button>
              <button 
                on:click={() => loadMoreKanji({ jlptLevel: 1 })}
                class="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                Add N1 Kanji
              </button>
            </div>
            
            <!-- Simplified kanji browser - just for selection -->
            <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 mb-3 max-h-60 overflow-y-auto p-2 bg-white dark:bg-slate-800 rounded-lg">
              {#each allKanji.filter(k => !currentDeckKanji.some(dk => dk.id === k.id)) as kanji}
                <button 
                  on:click={() => addKanjiToDeck(selectedDeckId as string, [kanji.id])}
                  class="aspect-square bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <div class="text-3xl font-bold font-japanese mb-1">{kanji.character}</div>
                  <div class="text-xs text-slate-600 dark:text-slate-400 truncate w-full text-center px-1">{kanji.meaning}</div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
        
        <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 mb-6">
          {#if isLoading}
            <div class="col-span-full flex justify-center items-center py-12">
              <div class="text-center">
                <div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                <p class="text-slate-600 dark:text-slate-400">Loading kanji...</p>
              </div>
            </div>
          {:else if currentDeckKanji.length === 0}
            <div class="col-span-full py-12 text-center">
              <p class="text-slate-600 dark:text-slate-400">No kanji in this deck yet. Add some kanji to get started!</p>
            </div>
          {:else}
          {#each currentDeckKanji as kanji}
            <div class="aspect-square bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
              <div class="text-3xl font-bold font-japanese mb-1">{kanji.character}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 truncate w-full text-center px-1">{kanji.meaning}</div>
            </div>
          {/each}
            <div class="col-span-full mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              Showing {currentDeckKanji.length} of {totalKanjiCount} kanji
            </div>
            
            <!-- Pagination UI -->
            {#if totalPages > 1}
              <div class="col-span-full mt-6 flex justify-center items-center space-x-2">
                <button 
                  on:click={() => changePage(1)}
                  disabled={currentPage === 1}
                  class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="First page"
                >
                  &laquo;
                </button>
                <button 
                  on:click={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  &lsaquo;
                </button>
                
                <span class="px-3 py-1 text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  on:click={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  &rsaquo;
                </button>
                <button 
                  on:click={() => changePage(totalPages)}
                  disabled={currentPage === totalPages}
                  class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Last page"
                >
                  &raquo;
                </button>
              </div>
              
              <!-- Page size selector -->
              <div class="col-span-full mt-2 flex justify-center items-center space-x-2">
                <label for="pageSize" class="text-sm text-slate-600 dark:text-slate-400">
                  Kanji per page:
                </label>
                <select 
                  id="pageSize"
                  bind:value={pageSize}
                  on:change={() => loadDeckKanji(selectedDeckId as string, 1, pageSize)}
                  class="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
            {/if}
          {/if}
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
    
    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
      <p class="text-blue-800 dark:text-blue-200 mb-3">
        Currently showing JLPT N5 kanji. Use the filters below to find more kanji to add to your deck.
      </p>
      
      <div class="flex flex-wrap gap-2">
        <button 
          on:click={() => loadAllKanji({ jlptLevel: 5 })}
          class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          N5 Kanji
        </button>
        <button 
          on:click={() => loadMoreKanji({ jlptLevel: 4 })}
          class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Add N4 Kanji
        </button>
        <button 
          on:click={() => loadMoreKanji({ jlptLevel: 3 })}
          class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Add N3 Kanji
        </button>
        <button 
          on:click={() => loadMoreKanji({ jlptLevel: 2 })}
          class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Add N2 Kanji
        </button>
        <button 
          on:click={() => loadMoreKanji({ jlptLevel: 1 })}
          class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Add N1 Kanji
        </button>
      </div>
    </div>
    
    <!-- Custom Kanji browser with pagination for edit view -->
    <div class="mb-6">
      <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Current Kanji in Deck</h3>
      
      {#if isLoading}
        <div class="flex justify-center items-center py-8">
          <div class="text-center">
            <div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
            <p class="text-slate-600 dark:text-slate-400">Loading kanji...</p>
          </div>
        </div>
      {:else}
        <!-- Kanji grid with selection -->
        <div class="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 mb-4">
          {#each currentDeckKanji as kanji}
            <button 
              on:click={() => toggleKanjiSelection(kanji.id)}
              class={`aspect-square rounded-lg border ${selectedKanjiIds.includes(kanji.id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} flex flex-col items-center justify-center p-2 transition-colors`}
            >
              <div class="text-3xl font-bold font-japanese mb-1">{kanji.character}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 truncate w-full text-center">{kanji.meaning}</div>
              <div class="mt-1">
                <span class={`inline-block w-4 h-4 rounded-full ${selectedKanjiIds.includes(kanji.id) ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {#if selectedKanjiIds.includes(kanji.id)}
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  {/if}
                </span>
              </div>
            </button>
          {/each}
        </div>
        
        <!-- Pagination for edit view -->
        <div class="flex flex-col items-center mt-4">
          <div class="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Showing {currentDeckKanji.length} of {totalKanjiCount} kanji • {selectedKanjiIds.length} selected
          </div>
          
          {#if totalPages > 1}
            <div class="flex justify-center items-center space-x-2 mb-2">
              <button 
                on:click={() => changePage(1)}
                disabled={currentPage === 1}
                class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="First page"
              >
                &laquo;
              </button>
              <button 
                on:click={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                &lsaquo;
              </button>
              
              <span class="px-3 py-1 text-slate-600 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                on:click={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                &rsaquo;
              </button>
              <button 
                on:click={() => changePage(totalPages)}
                disabled={currentPage === totalPages}
                class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Last page"
              >
                &raquo;
              </button>
            </div>
            
            <div class="flex items-center space-x-2">
              <label for="editPageSize" class="text-sm text-slate-600 dark:text-slate-400">
                Kanji per page:
              </label>
              <select 
                id="editPageSize"
                bind:value={pageSize}
                on:change={() => loadDeckKanji(selectedDeckId as string, 1, pageSize)}
                class="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          {/if}
        </div>
      {/if}
    </div>
    
    <h3 class="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Add New Kanji</h3>
    
    <!-- KanjiBrowser for adding new kanji -->
    <KanjiBrowser 
      kanjiItems={allKanji.filter(k => !editPageKanjiIds.includes(k.id))} 
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