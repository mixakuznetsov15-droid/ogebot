// ==========================================
//  МИКРОУРОКИ (расширенная версия)
// ==========================================

var microSteps = [];
var microStepIndex = 0;
var microTopicKey = '';

function startTheoryCards(theoryInfo, data, topicKey) {
  let steps = [];

  if (data && Array.isArray(data.cards)) {
    steps = data.cards.map(card => {
      // Новые типы
      if (card.type === 'image_quiz') {
        return {
          type: 'image_quiz',
          image: card.image || '',
          question: card.question,
          answers: card.answers || [],
          correct: card.correct,
          explanation: card.explanation || '',
          feedback: card.feedback || [],
          professorComment: card.professorComment || ''
        };
      } else if (card.type === 'image_compare') {
        return {
          type: 'image_compare',
          question: card.question,
          leftImage: card.leftImage || '',
          rightImage: card.rightImage || '',
          correct: card.correct, // 'left' или 'right'
          explanation: card.explanation || '',
          professorComment: card.professorComment || ''
        };
      } else if (card.type === 'drag_match') {
        return {
          type: 'drag_match',
          question: card.question,
          pairs: card.pairs || [],
          explanation: card.explanation || '',
          professorComment: card.professorComment || ''
        };
      } else if (card.type === 'compass') {
        return {
          type: 'compass',
          question: card.question,
          correctAngle: card.correctAngle,
          tolerance: card.tolerance || 5,
          explanation: card.explanation || '',
          professorComment: card.professorComment || ''
        };
      } else if (card.type === 'map_route') {
        return {
          type: 'map_route',
          image: card.image || '',
          question: card.question,
          answers: card.answers || [],
          correct: card.correct,
          explanation: card.explanation || '',
          feedback: card.feedback || [],
          professorComment: card.professorComment || ''
        };
      } else if (card.type === 'remember') {
        return {
          type: 'remember',
          title: card.title || 'Запомни',
          text: card.text || ''
        };
      } else if (card.type === 'exam_tip') {
        return {
          type: 'exam_tip',
          title: card.title || 'Лайфхак ОГЭ',
          text: card.text || ''
        };
      } else if (card.type === 'common_mistake') {
        return {
          type: 'common_mistake',
          title: card.title || 'Типичная ошибка',
          text: card.text || ''
        };
      }
      // Старые типы
      else if (card.type === 'image_lesson') {
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
          explanation: card.explanation || '',
          professorComment: card.professorComment || ''
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
          explanation: card.explanation || '',
          feedback: card.feedback || [],
          professorComment: card.professorComment || ''
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
    if (s.type === 'quiz' || s.type === 'true_false' || s.type === 'choose_image' || s.type === 'image_hotspot' || s.type === 'number_input' || s.type === 'sorting' || s.type === 'multi_select' || s.type === 'image_quiz' || s.type === 'image_compare' || s.type === 'drag_match' || s.type === 'compass' || s.type === 'map_route') dotClass += ' quiz';
    else if (s.type === 'final') dotClass += ' final';
    else if (s.type === 'remember') dotClass += ' remember';
    else if (s.type === 'exam_tip') dotClass += ' exam-tip';
    else if (s.type === 'common_mistake') dotClass += ' common-mistake';
    else dotClass += ' lesson';
    if (i === microStepIndex) dotClass += ' active';
    else if (i < microStepIndex) dotClass += ' done';
    html += '<div class="' + dotClass + '"><span class="dot-icon">' +
      (dotClass.indexOf('quiz') !== -1 ? '🎯' :
       dotClass.indexOf('final') !== -1 ? '🏁' :
       dotClass.indexOf('remember') !== -1 ? '🧠' :
       dotClass.indexOf('exam-tip') !== -1 ? '💡' :
       dotClass.indexOf('common-mistake') !== -1 ? '⚠️' : '📖') + '</span></div>';
  }
  html += '</div>';

  // Рендеринг шагов
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
    html += renderQuiz(step, 'quiz');
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
  } else if (step.type === 'image_quiz') {
    html += renderQuiz(step, 'image_quiz');
  } else if (step.type === 'image_compare') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div style="display:flex;gap:10px;justify-content:center;">';
    html += '<div class="image-option" onclick="answerImageCompare(\'left\')" style="background-image:url(' + step.leftImage + ');flex:1;aspect-ratio:1/1;background-size:cover;border-radius:12px;cursor:pointer;"></div>';
    html += '<div class="image-option" onclick="answerImageCompare(\'right\')" style="background-image:url(' + step.rightImage + ');flex:1;aspect-ratio:1/1;background-size:cover;border-radius:12px;cursor:pointer;"></div>';
    html += '</div>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'drag_match') {
    // Перетаскивание элементов
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div style="display:flex;gap:20px;">';
    // левая колонка – перетаскиваемые элементы
    html += '<div style="flex:1;display:flex;flex-direction:column;gap:8px;" id="drag-left">';
    var leftItems = shuffle([...step.pairs]);
    leftItems.forEach(function(pair, idx) {
      html += '<div class="drag-item" draggable="true" data-value="' + pair.right + '" style="padding:10px;background:var(--card);border:1px solid var(--border);border-radius:12px;cursor:grab;">' + pair.left + '</div>';
    });
    html += '</div>';
    // правая колонка – цели
    html += '<div style="flex:1;display:flex;flex-direction:column;gap:8px;" id="drag-right">';
    var rightOptions = step.pairs.map(function(p) { return p.right; });
    rightOptions.forEach(function(opt) {
      html += '<div class="drag-target" data-expected="' + opt + '" style="padding:10px;min-height:40px;background:var(--card2);border:1px dashed var(--border);border-radius:12px;text-align:center;">' + opt + '</div>';
    });
    html += '</div></div>';
    html += '<button class="btn-full primary" style="margin-top:12px;" onclick="submitDragMatchAnswer()">Проверить</button>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'compass') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<div style="text-align:center;">';
    html += '<div id="compass-container" style="position:relative;width:160px;height:160px;margin:0 auto;border-radius:50%;background:radial-gradient(circle,#1a2a3a 60%,#0d1117 100%);border:2px solid var(--border);">';
    html += '<div id="compass-needle" style="position:absolute;top:50%;left:50%;width:4px;height:60px;background:var(--danger);transform-origin:bottom center;transform:translate(-50%,-100%) rotate(0deg);border-radius:2px;"></div>';
    html += '</div>';
    html += '<div style="margin-top:10px;font-weight:600;">Угол: <span id="compass-angle">0°</span></div>';
    html += '</div>';
    html += '<button class="btn-full primary" style="margin-top:12px;" onclick="submitCompassAnswer()">Проверить</button>';
    html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
    html += '</div>';
  } else if (step.type === 'map_route') {
    html += '<div class="quiz-wrap" style="padding:0">';
    html += '<div class="q-card"><div class="q-text">' + step.question + '</div></div>';
    html += '<img src="' + step.image + '" style="width:100%;border-radius:12px;margin-bottom:12px;" />';
    html += renderQuiz(step, 'map_route');
    html += '</div>';
  } else if (step.type === 'remember') {
    html += '<div class="theory-card" style="background:linear-gradient(135deg,#1a3a5c,#0f2438);border-color:var(--primary);">';
    html += '<div class="theory-topic" style="font-size:28px;margin-bottom:8px;">🧠 ' + (step.title || 'Запомни') + '</div>';
    html += '<div class="theory-text" style="font-size:18px;font-weight:600;">' + (step.text || '') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'exam_tip') {
    html += '<div class="theory-card" style="background:linear-gradient(135deg,#2a3a0c,#1f2a08);border-color:var(--primary2);">';
    html += '<div class="theory-topic">💡 ' + (step.title || 'Лайфхак ОГЭ') + '</div>';
    html += '<div class="theory-text">' + (step.text || '') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'common_mistake') {
    html += '<div class="theory-card" style="background:linear-gradient(135deg,#3a2020,#2a1010);border-color:var(--danger);">';
    html += '<div class="theory-topic" style="color:var(--danger);">⚠️ ' + (step.title || 'Типичная ошибка') + '</div>';
    html += '<div class="theory-text">' + (step.text || '') + '</div>';
    html += '<button class="btn-full primary" onclick="nextMicroStep()">Продолжить →</button>';
    html += '</div>';
  } else if (step.type === 'final') {
    html += '<div class="theory-card">';
    html += '<div class="theory-topic">🏁 ' + (step.title || 'Финальный шаг') + '</div>';
    html += '<div class="theory-text">' + (step.text || 'Ты прошёл весь материал! Готов проверить знания?') + '</div>';
    html += '<button class="btn-full primary" onclick="startSubtopicPractice()">🚀 К практике</button>';
    html += '</div>';
  }

  container.innerHTML = html;

  // Инициализация интерактивных элементов
  if (step.type === 'drag_match') initDragMatch();
  if (step.type === 'compass') initCompass();
}

// Универсальная функция для quiz / image_quiz / map_route
function renderQuiz(step, subtype) {
  var answers = step.answers || [];
  var letters = answers.length === 3 ? ['А', 'Б', 'В'] : ['А', 'Б', 'В', 'Г'];
  var html = '<div class="quiz-wrap" style="padding:0">';
  html += '<div class="q-card"><div class="q-text">' + (step.question || '') + '</div></div>';
  if (subtype === 'image_quiz' || subtype === 'map_route') {
    html += '<img src="' + (step.image || '') + '" style="width:100%;border-radius:12px;margin-bottom:12px;" />';
  }
  html += '<div class="answers" id="micro-answers">';
  answers.forEach(function(ans, idx) {
    html += '<button class="ans-btn" onclick="answerMicroQuestion(' + idx + ')"><div class="ans-letter">' + letters[idx] + '</div><span>' + ans + '</span></button>';
  });
  html += '</div>';
  html += '<div id="micro-feedback" style="margin-top:12px;"></div>';
  html += '</div>';
  return html;
}

// ---------- Drag & Drop ----------
function initDragMatch() {
  var items = document.querySelectorAll('.drag-item');
  var targets = document.querySelectorAll('.drag-target');

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.value);
    e.target.style.opacity = '0.5';
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '1';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.target.style.background = 'rgba(88,166,255,0.2)';
  }

  function handleDragLeave(e) {
    e.target.style.background = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    e.target.style.background = '';
    var value = e.dataTransfer.getData('text/plain');
    if (e.target.classList.contains('drag-target')) {
      e.target.textContent = value;
      e.target.dataset.value = value;
    }
  }

  items.forEach(function(item) {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });

  targets.forEach(function(target) {
    target.addEventListener('dragover', handleDragOver);
    target.addEventListener('dragleave', handleDragLeave);
    target.addEventListener('drop', handleDrop);
  });

  // Touch support
  items.forEach(function(item) {
    item.addEventListener('touchstart', function(e) {
      var touch = e.touches[0];
      item.dataset.touchStartX = touch.clientX;
      item.dataset.touchStartY = touch.clientY;
      item.style.opacity = '0.6';
      item.style.position = 'relative';
      item.style.zIndex = '1000';
    });
    item.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var touch = e.touches[0];
      item.style.left = (touch.clientX - item.dataset.touchStartX) + 'px';
      item.style.top = (touch.clientY - item.dataset.touchStartY) + 'px';
    });
    item.addEventListener('touchend', function(e) {
      item.style.opacity = '1';
      item.style.left = '0px';
      item.style.top = '0px';
      var touch = e.changedTouches[0];
      var target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.classList.contains('drag-target')) {
        target.textContent = item.dataset.value;
        target.dataset.value = item.dataset.value;
      }
    });
  });
}

