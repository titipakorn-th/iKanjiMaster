<script lang="ts">
  import AuthForms from '$lib/components/AuthForms.svelte';
  import { authStore, isAuthenticated } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Determine initial form mode based on URL parameter
  $: initialMode = $page.url.searchParams.has('register') ? 'register' : 'login';
  
  // Redirect to home if already authenticated
  onMount(async () => {
    // Check authentication status
    await authStore.checkAuth();
    
    // If authenticated, redirect to home
    if ($isAuthenticated) {
      goto('/');
    }
  });
</script>

<svelte:head>
  <title>Sign In or Register - iKanjiMaster</title>
</svelte:head>

<div class="py-12">
  <div class="max-w-md mx-auto mb-8 text-center">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white">iKanjiMaster</h1>
    <p class="mt-2 text-slate-600 dark:text-slate-400">
      Track your kanji learning journey with personalized study sessions
    </p>
  </div>
  
  <AuthForms initialMode={initialMode} />
</div> 