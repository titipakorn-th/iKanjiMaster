<script lang="ts">
  import { onMount } from 'svelte';
  import StudySession from '$lib/components/StudySession.svelte';
  import { authStore } from '$lib/stores/auth';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // Study session state
  let sessionStarted = false;
  let selectedMode: 'kanji-to-meaning' | 'meaning-to-kanji' | 'reading-to-kanji' = 'kanji-to-meaning';
  let selectedDeckId = '';
  let cardLimit = 20;
  let includeNew = true;
  let includeDue = true;
  let isLoading = false;
  let error = '';
  let sessionData: {
    reviewHistory: Array<{
      kanjiId: string;
      quality: number;
      timestamp: string;
      elapsedMs: number;
    }>,
    totalTime: number,
    deckId: string,
    studyMode: string
  } | null = null;
  
  // Timer variables
  let elapsedTime = 0;
  let timerInterval: NodeJS.Timeout | null = null;
  let showCompletionScreen = false;
  
  // Stats for current session
  let currentStats = {
    totalKanjiStudied: 0,
    totalSessions: 0,
    averageAccuracy: 0
  };
  
  // Kanji data for the study session
  type KanjiItem = {
    id: string;
    character: string;
    meaning: string;
    onyomi: string | null;
    kunyomi: string | null;
    jlptLevel: number | null;
    strokeCount: number | null;
    examples: Array<{
      word: string;
      reading: string;
      meaning: string;
      sentence?: string;
      sentenceReading?: string;
      sentenceMeaning?: string;
      furigana?: Record<string, string>;
    }> | null;
    sentence_examples?: Array<{
      word: string;
      reading: string;
      meaning: string;
      sentence?: string;
      sentenceReading?: string;
      sentenceMeaning?: string;
      furigana?: Record<string, string>;
    }> | null;
  };
  
  let studyItems: KanjiItem[] = [];
  
  // User decks from the database
  let decks: {
    id: string;
    name: string;
    description: string;
    count: number;
  }[] = [];

  // New deck form state
  let isCreatingDeck = false;
  let newDeckName = '';
  let newDeckDescription = '';
  let creatingDeckError = '';
  
  // Get preselected parameters from URL
  const { kanjiId, jlptLevel } = data.studyParams;
  
  // Load user's decks from the database
  async function loadUserDecks() {
    try {
      const response = await fetch('/api/decks');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.decks)) {
          // Get user decks
          decks = data.decks.map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description || 'User deck',
            count: d.kanjiCount || 0
          }));
          
          // If no decks available, show a message encouraging deck creation
          if (decks.length === 0) {
            error = '';  // Clear any existing error
            isCreatingDeck = true;  // Automatically show deck creation form
          }
        }
      } else {
        // If API returns an error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load decks');
      }
    } catch (e) {
      console.error('Error loading user decks:', e);
      error = e instanceof Error ? e.message : 'Failed to load decks';
    }
  }

  // Create a new deck
  async function createDeck() {
    if (!newDeckName.trim()) {
      creatingDeckError = 'Please enter a deck name';
      return;
    }

    creatingDeckError = '';
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

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add the new deck to the list
          decks = [
            ...decks,
            {
              id: data.deck.id,
              name: data.deck.name,
              description: data.deck.description || '',
              count: 0
            }
          ];
          
          // Select the new deck
          selectedDeckId = data.deck.id;
          
          // Reset form
          newDeckName = '';
          newDeckDescription = '';
          isCreatingDeck = false;
          
          // Clear any previous errors
          error = '';
        } else {
          throw new Error(data.message || 'Failed to create deck');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create deck');
      }
    } catch (e) {
      console.error('Error creating deck:', e);
      creatingDeckError = e instanceof Error ? e.message : 'Failed to create deck';
    }
  }
  
  // Fetch kanji data from API
  async function fetchKanjiForStudy() {
    isLoading = true;
    error = '';
    
    try {
      // If a specific kanji ID was requested, fetch just that one
      if (kanjiId) {
        console.log(`Fetching specific kanji with ID: ${kanjiId}`);
        const response = await fetch(`/api/kanji?id=${kanjiId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error response:', errorData);
          throw new Error(errorData.error || `Failed to fetch kanji with ID ${kanjiId}`);
        }
        
        const data = await response.json();
        console.log('API response for kanji by ID:', data);
        
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          throw new Error(`Kanji with ID ${kanjiId} not found`);
        }
        
        studyItems = data.data
          .map((kanji: any) => {
            // Make sure both examples arrays are arrays if present
            const examples = kanji.examples ? 
              (typeof kanji.examples === 'string' ? JSON.parse(kanji.examples) : kanji.examples) : 
              [];
              
            const sentenceExamples = kanji.sentence_examples ? 
              (typeof kanji.sentence_examples === 'string' ? JSON.parse(kanji.sentence_examples) : kanji.sentence_examples) : 
              [];
              
            return {
              id: kanji.id,
              character: kanji.character,
              meaning: kanji.meaning,
              onyomi: kanji.onyomi || null,
              kunyomi: kanji.kunyomi || null,
              jlptLevel: kanji.jlptLevel || null,
              strokeCount: kanji.strokeCount || null,
              examples: examples,
              sentence_examples: sentenceExamples.length > 0 ? sentenceExamples : undefined
            } as KanjiItem;
          })
          .sort(() => Math.random() - 0.5)
          .slice(0, cardLimit);
        
        sessionStarted = true;
        return;
      }
      
      // For regular study, fetch kanji for the selected deck
      if (!selectedDeckId) {
        throw new Error('No deck selected');
      }
      
      // Fetch kanji from the selected deck
      let apiUrl = `/api/decks/${selectedDeckId}/kanji?limit=${cardLimit}`;
      
      // Add JLPT filter if specified in URL params
      if (jlptLevel) {
        apiUrl += `&jlpt=${jlptLevel}`;
      }
      
      console.log(`Fetching kanji for deck with URL: ${apiUrl}`);
      const response = await fetch(apiUrl);
      
      if (response.status === 404) {
        throw new Error('Deck-specific endpoint not found. Please make sure your server is up to date.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch kanji data');
      }
      
      const data = await response.json();
      console.log('API response for kanji search:', data);
      
      const kanjiData = data.kanji || data.data; // Support both formats
      
      if (!kanjiData || !Array.isArray(kanjiData) || kanjiData.length === 0) {
        const selectedDeck = decks.find(d => d.id === selectedDeckId);
        const deckName = selectedDeck ? selectedDeck.name : 'selected deck';
        throw new Error(`No kanji found in "${deckName}". Please add kanji to this deck first.`);
      }
      
      // Process examples to ensure sentence examples are available
      studyItems = kanjiData
        .map((kanji: any) => {
          // Make sure both examples arrays are arrays if present
          const examples = kanji.examples ? 
            (typeof kanji.examples === 'string' ? JSON.parse(kanji.examples) : kanji.examples) : 
            [];
            
          const sentenceExamples = kanji.sentence_examples ? 
            (typeof kanji.sentence_examples === 'string' ? JSON.parse(kanji.sentence_examples) : kanji.sentence_examples) : 
            [];
            
          return {
            id: kanji.id,
            character: kanji.character,
            meaning: kanji.meaning,
            onyomi: kanji.onyomi || null,
            kunyomi: kanji.kunyomi || null,
            jlptLevel: kanji.jlptLevel || null,
            strokeCount: kanji.strokeCount || null,
            examples: examples,
            sentence_examples: sentenceExamples.length > 0 ? sentenceExamples : undefined
          } as KanjiItem;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, cardLimit);
      
      sessionStarted = true;
    } catch (err: unknown) {
      console.error('Error fetching kanji:', err);
      error = err instanceof Error ? err.message : 'Failed to load kanji for study session';
      sessionStarted = false;
    } finally {
      isLoading = false;
    }
  }
  
  // Start study session
  function startSession() {
    fetchKanjiForStudy();
  }
  
  // Handle session completion
  async function handleSessionComplete(event: CustomEvent) {
    console.log('Session complete event received');
    
    // Stop the timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // Get data from the event
    const reviewHistory = event.detail.reviewHistory;
    const reviewHistoryArray = Object.entries(reviewHistory).map(([kanjiId, quality]) => {
      return {
        kanjiId,
        quality: Number(quality),
        timestamp: new Date().toISOString(),
        elapsedMs: elapsedTime
      };
    });
    
    console.log('Review history array to save:', reviewHistoryArray);
    
    // Create session data object
    const newSessionData = {
      reviewHistory: reviewHistoryArray,
      totalTime: elapsedTime / 1000, // Convert to seconds
      deckId: selectedDeckId,
      studyMode: selectedMode
    };
    
    // Save the original session data for debugging
    sessionData = { ...newSessionData };
    
    // Show loading state
    isLoading = true;
    error = '';
    
    try {
      // Send the save request
      const response = await fetch('/api/study/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSessionData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error saving study session:', data);
        isLoading = false;
        
        // Extract useful debug info if available
        if (data.debugTips) {
          console.log('Debug tips:', data.debugTips);
        }
        
        // If there are kanji IDs with issues, try to fix them
        if (data.kanjiIds && data.kanjiIds.length > 0) {
          const fixed = await fixKanjiErrors(data.kanjiIds);
          
          if (fixed) {
            // Retry the save
            return handleSessionComplete(event);
          }
        }
        
        // Show error with detailed information
        error = handleSaveError(data);
        return;
      }
      
      // Update stats if they were returned from the server
      if (data.stats) {
        currentStats = data.stats;
        console.log('Updated stats:', currentStats);
      }
      
      // Refresh auth store to update streak in UI
      await authStore.checkAuth();
      
      // Show success
      console.log('Study session saved successfully:', data);
      showCompletionScreen = true;
      isLoading = false;
    } catch (e) {
      console.error('Error saving study session:', e);
      error = e instanceof Error ? e.message : 'An unexpected error occurred';
      isLoading = false;
    }
  }
  
  // Select a deck
  function selectDeck(deckId: string) {
    selectedDeckId = deckId;
  }
  
  // Auto-select the first deck on mount, or use URL parameters if provided
  onMount(() => {
    // Load user decks first
    loadUserDecks().then(() => {
      // If a specific kanji ID was requested, start the session immediately
      if (kanjiId) {
        fetchKanjiForStudy();
        return;
      }
      
      // If decks are available and no deck is selected yet, select the first one
      if (decks.length > 0 && !selectedDeckId) {
        selectedDeckId = decks[0].id;
      } 
      // Auto-show deck creation form handled in loadUserDecks function
    });
  });

  // Format error message for display
  function formatErrorMessage(message: string) {
    if (!message) return '';
    
    let errorInfo = '';
    
    if (message.includes('FOREIGN KEY constraint failed')) {
      errorInfo = `<p>There was an issue with your study session. The system is trying to fix this automatically.</p>`;
      
      if (message.includes('kanjiIds')) {
        errorInfo += `<p>Some kanji couldn't be linked to your account correctly. Please try again in a moment.</p>`;
      }
    } else if (message.includes('debugLink') || message.includes('fixLink')) {
      // Handle API error responses with debug info
      errorInfo = `<p>There was an issue saving your study session. The system is trying to fix this automatically.</p>`;
      
      if (message.includes('debugTips')) {
        errorInfo += `<p>Please try again in a moment.</p>`;
      }
    } else {
      errorInfo = `<p>${message}</p>`;
    }
    
    return errorInfo;
  }

  // Handle save errors - show a friendly message with details
  function handleSaveError(data: any) {
    // Format error info for display
    let errorInfo = '';
    
    if (data.error) {
      errorInfo = `<p>${data.error}</p>`;
      
      // Add troubleshooting tips
      if (data.error.includes('FOREIGN KEY constraint failed')) {
        errorInfo += `<p class="mt-2">This usually means the kanji you're studying isn't properly connected to your account.</p>`;
        
        // Extract kanji IDs if present
        if (data.kanjiIds && data.kanjiIds.length > 0) {
          errorInfo += `<p class="mt-2">The system is attempting to fix this automatically. Please try again in a moment.</p>`;
        }
      }
      
      // Add debug tips if available
      if (data.debugTips) {
        errorInfo += `<p class="mt-2 text-indigo-800 dark:text-indigo-400">${data.debugTips}</p>`;
      }
    } else {
      errorInfo = `<p>An unknown error occurred while saving your study session.</p>`;
    }
    
    return errorInfo;
  }

  async function fixKanjiErrors(ids: string[]) {
    try {
      if (!selectedDeckId) {
        console.error('Cannot fix kanji errors: No deck selected');
        return false;
      }
      
      const fixResponse = await fetch('/api/decks/add-kanji', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckId: selectedDeckId,
          kanjiIds: ids
        })
      });
      
      if (!fixResponse.ok) {
        console.error('Failed to fix kanji errors:', await fixResponse.json());
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Error while fixing kanji errors:', e);
      return false;
    }
  }

  // Format time in seconds to MM:SS format
  function formatTime(timeInMs: number): string {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
</script>

<div>
  {#if !sessionStarted}
    <!-- Study configuration -->
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">Start Study Session</h1>
      
      {#if error}
        <!-- Error display -->
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <a href="/api/kanji/test" target="_blank" class="text-red-700 underline">Check available kanji</a>
            <span class="mx-1">|</span>
            <a href="/api/kanji/create-sample" target="_blank" class="text-red-700 underline">Create sample kanji</a>
            <span class="mx-1">|</span>
            <button 
              class="text-red-700 underline"
              on:click={() => {
                const kanjiIds = Object.keys(sessionData?.reviewHistory || {});
                if (kanjiIds.length === 0) {
                  alert('No review data to check');
                  return;
                }
                
                fetch('/api/kanji/check-ids', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: kanjiIds })
                })
                .then(res => res.json())
                .then(data => {
                  console.log('Kanji ID check results:', data);
                  alert(`Found ${data.existingCount} valid IDs out of ${kanjiIds.length}`);
                })
                .catch(err => {
                  console.error('Error checking kanji IDs:', err);
                  alert('Error checking kanji IDs: ' + err);
                });
              }}
            >
              Debug review data
            </button>
          </div>
        </div>
      {/if}
      
      <!-- Deck selection -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Your Decks</h2>
          
          {#if !isCreatingDeck}
            <button 
              on:click={() => isCreatingDeck = true}
              class="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              Create New Deck
            </button>
          {/if}
        </div>
        
        {#if isCreatingDeck}
          <div class="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <h3 class="text-md font-medium text-slate-900 dark:text-white mb-3">Create a New Deck</h3>
            
            {#if creatingDeckError}
              <div class="mb-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                {creatingDeckError}
              </div>
            {/if}
            
            <div class="space-y-3">
              <div>
                <label for="deckName" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Deck Name *
                </label>
                <input 
                  type="text" 
                  id="deckName" 
                  bind:value={newDeckName}
                  placeholder="e.g., JLPT N5, Animals, etc."
                  class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label for="deckDescription" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description (optional)
                </label>
                <textarea 
                  id="deckDescription" 
                  bind:value={newDeckDescription}
                  placeholder="Describe your deck..."
                  class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 text-slate-900 dark:text-white"
                  rows="2"
                ></textarea>
              </div>
              
              <div class="flex space-x-3">
                <button 
                  on:click={createDeck}
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Create Deck
                </button>
                
                <button 
                  on:click={() => {
                    isCreatingDeck = false;
                    newDeckName = '';
                    newDeckDescription = '';
                    creatingDeckError = '';
                  }}
                  class="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        {/if}
        
        {#if decks.length === 0}
          <div class="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p class="text-yellow-800 dark:text-yellow-200">
              Welcome to iKanjiMaster! Please create your first study deck above to get started.
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each decks as deck}
              <button 
                class={`text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedDeckId === deck.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                on:click={() => selectDeck(deck.id)}
              >
                <div class="font-medium">{deck.name}</div>
                <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">{deck.description}</div>
                <div class="text-xs text-indigo-600 dark:text-indigo-400 mt-2">{deck.count} kanji</div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Study options -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Study Options</h2>
        
        {#if !selectedDeckId && decks.length > 0}
          <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
            <p class="text-yellow-800 dark:text-yellow-200">
              Please select a deck from above to configure your study session.
            </p>
          </div>
        {:else if selectedDeckId}
          <div class="space-y-6">
            <!-- Add Kanji to Deck (only show if a deck is selected) -->
            <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 class="text-md font-medium text-green-800 dark:text-green-200 mb-2">
                Add Kanji to {decks.find(d => d.id === selectedDeckId)?.name || 'Selected Deck'}
              </h3>
              
              <p class="text-green-700 dark:text-green-300 mb-3 text-sm">
                Your deck has {decks.find(d => d.id === selectedDeckId)?.count || 0} kanji. 
                Add more kanji to study with this deck.
              </p>
              
              <div class="flex space-x-2">
                <button
                  on:click={async () => {
                    try {
                      if (!selectedDeckId) {
                        alert('Please select a deck first');
                        return;
                      }
                      
                      const confirmed = confirm('This will fetch 10 kanji from the database and add them to your selected deck. Continue?');
                      if (!confirmed) return;
                      
                      // First, get 10 kanji from the database
                      const kanjiResponse = await fetch('/api/kanji?limit=10');
                      if (!kanjiResponse.ok) {
                        throw new Error('Failed to fetch kanji');
                      }
                      
                      const kanjiData = await kanjiResponse.json();
                      if (!kanjiData.data || kanjiData.data.length === 0) {
                        throw new Error('No kanji found in the database');
                      }
                      
                      // Extract kanji IDs
                      const kanjiIds = kanjiData.data.map((k: any) => k.id);
                      
                      // Add kanji to the selected deck
                      const addResponse = await fetch('/api/decks/add-kanji', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          deckId: selectedDeckId,
                          kanjiIds
                        })
                      });
                      
                      if (!addResponse.ok) {
                        const errorData = await addResponse.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Failed to add kanji to deck');
                      }
                      
                      const result = await addResponse.json();
                      
                      // Update the deck count in the UI
                      decks = decks.map(deck => {
                        if (deck.id === selectedDeckId) {
                          return {
                            ...deck,
                            count: deck.count + result.added
                          };
                        }
                        return deck;
                      });
                      
                      alert(`${result.added} kanji added to ${decks.find(d => d.id === selectedDeckId)?.name || 'Selected Deck'}`);
                    } catch (e) {
                      console.error('Error adding kanji to deck:', e);
                      alert('Error adding kanji to deck: ' + (e instanceof Error ? e.message : String(e)));
                    }
                  }}
                >
                  Add Kanji
                </button>
              </div>
            </div>
            
            <!-- Study mode selection -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Study Mode
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label class={`
                  flex items-center p-3 rounded-lg border-2 cursor-pointer
                  ${selectedMode === 'kanji-to-meaning' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                    : 'border-slate-200 dark:border-slate-700'}
                `}>
                  <input 
                    type="radio" 
                    name="studyMode" 
                    value="kanji-to-meaning" 
                    bind:group={selectedMode}
                    class="hidden" 
                  />
                  <span class="block w-full text-center">Kanji → Meaning</span>
                </label>
                
                <label class={`
                  flex items-center p-3 rounded-lg border-2 cursor-pointer
                  ${selectedMode === 'meaning-to-kanji' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                    : 'border-slate-200 dark:border-slate-700'}
                `}>
                  <input 
                    type="radio" 
                    name="studyMode" 
                    value="meaning-to-kanji" 
                    bind:group={selectedMode}
                    class="hidden" 
                  />
                  <span class="block w-full text-center">Meaning → Kanji</span>
                </label>
                
                <label class={`
                  flex items-center p-3 rounded-lg border-2 cursor-pointer
                  ${selectedMode === 'reading-to-kanji' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                    : 'border-slate-200 dark:border-slate-700'}
                `}>
                  <input 
                    type="radio" 
                    name="studyMode" 
                    value="reading-to-kanji" 
                    bind:group={selectedMode}
                    class="hidden" 
                  />
                  <span class="block w-full text-center">Reading → Kanji</span>
                </label>
              </div>
            </div>
            
            <!-- Card limit -->
            <div>
              <label for="cardLimit" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Number of Cards ({cardLimit})
              </label>
              <input 
                type="range" 
                id="cardLimit" 
                min="5" 
                max="100" 
                step="5" 
                bind:value={cardLimit}
                class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
            
            <!-- Include options -->
            <div class="flex flex-wrap gap-4 mb-6">
              <label class="flex items-center">
                <input type="checkbox" bind:checked={includeNew} class="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500" />
                <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Include new cards</span>
              </label>
              
              <label class="flex items-center">
                <input type="checkbox" bind:checked={includeDue} class="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500" />
                <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Include due reviews</span>
              </label>
            </div>
            
            <!-- Start button -->
            <div class="flex justify-center">
              <button 
                on:click={startSession}
                class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-lg"
                disabled={!selectedDeckId || decks.length === 0 || (!includeNew && !includeDue) || isLoading}
              >
                {#if isLoading}
                  <span class="inline-block animate-spin mr-2">↻</span> Loading...
                {:else if decks.length === 0}
                  Create a Deck First
                {:else if !selectedDeckId}
                  Select a Deck to Start
                {:else}
                  Start Studying
                {/if}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Study session -->
    <StudySession 
      kanjiItems={studyItems}
      studyMode={selectedMode}
      deckName={decks.find(d => d.id === selectedDeckId)?.name || 'Study Session'}
      on:complete={handleSessionComplete}
    />
  {/if}

  <!-- Study Session Complete Modal -->
  {#if showCompletionScreen}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Study Session Complete!</h2>
        
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-slate-700 dark:text-slate-300">Cards reviewed:</span>
            <span class="font-medium">{sessionData?.reviewHistory.length || 0}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-slate-700 dark:text-slate-300">Correct answers:</span>
            <span class="font-medium">{sessionData?.reviewHistory.filter(h => h.quality === 5).length || 0}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-slate-700 dark:text-slate-300">Accuracy:</span>
            <span class="font-medium">{Math.round((sessionData?.reviewHistory.filter(h => h.quality === 5).length || 0) / Math.max(1, sessionData?.reviewHistory.length || 0) * 100)}%</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-700 dark:text-slate-300">Study time:</span>
            <span class="font-medium">{formatTime(sessionData?.totalTime || 0)}</span>
          </div>
        </div>
        
        <div class="flex flex-col gap-3">
          <button 
            class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
            on:click={() => (showCompletionScreen = false)}
          >
            Done
          </button>
          <a 
            href="/decks"
            class="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-2 px-4 rounded-lg transition-colors text-center"
          >
            Return to Decks
          </a>
          <button 
            class="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
            on:click={() => {
              window.open('/api/debug/user-progress', '_blank');
            }}
          >
            Debug: Check Kanji Progress
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>