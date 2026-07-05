// ==========================================
//  ХРАНИЛИЩЕ ПРОГРЕССА ПОЛЬЗОВАТЕЛЯ
// ==========================================

// Глобальный объект прогресса
var userProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastDate: '',
  completedLessons: {},
  totalAnswered: 0,
  totalCorrect: 0,
  bossCompleted: false,
  freezes: 1,
  lastFreezeMonday: '',
  chests: [],
  invitedFriend: false,
  dailyTasksDate: '',
  dailyTasks: { solve10: false, earn50XP: false, loginToday: false },
  dailyTasksCollected: { solve10: false, earn50XP: false, loginToday: false },
  allDailyTasksDone: false,
  dailyQuestions: 0,
  dailyXP: 0,
  achievements: {},
  lastDailyChestDate: '',
  streakChestsGiven: {},
  friends: [],
  freeHints: 0,
  rareBadges: [],
  doubleXPUntil: null
};

// Сохранить прогресс
function saveProgress() {
  var data = JSON.stringify(userProgress);
  if (isTelegram && tgApp.CloudStorage) {
    tgApp.CloudStorage.setItem('progress', data, function(){});
  } else {
    try { localStorage.setItem('geo_progress', data); } catch(e) {}
  }
}

// Загрузить прогресс
function loadProgress(callback) {
  if (isTelegram && tgApp.CloudStorage) {
    tgApp.CloudStorage.getItem('progress', function(err, val) {
      if (!err && val) {
        try { userProgress = JSON.parse(val); } catch(e) {}
      }
      refreshFreeze();
      callback();
    });
  } else {
    try {
      var saved = localStorage.getItem('geo_progress');
      if (saved) userProgress = JSON.parse(saved);
    } catch(e) {}
    refreshFreeze();
    callback();
  }
}

// Получить понедельник недели, к которой принадлежит дата
function getMonday(date) {
  var d = new Date(date);
  d.setHours(0,0,0,0);
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0,10);
}

// Обновление заморозки серии (раз в неделю)
function refreshFreeze() {
  var todayMonday = getMonday(new Date());
  if (!userProgress.lastFreezeMonday || userProgress.lastFreezeMonday < todayMonday) {
    userProgress.freezes = 1;
    userProgress.lastFreezeMonday = todayMonday;
    saveProgress();
  }
}