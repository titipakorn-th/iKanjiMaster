<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, isAuthenticated, isLoading } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  
  // User stats (to be loaded from API)
  let stats = {
    totalKanjiStudied: 0,
    totalSessions: 0,
    currentStreak: 0,
    averageAccuracy: 0,
    lastStudyDate: null as Date | null
  };
  
  // Loading state for stats
  let loadingStats = true;
  
  // Date formatter
  const dateFormatter = new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Format date for display
  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return 'Never';
    return dateFormatter.format(new Date(dateStr));
  }
  
  // Check if user is authenticated and redirect if not
  onMount(async () => {
    await authStore.checkAuth();
    
    if (!$isAuthenticated) {
      goto('/auth');
      return;
    }
    
    // Load user stats
    await fetchUserStats();
  });
  
  // Fetch user stats
  async function fetchUserStats() {
    loadingStats = true;
    
    try {
      // Real API call to get user stats
      const response = await fetch('/api/user/stats');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          stats = data.stats;
        }
      } else {
        // If the stats API is not implemented yet, we'll just show zeros
        console.log('Stats API not available, showing default values');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      loadingStats = false;
    }
  }
</script>

<svelte:head>
  <title>Your Profile - iKanjiMaster</title>
</svelte:head>

{#if $isLoading}
  <div class="flex justify-center items-center h-64">
    <div class="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
  </div>
{:else if $isAuthenticated && $authStore.user}
  <div class="max-w-4xl mx-auto">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex flex-col md:flex-row md:items-center mb-6">
        <div class="flex items-center">
          <div class="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center mr-6">
            <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
              {$authStore.user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-1">{$authStore.user.username}</h1>
            <p class="text-slate-500 dark:text-slate-400">{$authStore.user.email}</p>
          </div>
        </div>
        
        <!-- Action buttons -->
        <div class="md:ml-auto mt-4 md:mt-0">
          <div class="flex space-x-3">
            <a 
              href="/profile/account" 
              class="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Manage Account
            </a>
            <a 
              href="/settings" 
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Settings
            </a>
          </div>
        </div>
      </div>
      
      <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Member Since</p>
            <p class="font-medium text-slate-900 dark:text-white">{formatDate($authStore.user.createdAt)}</p>
          </div>
          
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Last Login</p>
            <p class="font-medium text-slate-900 dark:text-white">{formatDate($authStore.user.lastLogin) || 'Now'}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Study Statistics</h2>
      
      {#if loadingStats}
        <div class="flex justify-center items-center h-32">
          <div class="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Kanji Studied</p>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalKanjiStudied}</p>
          </div>
          
          <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Streak</p>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{$authStore.user.streak || 0} days</p>
          </div>
          
          <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Study Sessions</p>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalSessions}</p>
          </div>
          
          <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Average Accuracy</p>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.averageAccuracy}%</p>
          </div>
          
          <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Last Study Session</p>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatDate($authStore.user.lastStudyDate)}</p>
          </div>
        </div>
        
        <div class="flex justify-center">
          <a 
            href="/study" 
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Studying
          </a>
        </div>
      {/if}
    </div>
  </div>
{/if} 