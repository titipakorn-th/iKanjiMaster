<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  
  // State for dropdown visibility
  let isDropdownOpen = false;
  
  // Toggle the dropdown
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }
  
  // Close the dropdown when clicking outside
  function closeDropdown() {
    isDropdownOpen = false;
  }
  
  // Handle logout
  async function handleLogout() {
    await authStore.logout();
    closeDropdown();
  }
</script>

<div class="relative ml-3">
  <!-- User profile button -->
  <button 
    type="button" 
    class="flex rounded-full bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    on:click={toggleDropdown}
    aria-expanded={isDropdownOpen}
    aria-haspopup="true"
  >
    <span class="sr-only">Open user menu</span>
    <div class="h-8 w-8 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-800">
      {#if $authStore.user}
        <span class="text-indigo-600 dark:text-indigo-300 font-medium">
          {$authStore.user.username.charAt(0).toUpperCase()}
        </span>
      {:else}
        <span class="text-indigo-600 dark:text-indigo-300 font-medium">?</span>
      {/if}
    </div>
  </button>

  <!-- Dropdown menu -->
  {#if isDropdownOpen}
    <div 
      class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-slate-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu" 
      aria-orientation="vertical" 
      aria-labelledby="user-menu-button"
      tabindex="-1"
      on:blur={closeDropdown}
    >
      {#if $authStore.user}
        <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
          Signed in as <span class="font-semibold">{$authStore.user.username}</span>
        </div>
        <div class="border-t border-gray-100 dark:border-gray-700"></div>
      {/if}
      
      <a 
        href="/profile" 
        class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" 
        role="menuitem" 
        tabindex="-1"
        on:click={closeDropdown}
      >
        Your Profile
      </a>
      <a 
        href="/stats" 
        class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" 
        role="menuitem" 
        tabindex="-1"
        on:click={closeDropdown}
      >
        Stats
      </a>
      <a 
        href="/settings" 
        class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" 
        role="menuitem" 
        tabindex="-1"
        on:click={closeDropdown}
      >
        Settings
      </a>
      <button 
        class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700" 
        role="menuitem" 
        tabindex="-1"
        on:click={handleLogout}
      >
        Sign out
      </button>
    </div>
  {/if}
</div> 