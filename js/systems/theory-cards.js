// ==========================================
//  КАРТОЧКИ ТЕОРИИ (как в Duolingo)
// ==========================================

var theoryCardSteps = [];
var currentCardStep = 0;

/**
 * Запускает показ карточек теории.
 * @param {object} theoryInfo - { title, key, ... }
 * @param {Array} theoryData - массив объектов { topic, content } из JSON теории
 */
function startTheoryCards(theoryInfo, theoryData) {
  // Сохраняем, что теория прочитана
  if (!userProgress.theoryRead) userProgress.theoryRead = {};
  var lesson = QUESTIONS_FILES[currentLessonIndex];
  if (lesson) {
    userProgress.theoryRead[lesson.title] = true;
    saveProgress();
  }

  goScreen('s-topic');
  document.getElementById('topic-title').textContent = theoryInfo.title;

  // Формируем шаги
  theoryCardSteps = [];

  // Шаг 0: Вступление
  theoryCardSteps.push({
    title: '👋 Добро пожаловать!',
    text: 'Сегодня мы изучим тему «' + theoryInfo.title + '». ' +
          (theoryData[0] ? theoryData[0].content.split('.')[0] + '.' : ''),
    icon: '📖'
  });

  // Шаги из данных теории
  theoryData.forEach(function(item) {
    theoryCardSteps.push({
      title: item.topic || 'Материал',
      text: item.content,
      icon: '📘'
    });
  });

  // Пример из реальной жизни
  theoryCardSteps.push({
    title: '🌍 Пример из жизни',
    text: 'Представь, что ты планируешь поход и используешь карту, чтобы рассчитать расстояние до озера. ' +
          'Знание масштаба и условных знаков поможет тебе не заблудиться!',
    icon: '🗺️'
  });

  // Схема / иллюстрация
  theoryCardSteps.push({
    title: '🖼️ Схема',
    text: 'Здесь могла бы быть наглядная схема или карта. ' +
          'Пока представь её мысленно: основные элементы, связи между ними.',
    icon: '🧩'
  });

  // Блок «Запомни»
  var ruleText = 'Главное правило этой темы: всегда проверяй масштаб и единицы измерения.';
  if (theoryData.length > 0) {
    // Берём последнее предложение из последнего блока как правило (условно)
    var lastContent = theoryData[theoryData.length - 1].content;
    var sentences = lastContent.split('.');
    if (sentences.length > 0) ruleText = '🔑 ' + sentences[sentences.length - 2] + '.';
  }
  theoryCardSteps.push({
    title: '🧠 Запомни',
    text: ruleText,
    icon: '💡'
  });

  // Мини-вопрос
  theoryCardSteps.push({
    title: '❓ Проверь себя',
    text: 'Какой масштаб используется на топографических картах?',
    icon: '🤔'
    // В будущем можно добавить интерактивный ответ
  });

  // Завершающая карточка
  theoryCardSteps.push({
    title: '🚀 Ты готов!',
    text: 'Теперь ты знаешь основы. Давай применим знания на практике!',
    icon: '🎯',
    isLast: true
  });

  currentCardStep = 0;
  renderTheoryCard();
}

/**
 * Отрисовывает текущую карточку в #topic-content
 */
function renderTheoryCard() {
  var container = document.getElementById('topic-content');
  if (!container) return;

  var step = theoryCardSteps[currentCardStep];
  var progress = (currentCardStep + 1) + '/' + theoryCardSteps.length;

  var html = '';

  // Индикатор прогресса (точки)
  html += '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:16px">';
  for (var i = 0; i < theoryCardSteps.length; i++) {
    html += '<div style="width:8px;height:8px;border-radius:50%;background:' +
            (i === currentCardStep ? 'var(--primary)' : 'var(--border)') + '"></div>';
  }
  html += '</div>';

  // Карточка
  html += '<div class="theory-card" style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius);padding:24px 20px;text-align:center">';
  html += '<div style="font-size:40px;margin-bottom:12px">' + (step.icon || '📘') + '</div>';
  html += '<div style="font-family:var(--font-h);font-size:18px;font-weight:700;margin-bottom:12px">' + step.title + '</div>';
  html += '<div style="font-size:15px;line-height:1.6;color:var(--text);margin-bottom:20px">' + step.text + '</div>';

  // Кнопка
  if (step.isLast) {
    html += '<button class="btn-full primary" onclick="startLessonPractice()">🚀 Начать практику</button>';
  } else {
    html += '<button class="btn-full primary" onclick="nextTheoryCard()">Продолжить →</button>';
  }

  html += '</div>';

  // Можно добавить кнопку "Назад", если нужно
  if (currentCardStep > 0) {
    html += '<div style="text-align:center;margin-top:10px"><span style="color:var(--muted);cursor:pointer;font-size:13px" onclick="prevTheoryCard()">← Назад</span></div>';
  }

  container.innerHTML = html;
}

/**
 * Переход к следующей карточке
 */
function nextTheoryCard() {
  if (currentCardStep < theoryCardSteps.length - 1) {
    currentCardStep++;
    renderTheoryCard();
  } else {
    // Последняя карточка уже имеет кнопку запуска практики
  }
}

/**
 * Переход к предыдущей карточке
 */
function prevTheoryCard() {
  if (currentCardStep > 0) {
    currentCardStep--;
    renderTheoryCard();
  }
}