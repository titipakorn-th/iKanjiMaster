<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, isAuthenticated, isLoading } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  
  // Form data
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let email = '';
  let username = '';
  
  // Form states
  let isUpdatingProfile = false;
  let isChangingPassword = false;
  let profileUpdateSuccess = false;
  let passwordChangeSuccess = false;
  let profileError = '';
  let passwordError = '';
  
  // Check if user is authenticated and redirect if not
  onMount(async () => {
    await authStore.checkAuth();
    
    if (!$isAuthenticated) {
      goto('/auth');
      return;
    }
    
    // Initialize form with current user data
    if ($authStore.user) {
      email = $authStore.user.email;
      username = $authStore.user.username;
    }
  });
  
  // Update profile information
  async function updateProfile() {
    profileError = '';
    profileUpdateSuccess = false;
    
    if (!username || !email) {
      profileError = 'Username and email are required';
      return;
    }
    
    isUpdatingProfile = true;
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      // Update local user data (in a real app, this would be done via the API)
      if ($authStore.user) {
        authStore.setUser({
          ...$authStore.user,
          username,
          email
        });
      }
      
      profileUpdateSuccess = true;
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        profileUpdateSuccess = false;
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      profileError = 'Failed to update profile. Please try again.';
    } finally {
      isUpdatingProfile = false;
    }
  }
  
  // Change password
  async function changePassword() {
    passwordError = '';
    passwordChangeSuccess = false;
    
    if (!currentPassword) {
      passwordError = 'Current password is required';
      return;
    }
    
    if (!newPassword) {
      passwordError = 'New password is required';
      return;
    }
    
    if (newPassword.length < 8) {
      passwordError = 'New password must be at least 8 characters';
      return;
    }
    
    if (newPassword !== confirmPassword) {
      passwordError = 'Passwords do not match';
      return;
    }
    
    isChangingPassword = true;
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      passwordChangeSuccess = true;
      
      // Reset form and success message after 3 seconds
      setTimeout(() => {
        passwordChangeSuccess = false;
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
      }, 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      passwordError = 'Failed to change password. Please try again.';
    } finally {
      isChangingPassword = false;
    }
  }
</script>

<svelte:head>
  <title>Account Settings - iKanjiMaster</title>
</svelte:head>

{#if $isLoading}
  <div class="flex justify-center items-center h-64">
    <div class="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
  </div>
{:else if $isAuthenticated}
  <div class="max-w-4xl mx-auto">
    <div class="mb-6">
      <a href="/profile" class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Profile
      </a>
    </div>
    
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account Settings</h1>
    
    <!-- Profile information -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Information</h2>
      
      {#if profileUpdateSuccess}
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
          Profile updated successfully!
        </div>
      {/if}
      
      {#if profileError}
        <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {profileError}
        </div>
      {/if}
      
      <form on:submit|preventDefault={updateProfile} class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            bind:value={username}
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   dark:bg-slate-700 dark:text-white"
            disabled={isUpdatingProfile}
          />
        </div>
        
        <div>
          <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   dark:bg-slate-700 dark:text-white"
            disabled={isUpdatingProfile}
          />
        </div>
        
        <div class="flex justify-end">
          <button
            type="submit"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUpdatingProfile}
          >
            {#if isUpdatingProfile}
              <span class="inline-block animate-spin mr-2">↻</span> Updating...
            {:else}
              Update Profile
            {/if}
          </button>
        </div>
      </form>
    </div>
    
    <!-- Change password -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Change Password</h2>
      
      {#if passwordChangeSuccess}
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
          Password changed successfully!
        </div>
      {/if}
      
      {#if passwordError}
        <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {passwordError}
        </div>
      {/if}
      
      <form on:submit|preventDefault={changePassword} class="space-y-4">
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            bind:value={currentPassword}
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   dark:bg-slate-700 dark:text-white"
            disabled={isChangingPassword}
          />
        </div>
        
        <div>
          <label for="newPassword" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            bind:value={newPassword}
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   dark:bg-slate-700 dark:text-white"
            disabled={isChangingPassword}
          />
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Password must be at least 8 characters
          </p>
        </div>
        
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={confirmPassword}
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   dark:bg-slate-700 dark:text-white"
            disabled={isChangingPassword}
          />
        </div>
        
        <div class="flex justify-end">
          <button
            type="submit"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isChangingPassword}
          >
            {#if isChangingPassword}
              <span class="inline-block animate-spin mr-2">↻</span> Updating...
            {:else}
              Change Password
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 