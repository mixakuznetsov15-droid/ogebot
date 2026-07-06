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
// Запуск профессора Гео
var professor = new ProfessorSystem(PROFESSOR_MESSAGES, {
  default: 'images/professor_default.png',
  happy: 'images/professor_happy.png',
  sad: 'images/professor_sad.png',
  hint: 'images/professor_hint.png'
});
professor.init();
professor.showGreeting();

// Подсказка профессора (вызывается при нажатии кнопки в квизе)
window.askProfessor = function() {
  if (!window.quizState) window.quizState = {};
  if (!window.quizState.hintLevel) window.quizState.hintLevel = 0;
  window.quizState.hintLevel++;
  var hint = professor.getHint(window.quizState.topicKey, window.quizState.hintLevel);
  var explainBox = document.getElementById('ai-explain');
  if (explainBox) {
    explainBox.style.display = 'block';
    explainBox.textContent = hint.text;
  }
};

// Открыть чат с профессором (заглушка, можно потом развить)
window.openAIChat = function() {
  professor.showExplanation('Давай разберём это задание вместе!');
};