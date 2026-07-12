// ==========================================
//  СИСТЕМА УМНОГО ПОВТОРЕНИЯ (Smart Review)
// ==========================================

// Интервалы повторений (в днях) для последовательных успешных повторений
var REVIEW_INTERVALS = [1, 3, 7, 14, 30];

/**
 * Обновить данные повторения после завершения темы.
 * @param {string} topicTitle - название темы
 * @param {number} score - правильные ответы
 * @param {number} total - всего вопросов
 */
function updateReviewData(topicTitle, score, total) {
  if (!userProgress.reviewData) userProgress.reviewData = {};

  var data = userProgress.reviewData[topicTitle] || {
    repetitions: 0,
    mastery: 0,
    lastDate: null,
    nextReviewDate: null
  };

  var today = new Date().toISOString().slice(0,10);
  var accuracy = score / total;

  // Уровень освоения: скользящее среднее
  data.mastery = Math.round((data.mastery * data.repetitions + accuracy * 100) / (data.repetitions + 1));
  data.lastDate = today;

  if (score === total) {
    // Идеальное прохождение — увеличиваем счётчик повторений
    data.repetitions++;
    var intervalIndex = Math.min(data.repetitions - 1, REVIEW_INTERVALS.length - 1);
    var days = REVIEW_INTERVALS[intervalIndex];
    var next = new Date();
    next.setDate(next.getDate() + days);
    data.nextReviewDate = next.toISOString().slice(0,10);
  } else {
    // Были ошибки — освоение падает, повторение завтра
    data.mastery = Math.max(0, data.mastery - 10);
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    data.nextReviewDate = tomorrow.toISOString().slice(0,10);
    // Не сбрасываем repetitions, но интервал не увеличиваем
  }

  userProgress.reviewData[topicTitle] = data;
  saveProgress();
}

/**
 * Получить список тем, которые нужно повторить сегодня.
 * @returns {Array<string>} массив названий тем
 */
function getTodayReviewTopics() {
  if (!userProgress.reviewData) return [];

  var today = new Date().toISOString().slice(0,10);
  var result = [];

  Object.keys(userProgress.reviewData).forEach(function(title) {
    var d = userProgress.reviewData[title];
    if (d.nextReviewDate && d.nextReviewDate <= today) {
      result.push(title);
    }
  });

  return result;
}

/**
 * Найти индекс темы по названию в списке всех уроков.
 * @param {string} title
 * @returns {number} индекс или -1
 */
function getReviewLessonIndex(title) {
  var all = getAllLessons();
  for (var i = 0; i < all.length; i++) {
    if (all[i].title === title) return i;
  }
  return -1;
}