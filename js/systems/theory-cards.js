// ==========================================
//  МИКРОУРОКИ (исправленная сортировка)
// ==========================================

var microSteps = [];
var microStepIndex = 0;
var microTopicKey = '';

function startTheoryCards(theoryInfo, data, topicKey) {
  let steps = [];

  if (data && Array.isArray(data.cards)) {
    steps = data.cards.map(card => {
      if (card.type === 'image_lesson') {
        return {
          type: 'image_lesson',
          title: card.title || '',
          text: card.text || '',
          image: card.image || '',
          caption: card.caption || ''
        };
      } else if (card.type === 'image_hotspot') {
        return {
          type: 'image_hotspot',
          question: card.question,
          image: card.image,
          hotspots: card.hotspots || [],
          explanation: card.explanation || ''
        };
      } else if (card.type === 'number_input') {
        return {
          type: 'number_input',
          question: card.question,
          correctAnswer: card.correctAnswer,
          units: card.units || '',
          tolerance: card.tolerance || 0,
          explanation: card.explanation || ''
        };
      } else if (card.type === 'sorting') {
        return {
          type: 'sorting',
          question: card.question,
          items: card.items || [],
          correctOrder: card.correctOrder || [],
          explanation: card.explanation || ''
        };
      } else if (card.type === 'multi_select') {
        return {
          type: 'multi_select',
          question: card.question,
          options: card.options || [],
          correctIndices: card.correctIndices || [],
          explanation: card.explanation || ''
        };
      } else if (card.type === 'matching') {
        return {
          type: 'matching',
          question: card.question,
          pairs: card.pairs || [],
          explanation: card.explanation || ''
        };
      } else if (card.type === 'explain') {
        let text = card.text || '';
        if (card.example) text += '\n\n📝 Пример: ' + card.example;
        return { type: 'lesson', title: card.title || '', text: text };
      } else if (card.type === 'check') {
        return {
          type: 'quiz',
          quizQuestion: card.question,
          answers: card.options || [],
          correct: card.correct,
          explanation: card.explanation || ''
        };
      } else if (card.type === 'ready') {
        return { type: 'final', title: '🎉 Готов к практике', text: card.message || 'Ты прошёл весь материал!' };
      }
      return card;
    });
  } else if (Array.isArray(data)) {
    goQuizFromLoaded(currentLessonIndex);
    return;
  } else {
    document.getElementById('topic-content').innerHTML =
      '<div style="padding:20px;text-align:center;color:var(--danger)">Формат урока не поддерживается</div>';
    return;
  }

  if (steps.length === 0) {
    goQuizFromLoaded(currentLessonIndex);
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

  // Прогресс-бар
  html += '<div class="theory-progress">';
  for (var i = 0; i < total; i++) {
    var dotClass = 'theory-progress-dot';
    var s = microSteps[i];
    if (s.type === 'quiz' || s.type === 'true_false' || s.type === 'choose_image' || s.type === 'image_hotspot' || s.type === 'number_input' || s.type === 'sorting' || s.type === 'multi_select' || s.type === 'matching') dotClass += ' quiz';
    else if (s.type === 'final') dotClass += ' final';
    else dotClass += ' lesson';
    if (i === microStepIndex) dotClass += ' active';
    else if (i < microStepIndex) dotClass += ' done';
    html += '<div class="' + dotClass + '"><span class="dot-icon">' + (dotClass.indexOf('quiz') !== -1 ? '🎯' : dotClass.indexOf('final') !== -1 ? '🏁' : '📖') + '</span></div>';
  }
  html += '</div>';

  // Рендеринг
  if (step.type === 'lesson') {
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">' + (step.title || '') + '</div>';
    html += '<div class="theory-text">' + (step.text || '').replace(/\n/g, '<br>') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'image_lesson') {
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">' + step.title + '</div>';
    html += '<img src="' + step.image + '" style="width:100%;border-radius:12px;margin-bottom:12px;" />';
    if (step.caption) html += '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">' + step.caption + '</div>';
    html += '<div class="theory-text">' + step.text.replace(/\n/g, '<br>') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'quiz') {
    var answers = step.answers || [];
    var letters = answers.length === 3 ? ['А', 'Б', 'В'] : ['А', 'Б', 'В', 'Г'];
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + (step.quizQuestion || step.question || '') + '</div></div>';
    html += '<div class="answers" id="micro-answers">';
    answers.forEach(function(ans, idx) {
      html += '<button class="ans-btn" onclick="answerMicroQuestion(' + idx + ')"><div class="ans-letter">' + letters[idx] + '</div><span>' + ans + '</span></button>';
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
  } else if (step.type === 'image_hotspot') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div style="position:relative;display:inline-block;margin:0 auto;">';
    html += '<img src="' + step.image + '" style="width:100%;border-radius:12px;" />';
    step.hotspots.forEach(function(hs, idx) {
      html += '<div class="hotspot-marker" style="position:absolute;left:' + hs.x + 'px;top:' + hs.y + 'px;width:' + (hs.radius*2) + 'px;height:' + (hs.radius*2) + 'px;border-radius:50%;background:rgba(255,255,255,0.3);border:2px solid var(--primary);cursor:pointer;transform:translate(-50%,-50%);" onclick="answerHotspot(' + idx + ')"></div>';
    });
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'number_input') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div style="display:flex;gap:8px;align-items:center;">';
    html += '<input type="number" id="number-answer" style="flex:1;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--text);" placeholder="Введи ответ">';
    html += '<button class="btn-full primary" style="width:auto;padding:12px 20px;" onclick="submitNumberAnswer()">Проверить</button>';
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'sorting') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div id="sort-list" style="display:flex;flex-direction:column;gap:8px;">';
    var shuffled = shuffle([...step.items]);
    shuffled.forEach(function(item, idx) {
      html += '<div class="sort-item" data-index="' + step.items.indexOf(item) + '" style="display:flex;align-items:center;gap:8px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:12px;">';
      html += '<div style="display:flex;flex-direction:column;gap:4px;">';
      html += '<button onclick="moveSortItem(this, -1)" style="background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--text);width:30px;height:30px;font-size:18px;line-height:1;cursor:pointer;">▲</button>';
      html += '<button onclick="moveSortItem(this, 1)" style="background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--text);width:30px;height:30px;font-size:18px;line-height:1;cursor:pointer;">▼</button>';
      html += '</div>';
      html += '<span style="flex:1;">' + item + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<button class="btn-full primary" style="margin-top:12px;" onclick="submitSortingAnswer()">Проверить порядок</button>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'multi_select') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div id="multi-options" style="display:flex;flex-direction:column;gap:8px;">';
    step.options.forEach(function(opt, idx) {
      html += '<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:12px;">';
      html += '<input type="checkbox" value="' + idx + '"> ' + opt;
      html += '</label>';
    });
    html += '</div>';
    html += '<button class="btn-full primary" style="margin-top:12px;" onclick="submitMultiSelectAnswer()">Проверить</button>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'matching') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div>Сопоставление (реализуем позже)</div>';
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

// ---------- Функции для сортировки ----------
function moveSortItem(btn, direction) {
  var item = btn.closest('.sort-item');
  var list = document.getElementById('sort-list');
  if (!item || !list) return;

  var items = [...list.children];
  var currentIndex = items.indexOf(item);
  var newIndex = currentIndex + direction;

  if (newIndex < 0 || newIndex >= items.length) return;

  if (direction === 1) {
    list.insertBefore(item, items[newIndex + 1] || null);
  } else {
    list.insertBefore(item, items[newIndex]);
  }
}

function submitSortingAnswer() {
  var step = microSteps[microStepIndex];
  var currentOrder = [];
  document.querySelectorAll('.sort-item').forEach(function(el) {
    currentOrder.push(parseInt(el.dataset.index));
  });
  var isCorrect = JSON.stringify(currentOrder) === JSON.stringify(step.correctOrder);
  processMicroAnswer(isCorrect, step.explanation);
}

// ---------- Остальные обработчики ----------
function nextMicroStep() {
  microStepIndex++;
  if (microStepIndex < microSteps.length) {
    renderMicroStep();
  } else {
    startLessonPractice();
  }
}

function processMicroAnswer(isCorrect, explanation) {
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

function answerMicroQuestion(chosen) { /* без изменений */ }
function answerTrueFalse(value) { /* без изменений */ }
function answerChooseImage(chosen) { /* без изменений */ }
function answerHotspot(chosen) { /* без изменений */ }
function submitNumberAnswer() { /* без изменений */ }
function submitMultiSelectAnswer() { /* без изменений */ }

function shuffle(arr) {
  var a = [...arr];
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}