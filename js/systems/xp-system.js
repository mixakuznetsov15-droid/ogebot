// ==========================================
//  СИСТЕМА ОПЫТА И УРОВНЕЙ
// ==========================================

// Начисление опыта
function addXP(amount) {
  if (amount <= 0) return;

  // Бустер x2 XP, если активен
  if (userProgress.doubleXPUntil && new Date(userProgress.doubleXPUntil) > new Date()) {
    amount *= 2;
  }

  userProgress.xp += amount;
  userProgress.level = Math.floor(userProgress.xp / 200) + 1;

  saveProgress();
  showXPToast(amount);
  checkAchievements();
  incrementDailyCounters(0, amount);
}

// Звание (ранг) по количеству опыта
function getRank(xp) {
  if (xp >= 10000) return 'Легенда';
  if (xp >= 5000) return 'Мастер';
  if (xp >= 3000) return 'Эксперт';
  if (xp >= 500) return 'Ученик';
  return 'Новичок';
}

// Следующий ранг и сколько до него осталось
function getNextRank(xp) {
  var ranks = [
    { name: 'Ученик', min: 500 },
    { name: 'Эксперт', min: 3000 },
    { name: 'Мастер', min: 5000 },
    { name: 'Легенда', min: 10000 }
  ];
  for (var i = 0; i < ranks.length; i++) {
    if (xp < ranks[i].min) return ranks[i];
  }
  return null;
}