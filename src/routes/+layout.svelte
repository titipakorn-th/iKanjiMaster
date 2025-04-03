<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';

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
</script>

<div class="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-200">
	<header class="bg-white dark:bg-slate-800 shadow-sm py-4 px-6 border-b border-slate-200 dark:border-slate-700">
		<div class="container mx-auto flex justify-between items-center">
			<a href="/" class="flex items-center space-x-2">
				<span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">漢字</span>
				<span class="font-semibold text-xl">iKanjiMaster</span>
			</a>

			<nav class="hidden md:flex items-center space-x-8">
				<a href="/" class="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Dashboard</a>
				<a href="/study" class="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Study</a>
				<a href="/browse" class="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Browse Kanji</a>
				<a href="/decks" class="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Decks</a>
				<a href="/stats" class="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Stats</a>
			</nav>

			<div class="flex items-center space-x-4">
				<button 
					class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
					on:click={toggleTheme}
					aria-label="Toggle theme"
				>
					{#if theme === 'dark'}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
						</svg>
					{/if}
				</button>
				
				<button class="block md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>
		</div>
	</header>
	
	<main class="flex-grow container mx-auto px-6 py-8">
		<slot />
	</main>
	
	<footer class="bg-white dark:bg-slate-800 py-8 border-t border-slate-200 dark:border-slate-700">
		<div class="container mx-auto px-6">
			<div class="flex flex-col md:flex-row justify-between items-center">
				<div class="mb-4 md:mb-0">
					<p class="text-sm text-slate-600 dark:text-slate-400">
						&copy; {new Date().getFullYear()} iKanjiMaster. All rights reserved.
					</p>
				</div>
				<div class="flex space-x-6">
					<a href="/about" class="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
						About
					</a>
					<a href="/terms" class="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
						Terms
					</a>
					<a href="/privacy" class="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
						Privacy
					</a>
					<a href="/contact" class="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
						Contact
					</a>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(html) {
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	}
</style>
