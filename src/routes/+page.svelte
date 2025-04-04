<script lang="ts">
  import { onMount } from 'svelte';
  import StatsDashboard from '$lib/components/StatsDashboard.svelte';
  import KanjiCard from '$lib/components/KanjiCard.svelte';
  
  // Loading state and error handling
  let isLoadingKanji = false;
  let error = '';
  
  // Sample data for demonstration
  const dashboardStats = {
    totalKanji: 1235, // Total count from the database - keep this as is
    learningKanji: 0,
    masteredKanji: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalReviews: 0,
    correctReviews: 0,
    averageAccuracy: 0,
    studyTimeMinutes: 0,
    dailyGoal: 20, // Default daily goal
    reviewsByDay: [
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], count: 0 },
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], count: 0 },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], count: 0 },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], count: 0 },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], count: 0 },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], count: 0 },
      { date: new Date().toISOString().split('T')[0], count: 0 }
    ],
    levelDistribution: [
      { level: 5, count: 0 },
      { level: 4, count: 0 },
      { level: 3, count: 0 },
      { level: 2, count: 0 },
      { level: 1, count: 0 }
    ]
  };
  
  // Kanji data with proper structure matching KanjiCard component requirements
  let todaysKanji = [
    {
      id: 'sample1',
      character: '水',
      onyomi: 'スイ',
      kunyomi: 'みず',
      meaning: 'water',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { 
          word: '水曜日', 
          reading: 'すいようび', 
          meaning: 'Wednesday',
          sentence: '今日は水曜日です。',
          sentenceReading: 'きょうはすいようびです。',
          sentenceMeaning: 'Today is Wednesday.'
        },
        { 
          word: '水泳', 
          reading: 'すいえい', 
          meaning: 'swimming',
          sentence: '私は水泳が好きです。',
          sentenceReading: 'わたしはすいえいがすきです。',
          sentenceMeaning: 'I like swimming.'
        },
        { 
          word: '冷水', 
          reading: 'れいすい', 
          meaning: 'cold water',
          sentence: '暑い日には冷水を飲みます。',
          sentenceReading: 'あついひにはれいすいをのみます。',
          sentenceMeaning: 'I drink cold water on hot days.'
        }
      ]
    },
    {
      id: 'sample2',
      character: '火',
      onyomi: 'カ',
      kunyomi: 'ひ',
      meaning: 'fire',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { 
          word: '火曜日', 
          reading: 'かようび', 
          meaning: 'Tuesday',
          sentence: '火曜日に会議があります。',
          sentenceReading: 'かようびにかいぎがあります。',
          sentenceMeaning: 'There is a meeting on Tuesday.'
        },
        { 
          word: '火山', 
          reading: 'かざん', 
          meaning: 'volcano',
          sentence: '日本には多くの火山があります。',
          sentenceReading: 'にほんにはおおくのかざんがあります。',
          sentenceMeaning: 'There are many volcanoes in Japan.'
        },
        { 
          word: '花火', 
          reading: 'はなび', 
          meaning: 'fireworks',
          sentence: '夏には花火大会があります。',
          sentenceReading: 'なつにははなびたいかいがあります。',
          sentenceMeaning: 'In summer, there are fireworks festivals.'
        }
      ]
    },
    {
      id: 'sample3',
      character: '木',
      onyomi: 'モク, ボク',
      kunyomi: 'き',
      meaning: 'tree, wood',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { 
          word: '木曜日', 
          reading: 'もくようび', 
          meaning: 'Thursday',
          sentence: '木曜日に友達と会います。',
          sentenceReading: 'もくようびにともだちとあいます。',
          sentenceMeaning: 'I will meet my friends on Thursday.'
        },
        { 
          word: '木材', 
          reading: 'もくざい', 
          meaning: 'lumber, timber',
          sentence: 'この家は木材で作られています。',
          sentenceReading: 'このいえはもくざいでつくられています。',
          sentenceMeaning: 'This house is made of wood.'
        },
        { 
          word: '木々', 
          reading: 'きぎ', 
          meaning: 'trees',
          sentence: '公園の木々は美しいです。',
          sentenceReading: 'こうえんのきぎはうつくしいです。',
          sentenceMeaning: 'The trees in the park are beautiful.'
        }
      ]
    }
  ];
  
  // Fetch random kanji from the API
  async function fetchRandomKanji() {
    isLoadingKanji = true;
    error = '';
    
    try {
      const response = await fetch('/api/kanji?limit=3');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch kanji data');
      }
      
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('Successfully fetched kanji:', data.data.length);
        todaysKanji = data.data;
      } else {
        console.warn('API returned empty or invalid data:', data);
        // Keep the sample data
      }
    } catch (err) {
      console.error('Error fetching kanji:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
      // Keep the sample data if there's an error
    } finally {
      isLoadingKanji = false;
    }
  }
  
  onMount(() => {
    fetchRandomKanji();
  });
