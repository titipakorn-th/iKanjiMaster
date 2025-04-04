<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { authStore, isAuthenticated, isLoading } from '$lib/stores/auth';
	import UserMenuDropdown from '$lib/components/UserMenuDropdown.svelte';
	import { browser } from '$app/environment';

	// Theme state
	let theme: 'light' | 'dark' = 'light';

	// Toggle theme function
	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		applyTheme();
	}

	// Apply current theme to document
	function applyTheme() {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	// Initialize theme on mount
	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		if (savedTheme) {
			theme = savedTheme as 'light' | 'dark';
		} else if (prefersDark) {
			theme = 'dark';
		}

		applyTheme();
	});

	// Check authentication on mount
	onMount(async () => {
		if (browser) {
			await authStore.checkAuth();
		}
	});

	// List of navigation items
	const navItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Study', href: '/study' },
		{ label: 'Browse', href: '/browse' },
		{ label: 'Decks', href: '/decks' },
		{ label: 'Stats', href: '/stats' },
		{ label: 'Profile', href: '/profile' },
		{ label: 'Settings', href: '/settings' }
	];
</script>

<svelte:head>
	<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>漢</text></svg>" />
	<link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>漢</text></svg>" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
	<header class="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="flex items-center">
							<span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">i</span>
							<span class="text-2xl font-bold text-slate-800 dark:text-white">KanjiMaster</span>
						</a>
					</div>
					<nav class="ml-6 flex space-x-8">
						{#each navItems as item}
							<a
								href={item.href}
								class={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
									$page.url.pathname === item.href || 
									($page.url.pathname.startsWith(item.href) && item.href !== '/')
										? 'border-indigo-500 text-gray-900 dark:text-white'
										: 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-100'
								}`}
							>
								{item.label}
							</a>
						{/each}
					</nav>
				</div>
				<div class="flex items-center">
					<button 
						class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mr-4"
						on:click={toggleTheme}
						aria-label="Toggle theme"
					>
						{#if theme === 'dark'}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-700" viewBox="0 0 20 20" fill="currentColor">
								<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
							</svg>
						{/if}
					</button>
					{#if $isLoading}
						<div class="animate-pulse h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
					{:else if $isAuthenticated}
						<UserMenuDropdown />
					{:else}
						<a 
							href="/auth" 
							class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
						>
							Sign in
						</a>
						<span class="text-gray-400 dark:text-gray-600 mx-2">|</span>
						<a 
							href="/auth?register" 
							class="text-sm font-medium text-slate-800 dark:text-white hover:text-black dark:hover:text-gray-200"
						>
							Register
						</a>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<slot />
	</main>

	<footer class="bg-white dark:bg-slate-800 shadow-inner">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="border-t border-slate-200 dark:border-slate-700 pt-6">
				<p class="text-center text-sm text-slate-500 dark:text-slate-400">
					© {new Date().getFullYear()} iKanjiMaster. All rights reserved.
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(html) {
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	}
</style>

<!-- SVG Icon Definitions (hidden) -->
<div class="hidden">
	<svg xmlns="http://www.w3.org/2000/svg">
		<defs>
			<!-- Home icon -->
			<symbol id="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
				<polyline points="9 22 9 12 15 12 15 22"></polyline>
			</symbol>
			
			<!-- Study icon -->
			<symbol id="icon-study" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
				<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
			</symbol>
			
			<!-- Decks icon -->
			<symbol id="icon-decks" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
				<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
			</symbol>
			
			<!-- Stats icon -->
			<symbol id="icon-stats" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M18 20V10"></path>
				<path d="M12 20V4"></path>
				<path d="M6 20v-6"></path>
			</symbol>
			
			<!-- Profile icon -->
			<symbol id="icon-profile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
				<circle cx="12" cy="7" r="4"></circle>
			</symbol>
			
			<!-- Settings icon -->
			<symbol id="icon-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="3"></circle>
				<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
			</symbol>
		</defs>
	</svg>
</div>
