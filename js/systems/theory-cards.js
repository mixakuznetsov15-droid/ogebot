// ==========================================
//  МИКРОУРОКИ (теория + мини-вопросы + профессор)
// ==========================================

var microSteps = [];
var microStepIndex = 0;
var microTopicKey = '';

/**
 * Запускает микроурок.
 * @param {object} theoryInfo - { title, key, ... }
 * @param {Array} steps - массив шагов { type, title?, text?, quizQuestion?, answers?, correct?, explanation? }
 * @param {string} topicKey - ключ темы
 */
function startTheoryCards(theoryInfo, steps, topicKey) {
  if (!Array.isArray(steps) || steps.length === 0 || !steps[0].type) {
    console.warn('Неверный формат микроуроков. Ожидается массив шагов с полем "type".');
    document.getElementById('topic-content').innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Новый формат теории не загружен.</div>';
    return;
  }

  // Сохраняем, что теория открыта
  if (!userProgress.theoryRead) userProgress.theoryRead = {};
  var lesson = QUESTIONS_FILES[currentLessonIndex];
  if (lesson) {
    userProgress.theoryRead[lesson.title] = true;
    saveProgress();
  }

  microSteps = steps;
  microStepIndex = 0;
  microTopicKey = topicKey || 'micro';
  goScreen('s-topic');
  document.getElementById('topic-title').textContent = theoryInfo.title;

  renderMicroStep();
}

/** Отрисовывает текущий шаг и прогресс-бар */
function renderMicroStep() {
  var container = document.getElementById('topic-content');
  if (!container) return;

  var step = microSteps[microStepIndex];
  var total = microSteps.length;
  var html = '';

  // Прогресс-бар с точками-типами
  html += '<div class="theory-progress">';
  for (var i = 0; i < total; i++) {
    var dotClass = 'theory-progress-dot';
    var s = microSteps[i];
    if (s.type === 'quiz') dotClass += ' quiz';
    else if (s.type === 'final') dotClass += ' final';
    else dotClass += ' lesson';
    if (i === microStepIndex) dotClass += ' active';
    else if (i < microStepIndex) dotClass += ' done';
    html += '<div class="' + dotClass + '"><span class="dot-icon">' + (s.type === 'quiz' ? '🎯' : s.type === 'final' ? '🏁' : '📖') + '</span></div>';
  }
  html += '</div>';

  if (step.type === 'lesson') {
    // Текстовый экран
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">' + (step.title || '') + '</div>';
    html += '<div class="theory-text">' + (step.text || '').replace(/\n/g, '<br>') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'quiz') {
    // Мини-вопрос
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + (step.quizQuestion || step.question || '') + '</div></div>';
    html += '<div class="answers" id="micro-answers">';
    step.answers.forEach(function(ans, idx) {
      html += '<button class="ans-btn" onclick="answerMicroQuestion(' + idx + ')"><div class="ans-letter">' + 'АБВГ'[idx] + '</div><span>' + ans + '</span></button>';
    });
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'final') {
    // Финальный экран перед практикой
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">🏁 ' + (step.title || 'Финальный шаг') + '</div>';
    html += '<div class="theory-text">' + (step.text || 'Ты прошёл весь материал! Готов проверить знания?') + '</div>';
    html += '<button class="btn-full primary" onclick="startLessonPractice()">🚀 Начать практику</button>';
    html += '</div>';
  }

  container.innerHTML = html;
}

/** Переход к следующему шагу (для типа lesson) */
function nextMicroStep() {
  microStepIndex++;
  if (microStepIndex < microSteps.length) {
    renderMicroStep();
  } else {
    startLessonPractice();
  }
}

/** Обработка ответа на мини-вопрос */
function answerMicroQuestion(chosen) {
  var step = microSteps[microStepIndex];
  var correctIdx = step.correct;
  var isCorrect = (chosen === correctIdx);
  var feedbackDiv = document.getElementById('micro-feedback');
  var btns = document.querySelectorAll('#micro-answers .ans-btn');

  // Блокируем кнопки
  btns.forEach(function(b) { b.disabled = true; });

  if (isCorrect) {
    // Правильный ответ
    addXP(5);
    btns[correctIdx].classList.add('correct');
    feedbackDiv.innerHTML = '<div style="color:var(--primary2);margin-bottom:8px;">✅ Верно! ' + (step.explanation || '') + '</div>';

    // Короткая реплика профессора
    if (typeof professor !== 'undefined') {
      professor.showMessage('Отлично! Идём дальше.', 'happy', 2000);
    }

    // Автоматический переход через 1.2 секунды
    setTimeout(function() {
      microStepIndex++;
      if (microStepIndex < microSteps.length) {
        renderMicroStep();
      } else {
        startLessonPractice();
      }
    }, 1200);

  } else {
    // Неправильный ответ
    btns[chosen].classList.add('wrong');
    btns[correctIdx].classList.add('correct');
    feedbackDiv.innerHTML = '<div style="color:var(--danger);margin-bottom:8px;">❌ Неверно. ' + (step.explanation || 'Попробуй ещё раз.') + '</div>';

    // Реплика профессора
    if (typeof professor !== 'undefined') {
      professor.showMessage('Не переживай, это сложный момент. Попробуй ещё раз.', 'sad', 2500);
    }

    // Через 2 секунды перерисовываем этот же вопрос
    setTimeout(function() {
      renderMicroStep();
    }, 2000);
  }
}