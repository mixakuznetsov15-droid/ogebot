// ==========================================
//  ДОСТИЖЕНИЯ
// ==========================================

var ACHIEVEMENTS_LIST = [
  { id: 'first_login', icon: '🏆', title: 'Первый вход', cond: function() { return true; } },
  { id: 'first_lesson', icon: '🏆', title: 'Первый урок', cond: function() { return userProgress.totalAnswered > 0; } },
  { id: 'first_theme', icon: '🏆', title: 'Первая завершённая тема', cond: function() { return Object.keys(userProgress.completedLessons).length > 0; } },
  { id: 'streak3', icon: '🔥', title: '3 дня подряд', cond: function() { return (userProgress.streak||0) >= 3; } },
  { id: 'streak7', icon: '🔥', title: '7 дней подряд', cond: function() { return (userProgress.streak||0) >= 7; } },
  { id: 'streak14', icon: '🔥', title: '14 дней подряд', cond: function() { return (userProgress.streak||0) >= 14; } },
  { id: 'streak30', icon: '🔥', title: '30 дней подряд', cond: function() { return (userProgress.streak||0) >= 30; } },
  { id: 'solve50', icon: '📚', title: 'Решить 50 вопросов', cond: function() { return userProgress.totalAnswered >= 50; }, max: 50, progress: function() { return Math.min(userProgress.totalAnswered, 50); } },
  { id: 'solve100', icon: '📚', title: 'Решить 100 вопросов', cond: function() { return userProgress.totalAnswered >= 100; }, max: 100, progress: function() { return Math.min(userProgress.totalAnswered, 100); } },
  { id: 'solve500', icon: '📚', title: 'Решить 500 вопросов', cond: function() { return userProgress.totalAnswered >= 500; }, max: 500, progress: function() { return Math.min(userProgress.totalAnswered, 500); } },
  { id: 'solve1000', icon: '📚', title: 'Решить 1000 вопросов', cond: function() { return userProgress.totalAnswered >= 1000; }, max: 1000, progress: function() { return Math.min(userProgress.totalAnswered, 1000); } },
  { id: 'xp500', icon: '⭐', title: 'Получить 500 XP', cond: function() { return userProgress.xp >= 500; }, max: 500, progress: function() { return Math.min(userProgress.xp, 500); } },
  { id: 'xp1000', icon: '⭐', title: 'Получить 1000 XP', cond: function() { return userProgress.xp >= 1000; }, max: 1000, progress: function() { return Math.min(userProgress.xp, 1000); } },
  { id: 'xp3000', icon: '⭐', title: 'Получить 3000 XP', cond: function() { return userProgress.xp >= 3000; }, max: 3000, progress: function() { return Math.min(userProgress.xp, 3000); } },
  { id: 'xp5000', icon: '⭐', title: 'Получить 5000 XP', cond: function() { return userProgress.xp >= 5000; }, max: 5000, progress: function() { return Math.min(userProgress.xp, 5000); } },
  { id: 'all_themes', icon: '🌍', title: 'Завершить все темы', cond: function() { var all = getAllLessons(); return all.length > 0 && Object.keys(userProgress.completedLessons).length >= all.length; } },
  { id: 'pred4', icon: '🎯', title: 'Получить прогноз 4', cond: function() { return getPredictedGrade() !== '—' && parseInt(getPredictedGrade()) >= 4; } },
  { id: 'pred5', icon: '🎯', title: 'Получить прогноз 5', cond: function() { return getPredictedGrade() !== '—' && parseInt(getPredictedGrade()) >= 5; } }
];

// Проверить и выдать достижения
function checkAchievements() {
  if (!userProgress.achievements) userProgress.achievements = {};
  var now = new Date().toISOString();
  ACHIEVEMENTS_LIST.forEach(function(a) {
    if (userProgress.achievements[a.id] && userProgress.achievements[a.id].unlocked) return;
    var unlocked = a.cond();
    var progress = a.progress ? a.progress() : (unlocked ? (a.max || 1) : 0);
    var wasUnlocked = userProgress.achievements[a.id]?.unlocked;
    if (!userProgress.achievements[a.id]) {
      userProgress.achievements[a.id] = { progress: progress, unlocked: unlocked, date: unlocked ? now : null, chestGiven: false };
    } else {
      userProgress.achievements[a.id].progress = progress;
      if (unlocked && !wasUnlocked) {
        userProgress.achievements[a.id].unlocked = true;
        userProgress.achievements[a.id].date = now;
        showToast('🏆 Получено достижение: ' + a.title);
        if (!userProgress.achievements[a.id].chestGiven) {
          giveChest('achievement');
          userProgress.achievements[a.id].chestGiven = true;
          showToast('🎁 Сундук за достижение!');
        }
      }
    }
  });
  saveProgress();
}