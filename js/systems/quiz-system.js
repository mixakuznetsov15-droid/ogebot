// ==========================================
//  СИСТЕМА ВИКТОРИНЫ
// ==========================================

var curQ = 0, score = 0, answered = false, shuffled = [];
var curLesson = 0, lives = 3, hintUsed = false;
var isBossMode = false;
var lastExplainText = '';
var currentHintLevel = 0;
// Глобальный индекс текущего урока (для кнопки "Изучить теорию")
var currentLessonIndex = 0;

function getCurrentTopicTitle() {
  if (isBossMode) return 'Финальный босс';
  var all = getAllLessons();
  return (all[curLesson] && all[curLesson].title) || 'Тренировка';
}

function getCurrentTopicKey() {
  if (isBossMode) return 'default';
  var all = getAllLessons();
  return (all[curLesson] && all[curLesson].key) || 'default';
}

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
  document.getElementById('btn-hint').disabled = false;

  var livesEl = document.getElementById('lives-row');
  livesEl.innerHTML = '';
  for (var i = 0; i < 3; i++) {
    livesEl.innerHTML += '<span>' + (i < lives ? '❤️' : '🖤') + '</span>';
  }

  var btn = document.getElementById('btn-next');
  btn.classList.remove('show');
  btn.textContent = curQ < shuffled.length - 1 ? 'Следующий вопрос →' : 'Посмотреть результат →';

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

function selectAns(idx, correct, qText, topic, hint) {
  if (answered) return;
  answered = true;
  closeProfessorModal();

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

  // Персонализация: отслеживаем ответ и получаем особые флаги
  var specialFlags = { fiveCorrect: false, threeErrors: false };
  if (typeof professor !== 'undefined') {
    specialFlags = professor.trackAnswer(idx === correct);
  }

  // Реакция профессора (с учётом персонализации)
  if (typeof professor !== 'undefined') {
    if (specialFlags.threeErrors) {
      // Три ошибки подряд – показываем особое сообщение с кнопкой "Изучить теорию"
      professor.showThreeErrorsMessage();
    } else if (specialFlags.fiveCorrect) {
      // Пять правильных подряд – особое сообщение
      professor.showFiveCorrectMessage();
    } else {
      // Стандартные вызовы onCorrect / onWrong (они уже персонализированные)
      if (idx === correct) {
        professor.onCorrect(getCurrentTopicKey());
      } else {
        var rightAnswerText = shuffled[curQ].answers[correct];
        professor.onWrong(getCurrentTopicKey(), rightAnswerText);
      }
    }
  }

  if (lives === 1) {
    if (typeof professor !== 'undefined') {
      professor.showMessage('Осторожно. Сейчас лучше не спешить.', 'sad', 3000, 'hint');
    }
  }

  document.getElementById('btn-hint').style.display = 'none';

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

// ... (остальные функции: requestAIExplanation, nextQ, showResult, saveLesson, goQuizFromLoaded и т.д. – без изменений)
// ВАЖНО: используй тот же код, что и в предыдущей версии quiz-system.js, но с добавленной переменной currentLessonIndex.
// Ниже приведу только изменённые/добавленные функции, чтобы не дублировать весь файл.
// Полная версия будет идентична предыдущей, только с правками выше.