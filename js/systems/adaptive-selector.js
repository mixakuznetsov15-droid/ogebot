// ==========================================
// js/systems/adaptive-selector.js
// ==========================================

/**
 * Выбрать следующие вопросы с учётом навыков, сложности и mastery.
 * @param {string} topicKey
 * @param {Array} allQuestionsForTopic – уже протегированные вопросы (с полями skill, difficulty)
 * @param {object} userProgress
 * @param {number} [count=5]
 * @param {object} [options] – { isReview, mastery, sessionMistakes } 
 *   sessionMistakes: { skill: count } – ошибки подряд в текущей сессии
 */
function selectNextQuestions(topicKey, allQuestionsForTopic, userProgress, count = 5, options = {}) {
  const { isReview = false, mastery = 50, sessionMistakes = {} } = options;
  if (!userProgress.skillStats) userProgress.skillStats = {};

  // Все уникальные навыки в теме
  const skillsInTopic = [...new Set(allQuestionsForTopic.map(q => q.skill || 'общее'))];

  // Если навыков мало — просто перемешиваем все вопросы
  if (skillsInTopic.length < 3 || allQuestionsForTopic.length <= count) {
    return shuffle(allQuestionsForTopic).slice(0, count);
  }

  // Рассчитываем weakness для каждого навыка
  const skillWeakness = {};
  for (const skill of skillsInTopic) {
    const statKey = topicKey + '_' + skill;
    const stats = userProgress.skillStats[statKey] || { correct: 0, wrong: 0 };
    const total = stats.correct + stats.wrong;
    skillWeakness[skill] = total === 0 ? 0.5 : stats.wrong / (total + 1);
  }

  // Сортируем навыки по убыванию слабости
  const sortedSkills = Object.entries(skillWeakness)
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);

  const weakSkills = sortedSkills.slice(0, 2);
  const otherSkills = sortedSkills.slice(2);

  // Фильтр по сложности с учётом mastery и режима повторения
  function difficultyFilter(q) {
    const diff = q.difficulty || 'medium';
    if (isReview) {
      if (mastery < 40) return diff === 'easy';
      if (mastery < 70) return diff === 'easy' || diff === 'medium';
      if (mastery < 90) return diff === 'medium' || diff === 'hard';
      return true; // все сложности
    }
    // В обычном режиме: для слабых навыков предпочитаем лёгкие/средние
    if (weakSkills.includes(q.skill)) {
      return diff !== 'hard';
    }
    return true;
  }

  let selected = [];

  // 60% из слабых навыков
  const weakCount = Math.ceil(count * 0.6);
  const weakPool = allQuestionsForTopic.filter(q => weakSkills.includes(q.skill) && difficultyFilter(q));
  selected.push(...pickRandom(weakPool, weakCount));

  // 40% из остальных
  const remainingCount = count - selected.length;
  if (remainingCount > 0 && otherSkills.length > 0) {
    const otherPool = allQuestionsForTopic.filter(q => otherSkills.includes(q.skill) && difficultyFilter(q));
    selected.push(...pickRandom(otherPool, remainingCount));
  }

  // Добираем до нужного количества, если не хватило
  if (selected.length < count) {
    const alreadySelectedTexts = new Set(selected.map(q => q.text));
    const rest = allQuestionsForTopic.filter(q => !alreadySelectedTexts.has(q.text) && difficultyFilter(q));
    selected.push(...shuffle(rest).slice(0, count - selected.length));
  }

  // Удаляем дубликаты и перемешиваем
  const uniqueSelected = [];
  const seen = new Set();
  for (const q of selected) {
    if (!seen.has(q.text)) {
      seen.add(q.text);
      uniqueSelected.push(q);
    }
  }

  // Учитываем sessionMistakes: если есть навыки с 2+ ошибками подряд,
  // заменяем следующий вопрос на более лёгкий из того же навыка
  for (const [skill, mistakes] of Object.entries(sessionMistakes)) {
    if (mistakes >= 2) {
      // Находим самый лёгкий вопрос этого навыка, которого ещё нет в выборке
      const easyQuestion = allQuestionsForTopic.find(q => 
        q.skill === skill && (q.difficulty === 'easy' || !q.difficulty) && !uniqueSelected.some(s => s.text === q.text)
      );
      if (easyQuestion) {
        // Если в uniqueSelected уже есть вопрос этого навыка, заменяем его
        const existingIndex = uniqueSelected.findIndex(q => q.skill === skill);
        if (existingIndex !== -1) {
          uniqueSelected[existingIndex] = easyQuestion;
        } else if (uniqueSelected.length < count) {
          uniqueSelected.push(easyQuestion);
        }
      }
    }
  }

  return shuffle(uniqueSelected).slice(0, count);
}

/**
 * Найти более лёгкий вопрос того же навыка.
 */
function getEasierQuestion(topicKey, skill, currentDifficulty, allQuestions) {
  const levels = ['easy', 'medium', 'hard'];
  const currentIdx = levels.indexOf(currentDifficulty || 'medium');
  for (let i = currentIdx - 1; i >= 0; i--) {
    const found = allQuestions.find(q => q.skill === skill && (q.difficulty === levels[i] || (!q.difficulty && levels[i] === 'medium')));
    if (found) return found;
  }
  // Если легче не нашлось, возвращаем любой другой вопрос того же навыка
  return allQuestions.find(q => q.skill === skill) || null;
}

/**
 * Обновить статистику навыка после ответа.
 */
function updateSkillStats(topicKey, skill, wasCorrect) {
  if (!userProgress.skillStats) userProgress.skillStats = {};
  const statKey = topicKey + '_' + (skill || 'общее');
  const stats = userProgress.skillStats[statKey] || { correct: 0, wrong: 0, lastSeen: null };
  if (wasCorrect) {
    stats.correct++;
  } else {
    stats.wrong++;
  }
  stats.lastSeen = new Date().toISOString().slice(0, 10);
  userProgress.skillStats[statKey] = stats;
}

/**
 * Получить самый слабый навык темы (для диагностики).
 */
function getWeakestSkill(topicKey) {
  if (!userProgress.skillStats) return null;
  const prefix = topicKey + '_';
  let weakest = null, maxWeakness = -1;
  for (const [key, val] of Object.entries(userProgress.skillStats)) {
    if (!key.startsWith(prefix)) continue;
    const total = val.correct + val.wrong;
    if (total === 0) continue;
    const weakness = val.wrong / total;
    if (weakness > maxWeakness) {
      maxWeakness = weakness;
      weakest = key.replace(prefix, '');
    }
  }
  return weakest;
}

// --- Вспомогательные функции ---
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, count) {
  return shuffle(arr).slice(0, count);
}