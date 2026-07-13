// ==========================================
//  МИКРОУРОКИ (КАРТОЧКИ + ВСТРОЕННЫЕ ВОПРОСЫ)
// ==========================================

var microSteps = [];
var microStepIndex = 0;
var microTopicKey = '';

/**
 * Запускает показ микроуроков.
 * @param {object} theoryInfo - { title, key, ... }
 * @param {Array} theoryData - массив шагов { type: 'lesson'|'quiz', ... }
 * @param {string} topicKey - ключ темы (например, 'topo')
 */
function startTheoryCards(theoryInfo, theoryData, topicKey) {
  // Сохраняем, что теория открыта
  if (!userProgress.theoryRead) userProgress.theoryRead = {};
  var lesson = QUESTIONS_FILES[currentLessonIndex];
  if (lesson) {
    userProgress.theoryRead[lesson.title] = true;
    saveProgress();
  }

  // Если данные — массив с типом, запускаем микроуроки
  if (Array.isArray(theoryData) && theoryData.length > 0 && theoryData[0].type) {
    microSteps = theoryData;
    microStepIndex = 0;
    microTopicKey = topicKey || 'micro';
    goScreen('s-topic');
    document.getElementById('topic-title').textContent = theoryInfo.title;
    renderMicroStep();
  } else {
    // Старый формат не поддерживается — сообщаем об ошибке
    console.warn('Неверный формат теории. Ожидается массив шагов с полем "type".');
    document.getElementById('topic-content').innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Новый формат теории не загружен.</div>';
  }
}

/** Отрисовывает текущий шаг (урок или вопрос) */
function renderMicroStep() {
  var container = document.getElementById('topic-content');
  if (!container) return;

  var step = microSteps[microStepIndex];
  var html = '';

  if (step.type === 'lesson') {
    // Обычный текстовый экран
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">' + step.title + '</div>';
    html += '<div class="theory-text">' + step.text.replace(/\n/g, '<br>') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'quiz') {
    // Встроенный вопрос
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div class="answers" id="micro-answers">';
    step.answers.forEach(function(ans, idx) {
      html += '<button class="ans-btn" onclick="answerMicroQuestion(' + idx + ')"><div class="ans-letter">' + 'АБВГ'[idx] + '</div><span>' + ans + '</span></button>';
    });
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
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
    // Микроурок завершён — переходим к практике
    startLessonPractice();
  }
}

/** Обработка ответа на микро-вопрос */
function answerMicroQuestion(chosen) {
  var step = microSteps[microStepIndex];
  var correct = step.correct;
  var isCorrect = (chosen === correct);
  var feedbackDiv = document.getElementById('micro-feedback');
  var btns = document.querySelectorAll('#micro-answers .ans-btn');

  // Блокируем кнопки
  btns.forEach(function(b) { b.disabled = true; });

  if (isCorrect) {
    // Правильный ответ
    addXP(5); // небольшой бонус
    btns[correct].classList.add('correct');
    feedbackDiv.innerHTML = '<div style="color:var(--primary2);margin-bottom:8px;">✅ Правильно! ' + (step.explanation || '') + '</div>';

    if (typeof professor !== 'undefined') {
      professor.onCorrect(microTopicKey);
    }

    // Кнопка «Продолжить»
    var btn = document.createElement('button');
    btn.className = 'btn-full primary';
    btn.textContent = 'Продолжить →';
    btn.onclick = function() {
      microStepIndex++;
      if (microStepIndex < microSteps.length) {
        renderMicroStep();
      } else {
        startLessonPractice();
      }
    };
    feedbackDiv.appendChild(btn);

  } else {
    // Неправильный ответ
    btns[chosen].classList.add('wrong');
    btns[correct].classList.add('correct'); // подсвечиваем правильный
    feedbackDiv.innerHTML = '<div style="color:var(--danger);margin-bottom:8px;">❌ Неверно. ' + (step.explanation || 'Попробуй ещё раз.') + '</div>';

    if (typeof professor !== 'undefined') {
      professor.onWrong(microTopicKey, step.answers[correct]);
    }

    // Автоматически перерисовываем этот же вопрос через 2 секунды
    setTimeout(function() {
      renderMicroStep();
    }, 2000);
  }
}