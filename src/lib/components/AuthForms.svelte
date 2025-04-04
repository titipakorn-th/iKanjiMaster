<script lang="ts">
  import { authStore, isAuthenticated, authEvents } from '$lib/stores/auth';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  
  // Form mode
  type FormMode = 'login' | 'register';
  export let initialMode: FormMode = 'login';
  
  // Initialize mode with the passed prop
  let mode = initialMode;
  
  // Update mode when initialMode changes
  $: mode = initialMode;
  
  // Form data
  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  
  // Form state
  let isSubmitting = false;
  let formError = '';
  
  // Set up auth event listeners for redirects
  const unsubscribeLogin = authEvents.on('login', () => {
    goto('/');
  });
  
  const unsubscribeRegister = authEvents.on('register', () => {
    goto('/');
  });
  
  // Clean up event listeners when component is destroyed
  onDestroy(() => {
    unsubscribeLogin();
    unsubscribeRegister();
  });
  
  // Toggle between login and register
  function toggleMode() {
    mode = mode === 'login' ? 'register' : 'login';
    formError = '';
  }
  
  // Handle form submission
  async function handleSubmit() {
    formError = '';
    
    // Basic validation
    if (mode === 'register') {
      if (!username) {
        formError = 'Username is required';
        return;
      }
      
      if (password !== confirmPassword) {
        formError = 'Passwords do not match';
        return;
      }
    }
    
    if (!email) {
      formError = 'Email is required';
      return;
    }
    
    if (!password) {
      formError = 'Password is required';
      return;
    }
    
    // Submit the form
    isSubmitting = true;
    
    try {
      if (mode === 'login') {
        await authStore.login(email, password);
      } else {
        await authStore.register(username, email, password);
      }
      
      // Note: Redirection is now handled by the authEvents system
    } catch (error) {
      formError = error instanceof Error ? error.message : 'An error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
  <div class="mb-6 text-center">
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
      {mode === 'login' ? 'Log In' : 'Create an Account'}
    </h2>
    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
      {mode === 'login' 
        ? 'Sign in to your iKanjiMaster account' 
        : 'Join iKanjiMaster to track your kanji study progress'}
    </p>
  </div>
  
  {#if formError}
    <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
      {formError}
    </div>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if mode === 'register'}
      <div>
        <label for="username" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          bind:value={username}
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                 dark:bg-slate-700 dark:text-white"
          placeholder="Enter your username"
          disabled={isSubmitting}
        />
      </div>
    {/if}
    
    <div>
      <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Email
      </label>
      <input
        id="email"
        type="email"
        bind:value={email}
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
               dark:bg-slate-700 dark:text-white"
        placeholder="your.email@example.com"
        disabled={isSubmitting}
      />
    </div>
    
    <div>
      <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Password
      </label>
      <input
        id="password"
        type="password"
        bind:value={password}
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
               dark:bg-slate-700 dark:text-white"
        placeholder={mode === 'register' ? 'Create a password (min. 8 characters)' : 'Enter your password'}
        disabled={isSubmitting}
      />
    </div>
    
    {#if mode === 'register'}
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          bind:value={confirmPassword}
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                 dark:bg-slate-700 dark:text-white"
          placeholder="Confirm your password"
          disabled={isSubmitting}
        />
      </div>
    {/if}
    
    <button
      type="submit"
      class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors
             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isSubmitting}
    >
      {#if isSubmitting}
        <span class="inline-block animate-spin mr-2">↻</span>
        {mode === 'login' ? 'Logging in...' : 'Creating account...'}
      {:else}
        {mode === 'login' ? 'Log In' : 'Create Account'}
      {/if}
    </button>
    
    <div class="text-center mt-4">
      <button
        type="button"
        class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        on:click={toggleMode}
        disabled={isSubmitting}
      >
        {mode === 'login'
          ? 'Don\'t have an account? Sign up'
          : 'Already have an account? Log in'}
      </button>
    </div>
  </form>
</div> 