</script>

<div class="space-y-10">
  <!-- Dashboard header -->
  <div>
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to iKanjiMaster</h1>
    <p class="text-slate-600 dark:text-slate-400 max-w-3xl">
      Your personal Kanji learning companion. Track your progress, study efficiently with spaced repetition, and master Japanese characters at your own pace.
    </p>
  </div>
  
  <!-- Quick stats and actions section -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Due today -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Due Today</h2>
      <div class="flex items-center justify-between">
        <div class="text-4xl font-bold text-indigo-600 dark:text-indigo-400">0</div>
        <div class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
          0 New
        </div>
      </div>
      <p class="text-slate-600 dark:text-slate-400 text-sm mt-2 mb-4">
        Ready to begin your kanji journey? Start fresh with your first study session!
      </p>
      <a 
        href="/study" 
        class="block w-full py-2 px-4 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        Start Studying
      </a>
    </div>
    
    <!-- Current streak -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Current Streak</h2>
      <div class="flex items-baseline">
        <div class="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
          {dashboardStats.currentStreak}
        </div>
        <div class="ml-2 text-slate-600 dark:text-slate-400">days</div>
      </div>
      <p class="text-slate-600 dark:text-slate-400 text-sm mt-2 mb-4">
        Keep your streak going! Your longest streak is {dashboardStats.longestStreak} days.
      </p>
      <div class="grid grid-cols-7 gap-1">
        {#each Array(7) as _, i}
          <div class={`h-2 rounded-sm ${i < dashboardStats.currentStreak % 7 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
        {/each}
      </div>
    </div>
    
    <!-- Quick actions -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
      <div class="space-y-3">
        <a 
          href="/browse" 
          class="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <div class="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span class="font-medium">Browse Kanji</span>
        </a>
        
        <a 
          href="/decks" 
          class="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <div class="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span class="font-medium">Manage Decks</span>
        </a>
        
        <a 
          href="/stats" 
          class="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <div class="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span class="font-medium">View Stats</span>
        </a>
        
        <a 
          href="/admin" 
          class="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <div class="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span class="font-medium">Admin Panel</span>
        </a>
      </div>
    </div>
  </div>
  
  <!-- Today's Kanji section -->
  <section class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white">Today's Kanji</h2>
      <a href="/study?jlpt=5" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
        Start Studying →
      </a>
    </div>
    
    {#if isLoadingKanji}
      <div class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    {:else if todaysKanji.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each todaysKanji as kanji}
          <div class="relative">
            <KanjiCard {kanji} />
            <a 
              href={`/study?kanjiId=${kanji.id}`} 
              class="absolute top-2 right-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full p-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition-colors"
              title="Study this kanji"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </a>
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg p-4 mb-4">
        <p>{error}</p>
      </div>
    {:else}
      <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 text-center">
        <p class="text-slate-600 dark:text-slate-400">No kanji available for today's study.</p>
        <a href="/browse" class="mt-2 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">
          Browse kanji →
        </a>
      </div>
    {/if}
  </section>
  
  <!-- Stats dashboard section -->
  <div>
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">Your Progress</h2>
    
    <StatsDashboard 
      totalKanji={dashboardStats.totalKanji}
      learningKanji={dashboardStats.learningKanji}
      masteredKanji={dashboardStats.masteredKanji}
      currentStreak={dashboardStats.currentStreak}
      longestStreak={dashboardStats.longestStreak}
      totalReviews={dashboardStats.totalReviews}
      correctReviews={dashboardStats.correctReviews}
      averageAccuracy={dashboardStats.averageAccuracy}
      studyTimeMinutes={dashboardStats.studyTimeMinutes}
      dailyGoal={dashboardStats.dailyGoal}
      reviewsByDay={dashboardStats.reviewsByDay}
      levelDistribution={dashboardStats.levelDistribution}
    />
  </div>
</div>
