<script lang="ts">
  // Props for statistics
  export let totalKanji: number = 0;
  export let learningKanji: number = 0;
  export let masteredKanji: number = 0;
  export let currentStreak: number = 0;
  export let longestStreak: number = 0;
  export let totalReviews: number = 0;
  export let correctReviews: number = 0;
  export let averageAccuracy: number = 0;
  export let studyTimeMinutes: number = 0;
  export let dailyGoal: number = 20;
  export let reviewsByDay: Array<{ date: string; count: number }> = [];
  export let levelDistribution: Array<{ level: number; count: number }> = [];
  
  // Computed properties for progress metrics
  $: progressPercentage = totalKanji > 0 ? Math.round((masteredKanji / totalKanji) * 100) : 0;
  $: accuracy = correctReviews > 0 && totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
  
  // Format time in hours and minutes
  function formatStudyTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
  
  // Format date from ISO string
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<div class="w-full">
  <!-- Overview Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Total Progress Card -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Progress</h3>
      <div class="flex items-end justify-between mb-2">
        <div>
          <span class="text-3xl font-bold text-slate-900 dark:text-white">{progressPercentage}%</span>
        </div>
        <div class="text-sm text-slate-500 dark:text-slate-400">
          {masteredKanji} / {totalKanji} Kanji
        </div>
      </div>
      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div 
          class="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
          style="width: {progressPercentage}%"
        ></div>
      </div>
    </div>
    
    <!-- Current Streak Card -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current Streak</h3>
      <div class="flex items-end justify-between">
        <div class="flex items-baseline">
          <span class="text-3xl font-bold text-slate-900 dark:text-white">{currentStreak}</span>
          <span class="ml-1 text-lg text-slate-600 dark:text-slate-400">days</span>
        </div>
        <div class="text-sm text-slate-500 dark:text-slate-400">
          Best: {longestStreak} days
        </div>
      </div>
      <div class="flex mt-4">
        {#each Array(Math.min(7, currentStreak)) as _, i}
          <div class="h-3 w-full bg-indigo-600 rounded-sm mr-1"></div>
        {/each}
        {#each Array(Math.max(0, 7 - currentStreak)) as _, i}
          <div class="h-3 w-full bg-slate-300 dark:bg-slate-700 rounded-sm mr-1"></div>
        {/each}
      </div>
    </div>
    
    <!-- Accuracy Card -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Review Accuracy</h3>
      <div class="flex items-baseline">
        <span class="text-3xl font-bold text-slate-900 dark:text-white">{accuracy}%</span>
      </div>
      <div class="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-2">
        <div>{correctReviews} correct</div>
        <div>{totalReviews} total</div>
      </div>
      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
        <div 
          class="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
          style="width: {accuracy}%"
        ></div>
      </div>
    </div>
    
    <!-- Study Time Card -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Study Time</h3>
      <div class="flex items-baseline">
        <span class="text-3xl font-bold text-slate-900 dark:text-white">{formatStudyTime(studyTimeMinutes)}</span>
      </div>
      <div class="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-2">
        <div>{totalReviews > 0 ? (studyTimeMinutes / totalReviews).toFixed(1) : '0'} min/review avg</div>
        <div>{studyTimeMinutes > 0 ? Math.round(totalReviews / (studyTimeMinutes / 60)) : 0} reviews/hour</div>
      </div>
    </div>
  </div>
  
  <!-- Progress Breakdown Section -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <!-- Learning Status -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Learning Status</h3>
      
      <div class="space-y-4">
        <div>
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400">New</span>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              {totalKanji - learningKanji - masteredKanji} kanji
            </span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              class="bg-blue-500 h-2 rounded-full" 
              style="width: {totalKanji > 0 ? ((totalKanji - learningKanji - masteredKanji) / totalKanji) * 100 : 0}%"
            ></div>
          </div>
        </div>
        
        <div>
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Learning</span>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              {learningKanji} kanji
            </span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              class="bg-amber-500 h-2 rounded-full" 
              style="width: {totalKanji > 0 ? (learningKanji / totalKanji) * 100 : 0}%"
            ></div>
          </div>
        </div>
        
        <div>
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Mastered</span>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              {masteredKanji} kanji
            </span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              class="bg-emerald-500 h-2 rounded-full" 
              style="width: {totalKanji > 0 ? (masteredKanji / totalKanji) * 100 : 0}%"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Daily Activity -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Daily Activity</h3>
      
      {#if reviewsByDay.length > 0}
        <div class="flex items-end justify-between h-40">
          {#each reviewsByDay.slice(-7) as day}
            <div class="flex flex-col items-center">
              <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {day.count}
              </div>
              <div class="w-8 bg-indigo-500 rounded-t-sm" style="height: {(day.count / dailyGoal) * 100}%"></div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formatDate(day.date)}
              </div>
            </div>
          {/each}
        </div>
        
        <div class="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Daily Goal: <span class="font-medium">{dailyGoal} reviews</span>
          </div>
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Avg: <span class="font-medium">
              {reviewsByDay.length > 0 
                ? Math.round(reviewsByDay.reduce((sum, day) => sum + day.count, 0) / reviewsByDay.length) 
                : 0}
            </span>
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500">
          No activity data yet
        </div>
      {/if}
    </div>
    
    <!-- JLPT Level Distribution -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">JLPT Level Progress</h3>
      
      {#if levelDistribution.length > 0}
        <div class="space-y-4">
          {#each levelDistribution as level}
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-slate-600 dark:text-slate-400">N{level.level}</span>
                <span class="text-sm text-slate-600 dark:text-slate-400">
                  {level.count} kanji
                </span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  class={`h-2 rounded-full ${level.level === 1 ? 'bg-red-500' : 
                    level.level === 2 ? 'bg-orange-500' : 
                    level.level === 3 ? 'bg-amber-500' : 
                    level.level === 4 ? 'bg-green-500' : 'bg-emerald-500'}`}
                  style="width: {Math.min(100, (level.count / 100) * 100)}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500">
          No JLPT data available
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Recent Activity and Tips Section -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Recent Sessions -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Learning Tips</h3>
      
      <div class="space-y-4">
        <div class="flex items-start space-x-3">
          <div class="mt-1 bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Study Consistently</h4>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Short daily sessions are more effective than cramming once a week.
            </p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="mt-1 bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Spaced Repetition</h4>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Trust the algorithm. Review cards when they're due to optimize memory.
            </p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="mt-1 bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Create Mnemonics</h4>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Personal memory aids improve retention. Create a story for difficult kanji.
            </p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="mt-1 bg-indigo-100 dark:bg-indigo-900 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-medium text-slate-900 dark:text-white">Learn Radicals</h4>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Understanding kanji components makes learning new characters easier.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Leaderboard -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Achievement Badges</h3>
      
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div class="flex flex-col items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <div class="w-12 h-12 flex items-center justify-center bg-amber-100 dark:bg-amber-900 rounded-full mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-900 dark:text-white text-center">First Steps</span>
        </div>
        
        <div class="flex flex-col items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <div class="w-12 h-12 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 rounded-full mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-900 dark:text-white text-center">Time Keeper</span>
        </div>
        
        <div class="flex flex-col items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <div class="w-12 h-12 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 rounded-full mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-900 dark:text-white text-center">Perfectionist</span>
        </div>
        
        <div class="flex flex-col items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <div class="w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-900 dark:text-white text-center">On Fire!</span>
        </div>
        
        <div class="flex flex-col items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <div class="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-900 dark:text-white text-center">Collector</span>
        </div>
        
        <div class="flex flex-col items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <div class="w-12 h-12 flex items-center justify-center bg-purple-100 dark:bg-purple-900 rounded-full mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-xs font-medium text-slate-900 dark:text-white text-center">Speed Learner</span>
        </div>
      </div>
    </div>
  </div>
</div> 