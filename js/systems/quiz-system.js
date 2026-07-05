// ==========================================
//  СИСТЕМА ВИКТОРИНЫ
// ==========================================

// Переменные текущей сессии
var curQ = 0, score = 0, answered = false, shuffled = [];
var curLesson = 0, lives = 3, hintUsed = false;
var isBossMode = false;
var lastExplainText = '';

// Получить название текущей темы
function getCurrentTopicTitle() {
  if (isBossMode) return 'Финальный босс';
  var all = getAllLessons();
  return (all[curLesson] && all[curLesson].title) || 'Тренировка';
}

// Получить ключ текущей темы (для подсказок)
function getCurrentTopicKey() {
  if (isBossMode) return 'default';
  var all = getAllLessons();
  return (all[curLesson] && all[curLesson].key) || 'default';
}

// Отрисовка вопроса
function renderQ() {
  var q = shuffled[curQ];
  var topicTitle = getCurrentTopicTitle();
  answered = false;
  hintUsed = false;
  lastExplainText = '';
  currentHintLevel = 0;
  closeProfessorModal();

  document.getElementById('quiz-topic-lbl').textContent = topicTitle;
  document.getElementById('lesson-badge').textContent = topicTitle + ' · Вопрос ' + (curQ + 1) + ' из ' + shuffled.length;
  document.getElementById('quiz-counter').textContent = (curQ + 1) + '/' + shuffled.length;
  document.getElementById('qpf').style.width = ((curQ / shuffled.length) * 100) + '%';
  document.getElementById('q-tag').textContent = q.tag;
  document.getElementById('q-text').textContent = q.text;
  document.getElementById('ai-quiz').style.display = 'none';
  document.getElementById('ai-explain').style.display = 'none';
  document.getElementById('btn-ask-ai').style.display = 'none';
  document.getElementById('btn-hint').style.display = 'flex';
  document.getElementById('btn-hint').textContent = '🎓 Спросить профессора Гео';

  // Жизни
  var livesEl = document.getElementById('lives-row');
  livesEl.innerHTML = '';
  for (var i = 0; i < 3; i++) {
    livesEl.innerHTML += '<span>' + (i < lives ? '❤️' : '🖤') + '</span>';
  }

  // Кнопка "Следующий вопрос"
  var btn = document.getElementById('btn-next');
  btn.classList.remove('show');
  btn.textContent = curQ < shuffled.length - 1 ? 'Следующий вопрос →' : 'Посмотреть результат →';

  // Варианты ответов
  var ans = document.getElementById('answers');
  ans.innerHTML = '';
  ['А', 'Б', 'В', 'Г'].forEach(function(l, i) {
    var b = document.createElement('button');
    b.className = 'ans-btn';
    b.innerHTML = '<div class="ans-letter">' + l + '</div><span>' + q.answers[i] + '</span>';
    b.onclick = function() { selectAns(i, q.correct, q.text, topicTitle, q.hint); };
    ans.appendChild(b);
  });
}

// Выбор ответа
function selectAns(idx, correct, qText, topic, hint) {
  if (answered) return;
  answered = true;
  closeProfessorModal();

  // Тактильный отклик в Telegram
  if (idx === correct && isTelegram && tgApp.HapticFeedback) {
    try { tgApp.HapticFeedback.notificationOccurred('success'); } catch(e) {}
  }

  var btns = document.querySelectorAll('.ans-btn');
  btns[idx].classList.add(idx === correct ? 'correct' : 'wrong');
  if (idx !== correct) {
    btns[correct].classList.add('correct');
    lives--;
  }
  if (idx === correct) score++;

  document.getElementById('btn-hint').style.display = 'none';

  // Обновление жизней
  var livesEl = document.getElementById('lives-row');
  livesEl.innerHTML = '';
  for (var i = 0; i < 3; i++) {
    livesEl.innerHTML += '<span>' + (i < lives ? '❤️' : '🖤') + '</span>';
  }

  requestAIExplanation(idx === correct, qText, topic);

  document.getElementById('btn-next').classList.add('show');
  if (lives <= 0) {
    document.getElementById('btn-next').textContent = '😔 Жизни кончились — попробуй ещё раз';
  }

  incrementDailyCounters(1, 0);
  updateDailyTasks();
}