function submitDragMatchAnswer() {
  var step = microSteps[microStepIndex];
  var targets = document.querySelectorAll('.drag-target');
  var allCorrect = true;
  targets.forEach(function(target) {
    if (target.dataset.value !== target.dataset.expected) allCorrect = false;
  });
  processMicroAnswer(allCorrect, step.explanation, step.professorComment);
}

// ---------- Интерактивный компас ----------
function initCompass() {
  var container = document.getElementById('compass-container');
  var needle = document.getElementById('compass-needle');
  var angleSpan = document.getElementById('compass-angle');
  var currentAngle = 0;

  function setAngle(deg) {
    currentAngle = deg % 360;
    needle.style.transform = 'translate(-50%,-100%) rotate(' + currentAngle + 'deg)';
    angleSpan.textContent = currentAngle + '°';
  }

  function handleMove(e) {
    var rect = container.getBoundingClientRect();
    var clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    var centerX = rect.left + rect.width/2;
    var centerY = rect.top + rect.height/2;
    var dx = clientX - centerX;
    var dy = clientY - centerY;
    var angle = Math.atan2(dy, dx) * (180/Math.PI);
    angle = (angle + 90 + 360) % 360; // корректировка, чтобы 0 был вверху
    setAngle(Math.round(angle));
  }

  function startMove(e) {
    e.preventDefault();
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', stopMove);
    document.addEventListener('touchmove', handleMove, {passive: false});
    document.addEventListener('touchend', stopMove);
    handleMove(e);
  }

  function stopMove() {
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', stopMove);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', stopMove);
  }

  container.addEventListener('mousedown', startMove);
  container.addEventListener('touchstart', startMove, {passive: false});
}

