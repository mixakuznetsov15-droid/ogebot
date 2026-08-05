// ==========================================
//  СИСТЕМА ОПЫТА (XP)
// ==========================================

function addXP(amount) {
  // Проверяем активный бустер на множитель XP
  var multiplier = 1;
  var now = Date.now();
  if (userProgress.boosters && userProgress.boosters.type === 'xp2' && userProgress.boosters.expires > now) {
    multiplier = 2;
  } else if (userProgress.boosters && userProgress.boosters.expires <= now) {
    // Бустер истёк — сбрасываем
    userProgress.boosters = { type: null, expires: 0 };
  }

  var gained = Math.floor(amount * multiplier);
  userProgress.xp = (userProgress.xp || 0) + gained;
  
  // Проверка повышения уровня (каждые 100 XP = новый уровень)
  var newLevel = Math.floor(userProgress.xp / 100) + 1;
  if (newLevel > userProgress.level) {
    userProgress.level = newLevel;
    window.sessionLevelUp = true; // флаг для отображения в результатах
    if (typeof showToast === 'function') {
      showToast('🎉 Новый уровень!');
    }
  }

  saveProgress();
  return gained;
}