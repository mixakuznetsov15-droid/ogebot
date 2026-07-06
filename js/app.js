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

  // 4. Инициализируем Профессора Гео
  var professor = new ProfessorSystem(PROFESSOR_MESSAGES, {
    default: 'images/professor_default.png',
    happy: 'images/professor_happy.png',
    sad: 'images/professor_sad.png',
    hint: 'images/professor_hint.png'
  });
  professor.init();

  // Показываем приветствие, если сегодня ещё не видели
  professor.showGreeting();

  // Делаем профессора доступным глобально
  window.professor = professor;

  // 5. Глобальные функции, которые могут вызываться из других скриптов
  window.openAIChat = function() {
    // Простейшая заглушка — открывает чат с профессором
    if (window.professor) {
      window.professor.showExplanation('Давай разберём это задание вместе!');
    }
  };

  // Функция askProfessor НЕ переопределяется здесь!
  // Она уже определена в quiz-system.js (с полноценной логикой подсказок)
});

// --------------------------------------------------
//  ГЛОБАЛЬНЫЕ ФУНКЦИИ, доступные из HTML (onclick)
// --------------------------------------------------
window.goScreen = goScreen;
window.goQuizFromLoaded = goQuizFromLoaded;
window.replayLesson = replayLesson;
window.openChest = openChest;
window.inviteFriend = inviteFriend;
window.nextQ = nextQ;
window.shareBossResult = shareBossResult;
window.closeRewardModal = closeRewardModal;
window.closeProfessorModal = closeProfessorModal;