// Запрос объяснения от AI
async function requestAIExplanation(isCorrect, qText, topic) {
  var explainBox = document.getElementById('ai-explain');
  var askBtn = document.getElementById('btn-ask-ai');
  explainBox.style.display = 'block';
  askBtn.style.display = 'block';
  explainBox.innerHTML = '⏳ Профессор Гео комментирует...';

  var feedbackPrefix = '';
  if (isCorrect) {
    if (hintUsed && Math.random() < 0.5) {
      feedbackPrefix = '👨‍🏫 <b>' + pickRandom(PROFESSOR_PRAISE) + '</b><br><br>';
    }
  } else {
    feedbackPrefix = '👨‍🏫 <b>' + pickRandom(PROFESSOR_EMPATHY) + '</b><br><br>';
  }

  var prompt = isCorrect
    ? 'Ты Профессор Гео. Ученик правильно ответил на вопрос ОГЭ: «' + qText + '». Объясни кратко (2-3 предложения), почему ответ верный, выделив ключевую закономерность. Будь поддерживающим.'
    : 'Ты Профессор Гео. Ученик ошибся в вопросе ОГЭ: «' + qText + '». Дай КОРОТКОЕ объяснение правильного ответа, указав типичную ошибку и как её избежать. 2-3 предложения, мотивируй.';

  try {
    var r = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt, context: topic })
    });
    var d = await r.json();
    var ans = d.answer || 'Подумай, какое правило здесь работает.';
    explainBox.innerHTML = feedbackPrefix + '📘 ' + ans.replace(/\n/g, '<br>');
    lastExplainText = ans;
  } catch(e) {
    var fallback = isCorrect ? 'Отлично! Ты знаешь материал.' : 'Обрати внимание на это правило.';
    explainBox.innerHTML = feedbackPrefix + '📘 ' + fallback;
    lastExplainText = fallback;
  }
}

// Следующий вопрос
function nextQ() {
  curQ++;
  if (curQ >= shuffled.length) showResult();
  else renderQ();
}

// Показать результат
function showResult() {
  var total = shuffled.length;
  var pct = Math.round(score / total * 100);

  if (isBossMode) {
    userProgress.bossCompleted = true;
    saveProgress();
    document.getElementById('boss-sub').textContent = score + '/' + total + ' правильных ответов (' + pct + '%)';
    document.getElementById('boss-num').textContent = score;
    document.getElementById('boss-denom').textContent = 'из ' + total;
    goScreen('s-boss-result');
    setTimeout(function() {
      document.getElementById('boss-ring-fill').style.strokeDashoffset = 339 * (1 - score / total);
    }, 100);
    isBossMode = false;
    updateDailyTasks();
    return;
  }

  var e = '😔', t = 'Нужно повторить';
  if (pct >= 80) { e = '🏆'; t = 'Отлично!'; }
  else if (pct >= 60) { e = '👍'; t = 'Хороший результат!'; }
  else if (pct >= 40) { e = '📖'; t = 'Продолжай учиться'; }

  document.getElementById('res-emoji').textContent = e;
  document.getElementById('res-title').textContent = t;
  document.getElementById('res-sub').textContent = pct + '% правильных ответов';
  document.getElementById('ring-num').textContent = score;
  document.getElementById('ring-denom').textContent = 'из ' + total;
  document.getElementById('res-c').textContent = score;
  document.getElementById('res-w').textContent = total - score;
  var xpGain = score * 20 + (score === total ? 50 : 0);
  document.getElementById('res-xp').textContent = '+' + xpGain;

  saveLesson(curLesson, score, total);
  goScreen('s-result');
  setTimeout(function() {
    document.getElementById('ring-fill').style.strokeDashoffset = 339 * (1 - score / total);
  }, 100);
  updateDailyTasks();
}

// Сохранить урок
function saveLesson(lessonIdx, sc, total) {
  var today = new Date().toISOString().slice(0,10);
  var allLessons = getAllLessons();
  var lessonKey = allLessons[lessonIdx] ? allLessons[lessonIdx].title : String(lessonIdx);
  userProgress.completedLessons[lessonKey] = { score: sc, total: total, date: today, idx: lessonIdx };
  userProgress.totalAnswered += total;
  userProgress.totalCorrect += sc;
  var xpGain = sc * 20 + (sc === total ? 50 : 0);
  addXP(xpGain);
  checkStreak();
  saveProgress();
  if (!userProgress.chests) userProgress.chests = [];
  if (!userProgress.completedLessons[lessonKey].chestGiven) {
    giveChest('achievement');
    userProgress.completedLessons[lessonKey].chestGiven = true;
    saveProgress();
    showToast('🎁 Сундук за завершение темы!');
  }
}

// Переход к квизу по индексу урока
function goQuizFromLoaded(idx) {
  var allLessons = getAllLessons();
  curLesson = idx;
  shuffled = allLessons[idx].questions.slice();
  curQ = 0;
  score = 0;
  answered = false;
  lives = 3;
  hintUsed = false;
  goScreen('s-quiz');
  renderQ();
}

// Повторить урок
function replayLesson() {
  if (isBossMode || curLesson < 0) {
    goBossLevel();
    return;
  }
  var allLessons = getAllLessons();
  shuffled = allLessons[curLesson].questions.slice();
  curQ = 0;
  score = 0;
  answered = false;
  lives = 3;
  hintUsed = false;
  goScreen('s-quiz');
  renderQ();
}

// Финальный босс
function goBossLevel() {
  var allLessons = getAllLessons();
  var allQuestions = [];
  allLessons.forEach(function(l) {
    if (l.questions) allQuestions = allQuestions.concat(l.questions);
  });
  allQuestions = allQuestions.sort(function() { return Math.random() - 0.5; }).slice(0, 30);
  isBossMode = true;
  shuffled = allQuestions;
  curLesson = -1;
  curQ = 0;
  score = 0;
  answered = false;
  lives = 999;
  hintUsed = false;
  goScreen('s-quiz');
  renderQ();
}