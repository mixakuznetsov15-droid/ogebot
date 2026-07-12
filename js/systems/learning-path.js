// ==========================================
//  ПЕРСОНАЛЬНЫЙ МАРШРУТ ОБУЧЕНИЯ
// ==========================================

/**
 * Возвращает объект следующего рекомендуемого действия.
 * @returns {{ text: string, action: Function | null, disabled: boolean } | null}
 */
function getNextAction() {
  var allLessons = getAllLessons();
  if (!allLessons || allLessons.length === 0) return null;

  var completed = userProgress.completedLessons || {};
  var theoryRead = userProgress.theoryRead || {};

  // Проходим по темам по порядку
  for (var i = 0; i < allLessons.length; i++) {
    var lesson = allLessons[i];
    var key = lesson.title;
    var isCompleted = completed[key];
    var isTheoryRead = theoryRead[key];

    // 1. Теория не прочитана
    if (!isTheoryRead) {
      return {
        text: '📚 Изучить тему «' + key + '»',
        action: function() {
          openLessonTheory(i);
        },
        disabled: false
      };
    }

    // 2. Теория прочитана, но практика не начата
    if (!isCompleted) {
      return {
        text: '📝 Решить тренировку («' + key + '»)',
        action: function() {
          goQuizFromLoaded(i);
        },
        disabled: false
      };
    }

    // 3. Урок завершён, но есть ошибки (score < total)
    if (isCompleted.score < isCompleted.total) {
      return {
        text: '🔄 Повторить ошибки («' + key + '»)',
        action: function() {
          goQuizFromLoaded(i);  // Повтор того же урока
        },
        disabled: false
      };
    }

    // 4. Урок завершён идеально — переходим к следующему
    // (цикл сам перейдёт к следующему элементу)
  }

  // Все уроки пройдены без ошибок
  // Проверяем ежедневные задания
  var tasks = userProgress.dailyTasks || {};
  var allTasksDone = tasks.solve10 && tasks.earn50XP && tasks.loginToday;
  if (!allTasksDone) {
    return {
      text: '🎯 Выполни оставшиеся ежедневные задания',
      action: function() {
        goScreen('s-home'); // просто остаться на главной, задания видны
      },
      disabled: false
    };
  }

  // Всё сделано
  return {
    text: '🌟 Отличная работа! Возвращайся завтра за новым заданием.',
    action: null,
    disabled: true
  };
}