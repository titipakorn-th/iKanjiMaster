<script lang="ts">
  import StatsDashboard from '$lib/components/StatsDashboard.svelte';
  import KanjiCard from '$lib/components/KanjiCard.svelte';
  
  // Sample data for demonstration
  const dashboardStats = {
    totalKanji: 2136,
    learningKanji: 153,
    masteredKanji: 78,
    currentStreak: 5,
    longestStreak: 12,
    totalReviews: 542,
    correctReviews: 456,
    averageAccuracy: 84,
    studyTimeMinutes: 320,
    dailyGoal: 20,
    reviewsByDay: [
      { date: '2023-04-20', count: 15 },
      { date: '2023-04-21', count: 22 },
      { date: '2023-04-22', count: 18 },
      { date: '2023-04-23', count: 25 },
      { date: '2023-04-24', count: 12 },
      { date: '2023-04-25', count: 20 },
      { date: '2023-04-26', count: 16 }
    ],
    levelDistribution: [
      { level: 5, count: 35 },
      { level: 4, count: 23 },
      { level: 3, count: 12 },
      { level: 2, count: 8 },
      { level: 1, count: 0 }
    ]
  };
  
  // Sample kanji for today's studies
  const todaysKanji = [
    {
      character: '水',
      onyomi: 'スイ',
      kunyomi: 'みず',
      meaning: 'water',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '水曜日', reading: 'すいようび', meaning: 'Wednesday' },
        { word: '水泳', reading: 'すいえい', meaning: 'swimming' },
        { word: '冷水', reading: 'れいすい', meaning: 'cold water' }
      ]
    },
    {
      character: '火',
      onyomi: 'カ',
      kunyomi: 'ひ',
      meaning: 'fire',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '火曜日', reading: 'かようび', meaning: 'Tuesday' },
        { word: '火山', reading: 'かざん', meaning: 'volcano' },
        { word: '花火', reading: 'はなび', meaning: 'fireworks' }
      ]
    },
    {
      character: '木',
      onyomi: 'モク, ボク',
      kunyomi: 'き',
      meaning: 'tree, wood',
      jlptLevel: 5,
      strokeCount: 4,
      examples: [
        { word: '木曜日', reading: 'もくようび', meaning: 'Thursday' },
        { word: '木材', reading: 'もくざい', meaning: 'lumber, timber' },
        { word: '木々', reading: 'きぎ', meaning: 'trees' }
      ]
    }
  ];
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
        <div class="text-4xl font-bold text-indigo-600 dark:text-indigo-400">15</div>
        <div class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
          5 New
        </div>
      </div>
      <p class="text-slate-600 dark:text-slate-400 text-sm mt-2 mb-4">
        You have 15 kanji reviews due today and 5 new kanji to learn.
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
          <span class="font-medium">View Statistics</span>
        </a>
      </div>
    </div>
  </div>
  
  <!-- Today's kanji section -->
  <div>
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">Today's Kanji</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each todaysKanji as kanji, i}
        <div>
          <KanjiCard 
            character={kanji.character}
            onyomi={kanji.onyomi}
            kunyomi={kanji.kunyomi}
            meaning={kanji.meaning}
            jlptLevel={kanji.jlptLevel}
            strokeCount={kanji.strokeCount}
            examples={kanji.examples}
          />
        </div>
      {/each}
    </div>
  </div>
  
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
