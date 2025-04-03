<script lang="ts">
  import StatsDashboard from '$lib/components/StatsDashboard.svelte';
  
  // Sample detailed statistics
  const stats = {
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
      { date: '2023-04-01', count: 8 },
      { date: '2023-04-02', count: 12 },
      { date: '2023-04-03', count: 0 },
      { date: '2023-04-04', count: 5 },
      { date: '2023-04-05', count: 15 },
      { date: '2023-04-06', count: 0 },
      { date: '2023-04-07', count: 0 },
      { date: '2023-04-08', count: 22 },
      { date: '2023-04-09', count: 18 },
      { date: '2023-04-10', count: 14 },
      { date: '2023-04-11', count: 9 },
      { date: '2023-04-12', count: 11 },
      { date: '2023-04-13', count: 13 },
      { date: '2023-04-14', count: 10 },
      { date: '2023-04-15', count: 0 },
      { date: '2023-04-16', count: 0 },
      { date: '2023-04-17', count: 25 },
      { date: '2023-04-18', count: 18 },
      { date: '2023-04-19', count: 21 },
      { date: '2023-04-20', count: 15 },
      { date: '2023-04-21', count: 22 },
      { date: '2023-04-22', count: 18 },
      { date: '2023-04-23', count: 25 },
      { date: '2023-04-24', count: 12 },
      { date: '2023-04-25', count: 20 },
      { date: '2023-04-26', count: 16 },
      { date: '2023-04-27', count: 0 },
      { date: '2023-04-28', count: 23 },
      { date: '2023-04-29', count: 19 },
      { date: '2023-04-30', count: 17 }
    ],
    levelDistribution: [
      { level: 5, count: 35 },
      { level: 4, count: 23 },
      { level: 2, count: 8 },
      { level: 1, count: 0 }
    ]
  };
  
  // Calculate heatmap data
  function generateHeatmap(reviewData: Array<{ date: string; count: number }>) {
    // First get all dates
    const dates = reviewData.map(review => new Date(review.date));
    
    // Find the first and last date of the data
    const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Create a map of date to count
    const countMap = new Map();
    reviewData.forEach(review => {
      countMap.set(review.date, review.count);
    });
    
    // Generate complete date range
    const heatmapData = [];
    const currentDate = new Date(firstDate);
    
    while (currentDate <= lastDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const count = countMap.get(dateString) || 0;
      
      heatmapData.push({
        date: dateString,
        count,
        intensity: count === 0 ? 0 : Math.min(Math.ceil(count / 5), 4) // 0-4 intensity levels
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return heatmapData;
  }
  
  // Generate weekly activity stats
  function generateWeeklyActivity(reviewData: Array<{ date: string; count: number }>) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyCounts = Array(7).fill(0);
    const weeklyTotals = Array(7).fill(0);
    
    reviewData.forEach(review => {
      const date = new Date(review.date);
      const dayOfWeek = date.getDay();
      weeklyCounts[dayOfWeek] += review.count;
      weeklyTotals[dayOfWeek]++;
    });
    
    return dayNames.map((day, index) => ({
      day,
      average: weeklyTotals[index] ? Math.round(weeklyCounts[index] / weeklyTotals[index]) : 0,
      total: weeklyCounts[index]
    }));
  }
  
  // Calculate current and best streak
  function calculateStreaks(reviewData: Array<{ date: string; count: number }>) {
    // Sort data by date
    const sortedData = [...reviewData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentStreak = 0;
    let maxStreak = 0;
    let streakStartDate = null;
    let streakEndDate = null;
    
    // Check if today has reviews
    const today = new Date().toISOString().split('T')[0];
    const hasReviewsToday = sortedData.some(day => day.date === today && day.count > 0);
    
    // Calculate last continuous streak
    let currentDate = new Date(sortedData[sortedData.length - 1].date);
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = sortedData.length - 1; i >= 0; i--) {
      const reviewDate = new Date(sortedData[i].date);
      const expectedDate = new Date(currentDate.getTime());
      
      // Check if this date is the expected date and has reviews
      if (
        reviewDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0] && 
        sortedData[i].count > 0
      ) {
        // If first streak day, set start date
        if (currentStreak === 0) {
          streakEndDate = new Date(reviewDate);
        }
        
        currentStreak++;
        streakStartDate = new Date(reviewDate);
        
        // Move expected date back one day
        currentDate.setTime(currentDate.getTime() - oneDayMs);
      } else {
        break;
      }
    }
    
    // If no reviews today, streak is broken
    if (!hasReviewsToday) {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 0;
    }
    
    return {
      current: currentStreak,
      max: Math.max(maxStreak, currentStreak),
      startDate: streakStartDate,
      endDate: streakEndDate
    };
  }
  
  // Process data
  const heatmapData = generateHeatmap(stats.reviewsByDay);
  const weeklyActivity = generateWeeklyActivity(stats.reviewsByDay);
  const streaks = calculateStreaks(stats.reviewsByDay);
</script>

<div class="max-w-7xl mx-auto">
  <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-8">Your Statistics</h1>
  
  <!-- Overview Statistics section -->
  <StatsDashboard 
    totalKanji={stats.totalKanji}
    learningKanji={stats.learningKanji}
    masteredKanji={stats.masteredKanji}
    currentStreak={stats.currentStreak}
    longestStreak={stats.longestStreak}
    totalReviews={stats.totalReviews}
    correctReviews={stats.correctReviews}
    averageAccuracy={stats.averageAccuracy}
    studyTimeMinutes={stats.studyTimeMinutes}
    dailyGoal={stats.dailyGoal}
    reviewsByDay={stats.reviewsByDay.slice(-7)}
    levelDistribution={stats.levelDistribution}
  />
  
  <!-- Activity Heatmap section -->
  <div class="mt-10">
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">Activity Calendar</h2>
    
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div class="flex flex-wrap justify-between mb-4">
        <div class="text-sm text-slate-600 dark:text-slate-400">
          <span class="font-medium">{stats.reviewsByDay.reduce((sum, day) => sum + day.count, 0)}</span> total reviews over the last {stats.reviewsByDay.length} days
        </div>
        
        <div class="flex items-center space-x-1 text-sm">
          <span class="text-slate-600 dark:text-slate-400">Less</span>
          <div class="w-3 h-3 bg-slate-100 dark:bg-slate-700 rounded-sm"></div>
          <div class="w-3 h-3 bg-indigo-200 dark:bg-indigo-800 rounded-sm"></div>
          <div class="w-3 h-3 bg-indigo-400 dark:bg-indigo-600 rounded-sm"></div>
          <div class="w-3 h-3 bg-indigo-500 dark:bg-indigo-500 rounded-sm"></div>
          <div class="w-3 h-3 bg-indigo-700 dark:bg-indigo-400 rounded-sm"></div>
          <span class="text-slate-600 dark:text-slate-400">More</span>
        </div>
      </div>
      
      <!-- Heatmap Calendar -->
      <div class="grid grid-cols-7 gap-1">
        {#each Array(7) as _, i}
          <div class="h-6 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
          </div>
        {/each}
        
        {#each heatmapData as day, i}
          {#if i === 0}
            <!-- First day might not be Sunday, so add empty cells -->
            {#each Array(new Date(day.date).getDay()) as _}
              <div class="h-6"></div>
            {/each}
          {/if}
          
          <div 
            class={`h-6 rounded-sm ${
              day.intensity === 0 ? 'bg-slate-100 dark:bg-slate-700' : 
              day.intensity === 1 ? 'bg-indigo-200 dark:bg-indigo-800' : 
              day.intensity === 2 ? 'bg-indigo-400 dark:bg-indigo-600' : 
              day.intensity === 3 ? 'bg-indigo-500 dark:bg-indigo-500' : 
              'bg-indigo-700 dark:bg-indigo-400'
            }`}
            title={`${day.date}: ${day.count} reviews`}
          ></div>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Weekly Activity Patterns section -->
  <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Weekly Activity Patterns</h2>
      
      <div class="space-y-4">
        {#each weeklyActivity as day}
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-sm font-medium text-slate-600 dark:text-slate-400">{day.day}</span>
              <span class="text-sm text-slate-600 dark:text-slate-400">avg: {day.average}</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                class="bg-indigo-500 h-2 rounded-full" 
                style="width: {Math.min(100, (day.average / 25) * 100)}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Detailed Streak info -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Current Streak</h2>
      
      <div class="flex items-center mb-6">
        <div class="text-6xl font-bold text-indigo-600 dark:text-indigo-400">{stats.currentStreak}</div>
        <div class="ml-4">
          <div class="text-lg font-semibold">days</div>
          <div class="text-sm text-slate-600 dark:text-slate-400">Best: {stats.longestStreak} days</div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Daily Reviews</div>
          <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
            {Math.round(stats.reviewsByDay.reduce((sum, day) => sum + day.count, 0) / stats.reviewsByDay.length)} avg
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Study Days</div>
          <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
            {stats.reviewsByDay.filter(day => day.count > 0).length} / {stats.reviewsByDay.length}
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Retention Rate</div>
          <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
            {stats.averageAccuracy}%
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Study Time Distribution -->
  <div class="mt-10">
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-6">Learning Progress</h2>
    
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Learning Status -->
        <div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Kanji Status</h3>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="font-medium">New</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">
                {stats.totalKanji - stats.learningKanji - stats.masteredKanji} kanji
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="font-medium">Learning</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">
                {stats.learningKanji} kanji
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="font-medium">Mastered</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">
                {stats.masteredKanji} kanji
              </div>
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div class="h-32 flex items-end">
              <div class="w-1/3 bg-slate-300 dark:bg-slate-600 rounded-t-sm h-full relative flex items-end justify-center" style={`height: ${((stats.totalKanji - stats.learningKanji - stats.masteredKanji) / stats.totalKanji) * 100}%`}>
                <div class="absolute bottom-full mb-1 text-xs">{Math.round(((stats.totalKanji - stats.learningKanji - stats.masteredKanji) / stats.totalKanji) * 100)}%</div>
              </div>
              <div class="w-1/3 bg-amber-500 dark:bg-amber-600 rounded-t-sm h-full relative flex items-end justify-center" style={`height: ${(stats.learningKanji / stats.totalKanji) * 100}%`}>
                <div class="absolute bottom-full mb-1 text-xs">{Math.round((stats.learningKanji / stats.totalKanji) * 100)}%</div>
              </div>
              <div class="w-1/3 bg-emerald-500 dark:bg-emerald-600 rounded-t-sm h-full relative flex items-end justify-center" style={`height: ${(stats.masteredKanji / stats.totalKanji) * 100}%`}>
                <div class="absolute bottom-full mb-1 text-xs">{Math.round((stats.masteredKanji / stats.totalKanji) * 100)}%</div>
              </div>
            </div>
            <div class="flex text-xs text-slate-600 dark:text-slate-400 mt-2">
              <div class="w-1/3 text-center">New</div>
              <div class="w-1/3 text-center">Learning</div>
              <div class="w-1/3 text-center">Mastered</div>
            </div>
          </div>
        </div>
        
        <!-- JLPT Distribution -->
        <div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">JLPT Level Progress</h3>
          
          <div class="space-y-4">
            {#each stats.levelDistribution as level}
              <div>
                <div class="flex justify-between mb-1">
                  <span class="font-medium">N{level.level}</span>
                  <span class="text-sm text-slate-600 dark:text-slate-400">{level.count} kanji</span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    class={`h-2 rounded-full ${
                      level.level === 1 ? 'bg-red-500' : 
                      level.level === 2 ? 'bg-orange-500' : 
                      level.level === 3 ? 'bg-amber-500' : 
                      level.level === 4 ? 'bg-green-500' : 
                      'bg-emerald-500'}`} 
                    style="width: {Math.min(100, (level.count / 100) * 100)}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Study Time -->
        <div>
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-4">Study Time</h3>
          
          <div class="flex flex-col h-full">
            <div class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {Math.floor(stats.studyTimeMinutes / 60)}h {stats.studyTimeMinutes % 60}m
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Total study time
            </div>
            
            <div class="space-y-4 flex-grow">
              <div class="flex justify-between">
                <div class="text-sm font-medium">Per review</div>
                <div class="text-sm">
                  {(stats.studyTimeMinutes / stats.totalReviews).toFixed(1)} minutes
                </div>
              </div>
              
              <div class="flex justify-between">
                <div class="text-sm font-medium">Reviews per hour</div>
                <div class="text-sm">
                  {Math.round(stats.totalReviews / (stats.studyTimeMinutes / 60))}
                </div>
              </div>
              
              <div class="flex justify-between">
                <div class="text-sm font-medium">Avg. daily time</div>
                <div class="text-sm">
                  {Math.round(stats.studyTimeMinutes / stats.reviewsByDay.filter(day => day.count > 0).length)} minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 