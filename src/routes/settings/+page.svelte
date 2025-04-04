<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, isAuthenticated, isLoading } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  
  // User preferences from database schema
  type UserPreferences = {
    theme: 'light' | 'dark' | 'system';
    furiganaPosition: 'above' | 'inline';
    fontSize: 'small' | 'medium' | 'large';
    studyGoalDaily: number;
  };
  
  // Default preferences
  const defaultPreferences: UserPreferences = {
    theme: 'system',
    furiganaPosition: 'above',
    fontSize: 'medium',
    studyGoalDaily: 20
  };
  
  // User preferences (loaded from API)
  let preferences: UserPreferences = { ...defaultPreferences };
  
  // Loading state for preferences
  let loadingPreferences = true;
  let savingPreferences = false;
  let saveSuccess = false;
  let saveError = '';
  
  // Check if user is authenticated and redirect if not
  onMount(async () => {
    await authStore.checkAuth();
    
    if (!$isAuthenticated) {
      goto('/auth');
      return;
    }
    
    await fetchUserPreferences();
  });
  
  // Fetch user preferences
  async function fetchUserPreferences() {
    loadingPreferences = true;
    
    try {
      if (!$authStore.user) return;
      
      const response = await fetch(`/api/user/preferences`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.preferences) {
          preferences = data.preferences;
        } else {
          // If no preferences found, use default
          preferences = { ...defaultPreferences };
        }
      } else {
        console.error('Failed to fetch preferences');
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      loadingPreferences = false;
    }
  }
  
  // Save user preferences
  async function savePreferences() {
    savingPreferences = true;
    saveSuccess = false;
    saveError = '';
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        saveSuccess = true;
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          saveSuccess = false;
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
      saveError = error instanceof Error ? error.message : 'Failed to save preferences. Please try again.';
    } finally {
      savingPreferences = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - iKanjiMaster</title>
</svelte:head>

{#if $isLoading}
  <div class="flex justify-center items-center h-64">
    <div class="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
  </div>
{:else if $isAuthenticated}
  <div class="max-w-4xl mx-auto">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>
      
      {#if loadingPreferences}
        <div class="flex justify-center items-center h-32">
          <div class="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      {:else}
        <form on:submit|preventDefault={savePreferences} class="space-y-6">
          <!-- Display section -->
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Display Preferences</h2>
            
            <div class="space-y-4">
              <!-- Theme preference -->
              <div>
                <label for="theme" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Theme
                </label>
                <select 
                  id="theme" 
                  bind:value={preferences.theme}
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-slate-700 dark:text-white"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <!-- Font size -->
              <div>
                <label for="fontSize" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Font Size
                </label>
                <select 
                  id="fontSize" 
                  bind:value={preferences.fontSize}
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-slate-700 dark:text-white"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Study preferences -->
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Study Preferences</h2>
            
            <div class="space-y-4">
              <!-- Furigana position -->
              <div>
                <label for="furiganaPosition" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Furigana Position
                </label>
                <select 
                  id="furiganaPosition" 
                  bind:value={preferences.furiganaPosition}
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-slate-700 dark:text-white"
                >
                  <option value="above">Above (Traditional)</option>
                  <option value="inline">Inline (In parentheses)</option>
                </select>
              </div>
              
              <!-- Daily goal -->
              <div>
                <label for="studyGoalDaily" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Daily Study Goal (Cards)
                </label>
                <input 
                  type="number" 
                  id="studyGoalDaily" 
                  bind:value={preferences.studyGoalDaily}
                  min="5"
                  max="100"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <!-- Status messages -->
          {#if saveSuccess}
            <div class="p-3 bg-green-100 text-green-700 rounded-md text-sm">
              Settings saved successfully!
            </div>
          {/if}
          
          {#if saveError}
            <div class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {saveError}
            </div>
          {/if}
          
          <!-- Save button -->
          <div class="flex justify-end">
            <button
              type="submit"
              class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
                     disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={savingPreferences}
            >
              {#if savingPreferences}
                <span class="inline-block animate-spin mr-2">↻</span> Saving...
              {:else}
                Save Changes
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if} 