function submitCompassAnswer() {
  var step = microSteps[microStepIndex];
  var needle = document.getElementById('compass-needle');
  var transform = needle.style.transform;
  var match = transform.match(/rotate\((\d+)deg\)/);
  var userAngle = match ? parseInt(match[1]) : 0;
  var correct = step.correctAngle;
  var tol = step.tolerance || 5;
  var isCorrect = Math.abs(userAngle - correct) <= tol;
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
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

function processMicroAnswer(isCorrect, explanation, professorComment) {
  var feedbackDiv = document.getElementById('micro-feedback');
  var step = microSteps[microStepIndex];
  var feedbackText = '';

  if (isCorrect) {
    addXP(5);
    feedbackText = '<div style="color:var(--primary2);margin-bottom:8px;">✅ Верно! ' + (explanation || '') + '</div>';
    if (professorComment && typeof professor !== 'undefined') {
      professor.showMessage(professorComment, 'happy', 2000);
    } else if (typeof professor !== 'undefined') {
      professor.showMessage('Отлично! Идём дальше.', 'happy', 2000);
    }
  } else {
    feedbackText = '<div style="color:var(--danger);margin-bottom:8px;">❌ Неверно. ' + (explanation || 'Попробуй ещё раз.') + '</div>';
    if (step.feedback && step.feedback.length > 0) {
      feedbackText += '<div style="font-size:13px;color:var(--muted);margin-top:8px;">';
      step.feedback.forEach(function(fb, idx) {
        feedbackText += '• ' + fb + '<br>';
      });
      feedbackText += '</div>';
    }
    if (professorComment && typeof professor !== 'undefined') {
      professor.showMessage(professorComment, 'sad', 2500);
    } else if (typeof professor !== 'undefined') {
      professor.showMessage('Не переживай, это сложный момент. Попробуй ещё раз.', 'sad', 2500);
    }
  }

  feedbackDiv.innerHTML = feedbackText;

  setTimeout(function() {
    if (isCorrect) {
      microStepIndex++;
      if (microStepIndex < microSteps.length) {
        renderMicroStep();
      } else {
        startLessonPractice();
      }
    } else {
      renderMicroStep();
    }
  }, isCorrect ? 1200 : 2000);
}

function answerMicroQuestion(chosen) {
  var step = microSteps[microStepIndex];
  var correctIdx = step.correct;
  var isCorrect = (chosen === correctIdx);
  var btns = document.querySelectorAll('#micro-answers .ans-btn');
  btns.forEach(function(b) { b.disabled = true; });
  if (isCorrect) {
    btns[correctIdx].classList.add('correct');
  } else {
    btns[chosen].classList.add('wrong');
    btns[correctIdx].classList.add('correct');
  }
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

function answerTrueFalse(value) {
  var step = microSteps[microStepIndex];
  var isCorrect = (value === step.correct);
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
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

function answerChooseImage(chosen) {
  var step = microSteps[microStepIndex];
  var correctIdx = step.images.findIndex(function(img) { return img.correct === true; });
  var isCorrect = (chosen === correctIdx);
  var images = document.querySelectorAll('.image-option');
  images.forEach(function(img, idx) {
    img.style.pointerEvents = 'none';
    if (idx === correctIdx) img.classList.add('correct-img');
    if (idx === chosen && !isCorrect) img.classList.add('wrong-img');
  });
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

function answerHotspot(chosen) {
  var step = microSteps[microStepIndex];
  var isCorrect = step.hotspots[chosen].correct;
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

function answerImageCompare(side) {
  var step = microSteps[microStepIndex];
  var isCorrect = (side === step.correct);
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

function submitNumberAnswer() {
  var step = microSteps[microStepIndex];
  var input = document.getElementById('number-answer');
  var userAnswer = parseFloat(input.value);
  var correct = step.correctAnswer;
  var tol = step.tolerance || 0;
  var isCorrect = Math.abs(userAnswer - correct) <= tol;
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

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
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

function submitMultiSelectAnswer() {
  var step = microSteps[microStepIndex];
  var selected = [];
  document.querySelectorAll('#multi-options input:checked').forEach(function(cb) {
    selected.push(parseInt(cb.value));
  });
  var isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(step.correctIndices.sort());
  processMicroAnswer(isCorrect, step.explanation, step.professorComment);
}

function shuffle(arr) {
  var a = [...arr];
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}