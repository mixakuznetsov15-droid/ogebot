// ==========================================
//  МИКРОУРОКИ (теория + мини-вопросы + профессор)
// ==========================================

var microSteps = [];
var microStepIndex = 0;
var microTopicKey = '';

function startTheoryCards(theoryInfo, steps, topicKey) {
  if (!Array.isArray(steps) || steps.length === 0 || !steps[0].type) {
    console.warn('Неверный формат микроуроков. Ожидается массив шагов с полем "type".');
    document.getElementById('topic-content').innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Новый формат теории не загружен.</div>';
    return;
  }

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
    if (s.type === 'quiz' || s.type === 'true_false' || s.type === 'choose_image') dotClass += ' quiz';
    else if (s.type === 'final') dotClass += ' final';
    else dotClass += ' lesson';
    if (i === microStepIndex) dotClass += ' active';
    else if (i < microStepIndex) dotClass += ' done';
    html += '<div class="' + dotClass + '"><span class="dot-icon">' + (s.type === 'quiz' || s.type === 'true_false' || s.type === 'choose_image' ? '🎯' : s.type === 'final' ? '🏁' : '📖') + '</span></div>';
  }
  html += '</div>';

  if (step.type === 'lesson') {
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">' + (step.title || '') + '</div>';
    html += '<div class="theory-text">' + (step.text || '').replace(/\n/g, '<br>') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'quiz') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + (step.quizQuestion || step.question || '') + '</div></div>';
    html += '<div class="answers" id="micro-answers">';
    step.answers.forEach(function(ans, idx) {
      html += '<button class="ans-btn" onclick="answerMicroQuestion(' + idx + ')"><div class="ans-letter">' + 'АБВГ'[idx] + '</div><span>' + ans + '</span></button>';
    });
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'true_false') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + (step.question || '') + '</div></div>';
    html += '<div class="true-false-buttons">';
    html += '<button class="true-false-btn true-btn" onclick="answerTrueFalse(true)">✅ Правда</button>';
    html += '<button class="true-false-btn false-btn" onclick="answerTrueFalse(false)">❌ Ложь</button>';
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'choose_image') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + (step.question || '') + '</div></div>';
    html += '<div class="image-grid" id="micro-images">';
    step.images.forEach(function(img, idx) {
      html += '<div class="image-option" onclick="answerChooseImage(' + idx + ')" style="background-image:url(' + img.src + ')"></div>';
    });
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'final') {
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">🏁 ' + (step.title || 'Финальный шаг') + '</div>';
    html += '<div class="theory-text">' + (step.text || 'Ты прошёл весь материал! Готов проверить знания?') + '</div>';
    html += '<button class="btn-full primary" onclick="startLessonPractice()">🚀 Начать практику</button>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function nextMicroStep() {
  microStepIndex++;
  if (microStepIndex < microSteps.length) {
    renderMicroStep();
  } else {
    startLessonPractice();
  }
}

// Универсальная обработка ответа
function processMicroAnswer(isCorrect, explanation, correctAnswerText) {
  var feedbackDiv = document.getElementById('micro-feedback');
  if (isCorrect) {
    addXP(5);
    feedbackDiv.innerHTML = '<div style="color:var(--primary2);margin-bottom:8px;">✅ Верно! ' + (explanation || '') + '</div>';
    if (typeof professor !== 'undefined') {
      professor.showMessage('Отлично! Идём дальше.', 'happy', 2000);
    }
    setTimeout(function() {
      microStepIndex++;
      if (microStepIndex < microSteps.length) {
        renderMicroStep();
      } else {
        startLessonPractice();
      }
    }, 1200);
  } else {
    feedbackDiv.innerHTML = '<div style="color:var(--danger);margin-bottom:8px;">❌ Неверно. ' + (explanation || 'Попробуй ещё раз.') + '</div>';
    if (typeof professor !== 'undefined') {
      professor.showMessage('Не переживай, это сложный момент. Попробуй ещё раз.', 'sad', 2500);
    }
    setTimeout(function() {
      renderMicroStep();
    }, 2000);
  }
}

// Обработчик обычного quiz
function answerMicroQuestion(chosen) {
  var step = microSteps[microStepIndex];
  var correctIdx = step.correct;
  var isCorrect = (chosen === correctIdx);
  // Блокируем кнопки
  var btns = document.querySelectorAll('#micro-answers .ans-btn');
  btns.forEach(function(b) { b.disabled = true; });
  if (isCorrect) {
    btns[correctIdx].classList.add('correct');
  } else {
    btns[chosen].classList.add('wrong');
    btns[correctIdx].classList.add('correct');
  }
  processMicroAnswer(isCorrect, step.explanation, step.answers[correctIdx]);
}

// Обработчик true_false
function answerTrueFalse(value) {
  var step = microSteps[microStepIndex];
  var isCorrect = (value === step.correct);
  // Блокируем кнопки
  var buttons = document.querySelectorAll('.true-false-btn');
  buttons.forEach(function(b) { b.disabled = true; });
  if (isCorrect) {
    if (value === true) {
      document.querySelector('.true-btn').classList.add('correct-tf');
    } else {
      document.querySelector('.false-btn').classList.add('correct-tf');
    }
  } else {
    if (value === true) {
      document.querySelector('.true-btn').classList.add('wrong-tf');
      document.querySelector('.false-btn').classList.add('correct-tf');
    } else {
      document.querySelector('.false-btn').classList.add('wrong-tf');
      document.querySelector('.true-btn').classList.add('correct-tf');
    }
  }
  processMicroAnswer(isCorrect, step.explanation, step.correct ? 'Правда' : 'Ложь');
}

// Обработчик choose_image
function answerChooseImage(chosen) {
  var step = microSteps[microStepIndex];
  var correctIdx = step.images.findIndex(function(img) { return img.correct === true; });
  var isCorrect = (chosen === correctIdx);
  // Визуально выделяем выбранное и правильное
  var images = document.querySelectorAll('.image-option');
  images.forEach(function(img, idx) {
    img.style.pointerEvents = 'none';
    if (idx === correctIdx) img.classList.add('correct-img');
    if (idx === chosen && !isCorrect) img.classList.add('wrong-img');
  });
  processMicroAnswer(isCorrect, step.explanation, 'изображение ' + (correctIdx+1));
}