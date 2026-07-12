// ==========================================
//  ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
// ==========================================

// Обновление состояния ежедневных заданий
function updateDailyTasks() {
  var today = new Date().toISOString().slice(0,10);
  if (!userProgress.dailyTasksDate || userProgress.dailyTasksDate !== today) {
    userProgress.dailyTasksDate = today;
    userProgress.dailyTasks = { solve10: false, earn50XP: false, loginToday: true };
    userProgress.dailyTasksCollected = { solve10: false, earn50XP: false, loginToday: false };
    userProgress.allDailyTasksDone = false;
    saveProgress();
  }
  var tasks = userProgress.dailyTasks || {};
  var collected = userProgress.dailyTasksCollected || {};

  var dailyXP = (userProgress.dailyXP || 0);
  var dailyQuestions = (userProgress.dailyQuestions || 0);

  if (dailyQuestions >= 10 && !tasks.solve10) {
    tasks.solve10 = true;
    if (!collected.solve10) {
      collected.solve10 = true;
      addXP(20);
    }
  }
  if (dailyXP >= 50 && !tasks.earn50XP) {
    tasks.earn50XP = true;
    if (!collected.earn50XP) {
      collected.earn50XP = true;
      addXP(20);
    }
  }
  if (!tasks.loginToday) {
    tasks.loginToday = true;
    if (!collected.loginToday) {
      collected.loginToday = true;
      addXP(20);
    }
  }

  if (tasks.solve10 && tasks.earn50XP && tasks.loginToday && !userProgress.allDailyTasksDone) {
    userProgress.allDailyTasksDone = true;
    addXP(100);
    giveChest('achievement');
    showToast('🎁 Сундук за все задания дня!');

    // Реакция профессора: все ежедневные задания выполнены
    if (typeof professor !== 'undefined') {
      professor.onDailyTaskDone();
    }
  }
  saveProgress();
}

// Увеличение счётчиков ежедневных заданий
function incrementDailyCounters(questionsCount, xpAmount) {
  var today = new Date().toISOString().slice(0,10);
  if (userProgress.dailyTasksDate !== today) {
    userProgress.dailyTasksDate = today;
    userProgress.dailyQuestions = 0;
    userProgress.dailyXP = 0;
  }
  userProgress.dailyQuestions = (userProgress.dailyQuestions || 0) + questionsCount;
  userProgress.dailyXP = (userProgress.dailyXP || 0) + xpAmount;
  saveProgress();
  updateDailyTasks();
}