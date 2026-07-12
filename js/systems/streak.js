// ==========================================
//  СИСТЕМА СЕРИЙ (STREAK)
// ==========================================

// Проверка и обновление серии
function checkStreak() {
  var today = new Date().toISOString().slice(0,10);
  if (userProgress.lastDate === today) return;

  var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  var oldStreak = userProgress.streak || 0;

  if (userProgress.lastDate === yesterday) {
    userProgress.streak++;
  } else if (userProgress.lastDate !== today) {
    if (userProgress.freezes > 0) {
      userProgress.freezes = 0;
      userProgress.lastFreezeMonday = getMonday(new Date());
      userProgress.streak++;
    } else {
      userProgress.streak = 1;
    }
  }

  userProgress.lastDate = today;
  saveProgress();

  // Если серия увеличилась – профессор реагирует
  if (userProgress.streak > oldStreak && typeof professor !== 'undefined') {
    professor.onStreak(userProgress.streak);
  }

  checkAchievements();
  giveDailyChest();
  giveStreakChests();
}

// Ежедневный сундук (один раз в день)
function giveDailyChest() {
  var today = new Date().toISOString().slice(0,10);
  if (userProgress.lastDailyChestDate === today) return;
  userProgress.lastDailyChestDate = today;
  giveChest('daily');
  saveProgress();
}

// Сундуки за серию (3, 7, 14, 30 дней)
function giveStreakChests() {
  var streak = userProgress.streak || 0;
  var given = userProgress.streakChestsGiven || {};
  var thresholds = [3, 7, 14, 30];
  for (var i = 0; i < thresholds.length; i++) {
    var t = thresholds[i];
    if (streak >= t && !given[t]) {
      giveChest('streak');
      given[t] = true;
      showToast('🎁 Сундук за серию ' + t + ' дней!');
    }
  }
  userProgress.streakChestsGiven = given;
  saveProgress();
}