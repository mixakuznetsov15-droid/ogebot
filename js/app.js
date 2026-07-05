// ==========================================
//  ГЛАВНАЯ ТОЧКА ВХОДА
// ==========================================

// Дожидаемся полной загрузки DOM
document.addEventListener('DOMContentLoaded', function () {

  // 1. Загружаем прогресс пользователя
  loadProgress(function () {

    // 2. Проверяем серию, ежедневные задания, достижения
    checkStreak();
    updateDailyTasks();
    checkAchievements();

    // 3. Отрисовываем главный экран (он сам запустит загрузку уроков)
    renderHomePath();
  });
});

// --------------------------------------------------
//  ГЛОБАЛЬНЫЕ ФУНКЦИИ, доступные из HTML (onclick)
// --------------------------------------------------
window.goScreen = goScreen;
window.goQuizFromLoaded = goQuizFromLoaded;
window.replayLesson = replayLesson;
window.openChest = openChest;
window.inviteFriend = inviteFriend;
window.askProfessor = askProfessor;
window.openAIChat = openAIChat;
window.nextQ = nextQ;
window.shareBossResult = shareBossResult;
window.closeRewardModal = closeRewardModal;
window.closeProfessorModal = closeProfessorModal;